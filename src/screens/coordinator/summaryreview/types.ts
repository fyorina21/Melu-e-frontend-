import { colors } from '../../../theme/colors';

export type SummaryStatus = 'pending' | 'revision-required' | 'approved';

export interface Summary {
  id: string;
  teacher: string;
  station: string;
  room: string;
  date: string;
  students: string[];
  trials: number;
  independence: number;
  incidents: number;
  status: SummaryStatus;
  notes: string;
}

export interface ApiSummaryRow {
  id: string;
  sessionId: string;
  teacherName: string;
  stationName: string;
  roomName?: string;
  date: string;
  bodyPreview: string;
  status: string;
  studentNames: string[];
  independencePercent: number;
  trialsTotal?: number;
  trialsCorrect?: number;
  incidentCount?: number;
}

export const STATUS_FROM_API: Record<string, SummaryStatus> = {
  Pending: 'pending',
  Approved: 'approved',
  'Revision Required': 'revision-required',
};

export function mapSummary(row: ApiSummaryRow): Summary {
  return {
    id: row.id,
    teacher: row.teacherName,
    station: row.stationName,
    room: row.roomName ?? '',
    date: row.date,
    students: row.studentNames ?? [],
    trials: row.trialsTotal ?? 0,
    independence: row.independencePercent ?? 0,
    incidents: row.incidentCount ?? 0,
    status: STATUS_FROM_API[row.status] ?? 'pending',
    notes: row.bodyPreview ?? '',
  };
}

export const STATUS_CONFIG: Record<
  SummaryStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: 'clock' | 'alert-circle' | 'check-circle';
  }
> = {
  pending: {
    label: 'Pending',
    bg: 'rgba(252,211,77,0.15)',
    text: '#B45309',
    border: 'rgba(252,211,77,0.45)',
    icon: 'clock',
  },
  'revision-required': {
    label: 'Revision Required',
    bg: 'rgba(248,113,113,0.12)',
    text: '#DC2626',
    border: 'rgba(248,113,113,0.35)',
    icon: 'alert-circle',
  },
  approved: {
    label: 'Approved',
    bg: 'rgba(74,222,128,0.12)',
    text: '#16A34A',
    border: 'rgba(74,222,128,0.35)',
    icon: 'check-circle',
  },
};

export const SECTIONS = ['Notes', 'Trial Data', 'Incident Report', 'General'];

export const DARK = colors.navyText;
export const SKY = colors.primaryYellowDark;
export const AMBER = '#FCD34D';

export function independenceColor(v: number): string {
  return v >= 70 ? '#4ADE80' : v >= 60 ? AMBER : '#F87171';
}
