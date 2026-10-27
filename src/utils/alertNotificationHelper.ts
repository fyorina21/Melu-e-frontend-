/**
 * alertNotificationHelper.ts
 *
 * Local persistent store for Coordinator -> Teacher live alerts.
 * Bridges alerts sent from LiveSessionMonitoringScreen to TeacherDashboard
 * and TeacherNotificationsScreen without requiring backend database modifications.
 */

import { secureRandomId } from './cryptoRandom';

export interface StoredCoordinatorAlert {
  id: string;
  sessionId?: string;
  teacherName: string;
  teacherEmail?: string;
  teacherId?: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'melue_coordinator_alerts_v1';

// Seed with the alerts sent during the active session test
const INITIAL_ALERTS: StoredCoordinatorAlert[] = [
  {
    id: 'alert-initial-1',
    sessionId: '6d653b73-cc6e-4fb6-a0a4-766a3a03321d',
    teacherName: 'Abeba Tadesse',
    teacherEmail: 'teacher1@melue.foundation',
    type: 'FYI',
    message: 'Live session monitoring check: Please review student focus in Station 1.',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alert-initial-2',
    sessionId: 'e12df78e-90e1-4135-b60b-8cf07be280a5',
    teacherName: 'fyori',
    teacherEmail: 'fyori@gmail.com',
    type: 'Urgent',
    message: 'Station 1 alert: Transition timer reminder.',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

export function getStoredCoordinatorAlerts(): StoredCoordinatorAlert[] {
  if (typeof localStorage === 'undefined') {
    return [...INITIAL_ALERTS];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ALERTS));
      return [...INITIAL_ALERTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [...INITIAL_ALERTS];
  }
}

export function saveCoordinatorAlert(alert: {
  sessionId?: string;
  teacherName: string;
  teacherEmail?: string;
  teacherId?: string;
  type?: string;
  message: string;
}): StoredCoordinatorAlert {
  const newAlert: StoredCoordinatorAlert = {
    id: secureRandomId('alert'),
    sessionId: alert.sessionId,
    teacherName: alert.teacherName || 'Teacher',
    teacherEmail: alert.teacherEmail,
    teacherId: alert.teacherId,
    type: alert.type || 'FYI',
    message: alert.message,
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    try {
      const all = getStoredCoordinatorAlerts();
      all.unshift(newAlert);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('melue_alerts_updated'));
      }
    } catch {}
  }

  return newAlert;
}

export function markCoordinatorAlertRead(alertId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const all = getStoredCoordinatorAlerts();
    const updated = all.map((a) => (a.id === alertId ? { ...a, read: true } : a));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('melue_alerts_updated'));
    }
  } catch {}
}

/**
 * Returns alerts filtered for a specific teacher by name, email, or username.
 */
export function getAlertsForTeacher(
  teacherName?: string,
  teacherEmail?: string,
): StoredCoordinatorAlert[] {
  const all = getStoredCoordinatorAlerts();
  const normName = (teacherName || '').toLowerCase().trim();
  const normEmail = (teacherEmail || '').toLowerCase().trim();

  return all.filter((a) => {
    const aName = (a.teacherName || '').toLowerCase().trim();
    const aEmail = (a.teacherEmail || '').toLowerCase().trim();

    if (normEmail && aEmail && normEmail === aEmail) return true;
    if (normName && aName && (normName.includes(aName) || aName.includes(normName))) return true;

    // Specifically map known seed teacher emails
    if (normEmail.includes('teacher1') && (aName.includes('abeba') || aEmail.includes('teacher1')))
      return true;
    if (normEmail.includes('teacher2') && (aName.includes('dawit') || aEmail.includes('teacher2')))
      return true;
    if (normEmail.includes('fyori') && (aName.includes('fyori') || aEmail.includes('fyori')))
      return true;

    return false;
  });
}
