// src/screens/coordinator/coordinatorStudentProgress.test.ts

import { describe, it, expect } from 'vitest';
import {
  STATUS_PERCENT,
  type StudentListItem,
  type ProgressOverview,
} from './studentProgressTypes';
import { filterStudentsBySearch, buildStudentProgressExportReport } from './studentProgressHelper';

describe('Coordinator Student Progress Utilities & Models', () => {
  const mockStudents: StudentListItem[] = [
    {
      id: 's-1',
      fullName: 'Aiden Rivera',
      age: 6,
      programType: 'Regular',
      therapyGroup: 'Basic',
      status: 'Active',
    },
    {
      id: 's-2',
      fullName: 'Beatriz Santos',
      age: 14,
      programType: 'Pulled Out',
      therapyGroup: 'Functional Living Skill',
      status: 'Active',
    },
  ];

  it('correctly maps status strings to percentage values', () => {
    expect(STATUS_PERCENT.Completed).toBe(100);
    expect(STATUS_PERCENT['In Progress']).toBe(50);
    expect(STATUS_PERCENT['Not Started']).toBe(0);
    expect(STATUS_PERCENT.Unknown).toBeUndefined();
  });

  describe('filterStudentsBySearch', () => {
    it('filters student list by case-insensitive name search', () => {
      expect(filterStudentsBySearch(mockStudents, 'aiden')).toHaveLength(1);
      expect(filterStudentsBySearch(mockStudents, 'AIDEN')[0].id).toBe('s-1');
      expect(filterStudentsBySearch(mockStudents, 'santos')).toHaveLength(1);
      expect(filterStudentsBySearch(mockStudents, 'nonexistent')).toHaveLength(0);
    });

    it('returns all students when search query is empty or whitespace', () => {
      expect(filterStudentsBySearch(mockStudents, '')).toHaveLength(2);
      expect(filterStudentsBySearch(mockStudents, '   ')).toHaveLength(2);
    });
  });

  describe('buildStudentProgressExportReport', () => {
    it('generates clinical monitoring text report with goals', () => {
      const overview: ProgressOverview = {
        name: 'Aiden Rivera',
        age: 6,
        program: 'Early Intervention',
        assessmentSummary: {
          skills: 'Completed',
          behavior: 'In Progress',
          preferences: 'Completed',
        },
        goals: [
          { id: 'g-1', name: 'Self-Feeding', percent: 90, status: 'Mastered', trend: [70, 80, 90] },
          {
            id: 'g-2',
            name: 'Requesting Break',
            percent: 60,
            status: 'In Progress',
            trend: [40, 50, 60],
          },
        ],
        sessionHistory: [],
        incidentSummary: 'None',
        incidents: [],
      };

      const report = buildStudentProgressExportReport(overview, mockStudents[0]);
      expect(report).toContain('STUDENT: Aiden Rivera (Age: 6)');
      expect(report).toContain('PROGRAM: Early Intervention');
      expect(report).toContain('Skills Assessment: Completed');
      expect(report).toContain('Self-Feeding: 90% (Mastered)');
    });

    it('handles null overview with fallback to selected student info', () => {
      const report = buildStudentProgressExportReport(null, mockStudents[1]);
      expect(report).toContain('STUDENT: Beatriz Santos (Age: 14)');
      expect(report).toContain('No active goals logged');
    });
  });
});
