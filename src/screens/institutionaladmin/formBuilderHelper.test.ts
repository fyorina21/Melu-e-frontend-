// src/screens/institutionaladmin/formBuilderHelper.test.ts

import { describe, it, expect } from 'vitest';
import { groupFieldsBySection, getDefaultFieldConfigForSection } from './formBuilderHelper';
import type { FormField } from '../../types';

describe('formBuilderHelper', () => {
  describe('groupFieldsBySection', () => {
    const mockFields: FormField[] = [
      {
        id: 'f1',
        label: 'Student Name',
        type: 'Text',
        section: 'Personal Info',
        required: true,
        visible: true,
      },
      {
        id: 'f2',
        label: 'Date of Birth',
        type: 'Date',
        section: 'Personal Info',
        required: true,
        visible: true,
      },
      {
        id: 'f3',
        label: 'Medical Notes',
        type: 'Text',
        section: 'Medical',
        required: false,
        visible: true,
      },
    ];

    it('correctly groups fields by explicit section', () => {
      const result = groupFieldsBySection(
        mockFields,
        ['Personal Info', 'Medical', 'Contact'],
        [],
        [],
        'Enrollment Wizard',
        () => 'General',
        null,
      );

      expect(result.grouped['Personal Info']).toHaveLength(2);
      expect(result.grouped['Medical']).toHaveLength(1);
      expect(result.activeSections).toContain('Personal Info');
      expect(result.activeSections).toContain('Medical');
      expect(result.activeSections).not.toContain('Contact'); // no fields and not custom or adding
    });

    it('filters out deleted sections', () => {
      const result = groupFieldsBySection(
        mockFields,
        ['Personal Info', 'Medical'],
        ['Medical'],
        [],
        'Enrollment Wizard',
        () => 'General',
        null,
      );

      expect(result.allSectionNames).not.toContain('Medical');
      expect(result.activeSections).not.toContain('Medical');
    });

    it('includes addingToSection in active sections even without items', () => {
      const result = groupFieldsBySection(
        mockFields,
        ['Personal Info', 'Medical', 'Emergency Contact'],
        [],
        [],
        'Enrollment Wizard',
        () => 'General',
        'Emergency Contact',
      );

      expect(result.activeSections).toContain('Emergency Contact');
    });

    it('falls back to inferSection for Enrollment Wizard if section is missing', () => {
      const fieldWithoutSection: FormField = {
        id: 'f4',
        label: 'Father Name',
        type: 'Text',
        required: false,
        visible: true,
      };
      const result = groupFieldsBySection(
        [fieldWithoutSection],
        ['Guardian Info'],
        [],
        [],
        'Enrollment Wizard',
        (label) => (label.includes('Father') ? 'Guardian Info' : 'General'),
        null,
      );

      expect(result.grouped['Guardian Info']).toHaveLength(1);
    });
  });

  describe('getDefaultFieldConfigForSection', () => {
    it('returns Radio type and ABLLS scale options for ABLLS Assessment Form', () => {
      const config = getDefaultFieldConfigForSection('ABLLS Assessment Form', 'Cooperation');
      expect(config.type).toBe('Radio');
      expect(config.options).toContain('0 — Not Demonstrated');
      expect(config.required).toBe(true);
    });

    it('returns Text type for ABC Tracking in Behavioral Assessment', () => {
      const config = getDefaultFieldConfigForSection('Behavioral Assessment', 'ABC Tracking');
      expect(config.type).toBe('Text');
      expect(config.options).toBe('');
    });

    it('returns Text type default for general forms', () => {
      const config = getDefaultFieldConfigForSection('Enrollment Wizard', 'Basic Info');
      expect(config.type).toBe('Text');
      expect(config.options).toBe('');
      expect(config.required).toBe(true);
    });
  });
});
