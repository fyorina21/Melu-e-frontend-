import { describe, it, expect } from 'vitest';
import { STATUS_PERCENT, type StudentListItem } from './studentProgressTypes';

describe('Coordinator Student Progress Utilities & Models', () => {
  const mockStudents: StudentListItem[] = [
    {
      id: 's-1',
      fullName: 'Aiden Rivera',
      age: 6,
      programType: 'Regular',
      therapyGroup: 'Basic',
      status: 'Active',
    },
    {
      id: 's-2',
      fullName: 'Beatriz Santos',
      age: 14,
      programType: 'Pulled Out',
      therapyGroup: 'Functional Living Skill',
      status: 'Active',
    },
  ];

  it('correctly maps status strings to percentage values', () => {
    expect(STATUS_PERCENT.Completed).toBe(100);
    expect(STATUS_PERCENT['In Progress']).toBe(50);
    expect(STATUS_PERCENT['Not Started']).toBe(0);
    expect(STATUS_PERCENT.Unknown).toBeUndefined();
  });

  it('filters student list by case-insensitive name search', () => {
    const filterStudents = (query: string) =>
      mockStudents.filter((s) => s.fullName.toLowerCase().includes(query.toLowerCase()));

    expect(filterStudents('aiden')).toHaveLength(1);
    expect(filterStudents('AIDEN')[0].id).toBe('s-1');
    expect(filterStudents('santos')).toHaveLength(1);
    expect(filterStudents('nonexistent')).toHaveLength(0);
  });
});
