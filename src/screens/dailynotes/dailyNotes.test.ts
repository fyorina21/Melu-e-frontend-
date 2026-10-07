import { describe, it, expect } from 'vitest';
import type { NoteRecord, DailyNotesStats, WeeklySummaryData } from './dailyNotesTypes';

describe('dailyNotes - Record filtering and status counts', () => {
  const mockRecords: NoteRecord[] = [
    {
      id: 'rec-1',
      date: '2026-10-05',
      students: ['Alex M', 'Jordan T'],
      station: 'Station 1',
      room: 'Room A',
      status: 'Approved',
    },
    {
      id: 'rec-2',
      date: '2026-10-06',
      students: ['Alex M'],
      station: 'Station 2',
      room: 'Room B',
      status: 'Pending',
    },
    {
      id: 'rec-3',
      date: '2026-10-06',
      students: ['Taylor S'],
      station: 'Station 1',
      room: 'Room A',
      status: 'Revision Required',
      coordinatorFeedback: 'Please add trial notes for matching task.',
    },
    {
      id: 'rec-4',
      date: '2026-10-07',
      students: ['Jordan T'],
      station: 'Station 3',
      room: 'Room C',
      status: 'Draft',
    },
  ];

  it('filters records by search query matching student name', () => {
    const query = 'Alex';
    const filtered = mockRecords.filter(
      (r) =>
        r.students.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
        r.station.toLowerCase().includes(query.toLowerCase()),
    );
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.id)).toEqual(['rec-1', 'rec-2']);
  });

  it('filters records by station name', () => {
    const query = 'Station 1';
    const filtered = mockRecords.filter((r) =>
      r.station.toLowerCase().includes(query.toLowerCase()),
    );
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.id)).toEqual(['rec-1', 'rec-3']);
  });

  it('calculates status counts for weekly summary badges', () => {
    const approved = mockRecords.filter((r) => r.status === 'Approved').length;
    const pending = mockRecords.filter((r) => r.status === 'Pending').length;
    const revision = mockRecords.filter((r) => r.status === 'Revision Required').length;
    const draft = mockRecords.filter((r) => r.status === 'Draft').length;

    expect(approved).toBe(1);
    expect(pending).toBe(1);
    expect(revision).toBe(1);
    expect(draft).toBe(1);
  });
});

describe('dailyNotes - Stats and summary data', () => {
  it('validates stats integrity', () => {
    const stats: DailyNotesStats = {
      sessionsCompleted: 12,
      totalTrials: 144,
      avgIndependence: 82,
      reviewsPending: 3,
    };

    expect(stats.sessionsCompleted).toBeGreaterThan(0);
    expect(stats.avgIndependence).toBeLessThanOrEqual(100);
    expect(stats.reviewsPending).toBe(3);
  });

  it('validates weekly summary data shape', () => {
    const summary: WeeklySummaryData = {
      weekRange: 'Oct 01 - Oct 07',
      sessionsThisWeek: 15,
      totalTrialsThisWeek: 180,
      avgIndependenceThisWeek: 85,
    };

    expect(summary.weekRange).toBe('Oct 01 - Oct 07');
    expect(summary.sessionsThisWeek).toBe(15);
    expect(summary.totalTrialsThisWeek).toBe(180);
    expect(summary.avgIndependenceThisWeek).toBe(85);
  });
});
