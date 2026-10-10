import type { FeatherIconName } from '../../types';

export interface TodaySchedule {
  stationName: string;
  roomName: string;
  sessionBlock: string;
  startTime: string;
  endTime: string;
  startsIn: string;
  students: { id: string; name: string; initial: string }[];
}

export interface AssessmentTask {
  id: string;
  studentName: string;
  studentInitial: string;
  assessmentName: string;
  status: string;
  progress: number;
}

export interface MasteryCheck {
  id: string;
  studentId: string;
  goalId: string;
  studentName: string;
  goalName: string;
  pendingLabel: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  source: string;
  timeAgo: string;
  unread: boolean;
}

export interface TeacherDashboardData {
  todaySchedule: TodaySchedule;
  assessmentTasks: AssessmentTask[];
  pendingMasteryChecks: MasteryCheck[];
  notifications: NotificationItem[];
}

export const NOTIF_ICON_MAP: Record<string, { name: FeatherIconName; color: string }> = {
  approved: { name: 'check-circle', color: '#22C55E' },
  revision: { name: 'refresh-cw', color: '#F97316' },
  alert: { name: 'bell', color: '#EAB308' },
  message: { name: 'message-circle', color: '#3B82F6' },
};

export function getCountdown(startTimeStr?: string, current: Date = new Date()): string {
  if (!startTimeStr) return 'Starts soon';

  let target: Date | null = null;

  const ampmMatch = startTimeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
    const period = ampmMatch[4].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    target = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate(),
      hours,
      minutes,
      seconds,
    );
  } else {
    const time24Match = startTimeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (time24Match) {
      const hours = parseInt(time24Match[1], 10);
      const minutes = parseInt(time24Match[2], 10);
      const seconds = time24Match[3] ? parseInt(time24Match[3], 10) : 0;
      target = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        hours,
        minutes,
        seconds,
      );
    } else {
      const parsed = new Date(startTimeStr);
      if (!isNaN(parsed.getTime())) {
        target = parsed;
      }
    }
  }

  if (!target) return startTimeStr;

  const diffMs = target.getTime() - current.getTime();
  if (diffMs <= 0) {
    return 'Started';
  }

  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `Starts in ${minutes}m ${seconds}s`;
  } else {
    return `Starts in ${seconds}s`;
  }
}
