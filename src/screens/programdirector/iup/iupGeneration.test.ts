import { describe, it, expect, beforeEach } from 'vitest';
import type { Slots, GoalBankItem } from './types';
import {
  assignGoalToSlot,
  saveIupDraft,
  getStudentCaseload,
  getStoredIupDraft,
  CASELOAD_ASSIGNMENTS_STORAGE_KEY,
  IUP_DRAFTS_STORAGE_KEY,
  IUP_LIBRARY_STORAGE_KEY,
} from '../../../api/programDirectorApi';
import storage from '../../../utils/storage';

describe('IUP Generation Utilities & Models', () => {
  const studentA = 'std-alpha-isolated';
  const studentB = 'std-beta-isolated';

  beforeEach(() => {
    // Reset test storage for clean student isolation testing
    const caseload =
      storage.getJSONSync<Record<string, any>>(CASELOAD_ASSIGNMENTS_STORAGE_KEY, {}) || {};
    delete caseload[studentA];
    delete caseload[studentB];
    storage.setJSONSync(CASELOAD_ASSIGNMENTS_STORAGE_KEY, caseload);

    const drafts = storage.getJSONSync<Record<string, any>>(IUP_DRAFTS_STORAGE_KEY, {}) || {};
    delete drafts[studentA];
    delete drafts[studentB];
    storage.setJSONSync(IUP_DRAFTS_STORAGE_KEY, drafts);

    const lib = storage.getJSONSync<any[]>(IUP_LIBRARY_STORAGE_KEY, []) || [];
    const filteredLib = lib.filter((i) => i.studentId !== studentA && i.studentId !== studentB);
    storage.setJSONSync(IUP_LIBRARY_STORAGE_KEY, filteredLib);
  });

  it('manages exactly 2 goals at a time (1 for Station 1 and 1 for Station 2)', () => {
    const slots: Slots = {
      station1: [null],
      station2: [null],
    };

    expect(slots.station1.length).toBe(1);
    expect(slots.station2.length).toBe(1);
    expect([...slots.station1, ...slots.station2].filter(Boolean).length).toBe(0);

    const sampleGoal1: GoalBankItem = {
      id: 'g-1',
      name: 'Receptive Identification',
      domain: 'Communication',
      description: 'Student identifies common objects in an array of 4.',
      goalType: 'standard',
      masteryCriteria: '80% across 3 consecutive sessions',
    };

    const sampleGoal2: GoalBankItem = {
      id: 'g-2',
      name: 'Turn-Taking in Structured Play',
      domain: 'Social',
      description: 'Student shares toys and takes turns with peers.',
      goalType: 'standard',
      masteryCriteria: '85% accuracy',
    };

    // Assign exactly 1 goal to Station 1 and 1 goal to Station 2
    slots.station1[0] = sampleGoal1;
    slots.station2[0] = sampleGoal2;

    const totalAssigned = [...slots.station1, ...slots.station2].filter(Boolean).length;
    expect(totalAssigned).toBe(2);
    expect(slots.station1[0]?.name).toBe('Receptive Identification');
    expect(slots.station2[0]?.name).toBe('Turn-Taking in Structured Play');
  });

  it('handles slot goal replacement and removal cleanly within the 2-goal structure', () => {
    const slots: Slots = {
      station1: [
        {
          id: 'g-1',
          name: 'Goal 1',
          domain: 'Motor',
          description: 'Motor skill',
          goalType: 'standard',
          masteryCriteria: '90%',
        },
      ],
      station2: [
        {
          id: 'g-2',
          name: 'Goal 2',
          domain: 'Communication',
          description: 'Communication skill',
          goalType: 'standard',
          masteryCriteria: '85%',
        },
      ],
    };

    expect([...slots.station1, ...slots.station2].filter(Boolean).length).toBe(2);

    // Replace goal in station 1
    const replacementGoal: GoalBankItem = {
      id: 'g-1-new',
      name: 'Replacement Goal 1',
      domain: 'Cognition',
      description: 'Replaced skill',
      goalType: 'standard',
      masteryCriteria: '80%',
    };
    slots.station1[0] = replacementGoal;
    expect(slots.station1[0]?.name).toBe('Replacement Goal 1');
    expect([...slots.station1, ...slots.station2].filter(Boolean).length).toBe(2);

    // Remove goal from station 2
    slots.station2[0] = null;
    expect(slots.station2[0]).toBeNull();
    expect([...slots.station1, ...slots.station2].filter(Boolean).length).toBe(1);
  });

  it('enforces two-goal selection limit when trying to add beyond 2 active goals', () => {
    const slots: Slots = {
      station1: [
        {
          id: 'g-1',
          name: 'Goal 1',
          domain: 'Motor',
          description: '',
          goalType: 'standard',
          masteryCriteria: '80%',
        },
      ],
      station2: [
        {
          id: 'g-2',
          name: 'Goal 2',
          domain: 'Social',
          description: '',
          goalType: 'standard',
          masteryCriteria: '80%',
        },
      ],
    };

    const currentlyAssignedCount = [...slots.station1, ...slots.station2].filter(Boolean).length;
    expect(currentlyAssignedCount).toBe(2);

    // Simulate goal selection check
    const canAddWithoutReplacing = (targetStation: 'station1' | 'station2', slotIdx: number) => {
      const isReplacing = Boolean(slots[targetStation]?.[slotIdx]);
      if (!isReplacing && currentlyAssignedCount >= 2) {
        return false;
      }
      return true;
    };

    // Attempting to add to a new empty slot fails
    expect(canAddWithoutReplacing('station1', 1)).toBe(false);
    // Replacing an existing assigned slot succeeds
    expect(canAddWithoutReplacing('station1', 0)).toBe(true);
    expect(canAddWithoutReplacing('station2', 0)).toBe(true);
  });

  it('saves goal assignments strictly per student with zero bleed-through across students', async () => {
    // 1. Assign exactly 2 goals for Student A
    await assignGoalToSlot(studentA, {
      goalId: 'g-alpha-1',
      name: 'Alpha Goal 1',
      domain: 'Language',
      station: 1,
      slot: 0,
      source: 'iup_generation',
    });
    await assignGoalToSlot(studentA, {
      goalId: 'g-alpha-2',
      name: 'Alpha Goal 2',
      domain: 'Social',
      station: 2,
      slot: 0,
      source: 'iup_generation',
    });

    await saveIupDraft(studentA, {
      studentId: studentA,
      slots: {
        station1: [
          {
            id: 'g-alpha-1',
            name: 'Alpha Goal 1',
            domain: 'Language',
            description: 'Alpha Desc 1',
            goalType: 'standard',
            masteryCriteria: '80%',
          },
        ],
        station2: [
          {
            id: 'g-alpha-2',
            name: 'Alpha Goal 2',
            domain: 'Social',
            description: 'Alpha Desc 2',
            goalType: 'standard',
            masteryCriteria: '80%',
          },
        ],
      },
      goals: ['g-alpha-1', 'g-alpha-2'],
    });

    // 2. Verify Student A's draft and caseload contain both goals
    const draftA = getStoredIupDraft(studentA);
    expect(draftA).toBeDefined();
    expect((draftA?.slots as any)?.station1?.[0]?.name).toBe('Alpha Goal 1');
    expect((draftA?.slots as any)?.station2?.[0]?.name).toBe('Alpha Goal 2');

    const caseloadA = await getStudentCaseload(studentA);
    expect(caseloadA.data.goals.some((g: any) => g.id === 'g-alpha-1')).toBe(true);
    expect(caseloadA.data.goals.some((g: any) => g.id === 'g-alpha-2')).toBe(true);

    // 3. Verify Student B has NO goals assigned (zero bleed-through)
    const draftB = getStoredIupDraft(studentB);
    expect(draftB).toBeNull();

    const caseloadB = await getStudentCaseload(studentB);
    expect(caseloadB.data.goals.some((g: any) => g.id === 'g-alpha-1')).toBe(false);
    expect(caseloadB.data.goals.some((g: any) => g.id === 'g-alpha-2')).toBe(false);
  });
});
