import { describe, it, expect } from 'vitest';
import {
  formatTime,
  mapActiveSession,
  STATUS_CONFIG,
  STATUS_OPTIONS,
  STATION_OPTIONS,
  type ActiveSessionRow,
} from './types';

describe('Live Session Monitoring Utilities', () => {
  describe('formatTime', () => {
    it('formats 0 seconds properly', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('formats under a minute properly', () => {
      expect(formatTime(45)).toBe('00:45');
    });

    it('formats minutes and seconds properly', () => {
      expect(formatTime(125)).toBe('02:05');
    });

    it('formats large duration properly', () => {
      expect(formatTime(3605)).toBe('60:05');
    });
  });

  describe('mapActiveSession', () => {
    it('correctly transforms raw active session row into typed Session', () => {
      const raw: ActiveSessionRow = {
        id: 'sess-1',
        teacherName: 'Sarah Jenkins',
        stationName: 'Station 1',
        roomName: 'Room 102',
        status: 'On Track',
        timer: '14:32',
        trialCount: 28,
        studentNames: ['Leo M.', 'Maya R.'],
        goals: ['Receptive Identification', 'Echoic Imitation'],
        trialBreakdown: { FP: 4, PP: 8, G: 6, '+': 10 },
        incidents: [{ id: 'inc-1' }, { id: 'inc-2' }],
      };

      const mapped = mapActiveSession(raw);

      expect(mapped.id).toBe('sess-1');
      expect(mapped.teacher).toBe('Sarah Jenkins');
      expect(mapped.station).toBe('Station 1');
      expect(mapped.room).toBe('Room 102');
      expect(mapped.status).toBe('on-track');
      expect(mapped.timer).toBe(14 * 60 + 32);
      expect(mapped.trials).toBe(28);
      expect(mapped.students).toEqual(['Leo M.', 'Maya R.']);
      expect(mapped.goals).toEqual(['Receptive Identification', 'Echoic Imitation']);
      expect(mapped.incidents).toBe(2);
      expect(mapped.trialBreakdown['+']).toBe(10);
    });

    it('handles fallback defaults when fields are missing or unknown', () => {
      const raw: ActiveSessionRow = {
        id: 'sess-2',
        teacherName: 'John Doe',
        stationName: 'Station 2',
        status: 'Unknown Status',
        timer: '0:00',
        trialCount: 0,
        studentNames: [],
        incidents: [],
      };

      const mapped = mapActiveSession(raw);

      expect(mapped.room).toBe('—');
      expect(mapped.status).toBe('on-track'); // default fallback
      expect(mapped.timer).toBe(0);
      expect(mapped.incidents).toBe(0);
      expect(mapped.goals).toEqual([]);
      expect(mapped.trialBreakdown['+']).toBe(0);
    });
  });

  describe('Status configuration and options', () => {
    it('has status configuration for all session statuses', () => {
      expect(STATUS_CONFIG['on-track'].label).toBe('On Track');
      expect(STATUS_CONFIG['needs-attention'].label).toBe('Needs Attention');
      expect(STATUS_CONFIG['overdue'].label).toBe('Overdue');
    });

    it('includes valid filter options', () => {
      expect(STATUS_OPTIONS.map((o) => o.value)).toContain('all');
      expect(STATUS_OPTIONS.map((o) => o.value)).toContain('on-track');
      expect(STATION_OPTIONS.map((o) => o.value)).toContain('all');
      expect(STATION_OPTIONS.map((o) => o.value)).toContain('Station 1');
    });
  });
});
