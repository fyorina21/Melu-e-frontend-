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
