// src/screens/assessments/behavior/__tests__/behaviorAssessment.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateMassCategoryScores,
  calculateFastCategoryScores,
  calculateMassTotals,
  calculateMassMaxFunction,
  calculateFastTotals,
  calculateFastMaxCategory,
  validateTargetBehaviorCompleteness,
  MASS_ITEMS,
  FAST_ITEMS,
  MAS_CATEGORIES,
  MAS_CATEGORY_ITEM_NUMBERS,
  FAST_MAINTAINING_VARIABLES,
  type BehaviorTargetAssessmentData,
} from '../behaviorTypes';

describe('BehaviorAssessment Module: Exact MAS-16 and FAST Calculation Engines', () => {
  describe('1. Motivation Assessment Scale (MAS 16-Item, Delaney & Durand 1986) Engine', () => {
    it('initializes all 16 items mapped across the 4 authentic categories', () => {
      expect(MASS_ITEMS).toHaveLength(16);

      // Verify category item counts (4 categories x 4 questions)
      expect(MAS_CATEGORY_ITEM_NUMBERS.Sensory).toHaveLength(4);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Escape).toHaveLength(4);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Attention).toHaveLength(4);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Tangible).toHaveLength(4);

      expect(MAS_CATEGORY_ITEM_NUMBERS.Sensory).toEqual([1, 5, 9, 13]);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Escape).toEqual([2, 6, 10, 14]);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Attention).toEqual([3, 7, 11, 15]);
      expect(MAS_CATEGORY_ITEM_NUMBERS.Tangible).toEqual([4, 8, 12, 16]);

      const totalItems =
        MAS_CATEGORY_ITEM_NUMBERS.Sensory.length +
        MAS_CATEGORY_ITEM_NUMBERS.Escape.length +
        MAS_CATEGORY_ITEM_NUMBERS.Attention.length +
        MAS_CATEGORY_ITEM_NUMBERS.Tangible.length;
      expect(totalItems).toBe(16);
    });

    it('calculates authentic MAS 16-item category totals, means, and ranking correctly', () => {
      const massAnswers: Record<string, string> = {};

      // Set Sensory items (1, 5, 9, 13) to "Always" (6) -> Total 24, Mean 6.00
      MAS_CATEGORY_ITEM_NUMBERS.Sensory.forEach((num) => {
        massAnswers[`M${num}`] = 'Always';
      });

      // Set Escape (2, 6, 10, 14) to "Usually" (4) -> Total 16, Mean 4.00
      MAS_CATEGORY_ITEM_NUMBERS.Escape.forEach((num) => {
        massAnswers[`M${num}`] = 'Usually';
      });

      // Set Attention (3, 7, 11, 15) to "Seldom" (2) -> Total 8, Mean 2.00
      MAS_CATEGORY_ITEM_NUMBERS.Attention.forEach((num) => {
        massAnswers[`M${num}`] = 'Seldom';
      });

      // Set Tangible (4, 8, 12, 16) to "Almost Never" (1) -> Total 4, Mean 1.00
      MAS_CATEGORY_ITEM_NUMBERS.Tangible.forEach((num) => {
        massAnswers[`M${num}`] = 'Almost Never';
      });

      const result = calculateMassCategoryScores(massAnswers);

      // Verify category metrics
      expect(result.scores.Sensory.total).toBe(24);
      expect(result.scores.Sensory.mean).toBe(6);
      expect(result.scores.Sensory.rank).toBe(1);

      expect(result.scores.Escape.total).toBe(16);
      expect(result.scores.Escape.mean).toBe(4);
      expect(result.scores.Escape.rank).toBe(2);

      expect(result.scores.Attention.total).toBe(8);
      expect(result.scores.Attention.mean).toBe(2);
      expect(result.scores.Attention.rank).toBe(3);

      expect(result.scores.Tangible.total).toBe(4);
      expect(result.scores.Tangible.mean).toBe(1);
      expect(result.scores.Tangible.rank).toBe(4);

      // Primary Maintaining Variable
      expect(result.primaryMaintainingVariable).toBe('Sensory');
      expect(result.ranking[0].category).toBe('Sensory');
      expect(result.ranking[3].category).toBe('Tangible');
    });

    it('ranks higher mean over lower mean per target behavior', () => {
      const massAnswers: Record<string, string> = {};

      MAS_CATEGORY_ITEM_NUMBERS.Escape.forEach((num) => {
        massAnswers[`M${num}`] = 'Almost Always'; // 5 -> Mean 5.00
      });
      MAS_CATEGORY_ITEM_NUMBERS.Tangible.forEach((num) => {
        massAnswers[`M${num}`] = 'Usually'; // 4 -> Mean 4.00
      });
      MAS_CATEGORY_ITEM_NUMBERS.Sensory.forEach((num) => {
        massAnswers[`M${num}`] = 'Seldom'; // 2 -> Mean 2.00
      });
      MAS_CATEGORY_ITEM_NUMBERS.Attention.forEach((num) => {
        massAnswers[`M${num}`] = 'Never'; // 0 -> Mean 0.00
      });

      const result = calculateMassCategoryScores(massAnswers);
      expect(result.scores.Escape.mean).toBe(5);
      expect(result.scores.Tangible.mean).toBe(4);
      expect(result.scores.Sensory.mean).toBe(2);
      expect(result.scores.Attention.mean).toBe(0);

      expect(result.scores.Escape.rank).toBe(1);
      expect(result.scores.Tangible.rank).toBe(2);
      expect(result.scores.Sensory.rank).toBe(3);
      expect(result.scores.Attention.rank).toBe(4);
      expect(result.primaryMaintainingVariable).toBe('Escape');
    });
  });

  describe('2. Functional Assessment Screening Tool (FAST) Engine', () => {
    it('initializes all 27 items with Part I and Part II classification', () => {
      expect(FAST_ITEMS).toHaveLength(27);

      const partOneItems = FAST_ITEMS.filter((i) => i.isPartOne);
      const partTwoItems = FAST_ITEMS.filter((i) => !i.isPartOne);

      expect(partOneItems).toHaveLength(3);
      expect(partTwoItems).toHaveLength(24);
    });

    it('applies Part I gating logic: rolls Q1-3 into social reinforcement totals when answered Yes', () => {
      const fastAnswers: Record<string, boolean> = {
        // Part I: Social influence Q1 is Yes
        F1: true,
        F2: false,
        F3: false,

        // Part II: Attention items Q4-8 (all 5 Yes)
        F4: true,
        F5: true,
        F6: true,
        F7: true,
        F8: true,

        // Tangible items Q9-13 (all No)
        F9: false,
        F10: false,
        F11: false,
        F12: false,
        F13: false,

        // Escape items Q14-18 (all No)
        F14: false,
        F15: false,
        F16: false,
        F17: false,
        F18: false,

        // Sensory items Q19-24 (all No)
        F19: false,
        F20: false,
        F21: false,
        F22: false,
        F23: false,
        F24: false,

        // Pain items Q25-27 (all No)
        F25: false,
        F26: false,
        F27: false,
      };

      const result = calculateFastCategoryScores(fastAnswers);

      expect(result.partOneHasSocialInfluence).toBe(true);
      expect(result.partOneSocialYesCount).toBe(1);

      // Social Reinforcement — Attention: 1 (from Q1) + 5 (from Q4-8) = 6 out of 8 (75%)
      expect(result.scores['Social Reinforcement — Attention'].yesCount).toBe(6);
      expect(result.scores['Social Reinforcement — Attention'].maxPoints).toBe(8);
      expect(result.scores['Social Reinforcement — Attention'].percentage).toBe(75);
      expect(result.scores['Social Reinforcement — Attention'].isDominant).toBe(true);

      // Social Reinforcement — Tangible: 1 (from Q1) + 0 (from Q9-13) = 1 out of 8 (13%)
      expect(result.scores['Social Reinforcement — Tangible'].yesCount).toBe(1);
      expect(result.scores['Social Reinforcement — Tangible'].maxPoints).toBe(8);

      // Social Reinforcement — Escape: 1 (from Q1) + 0 (from Q14-18) = 1 out of 8 (13%)
      expect(result.scores['Social Reinforcement — Escape'].yesCount).toBe(1);

      // Automatic Reinforcement: Sensory = 0 / 6 (0%), Pain = 0 / 6 (0%)
      expect(result.scores['Automatic Reinforcement — Sensory Stimulation'].yesCount).toBe(0);
      expect(result.scores['Automatic Reinforcement — Pain Attenuation'].yesCount).toBe(0);

      expect(result.dominantVariables).toContain('Social Reinforcement — Attention');
    });

    it('calculates Automatic Reinforcement sensory and pain attenuation correctly', () => {
      const fastAnswers: Record<string, boolean> = {
        // Part I all No
        F1: false,
        F2: false,
        F3: false,

        // Sensory: Q19, 20, 21, 22, 23, 24 all Yes (6 out of 6 -> 100%)
        F19: true,
        F20: true,
        F21: true,
        F22: true,
        F23: true,
        F24: true,

        // Pain attenuation: Q19, 20, 24 are Yes, Q25, 26, 27 are No -> 3 out of 6 (50%)
        F25: false,
        F26: false,
        F27: false,
      };

      const result = calculateFastCategoryScores(fastAnswers);
      expect(result.scores['Automatic Reinforcement — Sensory Stimulation'].yesCount).toBe(6);
      expect(result.scores['Automatic Reinforcement — Sensory Stimulation'].percentage).toBe(100);
      expect(result.scores['Automatic Reinforcement — Sensory Stimulation'].isDominant).toBe(true);

      expect(result.scores['Automatic Reinforcement — Pain Attenuation'].yesCount).toBe(3);
      expect(result.scores['Automatic Reinforcement — Pain Attenuation'].percentage).toBe(50);

      expect(result.dominantVariables).toEqual(['Automatic Reinforcement — Sensory Stimulation']);
    });
  });

  describe('3. Multi-Target Behavior State Management & Validation', () => {
    it('detects incomplete target behaviors when questions remain unanswered', () => {
      const target: BehaviorTargetAssessmentData = {
        behaviorName: 'Biting Others',
        definition: 'Clamping teeth onto skin or clothing of others',
        massAnswers: { M1: 'Always', M2: 'Never' }, // only 2 of 16
        fastAnswers: { F1: true }, // only 1 of 27
      };

      const validation = validateTargetBehaviorCompleteness(target, 16, 27);
      expect(validation.complete).toBe(false);
      expect(validation.missingMass).toBe(14);
      expect(validation.missingFast).toBe(26);
    });

    it('marks target behavior as complete when all 16 MAS and 27 FAST questions are answered', () => {
      const massAnswers: Record<string, string> = {};
      for (let i = 1; i <= 16; i++) {
        massAnswers[`M${i}`] = 'Usually';
      }

      const fastAnswers: Record<string, boolean> = {};
      for (let i = 1; i <= 27; i++) {
        fastAnswers[`F${i}`] = false;
      }

      const target: BehaviorTargetAssessmentData = {
        behaviorName: 'Screaming',
        definition: 'High-pitched vocal tantrums > 5s',
        massAnswers,
        fastAnswers,
      };

      const validation = validateTargetBehaviorCompleteness(target, 16, 27);
      expect(validation.complete).toBe(true);
      expect(validation.missingMass).toBe(0);
      expect(validation.missingFast).toBe(0);
    });

    it('keeps independent scores for each target behavior without data bleeding', () => {
      // Behavior 1: Screaming (Sensory driven)
      const screamingMass: Record<string, string> = {};
      MAS_CATEGORY_ITEM_NUMBERS.Sensory.forEach((n) => (screamingMass[`M${n}`] = 'Always'));
      const screamingScore = calculateMassCategoryScores(screamingMass);

      // Behavior 2: Biting (Escape driven)
      const bitingMass: Record<string, string> = {};
      MAS_CATEGORY_ITEM_NUMBERS.Escape.forEach((n) => (bitingMass[`M${n}`] = 'Always'));
      const bitingScore = calculateMassCategoryScores(bitingMass);

      expect(screamingScore.primaryMaintainingVariable).toBe('Sensory');
      expect(bitingScore.primaryMaintainingVariable).toBe('Escape');
      expect(screamingScore.scores.Sensory.total).toBe(24);
      expect(bitingScore.scores.Escape.total).toBe(24);
    });
  });

  describe('4. Backward Compatibility Fallbacks', () => {
    it('supports legacy calculateMassTotals and calculateFastTotals', () => {
      const answers: Record<string, string> = {
        M1: 'Always', // Sensory (6)
        M2: 'Half the Time', // Escape (3)
        M3: 'Almost Never', // Attention (1)
        M4: 'Never', // Tangible (0)
      };

      const totals = calculateMassTotals(answers);
      expect(totals.Sensory).toBe(6);
      expect(totals.Escape).toBe(3);
      expect(totals.Attention).toBe(1);
      expect(totals.Tangible).toBe(0);

      const maxFn = calculateMassMaxFunction(totals);
      expect(maxFn).toBe('Sensory');

      const fastAns: Record<string, boolean> = {
        F1: true,
        F2: false,
      };
      const fastTotals = calculateFastTotals(fastAns);
      expect(typeof fastTotals).toBe('object');
    });
  });

  describe('5. Target Behavior Catalog Selection & Keyboard Submission Engine', () => {
    it('deduplicates and builds catalog list from institutional options and standard presets', () => {
      const institutional = [
        {
          name: 'Aggression',
          definition: 'Physical acts directed toward others',
          default_category: 'Physical',
        },
        { name: 'Elopement', definition: 'Leaving designated area', default_category: 'Safety' },
      ];
      const presets = ['Aggression', 'Screaming / Vocal Tantrum', 'Flopping to Floor'];

      const list: Array<{ name: string; definition: string; category: string }> = [];
      const seen = new Set<string>();

      institutional.forEach((item) => {
        const name = item.name.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({
            name,
            definition: item.definition,
            category: item.default_category,
          });
        }
      });

      presets.forEach((preset) => {
        const name = preset.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({
            name,
            definition: `Preset: ${preset}`,
            category: 'Standard',
          });
        }
      });

      expect(list).toHaveLength(4);
      expect(list.map((i) => i.name)).toEqual([
        'Aggression',
        'Elopement',
        'Screaming / Vocal Tantrum',
        'Flopping to Floor',
      ]);
    });

    it('clearly determines selection state and prevents re-adding existing behaviors', () => {
      const activeTargets: BehaviorTargetAssessmentData[] = [
        { id: 't-1', behaviorName: 'Aggression', massAnswers: {}, fastAnswers: {} },
      ];

      const catalog = [
        { name: 'Aggression', definition: 'Acts toward others' },
        { name: 'Elopement', definition: 'Leaving area' },
        { name: 'Flopping to Floor', definition: 'Dropping down' },
      ];

      // Check if item is already added
      const isAggressionAdded = activeTargets.some(
        (b) => b.behaviorName.toLowerCase() === catalog[0].name.toLowerCase(),
      );
      const isElopementAdded = activeTargets.some(
        (b) => b.behaviorName.toLowerCase() === catalog[1].name.toLowerCase(),
      );

      expect(isAggressionAdded).toBe(true);
      expect(isElopementAdded).toBe(false);

      // Select Elopement
      let selectedBehavior: { name: string; definition: string } | null = catalog[1];
      expect(selectedBehavior.name).toBe('Elopement');

      // Enter key trigger simulates adding selected item
      const handleEnterSubmit = () => {
        if (!selectedBehavior) return null;
        if (
          activeTargets.some(
            (b) => b.behaviorName.toLowerCase() === selectedBehavior!.name.toLowerCase(),
          )
        ) {
          return 'duplicate';
        }
        const created: BehaviorTargetAssessmentData = {
          id: 't-2',
          behaviorName: selectedBehavior.name,
          definition: selectedBehavior.definition,
          massAnswers: {},
          fastAnswers: {},
        };
        activeTargets.push(created);
        selectedBehavior = null;
        return created;
      };

      const result = handleEnterSubmit();
      expect(result).not.toBeNull();
      expect((result as BehaviorTargetAssessmentData).behaviorName).toBe('Elopement');
      expect(activeTargets).toHaveLength(2);
      expect(selectedBehavior).toBeNull();
    });
  });
});
