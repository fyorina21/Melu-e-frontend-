import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLoader from '../../components/ScreenLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { downloadTextFile } from '../../utils/webExport';
import { storage } from '../../utils/storage';
import type { SessionStackParamList } from '../../types';
import {
  useDailyNotesQuery,
  useWeeklySummaryQuery,
  useTeacherDashboardQuery,
  useBehaviorAssessmentQuery,
  useResubmitNoteMutation,
} from '../../hooks';

import DailyNotesPresenter, {
  type NoteRecord,
  type DailyNotesStats,
  type WeeklySummaryData,
  type BehaviorAssessmentData,
  type StudentOption,
} from './DailyNotesPresenter';

type Props = NativeStackScreenProps<SessionStackParamList, 'DailyNotes'>;

const DATE_OPTIONS = ['This Week', 'Last Week', 'This Month'];
const STATUS_OPTIONS = ['All Statuses', 'Approved', 'Pending', 'Draft', 'Revision Required'];

const LIKERT_SCORE: Record<string, number> = {
  Never: 0,
  'Almost Never': 1,
  Seldom: 2,
  'Half the Time': 3,
  Usually: 4,
  'Almost Always': 5,
  Always: 6,
};

const MASS_FUNCTIONS: Record<string, 'Sensory' | 'Escape' | 'Attention' | 'Tangible'> = {
  M1: 'Sensory',
  M2: 'Escape',
  M3: 'Attention',
  M4: 'Tangible',
  M5: 'Sensory',
  M6: 'Escape',
  M7: 'Attention',
  M8: 'Tangible',
  M9: 'Escape',
  M10: 'Sensory',
  M11: 'Attention',
  M12: 'Tangible',
};

const FAST_CATEGORIES: Record<
  string,
  'Social - Positive' | 'Social - Negative' | 'Automatic - Positive' | 'Automatic - Negative'
> = {
  F1: 'Social - Positive',
  F2: 'Social - Negative',
  F3: 'Automatic - Positive',
  F4: 'Automatic - Negative',
  F5: 'Automatic - Positive',
  F6: 'Social - Negative',
  F7: 'Social - Positive',
  F8: 'Social - Positive',
};

function hasBehaviorData(a: BehaviorAssessmentData | null): boolean {
  if (!a) return false;
  return (
    Object.keys(a.massAnswers ?? {}).some((k) => !!a.massAnswers?.[k]) ||
    Object.keys(a.fastAnswers ?? {}).some((k) => a.fastAnswers?.[k] !== undefined) ||
    (a.records?.length ?? 0) > 0 ||
    Boolean(
      a.draftRecord &&
      (a.draftRecord.frequency?.trim() ||
        a.draftRecord.trigger?.trim() ||
        a.draftRecord.duration?.trim()),
    )
  );
}

function getMassFunction(answers: Record<string, string>): string {
  const totals: Record<string, number> = { Sensory: 0, Escape: 0, Attention: 0, Tangible: 0 };
  Object.entries(answers).forEach(([id, val]) => {
    const fn = MASS_FUNCTIONS[id];
    if (fn && val) totals[fn] += LIKERT_SCORE[val] ?? 0;
  });
  return Object.keys(totals).reduce((max, k) => (totals[k] > totals[max] ? k : max), 'Sensory');
}

function getFastCategory(answers: Record<string, boolean>): string {
  const totals: Record<string, number> = {
    'Social - Positive': 0,
    'Social - Negative': 0,
    'Automatic - Positive': 0,
    'Automatic - Negative': 0,
  };
  Object.entries(answers).forEach(([id, val]) => {
    const cat = FAST_CATEGORIES[id];
    if (cat && val === true) totals[cat] += 1;
  });
  return Object.keys(totals).reduce(
    (max, k) => (totals[k] > totals[max] ? k : max),
    'Social - Positive',
  );
}

export default function DailyNotesContainer({ navigation, route }: Props) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState<NoteRecord | null>(null);

  // Student resolution via route or KeyValueStorage
  const routeSid = route?.params?.studentId;
  const localSid = storage.getSync('last_assessment_student_id');
  const initialStudentId = routeSid || localSid || undefined;

  const [studentId, setStudentId] = useState<string | undefined>(initialStudentId);

  // Dropdown states
  const [dateFilter, setDateFilter] = useState('This Month');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [openDropdown, setOpenDropdown] = useState<'date' | 'status' | 'student' | null>(null);

  // TanStack React Query Hooks
  const {
    data: dailyNotesData,
    isLoading: notesLoading,
    refetch: refetchNotes,
  } = useDailyNotesQuery();
  const { data: summaryData } = useWeeklySummaryQuery();
  const { data: dashboardData } = useTeacherDashboardQuery();
  const { data: rawBehaviorData, refetch: refetchBehavior } = useBehaviorAssessmentQuery(studentId);
  const resubmitMutation = useResubmitNoteMutation();

  const records: NoteRecord[] = dailyNotesData?.records ?? [];
  const stats: DailyNotesStats = dailyNotesData?.stats ?? {
    sessionsCompleted: 0,
    totalTrials: 0,
    avgIndependence: 0,
    reviewsPending: 0,
  };
  const summary: WeeklySummaryData | null = summaryData ?? null;

  const studentOptions: StudentOption[] = (dashboardData?.students ?? []).map((s: any) => ({
    id: s.id,
    name: s.name ?? s.fullName ?? s.id,
    initial: (s.name ?? s.fullName ?? '?').charAt(0),
  }));

  useEffect(() => {
    if (!studentId && studentOptions.length > 0) {
      setStudentId(routeSid || localSid || studentOptions[0]?.id);
    }
  }, [studentOptions, studentId, routeSid, localSid]);

  useEffect(() => {
    if (route?.params?.studentId && route.params.studentId !== studentId) {
      setStudentId(route.params.studentId);
    }
  }, [route?.params?.studentId, studentId]);

  useEffect(() => {
    if (studentId) {
      storage.setSync('last_assessment_student_id', studentId);
    }
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      refetchBehavior();
      refetchNotes();
    }, [refetchBehavior, refetchNotes]),
  );

  const behaviorAssessment = useMemo<BehaviorAssessmentData | null>(() => {
    if (!studentId) return null;
    let localData: any = null;
    const stored = storage.getSync(`behavior_assessment_${studentId}`);
    if (stored) {
      try {
        localData = JSON.parse(stored);
      } catch {}
    }

    const raw = rawBehaviorData as any;
    const innerData = (
      raw?.data && typeof raw.data === 'object' ? raw.data : raw
    ) as BehaviorAssessmentData | null;
    const status = raw?.status ?? innerData?.status;

    if (innerData) {
      const mergedMass = { ...(localData?.massAnswers ?? {}), ...(innerData?.massAnswers ?? {}) };
      const mergedFast = { ...(localData?.fastAnswers ?? {}), ...(innerData?.fastAnswers ?? {}) };
      const mergedRecords =
        innerData?.records && innerData.records.length > 0
          ? innerData.records
          : (localData?.records ?? []);
      const draftRecord = innerData?.draftRecord ?? localData?.draftRecord;
      const finalStatus = status || localData?.status || 'in_progress';

      return {
        ...innerData,
        massAnswers: mergedMass,
        fastAnswers: mergedFast,
        records: mergedRecords,
        draftRecord,
        status: finalStatus,
      };
    }

    if (localData && hasBehaviorData(localData)) {
      return localData as BehaviorAssessmentData;
    }
    return null;
  }, [studentId, rawBehaviorData]);

  if (notesLoading && records.length === 0 && !dailyNotesData) {
    return <ScreenLoader />;
  }

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'All Statuses' && r.status !== statusFilter) {
      return false;
    }

    if (search.trim() !== '') {
      const query = search.toLowerCase().trim();
      const matchesStudent = r.students.some((st) => st.toLowerCase().includes(query));
      const matchesStation = r.station.toLowerCase().includes(query);
      const matchesRoom = r.room.toLowerCase().includes(query);

      return matchesStudent || matchesStation || matchesRoom;
    }

    return true;
  });

  const handleExportWeekly = () => {
    if (!summary) return;
    const lines = [
      'MELU’E FOUNDATION — WEEKLY SUMMARY',
      `Week of: ${summary.weekRange}`,
      '',
      `Sessions completed: ${summary.sessionsThisWeek}`,
      `Total trials logged: ${summary.totalTrialsThisWeek}`,
      `Average independence: ${summary.avgIndependenceThisWeek}%`,
      '',
      'Teacher: ' + (session?.userName ?? 'Teacher A'),
    ];
    downloadTextFile(
      `WeeklySummary_${summary.weekRange.replace(/[^a-z0-9]/gi, '_')}.html`,
      lines.map((l) => `<p>${l}</p>`).join(''),
    );
  };

  const handleResubmit = async (id: string) => {
    try {
      await resubmitMutation.mutateAsync({ sessionId: id, notes: '' });
      showToast('Session resubmitted for coordinator review', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to resubmit session note', 'error');
    }
  };

  const massFunctionText =
    behaviorAssessment?.massAnswers && Object.keys(behaviorAssessment.massAnswers).length > 0
      ? getMassFunction(behaviorAssessment.massAnswers)
      : undefined;

  const fastCategoryText =
    behaviorAssessment?.fastAnswers && Object.keys(behaviorAssessment.fastAnswers).length > 0
      ? getFastCategory(behaviorAssessment.fastAnswers)
      : undefined;

  return (
    <DailyNotesPresenter
      stats={stats}
      summary={summary}
      filteredRecords={filteredRecords}
      search={search}
      dateFilter={dateFilter}
      statusFilter={statusFilter}
      studentId={studentId}
      studentOptions={studentOptions}
      openDropdown={openDropdown}
      behaviorAssessment={behaviorAssessment}
      hasBehavior={hasBehaviorData(behaviorAssessment)}
      massFunctionText={massFunctionText}
      fastCategoryText={fastCategoryText}
      feedbackTarget={feedbackTarget}
      dateOptions={DATE_OPTIONS}
      statusOptions={STATUS_OPTIONS}
      onSearchChange={setSearch}
      onDateFilterChange={setDateFilter}
      onStatusFilterChange={setStatusFilter}
      onStudentSelect={setStudentId}
      onToggleDropdown={setOpenDropdown}
      onExportWeekly={handleExportWeekly}
      onGoBack={() => navigation.goBack()}
      onNavigateEditor={(sessionId, mode) =>
        navigation?.navigate?.('SessionNoteEditor', { sessionId, mode })
      }
      onNavigateBehaviorAssessment={(sid) =>
        navigation?.navigate?.('BehaviorAssessment', { studentId: sid })
      }
      onResubmitNote={handleResubmit}
      onCloseFeedback={() => setFeedbackTarget(null)}
      onOpenFeedback={setFeedbackTarget}
      onNavbarTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
    />
  );
}
