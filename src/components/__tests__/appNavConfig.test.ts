import { describe, it, expect } from 'vitest';
import {
  ROLE_TABS,
  ROLE_GROUPED_TABS,
  getGroupedTabsForSession,
  isNavGroup,
  PD_ROUTE_BY_TAB,
} from '../appNavConfig';
import type { AuthSession } from '../../types';

describe('appNavConfig grouped navigation for Program Director', () => {
  it('provides grouped tabs for program_director role', () => {
    const session: AuthSession = {
      userName: 'Director Sarah',
      email: 'sarah@melue.org',
      role: 'program_director',
      roles: ['program_director'],
    };

    const tabs = getGroupedTabsForSession(session, 'program_director', ROLE_TABS.program_director);
    expect(tabs.length).toBe(6);

    // Standalone tabs
    expect(tabs[0]).toBe('Dashboard');
    expect(tabs[5]).toBe('Parent Communication');

    // Group tabs
    const studentsGroup = tabs[1];
    expect(isNavGroup(studentsGroup)).toBe(true);
    if (isNavGroup(studentsGroup)) {
      expect(studentsGroup.label).toBe('Students');
      expect(studentsGroup.items).toEqual(['Registered Student', 'Enrollment Wizard']);
    }

    const assessmentsGroup = tabs[2];
    expect(isNavGroup(assessmentsGroup)).toBe(true);
    if (isNavGroup(assessmentsGroup)) {
      expect(assessmentsGroup.label).toBe('Assessments');
      expect(assessmentsGroup.items).toEqual(['Assessment Review', 'Assessment Summary Report']);
    }

    const iupsGroup = tabs[3];
    expect(isNavGroup(iupsGroup)).toBe(true);
    if (isNavGroup(iupsGroup)) {
      expect(iupsGroup.label).toBe('IUPs');
      expect(iupsGroup.items).toEqual([
        'IUP Creation & Goal Assignment',
        'IUP Library Management',
        'Student Caseload Management',
        'Clinical Quality Monitoring',
      ]);
    }

    expect(tabs[4]).toBe('Goal Mastery Approval');
  });

  it('maps all group items and original items to valid PD routes', () => {
    const originalTabs = ROLE_TABS.program_director;
    for (const tab of originalTabs) {
      expect(PD_ROUTE_BY_TAB[tab]).toBeDefined();
    }

    const grouped = ROLE_GROUPED_TABS.program_director ?? [];
    for (const tabItem of grouped) {
      if (isNavGroup(tabItem)) {
        for (const child of tabItem.items) {
          expect(PD_ROUTE_BY_TAB[child]).toBeDefined();
        }
        // Group label itself should also have a route alias
        expect(PD_ROUTE_BY_TAB[tabItem.label]).toBeDefined();
      } else {
        expect(PD_ROUTE_BY_TAB[tabItem]).toBeDefined();
      }
    }
  });

  it('falls back to standard ungrouped tabs for non-grouped roles', () => {
    const session: AuthSession = {
      userName: 'Teacher Amy',
      email: 'amy@melue.org',
      role: 'teacher',
      roles: ['teacher'],
    };

    const tabs = getGroupedTabsForSession(session, 'teacher', ROLE_TABS.teacher);
    expect(tabs).toEqual(ROLE_TABS.teacher);
    expect(tabs.every((t) => typeof t === 'string')).toBe(true);
  });
});

describe('appNavConfig grouped navigation for Therapy Coordinator', () => {
  it('renames Student Registration to Registered Student in coordinator tabs', () => {
    expect(ROLE_TABS.coordinator).toContain('Registered Student');
    expect(ROLE_TABS.coordinator).not.toContain('Student Registration');
  });

  it('provides grouped tabs for coordinator role', () => {
    const session: AuthSession = {
      userName: 'Coordinator Mike',
      email: 'mike@melue.org',
      role: 'coordinator',
      roles: ['coordinator'],
    };

    const tabs = getGroupedTabsForSession(session, 'coordinator', ROLE_TABS.coordinator);
    expect(tabs.length).toBe(5);

    // Standalone tabs
    expect(tabs[0]).toBe('Dashboard');
    expect(tabs[4]).toBe('Parent Communication');

    // Group tabs
    const sessionsGroup = tabs[1];
    expect(isNavGroup(sessionsGroup)).toBe(true);
    if (isNavGroup(sessionsGroup)) {
      expect(sessionsGroup.label).toBe('Sessions');
      expect(sessionsGroup.items).toEqual(['Live Sessions', 'Session Summary']);
    }

    const studentsGroup = tabs[2];
    expect(isNavGroup(studentsGroup)).toBe(true);
    if (isNavGroup(studentsGroup)) {
      expect(studentsGroup.label).toBe('Students');
      expect(studentsGroup.items).toEqual([
        'Registered Student',
        'Enrollment Wizard',
        'IUP Creation & Goal Assignment',
      ]);
    }

    const operationsGroup = tabs[3];
    expect(isNavGroup(operationsGroup)).toBe(true);
    if (isNavGroup(operationsGroup)) {
      expect(operationsGroup.label).toBe('Operations');
      expect(operationsGroup.items).toEqual([
        'Staff Management & Linking',
        'Room Resource Scheduling',
      ]);
    }
  });

  it('maps all coordinator group items, aliases, and Registered Student to valid routes', async () => {
    const { COORDINATOR_ROUTE_BY_TAB } = await import('../appNavConfig');
    expect(COORDINATOR_ROUTE_BY_TAB['Registered Student']).toBe('StudentEnrollment');
    expect(COORDINATOR_ROUTE_BY_TAB['Registered Students']).toBe('StudentEnrollment');
    expect(COORDINATOR_ROUTE_BY_TAB['Student Registration']).toBe('StudentEnrollment');
    expect(COORDINATOR_ROUTE_BY_TAB['Sessions']).toBeDefined();
    expect(COORDINATOR_ROUTE_BY_TAB['Students']).toBeDefined();
    expect(COORDINATOR_ROUTE_BY_TAB['Operations']).toBeDefined();

    const originalTabs = ROLE_TABS.coordinator;
    for (const tab of originalTabs) {
      expect(COORDINATOR_ROUTE_BY_TAB[tab]).toBeDefined();
    }
  });
});

describe('getTabsForSession dynamic module filtering', () => {
  it('returns default tabs when session is null or has no modules', async () => {
    const { getTabsForSession } = await import('../appNavConfig');
    expect(getTabsForSession(null, ['Dashboard', 'Session'])).toEqual(['Dashboard', 'Session']);

    const sessionWithoutModules: AuthSession = {
      userName: 'Test User',
      role: 'teacher',
    };
    expect(getTabsForSession(sessionWithoutModules, ['Dashboard', 'Session'])).toEqual([
      'Dashboard',
      'Session',
    ]);
  });

  it('filters tabs based on modules for core roles without bypass', async () => {
    const { getTabsForSession } = await import('../appNavConfig');
    const teacherSessionWithOnlySessions: AuthSession = {
      userName: 'Teacher Amy',
      role: 'teacher',
      modules: ['sessions'],
    };

    const tabs = getTabsForSession(teacherSessionWithOnlySessions, [
      'Dashboard',
      'Session',
      'Assessments',
      'Daily Notes',
      'ABC Log',
      'Parents',
    ]);

    // Should include Dashboard (preserved) and tabs for 'sessions' ('Session', 'Daily Notes')
    expect(tabs).toContain('Dashboard');
    expect(tabs).toContain('Session');
    expect(tabs).toContain('Daily Notes');
    // Should NOT contain ungranted modules
    expect(tabs).not.toContain('Assessments');
    expect(tabs).not.toContain('ABC Log');
    expect(tabs).not.toContain('Parents');
  });

  it('dynamically generates tabs for custom roles with granted modules', async () => {
    const { getTabsForSession, routeMapForRole } = await import('../appNavConfig');
    const customRoleSession: AuthSession = {
      userName: 'Auditor Bob',
      role: 'auditor',
      modules: ['admin', 'reports'],
    };

    const tabs = getTabsForSession(customRoleSession, []);
    expect(tabs).toContain('Staff Accounts');
    expect(tabs).toContain('Role Management');
    expect(tabs).toContain('Permission Configuration');
    expect(tabs).toContain('Audit Log');
    expect(tabs).toContain('Reports & Oversight');

    // Should NOT contain ungranted modules
    expect(tabs).not.toContain('Session');
    expect(tabs).not.toContain('Assessments');

    const routeMap = routeMapForRole('auditor');
    expect(routeMap['Staff Accounts']).toBe('StaffAccountManagement');
    expect(routeMap['Audit Log']).toBe('AuditLog');
    expect(routeMap['Reports & Oversight']).toBe('ReportsOversight');
  });

  it('infers modules and tabs from permissions for custom roles', async () => {
    const { getTabsForSession } = await import('../appNavConfig');
    const customRoleSession: AuthSession = {
      userName: 'Evaluator Jane',
      role: 'clinical_evaluator',
      permissions: ['assessments:view', 'assessments:create', 'iups:view'],
    };

    const tabs = getTabsForSession(customRoleSession, []);
    expect(tabs).toContain('Assessments');
    expect(tabs).toContain('IUP Creation & Goal Assignment');
    expect(tabs).not.toContain('Staff Accounts');
  });

  it('dynamically injects newly granted modules into core role navbar and maps valid routes', async () => {
    const { getTabsForSession, routeMapForRole, ROLE_TABS } = await import('../appNavConfig');
    // Teacher granted both standard 'sessions' AND newly configured 'reports' & 'staff'
    const enhancedTeacherSession: AuthSession = {
      userName: 'Teacher Lead',
      role: 'teacher',
      modules: ['sessions', 'reports', 'staff'],
    };

    const tabs = getTabsForSession(enhancedTeacherSession, ROLE_TABS.teacher);

    // Kept standard granted tabs
    expect(tabs).toContain('Dashboard');
    expect(tabs).toContain('Session');
    expect(tabs).toContain('Daily Notes');

    // Newly injected tabs for 'reports' and 'staff'
    expect(tabs).toContain('Reports & Oversight');
    expect(tabs).toContain('Staff Scheduling');

    // Filtered out ungranted tabs
    expect(tabs).not.toContain('Assessments');
    expect(tabs).not.toContain('ABC Log');
    expect(tabs).not.toContain('Parents');

    // Route map resolves dynamically injected tabs for teacher
    const teacherRoutes = routeMapForRole('teacher');
    expect(teacherRoutes['Reports & Oversight']).toBe('ReportsOversight');
    expect(teacherRoutes['Staff Scheduling']).toBe('DirectorScheduling');
  });

  it('dynamically updates grouped navigation for Coordinator role based on active permissions', async () => {
    const { getGroupedTabsForSession, ROLE_TABS } = await import('../appNavConfig');
    // Coordinator with only sessions and reports granted
    const session: AuthSession = {
      userName: 'Coord Sarah',
      role: 'coordinator',
      modules: ['sessions', 'reports'],
    };

    const groupedTabs = getGroupedTabsForSession(session, 'coordinator', ROLE_TABS.coordinator);

    // Dashboard is present
    expect(groupedTabs).toContain('Dashboard');

    // Sessions group is present
    const sessionsGroup = groupedTabs.find(
      (item) => typeof item !== 'string' && item.label === 'Sessions',
    ) as any;
    expect(sessionsGroup).toBeDefined();
    expect(sessionsGroup.items).toContain('Live Sessions');

    // Reports tab is dynamically injected
    expect(groupedTabs).toContain('Reports & Oversight');

    // Ungranted groups like Students (needs students) should not be present
    const studentsGroup = groupedTabs.find(
      (item) => typeof item !== 'string' && item.label === 'Students',
    );
    expect(studentsGroup).toBeUndefined();
  });
});

describe('hasModuleAccess route guard alignment', () => {
  it('allows access when module is granted via session.permissions list', async () => {
    const { hasModuleAccess } = await import('../../auth/permissions');

    // When session.modules is empty but session.permissions has 'reports:view'
    expect(hasModuleAccess([], 'reports' as any, ['reports:view'])).toBe(true);
    expect(hasModuleAccess([], 'reports' as any, ['oversight:view'])).toBe(true);

    // Denies when ungranted
    expect(hasModuleAccess([], 'reports' as any, ['sessions:view'])).toBe(false);
  });
});
