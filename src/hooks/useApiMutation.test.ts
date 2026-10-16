import { describe, it, expect } from 'vitest';
import { useApiMutation } from './useApiMutation';

describe('useApiMutation', () => {
  it('is defined and is a function', () => {
    expect(typeof useApiMutation).toBe('function');
  });
});
