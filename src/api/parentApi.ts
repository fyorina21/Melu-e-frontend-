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
export const getParentConversations = () => client.get('/parent/conversations');
export const getParentConversationThread = (id: string) => client.get(`/parent/conversations/${id}`);
export const sendParentMessage = (id: string, payload: Payload) => client.post(`/parent/conversations/${id}/messages`, payload);
export const setParentConversationResolved = (id: string, resolved: boolean) =>
  client.post(`/parent/conversations/${id}/status`, { resolved });

// MR-51/52: Announcements & Notifications (Parent view)
export const getParentNotifications = () => client.get('/parent/notifications');
export const markParentNotificationRead = (notificationId: string) =>
  client.post(`/parent/notifications/${notificationId}/read`);
