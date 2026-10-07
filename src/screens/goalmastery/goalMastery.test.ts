import { describe, it, expect } from 'vitest';
import { isTeacherVerificationValid, OUTCOME_OPTIONS, PROMPT_OPTIONS } from './types';

describe('Goal Mastery Verification Helpers', () => {
  describe('isTeacherVerificationValid', () => {
    it('returns false when no outcome is chosen', () => {
      expect(isTeacherVerificationValid(null, '')).toBe(false);
    });

    it('returns true when non-failed outcome is chosen without prompt', () => {
      expect(isTeacherVerificationValid('novel_person', '')).toBe(true);
      expect(isTeacherVerificationValid('novel_environment', '')).toBe(true);
      expect(isTeacherVerificationValid('both', '')).toBe(true);
    });

    it('returns false when outcome is failed and prompt is empty', () => {
      expect(isTeacherVerificationValid('failed', '')).toBe(false);
    });

    it('returns true when outcome is failed and valid prompt is specified', () => {
      expect(isTeacherVerificationValid('failed', 'Full Physical (FP)')).toBe(true);
      expect(isTeacherVerificationValid('failed', 'Gestural (G)')).toBe(true);
    });
  });

  describe('Configuration options', () => {
    it('provides all standard outcome options', () => {
      const ids = OUTCOME_OPTIONS.map((o) => o.id);
      expect(ids).toContain('novel_person');
      expect(ids).toContain('novel_environment');
      expect(ids).toContain('both');
      expect(ids).toContain('failed');
    });

    it('provides prompt hierarchy options', () => {
      expect(PROMPT_OPTIONS).toContain('Full Physical (FP)');
      expect(PROMPT_OPTIONS).toContain('Partial Physical (PP)');
      expect(PROMPT_OPTIONS).toContain('Gestural (G)');
    });
  });
});
