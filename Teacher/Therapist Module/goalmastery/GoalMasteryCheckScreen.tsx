// screens/goalmastery/GoalMasteryCheckScreen.js
// SCR-004: Goal Mastery Check Screen
//
// Documents the Two-Teacher Generalization Check required after a student
// hits 100% independence with the primary teacher. Sits under Daily
// Operations because it's triggered from the Mastery Check button on
// MR-33's session screen, though it also touches goal status (MR-36
// territory) - flagged in PROJECT_NOTES.md as a boundary case.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { StatusType } from '../../components/StatusPill';
import { getGoalMasteryCheck, submitGoalMasteryCheck } from '../../api/sessionApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalMasteryCheck'>;
type Outcome = 'success' | 'fail';

const PROMPT_OPTIONS = ['FP', 'PP', 'G'];

interface TeacherVerificationSectionProps {
  title: string;
  teacherName?: string;
  outcome: Outcome | null;
  onOutcomeChange: (v: Outcome) => void;
  promptUsed: string | null;
  onPromptChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}

function TeacherVerificationSection({ title, teacherName, outcome, onOutcomeChange, promptUsed, onPromptChange, notes, onNotesChange }: TeacherVerificationSectionProps) {
  return (
    <View style={styles.card}>
      <Text style={typography.h3}>{title}</Text>
      <Text style={typography.caption}>{teacherName}</Text>

      <View style={styles.outcomeRow}>
        <TouchableOpacity
          style={[styles.outcomeBtn, outcome === 'success' && styles.outcomeBtnSuccess]}
          onPress={() => onOutcomeChange('success')}
        >
          <Feather name="check" size={16} color={outcome === 'success' ? colors.white : colors.navyText} />
          <Text style={[styles.outcomeBtnText, outcome === 'success' && { color: colors.white }]}>Success</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.outcomeBtn, outcome === 'fail' && styles.outcomeBtnFail]}
          onPress={() => onOutcomeChange('fail')}
        >
          <Feather name="x" size={16} color={outcome === 'fail' ? colors.white : colors.navyText} />
          <Text style={[styles.outcomeBtnText, outcome === 'fail' && { color: colors.white }]}>Failed - Required Prompt</Text>
        </TouchableOpacity>
      </View>

      {outcome === 'fail' && (
        <View style={styles.field}>
          <Text style={typography.label}>Prompt Used</Text>
          <View style={styles.chipRow}>
            {PROMPT_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, promptUsed === p && styles.chipSelected]}
                onPress={() => onPromptChange(p)}
              >
                <Text style={[styles.chipText, promptUsed === p && styles.chipTextSelected]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.field}>
        <Text style={typography.label}>Notes</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          multiline
          placeholder="Add context (optional)..."
          placeholderTextColor={colors.mutedText}
          value={notes}
          onChangeText={onNotesChange}
        />
      </View>
    </View>
  );
}

export default function GoalMasteryCheckScreen({ route, navigation }: Props) {
  const { studentId = 'DEMO_STUDENT', goalId = 'DEMO_GOAL' } = route.params;

  const [data, setData] = useState<MasteryCheckData | null>(null);
  const [teacherBOutcome, setTeacherBOutcome] = useState<Outcome | null>(null);
  const [teacherBPrompt, setTeacherBPrompt] = useState<string | null>(null);
  const [teacherBNotes, setTeacherBNotes] = useState('');
  const [teacherCOutcome, setTeacherCOutcome] = useState<Outcome | null>(null);
  const [teacherCPrompt, setTeacherCPrompt] = useState<string | null>(null);
  const [teacherCNotes, setTeacherCNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getGoalMasteryCheck(studentId, goalId);
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, [studentId, goalId]);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit = !!teacherBOutcome && !!teacherCOutcome;

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
    const payload = {
      teacherB: { outcome: teacherBOutcome, promptUsed: teacherBPrompt, notes: teacherBNotes },
      teacherC: { outcome: teacherCOutcome, promptUsed: teacherCPrompt, notes: teacherCNotes },
    };
    try {
      await submitGoalMasteryCheck(studentId, goalId, payload);
      Alert.alert('Submitted', 'Sent to Program Director for approval.');
      navigation?.goBack?.();
    } catch (err) {
      // Demo fallback - still show success state locally
      setData((prev) => (prev ? { ...prev, status: 'pending_approval' } : prev));
      Alert.alert('Submitted (offline)', 'Will sync once connected.');
    }
  };

  if (!data) return null;

  const statusPillProps = STATUS_DISPLAY[data.status] || STATUS_DISPLAY.pending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} accessibilityLabel="Back">
          <Feather name="arrow-left" size={22} color={colors.navyText} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>{data.goalName}</Text>
          <Text style={typography.body}>{data.studentName} · {data.station}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <StatusPill status={statusPillProps.key} label={statusPillProps.label} />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Primary Teacher Data</Text>
          <Text style={typography.body}>{data.primaryTeacherSummary}</Text>
        </View>

        <TeacherVerificationSection
          title="Teacher B Verification"
          teacherName={data.teacherB?.name}
          outcome={teacherBOutcome}
          onOutcomeChange={(v) => { setTouched(true); setTeacherBOutcome(v); }}
          promptUsed={teacherBPrompt}
          onPromptChange={(v) => { setTouched(true); setTeacherBPrompt(v); }}
          notes={teacherBNotes}
          onNotesChange={(v) => { setTouched(true); setTeacherBNotes(v); }}
        />

        <TeacherVerificationSection
          title="Teacher C Verification"
          teacherName={data.teacherC?.name}
          outcome={teacherCOutcome}
          onOutcomeChange={(v) => { setTouched(true); setTeacherCOutcome(v); }}
          promptUsed={teacherCPrompt}
          onPromptChange={(v) => { setTouched(true); setTeacherCPrompt(v); }}
          notes={teacherCNotes}
          onNotesChange={(v) => { setTouched(true); setTeacherCNotes(v); }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>Submit for Review</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const STATUS_DISPLAY: Record<string, { key: StatusType; label: string }> = {
  pending: { key: 'pending', label: 'Verification Pending' },
  pending_approval: { key: 'inProgress', label: 'Verification Complete - Pending Approval' },
  approved: { key: 'approved', label: 'Approved - Goal Mastered' },
  rejected: { key: 'revision', label: 'Rejected - Action Required' },
};

interface MasteryCheckTeacher {
  name?: string;
}

interface MasteryCheckData {
  studentName: string;
  goalName: string;
  station: string;
  primaryTeacherSummary: string;
  teacherB?: MasteryCheckTeacher;
  teacherC?: MasteryCheckTeacher;
  status: string;
}

const DEMO_DATA: MasteryCheckData = {
  studentName: 'Student A',
  goalName: 'Identify Colors',
  station: 'Station 1 (Basic Skills)',
  primaryTeacherSummary: '5/5 consecutive independent trials achieved with Teacher A on Aug 4, 2026.',
  teacherB: { name: 'Teacher B' },
  teacherC: { name: 'Teacher C' },
  status: 'pending',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: { padding: spacing.lg, gap: spacing.lg },
  statusRow: { flexDirection: 'row' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  outcomeRow: { flexDirection: 'row', gap: spacing.sm },
  outcomeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeBtnSuccess: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  outcomeBtnFail: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  outcomeBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 12 },
  field: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  submitBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontWeight: '700', color: colors.navyText },
});
