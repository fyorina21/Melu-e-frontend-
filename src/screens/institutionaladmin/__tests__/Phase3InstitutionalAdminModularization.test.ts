import { describe, it, expect } from 'vitest';
import * as GoalDomainComponents from '../goaldomains/components';
import * as ScheduleCapacityComponents from '../schedulecapacity/components';
import * as TrialLoggingComponents from '../triallogging/components';
import * as Components from '../components';
import {
  moveItemInList,
  validateDomainSubmission,
  validateTemplateSubmission,
} from '../goaldomains/goalDomainsHelper';
import {
  sortPromptLevels,
  validatePromptLevel,
  COLOR_SWATCHES,
  type LevelItem,
} from '../triallogging/types';
import { parseTimeString, formatTimeString, DEFAULT_BLOCKS } from '../schedulecapacity/types';

describe('Phase 3: Institutional Admin Modularization & Barrel Architecture', () => {
  describe('Modular Barrel Exports', () => {
    it('exports modular form builder and admin components from components/index.ts', () => {
      expect(Components.AbcTable).toBeDefined();
      expect(Components.AbllsPresetBar).toBeDefined();
      expect(Components.AddDomainModal).toBeDefined();
      expect(Components.EditFieldModal).toBeDefined();
      expect(Components.FormBuilderToolbar).toBeDefined();
      expect(Components.FormCanvasHeader).toBeDefined();
      expect(Components.FormFieldCard).toBeDefined();
      expect(Components.FormSectionAccordion).toBeDefined();
      expect(Components.FormSelectorModal).toBeDefined();
      expect(Components.InlineAddFieldBox).toBeDefined();
      expect(Components.ModificationHistoryCard).toBeDefined();
      expect(Components.PreviewFormModal).toBeDefined();
    });

    it('exports goaldomains sub-components from goaldomains/components/index.ts', () => {
      expect(GoalDomainComponents.AddDomainFormCard).toBeDefined();
      expect(GoalDomainComponents.GoalDomainsHeader).toBeDefined();
      expect(GoalDomainComponents.GoalDomainsSectionSwitcher).toBeDefined();
      expect(GoalDomainComponents.GoalDomainsTable).toBeDefined();
      expect(GoalDomainComponents.TaskAnalysisTemplateEditor).toBeDefined();
      expect(GoalDomainComponents.TaskAnalysisTemplatesTable).toBeDefined();
    });

    it('exports schedulecapacity sub-components from schedulecapacity/components/index.ts', () => {
      expect(ScheduleCapacityComponents.CapacityAndExpiryCard).toBeDefined();
      expect(ScheduleCapacityComponents.ScheduleCapacityHeader).toBeDefined();
      expect(ScheduleCapacityComponents.SessionBlocksTable).toBeDefined();
      expect(ScheduleCapacityComponents.SessionScheduleCard).toBeDefined();
      expect(ScheduleCapacityComponents.TimePickerModal).toBeDefined();
      expect(ScheduleCapacityComponents.TimePickerSelector).toBeDefined();
    });

    it('exports triallogging sub-components from triallogging/components/index.ts', () => {
      expect(TrialLoggingComponents.PromptLevelsTable).toBeDefined();
      expect(TrialLoggingComponents.LivePreviewCard).toBeDefined();
      expect(TrialLoggingComponents.TrialLayoutConfigCard).toBeDefined();
      expect(TrialLoggingComponents.MasteryCriteriaCard).toBeDefined();
    });
  });

  describe('Extracted Helper Functionality', () => {
    it('moveItemInList reorders items up and down cleanly without mutating origin', () => {
      const items = ['A', 'B', 'C', 'D'];

      const movedUp = moveItemInList(items, 2, 'up'); // Move 'C' up
      expect(movedUp).toEqual(['A', 'C', 'B', 'D']);
      expect(items).toEqual(['A', 'B', 'C', 'D']); // Immutable

      const movedDown = moveItemInList(items, 1, 'down'); // Move 'B' down
      expect(movedDown).toEqual(['A', 'C', 'B', 'D']);

      // Boundary tests
      expect(moveItemInList(items, 0, 'up')).toEqual(items);
      expect(moveItemInList(items, 3, 'down')).toEqual(items);
      expect(moveItemInList(items, -1, 'up')).toEqual(items);
      expect(moveItemInList(items, 10, 'down')).toEqual(items);
    });

    it('validateDomainSubmission enforces at least one active domain', () => {
      expect(validateDomainSubmission([]).valid).toBe(false);
      expect(
        validateDomainSubmission([{ id: '1', name: 'Comm', description: '', active: false }]).valid,
      ).toBe(false);
      expect(
        validateDomainSubmission([{ id: '1', name: 'Comm', description: '', active: true }]).valid,
      ).toBe(true);
    });

    it('validateTemplateSubmission checks template name and steps presence', () => {
      expect(validateTemplateSubmission('', [{ id: '1', description: 'Step 1' }]).valid).toBe(
        false,
      );
      expect(validateTemplateSubmission('Hand Wash', []).valid).toBe(false);
      expect(
        validateTemplateSubmission('Hand Wash', [{ id: '1', description: 'Step 1' }]).valid,
      ).toBe(true);
    });

    it('sortPromptLevels and validatePromptLevel handle level ordering correctly', () => {
      const levels: LevelItem[] = [
        { id: '1', name: 'Verbal', color: '#3B82F6', order: 3, status: 'Active' },
        { id: '2', name: 'Independent', color: '#22C55E', order: 1, status: 'Active' },
        { id: '3', name: 'Gestural', color: '#EAB308', order: 2, status: 'Active' },
      ];

      const sorted = sortPromptLevels(levels);
      expect(sorted[0].name).toBe('Independent');
      expect(sorted[1].name).toBe('Gestural');
      expect(sorted[2].name).toBe('Verbal');

      expect(validatePromptLevel('', 4, levels).isValid).toBe(false);
      expect(validatePromptLevel('Physical', 2, levels).isValid).toBe(false); // order 2 taken
      expect(validatePromptLevel('Physical', 4, levels).isValid).toBe(true);
      expect(validatePromptLevel('Gestural Edit', 2, levels, '3').isValid).toBe(true); // self exclude
    });

    it('parseTimeString and formatTimeString round-trip time values reliably', () => {
      const timeObj = parseTimeString('09:45 AM');
      expect(timeObj).toEqual({ hour: '09', minute: '45', period: 'AM' });
      expect(formatTimeString(timeObj)).toBe('09:45 AM');

      const pmTime = parseTimeString('02:15 PM');
      expect(pmTime).toEqual({ hour: '02', minute: '15', period: 'PM' });
      expect(formatTimeString(pmTime)).toBe('02:15 PM');

      // Fallback on invalid format
      expect(parseTimeString('invalid')).toEqual({ hour: '08', minute: '00', period: 'AM' });
      expect(DEFAULT_BLOCKS.length).toBe(4);
    });
  });
});
