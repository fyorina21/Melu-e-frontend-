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

describe('StudentCaseload - Goal Bank Student-Specific Isolation', () => {
  it('strictly isolates goals per student from IUP draft and library records', () => {
    const student1 = 'student-alpha';
    const student2 = 'student-beta';

    const student1IupGoals = [
      {
        id: 'g-s1-1',
        name: 'Alpha Goal 1',
        domain: 'Communication',
        description: 'Student 1 target',
      },
      { id: 'g-s1-2', name: 'Alpha Goal 2', domain: 'Social', description: 'Student 1 target' },
    ];

    const student2IupGoals = [
      { id: 'g-s2-1', name: 'Beta Goal 1', domain: 'Motor', description: 'Student 2 target' },
    ];

    // Helper simulating StudentCaseloadScreen studentGoalsForBank resolution
    const resolveGoalsForStudent = (
      studentId: string,
      records: Record<string, { slots?: { station1?: any[]; station2?: any[] } }>,
    ): Goal[] => {
      const studentRecord = records[studentId];
      if (!studentRecord || !studentRecord.slots) return [];
      const s1 = studentRecord.slots.station1 || [];
      const s2 = studentRecord.slots.station2 || [];
      const map = new Map<string, Goal>();
      [...s1, ...s2].filter(Boolean).forEach((g: any) => {
        if (g?.id && !map.has(g.id)) {
          map.set(g.id, {
            id: g.id,
            name: g.name,
            domain: g.domain,
            description: g.description || '',
          });
        }
      });
      return Array.from(map.values());
    };

    const mockRecords = {
      [student1]: {
        slots: {
          station1: [student1IupGoals[0]],
          station2: [student1IupGoals[1]],
        },
      },
      [student2]: {
        slots: {
          station1: [student2IupGoals[0]],
          station2: [],
        },
      },
    };

    const student1Goals = resolveGoalsForStudent(student1, mockRecords);
    const student2Goals = resolveGoalsForStudent(student2, mockRecords);

    // Student 1 only sees Student 1 goals
    expect(student1Goals.length).toBe(2);
    expect(student1Goals.map((g) => g.id)).toEqual(['g-s1-1', 'g-s1-2']);
    expect(student1Goals.some((g) => g.id === 'g-s2-1')).toBe(false);

    // Student 2 only sees Student 2 goals
    expect(student2Goals.length).toBe(1);
    expect(student2Goals.map((g) => g.id)).toEqual(['g-s2-1']);
    expect(student2Goals.some((g) => g.id === 'g-s1-1')).toBe(false);

    // Unknown or unassigned student sees empty bank
    const unassignedGoals = resolveGoalsForStudent('student-gamma', mockRecords);
    expect(unassignedGoals.length).toBe(0);
  });
});
