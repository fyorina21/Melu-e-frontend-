import { describe, it, expect } from 'vitest';
import type { GoalDomain, TaskAnalysisStep, TaskAnalysisTemplate } from './types';
import {
  moveItemInList,
  validateDomainSubmission,
  validateTemplateSubmission,
} from './goalDomainsHelper';

describe('Goal Domains and Task Analysis Helpers', () => {
  describe('moveItemInList', () => {
    it('moves an item up in the list correctly', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
        { id: '3', name: 'Domain C', description: 'Desc C', active: true },
      ];

      const reordered = moveItemInList(list, 1, 'up');

      expect(reordered[0].id).toBe('2');
      expect(reordered[1].id).toBe('1');
      expect(reordered[2].id).toBe('3');
    });

    it('does not change list if moving top item up', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
      ];

      const reordered = moveItemInList(list, 0, 'up');
      expect(reordered[0].id).toBe('1');
      expect(reordered[1].id).toBe('2');
    });

    it('moves an item down in the list correctly', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
        { id: '3', name: 'Domain C', description: 'Desc C', active: true },
      ];

      const reordered = moveItemInList(list, 1, 'down');

      expect(reordered[0].id).toBe('1');
      expect(reordered[1].id).toBe('3');
      expect(reordered[2].id).toBe('2');
    });

    it('does not change list if moving bottom item down', () => {
      const list: GoalDomain[] = [
        { id: '1', name: 'Domain A', description: 'Desc A', active: true },
        { id: '2', name: 'Domain B', description: 'Desc B', active: true },
      ];

      const reordered = moveItemInList(list, 1, 'down');
      expect(reordered[0].id).toBe('1');
      expect(reordered[1].id).toBe('2');
    });

    it('reorders task analysis steps cleanly', () => {
      const steps: TaskAnalysisStep[] = [
        { id: 's1', description: 'Step 1' },
        { id: 's2', description: 'Step 2' },
        { id: 's3', description: 'Step 3' },
      ];

      const updated = moveItemInList(steps, 1, 'down');
      expect(updated[1].id).toBe('s3');
      expect(updated[2].id).toBe('s2');
    });
  });

  describe('validateDomainSubmission', () => {
    it('returns invalid if there are no active domains', () => {
      const domains: GoalDomain[] = [
        { id: '1', name: 'A', description: '', active: false },
        { id: '2', name: 'B', description: '', active: false },
      ];
      const result = validateDomainSubmission(domains);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('At least one active domain is required.');
    });

    it('returns valid when at least one domain is active', () => {
      const domains: GoalDomain[] = [
        { id: '1', name: 'A', description: '', active: true },
        { id: '2', name: 'B', description: '', active: false },
      ];
      const result = validateDomainSubmission(domains);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateTemplateSubmission', () => {
    it('returns invalid if template name is empty or whitespace', () => {
      const steps: TaskAnalysisStep[] = [{ id: 's1', description: 'Step 1' }];
      const result = validateTemplateSubmission('   ', steps);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Template Name is required.');
    });

    it('returns invalid if template steps list is empty', () => {
      const result = validateTemplateSubmission('Valid Name', []);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('At least one step is required.');
    });

    it('returns valid when name and steps are provided', () => {
      const steps: TaskAnalysisStep[] = [{ id: 's1', description: 'Step 1' }];
      const result = validateTemplateSubmission('Hand Washing', steps);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
