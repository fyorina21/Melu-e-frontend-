// src/api/resources/sessions.ts
//
// Therapy session and dashboard endpoints (FR-088–FR-094).
// Mirrors the backend routes:
//   GET  /today/session
//   POST /therapy_sessions/start
//   GET  /therapy_sessions/:id
//   GET  /therapy_sessions/:id/dashboard
//   PATCH /therapy_sessions/:id/participants/:pid/active_goal

import { http } from '../http/client';
import type {
  SessionDashboard,
  SessionState,
  TodaySessionResponse,
  UUID,
} from './types';

export interface StartSessionRequest {
  assignmentId: UUID;
}

export interface UpdateActiveGoalRequest {
  studentGoalId: UUID;
}

export interface UpdateActiveGoalResponse {
  participantId: UUID;
  currentFocusStudentGoalId: UUID;
}

export const sessionsApi = {
  async today(): Promise<TodaySessionResponse> {
    const { data } = await http.get<TodaySessionResponse>('/today/session');
    return data;
  },

  async start(payload: StartSessionRequest): Promise<SessionState> {
    const { data } = await http.post<SessionState>('/therapy_sessions/start', {
      assignment_id: payload.assignmentId,
    });
    return data;
  },

  async show(sessionId: UUID): Promise<SessionDashboard> {
    const { data } = await http.get<SessionDashboard>(`/therapy_sessions/${sessionId}`);
    return data;
  },

  async dashboard(sessionId: UUID): Promise<SessionDashboard> {
    const { data } = await http.get<SessionDashboard>(`/therapy_sessions/${sessionId}/dashboard`);
    return data;
  },

  async updateActiveGoal(
    sessionId: UUID,
    participantId: UUID,
    payload: UpdateActiveGoalRequest,
  ): Promise<UpdateActiveGoalResponse> {
    const { data } = await http.patch<UpdateActiveGoalResponse>(
      `/therapy_sessions/${sessionId}/participants/${participantId}/active_goal`,
      { student_goal_id: payload.studentGoalId },
    );
    return data;
  },
};