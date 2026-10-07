import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-PAR-001: Parent Dashboard
export const getParentDashboard = () => client.get('/parent/dashboard');

// SCR-PAR-002: Child Progress View
export const getChildProgress = (childId: string) => client.get(`/parent/children/${childId}/progress`);
export const getSessionSummaryForParent = (sessionId: string) => client.get(`/parent/sessions/${sessionId}/summary`);

// SCR-PAR-003: Home Observation Log
export const getObservations = (params: QueryParams) => client.get('/parent/observations', { params });
export const createObservation = (payload: Payload) => client.post('/parent/observations', payload);
export const getRequestedLogs = () => client.get('/parent/observations/requested');

// SCR-PAR-004: Parent Communication
export const getParentConversations = async () => {
  const { parentApi } = await import('./resources/parent');
  const convos = await parentApi.conversations();
  return { data: convos };
};

export const getParentConversationThread = async (id: string) => {
  const { parentApi } = await import('./resources/parent');
  const thread = await parentApi.conversationThread(id);
  return { data: thread };
};

export const sendParentMessage = async (id: string, payload: Payload) => {
  const { parentApi } = await import('./resources/parent');
  const res = await parentApi.sendMessage(id, (payload.content || payload.text || '') as string);
  return { data: res };
};

export const setParentConversationResolved = async (id: string, resolved: boolean) => {
  const { parentApi } = await import('./resources/parent');
  const res = await parentApi.setConversationResolved(id, resolved);
  return { data: res };
};

// MR-51/52: Announcements & Notifications (Parent view - user-scoped backend route)
export const getParentNotifications = () => client.get('/notifications');
export const markParentNotificationRead = (notificationId: string) =>
  client.post(`/notifications/${notificationId}/mark_as_read`);
