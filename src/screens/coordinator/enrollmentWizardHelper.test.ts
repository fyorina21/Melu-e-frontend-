// src/screens/coordinator/enrollmentWizardHelper.test.ts

import { describe, it, expect } from 'vitest';
import {
  validateStep,
  buildReviewSections,
  prepareEnrollmentPayload,
  buildCustomSectionEntries,
  buildRemainingCustomRows,
} from './enrollmentWizardHelper';
import { INITIAL_STATE, type WizardState } from './enrollmentWizardTypes';

describe('Enrollment Wizard Helpers', () => {
  describe('validateStep', () => {
    it('validates Student Info step correctly', () => {
      const isTherapistFull = () => false;

      // Empty name
      expect(
        validateStep(
          'Student Info',
          { ...INITIAL_STATE, name: '', dob: '2020-01-01' },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: false, error: 'Student name is required' });

      // Empty DOB
      expect(
        validateStep(
          'Student Info',
          { ...INITIAL_STATE, name: 'Leo', dob: '' },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: false, error: 'Date of birth is required' });

      // Valid
      expect(
        validateStep(
          'Student Info',
          { ...INITIAL_STATE, name: 'Leo', dob: '2020-01-01' },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: true });
    });

    it('validates Parent Info step correctly', () => {
      const isTherapistFull = () => false;

      // Empty parent name
      expect(
        validateStep('Parent Info', { ...INITIAL_STATE, parentName: '' }, [], {}, isTherapistFull),
      ).toEqual({ valid: false, error: 'Parent name is required' });

      // Invalid phone
      expect(
        validateStep(
          'Parent Info',
          { ...INITIAL_STATE, parentName: 'Jane', parentPhone: '123' },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: false, error: 'Invalid phone (7-20 digits, spaces, ()/+ -)' });

      // Invalid email
      expect(
        validateStep(
          'Parent Info',
          {
            ...INITIAL_STATE,
            parentName: 'Jane',
            parentPhone: '555-123-4567',
            parentEmail: 'invalid',
          },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: false, error: 'Invalid parent email address' });

      // Valid
      expect(
        validateStep(
          'Parent Info',
          {
            ...INITIAL_STATE,
            parentName: 'Jane',
            parentPhone: '555-123-4567',
            parentEmail: 'jane@example.com',
          },
          [],
          {},
          isTherapistFull,
        ),
      ).toEqual({ valid: true });
    });

    it('validates Assign Therapist step capacity', () => {
      expect(
        validateStep('Assign Therapist', { ...INITIAL_STATE, therapist: '' }, [], {}, () => false),
      ).toEqual({ valid: false, error: 'Please pick a therapist' });

      expect(
        validateStep(
          'Assign Therapist',
          { ...INITIAL_STATE, therapist: 'Sarah Miller' },
          [],
          {},
          () => true,
        ),
      ).toEqual({
        valid: false,
        error: 'Sarah Miller is at maximum capacity (2 students). Choose another therapist.',
      });
    });
  });

  describe('buildReviewSections', () => {
    it('creates structured review rows', () => {
      const form: WizardState = {
        ...INITIAL_STATE,
        name: 'Leo Messi',
        gender: 'Male',
        dob: '2018-05-10',
        program: 'Regular',
        therapist: 'Sarah Miller',
      };

      const sections = buildReviewSections(form);
      expect(sections).toHaveLength(4);
      expect(sections[0].title).toBe('Student');
      expect(sections[0].rows[0]).toEqual(['Full Name', 'Leo Messi']);
      expect(sections[3].title).toBe('Therapist');
      expect(sections[3].rows[0]).toEqual(['Therapist', 'Sarah Miller']);
    });
  });

  describe('prepareEnrollmentPayload', () => {
    it('formats firstName and lastName split properly', () => {
      const form: WizardState = {
        ...INITIAL_STATE,
        name: 'Alice Wonder Land',
        dob: '2019-03-15',
        parentName: 'Queen of Hearts',
        parentPhone: '555-987-6543',
        parentEmail: 'queen@wonder.land',
      };

      const payload = prepareEnrollmentPayload(form, { customKey: 'val' });
      expect(payload.firstName).toBe('Alice');
      expect(payload.lastName).toBe('Wonder Land');
      expect(payload.parentName).toBe('Queen of Hearts');
      expect(payload.customFields).toEqual({ customKey: 'val' });
    });
  });

  describe('buildCustomSectionEntries and buildRemainingCustomRows', () => {
    it('groups custom fields by section', () => {
      const formFields = [{ id: 'f1', label: 'Allergies', section: 'Dietary', visible: true }];
      const customValues = { f1: 'Peanuts' };

      const entries = buildCustomSectionEntries(['Dietary'], formFields, customValues);
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Dietary');
      expect(entries[0].rows).toEqual([['Allergies', 'Peanuts']]);

      const remaining = buildRemainingCustomRows(formFields, { otherNote: 'Special care' });
      expect(remaining).toEqual([['otherNote', 'Special care']]);
    });
  });
});
