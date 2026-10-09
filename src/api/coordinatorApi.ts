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
export const getPendingSummaries = (params: QueryParams) => client.get('/coordinator/summaries/pending', { params });
export const approveSummary = (summaryId: string, payload: Payload) =>
  client.post(`/coordinator/summaries/${summaryId}/approve`, payload);
export const requestSummaryChanges = (summaryId: string, payload: Payload) =>
  client.post(`/coordinator/summaries/${summaryId}/request-changes`, payload);
export const bulkApproveSummaries = (summaryIds: string[]) =>
  client.post('/coordinator/summaries/bulk-approve', { summaryIds });

// SCR-TC-004: Student Progress Monitoring
export const getStudentProgressOverview = (studentId: string) =>
  client.get(`/coordinator/students/${studentId}/progress`);
export const flagStudent = (studentId: string, payload: Payload) =>
  client.post(`/coordinator/students/${studentId}/flag`, payload);

// SCR-TC-005: Operational Management (also used by MR-38 scheduling)
export const getOperationalSchedule = (params: QueryParams) =>
  client.get('/coordinator/operational-schedule', { params });
export const getTeacherPerformanceMetrics = (params: QueryParams) => client.get('/coordinator/teachers/metrics', { params });

// In-memory message thread store for coordinator communications
const coordinatorThreadStore: Record<string, any[]> = {};

// SCR-TC-006: Parent Communication (Coordinator View)
export const getCoordinatorConversations = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    if (Array.isArray(students) && students.length > 0) {
      const convos = students.map((s: any) => ({
        id: String(s.id),
        studentId: String(s.id),
        studentName: s.name,
        parentName: `Parent of ${s.name}`,
        recipient: s.name,
        role: 'Parent',
        unread: 0,
        lastMessage: `Program: ${s.program || 'ABA Therapy'} · Status: ${s.status || 'Active'}`,
        time: 'Today',
      }));
      return { data: convos };
    }
  } catch {}
  return { data: [] };
};

export const getConversationThread = async (conversationId: string) => {
  if (coordinatorThreadStore[conversationId]) {
    return {
      data: {
        id: conversationId,
        messages: coordinatorThreadStore[conversationId],
      },
    };
  }
  return {
    data: {
      id: conversationId,
      messages: [
        {
          id: `seed-${conversationId}`,
          sender: 'Coordinator',
          content: 'Hello, this is the Therapy Coordinator regarding scheduling and care.',
          timestamp: 'Today',
          isStaff: true,
        },
      ],
    },
  };
};

export const sendCoordinatorMessage = async (conversationId: string, payload: Payload) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId,
    sender: 'Coordinator',
    content: payload.content || payload.message || '',
    timestamp: 'Just now',
    isStaff: true,
    ...payload,
  };
  if (!coordinatorThreadStore[conversationId]) {
    coordinatorThreadStore[conversationId] = [];
  }
  coordinatorThreadStore[conversationId].push(newMsg);
  return { data: newMsg };
};

export const escalateConversation = async (conversationId: string, payload: Payload) => {
  return { data: { success: true, conversationId, ...payload } };
};

export const markConversationResolved = async (conversationId: string) => {
  return { data: { success: true, conversationId, resolved: true } };
};

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

export const getCoordinatorNotifications = () => client.get('/notifications');
export const markCoordinatorNotificationRead = (notificationId: string) =>
  client.post(`/notifications/${notificationId}/mark_as_read`);
