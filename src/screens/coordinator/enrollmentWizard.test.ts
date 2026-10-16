import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  getTherapyGroupAgeWarning,
  INITIAL_STATE,
  STEPS,
  MAX_CASELOAD,
} from './enrollmentWizardTypes';

describe('Student Enrollment Wizard Utilities', () => {
  describe('calculateAge', () => {
    it('returns null for empty or invalid date strings', () => {
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('invalid-date')).toBeNull();
    });

    it('calculates the correct age for a past birthday', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 7;
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dob = `${birthYear}-${month}-${day}`;

      expect(calculateAge(dob)).toBe(7);
    });

    it('returns 0 if birth date is today or very recent', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(calculateAge(today)).toBe(0);
    });
  });

  describe('getTherapyGroupAgeWarning', () => {
    it('returns null when age is null', () => {
      expect(getTherapyGroupAgeWarning('Basic', null)).toBeNull();
    });

    it('returns warning when age is outside Basic range (3-12)', () => {
      expect(getTherapyGroupAgeWarning('Basic', 2)).toContain('recommended for ages 3–12');
      expect(getTherapyGroupAgeWarning('Basic', 14)).toContain('recommended for ages 3–12');
      expect(getTherapyGroupAgeWarning('Basic', 5)).toBeNull();
    });

    it('returns warning when age is outside Functional Living Skill range (13-19)', () => {
      expect(getTherapyGroupAgeWarning('Functional Living Skill', 10)).toContain(
        'recommended for ages 13–19',
      );
      expect(getTherapyGroupAgeWarning('Functional Living Skill', 22)).toContain(
        'recommended for ages 13–19',
      );
      expect(getTherapyGroupAgeWarning('Functional Living Skill', 15)).toBeNull();
    });
  });

  describe('Enrollment Constants', () => {
    it('verifies standard wizard steps and max caseload configuration', () => {
      expect(STEPS).toEqual([
        'Student Info',
        'Parent Info',
        'Medical Info',
        'Assign Therapist',
        'Review',
      ]);
      expect(MAX_CASELOAD).toBe(2);
      expect(INITIAL_STATE.gender).toBe('Female');
      expect(INITIAL_STATE.program).toBe('Regular');
    });
  });
});
