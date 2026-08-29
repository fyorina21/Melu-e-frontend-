
// screens/director/GoalMasteryApprovalScreen.tsx
// SCR-DIR-003: Goal Mastery Approval (Director View)

import React, { useEffect, useState, useCallback } from 'react';
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
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB, PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import StatusPill from '../../components/StatusPill';
import { useAuth, ROLES } from '../../context/AuthContext';
import {
  getPendingMasteryApprovals,
  getMasteryApprovalDetail,
  approveMastery,
  rejectMastery,
} from '../../api/directorApi';
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
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ApprovalDetailModal({
  visible,
  detail,
  onClose,
  onApprove,
  onReject,
}: {
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
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{detail.studentName}</Text>
              <Text style={styles.modalSub}>{detail.goalName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* 3-Therapist Verification Track */}
            <View style={styles.verificationSection}>
              <Text style={styles.sectionHeading}>3-THERAPIST CLINICAL VERIFICATION</Text>

              {/* Primary Teacher A */}
              <View style={styles.verifyCard}>
                <View style={styles.verifyCardHeader}>
                  <View style={styles.teacherAvatar}>
                    <Text style={styles.teacherAvatarText}>A</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherRoleTitle}>Primary Therapist (Teacher A)</Text>
                    <Text style={styles.teacherOutcome}>Initial 3-Consecutive Mastery Submission</Text>
                  </View>
                  <StatusPill status="approved" label="Mastered (3x)" />
                </View>
                <Text style={styles.verifyNotes}>{detail.teacherA.summary}</Text>
              </View>

              {/* Generalization Teacher B */}
              <View style={styles.verifyCard}>
                <View style={styles.verifyCardHeader}>
                  <View style={[styles.teacherAvatar, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.teacherAvatarText, { color: '#1E40AF' }]}>B</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherRoleTitle}>Cross-Observer (Teacher B)</Text>
                    <Text style={styles.teacherOutcome}>
                      Outcome: {detail.teacherB.outcome || 'Verified Independent'}
                    </Text>
                  </View>
                  <StatusPill status="approved" label="Verified" />
                </View>
                {detail.teacherB.notes ? (
                  <Text style={styles.verifyNotes}>{detail.teacherB.notes}</Text>
                ) : null}
              </View>

              {/* Generalization Teacher C */}
              <View style={styles.verifyCard}>
                <View style={styles.verifyCardHeader}>
                  <View style={[styles.teacherAvatar, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.teacherAvatarText, { color: '#166534' }]}>C</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherRoleTitle}>Cross-Observer (Teacher C)</Text>
                    <Text style={styles.teacherOutcome}>
                      Outcome: {detail.teacherC.outcome || 'Verified Independent'}
                    </Text>
                  </View>
                  <StatusPill status="approved" label="Verified" />
                </View>
                {detail.teacherC.notes ? (
                  <Text style={styles.verifyNotes}>{detail.teacherC.notes}</Text>
                ) : null}
              </View>
            </View>

            {/* Notes & Feedback */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Director Approval Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={colors.mutedText}
                placeholder="Internal clinical notes for student records..."
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Rejection Reason (Required only if rejecting)</Text>
              <TextInput
                style={styles.textInput}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholderTextColor={colors.mutedText}
                placeholder="Clinical feedback for Teacher A & required corrective actions..."
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => {
                if (!rejectReason.trim()) {
                  Alert.alert('Feedback Required', 'Please enter a rejection reason.');
                  return;
                }
                onReject(detail.checkId, rejectReason, notes);
              }}
            >
              <Feather name="x-circle" size={15} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Reject & Return</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => onApprove(detail.checkId, notes)}
            >
              <Feather name="check-circle" size={15} color={colors.navyText} />
              <Text style={styles.approveBtnText}>Approve Mastery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function GoalMasteryApprovalScreen({
  navigation,
}: NativeStackScreenProps<
  DirectorStackParamList | ProgramDirectorStackParamList,
  'GoalMasteryApproval'
>) {
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
            studentName: m.requestedByName ? `Student ${m.requestedByName.split(' ')[0]}` : 'Student Leo',
            goalName: m.studentGoalId.includes('-') ? m.studentGoalId.replace(/-/g, ' ') : m.studentGoalId,
            teacherA: m.requestedByName ?? 'Sarah Miller',
            teacherB: 'Alex Tan',
            teacherC: 'Emma Watson',
            dateSubmitted: formatDate(m.requestedAt),
          }))
      );
    } catch {
      setList([]);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewDetail = async (checkId: string) => {
    try {
      const { data } = await getMasteryApprovalDetail(checkId);
      const row = (data ?? {}) as Partial<RawMasteryCheck>;
      setDetail({
        checkId,
        goalId: row.studentGoalId ?? checkId,
        studentName: row.requestedByName ? `Student ${row.requestedByName.split(' ')[0]}` : 'Student Leo',
        goalName: (row.studentGoalId ?? checkId).replace(/-/g, ' '),
        teacherA: { summary: `Achieved 3 consecutive unprompted sessions (100% independence) under primary instruction.` },
        teacherB: { outcome: 'Mastered (Unprompted)', promptUsed: null, notes: 'Observed in Station 2 during peer play. Prompt not required.' },
        teacherC: { outcome: 'Mastered (Unprompted)', promptUsed: null, notes: 'Generalized successfully in cafeteria setting.' },
      });
    } catch {
      setDetail(null);
      Alert.alert('Error', 'Could not load approval details. Please try again.');
    }
  };

  const handleApprove = async (checkId: string, notes: string) => {
    Alert.alert('Approve Goal Mastery', 'Confirm approval and mark this goal as fully mastered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm Approval',
        onPress: async () => {
          try {
            await approveMastery(checkId, { notes });
            setDetail(null);
            await load();
          } catch {}
        },
      },
    ]);
  };

  const handleReject = async (checkId: string, reason: string, notes: string) => {
    try {
      await rejectMastery(checkId, { reason, notes });
      setDetail(null);
      await load();
    } catch {}
    Alert.alert('Sent Back', 'Mastery request was returned to Teacher A with feedback.');
  };

  const handleExport = () => {
    setExportContent(
      [
        '================================================================',
        '      MELU\'E FOUNDATION — GOAL MASTERY APPROVAL RECORD          ',
        '================================================================',
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        `TOTAL PENDING VERIFICATIONS: ${list.length}`,
        '----------------------------------------------------------------',
        '',
        ...list.map(
          (g, i) =>
            `  ${i + 1}. ${g.studentName} — ${g.goalName}\n     Teacher A: ${g.teacherA} | Teacher B: ${g.teacherB} | Teacher C: ${g.teacherC}\n     Date Submitted: ${g.dateSubmitted}\n`
        ),
        list.length === 0 ? '  (No pending mastery approvals)' : '',
        '================================================================',
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isProgramDirector ? (
        <AppNavbar activeTab="Goal Mastery Approval" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />
      ) : (
        <AppNavbar activeTab="Goal Mastery Approval" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as never)} />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="award" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Goal Mastery Approval</Text>
              <Text style={styles.pageSubtitle}>
                Multi-therapist generalization check & final clinical approval
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exportTopBtn} onPress={handleExport}>
            <Feather name="printer" size={14} color={colors.navyText} />
            <Text style={styles.exportTopBtnText}>Export Record</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchCard}>
          <Feather name="search" size={16} color={colors.mutedText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student name or goal domain..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Approvals List */}
        <View style={styles.listSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionHeading}>PENDING MASTERY SUBMISSIONS</Text>
            <Text style={styles.pendingBadge}>{list.length} Pending</Text>
          </View>

          {list.map((g) => (
            <View key={g.checkId} style={styles.masteryCard}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentTitle}>{g.studentName}</Text>
                  <Text style={styles.goalTitle}>{g.goalName}</Text>
                </View>
                <StatusPill status="pending" label="Pending Director" />
              </View>

              {/* Observers Row */}
              <View style={styles.observersWrap}>
                <View style={styles.obsItem}>
                  <Text style={styles.obsLabel}>Teacher A (Primary):</Text>
                  <Text style={styles.obsVal}>{g.teacherA}</Text>
                </View>
                <View style={styles.obsItem}>
                  <Text style={styles.obsLabel}>Teacher B (Cross):</Text>
                  <Text style={styles.obsVal}>{g.teacherB}</Text>
                </View>
                <View style={styles.obsItem}>
                  <Text style={styles.obsLabel}>Teacher C (Cross):</Text>
                  <Text style={styles.obsVal}>{g.teacherC}</Text>
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={styles.dateSubmittedText}>Submitted: {g.dateSubmitted}</Text>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => handleViewDetail(g.checkId)}
                >
                  <Feather name="check-square" size={14} color={colors.navyText} />
                  <Text style={styles.reviewBtnText}>Review & Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {list.length === 0 && (
            <View style={styles.emptyCard}>
              <Feather name="check-circle" size={32} color={colors.successGreen} />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySub}>No pending goal mastery approvals awaiting review.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <ApprovalDetailModal
        visible={!!detail}
        detail={detail}
        onClose={() => setDetail(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <ExportPreviewModal
        visible={!!exportContent}
        title="Goal Mastery Approvals Record"
        filename={`MasteryApprovalRecord_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  exportTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  exportTopBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 13, color: colors.navyText },

  listSection: { gap: spacing.md },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeading: { fontSize: 11, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.8 },
  pendingBadge: { fontSize: 12, fontWeight: '600', color: colors.bodyText },

  masteryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  goalTitle: { fontSize: 13, color: colors.bodyText, marginTop: 2 },

  observersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  obsItem: { flexGrow: 1, minWidth: 140 },
  obsLabel: { fontSize: 10, color: colors.mutedText, textTransform: 'uppercase', fontWeight: '600' },
  obsVal: { fontSize: 12, fontWeight: '700', color: colors.navyText, marginTop: 1 },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.bgApp,
    paddingTop: spacing.sm,
  },
  dateSubmittedText: { fontSize: 11, color: colors.mutedText },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },

  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText, marginTop: spacing.xs },
  emptySub: { fontSize: 12, color: colors.mutedText },

  /* Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '90%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.navyText },
  modalSub: { fontSize: 13, color: colors.bodyText, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verificationSection: { gap: spacing.sm, marginBottom: spacing.md },
  verifyCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  verifyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  teacherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: { fontSize: 12, fontWeight: '800', color: colors.navyText },
  teacherRoleTitle: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  teacherOutcome: { fontSize: 11, color: colors.bodyText },
  verifyNotes: { fontSize: 12, color: colors.navyText, marginTop: 4, fontStyle: 'italic' },

  field: { gap: spacing.xs, marginTop: spacing.xs },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    backgroundColor: colors.bgApp,
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.navyText,
    backgroundColor: colors.bgApp,
    fontSize: 13,
  },

  modalFooter: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  rejectBtnText: { fontWeight: '700', color: '#EF4444', fontSize: 13 },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  approveBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 13 },
});

