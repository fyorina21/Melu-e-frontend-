import { describe, it, expect } from 'vitest';
import { REPORT_TABS, STATIONS, type SessionReport } from './reportsTypes';

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

  it('filters reports by student name', () => {
    const filterByStudent = (name: string) =>
      mockReports.filter((r) =>
        r.studentNames.some((sn) => sn.toLowerCase().includes(name.toLowerCase())),
      );

    expect(filterByStudent('aiden')).toHaveLength(1);
    expect(filterByStudent('aiden')[0].id).toBe('rep-1');
    expect(filterByStudent('santos')).toHaveLength(1);
    expect(filterByStudent('nonexistent')).toHaveLength(0);
  });

  it('filters reports by lead therapist name', () => {
    const filterByTeacher = (name: string) =>
      mockReports.filter((r) => r.teacherName.toLowerCase().includes(name.toLowerCase()));

    expect(filterByTeacher('marcus')).toHaveLength(1);
    expect(filterByTeacher('sarah')).toHaveLength(1);
  });
});
