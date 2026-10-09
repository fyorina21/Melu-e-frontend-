// src/screens/director/reportsOversight.test.ts

import { describe, it, expect } from 'vitest';
import { REPORT_TABS, STATIONS, type SessionReport, type Option } from './reportsTypes';
import {
  filterSessionReports,
  buildStudentProgressReportText,
  buildBiAnnualReportText,
  buildFoundationOverviewText,
} from './reportsOversightHelper';

describe('Director Reports Oversight Utilities & Filtering', () => {
  const mockReports: SessionReport[] = [
    {
      id: 'rep-1',
      date: '2026-10-01',
      teacherName: 'Sarah Jenkins',
      stationName: 'Station 1 (Basic Skills)',
      studentNames: ['Aiden Rivera', 'Leo Vance'],
    },
    {
      id: 'rep-2',
      date: '2026-10-02',
      teacherName: 'Marcus Chen',
      stationName: 'Station 2 (Advanced Skills)',
      studentNames: ['Beatriz Santos'],
    },
  ];

  const mockStudents: Option[] = [
    { id: 'stu-1', name: 'Aiden Rivera' },
    { id: 'stu-2', name: 'Beatriz Santos' },
  ];

  const mockTeachers: Option[] = [
    { id: 'tea-1', name: 'Sarah Jenkins' },
    { id: 'tea-2', name: 'Marcus Chen' },
  ];

  it('defines the core report tabs and station list', () => {
    expect(REPORT_TABS).toEqual([
      'Session Reports',
      'Student Progress',
      'Bi-Annual Reports',
      'Foundation Overview',
    ]);
    expect(STATIONS).toContain('All Stations');
    expect(STATIONS).toContain('Station 1 (Basic Skills)');
  });

  describe('filterSessionReports', () => {
    it('filters reports by student ID and name mapping', () => {
      const filtered = filterSessionReports(mockReports, {
        selectedStudentId: 'stu-1',
        students: mockStudents,
        teachers: mockTeachers,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('rep-1');
    });

    it('filters reports by teacher ID and name mapping', () => {
      const filtered = filterSessionReports(mockReports, {
        selectedTeacherId: 'tea-2',
        students: mockStudents,
        teachers: mockTeachers,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('rep-2');
    });

    it('filters reports by date substring', () => {
      const filtered = filterSessionReports(mockReports, {
        filterDate: '2026-10-01',
        students: mockStudents,
        teachers: mockTeachers,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('rep-1');
    });

    it('returns all reports when no filters are set', () => {
      const filtered = filterSessionReports(mockReports, {
        students: mockStudents,
        teachers: mockTeachers,
      });
      expect(filtered).toHaveLength(2);
    });
  });

  describe('Report Text Builders', () => {
    it('builds student progress report text correctly', () => {
      const progressData = {
        name: 'Aiden Rivera',
        age: 6,
        program: 'ABA Intensive',
        diagnosis: 'ASD Level 2',
        goals: [
          { name: 'Vocal Manding', percent: 85, status: 'In Progress' },
          { name: 'Motor Imitation', percent: 100, status: 'Mastered' },
        ],
        sessionsAttended: 24,
      };

      const text = buildStudentProgressReportText(progressData);
      expect(text).toContain('STUDENT: Aiden Rivera');
      expect(text).toContain('Vocal Manding: 85% Mastery');
      expect(text).toContain('Total Sessions Attended: 24');
    });

    it('builds bi-annual report text with session entries', () => {
      const text = buildBiAnnualReportText(mockReports);
      expect(text).toContain('BI-ANNUAL PROGRESS OVERSIGHT');
      expect(text).toContain('Lead Therapist: Sarah Jenkins');
      expect(text).toContain('Lead Therapist: Marcus Chen');
    });

    it('builds executive analytics overview text', () => {
      const overviewData = {
        totalStudents: 42,
        totalTeachers: 12,
        sessionsThisMonth: 180,
        avgGoalProgress: 76,
      };

      const text = buildFoundationOverviewText(overviewData);
      expect(text).toContain('EXECUTIVE ANALYTICS OVERVIEW');
      expect(text).toContain('Total Enrolled Students: 42');
      expect(text).toContain('Total Active Therapists: 12');
      expect(text).toContain('Average Goal Progress (Foundation-Wide): 76%');
    });

    it('returns empty string when overview is null', () => {
      expect(buildFoundationOverviewText(null)).toBe('');
    });
  });
});
