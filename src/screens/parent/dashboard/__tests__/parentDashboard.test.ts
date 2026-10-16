// src/screens/parent/dashboard/__tests__/parentDashboard.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateSessionProgress,
  formatTodayDisplay,
  buildRecentUpdates,
  buildNotifications,
  DEFAULT_QUICK_ACTIONS,
} from '../parentDashboardTypes';

describe('parentDashboard helpers and logic', () => {
  describe('calculateSessionProgress', () => {
    it('calculates standard percentage correctly', () => {
      expect(calculateSessionProgress(2, 4)).toBe(50);
      expect(calculateSessionProgress(3, 5)).toBe(60);
      expect(calculateSessionProgress(0, 5)).toBe(0);
    });

    it('clamps percentage between 0 and 100', () => {
      expect(calculateSessionProgress(10, 5)).toBe(100);
      expect(calculateSessionProgress(-2, 5)).toBe(0);
    });

    it('returns 0 when total is 0 or negative', () => {
      expect(calculateSessionProgress(2, 0)).toBe(0);
      expect(calculateSessionProgress(2, -1)).toBe(0);
    });
  });

  describe('formatTodayDisplay', () => {
    it('formats a date into long weekday, month, day, year', () => {
      const fixedDate = new Date('2026-10-09T12:00:00Z');
      const formatted = formatTodayDisplay(fixedDate);
      expect(formatted).toContain('2026');
      expect(formatted).toContain('October');
    });
  });

  describe('buildRecentUpdates', () => {
    it('returns mastered goals and goals in progress', () => {
      const goals = [
        { name: 'Eye Contact', status: 'mastered', progressPercent: 100 },
        { name: 'Vocal Requests', status: 'in_progress', progressPercent: 65 },
        { name: 'Turn Taking', status: 'not_started', progressPercent: 0 },
      ];

      const updates = buildRecentUpdates(goals, 3);
      expect(updates).toHaveLength(3); // 1 mastered + 1 in progress + 1 sessions note
      expect(updates[0].text).toBe('Goal mastered: Eye Contact');
      expect(updates[0].icon).toBe('✅');
      expect(updates[1].text).toBe('Goal progress: Vocal Requests at 65%');
      expect(updates[1].icon).toBe('📊');
      expect(updates[2].text).toBe('3 sessions completed this week');
      expect(updates[2].icon).toBe('📋');
    });

    it('returns default placeholder when no updates exist', () => {
      const updates = buildRecentUpdates([], 0);
      expect(updates).toHaveLength(1);
      expect(updates[0].text).toBe('No recent updates yet');
    });
  });

  describe('buildNotifications', () => {
    it('generates notification for unread count and latest message', () => {
      const notifs = buildNotifications(3, {
        from: 'Dr. Sarah Smith',
        preview: 'Session summary updated',
      });
      expect(notifs).toHaveLength(2);
      expect(notifs[0].text).toBe('3 unread message(s)');
      expect(notifs[1].text).toBe('Latest: Dr. Sarah Smith — Session summary updated');
    });

    it('returns empty array when no unread and no latest message', () => {
      const notifs = buildNotifications(0, null);
      expect(notifs).toEqual([]);
    });

    it('includes only unread count if latest message is missing', () => {
      const notifs = buildNotifications(2, null);
      expect(notifs).toHaveLength(1);
      expect(notifs[0].text).toBe('2 unread message(s)');
    });
  });

  describe('DEFAULT_QUICK_ACTIONS', () => {
    it('has 3 actions defined for Progress, Observations, and Messages', () => {
      expect(DEFAULT_QUICK_ACTIONS).toHaveLength(3);
      expect(DEFAULT_QUICK_ACTIONS.map((a) => a.tab)).toEqual([
        'Progress',
        'Observations',
        'Messages',
      ]);
    });
  });
});
