// src/screens/goalmastery/goalMasteryHelper.test.ts

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  checkKey,
  unwrapBody,
  flattenGoals,
  toApiOutcome,
  toFormOutcome,
  payloadFor,
  canSubmitMasteryCheck,
  STATUS_LABELS,
} from './goalMasteryHelper';

describe('Goal Mastery Helper Functions', () => {
  describe('formatDate', () => {
    it('formats ISO date to YYYY-MM-DD', () => {
      expect(formatDate('2026-10-05T14:30:00Z')).toBe('2026-10-05');
    });

    it('returns today date for empty or null', () => {
      expect(formatDate(null)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatDate('')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('checkKey', () => {
    it('creates storage key using student and goal ids', () => {
      expect(checkKey('student-1', 'goal-42')).toBe('gmc_check_student-1_goal-42');
    });
  });

  describe('unwrapBody', () => {
    it('unwraps nested data object', () => {
      expect(unwrapBody({ data: { data: { id: 10 } } })).toEqual({ id: 10 });
      expect(unwrapBody({ data: { id: 20 } })).toEqual({ id: 20 });
      expect(unwrapBody({ data: null })).toBeNull();
      expect(unwrapBody({})).toBeNull();
    });
  });

  describe('flattenGoals', () => {
    it('flattens station summary goals list', () => {
      const summary = [
        {
          station: { name: 'Station 1' },
          goals: [
            { id: 101, goal_name: 'Color Identification' },
            { id: 102, goal_name: 'Shape Sorting' },
          ],
        },
      ];

      const { goals, stationByGoal } = flattenGoals(summary);
      expect(goals).toHaveLength(2);
      expect(goals[0].id).toBe('101');
      expect(goals[0].name).toBe('Color Identification');
      expect(stationByGoal['101']).toBe('Station 1');
    });

    it('handles empty or non-array summary', () => {
      expect(flattenGoals(null)).toEqual({ goals: [], stationByGoal: {} });
    });
  });

  describe('toApiOutcome and toFormOutcome', () => {
    it('converts outcome formats correctly', () => {
      expect(toApiOutcome('failed')).toBe('fail');
      expect(toApiOutcome('novel_person')).toBe('success');
      expect(toApiOutcome('both')).toBe('success');

      expect(toFormOutcome('fail')).toBe('failed');
      expect(toFormOutcome('success')).toBe('both');
      expect(toFormOutcome(null)).toBeNull();
    });
  });

  describe('payloadFor', () => {
    it('constructs verification payload with prompt when failed', () => {
      const payload = payloadFor('failed', 'Full Physical (FP)', 'Needs hand over hand assistance');
      expect(payload).toEqual({
        outcome: 'fail',
        prompt_used: 'Full Physical (FP)',
        notes: 'Needs hand over hand assistance',
      });
    });

    it('constructs verification payload without prompt when success', () => {
      const payload = payloadFor('both', '', 'Mastered cleanly');
      expect(payload).toEqual({
        outcome: 'success',
        notes: 'Mastered cleanly',
      });
    });
  });

  describe('canSubmitMasteryCheck', () => {
    it('validates submission readiness correctly', () => {
      // Both teachers valid and not submitted yet
      expect(canSubmitMasteryCheck(false, true, false, true, false, false)).toBe(true);

      // Teacher B locked, Teacher C valid
      expect(canSubmitMasteryCheck(true, false, false, true, false, false)).toBe(true);

      // Teacher B not valid
      expect(canSubmitMasteryCheck(false, false, false, true, false, false)).toBe(false);

      // Already submitted
      expect(canSubmitMasteryCheck(false, true, false, true, true, false)).toBe(false);

      // Currently submitting
      expect(canSubmitMasteryCheck(false, true, false, true, false, true)).toBe(false);
    });
  });

  describe('STATUS_LABELS', () => {
    it('maps known mastery check status keys', () => {
      expect(STATUS_LABELS.pending_verifications).toBe('Pending Verifications');
      expect(STATUS_LABELS.pending_approval).toBe('Pending Director Review');
      expect(STATUS_LABELS.approved).toBe('Approved');
      expect(STATUS_LABELS.rejected).toBe('Rejected');
    });
  });
});
