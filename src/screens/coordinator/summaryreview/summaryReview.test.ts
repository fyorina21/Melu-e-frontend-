import { describe, it, expect } from 'vitest';
import { mapSummary, independenceColor, STATUS_CONFIG, AMBER, type ApiSummaryRow } from './types';

describe('Session Summary Review Utilities', () => {
  describe('mapSummary', () => {
    it('correctly maps raw backend API summary row', () => {
      const raw: ApiSummaryRow = {
        id: 'sum-1',
        sessionId: 'sess-1',
        teacherName: 'Marcus Vance',
        stationName: 'Station 1',
        roomName: 'Room 204',
        date: '2026-10-07',
        bodyPreview: 'Excellent progress on PECS exchange.',
        status: 'Pending',
        studentNames: ['Alex C.', 'Jordan T.'],
        independencePercent: 82,
        trialsTotal: 30,
        trialsCorrect: 25,
        incidentCount: 1,
      };

      const mapped = mapSummary(raw);

      expect(mapped.id).toBe('sum-1');
      expect(mapped.teacher).toBe('Marcus Vance');
      expect(mapped.station).toBe('Station 1');
      expect(mapped.room).toBe('Room 204');
      expect(mapped.date).toBe('2026-10-07');
      expect(mapped.students).toEqual(['Alex C.', 'Jordan T.']);
      expect(mapped.trials).toBe(30);
      expect(mapped.independence).toBe(82);
      expect(mapped.incidents).toBe(1);
      expect(mapped.status).toBe('pending');
      expect(mapped.notes).toBe('Excellent progress on PECS exchange.');
    });

    it('handles fallback defaults for missing optional fields', () => {
      const raw: ApiSummaryRow = {
        id: 'sum-2',
        sessionId: 'sess-2',
        teacherName: 'Emily Clark',
        stationName: 'Station 2',
        date: '2026-10-06',
        bodyPreview: '',
        status: 'Approved',
        studentNames: [],
        independencePercent: 55,
      };

      const mapped = mapSummary(raw);

      expect(mapped.room).toBe('');
      expect(mapped.trials).toBe(0);
      expect(mapped.incidents).toBe(0);
      expect(mapped.status).toBe('approved');
      expect(mapped.notes).toBe('');
    });
  });

  describe('independenceColor', () => {
    it('returns green for >= 70% independence', () => {
      expect(independenceColor(70)).toBe('#4ADE80');
      expect(independenceColor(95)).toBe('#4ADE80');
    });

    it('returns amber for 60% - 69% independence', () => {
      expect(independenceColor(60)).toBe(AMBER);
      expect(independenceColor(69)).toBe(AMBER);
    });

    it('returns red for < 60% independence', () => {
      expect(independenceColor(59)).toBe('#F87171');
      expect(independenceColor(20)).toBe('#F87171');
    });
  });

  describe('STATUS_CONFIG', () => {
    it('defines labels for all statuses', () => {
      expect(STATUS_CONFIG.pending.label).toBe('Pending');
      expect(STATUS_CONFIG['revision-required'].label).toBe('Revision Required');
      expect(STATUS_CONFIG.approved.label).toBe('Approved');
    });
  });
});
