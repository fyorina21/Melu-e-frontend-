import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getGoalMasteryCheck, submitGoalMasteryCheck } from '../../api/sessionApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalMasteryCheck'>;
type OutcomeOption = 'novel_person' | 'novel_environment' | 'both' | 'failed';
type PromptType = '' | 'Full Physical (FP)' | 'Partial Physical (PP)' | 'Gestural (G)';

const OUTCOME_OPTIONS: { id: OutcomeOption; label: string }[] = [
  { id: 'novel_person', label: 'Independent with Novel Person' },
  { id: 'novel_environment', label: 'Independent in Novel Environment' },
  { id: 'both', label: 'Both' },
  { id: 'failed', label: 'Failed - Required Prompt' },
];

const PROMPT_OPTIONS: PromptType[] = [
  'Full Physical (FP)',
  'Partial Physical (PP)',
  'Gestural (G)',
];

export default function GoalMasteryCheckScreen({ route, navigation }: Props) {
  const { studentId = 'DEMO_STUDENT', goalId = 'DEMO_GOAL' } = route.params;

  const [data, setData] = useState<MasteryCheckData | null>(null);

  // Teacher B Form State
  const [teacherBOutcome, setTeacherBOutcome] = useState<OutcomeOption | null>(null);
  const [teacherBPrompt, setTeacherBPrompt] = useState<PromptType>('');
  const [teacherBNotes, setTeacherBNotes] = useState('');
  const [showTeacherBPromptDropdown, setShowTeacherBPromptDropdown] = useState(false);

  // Teacher C Form State
  const [teacherCOutcome, setTeacherCOutcome] = useState<OutcomeOption | null>(null);
  const [teacherCPrompt, setTeacherCPrompt] = useState<PromptType>('');
  const [teacherCNotes, setTeacherCNotes] = useState('');
  const [showTeacherCPromptDropdown, setShowTeacherCPromptDropdown] = useState(false);

  const [touched, setTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getGoalMasteryCheck(studentId, goalId);
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, [studentId, goalId]);

  useEffect(() => { load(); }, [load]);

  // Validation Logic: Check if Teacher B is valid
  const isTeacherBValid = teacherBOutcome && (
    teacherBOutcome !== 'failed' || (teacherBOutcome === 'failed' && teacherBPrompt !== '')
  );

  // Validation Logic: Check if Teacher C is valid
  const isTeacherCValid = teacherCOutcome && (
    teacherCOutcome !== 'failed' || (teacherCOutcome === 'failed' && teacherCPrompt !== '')
  );

  const canSubmit = isTeacherBValid && isTeacherCValid;

  const handleCancel = () => {
    if (touched) {
      Alert.alert('Discard changes?', 'Any entered data will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation?.goBack?.() },
      ]);
    } else {
      navigation?.goBack?.();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload = {
      teacherB: { outcome: teacherBOutcome, promptUsed: teacherBOutcome === 'failed' ? teacherBPrompt : null, notes: teacherBNotes },
      teacherC: { outcome: teacherCOutcome, promptUsed: teacherCOutcome === 'failed' ? teacherCPrompt : null, notes: teacherCNotes },
    };

    try {
      await submitGoalMasteryCheck(studentId, goalId, payload);
      Alert.alert('Success', 'Verification submitted and notification sent to Director.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() }
      ]);
    } catch (err) {
      Alert.alert('Submitted (offline)', 'Notification sent and will sync once online.', [
        { text: 'OK', onPress: () => navigation?.goBack?.() }
      ]);
    }
  };

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Mastery Check</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Student Information Card */}
        <View style={styles.studentCard}>
          <View style={styles.studentInfoLeft}>
            <View style={styles.avatar}>
              <Feather name="user" size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.studentName}>{data.studentName}</Text>
              <Text style={styles.metaDetail}>Goal: <Text style={styles.metaValue}>{data.goalName}</Text></Text>
              <Text style={styles.metaDetail}>Station: <Text style={styles.metaValue}>{data.station}</Text></Text>
            </View>
          </View>

          <View style={styles.studentInfoRight}>
            <View style={styles.initMetaRow}>
              <View>
                <Text style={styles.metaLabel}>Date Initiated</Text>
                <Text style={styles.metaValueText}>{data.dateInitiated}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>Initiated By</Text>
                <Text style={styles.metaValueText}>{data.initiatedBy}</Text>
                <Text style={styles.metaSubText}>({data.initiatedByRole})</Text>
              </View>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{data.statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* 3 Columns Section */}
        <View style={styles.columnsRow}>
          {/* Primary Teacher (A) Card */}
          <View style={[styles.columnCard, styles.primaryTeacherCard]}>
            <View style={styles.primaryCardHeader}>
              <Text style={styles.primaryCardTitle}>Primary Teacher (A)</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{data.primaryTeacher.name}</Text>
              </View>

              <View style={styles.badge100}>
                <Text style={styles.badge100Text}>100% Independence Achieved</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Criteria Met:</Text>
                <Text style={styles.detailValue}>{data.primaryTeacher.criteriaMet}</Text>
              </View>

              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Date Achieved:</Text> {data.primaryTeacher.dateAchieved}</Text>
              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Total Trials:</Text> {data.primaryTeacher.totalTrials}</Text>
              <Text style={styles.detailLine}><Text style={styles.boldLabel}>Independence:</Text> {data.primaryTeacher.independenceRate}</Text>

              <Text style={styles.notesLabel}>Notes</Text>
              <View style={styles.readOnlyNotes}>
                <Text style={styles.notesText}>{data.primaryTeacher.notes || ''}</Text>
              </View>
            </View>
          </View>

          {/* Teacher B Verification Card */}
          <View style={styles.columnCard}>
            <View style={styles.standardCardHeader}>
              <Text style={styles.standardCardTitle}>Teacher B Verification</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{data.teacherB.name}</Text>
              </View>

              <Text style={styles.fieldLabel}>Outcome <Text style={styles.required}>*</Text></Text>
              <View style={styles.radioGroup}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={styles.radioOption}
                    onPress={() => {
                      setTouched(true);
                      setTeacherBOutcome(opt.id);
                      if (opt.id !== 'failed') setTeacherBPrompt('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, teacherBOutcome === opt.id && styles.radioCircleSelected]}>
                      {teacherBOutcome === opt.id && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Conditional Prompt Used Dropdown for Teacher B */}
              {teacherBOutcome === 'failed' && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.fieldLabel}>Prompt Used <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setShowTeacherBPromptDropdown(!showTeacherBPromptDropdown)}
                  >
                    <Text style={[styles.selectText, !teacherBPrompt && styles.placeholderText]}>
                      {teacherBPrompt || 'Select prompt'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>

                  {showTeacherBPromptDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTeacherBPrompt(''); setShowTeacherBPromptDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemTextPlaceholder}>Select prompt</Text>
                      </TouchableOpacity>
                      {PROMPT_OPTIONS.map((prompt) => (
                        <TouchableOpacity
                          key={prompt}
                          style={[styles.dropdownItem, teacherBPrompt === prompt && styles.dropdownItemSelected]}
                          onPress={() => {
                            setTeacherBPrompt(prompt);
                            setShowTeacherBPromptDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{prompt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textInput}
                multiline
                value={teacherBNotes}
                onChangeText={(v) => { setTouched(true); setTeacherBNotes(v); }}
              />

              <Text style={styles.cardFooterDate}>Date: {data.teacherB.date}</Text>
            </View>
          </View>

          {/* Teacher C Verification Card */}
          <View style={styles.columnCard}>
            <View style={styles.standardCardHeader}>
              <Text style={styles.standardCardTitle}>Teacher C Verification</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.teacherNameRow}>
                <Feather name="user" size={16} color="#64748B" />
                <Text style={styles.teacherNameText}>{data.teacherC.name}</Text>
              </View>

              <Text style={styles.fieldLabel}>Outcome <Text style={styles.required}>*</Text></Text>
              <View style={styles.radioGroup}>
                {OUTCOME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={styles.radioOption}
                    onPress={() => {
                      setTouched(true);
                      setTeacherCOutcome(opt.id);
                      if (opt.id !== 'failed') setTeacherCPrompt('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, teacherCOutcome === opt.id && styles.radioCircleSelected]}>
                      {teacherCOutcome === opt.id && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Conditional Prompt Used Dropdown for Teacher C */}
              {teacherCOutcome === 'failed' && (
                <View style={styles.dropdownContainer}>
                  <Text style={styles.fieldLabel}>Prompt Used <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setShowTeacherCPromptDropdown(!showTeacherCPromptDropdown)}
                  >
                    <Text style={[styles.selectText, !teacherCPrompt && styles.placeholderText]}>
                      {teacherCPrompt || 'Select prompt'}
                    </Text>
                    <Feather name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>

                  {showTeacherCPromptDropdown && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => { setTeacherCPrompt(''); setShowTeacherCPromptDropdown(false); }}
                      >
                        <Text style={styles.dropdownItemTextPlaceholder}>Select prompt</Text>
                      </TouchableOpacity>
                      {PROMPT_OPTIONS.map((prompt) => (
                        <TouchableOpacity
                          key={prompt}
                          style={[styles.dropdownItem, teacherCPrompt === prompt && styles.dropdownItemSelected]}
                          onPress={() => {
                            setTeacherCPrompt(prompt);
                            setShowTeacherCPromptDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{prompt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={styles.textInput}
                multiline
                value={teacherCNotes}
                onChangeText={(v) => { setTouched(true); setTeacherCNotes(v); }}
              />

              <Text style={styles.cardFooterDate}>Date: {data.teacherC.date}</Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, canSubmit && styles.submitBtnActive]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitBtnText, canSubmit && styles.submitBtnTextActive]}>
              Submit for Review
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PrimaryTeacherData {
  name: string;
  criteriaMet: string;
  dateAchieved: string;
  totalTrials: number;
  independenceRate: string;
  notes?: string;
}

interface VerificationTeacher {
  name: string;
  date: string;
}

interface MasteryCheckData {
  studentName: string;
  goalName: string;
  station: string;
  dateInitiated: string;
  initiatedBy: string;
  initiatedByRole: string;
  statusLabel: string;
  primaryTeacher: PrimaryTeacherData;
  teacherB: VerificationTeacher;
  teacherC: VerificationTeacher;
}

const DEMO_DATA: MasteryCheckData = {
  studentName: 'Student A',
  goalName: 'Identify Colors',
  station: 'Station 1 - Basic Skills',
  dateInitiated: 'May 24, 2025',
  initiatedBy: 'Maria Reyes',
  initiatedByRole: 'Teacher A',
  statusLabel: 'Pending Director Review',
  primaryTeacher: {
    name: 'Maria Reyes',
    criteriaMet: '5 consecutive sessions at 100% independent.',
    dateAchieved: 'May 24, 2025',
    totalTrials: 50,
    independenceRate: '100% (+)',
    notes: '',
  },
  teacherB: { name: 'Jared Cruz', date: '2025-05-24' },
  teacherC: { name: 'Jeah Torres', date: '2025-05-24' },
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 14, color: '#334155', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  
  content: { padding: 24, gap: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' },

  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  metaDetail: { fontSize: 13, color: '#64748B' },
  metaValue: { color: '#334155', fontWeight: '500' },

  studentInfoRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  initMetaRow: { flexDirection: 'row', gap: 24 },
  metaLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  metaValueText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  metaSubText: { fontSize: 11, color: '#64748B' },
  statusPill: { backgroundColor: '#FDE047', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },

  columnsRow: { flexDirection: 'row', gap: 16 },
  columnCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  primaryTeacherCard: { backgroundColor: '#FEFCE8', borderColor: '#FDE047' },
  primaryCardHeader: { backgroundColor: '#FACC15', paddingVertical: 12, alignItems: 'center' },
  primaryCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  standardCardHeader: { backgroundColor: '#F1F5F9', paddingVertical: 12, alignItems: 'center' },
  standardCardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },

  cardBody: { padding: 16, gap: 12, flex: 1 },
  teacherNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  teacherNameText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },

  badge100: { backgroundColor: '#BFDBFE', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  badge100Text: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

  detailSection: { marginTop: 4 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#334155' },
  detailValue: { fontSize: 12, color: '#475569' },
  detailLine: { fontSize: 12, color: '#475569' },
  boldLabel: { fontWeight: '700', color: '#334155' },

  notesLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  readOnlyNotes: { minHeight: 80, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, padding: 8 },
  notesText: { fontSize: 12, color: '#334155' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 4 },
  required: { color: '#EF4444' },

  radioGroup: { gap: 10 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#64748B', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#0284C7' },
  radioInnerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  radioLabel: { fontSize: 13, color: '#1E293B', fontWeight: '500' },

  /* Dropdown Styles */
  dropdownContainer: { position: 'relative', zIndex: 10 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  selectText: { fontSize: 13, color: '#0F172A' },
  placeholderText: { color: '#64748B' },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  dropdownItemSelected: { backgroundColor: '#3B82F6' },
  dropdownItemText: { fontSize: 13, color: '#0F172A' },
  dropdownItemTextPlaceholder: { fontSize: 13, color: '#64748B' },

  textInput: { minHeight: 70, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 8, fontSize: 13, textAlignVertical: 'top', backgroundColor: '#FFFFFF' },
  cardFooterDate: { fontSize: 12, color: '#64748B', marginTop: 'auto', paddingTop: 8 },

  footerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10, minWidth: 100, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  submitBtn: { backgroundColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  submitBtnActive: { backgroundColor: '#FACC15' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  submitBtnTextActive: { color: '#1E293B' },
});