import { describe, it, expect } from 'vitest';
import { DAYS, type Teacher } from './scheduleTypes';

describe('Coordinator Schedule Utilities & Models', () => {
  const mockTeachers: Teacher[] = [
    {
      id: 't-1',
      name: 'Teacher One',
      station: 'Station 1',
      room: 'Room A',
      students: ['Student 1', 'Student 2'],
      studentIds: ['s-1', 's-2'],
      sessions: 10,
      trials: 50,
      independence: 85,
      incidents: 1,
      available: true,
    },
    {
      id: 't-2',
      name: 'Teacher Two',
      station: 'Station 2',
      room: 'Room B',
      students: [],
      studentIds: [],
      sessions: 0,
      trials: 0,
      independence: 0,
      incidents: 0,
      available: false,
    },
  ];

  it('defines the standard school week days', () => {
    expect(DAYS).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    expect(DAYS.length).toBe(5);
  });

  it('identifies unassigned teachers correctly', () => {
    const unassigned = mockTeachers.filter((t) => t.students.length === 0);
    expect(unassigned.length).toBe(1);
    expect(unassigned[0].id).toBe('t-2');
  });

  it('filters teachers by selected filter or all', () => {
    const filterAll = (filter: string) =>
      filter === 'all' ? mockTeachers : mockTeachers.filter((t) => t.id === filter);

    expect(filterAll('all')).toHaveLength(2);
    expect(filterAll('t-1')).toHaveLength(1);
    expect(filterAll('t-1')[0].name).toBe('Teacher One');
    expect(filterAll('unknown')).toHaveLength(0);
  });
});
