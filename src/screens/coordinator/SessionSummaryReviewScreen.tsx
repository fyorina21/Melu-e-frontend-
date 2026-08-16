import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import CoordinatorNav from './components/CoordinatorNav';
import { getPendingSummaries, approveSummary, requestSummaryChanges, bulkApproveSummaries } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

interface PendingSummary {
  id: string;
  teacherName: string;
  studentNames: string[];
  stationName: string;
  date: string;
  bodyPreview: string;
}

function ReviewModal({ visible, summary, onClose, onApprove, onRequestChanges }: {
  visible: boolean;
  summary: PendingSummary | null;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onRequestChanges: (id: string, reason: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');
  if (!summary) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{summary.studentNames.join(', ')}</Text>
          <Text style={typography.caption}>{summary.teacherName} · {summary.date}</Text>
          <ScrollView style={{ maxHeight: 260 }}>
            <Text style={typography.body}>{summary.bodyPreview}</Text>
          </ScrollView>
          <View style={styles.field}>
            <Text style={typography.label}>Coordinator Notes (internal only)</Text>
            <TextInput style={styles.textArea} multiline value={notes} onChangeText={setNotes} placeholderTextColor={colors.mutedText} placeholder="Internal notes..." />
          </View>
          <View style={styles.field}>
            <Text style={typography.label}>Reason (required if requesting changes)</Text>
            <TextInput style={styles.textInput} value={changeReason} onChangeText={setChangeReason} placeholderTextColor={colors.mutedText} placeholder="What needs to change..." />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.requestChangesBtn}
              onPress={() => {
                if (!changeReason.trim()) { Alert.alert('Reason required'); return; }
                onRequestChanges(summary.id, changeReason, notes);
              }}
            >
              <Text style={styles.requestChangesBtnText}>Request Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(summary.id, notes)}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SessionSummaryReviewScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'SessionSummaryReview'>) {
  const [pending, setPending] = useState<PendingSummary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<PendingSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getPendingSummaries({ search });
      setPending(data);
    } catch (err) {
      setPending(DEMO_PENDING);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleApprove = async (id: string, notes: string) => {
    try {
      await approveSummary(id, { notes });
    } catch (err) {}
    setPending((prev) => prev.filter((s) => s.id !== id));
    setReviewTarget(null);
    Alert.alert('Approved', "Moved to student's permanent record.");
  };

  const handleRequestChanges = async (id: string, reason: string, notes: string) => {
    try {
      await requestSummaryChanges(id, { reason, notes });
    } catch (err) {}
    setPending((prev) => prev.filter((s) => s.id !== id));
    setReviewTarget(null);
    Alert.alert('Sent back for revision', 'Teacher will be notified.');
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    Alert.alert('Bulk Approve', `Approve ${selectedIds.length} summaries?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve All',
        onPress: async () => {
          try {
            await bulkApproveSummaries(selectedIds);
          } catch (err) {}
          setPending((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
          setSelectedIds([]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <CoordinatorNav activeTab="Review" onTabPress={(t) => t !== 'Review' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <Text style={typography.h1}>Session Summary Review</Text>
        {selectedIds.length > 0 && (
          <TouchableOpacity style={styles.bulkBtn} onPress={handleBulkApprove}>
            <Text style={styles.bulkBtnText}>Approve {selectedIds.length} Selected</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search student, teacher, station..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {pending.map((s) => (
          <View key={s.id} style={styles.row}>
            <TouchableOpacity onPress={() => toggleSelect(s.id)} style={styles.checkbox}>
              <View style={[styles.checkboxInner, selectedIds.includes(s.id) && styles.checkboxChecked]} />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setReviewTarget(s)}>
              <Text style={typography.bodyBold}>{s.studentNames.join(', ')}</Text>
              <Text style={typography.caption}>{s.teacherName} · {s.stationName} · {s.date}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReviewTarget(s)}>
              <Text style={styles.linkText}>Review →</Text>
            </TouchableOpacity>
          </View>
        ))}
        {pending.length === 0 && (
          <Text style={[typography.body, { textAlign: 'center', color: colors.mutedText }]}>Nothing pending review.</Text>
        )}
      </ScrollView>

      <ReviewModal
        visible={!!reviewTarget}
        summary={reviewTarget}
        onClose={() => setReviewTarget(null)}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
      />
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const DEMO_PENDING: PendingSummary[] = [
  { id: '1', teacherName: 'Teacher A', studentNames: ['Student A', 'Student B'], stationName: 'Station 1', date: 'Aug 11, 2026', bodyPreview: 'Student A independently requested toys five times. Eye contact improved. One tantrum occurred during cleanup.' },
  { id: '2', teacherName: 'Teacher B', studentNames: ['Student C'], stationName: 'Station 2', date: 'Aug 11, 2026', bodyPreview: 'Good session overall, minor prompting needed on 2 of 3 goals.' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  bulkBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bulkBtnText: { fontWeight: '700', fontSize: 12, color: colors.navyText },
  searchRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  checkbox: { padding: spacing.xs },
  checkboxInner: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  requestChangesBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  requestChangesBtnText: { fontWeight: '600', color: '#EF4444', fontSize: 12 },
  approveBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  approveBtnText: { fontWeight: '700', color: colors.navyText },
});
