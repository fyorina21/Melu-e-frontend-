import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCoordinatorAlert,
  getAlertsForTeacher,
  markCoordinatorAlertRead,
  getStoredCoordinatorAlerts,
} from './alertNotificationHelper';

describe('Alert Notification System (Coordinator & Teacher)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('allows coordinator to save an alert with correct fields', () => {
    const alert = saveCoordinatorAlert({
      sessionId: 'sess-123',
      teacherName: 'Dawit Bekele',
      type: 'Urgent',
      message: 'Transition students to Station 2 immediately.',
    });

    expect(alert.id).toBeDefined();
    expect(alert.teacherName).toBe('Dawit Bekele');
    expect(alert.type).toBe('Urgent');
    expect(alert.message).toBe('Transition students to Station 2 immediately.');
    expect(alert.read).toBe(false);
  });

  it('filters alerts accurately for teacher by name or email', () => {
    saveCoordinatorAlert({
      teacherName: 'Abeba Tadesse',
      teacherEmail: 'teacher1@melue.foundation',
      type: 'FYI',
      message: 'Great pacing on Station 1.',
    });

    saveCoordinatorAlert({
      teacherName: 'Dawit Bekele',
      teacherEmail: 'teacher2@melue.foundation',
      type: 'Urgent',
      message: 'Check Station 2 timer.',
    });

    const abebaAlerts = getAlertsForTeacher('Abeba Tadesse', 'teacher1@melue.foundation');
    expect(abebaAlerts.some((a) => a.message.includes('Great pacing'))).toBe(true);
    expect(abebaAlerts.some((a) => a.message.includes('Check Station 2'))).toBe(false);

    const dawitAlerts = getAlertsForTeacher('Dawit Bekele', 'teacher2@melue.foundation');
    expect(dawitAlerts.some((a) => a.message.includes('Check Station 2'))).toBe(true);
  });

  it('allows marking an alert as read', () => {
    const alert = saveCoordinatorAlert({
      teacherName: 'Fyori',
      type: 'Check-in',
      message: 'Please log trial data.',
    });

    expect(alert.read).toBe(false);
    markCoordinatorAlertRead(alert.id);

    const updated = getStoredCoordinatorAlerts().find((a) => a.id === alert.id);
    expect(updated?.read).toBe(true);
  });
});
