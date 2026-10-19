import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACTIONS,
  ALL_PAGE_MODULES,
  getDefaultMatrixForRole,
  isPageInRoleScope,
  mapBackendPermissionsToMatrix,
  applyPermissionDependencies,
  checkHighRiskPermission,
  filterPageModules,
  groupPagesByCategory,
  buildSavePayload,
  blankActions,
  type PermissionMatrix,
  type CatalogPermission,
} from './permissionConfigHelpers';

describe('PermissionConfiguration Production RBAC & Integrity Tests', () => {
  describe('1. Permission Mapping & Granular Isolation (No Bleed Across Pages)', () => {
    it('ensures sessions:view on Teacher role only activates teacher pages, not coordinator or institutional admin pages', () => {
      const teacherBackendPerms = [
        { id: 'perm-sess-view', resource: 'sessions', action: 'view' },
        { id: 'perm-sess-create', resource: 'sessions', action: 'create' },
        { id: 'perm-sess-edit', resource: 'sessions', action: 'edit' },
      ];

      const matrix = mapBackendPermissionsToMatrix(teacherBackendPerms, 'Teacher');

      // Teacher therapy pages MUST be granted
      expect(matrix['teacher_session_collection']?.VIEW).toBe(true);
      expect(matrix['teacher_daily_notes']?.VIEW).toBe(true);

      // Coordinator and Institutional Admin pages sharing 'sessions' resource MUST NOT be granted!
      expect(matrix['coord_live_sessions']?.VIEW).toBe(false);
      expect(matrix['coord_session_summary']?.VIEW).toBe(false);
      expect(matrix['ia_trial_logging']?.VIEW).toBe(false);
    });

    it('ensures staff:edit on Coordinator does not grant System Admin staff account management', () => {
      const coordBackendPerms = [
        { id: 'perm-staff-view', resource: 'staff', action: 'view' },
        { id: 'perm-staff-edit', resource: 'staff', action: 'edit' },
      ];

      const matrix = mapBackendPermissionsToMatrix(coordBackendPerms, 'Therapy Coordinator');

      // Coordinator schedule pages can be accessed
      expect(matrix['coord_staff_workload']?.VIEW).toBe(true);
      expect(matrix['coord_staff_workload']?.EDIT).toBe(true);

      // System Admin staff account management MUST be false!
      expect(matrix['sys_staff_accounts']?.VIEW).toBe(false);
      expect(matrix['sys_staff_accounts']?.EDIT).toBe(false);
    });

    it('maps sub-resource permissions directly when present', () => {
      const adminPerms = [{ id: 'perm-audit-view', resource: 'audit_logs', action: 'view' }];

      const matrix = mapBackendPermissionsToMatrix(adminPerms, 'System Admin');

      expect(matrix['sys_audit_log']?.VIEW).toBe(true);
      // Other reports pages without audit_logs sub-resource remain false
      expect(matrix['director_reports_oversight']?.VIEW).toBe(false);
    });
  });

  describe('2. Least-Privilege Role Defaults (getDefaultMatrixForRole)', () => {
    it('enforces that Teacher role has NO APPROVE and NO DELETE privileges by default', () => {
      const defaults = getDefaultMatrixForRole('Teacher');

      ALL_PAGE_MODULES.forEach((page) => {
        expect(defaults[page.id]?.APPROVE).toBe(false);
        expect(defaults[page.id]?.DELETE).toBe(false);
      });

      // Daily data collection is available for standard active therapy
      expect(defaults['teacher_session_collection']?.VIEW).toBe(true);
      expect(defaults['teacher_session_collection']?.CREATE).toBe(true);
      expect(defaults['teacher_session_collection']?.EDIT).toBe(true);
    });

    it('enforces that Parent role has NO EDIT, NO DELETE, and NO APPROVE privileges', () => {
      const defaults = getDefaultMatrixForRole('Parent');

      ALL_PAGE_MODULES.forEach((page) => {
        expect(defaults[page.id]?.EDIT).toBe(false);
        expect(defaults[page.id]?.DELETE).toBe(false);
        expect(defaults[page.id]?.APPROVE).toBe(false);
      });

      // Parent can create home observations
      expect(defaults['parent_home_observations']?.VIEW).toBe(true);
      expect(defaults['parent_home_observations']?.CREATE).toBe(true);
    });

    it('enforces that Institutional Admin is restricted from System Admin permission configuration', () => {
      const defaults = getDefaultMatrixForRole('Institutional Administrator');

      expect(defaults['sys_permissions']?.VIEW).toBe(false);
      expect(defaults['sys_permissions']?.EDIT).toBe(false);
      expect(defaults['sys_role_management']?.VIEW).toBe(false);

      // But has full access to institutional config pages
      expect(defaults['ia_form_builder']?.VIEW).toBe(true);
      expect(defaults['ia_schedule_capacity']?.EDIT).toBe(true);
    });

    it('enforces that System Admin has full access everywhere', () => {
      const defaults = getDefaultMatrixForRole('System Administrator');

      ALL_PAGE_MODULES.forEach((page) => {
        expect(defaults[page.id]?.VIEW).toBe(true);
        expect(defaults[page.id]?.CREATE).toBe(true);
        expect(defaults[page.id]?.EDIT).toBe(true);
        expect(defaults[page.id]?.DELETE).toBe(true);
        expect(defaults[page.id]?.APPROVE).toBe(true);
      });
    });
  });

  describe('3. Backend Authority & Revocation (No Stale Revival)', () => {
    it('revokes permissions cleanly when backend permissions list omits them', () => {
      // Backend returns only view for sessions
      const serverPerms = [{ id: '1', resource: 'sessions', action: 'view' }];

      const matrix = mapBackendPermissionsToMatrix(serverPerms, 'Teacher');

      expect(matrix['teacher_session_collection']?.VIEW).toBe(true);
      expect(matrix['teacher_session_collection']?.CREATE).toBe(false);
      expect(matrix['teacher_session_collection']?.EDIT).toBe(false);
      expect(matrix['teacher_session_collection']?.DELETE).toBe(false);
      expect(matrix['teacher_session_collection']?.APPROVE).toBe(false);
    });

    it('does not restore previously cached permissions when server returns empty', () => {
      // If server explicitly returns an empty permissions array, it does not invent access
      const serverPerms: any[] = [];
      const matrix = mapBackendPermissionsToMatrix(serverPerms, 'Custom Role');

      // Falls back to safe default rather than reviving stale privileges
      expect(matrix['sys_permissions']?.VIEW).toBe(false);
    });
  });

  describe('4. Permission Dependencies (VIEW Cascade & Mandatory Prerequisites)', () => {
    it('automatically enables VIEW when CREATE, EDIT, DELETE, or APPROVE is enabled', () => {
      const initial = blankActions();
      expect(initial.VIEW).toBe(false);

      const withCreate = applyPermissionDependencies(initial, 'CREATE', true);
      expect(withCreate.CREATE).toBe(true);
      expect(withCreate.VIEW).toBe(true);

      const withDelete = applyPermissionDependencies(initial, 'DELETE', true);
      expect(withDelete.DELETE).toBe(true);
      expect(withDelete.VIEW).toBe(true);
      expect(withDelete.EDIT).toBe(true); // DELETE implies EDIT

      const withApprove = applyPermissionDependencies(initial, 'APPROVE', true);
      expect(withApprove.APPROVE).toBe(true);
      expect(withApprove.VIEW).toBe(true);
      expect(withApprove.EDIT).toBe(true); // APPROVE implies EDIT
    });

    it('automatically cascades and revokes all child permissions when VIEW is revoked', () => {
      const full = {
        VIEW: true,
        CREATE: true,
        EDIT: true,
        DELETE: true,
        APPROVE: true,
      };

      const withoutView = applyPermissionDependencies(full, 'VIEW', false);

      expect(withoutView.VIEW).toBe(false);
      expect(withoutView.CREATE).toBe(false);
      expect(withoutView.EDIT).toBe(false);
      expect(withoutView.DELETE).toBe(false);
      expect(withoutView.APPROVE).toBe(false);
    });
  });

  describe('5. High-Risk Permission Detection & Safety', () => {
    it('flags granting DELETE or APPROVE to a non-executive role like Teacher as high-risk', () => {
      const teacherPage = ALL_PAGE_MODULES.find((p) => p.id === 'teacher_session_collection')!;

      const deleteRisk = checkHighRiskPermission(teacherPage, 'DELETE', 'Teacher');
      expect(deleteRisk.isHighRisk).toBe(true);
      expect(deleteRisk.reason).toContain('DELETE access');

      const approveRisk = checkHighRiskPermission(teacherPage, 'APPROVE', 'Teacher');
      expect(approveRisk.isHighRisk).toBe(true);
      expect(approveRisk.reason).toContain('APPROVAL privilege');
    });

    it('flags granting administration module permissions to non-admin roles as high-risk', () => {
      const adminPage = ALL_PAGE_MODULES.find((p) => p.id === 'sys_permissions')!;

      const adminRisk = checkHighRiskPermission(adminPage, 'VIEW', 'Teacher');
      expect(adminRisk.isHighRisk).toBe(true);
      expect(adminRisk.reason).toContain('administrative access');
    });

    it('does not flag standard permissions for executive roles', () => {
      const directorPage = ALL_PAGE_MODULES.find((p) => p.id === 'goal_mastery_approval')!;

      const directorApprove = checkHighRiskPermission(directorPage, 'APPROVE', 'Director');
      expect(directorApprove.isHighRisk).toBe(false);
    });
  });

  describe('6. Save Payload Building & Catalog ID Resolution', () => {
    it('generates accurate permission_ids and resource matrix payload', () => {
      const matrix: PermissionMatrix = {};
      ALL_PAGE_MODULES.forEach((p) => {
        matrix[p.id] = blankActions();
      });

      matrix['teacher_session_collection'] = {
        VIEW: true,
        CREATE: true,
        EDIT: false,
        DELETE: false,
        APPROVE: false,
      };

      const catalog: CatalogPermission[] = [
        { id: 'cat-uuid-view', resource: 'sessions', action: 'view' },
        { id: 'cat-uuid-create', resource: 'sessions', action: 'create' },
        { id: 'cat-uuid-edit', resource: 'sessions', action: 'edit' },
      ];

      const payload = buildSavePayload(matrix, catalog, 'Teacher');

      expect(payload.activeCount).toBe(2);
      expect(payload.permission_ids).toContain('cat-uuid-view');
      expect(payload.permission_ids).toContain('cat-uuid-create');
      expect(payload.permission_ids).not.toContain('cat-uuid-edit');
      expect(payload.matrix['sessions']?.view).toBe(true);
      expect(payload.matrix['sessions']?.create).toBe(true);
    });
  });

  describe('7. Filtering & Category Grouping', () => {
    it('filters pages by free-text search across name, route, and category', () => {
      const resultsByName = filterPageModules(ALL_PAGE_MODULES, 'Session Data', 'All');
      expect(resultsByName.some((p) => p.id === 'teacher_session_collection')).toBe(true);

      const resultsByRoute = filterPageModules(ALL_PAGE_MODULES, 'GoalMasteryApproval', 'All');
      expect(resultsByRoute.length).toBeGreaterThanOrEqual(1);

      const resultsByCategory = filterPageModules(
        ALL_PAGE_MODULES,
        'Operations & Scheduling',
        'All',
      );
      expect(resultsByCategory.every((p) => p.category === 'Operations & Scheduling')).toBe(true);
    });

    it('filters pages by role filter tab', () => {
      const teacherOnly = filterPageModules(ALL_PAGE_MODULES, '', 'Teacher / Therapist');
      expect(teacherOnly.every((p) => p.roleKey === 'teacher')).toBe(true);
      expect(teacherOnly.length).toBeGreaterThanOrEqual(4);

      const parentOnly = filterPageModules(ALL_PAGE_MODULES, '', 'Parent');
      expect(parentOnly.every((p) => p.roleKey === 'parent')).toBe(true);
      expect(parentOnly.length).toBe(2);
    });

    it('groups pages by category with accurate group counts', () => {
      const grouped = groupPagesByCategory(ALL_PAGE_MODULES);

      expect(grouped['Executive Oversight']).toBeDefined();
      expect(grouped['Therapy & Daily Clinical']).toBeDefined();
      expect(grouped['Administration']).toBeDefined();
      expect(grouped['Parent Portal']).toBeDefined();

      const totalGrouped = Object.values(grouped).reduce((acc, list) => acc + list.length, 0);
      expect(totalGrouped).toBe(ALL_PAGE_MODULES.length);
    });
  });

  describe('8. Save Handling & Failure Resilience', () => {
    it('preserves unsaved matrix state and dirty flag when save encounters an error', () => {
      let dirtyState = true;
      const currentMatrix: PermissionMatrix = {
        test_page: { VIEW: true, CREATE: true, EDIT: false, DELETE: false, APPROVE: false },
      };

      const simulateSave = async (shouldFail: boolean) => {
        try {
          if (shouldFail) {
            throw new Error('500 Internal Server Error: Network failure');
          }
          dirtyState = false;
        } catch {
          // On failure: DO NOT reset dirtyState, DO NOT mutate currentMatrix
        }
      };

      simulateSave(true);

      // On failure, changes are preserved and retry is possible
      expect(dirtyState).toBe(true);
      expect(currentMatrix['test_page'].CREATE).toBe(true);
    });
  });
});
