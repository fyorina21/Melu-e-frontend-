// src/screens/director/progress/__tests__/directorStudentProgress.test.ts

import { describe, it, expect } from 'vitest';
import {
  assessmentStatusType,
  sessionStatusType,
  generateReportText,
  type DirectorStudentData,
} from '../directorProgressTypes';

describe('Director Student Progress types & helpers', () => {
  describe('assessmentStatusType', () => {
    it('maps assessment status strings to StatusPill keys', () => {
      expect(assessmentStatusType('Completed')).toBe('completed');
      expect(assessmentStatusType('In Progress')).toBe('inProgress');
      expect(assessmentStatusType('Not Started')).toBe('notStarted');
      expect(assessmentStatusType('Unknown')).toBe('notStarted');
    });
  });

  describe('sessionStatusType', () => {
    it('maps session status strings to StatusPill keys', () => {
      expect(sessionStatusType('Approved')).toBe('approved');
      expect(sessionStatusType('Pending')).toBe('pending');
      expect(sessionStatusType('Revision Required')).toBe('revision');
      expect(sessionStatusType(undefined)).toBe('pending');
    });
  });

  describe('generateReportText', () => {
    const mockData: DirectorStudentData = {
      name: 'Emma Watson',
      age: 7,
      program: 'ABA Comprehensive',
      assessmentSummary: {
        skills: 'ABLLS-R Completed (85%)',
        behavior: 'Functional Assessment Complete',
        preferences: 'Sensory reinforcers identified',
      },
      goals: [
        { id: 'g1', name: 'Vocal Manding', percent: 85, trend: [60, 70, 85] },
        { id: 'g2', name: 'Turn Taking', percent: 65, trend: [40, 50, 65] },
        { id: 'g3', name: 'Vocal Manding', percent: 85, trend: [60, 70, 85] }, // duplicate name
      ],
      sessionHistory: [
        {
          id: 's1',
          date: '2026-10-01',
          teacherName: 'Ms. Sarah',
          status: 'Approved',
        },
      ],
      incidentSummary: '0 incidents recorded in the last 14 days.',
    };

    it('generates formatted report text with deduplicated goals and internal notes', () => {
      const report = generateReportText(mockData, 'Great progress this month.');

      expect(report).toContain('STUDENT: Emma Watson');
      expect(report).toContain('AGE: 7  |  PROGRAM: ABA Comprehensive');
      expect(report).toContain('1. Vocal Manding — 85% Independent');
      expect(report).toContain('2. Turn Taking — 65% Independent');
      // Should not contain duplicate 3. Vocal Manding
      expect(report).not.toContain('3. Vocal Manding');
      expect(report).toContain('• 2026-10-01 — Therapist: Ms. Sarah (Approved)');
      expect(report).toContain('0 incidents recorded in the last 14 days.');
      expect(report).toContain('Great progress this month.');
    });

    it('handles empty notes gracefully', () => {
      const report = generateReportText(mockData, '');
      expect(report).toContain('(None entered)');
    });
  });
});
