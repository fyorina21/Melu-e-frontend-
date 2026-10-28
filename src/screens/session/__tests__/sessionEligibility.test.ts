// src/screens/session/__tests__/sessionEligibility.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkStudentEligibility, getStudentAssignedGoals } from '../sessionEligibilityHelper';
import * as pdApi from '../../../api/programDirectorApi';

vi.mock('../../../api/programDirectorApi', () => ({
  getStoredIupDraft: vi.fn(),
  getAllStoredIupDrafts: vi.fn(() => ({})),
  getStoredCaseload: vi.fn(),
}));

describe('sessionEligibilityHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pdApi.getStoredCaseload).mockReturnValue(null);
    vi.mocked(pdApi.getStoredIupDraft).mockReturnValue(null);
  });

  describe('checkStudentEligibility', () => {
    it('returns false for excluded statuses (assessment, draft, registered, discharged, etc.)', () => {
      const excluded = [
        'in_assessment',
        'in assessment',
        'assessment',
        'draft',
        'registered',
        'pending_review',
        'pending review',
        'withdrawn',
        'discharged',
        'archived',
      ];

      excluded.forEach((status) => {
        expect(checkStudentEligibility(status, true)).toBe(false);
        expect(checkStudentEligibility(status, false)).toBe(false);
      });
    });

    it('returns true for active/in-session statuses regardless of hasAssignedGoal', () => {
      const inSessionStatuses = [
        'in session',
        'in_session',
        'active',
        'active therapy',
        'active_therapy',
        'session_assigned',
        'session assigned',
        'in_progress',
        'in progress',
      ];

      inSessionStatuses.forEach((status) => {
        expect(checkStudentEligibility(status, false)).toBe(true);
        expect(checkStudentEligibility(status, true)).toBe(true);
      });
    });

    it('returns true for ready_for_iup / assessment_complete ONLY when hasAssignedGoal is true', () => {
      expect(checkStudentEligibility('ready for iup', false)).toBe(false);
      expect(checkStudentEligibility('ready for iup', true)).toBe(true);

      expect(checkStudentEligibility('ready_for_iup', false)).toBe(false);
      expect(checkStudentEligibility('ready_for_iup', true)).toBe(true);

      expect(checkStudentEligibility('assessment_complete', false)).toBe(false);
      expect(checkStudentEligibility('assessment_complete', true)).toBe(true);
    });

    it('returns true for empty status if student specifically has assigned goal', () => {
      expect(checkStudentEligibility('', false)).toBe(false);
      expect(checkStudentEligibility('', true)).toBe(true);
    });
  });

  describe('getStudentAssignedGoals', () => {
    it('prioritizes goals assigned in Student Caseload across station slots', () => {
      vi.mocked(pdApi.getStoredCaseload).mockReturnValue({
        _initialized: true,
        'station1-0': {
          id: 'g-meron-1',
          name: 'Take turns in structured play',
          domain: 'Adaptive',
          progress: 55,
        },
        'station1-1': null,
        'station2-0': {
          id: 'g-meron-2',
          name: 'Maintain pencil grip for 3 minutes',
          domain: 'Motor',
          progress: 0,
        },
        'station2-1': null,
      });

      const goals = getStudentAssignedGoals('stu-meron');
      expect(goals).toHaveLength(2);
      expect(goals[0].id).toBe('g-meron-1');
      expect(goals[0].name).toBe('Take turns in structured play');
      expect(goals[0].category).toBe('Adaptive');
      expect(goals[0].independencePercent).toBe(55);
      expect(goals[1].id).toBe('g-meron-2');
      expect(goals[1].name).toBe('Maintain pencil grip for 3 minutes');
      expect(goals[1].category).toBe('Motor');
      expect(goals[1].independencePercent).toBe(0);
    });

    it('returns empty array if Student Caseload was initialized with all slots cleared/null', () => {
      vi.mocked(pdApi.getStoredCaseload).mockReturnValue({
        _initialized: true,
        'station1-0': null,
        'station1-1': null,
        'station2-0': null,
        'station2-1': null,
      });

      const goals = getStudentAssignedGoals('stu-cleared');
      expect(goals).toEqual([]);
    });

    it('extracts goals from draft station slots when available', () => {
      vi.mocked(pdApi.getStoredIupDraft).mockReturnValue({
        slots: {
          station1: [{ id: 'g-101', name: 'Receptive labels', domain: 'Language' }],
          station2: [{ id: 'g-102', title: 'Motor imitation', category: 'Motor' }],
        },
      } as any);

      const goals = getStudentAssignedGoals('stu-1');
      expect(goals).toHaveLength(2);
      expect(goals[0].id).toBe('g-101');
      expect(goals[0].name).toBe('Receptive labels');
      expect(goals[0].category).toBe('Language');
      expect(goals[1].id).toBe('g-102');
      expect(goals[1].name).toBe('Motor imitation');
    });

    it('extracts goals from draft goals list when slots are empty', () => {
      vi.mocked(pdApi.getStoredIupDraft).mockReturnValue({
        goals: [
          { id: 'draft-g-1', name: 'Social greeting', domain: 'Social' },
          'Object identification',
        ],
      } as any);

      const goals = getStudentAssignedGoals('stu-2');
      expect(goals).toHaveLength(2);
      expect(goals[0].id).toBe('draft-g-1');
      expect(goals[0].name).toBe('Social greeting');
      expect(goals[1].id).toBe('Object identification');
      expect(goals[1].name).toBe('Assigned Goal');
    });

    it('filters out synthetic backend fallback goals and keeps real goals', () => {
      vi.mocked(pdApi.getStoredIupDraft).mockReturnValue(null);

      const rawGoals = [
        { id: 'stu-3-g1', name: 'Fallback 1' },
        { id: 'stu-3-g2', name: 'Fallback 2' },
        { id: 'real-goal-456', name: 'Real Adaptive Skill', category: 'Adaptive' },
      ];

      const goals = getStudentAssignedGoals('stu-3', rawGoals);
      expect(goals).toHaveLength(1);
      expect(goals[0].id).toBe('real-goal-456');
    });

    it('returns empty array when no valid draft goals or real backend goals exist', () => {
      vi.mocked(pdApi.getStoredIupDraft).mockReturnValue(null);
      const rawGoals = [{ id: 'stu-4-g1' }, { id: 'other-g2' }];
      const goals = getStudentAssignedGoals('stu-4', rawGoals);
      expect(goals).toEqual([]);
    });
  });
});
