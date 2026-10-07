import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SYSTEM_ROLES,
  blankActions,
  toDisplayMatrix,
  FALLBACK_MODULES,
  ACTIONS,
} from './permissionTypes';

describe('permissionTypes - DEFAULT_SYSTEM_ROLES', () => {
  it('defines exactly the 7 core system roles', () => {
    expect(DEFAULT_SYSTEM_ROLES).toHaveLength(7);
    const roleIds = DEFAULT_SYSTEM_ROLES.map((r) => r.id);
    expect(roleIds).toEqual([
      'system_admin',
      'institutional_admin',
      'director',
      'program_director',
      'coordinator',
      'teacher',
      'parent',
    ]);
  });

  it('does NOT include therapist as a static predefined role', () => {
    const roleIds = DEFAULT_SYSTEM_ROLES.map((r) => r.id);
    expect(roleIds).not.toContain('therapist');
  });

  it('marks system_admin and institutional_admin as system critical', () => {
    const sysAdmin = DEFAULT_SYSTEM_ROLES.find((r) => r.id === 'system_admin');
    const instAdmin = DEFAULT_SYSTEM_ROLES.find((r) => r.id === 'institutional_admin');
    expect(sysAdmin?.is_system_critical).toBe(true);
    expect(instAdmin?.is_system_critical).toBe(true);
  });
});

describe('permissionTypes - blankActions and toDisplayMatrix', () => {
  it('returns false for all 5 actions in blankActions', () => {
    const actions = blankActions();
    expect(ACTIONS).toEqual(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE']);
    ACTIONS.forEach((act) => {
      expect(actions[act]).toBe(false);
    });
  });

  it('maps backend permission records to matrix actions', () => {
    const backendPerms = [
      { resource: 'students', action: 'view' },
      { resource: 'students', action: 'create' },
      { resource: 'iups', action: 'manage' }, // 'manage' maps to 'EDIT'
      { resource: 'assessments', action: 'approve' },
    ];

    const matrix = toDisplayMatrix(backendPerms, FALLBACK_MODULES);
    expect(matrix['Students / Enrollment'].VIEW).toBe(true);
    expect(matrix['Students / Enrollment'].CREATE).toBe(true);
    expect(matrix['Students / Enrollment'].DELETE).toBe(false);
    expect(matrix['IUP & Goal Management'].EDIT).toBe(true);
    expect(matrix['Clinical Assessments'].APPROVE).toBe(true);
  });

  it('returns blank matrix when permissions is null or empty', () => {
    const matrix = toDisplayMatrix(null, FALLBACK_MODULES);
    expect(matrix['Students / Enrollment'].VIEW).toBe(false);
    expect(matrix['Students / Enrollment'].EDIT).toBe(false);
  });
});
