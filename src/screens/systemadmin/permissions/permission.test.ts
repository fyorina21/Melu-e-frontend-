// src/screens/systemadmin/permissions/permission.test.ts

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SYSTEM_ROLES,
  blankActions,
  toDisplayMatrix,
  FALLBACK_MODULES,
  ACTIONS,
} from './permissionTypes';
import {
  buildPermissionSummaryList,
  extractSelectedPermissionIds,
  buildFullAccessMatrix,
  buildReadOnlyMatrix,
  toggleCellAction,
  toggleRowActions,
  toggleColumnAction,
} from './permissionHelper';

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

describe('permissionHelper utilities', () => {
  it('buildFullAccessMatrix sets all actions to true', () => {
    const full = buildFullAccessMatrix(FALLBACK_MODULES);
    FALLBACK_MODULES.forEach((mod) => {
      ACTIONS.forEach((act) => {
        expect(full[mod.name][act]).toBe(true);
      });
    });
  });

  it('buildReadOnlyMatrix sets only VIEW to true', () => {
    const ro = buildReadOnlyMatrix(FALLBACK_MODULES);
    FALLBACK_MODULES.forEach((mod) => {
      expect(ro[mod.name].VIEW).toBe(true);
      expect(ro[mod.name].CREATE).toBe(false);
      expect(ro[mod.name].EDIT).toBe(false);
      expect(ro[mod.name].DELETE).toBe(false);
      expect(ro[mod.name].APPROVE).toBe(false);
    });
  });

  it('toggleCellAction toggles a specific action', () => {
    const ro = buildReadOnlyMatrix(FALLBACK_MODULES);
    const updated = toggleCellAction(ro, 'Students / Enrollment', 'CREATE');
    expect(updated['Students / Enrollment'].CREATE).toBe(true);
    const toggledBack = toggleCellAction(updated, 'Students / Enrollment', 'CREATE');
    expect(toggledBack['Students / Enrollment'].CREATE).toBe(false);
  });

  it('toggleRowActions toggles all actions in a row', () => {
    const ro = buildReadOnlyMatrix(FALLBACK_MODULES);
    const allChecked = toggleRowActions(ro, 'Students / Enrollment');
    ACTIONS.forEach((act) => {
      expect(allChecked['Students / Enrollment'][act]).toBe(true);
    });
    const allUnchecked = toggleRowActions(allChecked, 'Students / Enrollment');
    ACTIONS.forEach((act) => {
      expect(allUnchecked['Students / Enrollment'][act]).toBe(false);
    });
  });

  it('toggleColumnAction toggles a specific column across all modules', () => {
    const ro = buildReadOnlyMatrix(FALLBACK_MODULES);
    const toggled = toggleColumnAction(ro, 'APPROVE', FALLBACK_MODULES);
    FALLBACK_MODULES.forEach((mod) => {
      expect(toggled[mod.name].APPROVE).toBe(true);
    });
  });

  it('buildPermissionSummaryList generates natural language sentences', () => {
    const full = buildFullAccessMatrix(FALLBACK_MODULES.slice(0, 1));
    const summary = buildPermissionSummaryList(full, FALLBACK_MODULES.slice(0, 1));
    expect(summary).toHaveLength(1);
    expect(summary[0]).toContain(
      'Can view, create, edit, delete, and approve Students / Enrollment',
    );
  });

  it('extractSelectedPermissionIds pulls out matching permission IDs', () => {
    const testModules = [
      {
        id: 'students',
        name: 'Students / Enrollment',
        description: 'Students',
        resource: 'students',
        permissions: [
          {
            id: 'perm-view',
            action: 'view',
            action_label: 'View',
            resource: 'students',
            name: 'View Students',
          },
          {
            id: 'perm-create',
            action: 'create',
            action_label: 'Create',
            resource: 'students',
            name: 'Create Students',
          },
        ],
      },
    ];
    const full = buildFullAccessMatrix(testModules as any);
    const ids = extractSelectedPermissionIds(full, testModules as any);
    expect(ids).toEqual(['perm-view', 'perm-create']);
  });
});
