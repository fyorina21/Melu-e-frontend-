// src/screens/parent/homeobservation/__tests__/homeObservation.test.ts

import { describe, it, expect } from 'vitest';
import {
  toObservation,
  formatTime,
  formatDisplayDate,
  CATEGORY_STYLE,
  STATUS_CONFIG,
} from '../homeObservationTypes';

describe('HomeObservation types & helpers', () => {
  describe('toObservation', () => {
    it('maps raw object with category and fields correctly', () => {
      const raw = {
        id: 'obs-1',
        date: '2026-10-05',
        time: '14:30',
        category: 'Achievement',
        text: 'Said new word clearly at dinner',
        status: 'Acknowledged',
        teamResponse: 'Wonderful progress!',
        therapistName: 'Ms. Clara',
        location: 'Home',
        duration: '5 mins',
      };

      const obs = toObservation(raw);
      expect(obs.id).toBe('obs-1');
      expect(obs.category).toBe('Achievement');
      expect(obs.text).toBe('Said new word clearly at dinner');
      expect(obs.status).toBe('Acknowledged');
      expect(obs.teamResponse).toBe('Wonderful progress!');
      expect(obs.therapistName).toBe('Ms. Clara');
      expect(obs.location).toBe('Home');
    });

    it('falls back to General category and handles acknowledged property', () => {
      const raw = {
        id: 'obs-2',
        behavior: 'Refused bedtime routine',
        acknowledged: 'pending',
      };

      const obs = toObservation(raw);
      expect(obs.category).toBe('General');
      expect(obs.text).toBe('Refused bedtime routine');
      expect(obs.status).toBe('Pending');
    });
  });

  describe('formatTime', () => {
    it('formats 24h ISO time to 12h AM/PM format', () => {
      expect(formatTime('09:15')).toBe('9:15 AM');
      expect(formatTime('14:30')).toBe('2:30 PM');
      expect(formatTime('00:05')).toBe('12:05 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('')).toBe('');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats YYYY-MM-DD string to readable format', () => {
      const formatted = formatDisplayDate('2026-10-05');
      expect(formatted).toBe('Oct 5, 2026');
    });

    it('returns original string if not in YYYY-MM-DD format', () => {
      expect(formatDisplayDate('Yesterday')).toBe('Yesterday');
    });
  });

  describe('CATEGORY_STYLE and STATUS_CONFIG', () => {
    it('provides styles for all 4 categories', () => {
      expect(CATEGORY_STYLE.Achievement).toBeDefined();
      expect(CATEGORY_STYLE.Behavior).toBeDefined();
      expect(CATEGORY_STYLE.Concern).toBeDefined();
      expect(CATEGORY_STYLE.General).toBeDefined();
    });

    it('provides config for all 3 acknowledgment statuses', () => {
      expect(STATUS_CONFIG.Acknowledged).toBeDefined();
      expect(STATUS_CONFIG.Pending).toBeDefined();
      expect(STATUS_CONFIG['Needs Response']).toBeDefined();
    });
  });
});
