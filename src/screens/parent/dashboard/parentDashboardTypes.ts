// src/screens/parent/dashboard/parentDashboardTypes.ts

export interface ParentDashboardData {
  parentName: string;
  childName: string;
  childAge: number;
  childProgram: string;
  photoUrl?: string;
  headshotUrl?: string;
  photo?: string;
  independence: number;
  sessionsThisWeek: number;
  sessionsTotal: number;
  latestMessage: { from: string; preview: string; time: string } | null;
  unreadCount: number;
}

export interface RecentUpdateItem {
  id: number;
  icon: string;
  iconBg: string;
  text: string;
  time: string;
}

export interface NotificationItem {
  id: number;
  text: string;
}

export interface QuickActionItem {
  label: string;
  tab: string;
  iconBg: string;
  iconColor: string;
  icon: 'bar-chart-2' | 'edit-3' | 'message-circle';
}

export const DEFAULT_QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: 'View Progress',
    tab: 'Progress',
    iconBg: '#F0F9FF',
    iconColor: '#38BDF8',
    icon: 'bar-chart-2',
  },
  {
    label: 'Log Observation',
    tab: 'Observations',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
    icon: 'edit-3',
  },
  {
    label: 'Messages',
    tab: 'Messages',
    iconBg: '#FFFBEB',
    iconColor: '#EAB308',
    icon: 'message-circle',
  },
];

export function calculateSessionProgress(done: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.max(0, (done / total) * 100));
}

export function formatTodayDisplay(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface GoalSummary {
  name: string;
  status?: string;
  progressPercent?: number;
}

export function buildRecentUpdates(
  goals: GoalSummary[] = [],
  sessionsThisWeek = 0,
): RecentUpdateItem[] {
  const updates: RecentUpdateItem[] = [];
  let uid = 1;

  for (const g of goals) {
    if (g.status === 'mastered') {
      updates.push({
        id: uid++,
        icon: '✅',
        iconBg: '#DCFCE7',
        text: `Goal mastered: ${g.name}`,
        time: 'Recent',
      });
    } else if (typeof g.progressPercent === 'number' && g.progressPercent > 0) {
      updates.push({
        id: uid++,
        icon: '📊',
        iconBg: '#FEF9C3',
        text: `Goal progress: ${g.name} at ${g.progressPercent}%`,
        time: 'Recent',
      });
    }
  }

  if (sessionsThisWeek > 0) {
    updates.push({
      id: uid++,
      icon: '📋',
      iconBg: '#E0F2FE',
      text: `${sessionsThisWeek} sessions completed this week`,
      time: 'This week',
    });
  }

  return updates.length > 0
    ? updates
    : [{ id: 1, icon: '📋', iconBg: '#E0F2FE', text: 'No recent updates yet', time: '' }];
}

export function buildNotifications(
  unreadCount = 0,
  latestMessage: { from: string; preview: string } | null = null,
): NotificationItem[] {
  const notifs: NotificationItem[] = [];
  if (unreadCount > 0) {
    notifs.push({ id: 1, text: `${unreadCount} unread message(s)` });
  }
  if (latestMessage) {
    notifs.push({ id: 2, text: `Latest: ${latestMessage.from} — ${latestMessage.preview}` });
  }
  return notifs;
}
