import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-TC-001: Dashboard
export const getCoordinatorDashboard = () => client.get('/coordinator/dashboard');

// SCR-TC-002: Live Session Monitoring
export const getActiveSessions = (params: QueryParams) => client.get('/coordinator/sessions/active', { params });
export const sendAlertToTeacher = (sessionId: string, payload: Payload) =>
  client.post(`/coordinator/sessions/${sessionId}/alert`, payload);
export const exportSessionLog = (params: QueryParams) => client.get('/coordinator/sessions/export', { params });

// SCR-TC-003: Session Summary Review
export const getPendingSummaries = (params: QueryParams) =>
  client.get('/therapy_coordinator/session_summaries', { params });

export const approveSummary = (summaryId: string, _payload?: Payload) =>
  client.patch(`/therapy_coordinator/session_summaries/${summaryId}/review`);

export const requestSummaryChanges = (_summaryId: string, _payload?: Payload): Promise<never> =>
  Promise.reject(new Error('Requesting changes is not supported by the backend yet'));

export const bulkApproveSummaries = async (summaryIds: string[]) => {
  const results = await Promise.allSettled(
    summaryIds.map((id) => client.patch(`/therapy_coordinator/session_summaries/${id}/review`))
  );
  const successful = summaryIds.filter((_, i) => results[i].status === 'fulfilled');
  return { successful, failedCount: summaryIds.length - successful.length };
};

// SCR-TC-004: Student Progress Monitoring
export const getStudentProgressOverview = (studentId: string) =>
  client.get(`/coordinator/students/${studentId}/progress`);
export const flagStudent = (studentId: string, payload: Payload) =>
  client.post(`/coordinator/students/${studentId}/flag`, payload);

// SCR-TC-005: Operational Management (also used by MR-38 scheduling)
export const getOperationalSchedule = (params: QueryParams) =>
  client.get('/therapy_coordinator/operational_management', { params });

export const getUnassignedAlerts = (params: QueryParams) =>
  client.get('/therapy_coordinator/operational_management/unassigned_alerts', { params });

export const reassignStudentsLive = (payload: { assignments: { assignment_id: string; new_teacher_id: string }[] }) =>
  client.post('/therapy_coordinator/operational_management/reassign', payload);

export const markTeacherUnavailableLive = (payload: { teacher_id: string; date: string; reason: string }) =>
  client.post('/therapy_coordinator/staff_availabilities', payload);

export const getTeacherPerformanceMetrics = (params: QueryParams) => client.get('/coordinator/teachers/metrics', { params });

// SCR-TC-006: Parent Communication (Coordinator View)
export const getCoordinatorConversations = (params: QueryParams) => client.get('/coordinator/conversations', { params });
export const getConversationThread = (conversationId: string) =>
  client.get(`/coordinator/conversations/${conversationId}`);
export const sendCoordinatorMessage = (conversationId: string, payload: Payload) =>
  client.post(`/coordinator/conversations/${conversationId}/messages`, payload);
export const escalateConversation = (conversationId: string, payload: Payload) =>
  // payload: { to: 'program_director' | 'director', note }
  client.post(`/coordinator/conversations/${conversationId}/escalate`, payload);
export const markConversationResolved = (conversationId: string) =>
  client.post(`/coordinator/conversations/${conversationId}/resolve`);

// MR-16/18/19: Student Enrollment & Profile
export const getEnrollmentStudents = (params: QueryParams) =>
  // params: { search, program, therapist, status, diagnosis }
  client.get('/coordinator/students', { params });
export const createStudentEnrollment = (payload: Payload) =>
  client.post('/coordinator/students', payload);
export const getStudentProfile = (studentId: string) =>
  client.get(`/coordinator/students/${studentId}/profile`);
export const updateStudentProfile = (studentId: string, payload: Payload) =>
  client.patch(`/coordinator/students/${studentId}/profile`, payload);

// Therapist Workload Dashboard
export const getWorkloadDashboard = () => client.get('/coordinator/teachers/workload');
export const getWorkloadTrend = () => client.get('/coordinator/teachers/workload/trend');

// MR-41: Room & Resource Scheduling
export const getRoomsResources = (params: QueryParams) =>
  // params: { date }
  client.get('/coordinator/rooms-resources', { params });
export const updateRoomStatus = (roomId: string, payload: Payload) =>
  // payload: { status: 'Available' | 'In Session' | 'Maintenance' }
  client.patch(`/coordinator/rooms/${roomId}`, payload);
export const updateResourceStatus = (resourceId: string, payload: Payload) =>
  // payload: { inUse }
  client.patch(`/coordinator/resources/${resourceId}`, payload);

export const getCoordinatorNotifications = () => client.get('/coordinator/notifications');
