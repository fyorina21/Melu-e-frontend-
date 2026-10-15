import { describe, it, expect } from 'vitest';
import {
  parsePermissions,
  hasPermission,
  hasModuleAccess,
  normalizeAction,
  SCREEN_TO_MODULE,
  UNGUARDED_SCREENS,
} from '../permissions';

describe('permissions utility', () => {
  describe('parsePermissions', () => {
    it('returns empty map for undefined or empty input', () => {
      expect(parsePermissions(undefined)).toEqual({});
      expect(parsePermissions([])).toEqual({});
    });

    it('parses valid resource:action pairs into Sets', () => {
      const raw = ['sessions:view', 'sessions:create', 'students:delete'];
      const map = parsePermissions(raw);

      expect(map.sessions).toBeInstanceOf(Set);
      expect(map.sessions.has('view')).toBe(true);
      expect(map.sessions.has('create')).toBe(true);
      expect(map.sessions.has('delete')).toBe(false);

      expect(map.students).toBeInstanceOf(Set);
      expect(map.students.has('delete')).toBe(true);
      expect(map.students.has('view')).toBe(false);
    });

    it('maps aliased resources using RESOURCE_ALIAS_MAP', () => {
      // trials is aliased to sessions
      const raw = ['trials:view', 'trials:edit'];
      const map = parsePermissions(raw);

      expect(map.sessions).toBeDefined();
      expect(map.sessions.has('view')).toBe(true);
      expect(map.sessions.has('edit')).toBe(true);
    });

    it('normalizes action synonyms', () => {
      const raw = [
        'reports:index',
        'reports:show',
        'reports:update',
        'reports:destroy',
        'iups:update_status',
      ];
      const map = parsePermissions(raw);

      expect(map.reports.has('view')).toBe(true);
      expect(map.reports.has('edit')).toBe(true);
      expect(map.reports.has('delete')).toBe(true);
      expect(map.iups.has('approve')).toBe(true);
    });

    it('ignores invalid formats or unrecognized actions', () => {
      const raw = ['invalid', 'foo:unknown_action', ':action', 'resource:'];
      const map = parsePermissions(raw);
      expect(map).toEqual({});
    });
  });

  describe('normalizeAction', () => {
    it('normalizes various action strings correctly', () => {
      expect(normalizeAction('view')).toBe('view');
      expect(normalizeAction('show')).toBe('view');
      expect(normalizeAction('read')).toBe('view');
      expect(normalizeAction('create')).toBe('create');
      expect(normalizeAction('edit')).toBe('edit');
      expect(normalizeAction('update')).toBe('edit');
      expect(normalizeAction('delete')).toBe('delete');
      expect(normalizeAction('destroy')).toBe('delete');
      expect(normalizeAction('approve')).toBe('approve');
      expect(normalizeAction('update_status')).toBe('approve');
      expect(normalizeAction('something_else')).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('returns false when map is undefined or empty', () => {
      expect(hasPermission(undefined, 'sessions', 'view')).toBe(false);
      expect(hasPermission({}, 'sessions', 'view')).toBe(false);
    });

    it('returns true when action exists on resource', () => {
      const map = parsePermissions(['sessions:view']);
      expect(hasPermission(map, 'sessions', 'view')).toBe(true);
      expect(hasPermission(map, 'sessions', 'edit')).toBe(false);
    });

    it('resolves resource aliases', () => {
      const map = parsePermissions(['sessions:view']);
      // 'trials' aliases to 'sessions'
      expect(hasPermission(map, 'trials', 'view')).toBe(true);
    });
  });

  describe('hasModuleAccess', () => {
    it('returns false for undefined or empty modules', () => {
      expect(hasModuleAccess(undefined, 'sessions')).toBe(false);
      expect(hasModuleAccess([], 'sessions')).toBe(false);
    });

    it('returns true when module matches case-insensitively', () => {
      const modules = ['sessions', 'iups', 'STUDENTS'];
      expect(hasModuleAccess(modules, 'sessions')).toBe(true);
      expect(hasModuleAccess(modules, 'students')).toBe(true);
      expect(hasModuleAccess(modules, 'admin')).toBe(false);
    });

    it('resolves backend resource aliases to canonical module IDs', () => {
      // Backend delivers raw database resources like 'roles', 'staff_members', etc.
      expect(hasModuleAccess(['roles'], 'admin')).toBe(true);
      expect(hasModuleAccess(['staff_members'], 'staff')).toBe(true);
      expect(hasModuleAccess(['trials'], 'sessions')).toBe(true);
    });
  });

  describe('Screen definitions', () => {
    it('maps clinical and administrative screens to modules', () => {
      expect(SCREEN_TO_MODULE.StudentEnrollmentWizard).toBe('students');
      expect(SCREEN_TO_MODULE.AssessmentDashboard).toBe('assessments');
      expect(SCREEN_TO_MODULE.IupGeneration).toBe('iups');
      expect(SCREEN_TO_MODULE.SessionDataCollection).toBe('sessions');
      expect(SCREEN_TO_MODULE.AbcLog).toBe('behavior_incidents');
      expect(SCREEN_TO_MODULE.DirectorScheduling).toBe('staff');
      expect(SCREEN_TO_MODULE.ReportsOversight).toBe('reports');
      expect(SCREEN_TO_MODULE.ParentCommunication).toBe('parent_portal');
      expect(SCREEN_TO_MODULE.PermissionConfiguration).toBe('admin');
    });

    it('defines unguarded screens including auth and dashboards', () => {
      expect(UNGUARDED_SCREENS.has('Login')).toBe(true);
      expect(UNGUARDED_SCREENS.has('TeacherDashboard')).toBe(true);
      expect(UNGUARDED_SCREENS.has('Notifications')).toBe(true);
    });
  });
});
