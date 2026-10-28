import { colors } from '../../../theme/colors';

export type SessionStatus = 'on-track' | 'needs-attention' | 'overdue';

export interface ActiveSessionRow {
  id: string;
  teacherName?: string;
  therapistName?: string;
  teacher?: { full_name?: string; name?: string } | string;
  stationName?: string;
  station?: { name?: string } | string;
  roomName?: string;
  room?: { name?: string } | string;
  status: string;
  timer?: string | number;
  elapsed_seconds?: number;
  trialCount?: number;
  trialsCount?: number;
  trials_logged?: number;
  trials?: number;
  studentNames?: string[];
  students?: Array<{ id?: string; name?: string; fullName?: string; full_name?: string } | string>;
  participants?: Array<{
    student?: { id?: string; name?: string; fullName?: string; full_name?: string } | string;
    goals?: Array<{ goal_name?: string; name?: string }>;
  }>;
  goals?: string[];
  trialBreakdown?: Record<string, number>;
  incidents?: unknown[] | number;
  incidents_count?: number;
  incidentsCount?: number;
  started_at?: number | string;
  startedAt?: number | string;
}

export interface Session {
  id: string;
  teacher: string;
  station: string;
  room: string;
  students: string[];
  studentDetails?: Array<{ id: string; name: string }>;
  goals: string[];
  trialBreakdown: Record<string, number>;
  timer: number;
  trials: number;
  status: SessionStatus;
  incidents: number;
  startedAt?: number;
}

export const STATUS_FROM_API: Record<string, SessionStatus> = {
  'On Track': 'on-track',
  'Needs Attention': 'needs-attention',
  Overdue: 'overdue',
  in_progress: 'on-track',
  active: 'on-track',
  completed: 'on-track',
};

export const STATUS_CONFIG: Record<
  SessionStatus,
  { border: string; dot: string; label: string; text: string }
> = {
  'on-track': { border: '#4ADE80', dot: '#4ADE80', label: 'On Track', text: '#4ADE80' },
  'needs-attention': {
    border: '#FCD34D',
    dot: '#FCD34D',
    label: 'Needs Attention',
    text: '#FCD34D',
  },
  overdue: { border: '#F87171', dot: '#F87171', label: 'Overdue', text: '#F87171' },
};

export const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'On Track', value: 'on-track' },
  { label: 'Needs Attention', value: 'needs-attention' },
  { label: 'Overdue', value: 'overdue' },
];

export const STATION_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Stations', value: 'all' },
  { label: 'Station 1', value: 'Station 1' },
  { label: 'Station 2', value: 'Station 2' },
];

export const ALERT_TYPES = ['Urgent', 'FYI', 'Check-in'] as const;

export const TRIAL_COLORS: Record<string, string> = {
  FP: colors.primaryYellowDark,
  PP: '#C084FC',
  G: '#FCD34D',
  '+': '#4ADE80',
};

export const SKY = colors.primaryYellowDark;
export const DARK = '#FFFFFF';
export const DARK_TEXT = colors.navyText;
export const PANEL = '#F3F4F6';

export function mapActiveSession(row: ActiveSessionRow): Session {
  let timerSeconds = 0;
  if (typeof row.elapsed_seconds === 'number') {
    timerSeconds = row.elapsed_seconds;
  } else if (typeof row.timer === 'number') {
    timerSeconds = row.timer;
  } else if (typeof row.timer === 'string') {
    if (row.timer.includes(':')) {
      const [m, s] = row.timer.split(':').map(Number);
      timerSeconds = (m || 0) * 60 + (s || 0);
    } else {
      timerSeconds = Number(row.timer) || 0;
    }
  }

  // Extract student names and student ID mappings
  const studentNames: string[] = [];
  const studentDetails: Array<{ id: string; name: string }> = [];

  if (Array.isArray(row.studentNames) && row.studentNames.length > 0) {
    row.studentNames.forEach((name) => {
      if (name && typeof name === 'string' && name.trim()) {
        const trimmed = name.trim();
        studentNames.push(trimmed);
        studentDetails.push({ id: trimmed, name: trimmed });
      }
    });
  } else if (Array.isArray(row.students) && row.students.length > 0) {
    row.students.forEach((st: any) => {
      if (typeof st === 'string' && st.trim()) {
        const trimmed = st.trim();
        studentNames.push(trimmed);
        studentDetails.push({ id: trimmed, name: trimmed });
      } else if (st && typeof st === 'object') {
        const name = (st.name || st.fullName || st.full_name || '').trim();
        if (name) {
          studentNames.push(name);
          studentDetails.push({ id: String(st.id || name), name });
        }
      }
    });
  } else if (Array.isArray(row.participants) && row.participants.length > 0) {
    row.participants.forEach((p: any) => {
      const st = p?.student;
      if (typeof st === 'string' && st.trim()) {
        const trimmed = st.trim();
        studentNames.push(trimmed);
        studentDetails.push({ id: trimmed, name: trimmed });
      } else if (st && typeof st === 'object') {
        const name = (st.fullName || st.full_name || st.name || '').trim();
        if (name) {
          studentNames.push(name);
          studentDetails.push({ id: String(st.id || name), name });
        }
      }
    });
  }

  let teacher = row.teacherName || row.therapistName || '';
  if (!teacher && row.teacher) {
    if (typeof row.teacher === 'string') {
      teacher = row.teacher;
    } else if (typeof row.teacher === 'object') {
      teacher = row.teacher.full_name || row.teacher.name || '';
    }
  }
  if (!teacher) teacher = 'Teacher';

  let station = row.stationName || '';
  if (!station && row.station) {
    if (typeof row.station === 'string') {
      station = row.station;
    } else if (typeof row.station === 'object') {
      station = row.station.name || '';
    }
  }
  if (!station) station = 'Station 1';

  let room = row.roomName || '';
  if (!room && row.room) {
    if (typeof row.room === 'string') {
      room = row.room;
    } else if (typeof row.room === 'object') {
      room = row.room.name || '';
    }
  }
  if (!room) room = '—';

  const rawStatus = String(row.status ?? '');
  const status: SessionStatus =
    STATUS_FROM_API[rawStatus] ??
    (rawStatus.toLowerCase().includes('attention')
      ? 'needs-attention'
      : rawStatus.toLowerCase().includes('overdue')
        ? 'overdue'
        : 'on-track');

  const trials = Number(row.trialCount ?? row.trialsCount ?? row.trials_logged ?? row.trials ?? 0);

  const incidents =
    typeof row.incidents_count === 'number'
      ? row.incidents_count
      : typeof row.incidentsCount === 'number'
        ? row.incidentsCount
        : Array.isArray(row.incidents)
          ? row.incidents.length
          : typeof row.incidents === 'number'
            ? row.incidents
            : 0;

  let goals: string[] = [];
  if (Array.isArray(row.goals)) {
    goals = row.goals
      .map((g: any) => (typeof g === 'string' ? g : g?.goal_name || g?.name || ''))
      .filter(Boolean);
  } else if (Array.isArray(row.participants)) {
    row.participants.forEach((p: any) => {
      if (Array.isArray(p?.goals)) {
        p.goals.forEach((g: any) => {
          const gn = g?.goal_name || g?.name;
          if (gn && !goals.includes(gn)) goals.push(gn);
        });
      }
    });
  }

  let parsedStartedAt: number | undefined;
  if (typeof row.startedAt === 'number') {
    parsedStartedAt = row.startedAt;
  } else if (typeof row.started_at === 'number') {
    parsedStartedAt = row.started_at;
  } else if (typeof row.started_at === 'string') {
    const t = new Date(row.started_at).getTime();
    if (!isNaN(t) && t > 0) parsedStartedAt = t;
  } else if (typeof row.startedAt === 'string') {
    const t = new Date(row.startedAt).getTime();
    if (!isNaN(t) && t > 0) parsedStartedAt = t;
  }

  return {
    id: row.id,
    teacher,
    station,
    room,
    students: studentNames,
    studentDetails: studentDetails.length > 0 ? studentDetails : undefined,
    goals,
    trialBreakdown: row.trialBreakdown ?? { FP: 0, PP: 0, G: 0, '+': trials },
    timer: timerSeconds,
    trials,
    status,
    incidents,
    startedAt: parsedStartedAt,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
