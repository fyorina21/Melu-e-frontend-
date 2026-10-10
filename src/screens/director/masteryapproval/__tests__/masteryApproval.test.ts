// src/screens/director/masteryapproval/__tests__/masteryApproval.test.ts

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  mapRawToMasteryList,
  generateExportRecordText,
  type RawMasteryCheck,
  type MasteryListItem,
} from '../masteryApprovalTypes';

describe('Goal Mastery Approval types and helpers', () => {
  describe('formatDate', () => {
    it('formats ISO string correctly', () => {
      const formatted = formatDate('2026-10-05T14:30:00Z');
      expect(formatted).toBe('Oct 5, 2026');
    });

    it('returns dash for null or undefined or empty', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('returns dash for invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('—');
    });
  });

  describe('mapRawToMasteryList', () => {
    it('filters only pending status checks and formats names properly', () => {
      const mockRaw: RawMasteryCheck[] = [
        {
          id: 'check-1',
          studentGoalId: 'receptive-id-objects',
          status: 'pending',
          requestedByName: 'Sarah Miller',
          requestedAt: '2026-10-01T10:00:00Z',
        },
        {
          id: 'check-2',
          studentGoalId: 'expressive-labels',
          status: 'approved',
          requestedByName: 'John Doe',
          requestedAt: '2026-09-28T09:00:00Z',
        },
        {
          id: 'check-3',
          studentGoalId: 'social-greeting',
          status: 'pending',
          requestedByName: null,
          requestedAt: '2026-10-02T11:00:00Z',
        },
      ];

      const result = mapRawToMasteryList(mockRaw);
      expect(result).toHaveLength(2);
      expect(result[0].checkId).toBe('check-1');
      expect(result[0].studentName).toBe('Student Sarah');
      expect(result[0].goalName).toBe('receptive id objects');
      expect(result[0].teacherA).toBe('Sarah Miller');
      expect(result[0].dateSubmitted).toBe('Oct 1, 2026');

      expect(result[1].checkId).toBe('check-3');
      expect(result[1].studentName).toBe('Student Leo');
      expect(result[1].goalName).toBe('social greeting');
      expect(result[1].teacherA).toBe('Sarah Miller');
    });
  });

  describe('generateExportRecordText', () => {
    it('generates structured text document with pending items', () => {
      const items: MasteryListItem[] = [
        {
          checkId: 'check-1',
          goalId: 'goal-1',
          studentName: 'Student Leo',
          goalName: 'Point to Colors',
          teacherA: 'Sarah Miller',
          teacherB: 'Alex Tan',
          teacherC: 'Emma Watson',
          dateSubmitted: 'Oct 5, 2026',
        },
      ];

      const fixedDate = new Date('2026-10-09T12:00:00Z');
      const text = generateExportRecordText(items, fixedDate);

      expect(text).toContain("MELU'E FOUNDATION — GOAL MASTERY APPROVAL RECORD");
      expect(text).toContain('TOTAL PENDING VERIFICATIONS: 1');
      expect(text).toContain('Student Leo — Point to Colors');
      expect(text).toContain('Teacher A: Sarah Miller');
    });

    it('handles empty items list gracefully', () => {
      const text = generateExportRecordText([], new Date('2026-10-09T12:00:00Z'));
      expect(text).toContain('TOTAL PENDING VERIFICATIONS: 0');
      expect(text).toContain('(No pending mastery approvals)');
    });
  });
});
