// src/screens/goalmastery/goalMasteryHelper.ts

import type { OutcomeOption, PromptType, GoalOption } from './types';

export const STATUS_LABELS: Record<string, string> = {
  pending_verifications: 'Pending Verifications',
  pending_approval: 'Pending Director Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const today = (): string => new Date().toISOString().split('T')[0];

export const formatDate = (value?: string | null): string => {
  if (!value) return today();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().split('T')[0];
};

export const checkKey = (studentId: string, goalId: string): string =>
  `gmc_check_${studentId}_${goalId}`;

export const readStoredCheckId = (studentId: string, goalId: string): string | null => {
  if (!studentId || !goalId || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(checkKey(studentId, goalId));
  } catch {
    return null;
  }
};

export const writeStoredCheckId = (studentId: string, goalId: string, id: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(checkKey(studentId, goalId), id);
  } catch {
    // silent
  }
};

export const clearStoredCheckId = (studentId: string, goalId: string): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(checkKey(studentId, goalId));
  } catch {
    // silent
  }
};

export function unwrapBody(res: { data?: unknown }): Record<string, any> | null {
  const body = res?.data as Record<string, any> | undefined;
  if (!body || typeof body !== 'object') return null;
  if (body.data && typeof body.data === 'object') {
    return body.data as Record<string, any>;
  }
  return body;
}

export const flattenGoals = (
  summary: unknown,
): { goals: GoalOption[]; stationByGoal: Record<string, string> } => {
  const entries = Array.isArray(summary)
    ? (summary as {
        station?: { name?: string };
        goals?: {
          id: string | number;
          goal_name?: string;
          progress_percent?: number;
        }[];
      }[])
    : [];
  const goals: GoalOption[] = [];
  const stationByGoal: Record<string, string> = {};
  entries.forEach((entry) => {
    (entry.goals || []).forEach((g) => {
      const id = String(g.id);
      goals.push({ id, name: g.goal_name || 'Goal' });
      stationByGoal[id] = entry.station?.name || '';
    });
  });
  return { goals, stationByGoal };
};

export const toApiOutcome = (outcome: OutcomeOption): 'fail' | 'success' =>
  outcome === 'failed' ? 'fail' : 'success';

export const toFormOutcome = (outcome?: string | null): OutcomeOption | null =>
  outcome === 'fail' ? 'failed' : outcome === 'success' ? 'both' : null;

export const payloadFor = (
  outcome: OutcomeOption,
  prompt: PromptType,
  notes: string,
): Record<string, any> => ({
  outcome: toApiOutcome(outcome),
  ...(outcome === 'failed' ? { prompt_used: prompt } : {}),
  notes,
});

export const canSubmitMasteryCheck = (
  teacherBLocked: boolean,
  isTeacherBValid: boolean,
  teacherCLocked: boolean,
  isTeacherCValid: boolean,
  isSubmitted: boolean,
  submitting: boolean,
): boolean =>
  (teacherBLocked || isTeacherBValid) &&
  (teacherCLocked || isTeacherCValid) &&
  !isSubmitted &&
  !submitting;
