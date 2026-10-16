import { describe, it, expect } from 'vitest';
import {
  filterStaffOptions,
  filterStudentOptions,
  isBlockOverCapacity,
  type Option,
  type ScheduleBlock,
} from './types';

describe('Director Scheduling Domain Logic', () => {
  const mockStaff: Option[] = [
    { id: '1', name: 'Alice Teacher', role: 'teacher' },
    { id: '2', name: 'Bob Specialist', role: 'teacher' },
  ];

  const mockStudents: Option[] = [
    { id: 's1', name: 'Charlie Brown', status: 'Active' },
    { id: 's2', name: 'Diana Prince', status: 'Active' },
  ];

  it('filters staff options by search query', () => {
    expect(filterStaffOptions(mockStaff, '')).toHaveLength(2);
    expect(filterStaffOptions(mockStaff, 'alice')).toEqual([mockStaff[0]]);
    expect(filterStaffOptions(mockStaff, 'nonexistent')).toEqual([]);
  });

  it('filters student options by search query', () => {
    expect(filterStudentOptions(mockStudents, '')).toHaveLength(2);
    expect(filterStudentOptions(mockStudents, 'diana')).toEqual([mockStudents[1]]);
  });

  it('correctly calculates whether a block is over capacity', () => {
    const block: ScheduleBlock = {
      id: 'b1',
      teacherName: 'Alice',
      stationName: 'Station 1',
      startTime: '09:00',
      endTime: '10:00',
      studentIds: ['s1', 's2', 's3'],
    };

    expect(isBlockOverCapacity(block, 2)).toBe(true);
    expect(isBlockOverCapacity(block, 3)).toBe(false);
    expect(isBlockOverCapacity(block, 4)).toBe(false);
  });
});
