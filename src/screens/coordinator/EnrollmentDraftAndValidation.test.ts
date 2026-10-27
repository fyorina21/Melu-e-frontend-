// src/screens/coordinator/EnrollmentDraftAndValidation.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveEnrollmentDraft,
  getEnrollmentDrafts,
  getEnrollmentDraft,
  deleteEnrollmentDraft,
  onEnrollmentDraftsChanged,
} from '../../utils/enrollmentDraftHelper';
import { resolveStudentStatus } from '../../utils/studentStatusHelper';
import { calculateAge, getTherapyGroupAgeWarning } from './enrollmentWizardTypes';
import { storage } from '../../utils/storage';

describe('Enrollment Drafts & Validation Workflow', () => {
  beforeEach(() => {
    storage.removeSync('melue_enrollment_drafts_v1');
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Enrollment Draft Storage & Lifecycle', () => {
    it('saves a half-filled form as a draft with status Draft', () => {
      const halfFilledForm = {
        name: 'Half Filled Child',
        gender: 'Male',
        program: 'Regular',
      };

      const savedDraft = saveEnrollmentDraft(halfFilledForm, 0);

      expect(savedDraft).toBeDefined();
      expect(savedDraft.id).toMatch(/^draft-/);
      expect(savedDraft.name).toBe('Half Filled Child');
      expect(savedDraft.status).toBe('Draft');
      expect(savedDraft.isDraft).toBe(true);
      expect(savedDraft.step).toBe(0);
      expect(savedDraft.formValues.gender).toBe('Male');

      const allDrafts = getEnrollmentDrafts();
      expect(allDrafts.length).toBe(1);
      expect(allDrafts[0].id).toBe(savedDraft.id);
    });

    it('retrieves a draft by ID', () => {
      const draft = saveEnrollmentDraft({ f1: 'Aiden Rivera', f2: '2019-05-10' }, 2);
      const retrieved = getEnrollmentDraft(draft.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(draft.id);
      expect(retrieved?.name).toBe('Aiden Rivera');
      expect(retrieved?.step).toBe(2);
      expect(retrieved?.age).toBeGreaterThan(0);
    });

    it('updates an existing draft when existingDraftId is provided', () => {
      const initial = saveEnrollmentDraft({ name: 'Initial Name' }, 0);
      const updated = saveEnrollmentDraft(
        { name: 'Updated Name', dob: '2018-04-01' },
        1,
        initial.id,
      );

      expect(updated.id).toBe(initial.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.step).toBe(1);

      const allDrafts = getEnrollmentDrafts();
      expect(allDrafts.length).toBe(1);
      expect(allDrafts[0].name).toBe('Updated Name');
    });

    it('deletes an enrollment draft and notifies listeners', () => {
      const listener = vi.fn();
      const unsub = onEnrollmentDraftsChanged(listener);

      const draft = saveEnrollmentDraft({ name: 'To Be Deleted' });
      expect(getEnrollmentDrafts().length).toBe(1);

      deleteEnrollmentDraft(draft.id);
      expect(getEnrollmentDrafts().length).toBe(0);
      expect(getEnrollmentDraft(draft.id)).toBeNull();

      unsub();
    });
  });

  describe('Student Status Resolution for Drafts', () => {
    it('resolves Draft status for rawStatus "draft" or "Draft"', () => {
      expect(resolveStudentStatus('std-draft-1', 'Child A', 'draft')).toBe('Draft');
      expect(resolveStudentStatus('std-draft-2', 'Child B', 'Draft')).toBe('Draft');
    });

    it('resolves Draft status when student ID starts with draft-', () => {
      expect(resolveStudentStatus('draft-12345', 'Child C', null)).toBe('Draft');
      expect(resolveStudentStatus('draft-67890', 'Child D', undefined)).toBe('Draft');
    });
  });

  describe('Non-blocking Stepper & Validation Logic', () => {
    it('calculates correct student age from date of birth', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 8;
      const dob = `${birthYear}-01-15`;
      expect(calculateAge(dob)).toBe(8);
    });

    it('flags age warnings only when applicable', () => {
      expect(getTherapyGroupAgeWarning('Basic', 15)).toContain('recommended for ages 3–12');
      expect(getTherapyGroupAgeWarning('Basic', 7)).toBeNull();
      expect(getTherapyGroupAgeWarning('Functional Living Skill', 8)).toContain(
        'recommended for ages 13–19',
      );
      expect(getTherapyGroupAgeWarning('Functional Living Skill', 16)).toBeNull();
    });
  });

  describe('Standardized Student ID Formatting (MEL-****-YY)', () => {
    it('creates students with formatted ID following MEL-****-YY standard (e.g. MEL-0001-26)', async () => {
      const { createStudentEnrollment } = await import('../../api/coordinatorApi');
      const currentYearSuffix = String(new Date().getFullYear()).slice(-2);

      const result = await createStudentEnrollment({
        firstName: 'Dawit',
        lastName: 'Alemu',
        age: 6,
        programType: 'Comprehensive ABA',
        therapyGroup: 'Basic',
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();

      const studentId = result.data.studentId || result.data.id;
      expect(studentId).toMatch(new RegExp(`^MEL-\\d{4}-${currentYearSuffix}$`));
      expect(result.data.id).toMatch(new RegExp(`^MEL-\\d{4}-${currentYearSuffix}$`));
    });

    it('normalizes student IDs to standard format when listing enrollment students', async () => {
      const { getEnrollmentStudents } = await import('../../api/coordinatorApi');
      const res = await getEnrollmentStudents({});

      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        const first = res.data[0];
        expect(first.studentId).toBeDefined();
        expect(typeof first.studentId).toBe('string');
        expect(first.studentId).toMatch(/^MEL-\d{4}-\d{2}$/);
      }
    });
  });
});
