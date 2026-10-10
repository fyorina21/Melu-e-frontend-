import { describe, it, expect } from 'vitest';
import {
  FORM_CONFIG_QUERY_KEY,
  useFormConfigQuery,
  useSaveFormConfigMutation,
  useResetFormConfigMutation,
} from './useFormConfigQuery';

describe('useFormConfigQuery', () => {
  it('defines the correct query key namespace', () => {
    expect(FORM_CONFIG_QUERY_KEY).toBe('formConfig');
  });

  it('exports form config query and mutation hooks properly', () => {
    expect(typeof useFormConfigQuery).toBe('function');
    expect(typeof useSaveFormConfigMutation).toBe('function');
    expect(typeof useResetFormConfigMutation).toBe('function');
  });
});
