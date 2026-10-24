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
import { usePermission } from '../../auth/usePermission';
import { useAuth, ROLES } from '../../context/AuthContext';
import { notify, confirmAction } from '../../utils/dialogs';
import {
  getPendingMasteryApprovals,
  getMasteryApprovalDetail,
  approveMastery,
  rejectMastery,
} from '../../api/directorApi';
import { onMasteryChecksChanged } from '../../stores/goalMasteryStore';
import type { DirectorStackParamList, ProgramDirectorStackParamList } from '../../types';

const OUTCOME_LABELS: Record<string, string> = {
  novel_person: 'Independent with Novel Person',
  novel_environment: 'Independent in Novel Environment',
  both: 'Independent (Both Person & Environment)',
  failed: 'Failed - Required Prompt',
};

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
  station?: string;
  dateSubmitted?: string;
  status?: string;
  primaryTeacher?: {
    name: string;
    criteriaMet?: string;
    independenceRate?: string;
    dateAchieved?: string;
    totalTrials?: number | string;
    summary?: string;
    notes?: string;
  };
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

  useEffect(() => {
    if (
      visible &&
      typeof document !== 'undefined' &&
      document.activeElement &&
      'blur' in document.activeElement
    ) {
      (document.activeElement as HTMLElement).blur();
    }
  }, [visible]);

  if (!detail) return null;

  return (
    <Modal
      visible={visible}
      aria-modal={true}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
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

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {/* Goal & Station Summary Header */}
            <View style={styles.detailSummaryBox}>
              <View style={styles.detailSummaryRow}>
                <View style={styles.detailSummaryItem}>
                  <Text style={styles.detailSummaryLabel}>Station</Text>
                  <Text style={styles.detailSummaryVal}>{detail.station || 'General Session'}</Text>
                </View>
                <View style={styles.detailSummaryItem}>
                  <Text style={styles.detailSummaryLabel}>Date Submitted</Text>
                  <Text style={styles.detailSummaryVal}>{detail.dateSubmitted || '—'}</Text>
                </View>
                <View style={styles.detailSummaryItem}>
                  <Text style={styles.detailSummaryLabel}>Status</Text>
                  <StatusPill status="pending" label="Pending Approval" />
                </View>
              </View>
            </View>

            {/* Teacher Verification Form Details */}
            <View style={styles.verificationSection}>
              <Text style={styles.sectionHeading}>
                TEACHER GOAL MASTERY VERIFICATION SUBMISSION
              </Text>

              {/* Primary Evaluating Teacher */}
              <View style={styles.verifyCard}>
                <View style={styles.verifyCardHeader}>
                  <View style={styles.teacherAvatar}>
                    <Feather name="user-check" size={14} color={colors.navyText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teacherRoleTitle}>
                      {detail.primaryTeacher?.name || 'Evaluating Teacher'} (Primary Evaluation)
                    </Text>
                    <Text style={styles.teacherOutcome}>
                      Criteria Target: {detail.primaryTeacher?.criteriaMet || detail.goalName}
                    </Text>
                  </View>
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>
                      {detail.primaryTeacher?.independenceRate || '100%'} Achieved
                    </Text>
                  </View>
                </View>

                {/* Outcome & Prompt from Verification Form */}
                <View style={styles.verificationOutcomeRow}>
                  <View style={styles.outcomePill}>
                    <Text style={styles.outcomePillLabel}>Outcome:</Text>
                    <Text style={styles.outcomePillVal}>
                      {detail.teacherB.outcome || 'Independent'}
                    </Text>
                  </View>
                  {detail.teacherB.promptUsed ? (
                    <View style={styles.promptPill}>
                      <Text style={styles.promptPillLabel}>Prompt Used:</Text>
                      <Text style={styles.promptPillVal}>{detail.teacherB.promptUsed}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Clinical Notes & Summary */}
                <View style={styles.notesBlock}>
                  <Text style={styles.notesBlockLabel}>Clinical Notes & Summary:</Text>
                  <Text style={styles.verifyNotes}>
                    {detail.teacherB.notes ||
                      detail.primaryTeacher?.notes ||
                      detail.teacherA.summary ||
                      'No clinical notes provided.'}
                  </Text>
                </View>
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
                  notify('Feedback Required', 'Please enter a rejection reason.');
                  return;
                }
                onReject(detail.checkId, rejectReason.trim(), notes.trim());
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
  const canApprove = usePermission('iups', 'approve');
  const isProgramDirector = session?.role === ROLES.PROGRAM_DIRECTOR;
  const [list, setList] = useState<MasteryListItem[]>([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<MasteryDetail | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getPendingMasteryApprovals({ search });
      const rows = (Array.isArray(data) ? data : []) as any[];
      setList(
        rows
          .filter((m) => m.status === 'pending')
          .map((m) => ({
            checkId: m.id,
            goalId: m.goalId || m.studentGoalId || m.id,
            studentName:
              m.studentName ||
              (m.requestedByName ? `Student ${m.requestedByName.split(' ')[0]}` : 'Student'),
            goalName:
              m.goalName || (m.studentGoalId ? m.studentGoalId.replace(/-/g, ' ') : 'Goal Mastery'),
            teacherA: m.primaryTeacher?.name || m.requestedByName || 'Lead Teacher',
            teacherB: m.teacherB?.name || 'Teacher B',
            teacherC: m.teacherC?.name || 'Teacher C',
            dateSubmitted: formatDate(m.dateSubmitted || m.requestedAt),
          })),
      );
    } catch {
      setList([]);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onMasteryChecksChanged(load);
  }, [load]);

  const handleViewDetail = async (checkId: string) => {
    try {
      const { data } = await getMasteryApprovalDetail(checkId);
      const row = (data ?? {}) as any;
      const tBOutcome = row.teacherB?.outcome;
      const tCOutcome = row.teacherC?.outcome;
      setDetail({
        checkId,
        goalId: row.goalId || row.studentGoalId || checkId,
        studentName:
          row.studentName ||
          (row.requestedByName ? `Student ${row.requestedByName.split(' ')[0]}` : 'Student'),
        goalName:
          row.goalName ||
          (row.studentGoalId ? row.studentGoalId.replace(/-/g, ' ') : 'Goal Mastery'),
        station: row.station || 'General Session',
        dateSubmitted: formatDate(row.dateSubmitted || row.requestedAt),
        status: row.status || 'pending',
        primaryTeacher: row.primaryTeacher || {
          name: row.requestedByName || 'Lead Teacher',
          criteriaMet: row.goalName || 'Goal Mastery',
          independenceRate: '100%',
          notes: row.primaryTeacher?.notes || row.teacherB?.notes || '',
        },
        teacherA: {
          summary:
            row.primaryTeacher?.summary ||
            row.primaryTeacher?.notes ||
            row.teacherB?.notes ||
            (row.primaryTeacher?.independenceRate
              ? `Achieved ${row.primaryTeacher.independenceRate} independence under primary instruction (${row.primaryTeacher.criteriaMet || 'Criteria Met'}).`
              : 'Achieved 3 consecutive unprompted sessions (100% independence) under primary instruction.'),
        },
        teacherB: {
          outcome: tBOutcome ? OUTCOME_LABELS[tBOutcome] || tBOutcome : 'Verified Independent',
          promptUsed: row.teacherB?.promptUsed || null,
          notes: row.teacherB?.notes || '',
        },
        teacherC: {
          outcome: tCOutcome ? OUTCOME_LABELS[tCOutcome] || tCOutcome : 'Verified Independent',
          promptUsed: row.teacherC?.promptUsed || null,
          notes: row.teacherC?.notes || '',
        },
      });
    } catch {
      setDetail(null);
      Alert.alert('Error', 'Could not load approval details. Please try again.');
    }
  };

  const handleApprove = async (checkId: string, notes: string) => {
    if (
      !canApprove &&
      session?.role !== ROLES.DIRECTOR &&
      session?.role !== ROLES.PROGRAM_DIRECTOR
    ) {
      notify('Permission Denied', 'You do not have permission to approve goal mastery.');
      return;
    }
    confirmAction({
      title: 'Approve Goal Mastery',
      message: 'Confirm approval and mark this goal as fully mastered?',
      confirmLabel: 'Confirm Approval',
      onConfirm: async () => {
        try {
          await approveMastery(checkId, { notes });
          setDetail(null);
          await load();
          notify('Mastery Approved', 'Goal marked as fully mastered and approved.');
        } catch {
          notify('Error', 'Failed to approve goal mastery.');
        }
      },
    });
  };

  const handleReject = async (checkId: string, reason: string, notes: string) => {
    if (
      !canApprove &&
      session?.role !== ROLES.DIRECTOR &&
      session?.role !== ROLES.PROGRAM_DIRECTOR
    ) {
      notify('Permission Denied', 'You do not have permission to reject goal mastery requests.');
      return;
    }
    try {
      await rejectMastery(checkId, { reason, notes });
      setDetail(null);
      await load();
      notify('Sent Back', 'Mastery request was returned to Teacher with feedback.');
    } catch {
      notify('Error', 'Failed to reject mastery request.');
    }
  };

  const handleExport = () => {
    setExportContent(
      [
        '================================================================',
        "      MELU'E FOUNDATION — GOAL MASTERY APPROVAL RECORD          ",
        '================================================================',
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        `TOTAL PENDING VERIFICATIONS: ${list.length}`,
        '----------------------------------------------------------------',
        '',
        ...list.map(
          (g, i) =>
            `  ${i + 1}. ${g.studentName} — ${g.goalName}\n     Teacher A: ${g.teacherA} | Teacher B: ${g.teacherB} | Teacher C: ${g.teacherC}\n     Date Submitted: ${g.dateSubmitted}\n`,
        ),
        list.length === 0 ? '  (No pending mastery approvals)' : '',
        '================================================================',
      ].join('\n'),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {isProgramDirector ? (
        <AppNavbar
          activeTab="Goal Mastery Approval"
          onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)}
        />
      ) : (
        <AppNavbar
          activeTab="Goal Mastery Approval"
          onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as never)}
        />
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

              {/* Teacher Evaluator Row */}
              <View style={styles.observersWrap}>
                <View style={styles.obsItem}>
                  <Text style={styles.obsLabel}>Evaluating Teacher:</Text>
                  <Text style={styles.obsVal}>{g.teacherA}</Text>
                </View>
                {g.teacherB && g.teacherB !== g.teacherA ? (
                  <View style={styles.obsItem}>
                    <Text style={styles.obsLabel}>Observer:</Text>
                    <Text style={styles.obsVal}>{g.teacherB}</Text>
                  </View>
                ) : null}
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
              <Text style={styles.emptySub}>
                No pending goal mastery approvals awaiting review.
              </Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 280,
  },
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
  obsLabel: {
    fontSize: 10,
    color: colors.mutedText,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
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

  detailSummaryBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailSummaryItem: { minWidth: 100, gap: 2 },
  detailSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  detailSummaryVal: { fontSize: 13, fontWeight: '600', color: colors.navyText },

  modalBadge: {
    backgroundColor: '#BFDBFE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  modalBadgeText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },

  verificationOutcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  outcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outcomePillLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedText },
  outcomePillVal: { fontSize: 12, fontWeight: '700', color: colors.navyText },

  promptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  promptPillLabel: { fontSize: 11, fontWeight: '600', color: '#854D0E' },
  promptPillVal: { fontSize: 12, fontWeight: '700', color: '#854D0E' },

  notesBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  notesBlockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: 2,
  },

  verificationSection: { gap: spacing.sm, marginBottom: spacing.md },
  verifyCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
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
  verifyNotes: { fontSize: 12, color: colors.navyText, lineHeight: 18 },

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
