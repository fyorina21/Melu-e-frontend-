import { describe, it, expect } from 'vitest';
import { DOMAINS, DOMAIN_OPTIONS, filterGoals, EMPTY_FORM, type ExtendedGoal } from './types';

describe('goalBank logic and filters', () => {
  const sampleGoals: ExtendedGoal[] = [
    {
      id: 'g1',
      name: 'Identify Primary Colors',
      domain: 'Cognitive',
      description: 'Learner identifies red, blue, and yellow upon verbal request.',
      masteryCriteria: '80% accuracy over 3 sessions',
      usageCount: 12,
      status: 'active',
    },
    {
      id: 'g2',
      name: 'Vocal Manding for Food',
      domain: 'Expressive Language',
      description: 'Learner says snack name when hungry.',
      masteryCriteria: '90% accuracy',
      usageCount: 4,
      status: 'active',
    },
    {
      id: 'g3',
      name: 'Waiting Turn in Group Game',
      domain: 'Social Skills',
      description: 'Waits 2 minutes quietly during circle time.',
      masteryCriteria: '100% on 4 consecutive sessions',
      usageCount: 0,
      status: 'inactive',
    },
  ];

  it('defines the correct domains and options', () => {
    expect(DOMAINS[0]).toBe('All');
    expect(DOMAIN_OPTIONS).not.toContain('All');
    expect(DOMAIN_OPTIONS.length).toBe(DOMAINS.length - 1);
    expect(DOMAIN_OPTIONS).toContain('Cognitive');
    expect(DOMAIN_OPTIONS).toContain('Social Skills');
  });

  it('returns all goals when domain is All and search is empty', () => {
    const result = filterGoals(sampleGoals, '', 'All');
    expect(result.length).toBe(3);
  });

  it('filters goals by domain', () => {
    const result = filterGoals(sampleGoals, '', 'Cognitive');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('g1');
  });

  it('filters goals by search query matching name', () => {
    const result = filterGoals(sampleGoals, 'Colors', 'All');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Identify Primary Colors');
  });

  it('filters goals by search query matching description', () => {
    const result = filterGoals(sampleGoals, 'circle time', 'All');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('g3');
  });

  it('combines domain and search filtering', () => {
    const result = filterGoals(sampleGoals, 'Learner', 'Cognitive');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('g1');

    const noMatch = filterGoals(sampleGoals, 'Colors', 'Social Skills');
    expect(noMatch.length).toBe(0);
  });

  it('safely handles null goals array', () => {
    const result = filterGoals(null, 'test', 'All');
    expect(result).toEqual([]);
  });

  it('initializes EMPTY_FORM with sensible defaults', () => {
    expect(EMPTY_FORM.status).toBe('active');
    expect(EMPTY_FORM.name).toBe('');
    expect(EMPTY_FORM.domain).toBe(DOMAIN_OPTIONS[0]);
    expect(EMPTY_FORM.masteryCriteria).toBeTruthy();
  });
});
