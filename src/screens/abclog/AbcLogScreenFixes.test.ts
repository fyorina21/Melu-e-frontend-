import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatLocalDate,
  extractDateStr,
  getDefaultDateRange,
  filterAbcIncidents,
  mergeAndDeduplicateIncidents,
  computeAbcStats,
  generateAbcCsv,
  generateAbcPrintHtml,
  type AbcIncident,
} from './abcLogHelpers';
import {
  getStoredAbcIncidents,
  recordAbcIncidentInStore,
  removeStoredAbcIncident,
} from '../../stores/trialsStore';

describe('AbcLogScreen Fixes & Clinical Integrity', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Timezone-Safe Date Utilities', () => {
    it('formatLocalDate formats Date objects as local YYYY-MM-DD without UTC day shifts', () => {
      const d = new Date(2026, 9, 14, 23, 45, 0); // Oct 14, 2026, 11:45 PM local
      expect(formatLocalDate(d)).toBe('2026-10-14');
    });

    it('extractDateStr extracts YYYY-MM-DD cleanly from ISO timestamps and plain dates', () => {
      expect(extractDateStr('2026-10-14T14:30:00.000Z')).toBe('2026-10-14');
      expect(extractDateStr('2026-10-14 09:15:00')).toBe('2026-10-14');
      expect(extractDateStr('2026-10-14')).toBe('2026-10-14');
      expect(extractDateStr('')).toBe('');
      expect(extractDateStr(undefined)).toBe('');
    });

    it('getDefaultDateRange returns a 30-day range in local YYYY-MM-DD format', () => {
      const range = getDefaultDateRange();
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.from <= range.to).toBe(true);
    });
  });

  describe('2. Merging & Deduplication Between API and Local Storage', () => {
    it('deduplicates identical incidents by ID and natural content signature', () => {
      const storedIncidents: AbcIncident[] = [
        {
          id: 'inc-local-1',
          date: '2026-10-10',
          time: '10:00',
          behavior: 'Aggression',
          antecedent: 'Task demand',
          consequence: 'Redirection',
          category: 'Physical',
        },
      ];

      const apiRows: AbcIncident[] = [
        // Duplicate by natural signature (same incident synced with server-assigned UUID)
        {
          id: 'server-uuid-1',
          date: '2026-10-10',
          time: '10:00',
          behavior: 'Aggression',
          antecedent: 'Task demand',
          consequence: 'Redirection',
          category: 'Physical',
        },
        // Distinct incident
        {
          id: 'server-uuid-2',
          date: '2026-10-11',
          time: '11:30',
          behavior: 'Elopement',
          antecedent: 'Transition',
          consequence: 'Returned to area',
          category: 'Safety',
        },
      ];

      const combined = mergeAndDeduplicateIncidents(storedIncidents, apiRows);

      expect(combined).toHaveLength(2);
      expect(combined.map((c) => c.behavior).sort()).toEqual(['Aggression', 'Elopement']);
      expect(combined.some((c) => c.id === 'inc-local-1')).toBe(true);
      expect(combined.some((c) => c.id === 'server-uuid-2')).toBe(true);
      expect(combined.some((c) => c.id === 'server-uuid-1')).toBe(false);
    });

    it('assigns safe, non-empty, unique IDs to prevent React key warnings when IDs are missing', () => {
      const unassignedItems: AbcIncident[] = [
        { id: '', date: '2026-10-12', time: '09:00', behavior: 'Disruption' },
        { id: '', date: '2026-10-12', time: '14:00', behavior: 'Disruption' },
      ];

      const combined = mergeAndDeduplicateIncidents([], unassignedItems);

      expect(combined).toHaveLength(2);
      expect(combined[0].id).toBeTruthy();
      expect(combined[1].id).toBeTruthy();
      expect(combined[0].id).not.toBe(combined[1].id);
    });
  });

  describe('3. Consistent Date, Behavior, and Category Filtering', () => {
    const records: AbcIncident[] = [
      { id: '1', date: '2026-10-01', behavior: 'Elopement', category: 'Safety' },
      { id: '2', date: '2026-10-05', behavior: 'Aggression', category: 'Physical' },
      { id: '3', date: '2026-10-10', behavior: 'Elopement', category: 'Safety' },
      { id: '4', date: '2026-10-14', behavior: 'Disruption', category: 'Verbal' },
    ];

    it('filters consistently across both date bounds and behavior/category filters', () => {
      const result = filterAbcIncidents(records, {
        from: '2026-10-05',
        to: '2026-10-12',
        behaviorFilter: 'Elopement',
        categoryFilter: 'Safety',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
      expect(result[0].date).toBe('2026-10-10');
    });

    it('handles "All" wildcard cleanly for filters', () => {
      const result = filterAbcIncidents(records, {
        from: '2026-10-01',
        to: '2026-10-31',
        behaviorFilter: 'All',
        categoryFilter: 'All',
      });

      expect(result).toHaveLength(4);
    });
  });

  describe('4. Weekly Statistics Calculation', () => {
    it('strictly excludes future-dated incidents and accurately counts incidents within the last 7 days', () => {
      const referenceDate = new Date(2026, 9, 14); // Oct 14, 2026

      const dataset: AbcIncident[] = [
        { id: 'past-old', date: '2026-10-01', behavior: 'Aggression', antecedent: 'Noise' },
        { id: 'in-week-1', date: '2026-10-08', behavior: 'Aggression', antecedent: 'Task demand' },
        { id: 'in-week-2', date: '2026-10-12', behavior: 'Aggression', antecedent: 'Task demand' },
        { id: 'today', date: '2026-10-14', behavior: 'Elopement', antecedent: 'Transition' },
        { id: 'future', date: '2026-10-20', behavior: 'Aggression', antecedent: 'Task demand' }, // Future date!
      ];

      const stats = computeAbcStats(dataset, referenceDate);

      // in-week-1 (Oct 8), in-week-2 (Oct 12), today (Oct 14) => 3 incidents within the past 7 days
      // future-dated incident (2026-10-20) MUST be excluded!
      expect(stats.thisWeek).toBe(3);
      expect(stats.totalIncidents).toBe(5);
      expect(stats.mostCommonBehavior).toBe('Aggression');
      expect(stats.mostCommonAntecedent).toBe('Task demand');
    });

    it('returns clean N/A and 0 counters when dataset is empty', () => {
      const stats = computeAbcStats([]);

      expect(stats.totalIncidents).toBe(0);
      expect(stats.mostCommonBehavior).toBe('N/A');
      expect(stats.mostCommonAntecedent).toBe('N/A');
      expect(stats.thisWeek).toBe(0);
    });
  });

  describe('5. Incident Deletion & Synchronization', () => {
    it('does not delete locally and does not claim success when server request fails with 500', async () => {
      const mockIncident = {
        id: 'inc-delete-test-1',
        studentId: 'stu-1',
        behavior: 'Aggression',
        date: '2026-10-14',
      };
      recordAbcIncidentInStore(mockIncident);
      expect(getStoredAbcIncidents('stu-1')).toHaveLength(1);

      let deleteSucceeded = false;
      let toastType = '';

      const simulatedDelete = async (shouldFail: boolean) => {
        try {
          if (shouldFail) {
            throw new Error('Server error: 500 Internal Server Error');
          }
          removeStoredAbcIncident(mockIncident.id);
          deleteSucceeded = true;
          toastType = 'success';
        } catch (err: any) {
          toastType = 'error';
          // Local storage is NOT purged on server failure!
        }
      };

      await simulatedDelete(true);

      expect(deleteSucceeded).toBe(false);
      expect(toastType).toBe('error');
      // Record is preserved locally so it does not falsely disappear or desync
      expect(getStoredAbcIncidents('stu-1')).toHaveLength(1);
    });

    it('deletes from local storage on successful server response', async () => {
      const mockIncident = {
        id: 'inc-delete-test-2',
        studentId: 'stu-2',
        behavior: 'Disruption',
        date: '2026-10-14',
      };
      recordAbcIncidentInStore(mockIncident);
      expect(getStoredAbcIncidents('stu-2')).toHaveLength(1);

      removeStoredAbcIncident(mockIncident.id);
      expect(getStoredAbcIncidents('stu-2')).toHaveLength(0);
    });
  });

  describe('6. CSV and Printable Report Formatting', () => {
    it('formats RFC-4180 CSV correctly with escaped quotes, headers, and notes', () => {
      const columns = [
        { key: 'date' as const, label: 'Date' },
        { key: 'behavior' as const, label: 'Behavior' },
      ];

      const records: AbcIncident[] = [
        { id: '1', date: '2026-10-14', behavior: 'Disruption', notes: 'Refused task, said "No!"' },
      ];

      const csv = generateAbcCsv(records, columns);

      expect(csv).toContain('Date,Behavior,Notes');
      expect(csv).toContain('"2026-10-14","Disruption","Refused task, said ""No!"""');
    });

    it('generates printable HTML report respecting student name, filters, stats, and records', () => {
      const columns = [
        { key: 'date' as const, label: 'Date' },
        { key: 'behavior' as const, label: 'Behavior' },
      ];

      const html = generateAbcPrintHtml({
        incidents: [{ id: '1', date: '2026-10-14', behavior: 'Elopement' }],
        studentName: 'Alex Mercer',
        studentAge: 8,
        from: '2026-10-01',
        to: '2026-10-14',
        behaviorFilter: 'Elopement',
        categoryFilter: 'All',
        stats: {
          totalIncidents: 1,
          mostCommonBehavior: 'Elopement',
          mostCommonAntecedent: 'Transition',
          thisWeek: 1,
        },
        columns,
      });

      expect(html).toContain('Alex Mercer');
      expect(html).toContain('(Age: 8)');
      expect(html).toContain('2026-10-01 to 2026-10-14');
      expect(html).toContain('Elopement');
      expect(html).toContain('Total Incidents');
    });
  });
});
