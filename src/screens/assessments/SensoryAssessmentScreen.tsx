import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { saveSensoryAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

export type EngagementLevel = 'Independent' | 'Partial Physical Prompt' | 'Full Physical Prompt' | 'Not Applicable';
export type ResponseReaction = 'Enjoyed' | 'Neutral' | 'Refused' | 'Not Observed';

export interface SensoryActivityItem {
  id: string;
  name: string;
  engagementLevel?: EngagementLevel;
  responseReaction?: ResponseReaction;
  remark: string;
}

const INITIAL_ACTIVITIES: SensoryActivityItem[] = [
  { id: 'SEN-001', name: 'Sand Play', remark: '' },
  { id: 'SEN-002', name: 'Water Play', remark: '' },
  { id: 'SEN-003', name: 'Finger Painting', remark: '' },
  { id: 'SEN-004', name: 'Play-Doh / Clay', remark: '' },
  { id: 'SEN-005', name: 'Bubble Play', remark: '' },
  { id: 'SEN-006', name: 'Sensory Bin (Rice/Beans)', remark: '' },
  { id: 'SEN-007', name: 'Textured Mat Walking', remark: '' },
  { id: 'SEN-008', name: 'Vibrating Toys', remark: '' },
  { id: 'SEN-009', name: 'Light Box Exploration', remark: '' },
  { id: 'SEN-010', name: 'Music & Movement', remark: '' },
  { id: 'SEN-011', name: 'Deep Pressure Activities', remark: '' },
  { id: 'SEN-012', name: 'Spinning / Vestibular', remark: '' },
];

const ENGAGEMENT_OPTIONS: EngagementLevel[] = [
  'Independent',
  'Partial Physical Prompt',
  'Full Physical Prompt',
  'Not Applicable',
];

const REACTION_OPTIONS: ResponseReaction[] = [
  'Enjoyed',
  'Neutral',
  'Refused',
  'Not Observed',
];

type Props = NativeStackScreenProps<SessionStackParamList, 'SensoryAssessment'>;

export default function SensoryAssessmentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;

  const [assessmentDate, setAssessmentDate] = useState('08/21/2026');
  const [activities, setActivities] = useState<SensoryActivityItem[]>(INITIAL_ACTIVITIES);

  // Custom Activity Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');

  // Custom Dropdown Picker state
  const [activePicker, setActivePicker] = useState<{
    id: string;
    field: 'engagement' | 'reaction';
  } | null>(null);

  // Metrics
  const totalActivities = activities.length;
  const scoredCount = activities.filter((a) => a.engagementLevel || a.responseReaction).length;
  const progressPercent = totalActivities === 0 ? 0 : Math.round((scoredCount / totalActivities) * 100);

  const countEngagement = (level: EngagementLevel) =>
    activities.filter((a) => a.engagementLevel === level).length;

  const countReaction = (reaction: ResponseReaction) =>
    activities.filter((a) => a.responseReaction === reaction).length;

  const updateActivity = (id: string, updates: Partial<SensoryActivityItem>) => {
    setActivities((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleAddCustomActivity = () => {
    if (!newActivityName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }
    const nextIdNumber = activities.length + 1;
    const newId = `SEN-${String(nextIdNumber).padStart(3, '0')}`;

    setActivities((prev) => [
      ...prev,
      { id: newId, name: newActivityName.trim(), remark: '' },
    ]);
    setNewActivityName('');
    setIsModalVisible(false);
  };

  const handleSave = async (status: 'draft' | 'submitted') => {
    try {
      await saveSensoryAssessment(studentId, { assessmentDate, activities, status });
      Alert.alert(
        status === 'submitted' ? 'Submitted' : 'Saved',
        `Sensory assessment updated (${progressPercent}% complete).`
      );
    } catch {
      Alert.alert('Error', 'Failed to save sensory assessment.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled>
        {/* Top Header Card */}
        <View style={styles.topCard}>
          <View style={styles.studentInfoRow}>
            <View style={styles.avatarCircle}>
              <Feather name="user" size={28} color="#64748B" />
            </View>
            <View>
              <Text style={styles.studentName}>Student A</Text>
              <Text style={styles.studentAge}>Age 6</Text>
            </View>
          </View>
          <View style={styles.topCardRight}>
            <Text style={styles.codeText}>SCR-012A</Text>
            <Text style={styles.titleText}>Sensory Time Engagement</Text>
          </View>
        </View>

        {/* Date and Progress Bar Card */}
        <View style={styles.dateProgressCard}>
          <View style={styles.dateRow}>
            <Text style={styles.fieldLabel}>Assessment Date</Text>
            <TextInput
              style={styles.dateInput}
              value={assessmentDate}
              onChangeText={setAssessmentDate}
              placeholder="MM/DD/YYYY"
            />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLabel}>
                {scoredCount} / {totalActivities} activities scored
              </Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Activities Table */}
        <View style={[styles.tableCard, { zIndex: activePicker ? 100 : 1 }]}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.colId]}>ID</Text>
            <Text style={[styles.thText, styles.colActivity]}>Activity</Text>
            <Text style={[styles.thText, styles.colDropdown]}>Engagement Level</Text>
            <Text style={[styles.thText, styles.colDropdown]}>Response / Reaction</Text>
            <Text style={[styles.thText, styles.colRemark]}>Remark</Text>
          </View>

          {/* Table Rows */}
          {activities.map((item, index) => {
            const isEngagementOpen =
              activePicker?.id === item.id && activePicker.field === 'engagement';
            const isReactionOpen =
              activePicker?.id === item.id && activePicker.field === 'reaction';
            const isAnyOpen = isEngagementOpen || isReactionOpen;

            return (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 && styles.tableRowAlt,
                  { zIndex: isAnyOpen ? 500 : activities.length - index },
                ]}
              >
                <Text style={[styles.tdText, styles.colId, styles.idHighlight]}>{item.id}</Text>
                <Text style={[styles.tdText, styles.colActivity, styles.activityName]}>
                  {item.name}
                </Text>

                {/* Engagement Level Dropdown */}
                <View style={[styles.colDropdown, { zIndex: isEngagementOpen ? 1000 : 1 }]}>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, isEngagementOpen && styles.dropdownTriggerActive]}
                    onPress={() =>
                      setActivePicker(isEngagementOpen ? null : { id: item.id, field: 'engagement' })
                    }
                  >
                    <Text style={styles.dropdownTriggerText}>
                      {item.engagementLevel || '-- Select --'}
                    </Text>
                    <Feather name="chevron-down" size={14} color="#0F172A" />
                  </TouchableOpacity>

                  {isEngagementOpen && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownOptionSelected}
                        onPress={() => {
                          updateActivity(item.id, { engagementLevel: undefined });
                          setActivePicker(null);
                        }}
                      >
                        <Text style={styles.dropdownOptionTextSelected}>-- Select --</Text>
                      </TouchableOpacity>
                      {ENGAGEMENT_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownOption}
                          onPress={() => {
                            updateActivity(item.id, { engagementLevel: opt });
                            setActivePicker(null);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Response / Reaction Dropdown */}
                <View style={[styles.colDropdown, { zIndex: isReactionOpen ? 1000 : 1 }]}>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, isReactionOpen && styles.dropdownTriggerActive]}
                    onPress={() =>
                      setActivePicker(isReactionOpen ? null : { id: item.id, field: 'reaction' })
                    }
                  >
                    <Text style={styles.dropdownTriggerText}>
                      {item.responseReaction || '-- Select --'}
                    </Text>
                    <Feather name="chevron-down" size={14} color="#0F172A" />
                  </TouchableOpacity>

                  {isReactionOpen && (
                    <View style={styles.dropdownMenu}>
                      <TouchableOpacity
                        style={styles.dropdownOptionSelected}
                        onPress={() => {
                          updateActivity(item.id, { responseReaction: undefined });
                          setActivePicker(null);
                        }}
                      >
                        <Text style={styles.dropdownOptionTextSelected}>-- Select --</Text>
                      </TouchableOpacity>
                      {REACTION_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={styles.dropdownOption}
                          onPress={() => {
                            updateActivity(item.id, { responseReaction: opt });
                            setActivePicker(null);
                          }}
                        >
                          <Text style={styles.dropdownOptionText}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Remark TextInput */}
                <View style={styles.colRemark}>
                  <TextInput
                    style={styles.remarkInput}
                    placeholder="Optional note..."
                    placeholderTextColor="#94A3B8"
                    value={item.remark}
                    onChangeText={(txt) => updateActivity(item.id, { remark: txt })}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Custom Activity Button */}
        <TouchableOpacity style={styles.addCustomBtn} onPress={() => setIsModalVisible(true)}>
          <Feather name="plus" size={16} color="#64748B" />
          <Text style={styles.addCustomText}>Add Custom Activity</Text>
        </TouchableOpacity>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>

          <Text style={styles.summarySubtitle}>BY ENGAGEMENT LEVEL</Text>
          <View style={styles.badgeRow}>
            <View style={styles.blueBadge}>
              <Text style={styles.badgeValBlue}>{countEngagement('Independent')}</Text>
              <Text style={styles.badgeLabelBlue}>Independent</Text>
            </View>
            <View style={styles.blueBadge}>
              <Text style={styles.badgeValBlue}>{countEngagement('Partial Physical Prompt')}</Text>
              <Text style={styles.badgeLabelBlue}>Partial Physical Prompt</Text>
            </View>
            <View style={styles.blueBadge}>
              <Text style={styles.badgeValBlue}>{countEngagement('Full Physical Prompt')}</Text>
              <Text style={styles.badgeLabelBlue}>Full Physical Prompt</Text>
            </View>
            <View style={styles.blueBadge}>
              <Text style={styles.badgeValBlue}>{countEngagement('Not Applicable')}</Text>
              <Text style={styles.badgeLabelBlue}>Not Applicable</Text>
            </View>
          </View>

          <Text style={[styles.summarySubtitle, { marginTop: 16 }]}>BY RESPONSE / REACTION</Text>
          <View style={styles.badgeRow}>
            <View style={styles.yellowBadge}>
              <Text style={styles.badgeValYellow}>{countReaction('Enjoyed')}</Text>
              <Text style={styles.badgeLabelYellow}>Enjoyed</Text>
            </View>
            <View style={styles.yellowBadge}>
              <Text style={styles.badgeValYellow}>{countReaction('Neutral')}</Text>
              <Text style={styles.badgeLabelYellow}>Neutral</Text>
            </View>
            <View style={styles.yellowBadge}>
              <Text style={styles.badgeValYellow}>{countReaction('Refused')}</Text>
              <Text style={styles.badgeLabelYellow}>Refused</Text>
            </View>
            <View style={styles.yellowBadge}>
              <Text style={styles.badgeValYellow}>{countReaction('Not Observed')}</Text>
              <Text style={styles.badgeLabelYellow}>Not Observed</Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.printBtn}>
            <Feather name="printer" size={16} color="#334155" />
            <Text style={styles.printBtnText}>Print / Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftBtn} onPress={() => handleSave('draft')}>
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={() => handleSave('submitted')}>
            <Text style={styles.submitBtnText}>Submit Assessment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Custom Activity Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Custom Activity</Text>

            <View style={styles.modalField}>
              <Text style={styles.fieldLabel}>Activity Name</Text>
              <TextInput
                style={styles.modalInputActive}
                placeholder="Enter activity name..."
                placeholderTextColor="#94A3B8"
                value={newActivityName}
                onChangeText={setNewActivityName}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addModalBtn}
                onPress={handleAddCustomActivity}
              >
                <Text style={styles.addModalText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 24, gap: 16 },

  // Top Card
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  studentAge: { fontSize: 13, color: '#64748B', marginTop: 2 },
  topCardRight: { alignItems: 'flex-end' },
  codeText: { fontSize: 12, color: '#94A3B8' },
  titleText: { fontSize: 15, fontWeight: '700', color: '#0284C7', marginTop: 4 },

  // Date and Progress Card
  dateProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 16,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  dateInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    width: 120,
    textAlign: 'center',
  },
  progressContainer: { flex: 1, minWidth: 240, gap: 6 },
  progressTextRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTextLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  progressPercentText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#CBD5E1', borderRadius: 4 },

  // Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  thText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  tableRowAlt: { backgroundColor: '#F8FAFC' },
  tdText: { fontSize: 13, color: '#0F172A' },
  colId: { width: 80 },
  idHighlight: { color: '#0284C7', fontWeight: '600' },
  colActivity: { width: 180 },
  activityName: { fontWeight: '600', color: '#0F172A' },
  colDropdown: { width: 200, paddingRight: 12, position: 'relative' },
  colRemark: { flex: 1, minWidth: 160 },

  // Dropdown Overlays
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  dropdownTriggerText: { fontSize: 13, color: '#334155' },
  dropdownMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 9999,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownOptionSelected: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#93C5FD',
  },
  dropdownOptionText: { fontSize: 13, color: '#0F172A' },
  dropdownOptionTextSelected: { fontSize: 13, color: '#0F172A' },

  remarkInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  // Add Custom Activity Button
  addCustomBtn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  addCustomText: { fontSize: 14, fontWeight: '600', color: '#334155' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  summarySubtitle: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  blueBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 110,
  },
  badgeValBlue: { fontSize: 20, fontWeight: '700', color: '#0284C7' },
  badgeLabelBlue: { fontSize: 11, color: '#0369A1', marginTop: 2, textAlign: 'center' },

  yellowBadge: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  badgeValYellow: { fontSize: 20, fontWeight: '700', color: '#D97706' },
  badgeLabelYellow: { fontSize: 11, color: '#B45309', marginTop: 2, textAlign: 'center' },

  // Footer Actions
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  printBtnText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  draftBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  draftBtnText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  submitBtn: {
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalField: { gap: 6 },
  modalInputActive: {
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelModalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelModalText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  addModalBtn: {
    flex: 1,
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addModalText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});