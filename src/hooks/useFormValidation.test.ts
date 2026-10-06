import { describe, it, expect, vi } from 'vitest';
import { useFormValidation } from './useFormValidation';

describe('useFormValidation', () => {
  it('is defined and is a function', () => {
    expect(typeof useFormValidation).toBe('function');
  });
});
