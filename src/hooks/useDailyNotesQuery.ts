import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDailyNotes, getWeeklySummary, resubmitSessionNote } from '../api/sessionApi';
import { getBehaviorAssessment, getTeacherDashboard } from '../api/teacherExtrasApi';

export const DAILY_NOTES_KEYS = {
  dailyNotes: (params?: Record<string, unknown>) => ['dailyNotes', params] as const,
  weeklySummary: ['dailyNotes', 'weeklySummary'] as const,
  teacherDashboard: ['teacherDashboard'] as const,
  behaviorAssessment: (studentId?: string) => ['behaviorAssessment', studentId] as const,
};

export function useDailyNotesQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: DAILY_NOTES_KEYS.dailyNotes(params),
    queryFn: async () => {
      const res = await getDailyNotes(params || {});
      return res.data;
    },
  });
}

export function useWeeklySummaryQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...DAILY_NOTES_KEYS.weeklySummary, params],
    queryFn: async () => {
      const res = await getWeeklySummary(params || {});
      return res.data;
    },
  });
}

export function useTeacherDashboardQuery() {
  return useQuery({
    queryKey: DAILY_NOTES_KEYS.teacherDashboard,
    queryFn: async () => {
      const res = await getTeacherDashboard();
      return res.data;
    },
  });
}

export function useBehaviorAssessmentQuery(studentId?: string) {
  return useQuery({
    queryKey: DAILY_NOTES_KEYS.behaviorAssessment(studentId),
    queryFn: async () => {
      if (!studentId) return null;
      const res = await getBehaviorAssessment(studentId);
      return res.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useResubmitNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const res = await resubmitSessionNote(sessionId, { notes: notes || '' });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
    },
  });
}
