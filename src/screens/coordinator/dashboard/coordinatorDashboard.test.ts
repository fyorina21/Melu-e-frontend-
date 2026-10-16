import { describe, it, expect } from 'vitest';
import {
  formatTimer,
  toNotificationItem,
  STATUS_FROM_API,
  STATUS_CONFIG,
  type ApiNotification,
} from './types';

describe('coordinatorDashboard logic', () => {
  describe('formatTimer', () => {
    it('formats seconds under a minute', () => {
      expect(formatTimer(0)).toBe('00:00');
      expect(formatTimer(45)).toBe('00:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatTimer(65)).toBe('01:05');
      expect(formatTimer(600)).toBe('10:00');
    });
  });

  describe('toNotificationItem', () => {
    it('formats notification with title and body', () => {
      const apiNotif: ApiNotification = {
        id: 'n1',
        type: 'alert',
        payload: { title: 'Session Overdue', body: 'Teacher A has exceeded scheduled time' },
        read: false,
        createdAt: new Date().toISOString(),
      };
      const item = toNotificationItem(apiNotif);
      expect(item.id).toBe('n1');
      expect(item.text).toBe('Session Overdue — Teacher A has exceeded scheduled time');
      expect(item.urgent).toBe(true);
      expect(item.read).toBe(false);
    });

    it('formats notification with name only', () => {
      const apiNotif: ApiNotification = {
        id: 'n2',
        type: 'info',
        payload: { name: 'Mastery Criteria Met' },
        read: true,
        createdAt: new Date().toISOString(),
      };
      const item = toNotificationItem(apiNotif);
      expect(item.text).toBe('Goal update: Mastery Criteria Met');
      expect(item.urgent).toBe(false);
      expect(item.read).toBe(true);
    });
  });

  describe('STATUS_FROM_API and STATUS_CONFIG', () => {
    it('maps API status colors to application status strings', () => {
      expect(STATUS_FROM_API['green']).toBe('on-track');
      expect(STATUS_FROM_API['yellow']).toBe('needs-attention');
      expect(STATUS_FROM_API['red']).toBe('overdue');
    });

    it('provides badge labels and colors for each status', () => {
      expect(STATUS_CONFIG['on-track'].label).toBe('On Track');
      expect(STATUS_CONFIG['needs-attention'].label).toBe('Needs Attention');
      expect(STATUS_CONFIG['overdue'].label).toBe('Overdue');
    });
  });
});
