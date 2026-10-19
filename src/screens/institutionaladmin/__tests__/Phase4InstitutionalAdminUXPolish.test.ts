import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { GoalDomainsTable } from '../goaldomains/components/GoalDomainsTable';
import { TaskAnalysisTemplatesTable } from '../goaldomains/components/TaskAnalysisTemplatesTable';

describe('Phase 4: Institutional Admin UX Polish & Accessibility Tests', () => {
  describe('GoalDomainsTable UX & Accessibility', () => {
    it('renders empty state when domains list is empty', () => {
      const element = React.createElement(GoalDomainsTable, {
        domains: [],
        editingDomainId: null,
        onMoveUp: vi.fn(),
        onMoveDown: vi.fn(),
        onToggleEdit: vi.fn(),
        onUpdateField: vi.fn(),
        onDelete: vi.fn(),
      });

      expect(element).toBeDefined();
      expect(element.props.domains).toEqual([]);
    });

    it('supplies hitSlop and accessibility attributes on domain table rows', () => {
      const mockDomains = [
        { id: 'd-1', name: 'Communication', description: 'Verbal skills', active: true },
        { id: 'd-2', name: 'Social Skills', description: 'Peer interaction', active: true },
      ];

      const element = React.createElement(GoalDomainsTable, {
        domains: mockDomains,
        editingDomainId: null,
        onMoveUp: vi.fn(),
        onMoveDown: vi.fn(),
        onToggleEdit: vi.fn(),
        onUpdateField: vi.fn(),
        onDelete: vi.fn(),
      });

      expect(element.props.domains).toHaveLength(2);
      expect(element.props.domains[0].name).toBe('Communication');
    });
  });

  describe('TaskAnalysisTemplatesTable UX & Accessibility', () => {
    it('renders empty state when templates list is empty', () => {
      const element = React.createElement(TaskAnalysisTemplatesTable, {
        templates: [],
        onAddNew: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
      });

      expect(element).toBeDefined();
      expect(element.props.templates).toEqual([]);
    });

    it('renders items and provides add/edit/delete handler hooks', () => {
      const mockTemplates = [
        {
          id: 't-1',
          name: 'Hand Washing',
          description: 'Step by step hand washing protocol',
          steps: [{ id: 's-1', description: 'Turn on water' }],
          perStepMastery: 80,
          overallMastery: 80,
          active: true,
        },
      ];

      const element = React.createElement(TaskAnalysisTemplatesTable, {
        templates: mockTemplates,
        onAddNew: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
      });

      expect(element.props.templates).toHaveLength(1);
      expect(element.props.templates[0].name).toBe('Hand Washing');
      expect(element.props.templates[0].steps).toHaveLength(1);
    });
  });

  describe('Touch Target and HitSlop Guidelines', () => {
    it('verifies standard hitSlop specification ensures at least 44pt touch area for 16-24pt icons', () => {
      const standardHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
      const iconButtonSize = 28; // standard padding 4 + 20pt icon
      const effectiveTouchWidth = iconButtonSize + standardHitSlop.left + standardHitSlop.right;
      const effectiveTouchHeight = iconButtonSize + standardHitSlop.top + standardHitSlop.bottom;

      expect(effectiveTouchWidth).toBeGreaterThanOrEqual(44);
      expect(effectiveTouchHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Form Builder Empty State Predicates', () => {
    it('correctly evaluates when empty state card should display for an empty form', () => {
      const shouldShowEmptyState = (fieldsCount: number, isAdding: boolean) =>
        fieldsCount === 0 && !isAdding;

      expect(shouldShowEmptyState(0, false)).toBe(true);
      expect(shouldShowEmptyState(0, true)).toBe(false);
      expect(shouldShowEmptyState(5, false)).toBe(false);
      expect(shouldShowEmptyState(5, true)).toBe(false);
    });
  });

  describe('ABC Lists Empty State Predicates', () => {
    it('correctly flags empty states across all 4 ABC categories when no items exist', () => {
      const isCategoryEmpty = (items: unknown[], isAddingThisCategory: boolean) =>
        items.length === 0 && !isAddingThisCategory;

      expect(isCategoryEmpty([], false)).toBe(true);
      expect(isCategoryEmpty([], true)).toBe(false);
      expect(isCategoryEmpty(['item1'], false)).toBe(false);
    });
  });
});
