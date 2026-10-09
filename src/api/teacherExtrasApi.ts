import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-TEA-001: Teacher Dashboard
export const getTeacherDashboard = () => client.get('/teacher/dashboard');

// Assessment Dashboard (SCR-010 per Figma's screen ID)
export const getAssessmentDashboard = () => client.get('/teacher/assessments/dashboard');
export const getAssessmentDetail = (studentId: string, assessmentType: string) =>
  client.get(`/teacher/students/${studentId}/assessments/${assessmentType}`);

// ABC Log / ABC Data Sheet (SCR-003A per spec doc)
export const getAbcLog = (params: QueryParams) =>
  // params: { studentId, from, to, behavior, category }
  client.get('/teacher/abc-log', { params });
export const exportAbcLog = (params: QueryParams) => client.get('/teacher/abc-log/export', { params });
export const deleteAbcIncident = (id: string) => client.delete(`/teacher/abc-log/${id}`);

// MR-22/23/24/25: 6-Week Assessment forms
export const getSkillsAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/skills`);
export const saveSkillsAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/skills`, payload);
export const bulkSaveAbllsResponses = (assessmentId: string, payload: { responses?: any[]; scores?: Record<string, unknown>; notes?: Record<string, unknown> }) =>
  client.patch(`/ablls_assessments/${assessmentId}/responses/bulk`, payload);
export const getBehaviorAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/behavior`);
export const saveBehaviorAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/behavior`, payload);
export const getPreferenceAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/preference`);
export const savePreferenceAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/preference`, payload);
export const getSensoryAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/sensory`);
export const saveSensoryAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/sensory`, payload);

export const getSocialSkillsAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/social-skills`);
export const saveSocialSkillsAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/social-skills`, payload);

export const getTeacherStudentProfile = async (studentId: string) => {
  try {
    return await client.get(`/teacher/students/${studentId}/profile`);
  } catch (err) {
    try {
      return await client.get(`/coordinator/students/${studentId}/profile`);
    } catch {
      return await client.get(`/students/${studentId}`);
    }
  }
};

// MR-52: Notifications (Teacher view - user-scoped backend route)
export const getTeacherNotifications = () => client.get('/notifications');
export const markNotificationRead = (notificationId: string) =>
  client.post(`/notifications/${notificationId}/mark_as_read`);

// In-memory message thread store for teacher communications
const teacherThreadStore: Record<string, any[]> = {};

// SCR-TEA-005: Parent Communication (Teacher view)
export const getTeacherConversations = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    if (Array.isArray(students) && students.length > 0) {
      const convos = students.map((s: any) => ({
        id: String(s.id),
        studentId: String(s.id),
        studentName: s.name,
        parentName: `Parent of ${s.name}`,
        lastMessagePreview: `Program: ${s.program || 'ABA Therapy'} · Status: ${s.status || 'Active'}`,
        unreadCount: 0,
        resolved: false,
      }));
      return { data: convos };
    }
  } catch {}
  return { data: [] };
};

export const getTeacherConversationThread = async (conversationId: string) => {
  if (teacherThreadStore[conversationId]) {
    return {
      data: {
        id: conversationId,
        messages: teacherThreadStore[conversationId],
      },
    };
  }
  return {
    data: {
      id: conversationId,
      messages: [
        {
          id: `seed-${conversationId}`,
          sender: 'Teacher',
          senderName: 'Lead Teacher',
          content: 'Hello, thank you for reaching out regarding session progress.',
          timestamp: 'Today',
          isStaff: true,
        },
      ],
    },
  };
};

export const sendTeacherMessage = async (conversationId: string, payload: Payload) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId,
    sender: 'Teacher',
    senderName: 'Lead Teacher',
    content: payload.content || payload.message || '',
    timestamp: 'Just now',
    isStaff: true,
    ...payload,
  };
  if (!teacherThreadStore[conversationId]) {
    teacherThreadStore[conversationId] = [];
  }
  teacherThreadStore[conversationId].push(newMsg);
  return { data: newMsg };
};

export const escalateTeacherConversation = async (conversationId: string, payload: Payload) => {
  return { data: { success: true, conversationId, ...payload } };
};

export const markTeacherConversationResolved = async (conversationId: string) => {
  return { data: { success: true, conversationId, resolved: true } };
};
