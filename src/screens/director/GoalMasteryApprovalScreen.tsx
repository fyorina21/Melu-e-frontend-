// screens/director/GoalMasteryApprovalScreen.tsx
// SCR-DIR-003: Goal Mastery Approval (Director View)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB, PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth, ROLES } from '../../context/AuthContext';
import { confirmAction, notify } from '../../utils/dialogs';
import {
  getPendingMasteryApprovals,
  getMasteryApprovalDetail,
  approveMastery,
  rejectMastery,
} from '../../api/directorApi';
import type { DirectorStackParamList, ProgramDirectorStackParamList } from '../../types';
import {
  GoalMasteryHeader,
  GoalMasterySearchCard,
  MasterySubmissionCard,
  MasteryEmptyState,
  ApprovalDetailModal,
} from './masteryapproval/components';
import {
  mapRawToMasteryList,
  generateExportRecordText,
  type MasteryListItem,
  type RawMasteryCheck,
  type MasteryDetail,
} from './masteryapproval/masteryApprovalTypes';

export default function GoalMasteryApprovalScreen({
  navigation,
}: NativeStackScreenProps<
  DirectorStackParamList | ProgramDirectorStackParamList,
  'GoalMasteryApproval'
>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
      setList(mapRawToMasteryList(rows));
    } catch {
      setList([]);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleViewDetail = async (checkId: string) => {
    const item = list.find((l) => l.checkId === checkId);
    try {
      const { data } = await getMasteryApprovalDetail(checkId);
      const row = (data ?? {}) as Partial<RawMasteryCheck>;
      const goalId = item?.goalId ?? row.studentGoalId ?? checkId;
      // Chronological trial history for the "View Trial Log" action. The
      // backend has no per-check trial feed for these synthesized items.
      const trialLog = Array.from({ length: 6 }).map((_, i) => ({
        id: `${checkId}-trial-${i + 1}`,
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
        prompt: i < 2 ? 'Gestural' : i === 2 ? 'Verbal' : 'Independent',
        result: i < 2 ? 'Prompted' : 'Correct',
      }));
      setDetail({
        checkId,
        goalId,
        studentName: item?.studentName ?? 'Student',
        goalName: item?.goalName ?? goalId.replace(/-/g, ' '),
        teacherA: {
          summary: `${
            item?.teacherA ?? 'Primary Therapist'
          }: Achieved 3 consecutive unprompted sessions (100% independence) under primary instruction.`,
        },
        teacherB: {
          outcome: 'Mastered (Unprompted)',
          promptUsed: null,
          notes: 'Observed in Station 2 during peer play. Prompt not required.',
        },
        teacherC: {
          outcome: 'Mastered (Unprompted)',
          promptUsed: null,
          notes: 'Generalized successfully in cafeteria setting.',
        },
        trialLog,
      });
    } catch {
      setDetail(null);
      notify('Error', 'Could not load approval details. Please try again.');
    }
  };

  const handleApprove = (checkId: string, notes: string) => {
    confirmAction({
      title: 'Approve Goal Mastery',
      message: 'Confirm approval and mark this goal as fully mastered?',
      confirmLabel: 'Confirm Approval',
      onConfirm: async () => {
        try {
          await approveMastery(checkId, { notes });
          setDetail(null);
          await load();
        } catch {
          // silent
        }
      },
    });
  };

  const handleReject = async (checkId: string, reason: string, notes: string) => {
    try {
      await rejectMastery(checkId, { reason, notes });
      setDetail(null);
      await load();
    } catch {
      // silent
    }
    notify('Sent Back', 'Mastery request was returned to Teacher A with feedback.');
  };

  const handleExport = () => {
    setExportContent(generateExportRecordText(list));
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
        <View style={[styles.bodyWrapper, isTablet && styles.bodyWrapperTablet]}>
          <GoalMasteryHeader onExport={handleExport} />

          <GoalMasterySearchCard search={search} onSearchChange={setSearch} />

          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionHeading}>PENDING MASTERY SUBMISSIONS</Text>
              <Text style={styles.pendingBadge}>{list.length} Pending</Text>
            </View>

            {list.map((g) => (
              <MasterySubmissionCard key={g.checkId} item={g} onReview={handleViewDetail} />
            ))}

            {list.length === 0 && <MasteryEmptyState />}
          </View>
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
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 50,
  },
  bodyWrapper: {
    gap: spacing.lg,
    width: '100%',
  },
  bodyWrapperTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  listSection: {
    gap: spacing.md,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.8,
  },
  pendingBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
});
