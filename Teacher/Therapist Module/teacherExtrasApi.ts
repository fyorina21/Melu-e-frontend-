// api/teacherExtrasApi.ts
//
// Covers the Teacher-facing Dashboard, Assessments, and ABC Log screens.
// These were originally Fyori's (Dashboard) and Hanania's (Assessments,
// ABC Log) tickets, not Daily Operations - built here now that the whole
// project is in scope. Kept in a separate file from sessionApi.ts per the
// "one API file per module" convention in PROJECT_NOTES.md.

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

// MR-22/23/24/25: 6-Week Assessment forms
export const getSkillsAssessment = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/assessments/skills`);
export const saveSkillsAssessment = (studentId: string, payload: Record<string, unknown>) =>
  client.post(`/teacher/students/${studentId}/assessments/skills`, payload);
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

export const getTeacherStudentProfile = (studentId: string) =>
  client.get(`/teacher/students/${studentId}/profile`);

// MR-52: Notifications (Teacher view)
export const getTeacherNotifications = () => client.get('/teacher/notifications');
export const markNotificationRead = (notificationId: string) =>
  client.post(`/teacher/notifications/${notificationId}/read`);

// SCR-TEA-005: Parent Communication (Teacher view)
export const getTeacherConversations = (params: QueryParams) =>
  client.get('/teacher/conversations', { params });
export const getTeacherConversationThread = (conversationId: string) =>
  client.get(`/teacher/conversations/${conversationId}`);
export const sendTeacherMessage = (conversationId: string, payload: Payload) =>
  client.post(`/teacher/conversations/${conversationId}/messages`, payload);
export const escalateTeacherConversation = (conversationId: string, payload: Payload) =>
  client.post(`/teacher/conversations/${conversationId}/escalate`, payload);
export const markTeacherConversationResolved = (conversationId: string) =>
  client.post(`/teacher/conversations/${conversationId}/resolve`);
