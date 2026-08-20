// src/api/resources/trials.ts
//
// Trial logging and real-time stream (FR-093, FR-094).
// Mirrors the backend routes:
//   POST /therapy_sessions/:id/trials
//   GET  /therapy_sessions/:id/participants/:pid/trial_stream

import { http } from '../http/client';
import type { Trial, UUID } from './types';

export interface LogTrialRequest {
  sessionParticipantId: UUID;
  studentGoalId: UUID;
  promptLevelId: UUID;
  outcome: 'correct' | 'incorrect' | 'prompted' | string;
  clientEventId: string;
  loggedAt?: string;
}

export interface TrialStreamParams {
  participantId: UUID;
  studentGoalId?: UUID;
  limit?: number;
}

export const trialsApi = {
  async log(sessionId: UUID, payload: LogTrialRequest): Promise<Trial> {
    const { data } = await http.post<{ trial: Trial }>(`/therapy_sessions/${sessionId}/trials`, {
      session_participant_id: payload.sessionParticipantId,
      student_goal_id: payload.studentGoalId,
      prompt_level_id: payload.promptLevelId,
      outcome: payload.outcome,
      client_event_id: payload.clientEventId,
      logged_at: payload.loggedAt,
    });
    return data.trial;
  },

  async stream(sessionId: UUID, params: TrialStreamParams): Promise<Trial[]> {
    const { participantId, studentGoalId, limit } = params;
    const { data } = await http.get<{ trials: Trial[] }>(
      `/therapy_sessions/${sessionId}/participants/${participantId}/trial_stream`,
      { params: { student_goal_id: studentGoalId, limit } },
    );
    return data.trials;
  },
};