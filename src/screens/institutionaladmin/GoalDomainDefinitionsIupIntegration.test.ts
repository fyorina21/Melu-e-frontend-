// src/screens/institutionaladmin/GoalDomainDefinitionsIupIntegration.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredGoalBank,
  setStoredGoalBank,
  saveGoalItem,
  deleteGoalItem,
  getStoredGoalDomains,
  setStoredGoalDomains,
  saveTaskAnalysisTemplateItem,
  DEFAULT_GOAL_DOMAINS,
  DEFAULT_GOAL_ITEMS,
} from '../../stores/goalBankStore';
import { getGoalBank } from '../../api/programDirectorApi';
import { getGoalDomains, saveGoalDomains } from '../../api/institutionalAdminApi';

describe('Goal Domain Definitions to IUP Generation Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredGoalDomains(DEFAULT_GOAL_DOMAINS);
    setStoredGoalBank(DEFAULT_GOAL_ITEMS);
  });

  it('loads default goal domains and goals initially', async () => {
    const domains = getStoredGoalDomains();
    expect(domains.length).toBeGreaterThan(0);
    expect(domains.some((d) => d.name === 'Communication')).toBe(true);

    const goalsRes = await getGoalBank({});
    const goals = goalsRes.data || [];
    expect(goals.length).toBeGreaterThan(0);
    expect(goals.some((g: any) => g.name.includes('Receptive Identification'))).toBe(true);
  });

  it('allows institutional admin to edit an existing goal and reflects changes in Goal Bank and IUP', async () => {
    // 1. Admin edits goal g-1 on GoalDomainDefinitions
    const edited = saveGoalItem({
      id: 'g-1',
      name: 'Receptive Identification of 3D Objects & Miniatures',
      domain: 'Communication',
      description: 'Selects the target miniature object from a randomized field of 4 items.',
      masteryCriteria: '90% accuracy across 4 consecutive sessions',
      goalType: 'standard',
      active: true,
    });

    expect(edited.name).toBe('Receptive Identification of 3D Objects & Miniatures');
    expect(edited.masteryCriteria).toBe('90% accuracy across 4 consecutive sessions');

    // 2. IUP Generation reads the updated goal from getGoalBank
    const bankRes = await getGoalBank({});
    const updatedGoal = (bankRes.data || []).find((g: any) => g.id === 'g-1');
    expect(updatedGoal).toBeDefined();
    expect(updatedGoal?.name).toBe('Receptive Identification of 3D Objects & Miniatures');
    expect(updatedGoal?.masteryCriteria).toBe('90% accuracy across 4 consecutive sessions');
    expect(updatedGoal?.description).toBe(
      'Selects the target miniature object from a randomized field of 4 items.',
    );
  });

  it('allows institutional admin to add a new goal and makes it selectable in IUP Generation', async () => {
    // 1. Admin adds new goal on GoalDomainDefinitions
    const newGoal = saveGoalItem({
      name: 'Visual Schedule Transition Compliance',
      domain: 'Adaptive',
      description: 'Follows 3-step visual schedule picture prompts without verbal repeating.',
      masteryCriteria: '85% unprompted compliance across 5 days',
      goalType: 'standard',
      active: true,
    });

    expect(newGoal.id).toBeDefined();

    // 2. IUP Generation sees this new goal in the goal selector bank
    const bankRes = await getGoalBank({});
    const found = (bankRes.data || []).find((g: any) => g.id === newGoal.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Visual Schedule Transition Compliance');
    expect(found?.domain).toBe('Adaptive');
  });

  it('allows institutional admin to add/edit goal domains which updates available domain filters', async () => {
    // Admin adds new domain
    const domains = getStoredGoalDomains();
    const updatedDomains = [
      ...domains,
      {
        id: 'd-vocational',
        name: 'Vocational & Pre-Work',
        description: 'Sorting materials, assembly tasks, and workplace hygiene routines.',
        active: true,
      },
    ];

    await saveGoalDomains(updatedDomains as any);

    const domainsRes = await getGoalDomains();
    const loadedDomains = domainsRes.data || [];
    expect(loadedDomains.some((d: any) => d.name === 'Vocational & Pre-Work')).toBe(true);
  }, 30000);

  it('allows institutional admin to delete a goal from the bank', async () => {
    deleteGoalItem('g-1');

    const bankRes = await getGoalBank({});
    const found = (bankRes.data || []).find((g: any) => g.id === 'g-1');
    expect(found).toBeUndefined();
  });

  it('syncs Task Analysis templates as task_analysis goals available in IUP Generation', async () => {
    saveTaskAnalysisTemplateItem({
      id: 'ta-custom-shoe-tying',
      name: 'Shoe Tying Routine',
      description: 'Sequential 7-step cross-and-loop shoe tying routine.',
      steps: [
        { id: 's1', description: 'Cross laces' },
        { id: 's2', description: 'Pull tight' },
      ],
      perStepMastery: 80,
      overallMastery: 90,
      active: true,
    });

    const bankRes = await getGoalBank({});
    const found = (bankRes.data || []).find((g: any) => g.id === 'g-ta-ta-custom-shoe-tying');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Shoe Tying Routine');
    expect(found?.goalType).toBe('task_analysis');
    expect(found?.masteryCriteria).toContain('90% independent accuracy');
  });

  it('allows GoalBankManagement Add Goal to persist immediately and display in IUP Generation slot assignment', async () => {
    // 1. Program Director clicks Add Goal on GoalBankManagement
    const goalPayload = {
      name: 'Independent Handwashing & Drying',
      domain: 'Self-Help',
      description: 'Follows 4-step routine independently upon entering classroom.',
      masteryCriteria: '100% independent across 5 consecutive days',
      status: 'active' as const,
      active: true,
      goalType: 'standard' as const,
    };

    const saved = saveGoalItem(goalPayload);
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe('Independent Handwashing & Drying');

    // 2. Goal bank retrieval (used by IUP Generation) contains the newly added goal at top
    const bankRes = await getGoalBank({});
    const goalsList = bankRes.data || [];
    const createdGoal = goalsList.find(
      (g: any) => g.id === saved.id || g.name === 'Independent Handwashing & Drying',
    );
    expect(createdGoal).toBeDefined();
    expect(createdGoal?.domain).toBe('Self-Help');
    expect(createdGoal?.masteryCriteria).toBe('100% independent across 5 consecutive days');

    // 3. User clicks Assign Goal from Goal Bank on IUP Generation
    const localGoalBank = getStoredGoalBank();
    expect(localGoalBank.some((g) => g.name === 'Independent Handwashing & Drying')).toBe(true);
  });
});
