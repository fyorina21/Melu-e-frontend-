import { describe, it, expect } from 'vitest';
import type { Slots, GoalBankItem } from './types';

describe('IUP Generation Utilities & Models', () => {
  it('correctly manages station slot states', () => {
    const slots: Slots = {
      station1: [null, null],
      station2: [null, null],
    };

    expect(slots.station1.filter(Boolean).length).toBe(0);

    const sampleGoal: GoalBankItem = {
      id: 'g-1',
      name: 'Receptive Identification',
      domain: 'Communication',
      description: 'Student identifies common objects in an array of 4.',
      goalType: 'standard',
      masteryCriteria: '80% across 3 consecutive sessions',
    };

    slots.station1[0] = sampleGoal;

    const totalAssigned = [...slots.station1, ...slots.station2].filter(Boolean).length;
    expect(totalAssigned).toBe(1);
    expect(slots.station1[0]?.name).toBe('Receptive Identification');
  });

  it('handles slot goal replacement and removal cleanly', () => {
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
      station2: [],
    };

    // Remove goal
    slots.station1[0] = null;
    expect(slots.station1[0]).toBeNull();
  });
});
