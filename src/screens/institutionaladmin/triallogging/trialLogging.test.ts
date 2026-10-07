import { describe, it, expect } from 'vitest';
import { sortPromptLevels, validatePromptLevel, COLOR_SWATCHES, type LevelItem } from './types';

describe('Trial Logging Format Domain Logic', () => {
  const mockLevels: LevelItem[] = [
    { id: '1', name: 'Independent', color: '#22C55E', order: 1, status: 'Active' },
    { id: '2', name: 'Verbal', color: '#3B82F6', order: 3, status: 'Active' },
    { id: '3', name: 'Gestural', color: '#EAB308', order: 2, status: 'Active' },
  ];

  it('sorts prompt levels ascending by order', () => {
    const sorted = sortPromptLevels(mockLevels);
    expect(sorted.map((s) => s.order)).toEqual([1, 2, 3]);
    expect(sorted.map((s) => s.name)).toEqual(['Independent', 'Gestural', 'Verbal']);
  });

  it('validates prompt level name cannot be empty', () => {
    const result = validatePromptLevel('  ', 4, mockLevels);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Every prompt level needs a name');
  });

  it('validates unique order number for new prompt level', () => {
    const duplicateResult = validatePromptLevel('Physical', 2, mockLevels);
    expect(duplicateResult.isValid).toBe(false);
    expect(duplicateResult.error).toContain('Order 2 is already in use');

    const validResult = validatePromptLevel('Physical', 4, mockLevels);
    expect(validResult.isValid).toBe(true);
  });

  it('validates order number when editing existing prompt level', () => {
    // When editing item '3', keeping order 2 should be valid
    const selfOrderResult = validatePromptLevel('Gestural Modified', 2, mockLevels, '3');
    expect(selfOrderResult.isValid).toBe(true);

    // When editing item '3', taking item '1' order should fail
    const conflictResult = validatePromptLevel('Gestural Modified', 1, mockLevels, '3');
    expect(conflictResult.isValid).toBe(false);
    expect(conflictResult.error).toContain('Order 1 is already in use');
  });

  it('provides color swatches palette', () => {
    expect(COLOR_SWATCHES.length).toBeGreaterThanOrEqual(8);
    expect(COLOR_SWATCHES).toContain('#22C55E');
    expect(COLOR_SWATCHES).toContain('#3B82F6');
  });
});
