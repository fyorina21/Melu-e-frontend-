import { describe, it, expect } from 'vitest';
import {
  IUP_KEYS,
  useIupCandidatesQuery,
  useIupContextQuery,
  useGoalBankQuery,
  useStudentCaseloadQuery,
  useSaveIupDraftMutation,
  useFinalizeIupMutation,
} from './useIupQueries';

describe('useIupQueries', () => {
  it('generates consistent query keys for IUP resources', () => {
    expect(IUP_KEYS.candidates).toEqual(['iup', 'candidates']);
    expect(IUP_KEYS.context('stu-123')).toEqual(['iup', 'context', 'stu-123']);
    expect(IUP_KEYS.goalBank()).toEqual(['iup', 'goalBank', undefined]);
    expect(IUP_KEYS.goalBank({ domain: 'Academic' })).toEqual([
      'iup',
      'goalBank',
      { domain: 'Academic' },
    ]);
    expect(IUP_KEYS.caseload('stu-456')).toEqual(['iup', 'caseload', 'stu-456']);
  });

  it('exports IUP query and mutation hooks properly', () => {
    expect(typeof useIupCandidatesQuery).toBe('function');
    expect(typeof useIupContextQuery).toBe('function');
    expect(typeof useGoalBankQuery).toBe('function');
    expect(typeof useStudentCaseloadQuery).toBe('function');
    expect(typeof useSaveIupDraftMutation).toBe('function');
    expect(typeof useFinalizeIupMutation).toBe('function');
  });
});
