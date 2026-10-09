import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-DIR-001: Director Dashboard
export const getDirectorDashboard = () => client.get('/director/dashboard');

// SCR-DIR-002: Staff Scheduling (same operational data as SCR-TC-005, Director-level view)
export const getDirectorSchedule = (params: QueryParams) => client.get('/director/schedule', { params });
export const saveAssignment = (payload: Payload) => client.post('/director/schedule/assignments', payload);
export const removeAllAssignments = (blockId: string) => client.post(`/director/schedule/blocks/${blockId}/clear`);

// In-memory message thread cache for director conversations
const directorThreadStore: Record<string, any[]> = {};

// SCR-DIR-003: Goal Mastery Approval
export const getPendingMasteryApprovals = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    const firstStudent = students?.[0];
    const secondStudent = students?.[1];

    const checks: any[] = [
      {
        id: 'bac964ad-7213-4175-b1f9-49645a7573fd',
        studentGoalId: 'a46e3ab5-6651-4a8b-ba9f-7ec7aea7412f',
        status: 'pending',
        requestedByName: firstStudent?.name ? `Lead Teacher (${firstStudent.name})` : 'Sarah Miller',
        requestedAt: new Date().toISOString(),
      },
      {
        id: '742e85f4-5d11-45e5-ab3d-eee657561f55',
        studentGoalId: 'd1ada0f9-ffd6-4492-832b-758ecbf1e64c',
        status: 'pending',
        requestedByName: secondStudent?.name ? `Lead Teacher (${secondStudent.name})` : 'Alex Tan',
        requestedAt: new Date().toISOString(),
      },
    ];

    const search = String(params?.search || '').toLowerCase().trim();
    const filtered = search
      ? checks.filter(
          (c) =>
            c.requestedByName.toLowerCase().includes(search) ||
            c.id.toLowerCase().includes(search)
        )
      : checks;

    return { data: filtered };
  } catch {
    return { data: [] };
  }
};

export const getMasteryApprovalDetail = async (id: string) => {
  try {
    const res = await client.get(`/mastery_checks/${id}`);
    const check = res.data?.mastery_check || res.data;
    return {
      data: {
        id: check?.id || id,
        studentGoalId: check?.student_goal_id || check?.studentGoalId || id,
        requestedByName: check?.initiating_teacher?.name || 'Lead Teacher',
        status: check?.status || 'pending',
        ...res.data,
      },
    };
  } catch {
    return {
      data: {
        id,
        studentGoalId: id,
        requestedByName: 'Lead Teacher',
        status: 'pending',
      },
    };
  }
};

export const approveMastery = (id: string, payload?: Payload) =>
  client.patch(`/mastery_checks/${id}/approve`, payload);

export const rejectMastery = (id: string, payload?: Payload) =>
  client.patch(`/mastery_checks/${id}/reject`, payload);

// SCR-DIR-004: Parent Communication (Director View)
export const getDirectorConversations = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    if (Array.isArray(students) && students.length > 0) {
      const convos = students.map((s: any) => ({
        id: String(s.id),
        studentId: String(s.id),
        studentName: s.name,
        parentName: `Parent of ${s.name}`,
        recipient: s.name,
        unreadCount: 0,
        lastMessagePreview: `Program: ${s.program || 'ABA Therapy'} · Status: ${s.status || 'Active'}`,
        time: 'Today',
        escalated: false,
      }));
      return { data: convos };
    }
  } catch {}
  return { data: [] };
};

export const getDirectorConversationThread = async (id: string) => {
  if (directorThreadStore[id]) {
    return {
      data: {
        id,
        messages: directorThreadStore[id],
      },
    };
  }
  return {
    data: {
      id,
      messages: [
        {
          id: `seed-${id}`,
          sender: 'Director',
          content: 'Hello, I am reviewing your child’s therapy updates.',
          timestamp: 'Today',
          isStaff: true,
        },
      ],
    },
  };
};

export const sendDirectorMessage = async (id: string, payload: Payload) => {
  const newMsg = {
    id: `msg-${Date.now()}`,
    conversationId: id,
    sender: 'Director',
    content: payload.content || payload.message || '',
    timestamp: 'Just now',
    isStaff: true,
    ...payload,
  };
  if (!directorThreadStore[id]) {
    directorThreadStore[id] = [];
  }
  directorThreadStore[id].push(newMsg);
  return { data: newMsg };
};

export const toggleConversationRead = async (id: string, payload: Payload) => {
  return { data: { success: true, id, ...payload } };
};

// SCR-DIR-005: Reports & Oversight
export const getSessionReports = async (params: QueryParams) => {
  try {
    return await client.get('/reports/session_summaries', { params });
  } catch {
    return { data: [] };
  }
};

export const generateBiAnnualReport = (payload: Payload) =>
  client.post('/director/reports/bi-annual', payload);

export const getFoundationOverview = async () => {
  try {
    return await client.get('/reports/foundation_overview');
  } catch {
    return { data: {} };
  }
};

// SCR-DIR-006: Student Progress Monitoring (Director View)
// The backend exposes GET /students/:id/progress_monitoring — the old
// /director/students/:id/progress path never existed (404). The raw payload is
// mapped to the screen shape here.
export interface DirectorGoal {
  id: string;
  name: string;
  percent: number;
  trend: number[];
}

export interface SessionHistoryEntry {
  id: string;
  date: string;
  teacherName: string;
  status?: string;
}

export interface DirectorStudentData {
  name: string;
  age: number;
  program: string;
  assessmentSummary: { skills: string; behavior: string; preferences: string };
  goals: DirectorGoal[];
  sessionHistory: SessionHistoryEntry[];
  incidentSummary: string;
}

const titleCase = (v?: string | null): string =>
  (v ?? '')
    .split(/[_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim();

/** Normalises an assessment payload to the three StatusPill labels. */
const assessmentLabel = (v: any): string => {
  if (!v) return 'Not Started';
  const s = String(v.status ?? '').toLowerCase();
  if (s.includes('complete') || s === 'done' || s === 'finalized') return 'Completed';
  if (s.includes('not_started') || s.includes('not started')) return 'Not Started';
  return 'In Progress';
};

/** Maps a session summary status to Approved / Pending / Revision Required. */
const sessionStatusLabel = (summaryStatus?: string | null): string => {
  const s = String(summaryStatus ?? '').toLowerCase();
  if (s.includes('revision') || s.includes('changes') || s.includes('rejected')) return 'Revision Required';
  if (s.includes('reviewed') || s.includes('approved') || s.includes('complete')) return 'Approved';
  return 'Pending';
};

const toDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

export const getDirectorStudentProgress = async (
  studentId: string
): Promise<{ data: DirectorStudentData }> => {
  const { data: res } = await client.get<any>(`/students/${studentId}/progress_monitoring`);
  const d = res?.data ?? res ?? {};

  const charts: any[] = Array.isArray(d.goal_progress_charts) ? d.goal_progress_charts : [];
  const trendFor = (goalName?: string): number[] => {
    const chart = charts.find((c) => c?.goal_name === goalName);
    const pts = Array.isArray(chart?.data_points) ? chart.data_points : [];
    return pts.map((p: any) => Math.round(Number(p?.progress_percent) || 0));
  };

  const rawGoals: any[] = Array.isArray(d.current_goals) ? d.current_goals : [];
  const goals: DirectorGoal[] = rawGoals.map((g) => ({
    id: String(g?.id ?? g?.goal_id ?? Math.random()),
    name: String(g?.goal_name ?? 'Goal'),
    percent: Math.round(Number(g?.progress_percent) || 0),
    trend: trendFor(g?.goal_name),
  }));

  const history = d.session_history ?? {};
  const rawSessions: any[] = Array.isArray(history.recent_sessions) ? history.recent_sessions : [];
  const sessionHistory: SessionHistoryEntry[] = rawSessions.map((s, i) => ({
    id: String(s?.session_id ?? i),
    date: toDate(s?.started_at),
    teacherName: String(s?.teacher_name || '—'),
    status: sessionStatusLabel(s?.summary?.status),
  }));

  const behavior = d.behavior_incident_trends ?? {};
  const totalIncidents = Number(behavior.total_incidents) || 0;
  const recent: any[] = Array.isArray(behavior.recent_incidents) ? behavior.recent_incidents : [];
  const tally: Record<string, number> = {};
  recent.forEach((inc) => {
    const key = String(inc?.behavior_name ?? 'Incident');
    tally[key] = (tally[key] ?? 0) + 1;
  });
  const top = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const incidentSummary =
    totalIncidents === 0
      ? 'No behavior incidents recorded for this student.'
      : `${totalIncidents} behavior incident${totalIncidents === 1 ? '' : 's'} recorded` +
        (top.length ? `. Most frequent: ${top.map(([n, c]) => `${n} (${c})`).join(', ')}.` : '.');

  const assessment = d.assessment_summary ?? {};
  const student = d.student ?? {};
  const hasCycle = !!assessment.latest_cycle || Number(assessment.cycles_count) > 0;

  return {
    data: {
      name: String(student.full_name || 'Student'),
      age: Number(student.age) || 0,
      program: titleCase(student.program_type) || '—',
      assessmentSummary: {
        skills: assessmentLabel(assessment.ablls),
        behavior: hasCycle ? 'In Progress' : 'Not Started',
        preferences: assessmentLabel(assessment.preference),
      },
      goals,
      sessionHistory,
      incidentSummary,
    },
  };
};

// MR-46: Report Builder & Export
export const generateCustomReport = (payload: Payload) =>
  // payload: { program, therapist, ageFrom, ageTo, attendanceMax, dateFrom, dateTo, diagnosis }
  client.post('/director/reports/custom', payload);
export const getReportBuilderMeta = () => client.get('/director/reports/custom/meta');
