// src/screens/parent/childprogress/__tests__/childProgress.test.ts

import { describe, it, expect } from 'vitest';
import {
  goalStatus,
  goalBarColor,
  statusBadge,
  independenceColor,
  behaviorBox,
} from '../childProgressTypes';

describe('childProgress helpers', () => {
  describe('goalStatus', () => {
    it('returns Mastered when raw status is Mastered or pct >= 80', () => {
      expect(goalStatus(90)).toBe('Mastered');
      expect(goalStatus(80)).toBe('Mastered');
      expect(goalStatus(20, 'Mastered')).toBe('Mastered');
    });

    it('returns In Progress when raw status is In Progress or pct >= 60 and < 80', () => {
      expect(goalStatus(60)).toBe('In Progress');
      expect(goalStatus(79)).toBe('In Progress');
      expect(goalStatus(10, 'In Progress')).toBe('In Progress');
    });

    it('returns Active when pct < 60 and raw is not Mastered or In Progress', () => {
      expect(goalStatus(59)).toBe('Active');
      expect(goalStatus(0)).toBe('Active');
      expect(goalStatus(45, 'Active')).toBe('Active');
    });
  });

  describe('goalBarColor', () => {
    it('returns green for >= 80', () => {
      expect(goalBarColor(80)).toBe('#4ADE80');
      expect(goalBarColor(100)).toBe('#4ADE80');
    });

    it('returns yellow for >= 50 and < 80', () => {
      expect(goalBarColor(50)).toBe('#FACC15');
      expect(goalBarColor(75)).toBe('#FACC15');
    });

    it('returns red for < 50', () => {
      expect(goalBarColor(49)).toBe('#F87171');
      expect(goalBarColor(0)).toBe('#F87171');
    });
  });

  describe('statusBadge', () => {
    it('returns correct colors for each status', () => {
      expect(statusBadge('Mastered')).toEqual({ bg: '#DCFCE7', text: '#15803D' });
      expect(statusBadge('Active')).toEqual({ bg: '#E0F2FE', text: '#0369A1' });
      expect(statusBadge('In Progress')).toEqual({ bg: '#FEF9C3', text: '#A16207' });
    });
  });

  describe('independenceColor', () => {
    it('returns correct color based on percentage', () => {
      expect(independenceColor(85)).toBe('#16A34A');
      expect(independenceColor(65)).toBe('#CA8A04');
      expect(independenceColor(45)).toBe('#EF4444');
    });
  });

  describe('behaviorBox', () => {
    it('detects clean behavior when None or empty', () => {
      expect(behaviorBox('None').isClean).toBe(true);
      expect(behaviorBox('No incidents').isClean).toBe(true);
      expect(behaviorBox('').isClean).toBe(true);
    });

    it('detects non-clean behavior when incidents logged', () => {
      const result = behaviorBox('1 mild refusal');
      expect(result.isClean).toBe(false);
      expect(result.text).toBe('#A16207');
    });
  });
});
