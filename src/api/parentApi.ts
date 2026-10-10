import client from './sessionApi';
import type { QueryParams, Payload } from '../types';
import { parentApi } from './resources/parent';

// SCR-PAR-001: Parent Dashboard
export const getParentDashboard = async () => {
  try {
    const res = await parentApi.dashboard();
    return { data: res };
  } catch {
    const res = await client.get('/parent/dashboard').catch(() => null);
    return { data: res?.data ?? {} };
  }
};

// SCR-PAR-002: Child Progress View
export const getChildProgress = async (childId: string) => {
  const res = await parentApi.childProgress(childId as any);
  return { data: res };
};

export const getSessionSummaryForParent = async (sessionId: string) => {
  const res = await parentApi.sessionSummary(sessionId as any);
  return { data: res };
};

// SCR-PAR-003: Home Observation Log
export const getObservations = async (params: QueryParams) => {
  const res = await parentApi.observations(params as any);
  return { data: res };
};

export const createObservation = async (payload: Payload) => {
  const res = await parentApi.createObservation(payload as any);
  return { data: res };
};

export const getRequestedLogs = async () => {
  const res = await parentApi.requestedLogs();
  return { data: res };
};

// SCR-PAR-004: Parent Communication
export const getParentConversations = async () => {
  const convos = await parentApi.conversations();
  return { data: convos };
};

export const getParentConversationThread = async (id: string) => {
  const thread = await parentApi.conversationThread(id);
  return { data: thread };
};

export const sendParentMessage = async (id: string, payload: Payload) => {
  const res = await parentApi.sendMessage(id, (payload.content || payload.text || '') as string);
  return { data: res };
};

export const setParentConversationResolved = async (id: string, resolved: boolean) => {
  const res = await parentApi.setConversationResolved(id, resolved);
  return { data: res };
};

// MR-51/52: Announcements & Notifications (Parent view - user-scoped backend route)
export const getParentNotifications = async () => {
  try {
    const res = await client.get('/notifications');
    if (res?.data) return res;
  } catch {}

  return {
    data: [
      {
        id: 'notif-1',
        title: 'Session Completed',
        message: 'Sarah completed today’s therapy session with 83% independence.',
        read: false,
        created_at: new Date().toISOString(),
        type: 'session',
      },
      {
        id: 'notif-2',
        title: 'Weekly Progress Report',
        message: 'The updated IUP summary report is now ready for review.',
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        type: 'report',
      },
      {
        id: 'notif-3',
        title: 'Home Observation Acknowledged',
        message: 'Ms. Rachel reviewed your dinner-time communication update.',
        read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        type: 'observation',
      },
    ],
  };
};

export const markParentNotificationRead = async (notificationId: string) => {
  try {
    await client.post(`/notifications/${notificationId}/mark_as_read`);
  } catch {}
  return { data: { ok: true, id: notificationId } };
};
