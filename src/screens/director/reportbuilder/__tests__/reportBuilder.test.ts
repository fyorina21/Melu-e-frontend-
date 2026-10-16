// src/screens/director/reportbuilder/__tests__/reportBuilder.test.ts

import { describe, it, expect } from 'vitest';
import {
  buildCsv,
  buildReportText,
  type ReportRow,
  type ReportFilterState,
  PROGRAMS,
  PERIODS,
  SCORE_FILTERS,
  GOAL_STATUSES,
  BEHAVIOR_TYPES,
  DIAGNOSES,
  ATTENDANCE_OPTIONS,
  AGE_OPTIONS,
} from '../reportBuilderTypes';

describe('Report Builder types and helpers', () => {
  const mockFilters: ReportFilterState = {
    program: 'ABA',
    therapist: 'Sarah Miller',
    ageRange: '3–5 yrs',
    attendanceFilter: '>80%',
    period: 'Jan–Mar',
    studentSearch: '',
    scoreFilter: '>70%',
    goalStatus: 'On Track',
    behaviorType: 'Tantrums',
    diagnosis: 'Autism Spectrum',
  };

  const mockRows: ReportRow[] = [
    {
      id: 'row-1',
      name: 'Leo Messi',
      age: 5,
      program: 'ABA',
      therapist: 'Sarah Miller',
      attendance: 92,
      assessmentScore: 85,
      goalStatus: 'On Track',
      behaviorType: 'Tantrums',
      diagnosis: 'Autism Spectrum',
    },
    {
      id: 'row-2',
      name: 'Alice Walker',
      age: 4,
      program: 'Speech Therapy',
      therapist: 'Alex Tan',
      attendance: 78,
      assessmentScore: 68,
      goalStatus: 'Needs Support',
      behaviorType: 'Non-Compliance',
      diagnosis: 'Speech Delay',
    },
  ];

  describe('buildCsv', () => {
    it('generates CSV string with headers and row values', () => {
      const csv = buildCsv(mockRows);
      expect(csv).toContain(
        'Name,Age,Program,Therapist,Attendance %,Assessment %,Goal Status,Behavior Type,Diagnosis',
      );
      expect(csv).toContain('Leo Messi,5,ABA,Sarah Miller,92,85,On Track,Tantrums,Autism Spectrum');
      expect(csv).toContain(
        'Alice Walker,4,Speech Therapy,Alex Tan,78,68,Needs Support,Non-Compliance,Speech Delay',
      );
    });

    it('returns empty string if results is null', () => {
      expect(buildCsv(null)).toBe('');
    });
  });

  describe('buildReportText', () => {
    it('generates formatted text document with filter details and matched students', () => {
      const text = buildReportText(mockRows, mockFilters, new Date('2026-10-09T12:00:00Z'));
      expect(text).toContain("MELU'E FOUNDATION — CUSTOM REPORT BUILDER");
      expect(text).toContain('FILTERS: Program: ABA | Therapist: Sarah Miller | Period: Jan–Mar');
      expect(text).toContain('TOTAL MATCHED STUDENTS: 2');
      expect(text).toContain('1. Leo Messi (Age 5) | Program: ABA | Therapist: Sarah Miller');
      expect(text).toContain(
        '2. Alice Walker (Age 4) | Program: Speech Therapy | Therapist: Alex Tan',
      );
    });

    it('returns empty string if results is null', () => {
      expect(buildReportText(null, mockFilters)).toBe('');
    });
  });

  describe('Filter Option Constants', () => {
    it('verifies dropdown options are non-empty arrays', () => {
      expect(PROGRAMS.length).toBeGreaterThan(0);
      expect(PERIODS.length).toBeGreaterThan(0);
      expect(SCORE_FILTERS.length).toBeGreaterThan(0);
      expect(GOAL_STATUSES.length).toBeGreaterThan(0);
      expect(BEHAVIOR_TYPES.length).toBeGreaterThan(0);
      expect(DIAGNOSES.length).toBeGreaterThan(0);
      expect(ATTENDANCE_OPTIONS.length).toBeGreaterThan(0);
      expect(AGE_OPTIONS.length).toBeGreaterThan(0);
    });
  });
});
