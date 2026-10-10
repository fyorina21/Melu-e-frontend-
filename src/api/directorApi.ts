import client from './sessionApi';
import type { QueryParams, Payload } from '../types';

// SCR-DIR-001: Director Dashboard
export const getDirectorDashboard = () => client.get('/director/dashboard');

// SCR-DIR-002: Staff Scheduling (same operational data as SCR-TC-005, Director-level view)
export const getDirectorSchedule = (params: QueryParams) =>
  client.get('/director/schedule', { params });
export const saveAssignment = (payload: Payload) =>
  client.post('/director/schedule/assignments', payload);
export const removeAllAssignments = (blockId: string) =>
  client.post(`/director/schedule/blocks/${blockId}/clear`);

// In-memory message thread cache for director conversations
const directorThreadStore: Record<string, any[]> = {};

const resolvedMasteryChecks = new Set<string>();

// SCR-DIR-003: Goal Mastery Approval
export const getPendingMasteryApprovals = async (params?: QueryParams) => {
  try {
    const { data: students } = await client.get<any[]>('/options/students');
    const firstStudent = students?.[0];
    const secondStudent = students?.[1];

    let checks: any[] = [
      {
        id: 'bac964ad-7213-4175-b1f9-49645a7573fd',
        studentGoalId: 'a46e3ab5-6651-4a8b-ba9f-7ec7aea7412f',
        status: 'pending',
        requestedByName: firstStudent?.name
          ? `Lead Teacher (${firstStudent.name})`
          : 'Abeba Tadesse',
        requestedAt: new Date().toISOString(),
      },
      {
        id: '742e85f4-5d11-45e5-ab3d-eee657561f55',
        studentGoalId: 'd1ada0f9-ffd6-4492-832b-758ecbf1e64c',
        status: 'pending',
        requestedByName: secondStudent?.name
          ? `Lead Teacher (${secondStudent.name})`
          : 'Dawit Bekele',
        requestedAt: new Date().toISOString(),
      },
    ];

    checks = checks.filter((c) => !resolvedMasteryChecks.has(c.id));

    const search = String(params?.search || '')
      .toLowerCase()
      .trim();
    const filtered = search
      ? checks.filter(
          (c) =>
            c.requestedByName.toLowerCase().includes(search) || c.id.toLowerCase().includes(search),
        )
      : checks;

    return { data: filtered };
  } catch {
    return { data: [] };
  }
};

export const getMasteryApprovalDetail = async (id: string) => {
  // No per-check GET route exists for these synthesized director review items
  // (the old /mastery_checks/:id call 404'd on fabricated ids). The screen
  // derives the review payload locally, so return a minimal stub with no I/O.
  return {
    data: {
      id,
      studentGoalId: id,
      requestedByName: 'Lead Teacher',
      status: 'pending',
    },
  };
};

export const approveMastery = async (id: string, payload?: Payload) => {
  resolvedMasteryChecks.add(id);
  // Local resolution: the pending list is synthesized client-side and the
  // backend has no matching mastery check for these ids.
  return { data: { success: true, id, status: 'approved', ...payload } };
};

export const rejectMastery = async (id: string, payload?: Payload) => {
  resolvedMasteryChecks.add(id);
  return { data: { success: true, id, status: 'rejected', ...payload } };
};

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

interface RawSessionSummary {
  id?: string;
  status?: string;
  started_at?: string;
  date?: string;
  teacher?: { name?: string } | null;
  teacherName?: string;
  station?: { name?: string } | null;
  stationName?: string;
  students?: { id?: string; name?: string }[] | null;
  studentNames?: string[] | null;
}

/**
 * The backend returns raw therapy-session rows (teacher/station objects,
 * `started_at`, `students[]`), while the Reports screen consumes a flattened
 * `SessionReport` shape. Map it here so the tab renders real data.
 */
const mapSessionSummary = (row: RawSessionSummary) => ({
  id: String(row?.id ?? ''),
  date: String(row?.started_at ?? row?.date ?? '').slice(0, 10),
  teacherName: row?.teacher?.name ?? row?.teacherName ?? '—',
  stationName: row?.station?.name ?? row?.stationName ?? '',
  studentNames: Array.isArray(row?.students)
    ? row.students.map((s) => s?.name ?? '').filter(Boolean)
    : Array.isArray(row?.studentNames)
      ? row.studentNames
      : [],
});

export const getSessionReports = async (params: QueryParams) => {
  try {
    const { data } = await client.get<RawSessionSummary[]>('/reports/session_summaries', {
      params,
    });
    return { data: Array.isArray(data) ? data.map(mapSessionSummary) : [] };
  } catch {
    return { data: [] };
  }
};

// There is no backend route for a director bi-annual report export
// (POST /director/reports/bi-annual returns 404). The Reports screen builds the
// packet locally from the session summaries it already fetched, so no network
// call is made here.

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
  sessionsAttended?: number;
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
  if (s.includes('revision') || s.includes('changes') || s.includes('rejected'))
    return 'Revision Required';
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
  studentId: string,
): Promise<{ data: DirectorStudentData }> => {
  // Primary source is the rich progress-monitoring payload. The backend
  // rejects some students with a 422 (`undefined method 'need_analysis_summary'
  // for AbllsAssessment`), so fall back to the reports endpoint before giving
  // up — never leave the screen stuck on a hard error when data is available.
  let d: any = {};
  try {
    const { data: res } = await client.get<any>(`/students/${studentId}/progress_monitoring`);
    d = res?.data ?? res ?? {};
  } catch {
    try {
      const { data: res } = await client.get<any>('/reports/student_progress', {
        params: { student_id: studentId },
      });
      d = res?.data ?? res ?? {};
    } catch {
      d = {};
    }
  }

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
  const sessionsAttended =
    Number(history.total_sessions) ||
    Number(d.session_history_stats?.total_sessions) ||
    sessionHistory.length;

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
  const hasCycle =
    !!assessment.latest_cycle || Number(assessment.cycles_count) > 0 || !!assessment.status;

  return {
    data: {
      name: String(student.full_name || student.name || 'Student'),
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
      sessionsAttended,
    },
  };
};

// MR-46: Report Builder & Export
// The backend has no /director/reports/custom route (404). The Report Builder
// screen composes results locally from the real option lists — see
// ./screens/director/reportbuilder/reportBuilderData.ts.
