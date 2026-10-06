import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIupCandidates,
  getIupContext,
  getGoalBank,
  saveIupDraft,
  finalizeIup,
  getStudentCaseload,
} from '../api/programDirectorApi';

export const IUP_KEYS = {
  candidates: ['iup', 'candidates'] as const,
  context: (studentId: string) => ['iup', 'context', studentId] as const,
  goalBank: (params?: Record<string, unknown>) => ['iup', 'goalBank', params] as const,
  caseload: (studentId: string) => ['iup', 'caseload', studentId] as const,
};

export function useIupCandidatesQuery() {
  return useQuery({
    queryKey: IUP_KEYS.candidates,
    queryFn: async () => {
      const res = await getIupCandidates();
      return Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.candidates)
          ? (res.data as any).candidates
          : [];
    },
  });
}

export function useIupContextQuery(studentId: string | null) {
  return useQuery({
    queryKey: IUP_KEYS.context(studentId || ''),
    queryFn: async () => {
      if (!studentId) return null;
      const res = await getIupContext(studentId);
      return res.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useGoalBankQuery(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: IUP_KEYS.goalBank(params),
    queryFn: async () => {
      const res = await getGoalBank(params || {});
      return Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.goals)
          ? (res.data as any).goals
          : [];
    },
  });
}

export function useStudentCaseloadQuery(studentId: string | null) {
  return useQuery({
    queryKey: IUP_KEYS.caseload(studentId || ''),
    queryFn: async () => {
      if (!studentId) return null;
      const res = await getStudentCaseload(studentId);
      return res.data;
    },
    enabled: Boolean(studentId),
  });
}

export function useSaveIupDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ iupId, payload }: { iupId: string; payload: Record<string, unknown> }) => {
      const res = await saveIupDraft(iupId, payload);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['iup', 'context', vars.iupId] });
    },
  });
}

export function useFinalizeIupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ iupId, payload }: { iupId: string; payload: Record<string, unknown> }) => {
      const res = await finalizeIup(iupId, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IUP_KEYS.candidates });
    },
  });
}
