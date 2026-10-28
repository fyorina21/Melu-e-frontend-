import { describe, it, expect } from 'vitest';
import {
  type Goal,
  goalToWithStatus,
  domainFilterMap,
  statusBadgeColors,
  emptyStudentGoals,
  slotLabels,
  allDomains,
} from './caseloadTypes';

describe('caseloadTypes - goalToWithStatus', () => {
  const mockGoal: Goal = {
    id: 'g-1',
    name: 'Identify Common Objects',
    domain: 'Receptive Language',
    description: 'Student will point to named common objects',
  };

  it('transforms Goal into GoalWithStatus with defaults', () => {
    const result = goalToWithStatus(mockGoal);
    expect(result.id).toBe('g-1');
    expect(result.name).toBe('Identify Common Objects');
    expect(result.status).toBe('Active');
    expect(result.progress).toBe(50);
  });

  it('allows overriding status and progress', () => {
    const result = goalToWithStatus(mockGoal, 'Mastered', 100);
    expect(result.status).toBe('Mastered');
    expect(result.progress).toBe(100);
  });
});

describe('caseloadTypes - domain and slot configuration', () => {
  it('defines empty goals for all 4 station slots', () => {
    expect(Object.keys(emptyStudentGoals)).toEqual([
      'station1-0',
      'station1-1',
      'station2-0',
      'station2-1',
    ]);
    expect(emptyStudentGoals['station1-0']).toBeNull();
    expect(emptyStudentGoals['station1-1']).toBeNull();
    expect(emptyStudentGoals['station2-0']).toBeNull();
    expect(emptyStudentGoals['station2-1']).toBeNull();
  });

  it('has human-readable labels for all 4 station slots', () => {
    expect(slotLabels['station1-0']).toBe('Station 1 — Slot 1');
    expect(slotLabels['station1-1']).toBe('Station 1 — Slot 2');
    expect(slotLabels['station2-0']).toBe('Station 2 — Slot 1');
    expect(slotLabels['station2-1']).toBe('Station 2 — Slot 2');
  });

  it('maps Communication domain to receptive and expressive language', () => {
    expect(domainFilterMap.Communication).toContain('Receptive Language');
    expect(domainFilterMap.Communication).toContain('Expressive Language');
  });

  it('contains badge colors for all goal statuses', () => {
    expect(statusBadgeColors.Active).toBeDefined();
    expect(statusBadgeColors['In Progress']).toBeDefined();
    expect(statusBadgeColors.Mastered).toBeDefined();
  });

  it('includes All as the first domain option', () => {
    expect(allDomains[0]).toBe('All');
  });
});

describe('caseload - 2-goal assignment limit constraint', () => {
  it('counts assigned goals and correctly determines if assignment limit of 2 goals is reached', () => {
    const goals = { ...emptyStudentGoals };
    const countGoals = (g: typeof emptyStudentGoals) =>
      (Object.keys(g) as (keyof typeof emptyStudentGoals)[]).filter((k) => g[k] !== null).length;

    expect(countGoals(goals)).toBe(0);
    expect(countGoals(goals) >= 2).toBe(false);

    goals['station1-0'] = goalToWithStatus({
      id: 'g-1',
      name: 'Goal 1',
      domain: 'Communication',
      description: 'Desc 1',
    });
    expect(countGoals(goals)).toBe(1);
    expect(countGoals(goals) >= 2).toBe(false);

    goals['station2-0'] = goalToWithStatus({
      id: 'g-2',
      name: 'Goal 2',
      domain: 'Adaptive',
      description: 'Desc 2',
    });
    expect(countGoals(goals)).toBe(2);
    expect(countGoals(goals) >= 2).toBe(true);
  });
});

describe('caseload - student dropdown selection & filtering helper logic', () => {
  const students = [
    {
      id: 's1',
      name: 'Liam Davis',
      age: 7,
      phase: 'Phase 1',
      program: 'Early Intervention',
      status: 'Active',
    },
    {
      id: 's2',
      name: 'Emma Watson',
      age: 6,
      phase: 'Phase 2',
      program: 'Therapy',
      status: 'Active',
    },
    { id: 's3', name: 'Oliver Smith', age: 8, phase: 'Phase 1', program: 'ABA', status: 'Pending' },
  ];

  it('filters students by search query matching name case-insensitively', () => {
    const filter = (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return students;
      return students.filter((s) => s.name.toLowerCase().includes(q));
    };

    expect(filter('')).toHaveLength(3);
    expect(filter('liam')).toHaveLength(1);
    expect(filter('liam')[0].id).toBe('s1');
    expect(filter('EMMA')).toHaveLength(1);
    expect(filter('EMMA')[0].id).toBe('s2');
    expect(filter('nonexistent')).toHaveLength(0);
  });

  it('selects student by id or falls back to first student', () => {
    const getSelected = (id: string) => students.find((s) => s.id === id) || students[0] || null;

    expect(getSelected('s2')?.name).toBe('Emma Watson');
    expect(getSelected('s999')?.name).toBe('Liam Davis');
  });
});
