// src/screens/programdirector/dashboard/__tests__/pdDashboard.test.ts

import { describe, it, expect } from 'vitest';
import {
  filterStudents,
  STAGE_COLORS,
  STATUS_COLORS,
  FILTER_OPTIONS,
  type DashboardStudent,
} from '../dashboardTypes';

describe('Program Director Dashboard types & helpers', () => {
  const mockStudents: DashboardStudent[] = [
    {
      id: 's1',
      fullName: 'Alice Johnson',
      programType: 'ABA Early',
      therapyGroup: 'Group A',
      therapist: 'Ms. Rachel',
      assessmentStatus: 'completed',
      sessionAssigned: true,
      currentStage: 'in-session',
      status: 'In Session',
    },
    {
      id: 's2',
      fullName: 'Bob Smith',
      programType: 'Speech',
      therapyGroup: 'Group B',
      therapist: 'Mr. David',
      assessmentStatus: 'in-progress',
      sessionAssigned: false,
      currentStage: 'in-assessment',
      status: 'In Assessment',
    },
    {
      id: 's3',
      fullName: 'Charlie Davis',
      programType: 'ABA Intensive',
      therapyGroup: 'Group A',
      therapist: 'Ms. Rachel',
      assessmentStatus: 'not-started',
      sessionAssigned: false,
      currentStage: 'enrolled',
      status: 'Not Started',
    },
  ];

  describe('filterStudents', () => {
    it('returns all students when filter is all and search is empty', () => {
      const result = filterStudents(mockStudents, 'all', '');
      expect(result).toHaveLength(3);
    });

    it('filters students by stage key', () => {
      const inAssessment = filterStudents(mockStudents, 'in-assessment', '');
      expect(inAssessment).toHaveLength(1);
      expect(inAssessment[0].fullName).toBe('Bob Smith');
    });

    it('filters students by search query matching name', () => {
      const searched = filterStudents(mockStudents, 'all', 'alice');
      expect(searched).toHaveLength(1);
      expect(searched[0].fullName).toBe('Alice Johnson');
    });

    it('filters students by search query matching therapist', () => {
      const searched = filterStudents(mockStudents, 'all', 'Rachel');
      expect(searched).toHaveLength(2);
      expect(searched.map((s) => s.fullName)).toEqual(['Alice Johnson', 'Charlie Davis']);
    });

    it('combines stage filter and search query correctly', () => {
      const result = filterStudents(mockStudents, 'in-session', 'Alice');
      expect(result).toHaveLength(1);

      const mismatch = filterStudents(mockStudents, 'in-session', 'Bob');
      expect(mismatch).toHaveLength(0);
    });
  });

  describe('STAGE_COLORS and STATUS_COLORS', () => {
    it('contains configurations for expected stage keys', () => {
      expect(STAGE_COLORS['enrolled']).toBeDefined();
      expect(STAGE_COLORS['in-assessment']).toBeDefined();
      expect(STAGE_COLORS['assessment-complete']).toBeDefined();
      expect(STAGE_COLORS['session-assigned']).toBeDefined();
      expect(STAGE_COLORS['in-session']).toBeDefined();
    });

    it('contains colors for common status labels', () => {
      expect(STATUS_COLORS['Not Started']).toBeDefined();
      expect(STATUS_COLORS['In Assessment']).toBeDefined();
      expect(STATUS_COLORS['Assessment Completed']).toBeDefined();
      expect(STATUS_COLORS['Session Assigned']).toBeDefined();
      expect(STATUS_COLORS['In Session']).toBeDefined();
    });

    it('provides all 5 filter options in FILTER_OPTIONS', () => {
      expect(FILTER_OPTIONS).toHaveLength(5);
      expect(FILTER_OPTIONS[0].key).toBe('all');
    });
  });
});
