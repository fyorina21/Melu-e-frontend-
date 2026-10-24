// src/screens/assessments/behavior/__tests__/behaviorAssessment.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMassTotals,
  calculateMassMaxFunction,
  getTopMassFunctions,
  calculateFastTotals,
  calculateFastMaxCategory,
  getTopFastCategories,
  MASS_ITEMS,
  FAST_ITEMS,
  type MassFunction,
  type FastCategory,
  type MassItem,
  type FastItem,
} from '../behaviorTypes';
import storage from '../../../../utils/storage';
import { saveBehaviorAssessment, getBehaviorAssessment } from '../../../../api/teacherExtrasApi';

describe('BehaviorAssessment types & calculations', () => {
  beforeEach(async () => {
    await storage.removeItem('melue_behavior_assessment_stu-1');
    await storage.removeItem('melue_behavior_assessment_student-a');
    await storage.removeItem('last_assessment_student_id');
  });

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

    it('identifies multiple tied top functions accurately and returns empty when all scores are 0', () => {
      const allZero: Record<MassFunction, number> = {
        Sensory: 0,
        Escape: 0,
        Attention: 0,
        Tangible: 0,
      };
      expect(getTopMassFunctions(allZero)).toEqual([]);

      const tied: Record<MassFunction, number> = {
        Sensory: 8,
        Escape: 8,
        Attention: 2,
        Tangible: 4,
      };
      const topTied = getTopMassFunctions(tied);
      expect(topTied).toContain('Sensory');
      expect(topTied).toContain('Escape');
      expect(topTied).toHaveLength(2);
    });

    it('supports custom admin-configured mass items safely', () => {
      const customItems: MassItem[] = [
        { id: 'M1', text: 'Custom 1', function: 'Sensory' },
        { id: 'M2', text: 'Custom 2', function: 'Tangible' },
      ];
      const answers = { M1: 'Usually', M2: 'Always' };
      const totals = calculateMassTotals(answers, customItems);
      expect(totals.Sensory).toBe(4);
      expect(totals.Tangible).toBe(6);
      expect(totals.Escape).toBe(0);
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

    it('handles tied fast categories and 0 scores accurately', () => {
      const allZero: Record<FastCategory, number> = {
        'Social - Positive': 0,
        'Social - Negative': 0,
        'Automatic - Positive': 0,
        'Automatic - Negative': 0,
      };
      expect(getTopFastCategories(allZero)).toEqual([]);

      const tied: Record<FastCategory, number> = {
        'Social - Positive': 2,
        'Social - Negative': 2,
        'Automatic - Positive': 1,
        'Automatic - Negative': 0,
      };
      const topTied = getTopFastCategories(tied);
      expect(topTied).toContain('Social - Positive');
      expect(topTied).toContain('Social - Negative');
      expect(topTied).toHaveLength(2);
    });
  });

  describe('ABC Records and Persistence with Cross-Platform Storage', () => {
    it('persists behavior assessment draft and ABC incidents to unified storage across student aliases', async () => {
      const studentId = 'stu-1';
      const record = {
        id: 'rec-1',
        behavior: 'Aggression',
        frequency: '2 times',
        duration: '3 mins',
        intensity: 'Medium' as const,
        trigger: 'Task demand',
        consequence: 'Redirected',
      };

      await saveBehaviorAssessment(studentId, {
        tab: 'ABC',
        massAnswers: { M1: 'Always' },
        fastAnswers: { F1: true },
        records: [record],
        status: 'draft',
        progress: 10,
      });

      // Verify retrieval using alias student-a
      const { data: loadedByAlias } = await getBehaviorAssessment('student-a');
      expect(loadedByAlias.status).toBe('draft');
      expect(loadedByAlias.progress).toBe(10);
      expect(loadedByAlias.records).toHaveLength(1);
      expect(loadedByAlias.records[0].behavior).toBe('Aggression');

      // Verify storage getSync
      const stored = storage.getJSONSync<any>('melue_behavior_assessment_stu-1');
      expect(stored).not.toBeNull();
      expect(stored?.records[0]?.frequency).toBe('2 times');
    });

    it('updates status to submitted and progress to 100 on explicit submission', async () => {
      const studentId = 'stu-1';
      await saveBehaviorAssessment(studentId, {
        tab: 'MASS',
        massAnswers: { M1: 'Always', M2: 'Usually' },
        fastAnswers: { F1: true },
        records: [],
        status: 'submitted',
        progress: 100,
      });

      const { data: res } = await getBehaviorAssessment(studentId);
      expect(res.status).toBe('submitted');
      expect(res.progress).toBe(100);
    });
  });
});
