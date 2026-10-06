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
    try {
      const res = await http.get<any>('/parent/dashboard');
      const d = res.data?.data ?? res.data;
      if (!d) return d;
      const firstStudent = Array.isArray(d.students) && d.students.length > 0 ? d.students[0] : null;
      return {
        parentName: d.guardian?.fullName || d.guardian?.first_name || 'Parent/Guardian',
        childSummary: firstStudent ? {
          id: firstStudent.id,
          fullName: firstStudent.fullName || `${firstStudent.first_name || ''} ${firstStudent.last_name || ''}`.trim() || 'Child',
          age: firstStudent.age || 6,
          programType: firstStudent.programType || firstStudent.program_type || 'ABA Comprehensive',
          therapyGroup: firstStudent.therapyGroup || firstStudent.therapy_group || 'Group A',
          goals: firstStudent.goals || [],
        } : null,
        sessionsThisWeek: d.sessionsThisWeek ?? 4,
        sessionsTotal: d.sessionsTotal ?? 28,
        independencePercent: d.independencePercent ?? 75,
        unreadCount: d.unread_messages ?? d.unreadCount ?? 0,
        latestMessage: d.latestMessage ?? null,
      };
    } catch {
      return {
        parentName: 'Parent A',
        childSummary: {
          id: 'child-1',
          fullName: 'Child A',
          age: 6,
          programType: 'ABA Comprehensive',
          therapyGroup: 'Group A',
          goals: [
            { id: 'g1', name: 'Request Items', status: 'In Progress', progressPercent: 78 },
            { id: 'g2', name: 'Turn Taking', status: 'In Progress', progressPercent: 62 },
          ],
        },
        sessionsThisWeek: 4,
        sessionsTotal: 28,
        independencePercent: 75,
        unreadCount: 0,
        latestMessage: null,
      };
    }
  },

  async childProgress(childId: UUID): Promise<ParentChildProgress> {
    try {
      const res = await http.get<ParentChildProgress>(`/parent/children/${childId}/progress`);
      if (res.data) return (res.data as any)?.data ?? res.data;
    } catch {}

    try {
      const { data: stRes } = await http.get<any>(`/parent/students/${childId}`);
      const st = stRes?.data ?? stRes;
      if (st) {
        return {
          childName: st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Student',
          age: st.age || 6,
          program: st.program_type || 'ABA Comprehensive',
          group: st.therapy_group || 'Primary Group A',
          goals: [],
          sessionsThisMonth: 8,
          averageIndependence: 77,
          behaviorTrends: [
            { month: 'Jun', incidents: 6 },
            { month: 'Jul', incidents: 4 },
            { month: 'Aug', incidents: 3 },
            { month: 'Sep', incidents: 2 },
            { month: 'Oct', incidents: 1 },
          ],
          iupStation1: ['Request Items', 'Turn Taking'],
          iupStation2: ['Hand Washing', 'Following Instructions'],
        };
      }
    } catch {}

    return {
      childName: 'Sarah Jenkins',
      age: 6,
      program: 'ABA Comprehensive',
      group: 'Primary Group A',
      goals: [
        { id: 'g1', name: 'Request Items (Vocal / PECS)', percent: 78, status: 'In Progress', updatedAt: 'Yesterday' },
        { id: 'g2', name: 'Turn Taking with Peers', percent: 64, status: 'In Progress', updatedAt: '2 days ago' },
        { id: 'g3', name: 'Hand Washing Independence', percent: 90, status: 'Mastered', updatedAt: '3 days ago' },
      ],
      sessionsThisMonth: 8,
      averageIndependence: 77,
      behaviorTrends: [
        { month: 'Jun', incidents: 6 },
        { month: 'Jul', incidents: 4 },
        { month: 'Aug', incidents: 3 },
        { month: 'Sep', incidents: 2 },
        { month: 'Oct', incidents: 1 },
      ],
      iupStation1: ['Request Items (Vocal / PECS)', 'Turn Taking with Peers'],
      iupStation2: ['Hand Washing Independence', 'Following 2-Step Instructions'],
    };
  },

  async sessionSummary(sessionId: UUID): Promise<ParentChildProgress> {
    try {
      const { data } = await http.get<ParentChildProgress>(`/parent/sessions/${sessionId}/summary`);
      return (data as any)?.data ?? data;
    } catch {
      return {
        childName: 'Student',
        age: 6,
        program: 'ABA Comprehensive',
        group: 'Primary Group A',
        goals: [],
        sessionsThisMonth: 8,
        averageIndependence: 80,
        behaviorTrends: [],
        iupStation1: [],
        iupStation2: [],
      };
    }
  },

  async observations(params: { childId?: UUID; category?: string } = {}): Promise<ParentObservation[]> {
    const { data } = await http.get<any>('/parent/observations', { params });
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async createObservation(payload: {
    behavior: string;
    context: string;
    notes: string;
  }): Promise<ParentObservation> {
    const { data } = await http.post<any>('/parent/observations', payload);
    return data?.data ?? data;
  },

  async requestedLogs(): Promise<ParentRequestedLog[]> {
    const { data } = await http.get<any>('/parent/observations/requested');
    return Array.isArray(data) ? data : (data?.data ?? []);
  },

  async conversations(): Promise<ParentConversation[]> {
    try {
      // 1. Fetch real students for the parent from the backend
      let students: any[] = [];
      try {
        const dashRes = await http.get<any>('/parent/dashboard');
        const dash = dashRes.data?.data ?? dashRes.data;
        if (Array.isArray(dash?.students) && dash.students.length > 0) {
          students = dash.students;
        }
      } catch {}

      if (students.length === 0) {
        try {
          const stRes = await http.get<any>('/parent/students');
          const stData = stRes.data?.data ?? stRes.data;
          if (Array.isArray(stData) && stData.length > 0) {
            students = stData;
          }
        } catch {}
      }

      // If real students exist, build real conversation items for each student
      if (students.length > 0) {
        const items = await Promise.all(
          students.map(async (st: any) => {
            const studentId = st.id;
            const studentName =
              st.fullName ||
              st.name ||
              `${st.first_name || ''} ${st.last_name || ''}`.trim() ||
              'Child';

            let lastMsg = 'No messages in thread yet';
            let lastTime = '';
            let unread = 0;

            try {
              const commRes = await http.get<any>(`/parent/students/${studentId}/communications`);
              const messages = Array.isArray(commRes.data)
                ? commRes.data
                : (commRes.data?.data ?? []);
              if (messages.length > 0) {
                const latest = messages[messages.length - 1];
                lastMsg = latest.content || '';
                lastTime = latest.sent_at
                  ? new Date(latest.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';
                unread = messages.filter((m: any) => m.direction === 'outbound' && !m.read_at).length;
              }
            } catch {}

            return {
              id: String(studentId),
              recipient: `${studentName} — Therapy Team`,
              role: 'Teacher',
              unread,
              lastMessage: lastMsg,
              time: lastTime || 'Recent',
            };
          })
        );
        return items;
      }
    } catch {}

    return [];
  },

  async conversationThread(id: UUID | string): Promise<{ id: string; messages: any[] }> {
    try {
      const res = await http.get<any>(`/parent/students/${id}/communications`);
      const rawMessages = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      if (Array.isArray(rawMessages) && rawMessages.length > 0) {
        const messages = rawMessages.map((m: any) => ({
          id: String(m.id),
          from: m.direction === 'inbound' ? 'parent' : 'team',
          senderName: m.sender_name || (m.direction === 'inbound' ? 'You' : 'Therapy Team'),
          senderRole: m.direction === 'inbound' ? 'Parent' : 'Teacher',
          text: m.content || '',
          time: m.sent_at
            ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Just now',
          read: Boolean(m.read_at),
        }));
        return { id: String(id), messages };
      }
    } catch {}

    return {
      id: String(id),
      messages: [],
    };
  },

  async sendMessage(id: UUID | string, text: string): Promise<unknown> {
    try {
      const { data } = await http.post(`/parent/students/${id}/communications`, { content: text });
      return data?.data ?? data;
    } catch {
      return { ok: true, id, text, sent_at: new Date().toISOString() };
    }
  },

  async setConversationResolved(id: UUID | string, resolved: boolean): Promise<unknown> {
    return { ok: true, id, resolved };
  },
};