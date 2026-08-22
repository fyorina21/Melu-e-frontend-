// src/api/resources/parent.ts
//
// Parent-facing endpoints. These map to the parent screens (dashboard,
// child progress, observation log, communication).
// NOTE: the current backend does not implement `/parent/...` routes yet,
// so these are the agreed contracts for when they land. In demo mode the
// fail-fast client rejects immediately and screens use their demo data.

import { http } from '../http/client';
import type { UUID } from './types';

export interface ParentDashboard {
  parentName: string;
  childSummary: {
    id: UUID;
    fullName: string;
    age: number;
    programType: string;
    therapyGroup: string;
    goals: Array<{ id: string; name: string; status: string; progressPercent: number }>;
  } | null;
  sessionsThisWeek: number;
  sessionsTotal: number;
  independencePercent: number;
  unreadCount: number;
  latestMessage: {
    from: string;
    preview: string;
    time: string;
  } | null;
}

export interface ParentGoalProgress {
  id: UUID;
  name: string;
  percent: number;
  status: 'Active' | 'Mastered' | 'In Progress';
  updatedAt: string | null;
}

export interface ParentChildProgress {
  childName: string;
  age: number;
  program: string;
  group: string;
  goals: ParentGoalProgress[];
  sessionsThisMonth: number;
  averageIndependence: number;
  behaviorTrends: Array<{ month: string; incidents: number }>;
  iupStation1: string[];
  iupStation2: string[];
}

export interface ParentObservation {
  id: UUID;
  date: string;
  time: string;
  category: 'Behavior' | 'Achievement' | 'Concern' | 'General';
  text: string;
  status: 'Acknowledged' | 'Pending' | 'Needs Response';
  teamResponse: string | null;
  therapistName: string | null;
  location: string | null;
  duration: string | null;
}

export interface ParentRequestedLog {
  id: UUID;
  requestNote: string;
  suggestedBehavior: string | null;
  suggestedContext: string | null;
}

export interface ParentConversation {
  id: UUID;
  recipient: string;
  role: string;
  unread: number;
  lastMessage: string;
  time: string;
}

export const parentApi = {
  async dashboard(): Promise<ParentDashboard> {
    const { data } = await http.get<ParentDashboard>('/parent/dashboard');
    return data;
  },

  async childProgress(childId: UUID): Promise<ParentChildProgress> {
    const { data } = await http.get<ParentChildProgress>(`/parent/children/${childId}/progress`);
    return data;
  },

  async sessionSummary(sessionId: UUID): Promise<ParentChildProgress> {
    const { data } = await http.get<ParentChildProgress>(`/parent/sessions/${sessionId}/summary`);
    return data;
  },

  async observations(params: { childId?: UUID; category?: string } = {}): Promise<ParentObservation[]> {
    const { data } = await http.get<ParentObservation[]>('/parent/observations', { params });
    return data;
  },

  async createObservation(payload: {
    behavior: string;
    context: string;
    notes: string;
  }): Promise<ParentObservation> {
    const { data } = await http.post<ParentObservation>('/parent/observations', payload);
    return data;
  },

  async requestedLogs(): Promise<ParentRequestedLog[]> {
    const { data } = await http.get<ParentRequestedLog[]>('/parent/observations/requested');
    return data;
  },

  async conversations(): Promise<ParentConversation[]> {
    const { data } = await http.get<ParentConversation[]>('/parent/conversations');
    return data;
  },

  async conversationThread(id: UUID): Promise<ParentConversation> {
    const { data } = await http.get<ParentConversation>(`/parent/conversations/${id}`);
    return data;
  },

  async sendMessage(id: UUID, text: string): Promise<unknown> {
    const { data } = await http.post(`/parent/conversations/${id}/messages`, { text });
    return data;
  },

  async setConversationResolved(id: UUID, resolved: boolean): Promise<unknown> {
    const { data } = await http.post(`/parent/conversations/${id}/status`, { resolved });
    return data;
  },
};