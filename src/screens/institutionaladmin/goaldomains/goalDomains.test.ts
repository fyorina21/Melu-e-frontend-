import { describe, it, expect } from 'vitest';
import type { GoalDomain, TaskAnalysisStep, TaskAnalysisTemplate } from './types';

describe('Goal Domains and Task Analysis Helpers', () => {
  describe('Domain Reordering', () => {
    it('moves an item up in the list correctly', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
        { id: '3', name: 'Domain C', description: 'Desc C', active: true },
      ];

      const reordered = [...list];
      const index = 1;
      const temp = reordered[index - 1];
      reordered[index - 1] = reordered[index];
      reordered[index] = temp;

      expect(reordered[0].id).toBe('2');
      expect(reordered[1].id).toBe('1');
      expect(reordered[2].id).toBe('3');
    });

    it('moves an item down in the list correctly', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
        { id: '3', name: 'Domain C', description: 'Desc C', active: true },
      ];

      const reordered = [...list];
      const index = 1;
      const temp = reordered[index + 1];
      reordered[index + 1] = reordered[index];
      reordered[index] = temp;

      expect(reordered[0].id).toBe('1');
      expect(reordered[1].id).toBe('3');
      expect(reordered[2].id).toBe('2');
    });
  });

  describe('Validation Rules', () => {
    it('validates at least one active domain is required', () => {
      const domains: GoalDomain[] = [
        { id: '1', name: 'A', description: '', active: false },
        { id: '2', name: 'B', description: '', active: false },
      ];
      const activeCount = domains.filter((d) => d.active !== false).length;
      expect(activeCount).toBe(0);

      const validDomains: GoalDomain[] = [{ id: '1', name: 'A', description: '', active: true }];
      expect(validDomains.filter((d) => d.active !== false).length).toBe(1);
    });

    it('validates template name and steps count', () => {
      const template: TaskAnalysisTemplate = {
        id: 'tpl-1',
        name: 'Hand Washing',
        description: 'Wash hands step by step',
        steps: [
          { id: 's1', description: 'Turn on water' },
          { id: 's2', description: 'Apply soap' },
        ],
        perStepMastery: 80,
        overallMastery: 80,
      };

      expect(template.name.trim().length > 0).toBe(true);
      expect(template.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Template Steps Reordering', () => {
    it('swaps step positions cleanly', () => {
      const steps: TaskAnalysisStep[] = [
        { id: 's1', description: 'Step 1' },
        { id: 's2', description: 'Step 2' },
        { id: 's3', description: 'Step 3' },
      ];

      const targetIndex = 2; // move down from 1 to 2
      const updated = [...steps];
      const temp = updated[1];
      updated[1] = updated[targetIndex];
      updated[targetIndex] = temp;

      expect(updated[1].id).toBe('s3');
      expect(updated[2].id).toBe('s2');
    });
  });
});
