import { describe, it, expect } from 'vitest';
import { calculateDomainProgress, getStudentInitials } from './types';

describe('Skills Assessment (ABLLS-R) Domain Logic', () => {
  it('calculates domain progress correctly', () => {
    expect(calculateDomainProgress(0, 10)).toBe(0);
    expect(calculateDomainProgress(5, 10)).toBe(50);
    expect(calculateDomainProgress(10, 10)).toBe(100);
    expect(calculateDomainProgress(1, 3)).toBe(33);
    expect(calculateDomainProgress(0, 0)).toBe(0);
    expect(calculateDomainProgress(15, 10)).toBe(100);
  });

  it('generates student initials correctly', () => {
    expect(getStudentInitials('Alex Smith')).toBe('AS');
    expect(getStudentInitials('Jordan')).toBe('JO');
    expect(getStudentInitials('')).toBe('SA');
    expect(getStudentInitials('Mary Jane Watson')).toBe('MW');
  });
});
