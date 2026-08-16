// api/sessionApi.ts
//
// ASSUMED backend contract, based on the Academics::Session / Room / TimeBlock
// pattern from the backend reference repo (conflict-checking, time_blocks,
// nested associations). Field names below are BEST GUESSES until the
// backend team confirms real routes/serializers for the therapy domain.
// Swap BASE_URL and confirm each path/shape with backend before relying on this.

import axios from 'axios';
import type { QueryParams, Payload } from '../types';
import {
  addAppointment,
  addUnavailability,
  dayIndexFromDate,
  getWeekData,
  resolveRoomName,
  resolveStudentNames,
  resolveTherapistName,
  setAppointmentStatus,
  updateAppointmentById,
} from '../stores/scheduleStore';

const BASE_URL = 'https://REPLACE_WITH_REAL_API_HOST/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach auth token to every request (token comes from your auth/login flow)
export function setAuthToken(token: string) {
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
}

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

export const createAppointment = (payload: Payload) => {
  // payload: { studentIds[], therapistId, roomId, date, startTime, endTime, stationName }
  // Demo mode: write straight into the shared schedule store so the Teacher
  // calendar and the Coordinator Operational Management screen stay in sync.
  const studentIds = (payload.studentIds as string[]) || [];
  const created = addAppointment(dayIndexFromDate(payload.date as string), {
    status: 'scheduled',
    therapistId: (payload.therapistId as string) || '',
    therapistName: resolveTherapistName(payload.therapistId as string),
    roomId: (payload.roomId as string) || '',
    roomName: resolveRoomName(payload.roomId as string),
    studentIds,
    studentNames: resolveStudentNames(studentIds),
    startTime: (payload.startTime as string) || '',
    endTime: (payload.endTime as string) || '',
    date: (payload.date as string) || '',
  });
  return Promise.resolve({ data: created });
};

export const updateAppointment = (appointmentId: string, payload: Payload) => {
  updateAppointmentById(appointmentId, {
    studentIds: (payload.studentIds as string[]) || undefined,
    studentNames: resolveStudentNames(payload.studentIds as string[]),
    therapistId: (payload.therapistId as string) || undefined,
    therapistName: resolveTherapistName(payload.therapistId as string),
    roomId: (payload.roomId as string) || undefined,
    roomName: resolveRoomName(payload.roomId as string),
    startTime: (payload.startTime as string) || undefined,
    endTime: (payload.endTime as string) || undefined,
    date: (payload.date as string) || undefined,
  });
  return Promise.resolve({ data: { id: appointmentId } });
};

export const cancelAppointment = (appointmentId: string, payload: Payload) => {
  setAppointmentStatus(appointmentId, 'cancelled');
  return Promise.resolve({ data: { id: appointmentId } });
};

export const rescheduleAppointment = (appointmentId: string, payload: Payload) =>
  // payload: { date, startTime, endTime }
  client.post(`/appointments/${appointmentId}/reschedule`, payload);

export const markAppointmentStatus = (appointmentId: string, status: string) => {
  // status: 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show'
  setAppointmentStatus(appointmentId, status);
  return Promise.resolve({ data: { id: appointmentId, status } });
};

// ---- MR-33: Session Data Collection ----
export const startSession = (sessionId: string) =>
  client.post(`/sessions/${sessionId}/start`);

export const getSessionRoster = (sessionId: string) =>
  // returns students + their goals for this session
  client.get(`/sessions/${sessionId}/roster`);

export const logTrial = (sessionId: string, studentId: string, goalId: string, payload: Payload) =>
  // payload: { promptLevel: 'FP' | 'PP' | 'G' | 'INDEPENDENT', timestamp }
  client.post(`/sessions/${sessionId}/students/${studentId}/goals/${goalId}/trials`, payload);

export const recordIncident = (sessionId: string, studentId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/students/${studentId}/incidents`, payload);

export const requestMasteryCheck = (sessionId: string, studentId: string, goalId: string) =>
  client.post(`/sessions/${sessionId}/students/${studentId}/goals/${goalId}/mastery-check`);

// SCR-004: Goal Mastery Check Screen (Two-Teacher Generalization Check)
export const getGoalMasteryCheck = (studentId: string, goalId: string) =>
  client.get(`/students/${studentId}/goals/${goalId}/mastery-check`);

export const submitGoalMasteryCheck = (studentId: string, goalId: string, payload: Payload) =>
  // payload: { teacherB: {outcome, promptUsed, notes}, teacherC: {outcome, promptUsed, notes} }
  client.post(`/students/${studentId}/goals/${goalId}/mastery-check/submit`, payload);

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
export const getStaffCalendar = (params: QueryParams) => {
  // params: { therapistId, weekStart }
  // Demo mode: serve the shared schedule store directly.
  return Promise.resolve({ data: getWeekData() });
};

export const markTeacherUnavailable = (therapistId: string, payload: Payload) => {
  // payload: { date, reason }
  addUnavailability(therapistId, (payload.date as string) || '', (payload.reason as string) || '');
  return Promise.resolve({ data: { therapistId } });
};

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
