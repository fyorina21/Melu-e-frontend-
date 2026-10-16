// src/screens/assessments/behavior/__tests__/behaviorAssessment.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateMassTotals,
  calculateMassMaxFunction,
  calculateFastTotals,
  calculateFastMaxCategory,
  MASS_ITEMS,
  FAST_ITEMS,
  type MassFunction,
  type FastCategory,
} from '../behaviorTypes';

describe('BehaviorAssessment types & calculations', () => {
  describe('MASS Assessment calculations', () => {
    it('initializes all 12 questions correctly', () => {
      expect(MASS_ITEMS).toHaveLength(12);
      expect(MASS_ITEMS.every((item) => !!item.function)).toBe(true);
    });

    it('calculates massTotals correctly based on Likert weights', () => {
      const answers: Record<string, string> = {
        M1: 'Always', // Sensory (weight 6)
        M5: 'Usually', // Sensory (weight 4)
        M2: 'Never', // Escape (weight 0)
        M3: 'Half the Time', // Attention (weight 3)
        M4: 'Almost Never', // Tangible (weight 1)
      };

      const totals = calculateMassTotals(answers);
      expect(totals.Sensory).toBe(10);
      expect(totals.Escape).toBe(0);
      expect(totals.Attention).toBe(3);
      expect(totals.Tangible).toBe(1);
    });

    it('identifies maximum function correctly', () => {
      const totals: Record<MassFunction, number> = {
        Sensory: 4,
        Escape: 12,
        Attention: 2,
        Tangible: 6,
      };

      const maxFn = calculateMassMaxFunction(totals);
      expect(maxFn).toBe('Escape');
    });
  });

  describe('FAST Assessment calculations', () => {
    it('initializes all 8 questions correctly', () => {
      expect(FAST_ITEMS).toHaveLength(8);
      expect(FAST_ITEMS.every((item) => !!item.category)).toBe(true);
    });

    it('counts Yes answers per category', () => {
      const answers: Record<string, boolean> = {
        F1: true, // Social - Positive
        F7: true, // Social - Positive
        F8: false, // Social - Positive
        F2: true, // Social - Negative
        F3: true, // Automatic - Positive
      };

      const totals = calculateFastTotals(answers);
      expect(totals['Social - Positive']).toBe(2);
      expect(totals['Social - Negative']).toBe(1);
      expect(totals['Automatic - Positive']).toBe(1);
      expect(totals['Automatic - Negative']).toBe(0);
    });

    it('identifies top category correctly', () => {
      const totals: Record<FastCategory, number> = {
        'Social - Positive': 1,
        'Social - Negative': 3,
        'Automatic - Positive': 0,
        'Automatic - Negative': 1,
      };

      const maxCat = calculateFastMaxCategory(totals);
      expect(maxCat).toBe('Social - Negative');
    });
  });
});
