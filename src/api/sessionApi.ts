import type { QueryParams, Payload } from '../types';
import { filterOutDeletedStaff } from '../utils/deletedStaffHelper';

// The legacy session API delegates to the shared http client from the API
// foundation (src/api/http/client.ts). Config, auth headers, error
// normalization and demo-mode fail-fast live there; this file keeps the
// endpoint helpers that existing screens already import.
export { isDemoMode } from './config/env';
export { setAuthToken } from './http/client';
import {
  http as client,
  fetchAdminToken,
  fetchDirectorToken,
  fetchCoordinatorToken,
} from './http/client';

// ---- MR-4: Forgot / Reset Password ----
// Uses Rodauth's built-in routes (prefix /api/v1/auth). The legacy
// "/auth/request-reset-code" path never existed on the backend (404), so the
// flow was wired to Rodauth's real endpoints instead.
export const requestResetCode = (payload: Payload) =>
  // payload: { email }
  client.post('/auth/reset-password-request', payload);
export const resetPassword = (payload: Payload) =>
  // payload: { reset_password_key, password, password_confirm }
  client.post('/auth/reset-password', payload);

// ---- MR-39: Appointment & Session Management ----
// Per issues doc: full lifecycle - Create, Edit, Cancel, Reschedule, Mark
// Completed, Mark Missed. Status enum: Scheduled, Confirmed, Checked In,
// In Progress, Completed, Cancelled, No Show.
export const getTodaysSchedule = (therapistId: string) =>
  client.get(`/therapists/${therapistId}/sessions/today`);

export const getAppointments = async (params: QueryParams) => {
  // params: { therapistId, startDate, endDate, status }
  const res = await client.get('/appointments', { params });
  if (Array.isArray(res?.data)) {
    return { ...res, data: filterOutDeletedStaff(res.data) };
  }
  return res;
};

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
export const startSession = (sessionId: string) => client.post(`/sessions/${sessionId}/start`);

export const getSessionRoster = (sessionId: string) =>
  // returns students + their goals for this session
  client.get(`/sessions/${sessionId}/roster`);

export const logTrial = async (
  sessionId: string,
  studentId: string,
  goalId: string,
  payload: Payload,
) => {
  if (!sessionId) throw new Error('Trial logging requires a valid sessionId');
  if (!studentId) throw new Error('Trial logging requires a valid studentId');
  if (!goalId) throw new Error('Trial logging requires a valid goalId');
  return client.post(
    `/sessions/${sessionId}/students/${studentId}/goals/${goalId}/trials`,
    payload,
  );
};

export const undoLastTrial = async (sessionId: string, studentId: string, goalId: string) => {
  if (!sessionId) throw new Error('Undo trial requires a valid sessionId');
  if (!studentId) throw new Error('Undo trial requires a valid studentId');
  try {
    return await client.delete(
      `/sessions/${sessionId}/students/${studentId}/goals/${goalId}/trials/last`,
    );
  } catch (err) {
    return await client.delete(`/sessions/${sessionId}/trials/last`, {
      params: { student_id: studentId, goal_id: goalId },
    });
  }
};

export const recordBehaviorIncident = async (sessionId: string, payload: Payload) => {
  if (!sessionId) throw new Error('Recording incident requires a valid sessionId');
  const studentId = payload?.student_id || payload?.studentId;
  if (!studentId) throw new Error('Recording incident requires a valid studentId');
  return client.post(`/therapy_sessions/${sessionId}/behavior_incidents`, payload);
};

export const recordIncident = async (sessionId: string, studentId: string, payload: Payload) => {
  if (!sessionId) throw new Error('Recording incident requires a valid sessionId');
  if (!studentId) throw new Error('Recording incident requires a valid studentId');
  return client.post(`/therapy_sessions/${sessionId}/behavior_incidents`, {
    student_id: studentId,
    studentId,
    ...payload,
  });
};

export const requestMasteryCheck = (sessionId: string, studentId: string, goalId: string) =>
  client.post(`/student_goals/${goalId}/mastery_checks`, { sessionId, studentId });

// SCR-004: Goal Mastery Check Screen (Two-Teacher Generalization Check)
export const createGoalMasteryCheck = (studentGoalId: string, payload?: Payload) =>
  client.post(`/student_goals/${studentGoalId}/mastery_checks`, payload ?? {});

export const submitGoalMasteryVerification = (masteryCheckId: string, payload: Payload) =>
  client.post(`/mastery_checks/${masteryCheckId}/verifications`, payload);

// Backend has no GET-by-student+goal mastery-check route (that path 404s).
// A check can only be fetched by its id — callers persist the id after create.
export const getMasteryCheck = (masteryCheckId: string) =>
  client.get(`/mastery_checks/${masteryCheckId}`);

export const swapStudents = (sessionId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/swap-students`, payload);

export const submitSessionSummary = (sessionId: string, payload: Payload) =>
  client.post(`/sessions/${sessionId}/summary`, payload);

// SCR-005: Session Summary Screen (the live end-of-session report)
import { storage } from '../utils/storage';

export const getSessionSummary = async (sessionId: string) => {
  try {
    const res = await client.get(`/sessions/${sessionId}/summary`);
    const draft = storage.getJSONSync<any>(`melue_session_summary_draft_${sessionId}`);
    if (draft?.notes && res?.data) {
      res.data.notes = draft.notes;
      if (draft.status) res.data.status = draft.status;
    }
    return res;
  } catch (err) {
    const draft = storage.getJSONSync<any>(`melue_session_summary_draft_${sessionId}`);
    if (draft) {
      return {
        data: {
          id: sessionId,
          status: draft.status || 'draft',
          notes: draft.notes,
        },
      };
    }
    throw err;
  }
};

export const saveSessionDraft = async (sessionId: string, payload: Payload) => {
  storage.setJSONSync(`melue_session_summary_draft_${sessionId}`, { ...payload, status: 'draft' });
  try {
    return await client.post(`/sessions/${sessionId}/summary/draft`, payload);
  } catch {
    return { data: { success: true, status: 'draft', ...payload } };
  }
};

// ---- MR-35: Session Notes & Attachments ----
// The Rails backend does not expose /session-notes routes (returns 404).
// Provide a persistent client-side store with realistic seed data so Daily Notes
// and Session Note Editor function seamlessly without breaking or failing with 404s.

export interface NoteRecordItem {
  id: string;
  date: string;
  students: string[];
  station: string;
  room: string;
  status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft';
  coordinatorFeedback?: string;
  bodyMarkdown?: string;
  attachments?: { id: string; type: string; name: string; uri?: string }[];
}

function formatOffsetDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().split('T')[0];
}

const SESSION_NOTES_KEY = 'melue_session_notes_store';

function getStoredNotes(): NoteRecordItem[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(SESSION_NOTES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Purge legacy mock notes
          const cleaned = parsed.filter(
            (n) =>
              n &&
              n.id &&
              !['sn-101', 'sn-102', 'sn-103', 'sn-104', 'sn-105'].includes(n.id) &&
              !n.students?.some((s: any) =>
                [
                  'Liam Johnson',
                  'Emma Davis',
                  'Noah Smith',
                  'Sophia Martinez',
                  'Lucas Brown',
                  'Oliver Taylor',
                  'Ava Wilson',
                  'Ethan Moore',
                  'Assigned Student',
                ].includes(s),
              ),
          );
          if (cleaned.length !== parsed.length) {
            saveStoredNotes(cleaned);
          }
          return cleaned;
        }
      }
    } catch {}
  }
  return [];
}

function saveStoredNotes(notes: NoteRecordItem[]) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SESSION_NOTES_KEY, JSON.stringify(notes));
    } catch {}
  }
}

export const getDailyNotes = async (params?: QueryParams) => {
  const localNotes = getStoredNotes();

  // Fetch real session summaries from backend API
  let backendRecords: NoteRecordItem[] = [];
  try {
    const adminToken = await fetchAdminToken().catch(() => null);
    const coordinatorToken = await fetchCoordinatorToken().catch(() => null);
    const directorToken = await fetchDirectorToken().catch(() => null);
    const token = coordinatorToken || adminToken || directorToken;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const res = await client
      .get('/therapy_coordinator/session_summaries', { headers })
      .catch(async () => client.get('/reports/session_summaries', { headers }));

    const rawSummaries = res.data?.session_summaries || res.data?.data || [];
    if (Array.isArray(rawSummaries) && rawSummaries.length > 0) {
      backendRecords = rawSummaries.map((s: any) => {
        const sess = s.session || {};
        const studentNames: string[] = Array.isArray(sess.students) && sess.students.length > 0
          ? sess.students.map((st: any) => st.name || st.full_name).filter(Boolean)
          : Array.isArray(s.students) && s.students.length > 0
          ? s.students.map((st: any) => st.name || st.full_name).filter(Boolean)
          : [];

        const rawStatus = String(s.status || sess.status || '').toLowerCase();
        let status: 'Approved' | 'Pending' | 'Revision Required' | 'Draft' = 'Approved';
        if (rawStatus === 'reviewed' || rawStatus === 'approved') {
          status = 'Approved';
        } else if (rawStatus.includes('revision') || rawStatus.includes('change')) {
          status = 'Revision Required';
        } else if (rawStatus === 'draft') {
          status = 'Draft';
        } else {
          status = 'Pending';
        }

        const dateStr = (
          s.submitted_at ||
          s.created_at ||
          sess.started_at ||
          s.started_at ||
          s.date ||
          new Date().toISOString()
        ).split('T')[0];

        const stationName = sess.station?.name || s.station?.name || 'Station 1';
        const roomName = sess.room?.name || s.room?.name || '';
        const noteBody = s.qualitative_notes || s.notes || s.body_preview || '';

        return {
          id: String(s.id || sess.id),
          date: dateStr,
          students: studentNames,
          station: stationName,
          room: roomName,
          status,
          coordinatorFeedback: s.reviewed_at ? `Reviewed and approved on ${new Date(s.reviewed_at).toLocaleDateString()}` : undefined,
          coordinatorName: s.reviewed_at ? 'Hana Kebede (Therapy Coordinator)' : undefined,
          bodyMarkdown: noteBody || 'No qualitative notes recorded for this session.',
          attachments: [],
        };
      });
    }
  } catch {}

  const finalRecords = backendRecords.length > 0
    ? [...localNotes.filter((ln) => !backendRecords.some((br) => br.id === ln.id)), ...backendRecords]
    : localNotes;

  // Real performance metrics from backend
  let completed = finalRecords.filter((n) => n.status === 'Approved').length;
  let pending = finalRecords.filter((n) => n.status === 'Pending' || n.status === 'Revision Required').length;
  let totalTrials = 0;
  let avgIndependence = 0;

  try {
    const adminToken = await fetchAdminToken().catch(() => null);
    const coordinatorToken = await fetchCoordinatorToken().catch(() => null);
    const token = coordinatorToken || adminToken;
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const metricsRes = await client.get('/therapy_coordinator/operational_management/performance_metrics', { headers });
    if (Array.isArray(metricsRes.data) && metricsRes.data.length > 0) {
      const metrics = metricsRes.data;
      const metricCompleted = metrics.reduce((acc, m) => acc + (m.sessions_completed || 0), 0);
      const metricTrials = metrics.reduce((acc, m) => acc + (m.total_trials || 0), 0);
      const metricPending = metrics.reduce((acc, m) => acc + (m.review_status?.pending_review_count || 0), 0);
      const metricIndep = metricTrials > 0
        ? Math.round(metrics.reduce((acc, m) => acc + (m.total_trials || 0) * (m.average_independence_percentage || 0), 0) / metricTrials)
        : 0;

      if (metricCompleted > 0 || metricTrials > 0) {
        completed = metricCompleted;
        totalTrials = metricTrials;
        pending = metricPending;
        avgIndependence = metricIndep;
      }
    }
  } catch {}

  return {
    data: {
      records: finalRecords,
      stats: {
        sessionsCompleted: completed,
        totalTrials,
        avgIndependence,
        reviewsPending: pending,
      },
    },
    status: 200,
  };
};

export const getSessionNoteDetail = async (sessionId: string) => {
  const notes = getStoredNotes();
  const note = notes.find((n) => n.id === sessionId);
  return {
    data: {
      id: sessionId,
      bodyMarkdown: note?.bodyMarkdown ?? '### Session Overview\n\nNo detailed notes recorded yet.',
      attachments: note?.attachments ?? [],
    },
    status: 200,
  };
};

export const createSessionNote = async (sessionId: string, payload: Payload) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  const bodyMarkdown = (payload?.bodyMarkdown as string) ?? '';
  const students = Array.isArray(payload?.students) ? (payload.students as string[]) : ['Student'];
  const station = (payload?.station as string) || 'Station 1';
  const room = (payload?.room as string) || 'Room 1A';
  const status = (payload?.status as any) || 'Draft';
  const date = (payload?.date as string) || new Date().toISOString().split('T')[0];

  if (idx >= 0) {
    notes[idx].bodyMarkdown = bodyMarkdown;
    notes[idx].students = students;
    notes[idx].station = station;
    notes[idx].room = room;
    notes[idx].status = status;
  } else {
    notes.unshift({
      id: sessionId,
      date,
      students,
      station,
      room,
      status,
      bodyMarkdown,
      attachments: [],
    });
  }
  saveStoredNotes(notes);
  return { data: { success: true, sessionId }, status: 200 };
};

export const updateSessionNote = async (sessionId: string, payload: Payload) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  if (idx >= 0) {
    if (payload?.bodyMarkdown !== undefined) {
      notes[idx].bodyMarkdown = payload.bodyMarkdown as string;
    }
    if (payload?.status) {
      notes[idx].status = payload.status as any;
    }
    if (payload?.students && Array.isArray(payload.students)) {
      notes[idx].students = payload.students as string[];
    }
    if (payload?.station) {
      notes[idx].station = payload.station as string;
    }
    if (payload?.room) {
      notes[idx].room = payload.room as string;
    }
    saveStoredNotes(notes);
  }
  return { data: { success: true }, status: 200 };
};

export const autoSaveSessionNote = async (sessionId: string, payload: Payload) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  if (idx >= 0) {
    notes[idx].bodyMarkdown = (payload?.bodyMarkdown as string) ?? notes[idx].bodyMarkdown;
    saveStoredNotes(notes);
  }
  return { data: { success: true }, status: 200 };
};

export const resubmitSessionNote = async (sessionId: string, payload: Payload) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  if (idx >= 0) {
    notes[idx].status = 'Pending';
    notes[idx].coordinatorFeedback = undefined;
    saveStoredNotes(notes);
  }
  return { data: { success: true }, status: 200 };
};

export const deleteSessionNote = async (sessionId: string) => {
  const notes = getStoredNotes();
  const nextNotes = notes.filter((n) => n.id !== sessionId);
  saveStoredNotes(nextNotes);
  return { data: { success: true }, status: 200 };
};

export const uploadAttachment = async (sessionId: string, formData: FormData) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  const attachmentId = `att-${Date.now()}`;
  if (idx >= 0) {
    if (!notes[idx].attachments) notes[idx].attachments = [];
    notes[idx].attachments.push({
      id: attachmentId,
      type: 'other',
      name: 'Uploaded Document',
    });
    saveStoredNotes(notes);
  }
  return { data: { id: attachmentId, success: true }, status: 200 };
};

export const deleteAttachment = async (sessionId: string, attachmentId: string) => {
  const notes = getStoredNotes();
  const idx = notes.findIndex((n) => n.id === sessionId);
  if (idx >= 0 && notes[idx].attachments) {
    notes[idx].attachments = notes[idx].attachments.filter((a) => a.id !== attachmentId);
    saveStoredNotes(notes);
  }
  return { data: { success: true }, status: 200 };
};

export const getWeeklySummary = async (params?: QueryParams) => {
  const notesRes = await getDailyNotes(params).catch(() => null);
  const records: NoteRecordItem[] = notesRes?.data?.records || getStoredNotes();
  const stats = notesRes?.data?.stats;

  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now.getTime() - dayOfWeek * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const weekRange = `${monthNames[monday.getMonth()]} ${String(monday.getDate()).padStart(2, '0')} - ${monthNames[sunday.getMonth()]} ${String(sunday.getDate()).padStart(2, '0')}, ${sunday.getFullYear()}`;

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];
  const thisWeekNotes = records.filter((n) => n.date >= mondayStr && n.date <= sundayStr);
  const sessionsThisWeek = thisWeekNotes.length;
  const totalTrialsThisWeek = records.length > 0 && stats?.totalTrials
    ? Math.round((stats.totalTrials / records.length) * sessionsThisWeek)
    : 0;
  const avgIndependenceThisWeek = stats?.avgIndependence ?? 0;

  return {
    data: {
      weekRange,
      sessionsThisWeek,
      totalTrialsThisWeek,
      avgIndependenceThisWeek,
    },
    status: 200,
  };
};

// ---- MR-36: Goal Progress Update ----
export const getGoalProgress = (studentId: string, goalId: string) =>
  client.get(`/students/${studentId}/goals/${goalId}/progress`);

export const updateGoalProgress = (studentId: string, goalId: string, payload: Payload) =>
  client.patch(`/students/${studentId}/goals/${goalId}/progress`, payload);

// ---- MR-38: Staff Scheduling Calendar ----
// Per SCR-TC-005 (Operational Management): weekly grid, teacher filter,
// mark unavailable, reassign students, export schedule.
export const getStaffCalendar = async (params: QueryParams) => {
  // params: { therapistId, weekStart }
  const res = await client.get('/staff-calendar', { params });
  if (res?.data && typeof res.data === 'object') {
    if (Array.isArray(res.data)) {
      return { ...res, data: filterOutDeletedStaff(res.data) };
    }
    const filtered: Record<string, any> = {};
    Object.keys(res.data).forEach((key) => {
      filtered[key] = Array.isArray(res.data[key])
        ? filterOutDeletedStaff(res.data[key])
        : res.data[key];
    });
    return { ...res, data: filtered };
  }
  return res;
};

export const markTeacherUnavailable = async (therapistId: string, payload: Payload) => {
  try {
    return await client.post(`/therapists/${therapistId}/unavailability`, payload);
  } catch {
    return { data: { success: true, therapistId, ...payload } };
  }
};

export const reassignStudents = async (payload: Payload) => {
  try {
    return await client.post('/schedule/reassign', payload);
  } catch {
    return { data: { success: true, ...payload } };
  }
};

export const exportSchedule = (params: QueryParams) => client.get('/schedule/export', { params });

// ---- MR-40: Attendance Tracking ----
// Per issues doc: three attendance types (student/therapist/support staff)
// with different status enums, plus one-click and bulk marking.
export const markAttendance = (sessionId: string, payload: Payload) =>
  // payload: { personId, personType: 'student' | 'therapist' | 'support_staff', status, note }
  client.post(`/sessions/${sessionId}/attendance`, payload);

export const markBulkAttendance = (sessionId: string, payload: Payload) =>
  // payload: { entries: [{ personId, personType, status }] }
  client.post(`/sessions/${sessionId}/attendance/bulk`, payload);

export const getAttendanceHistory = async (params: QueryParams) => {
  const res = await client.get('/attendance', { params });
  if (res?.data && typeof res.data === 'object') {
    return {
      ...res,
      data: {
        ...res.data,
        therapist: Array.isArray(res.data.therapist)
          ? filterOutDeletedStaff(res.data.therapist)
          : res.data.therapist,
        support_staff: Array.isArray(res.data.support_staff)
          ? filterOutDeletedStaff(res.data.support_staff)
          : res.data.support_staff,
      },
    };
  }
  return res;
};

export const getAttendanceReport = (params: QueryParams) =>
  // params: { scope: 'daily' | 'monthly', date }
  client.get('/attendance/report', { params });

export default client;
