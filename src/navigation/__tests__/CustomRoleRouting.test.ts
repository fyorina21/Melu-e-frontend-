import { describe, it, expect } from 'vitest';
import { resolveInitialRouteForCustomRole } from '../../components/appNavConfig';
import {
  isPageInRoleScope,
  ALL_PAGE_MODULES,
  mapBackendPermissionsToMatrix,
} from '../../screens/systemadmin/permissionConfigHelpers';
import type { AuthSession } from '../../types';

describe('CustomRoleRouting & Permission Configuration', () => {
  describe('resolveInitialRouteForCustomRole', () => {
    it('routes custom role with admin module to StaffAccountManagement instead of TeacherDashboard', () => {
      const session: AuthSession = {
        userName: 'Admin Assistant',
        role: 'admin_assistant',
        modules: ['admin'],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('StaffAccountManagement');
      expect(initialRoute).not.toBe('TeacherDashboard');
    });

    it('routes custom role with assessments module to AssessmentDashboard instead of TeacherDashboard', () => {
      const session: AuthSession = {
        userName: 'Assessment Specialist',
        role: 'evaluator',
        modules: ['assessments'],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('AssessmentDashboard');
      expect(initialRoute).not.toBe('TeacherDashboard');
    });

    it('routes custom role with reports module to ReportsOversight instead of TeacherDashboard', () => {
      const session: AuthSession = {
        userName: 'Compliance Officer',
        role: 'auditor',
        modules: ['reports'],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('ReportsOversight');
      expect(initialRoute).not.toBe('TeacherDashboard');
    });

    it('routes custom role with sessions module to SessionDataCollection if granted', () => {
      const session: AuthSession = {
        userName: 'Therapy Aide',
        role: 'therapy_aide',
        modules: ['sessions'],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('SessionDataCollection');
    });

    it('routes custom role with NO permissions to CustomRolePending (never TeacherDashboard)', () => {
      const session: AuthSession = {
        userName: 'Brand New Staff',
        role: 'new_custom_role',
        modules: [],
        permissions: [],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('CustomRolePending');
      expect(initialRoute).not.toBe('TeacherDashboard');
    });

    it('honors permitted homeRoute if specified on session', () => {
      const session: AuthSession = {
        userName: 'Director Assistant',
        role: 'director_assistant',
        homeRoute: 'AuditLog',
        modules: ['admin'],
      };

      const initialRoute = resolveInitialRouteForCustomRole(session);
      expect(initialRoute).toBe('AuditLog');
    });
  });

  describe('isPageInRoleScope for custom roles', () => {
    it('allows custom roles to configure pages across all clinical and admin scopes', () => {
      const customRoleName = 'Quality Assurance Lead';

      // Coordinator pages
      const coordPage = ALL_PAGE_MODULES.find((p) => p.id === 'coord_live_sessions')!;
      expect(isPageInRoleScope(coordPage, customRoleName)).toBe(true);

      // Director pages
      const directorPage = ALL_PAGE_MODULES.find((p) => p.id === 'director_goal_mastery')!;
      expect(isPageInRoleScope(directorPage, customRoleName)).toBe(true);

      // Admin pages
      const adminPage = ALL_PAGE_MODULES.find((p) => p.id === 'sys_audit_log')!;
      expect(isPageInRoleScope(adminPage, customRoleName)).toBe(true);

      // Institutional admin pages
      const iaPage = ALL_PAGE_MODULES.find((p) => p.id === 'ia_form_builder')!;
      expect(isPageInRoleScope(iaPage, customRoleName)).toBe(true);

      // Teacher pages
      const teacherPage = ALL_PAGE_MODULES.find((p) => p.id === 'teacher_session_collection')!;
      expect(isPageInRoleScope(teacherPage, customRoleName)).toBe(true);
    });

    it('maps granted permissions for custom roles across multiple modules without falling back to teacher-only', () => {
      const customRolePerms = [
        { resource: 'assessments', action: 'view' },
        { resource: 'reports', action: 'view' },
        { resource: 'admin', action: 'view' },
      ];

      const matrix = mapBackendPermissionsToMatrix(customRolePerms, 'Quality Inspector');

      // Assessments module
      expect(matrix['teacher_assessments']?.VIEW).toBe(true);
      expect(matrix['pd_assessment_summary']?.VIEW).toBe(true);

      // Reports module
      expect(matrix['director_reports_oversight']?.VIEW).toBe(true);
      expect(matrix['director_dashboard']?.VIEW).toBe(true);

      // Admin module
      expect(matrix['sys_role_management']?.VIEW).toBe(true);
      expect(matrix['sys_permissions']?.VIEW).toBe(true);
    });
  });
});
