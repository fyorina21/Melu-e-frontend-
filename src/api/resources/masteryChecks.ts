// src/api/resources/masteryChecks.ts
//
// Two-teacher generalization mastery checks (SCR-004).
// Mirrors the backend routes:
//   POST  /student_goals/:studentGoalId/mastery_checks
//   GET   /mastery_checks/:id
//   PATCH /mastery_checks/:id/approve
//   PATCH /mastery_checks/:id/reject
//   POST  /mastery_checks/:id/verifications

import { http } from '../http/client';
import type { UUID } from './types';

export type MasteryCheckStatus = 'pending' | 'approved' | 'rejected';

export interface MasteryCheck {
  id: UUID;
  studentGoalId: UUID | null;
  status: MasteryCheckStatus;
  requestedByName: string | null;
  requestedAt: string | null;
  approvedAt: string | null;
}

export interface MasteryVerification {
  id: UUID;
  masteryCheckId: UUID;
  verifierName: string | null;
  outcome: string | null;
  promptUsed: string | null;
  notes: string | null;
}

export const masteryChecksApi = {
  async create(studentGoalId: UUID, note?: string): Promise<MasteryCheck> {
    const { data } = await http.post<MasteryCheck>(
      `/student_goals/${studentGoalId}/mastery_checks`,
      note ? { note } : undefined,
    );
    return data;
  },

  async show(masteryCheckId: UUID): Promise<MasteryCheck> {
    const { data } = await http.get<MasteryCheck>(`/mastery_checks/${masteryCheckId}`);
    return data;
  },

  async approve(masteryCheckId: UUID): Promise<MasteryCheck> {
    const { data } = await http.patch<MasteryCheck>(`/mastery_checks/${masteryCheckId}/approve`);
    return data;
  },

  async reject(masteryCheckId: UUID, reason?: string): Promise<MasteryCheck> {
    const { data } = await http.patch<MasteryCheck>(
      `/mastery_checks/${masteryCheckId}/reject`,
      reason ? { reason } : undefined,
    );
    return data;
  },

  async verify(masteryCheckId: UUID, payload: {
    outcome: string;
    promptUsed?: string;
    notes?: string;
  }): Promise<MasteryVerification> {
    const { data } = await http.post<MasteryVerification>(
      `/mastery_checks/${masteryCheckId}/verifications`,
      {
        outcome: payload.outcome,
        prompt_used: payload.promptUsed,
        notes: payload.notes,
      },
    );
    return data;
  },
};