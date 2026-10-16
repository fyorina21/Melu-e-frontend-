import { colors } from '../../../theme/colors';

export type SessionStatus = 'on-track' | 'needs-attention' | 'overdue';

export interface ActiveSessionRow {
  id: string;
  teacherName: string;
  stationName: string;
  roomName?: string;
  status: string;
  timer: string;
  trialCount: number;
  studentNames: string[];
  goals?: string[];
  trialBreakdown?: Record<string, number>;
  incidents: unknown[];
}

export interface Session {
  id: string;
  teacher: string;
  station: string;
  room: string;
  students: string[];
  goals: string[];
  trialBreakdown: Record<string, number>;
  timer: number;
  trials: number;
  status: SessionStatus;
  incidents: number;
}

export const STATUS_FROM_API: Record<string, SessionStatus> = {
  'On Track': 'on-track',
  'Needs Attention': 'needs-attention',
  Overdue: 'overdue',
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
  const [m, s] = String(row.timer ?? '0:00')
    .split(':')
    .map(Number);
  return {
    id: row.id,
    teacher: row.teacherName,
    station: row.stationName,
    room: row.roomName ?? '—',
    students: row.studentNames ?? [],
    goals: row.goals ?? [],
    trialBreakdown: row.trialBreakdown ?? { FP: 0, PP: 0, G: 0, '+': row.trialCount ?? 0 },
    timer: (m || 0) * 60 + (s || 0),
    trials: row.trialCount ?? 0,
    status: STATUS_FROM_API[row.status] ?? 'on-track',
    incidents: Array.isArray(row.incidents) ? row.incidents.length : 0,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
