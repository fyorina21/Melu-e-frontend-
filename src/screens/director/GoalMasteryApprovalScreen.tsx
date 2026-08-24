
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB, PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth, ROLES } from '../../context/AuthContext';
import { getPendingMasteryApprovals, getMasteryApprovalDetail, approveMastery, rejectMastery } from '../../api/directorApi';
import type { DirectorStackParamList, ProgramDirectorStackParamList } from '../../types';

interface MasteryListItem {
  checkId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  teacherA: string;
  teacherB: string;
  teacherC: string;
  dateSubmitted: string;
}

interface RawMasteryCheck {
  id: string;
  studentGoalId: string;
  status: string;
  requestedByName: string | null;
  requestedAt: string;
}

interface TeacherVerification {
  outcome: string;
  promptUsed: string | null;
  notes: string;
}

interface MasteryDetail {
  checkId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  teacherA: { summary: string };
  teacherB: TeacherVerification;
  teacherC: TeacherVerification;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ApprovalDetailModal({ visible, detail, onClose, onApprove, onReject }: {
  visible: boolean;
  detail: MasteryDetail | null;
  onClose: () => void;
  onApprove: (goalId: string, notes: string) => void;
  onReject: (goalId: string, reason: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  if (!detail) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{detail.studentName} — {detail.goalName}</Text>          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={typography.h3}>Teacher A — Mastery Data</Text>
            <Text style={typography.body}>{detail.teacherA.summary}</Text>
            <Text style={[typography.h3, { marginTop: spacing.md }]}>Teacher B — Verification</Text>
            <Text style={typography.body}>Outcome: {detail.teacherB.outcome} {detail.teacherB.promptUsed ? `(prompt: ${detail.teacherB.promptUsed})` : ''}</Text>
            <Text style={typography.body}>{detail.teacherB.notes}</Text>
            <Text style={[typography.h3, { marginTop: spacing.md }]}>Teacher C — Verification</Text>
            <Text style={typography.body}>Outcome: {detail.teacherC.outcome} {detail.teacherC.promptUsed ? `(prompt: ${detail.teacherC.promptUsed})` : ''}</Text>
            <Text style={typography.body}>{detail.teacherC.notes}</Text>
          </ScrollView>
          <View style={styles.field}>
            <Text style={typography.label}>Director Notes (optional)</Text>
            <TextInput style={styles.textArea} multiline value={notes} onChangeText={setNotes} placeholderTextColor={colors.mutedText} placeholder="Notes..." />
          </View>
          <View style={styles.field}>
            <Text style={typography.label}>Rejection Feedback (required if rejecting)</Text>
            <TextInput style={styles.textInput} value={rejectReason} onChangeText={setRejectReason} placeholderTextColor={colors.mutedText} placeholder="Feedback for Teacher A..." />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                if (!rejectReason.trim()) { Alert.alert('Feedback required'); return; }
                onReject(detail.checkId, rejectReason, notes);
              }}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(detail.checkId, notes)}>
              <Text style={styles.approveBtnText}>Approve Mastery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GoalMasteryApprovalScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList | ProgramDirectorStackParamList, 'GoalMasteryApproval'>) {
  const { session } = useAuth();
  const isProgramDirector = session?.role === ROLES.PROGRAM_DIRECTOR;
  const [list, setList] = useState<MasteryListItem[]>([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<MasteryDetail | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getPendingMasteryApprovals({ search });
      const rows = (Array.isArray(data) ? data : []) as RawMasteryCheck[];
      setList(
        rows
          .filter((m) => m.status === 'pending')
          .map((m) => ({
            checkId: m.id,
            goalId: m.studentGoalId,
            studentName: m.requestedByName ? `Submitted by ${m.requestedByName}` : 'Unknown Student',
            goalName: m.studentGoalId,
            teacherA: m.requestedByName ?? '—',
            teacherB: '—',
            teacherC: '—',
            dateSubmitted: formatDate(m.requestedAt),
          }))
      );
    } catch (err) {
      setList([]);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleViewDetail = async (checkId: string) => {
    try {
      const { data } = await getMasteryApprovalDetail(checkId);
      const row = (data ?? {}) as Partial<RawMasteryCheck>;
      setDetail({
        checkId,
        goalId: row.studentGoalId ?? checkId,
        studentName: row.requestedByName ? `Submitted by ${row.requestedByName}` : 'Unknown Student',
        goalName: row.studentGoalId ?? checkId,
        teacherA: { summary: `Status: ${row.status ?? 'pending'} · Submitted ${formatDate(row.requestedAt)}` },
        teacherB: { outcome: row.status ?? 'pending', promptUsed: null, notes: '' },
        teacherC: { outcome: row.status ?? 'pending', promptUsed: null, notes: '' },
      });
    } catch (err) {
      setDetail(null);
      Alert.alert('Error', 'Could not load the approval details. Please try again.');
    }
  };

  const handleApprove = async (checkId: string, notes: string) => {
    Alert.alert('Approve this goal as Mastered?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveMastery(checkId, { notes });
            setDetail(null);
            await load();
          } catch (err) {}
        },
      },
    ]);
  };

  const handleReject = async (checkId: string, reason: string, notes: string) => {
    try {
      await rejectMastery(checkId, { reason, notes });
      setDetail(null);
      await load();
    } catch (err) {}
    Alert.alert('Rejected', 'Sent back to Teacher A with feedback.');
  };

  const handleExport = () => {
    setExportContent(
      [
        `Melu'e Foundation — Mastery Approval Record`,
        `Generated ${new Date().toLocaleString()}`,
        '',
        ...list.map((g) => `• ${g.studentName} — ${g.goalName} | A: ${g.teacherA} · B: ${g.teacherB} · C: ${g.teacherC} | Submitted ${g.dateSubmitted}`),
        list.length === 0 ? '(no pending approvals)' : '',
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isProgramDirector ? (
        <AppNavbar activeTab="Approvals" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />
      ) : (
        <AppNavbar activeTab="Approvals" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as never)} />
      )}
      <View style={styles.header}>
        <Text style={typography.h1}>Goal Mastery Approval</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Feather name="share-2" size={14} color={colors.navyText} />
          <Text style={styles.exportBtnText}>Export Record</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search students..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {list.map((g) => (
          <View key={g.checkId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{g.studentName} — {g.goalName}</Text>
              <Text style={typography.caption}>Teacher A: {g.teacherA} · B: {g.teacherB} · C: {g.teacherC} · Submitted {g.dateSubmitted}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetail(g.checkId)}>
              <Text style={styles.actionBtnText}>Review</Text>
            </TouchableOpacity>
          </View>
        ))}
        {list.length === 0 && <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center' }]}>Nothing pending approval.</Text>}
      </ScrollView>

      <ApprovalDetailModal visible={!!detail} detail={detail} onClose={() => setDetail(null)} onApprove={handleApprove} onReject={handleReject} />

      <ExportPreviewModal
        visible={!!exportContent}
        title="Mastery Approval Record"
        filename={`MasteryApprovalRecord_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  exportBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  searchRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  actionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  rejectBtnText: { fontWeight: '600', color: '#EF4444' },
  approveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  approveBtnText: { fontWeight: '700', color: colors.navyText },
});
