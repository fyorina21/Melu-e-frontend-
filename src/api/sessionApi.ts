
import type { QueryParams, Payload } from '../types';

// The legacy session API delegates to the shared http client from the API
// foundation (src/api/http/client.ts). Config, auth headers, error
// normalization and demo-mode fail-fast live there; this file keeps the
// endpoint helpers that existing screens already import.
export { isDemoMode } from './config/env';
export { setAuthToken } from './http/client';
import { http as client } from './http/client';

// ---- MR-4: Forgot / Reset Password ----
export const requestResetCode = (payload: Payload) =>
  // payload: { email }
  client.post('/auth/request-reset-code', payload);
export const resetPassword = (payload: Payload) =>
  // payload: { email, code, password }
  client.post('/auth/reset-password', payload);

// ---- MR-39: Appointment & Session Management ----
// Per issues doc: full lifecycle - Create, Edit, Cancel, Reschedule, Mark
// Completed, Mark Missed. Status enum: Scheduled, Confirmed, Checked In,
// In Progress, Completed, Cancelled, No Show.
export const getTodaysSchedule = (therapistId: string) =>
  client.get(`/therapists/${therapistId}/sessions/today`);

export const getAppointments = (params: QueryParams) =>
  // params: { therapistId, startDate, endDate, status }
  client.get('/appointments', { params });

export const getAppointmentDetail = (appointmentId: string) =>
  client.get(`/appointments/${appointmentId}`);

export const createAppointment = (payload: Payload) =>
  // payload: { studentIds[], therapistId, roomId, date, startTime, endTime, stationName }
  client.post('/appointments', payload);

export const updateAppointment = (appointmentId: string, payload: Payload) =>
  client.patch(`/appointments/${appointmentId}`, payload);

export const cancelAppointment = (appointmentId: string, payload?: Payload) =>
  client.post(`/appointments/${appointmentId}/cancel`, payload ?? {});

export const rescheduleAppointment = (appointmentId: string, payload: Payload) =>
  // payload: { date, startTime, endTime }
  client.post(`/appointments/${appointmentId}/reschedule`, payload);

export const markAppointmentStatus = (appointmentId: string, status: string) =>
  // status: 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show'
  client.post(`/appointments/${appointmentId}/status`, { status });

// ---- MR-33: Session Data Collection ----
export const startSession = (sessionId: string) =>
  client.post(`/sessions/${sessionId}/start`);

export const getSessionRoster = (sessionId: string) =>
  // returns students + their goals for this session
  client.get(`/sessions/${sessionId}/roster`);

export const logTrial = (sessionId: string, studentId: string, goalId: string, payload: Payload) =>
  // payload: { promptLevel: 'FP' | 'PP' | 'G' | 'INDEPENDENT', timestamp }
  client.post(`/sessions/${sessionId}/students/${studentId}/goals/${goalId}/trials`, payload);

export const undoLastTrial = (sessionId: string, studentId: string, goalId: string) =>
  client.delete(`/sessions/${sessionId}/students/${studentId}/goals/${goalId}/trials/last`);

export const recordBehaviorIncident = (sessionId: string, payload: Payload) =>
  client.post(`/therapy_sessions/${sessionId}/behavior_incidents`, payload);

export const recordIncident = (sessionId: string, studentId: string, payload: Payload) =>
  client.post(`/therapy_sessions/${sessionId}/behavior_incidents`, {
    student_id: studentId,
    studentId,
    ...payload,
  });

export const requestMasteryCheck = (sessionId: string, studentId: string, goalId: string) =>
  client.post(`/student_goals/${goalId}/mastery_checks`, { sessionId, studentId });

// SCR-004: Goal Mastery Check Screen (Two-Teacher Generalization Check)
export const createGoalMasteryCheck = (studentGoalId: string, payload?: Payload) =>
  client.post(`/student_goals/${studentGoalId}/mastery_checks`, payload ?? {});

export const submitGoalMasteryVerification = (masteryCheckId: string, payload: Payload) =>
  client.post(`/mastery_checks/${masteryCheckId}/verifications`, payload);

export const getGoalMasteryCheck = (studentId: string, goalId: string) =>
  client.get(`/students/${studentId}/goals/${goalId}/mastery-check`);

export const submitGoalMasteryCheck = async (studentId: string, goalId: string, payload: Payload) => {
  const { data: mcRes } = await client.post(`/student_goals/${goalId}/mastery_checks`, {
    student_id: studentId,
    studentId,
    student_goal_id: goalId,
    studentGoalId: goalId,
    ...payload,
  });
  const checkId = (mcRes as any)?.mastery_check?.id || (mcRes as any)?.id || goalId;
  return client.post(`/mastery_checks/${checkId}/verifications`, payload);
};

export const swapStudents = (sessionId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/swap-students`, payload);

export const submitSessionSummary = (sessionId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/summary`, payload);

// SCR-005: Session Summary Screen (the live end-of-session report)
export const getSessionSummary = (sessionId: string) =>
  client.get(`/sessions/${sessionId}/summary`);

export const saveSessionDraft = (sessionId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/summary/draft`, payload);

// ---- MR-35: Session Notes & Attachments ----
export const getDailyNotes = (params: QueryParams) =>
  // params: { therapistId, month, status }
  client.get('/session-notes', { params });

export const getSessionNoteDetail = (sessionId: string) =>
  client.get(`/session-notes/${sessionId}`);

export const createSessionNote = (sessionId: string, payload: Payload) =>
  // payload: { bodyMarkdown }
  client.post(`/session-notes/${sessionId}`, payload);

export const updateSessionNote = (sessionId: string, payload: Payload) =>
  client.patch(`/session-notes/${sessionId}`, payload);

export const autoSaveSessionNote = (sessionId: string, payload: Payload) =>
  client.patch(`/session-notes/${sessionId}/autosave`, payload);

export const resubmitSessionNote = (sessionId: string, payload: Payload) =>
  client.post(`/session-notes/${sessionId}/resubmit`, payload);

export const uploadAttachment = (sessionId: string, formData: FormData) =>
  client.post(`/session-notes/${sessionId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteAttachment = (sessionId: string, attachmentId: string) =>
  client.delete(`/session-notes/${sessionId}/attachments/${attachmentId}`);

export const getWeeklySummary = (params: QueryParams) =>
  client.get('/session-notes/weekly-summary', { params });

// ---- MR-36: Goal Progress Update ----
export const getGoalProgress = (studentId: string, goalId: string) =>
  client.get(`/students/${studentId}/goals/${goalId}/progress`);

export const updateGoalProgress = (studentId: string, goalId: string, payload: Payload) =>
  client.patch(`/students/${studentId}/goals/${goalId}/progress`, payload);

// ---- MR-38: Staff Scheduling Calendar ----
// Per SCR-TC-005 (Operational Management): weekly grid, teacher filter,
// mark unavailable, reassign students, export schedule.
export const getStaffCalendar = (params: QueryParams) =>
  // params: { therapistId, weekStart }
  client.get('/staff-calendar', { params });

export const markTeacherUnavailable = (therapistId: string, payload: Payload) =>
  // payload: { date, reason }
  client.post(`/therapists/${therapistId}/unavailability`, payload);

export const reassignStudents = (payload: Payload) =>
  // payload: { fromTherapistId, toTherapistId, studentIds[] }
  client.post('/schedule/reassign', payload);

export const exportSchedule = (params: QueryParams) =>
  client.get('/schedule/export', { params });

// ---- MR-40: Attendance Tracking ----
// Per issues doc: three attendance types (student/therapist/support staff)
// with different status enums, plus one-click and bulk marking.
export const markAttendance = (sessionId: string, payload: Payload) =>
  // payload: { personId, personType: 'student' | 'therapist' | 'support_staff', status, note }
  client.post(`/sessions/${sessionId}/attendance`, payload);

export const markBulkAttendance = (sessionId: string, payload: Payload) =>
  // payload: { entries: [{ personId, personType, status }] }
  client.post(`/sessions/${sessionId}/attendance/bulk`, payload);

export const getAttendanceHistory = (params: QueryParams) =>
  client.get('/attendance', { params });

export const getAttendanceReport = (params: QueryParams) =>
  // params: { scope: 'daily' | 'monthly', date }
  client.get('/attendance/report', { params });

export default client;
