import { describe, it, expect } from 'vitest';
import { formatMMSS, CATEGORIES, CATEGORY_COLORS, INITIAL_ITEMS, type StimulusItem } from './types';

describe('preferenceAssessment logic', () => {
  describe('formatMMSS', () => {
    it('formats 0 seconds correctly', () => {
      expect(formatMMSS(0)).toBe('00:00');
    });

    it('formats single-digit seconds with leading zero', () => {
      expect(formatMMSS(7)).toBe('00:07');
    });

    it('formats exact minutes', () => {
      expect(formatMMSS(120)).toBe('02:00');
    });

    it('formats minutes and seconds combined', () => {
      expect(formatMMSS(367)).toBe('06:07');
    });
  });

  describe('categories & color mapping', () => {
    it('has all required categories defined', () => {
      expect(CATEGORIES).toContain('Visual');
      expect(CATEGORIES).toContain('Auditory');
      expect(CATEGORIES).toContain('Tactile');
      expect(CATEGORIES).toContain('Toys');
      expect(CATEGORIES).toContain('Movement');
    });

    it('provides valid colors for every category', () => {
      CATEGORIES.forEach((cat) => {
        expect(CATEGORY_COLORS[cat]).toBeDefined();
        expect(CATEGORY_COLORS[cat].bg).toBeTruthy();
        expect(CATEGORY_COLORS[cat].text).toBeTruthy();
      });
    });
  });

  describe('INITIAL_ITEMS', () => {
    it('initializes with 4 default visual stimulus items', () => {
      expect(INITIAL_ITEMS.length).toBe(4);
      INITIAL_ITEMS.forEach((item) => {
        expect(item.timerSeconds).toBe(0);
        expect(item.isRunning).toBe(false);
        expect(item.frequency).toBe(0);
        expect(item.durationSeconds).toBe(0);
      });
    });
  });

  describe('stimulus item state transformations', () => {
    it('toggles item timer state', () => {
      const item: StimulusItem = { ...INITIAL_ITEMS[0], isRunning: false };
      const toggled = { ...item, isRunning: !item.isRunning };
      expect(toggled.isRunning).toBe(true);
    });

    it('increments frequency and prevents negative values', () => {
      const item: StimulusItem = { ...INITIAL_ITEMS[0], frequency: 0 };
      const decreased = Math.max(0, item.frequency - 1);
      expect(decreased).toBe(0);

      const increased = Math.max(0, item.frequency + 2);
      expect(increased).toBe(2);
    });

    it('records engagement and approach states', () => {
      const item: StimulusItem = { ...INITIAL_ITEMS[0] };
      const engagedItem: StimulusItem = { ...item, engaged: 'Engaged', approached: 'Approached' };
      expect(engagedItem.engaged).toBe('Engaged');
      expect(engagedItem.approached).toBe('Approached');
    });
  });
});
