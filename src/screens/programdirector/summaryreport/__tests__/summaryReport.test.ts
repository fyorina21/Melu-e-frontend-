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

  describe('Clinical Assessment Visual Graphs in HTML Export', () => {
    // Dynamic import to verify generateClinicalAssessmentHtml embeds the 4 graphs
    it('embeds all 4 clinical visual graphs into the PDF markup', async () => {
      const { generateClinicalAssessmentHtml } =
        await import('../../../../utils/clinicalAssessmentPdfGenerator');

      const mockPayload = {
        student: { name: 'Abebe Bikila', student_number: 'MEL-1234-26', age: 6 },
        skills: {
          domains: [
            { code: 'A', name: 'Visual Performance', percentage: 75 },
            { code: 'B', name: 'Motor Imitation', percentage: 80 },
          ],
        },
        behavior: {
          target_behaviors: [
            {
              behavior_name: 'Physical Aggression',
              mas_scores: { escape: { total: 19, mean: 4.75, rank: 1 } },
              fast_scores: {
                social_escape: { yes_count: 7, max_points: 8, percentage: 88, dominant: true },
              },
            },
          ],
          abc_incident_log: [
            {
              behavior_name: 'Physical Aggression',
              antecedent: 'Task Demand',
              consequence: 'Task Escape',
            },
          ],
        },
        preferences: {
          top_preferences: [
            { rank: 1, name: 'Sensory Swing', duration_seconds: 180, context: 'Sensory Time' },
          ],
        },
        sensory: {
          activities: [
            { code: 'SEN-001', name: 'Tactile Responsiveness', response_reaction: 'Enjoyed' },
          ],
        },
      };

      const html = generateClinicalAssessmentHtml(mockPayload);

      // Graph 1: Skills Progress Matrix
      expect(html).toContain('ABLLS-R Grid-Based Progress Matrix');
      expect(html).toContain('Visual Performance');

      // Graph 2: Behavior MAS/FAST Clustered Bars & ABC Donut
      expect(html).toContain('MAS vs FAST Clustered Function Ranking');
      expect(html).toContain('ABC Log Environmental Donut');

      // Graph 3: Preference Ranked Bar Graph
      expect(html).toContain('Ranked Choice Reinforcer Bar Graph');

      // Graph 4: Sensory 5-Axis Spider Radar Chart
      expect(html).toContain('5-Axis Sensory Spider Chart');
      expect(html).toContain('Modulation Spectrum (Seeking vs Avoiding)');
    });
  });
});
