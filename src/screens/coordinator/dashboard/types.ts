export interface LiveSession {
  id: string;
  teacher: string;
  station: string;
  students: string[];
  timer: number;
  trials: number;
  status: 'on-track' | 'needs-attention' | 'overdue';
}

export interface PendingReview {
  id: string;
  teacher: string;
  station: string;
  date: string;
  students: string[];
  independence: number;
  incidents: number;
}

export interface NotificationItem {
  id: string;
  text: string;
  read: boolean;
  time: string;
  urgent: boolean;
}

export interface DashboardPayload {
  summary?: {
    sessionsCompleted?: number;
    trialsLogged?: number;
    incidents?: number;
    goalsMastered?: number;
  };
  unreadCount?: number;
  activeSessionsCount?: number;
  pendingReviewCount?: number;
  studentsInTherapyCount?: number;
  teachersOnDutyCount?: number;
  liveSessions?: {
    id: string;
    teacherName: string;
    stationName: string;
    status: 'green' | 'yellow' | 'red';
    studentCount: number;
  }[];
  pendingReviews?: {
    id: string;
    teacherName: string;
    stationName?: string;
    date?: string;
    studentNames: string[];
    independencePercent?: number;
    incidents?: number;
  }[];
}

export const STATUS_FROM_API: Record<string, LiveSession['status']> = {
  green: 'on-track',
  yellow: 'needs-attention',
  red: 'overdue',
};

export const STATUS_CONFIG: Record<
  LiveSession['status'],
  { dot: string; label: string; badgeBg: string; badgeText: string }
> = {
  'on-track': { dot: '#4ADE80', label: 'On Track', badgeBg: '#F0FDF4', badgeText: '#15803D' },
  'needs-attention': {
    dot: '#FACC15',
    label: 'Needs Attention',
    badgeBg: '#FEFCE8',
    badgeText: '#A16207',
  },
  overdue: { dot: '#F87171', label: 'Overdue', badgeBg: '#FEF2F2', badgeText: '#B91C1C' },
};

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export type ApiNotification = {
  id: string;
  type: string;
  payload: { title?: string; body?: string; name?: string } | null;
  read: boolean;
  createdAt: string;
};

export function toNotificationItem(n: ApiNotification): NotificationItem {
  const p = n.payload ?? {};
  const text =
    p.title && p.body
      ? `${p.title} — ${p.body}`
      : (p.title ?? p.body ?? (p.name ? `Goal update: ${p.name}` : 'New notification'));
  const ageMs = Date.now() - new Date(n.createdAt).getTime();
  const mins = Math.max(0, Math.round(ageMs / 60000));
  const time = mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} hr ago`;
  return { id: n.id, text, read: n.read, time, urgent: n.type === 'alert' };
}
