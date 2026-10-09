// src/screens/programdirector/summaryreport/__tests__/summaryReport.test.ts

import { describe, it, expect } from 'vitest';
import {
  filterPreferenceItemsByContext,
  MASS_ITEMS,
  FAST_ITEMS,
  type PreferenceItem,
} from '../summaryReportTypes';

describe('summaryReportTypes and helpers', () => {
  describe('MASS_ITEMS and FAST_ITEMS constants', () => {
    it('defines 12 MASS questions with valid IDs and text', () => {
      expect(MASS_ITEMS).toHaveLength(12);
      MASS_ITEMS.forEach((item, index) => {
        expect(item.id).toBe(`M${index + 1}`);
        expect(typeof item.text).toBe('string');
        expect(item.text.length).toBeGreaterThan(10);
      });
    });

    it('defines 8 FAST questions with valid IDs and text', () => {
      expect(FAST_ITEMS).toHaveLength(8);
      FAST_ITEMS.forEach((item, index) => {
        expect(item.id).toBe(`F${index + 1}`);
        expect(typeof item.text).toBe('string');
        expect(item.text.length).toBeGreaterThan(10);
      });
    });
  });

  describe('filterPreferenceItemsByContext', () => {
    const mockItems: PreferenceItem[] = [
      { id: '1', item: 'Bubbles', context: 'Sensory Time', rank: 1 },
      { id: '2', item: 'Songs', context: 'circle_time', rank: 2 },
      { id: '3', item: 'Lego', context: 'play time', rank: 3 },
      { id: '4', item: 'iPad', context: undefined, rank: 4 }, // No context should show everywhere
    ];

    it('filters items for Sensory Time tab including items without context', () => {
      const result = filterPreferenceItemsByContext(mockItems, 'Sensory Time');
      expect(result.map((r) => r.item)).toEqual(['Bubbles', 'iPad']);
    });

    it('filters items for Circle Time tab matching snake_case context', () => {
      const result = filterPreferenceItemsByContext(mockItems, 'Circle Time');
      expect(result.map((r) => r.item)).toEqual(['Songs', 'iPad']);
    });

    it('filters items for Play Time tab', () => {
      const result = filterPreferenceItemsByContext(mockItems, 'Play Time');
      expect(result.map((r) => r.item)).toEqual(['Lego', 'iPad']);
    });

    it('returns empty array when items list is empty', () => {
      const result = filterPreferenceItemsByContext([], 'Sensory Time');
      expect(result).toEqual([]);
    });

    it('returns only items without context when no item matches tab', () => {
      const items: PreferenceItem[] = [{ id: '1', item: 'Truck', context: 'Gym Time' }];
      const result = filterPreferenceItemsByContext(items, 'Sensory Time');
      expect(result).toHaveLength(0);
    });
  });
});
