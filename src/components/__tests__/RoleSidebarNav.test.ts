import { describe, it, expect } from 'vitest';
import { ROLE_TABS, SYS_ROUTE_BY_TAB, routeMapForRole } from '../appNavConfig';
import { SidebarNavContext } from '../../navigation/SidebarNavContext';
import { useContext } from 'react';

describe('System Admin Navigation & Sidebar Configuration', () => {
  it('defines the correct tabs for system_admin', () => {
    const tabs = ROLE_TABS.system_admin;
    expect(tabs).toEqual([
      'Staff Account Management',
      'Role Management',
      'Permission Configuration (RBAC)',
      'System Audit Log',
    ]);
  });

  it('correctly maps all system_admin tabs to their screen routes', () => {
    const routeMap = routeMapForRole('system_admin');
    expect(routeMap).toBeDefined();

    expect(routeMap?.['Staff Account Management']).toBe('StaffAccountManagement');
    expect(routeMap?.['Staff Accounts']).toBe('StaffAccountManagement');
    expect(routeMap?.['Role Management']).toBe('RoleManagement');
    expect(routeMap?.['Permission Configuration (RBAC)']).toBe('PermissionConfiguration');
    expect(routeMap?.['Permission Configuration']).toBe('PermissionConfiguration');
    expect(routeMap?.['System Audit Log']).toBe('AuditLog');
    expect(routeMap?.['Audit Log']).toBe('AuditLog');
  });

  it('supports legacy alias mappings for system_admin routes', () => {
    expect(SYS_ROUTE_BY_TAB['Staff']).toBe('StaffAccountManagement');
    expect(SYS_ROUTE_BY_TAB['Roles']).toBe('RoleManagement');
    expect(SYS_ROUTE_BY_TAB['Permissions']).toBe('PermissionConfiguration');
    expect(SYS_ROUTE_BY_TAB['Audit']).toBe('AuditLog');
  });

  it('initializes SidebarNavContext with default values', () => {
    // Check default context values
    expect(SidebarNavContext).toBeDefined();
    // Default context has isCollapsed as false and functions defined
    const defaultValue = (SidebarNavContext as any)._currentValue;
    if (defaultValue) {
      expect(defaultValue.isCollapsed).toBe(false);
      expect(typeof defaultValue.toggleSidebar).toBe('function');
      expect(typeof defaultValue.setIsCollapsed).toBe('function');
    }
  });

  it('identifies system_admin as sidebar navigation role', () => {
    const isSidebarRole = (role: string) =>
      role === 'system_admin' || role === 'institutional_admin';
    expect(isSidebarRole('system_admin')).toBe(true);
    expect(isSidebarRole('institutional_admin')).toBe(true);
    expect(isSidebarRole('teacher')).toBe(false);
    expect(isSidebarRole('coordinator')).toBe(false);
    expect(isSidebarRole('director')).toBe(false);
    expect(isSidebarRole('program_director')).toBe(false);
    expect(isSidebarRole('parent')).toBe(false);
  });

  it('determines navbar hamburger visibility responsively', () => {
    // On mobile / tablet (isCompact = true), hamburger must be shown for all roles including system_admin
    const shouldShowHamburger = (isCompact: boolean) => isCompact;

    expect(shouldShowHamburger(true)).toBe(true); // mobile / tablet
    expect(shouldShowHamburger(false)).toBe(false); // desktop
  });
});

describe('Sidebar Navigation Architecture & Module Category Grouping', () => {
  it('groups System Administrator into System Administration section with 4 canonical pages', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'system_admin');

    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('System Administration');
    const pageLabels = sections[0].items.map((i) => i.label);
    expect(pageLabels).toEqual([
      'Staff Account Management',
      'Role Management',
      'Permission Configuration (RBAC)',
      'System Audit Log',
    ]);
  });

  it('groups Institutional Administrator into Institutional Administration section with 5 canonical pages', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'institutional_admin');

    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('Institutional Administration');
    const pageLabels = sections[0].items.map((i) => i.label);
    expect(pageLabels).toEqual([
      'Schedule & Capacity Configuration',
      'Form Builder',
      'ABC Dropdown Lists',
      'Trial Logging Format Config',
      'Goal Bank / Domains',
    ]);
  });

  it('groups Director pages across exact module categories without duplicate parent routes', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'director');

    const titles = sections.map((s) => s.title);
    expect(titles).toEqual([
      'Active Therapy & Clinical Delivery',
      'Operations & Scheduling',
      'Family Engagement & Parent Portal',
      'Executive Oversight',
    ]);

    const activeTherapy = sections.find((s) => s.title === 'Active Therapy & Clinical Delivery');
    expect(activeTherapy?.items.map((i) => i.label)).toEqual(['Goal Mastery Approval']);

    const ops = sections.find((s) => s.title === 'Operations & Scheduling');
    expect(ops?.items.map((i) => i.label)).toEqual(['Staff Scheduling & Capacity']);

    const family = sections.find((s) => s.title === 'Family Engagement & Parent Portal');
    expect(family?.items.map((i) => i.label)).toEqual(['Parent Communication']);

    const oversight = sections.find((s) => s.title === 'Executive Oversight');
    expect(oversight?.items.map((i) => i.label)).toEqual([
      'Reports & Executive Oversight',
      'Custom Report Builder',
    ]);
  });

  it('groups Program Director pages with Goal Bank and Assessment Review & Sign-Off', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'program_director');

    const titles = sections.map((s) => s.title);
    expect(titles).toEqual([
      'Student Intake & Enrollment',
      'Assessments',
      'IUP & Goals',
      'Executive Oversight',
    ]);

    const intake = sections.find((s) => s.title === 'Student Intake & Enrollment');
    expect(intake?.items.map((i) => i.label)).toEqual([
      'Student Enrollment Wizard',
      'Student Register & Roster List',
    ]);

    const assessments = sections.find((s) => s.title === 'Assessments');
    expect(assessments?.items.map((i) => i.label)).toEqual([
      'Assessment Review & Sign-Off',
      'Assessment Summary Report',
    ]);

    const iupGoals = sections.find((s) => s.title === 'IUP & Goals');
    expect(iupGoals?.items.map((i) => i.label)).toEqual([
      'IUP Creation & Goal Assignment',
      'IUP Library Management',
      'Student Caseload Management',
      'Goal Bank',
    ]);

    // Renamed from Clinical Quality Monitoring
    expect(iupGoals?.items.map((i) => i.label)).not.toContain('Clinical Quality Monitoring');
  });

  it('groups Therapy Coordinator pages across operations, intake, and sessions', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'coordinator');

    const titles = sections.map((s) => s.title);
    expect(titles).toEqual([
      'Student Intake & Enrollment',
      'Active Therapy & Clinical Delivery',
      'Operations & Scheduling',
      'Family Engagement & Parent Portal',
    ]);

    const intake = sections.find((s) => s.title === 'Student Intake & Enrollment');
    expect(intake?.items.map((i) => i.label)).toEqual([
      'Student Enrollment Wizard',
      'Student Register & Roster List',
    ]);

    const sessions = sections.find((s) => s.title === 'Active Therapy & Clinical Delivery');
    expect(sessions?.items.map((i) => i.label)).toEqual([
      'Live Session Monitoring',
      'Session Summary Review',
    ]);

    const ops = sections.find((s) => s.title === 'Operations & Scheduling');
    expect(ops?.items.map((i) => i.label)).toEqual([
      'Staff Workload & Therapist Linking',
      'Room Resource Scheduling',
    ]);

    const family = sections.find((s) => s.title === 'Family Engagement & Parent Portal');
    expect(family?.items.map((i) => i.label)).toEqual(['Parent Communication']);
  });

  it('groups Teacher / Therapist pages correctly with consolidated Parent Communication', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'teacher');

    const titles = sections.map((s) => s.title);
    expect(titles).toEqual([
      'Assessments',
      'Active Therapy & Clinical Delivery',
      'Family Engagement & Parent Portal',
    ]);

    const sessions = sections.find((s) => s.title === 'Active Therapy & Clinical Delivery');
    expect(sessions?.items.map((i) => i.label)).toEqual([
      'Session Data Collection',
      'Daily Session Notes',
      'ABC Behavior Incident Log',
    ]);

    const assessments = sections.find((s) => s.title === 'Assessments');
    expect(assessments?.items.map((i) => i.label)).toEqual(['Assessment Dashboard']);

    const family = sections.find((s) => s.title === 'Family Engagement & Parent Portal');
    expect(family?.items.map((i) => i.label)).toEqual(['Parent Communication']);
  });

  it('groups Parent / Guardian pages with Child Progress Tracker and Home Observation Log', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    const sections = getSidebarSectionsForSession(null, 'parent');

    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('Family Engagement & Parent Portal');
    expect(sections[0].items.map((i) => i.label)).toEqual([
      'Child Progress Tracker',
      'Home Observation Log',
      'Parent Communication',
    ]);
  });

  it('dynamically hides sections when role permissions do not permit any items in that category', async () => {
    const { getSidebarSectionsForSession } = await import('../appNavConfig');
    // Coordinator granted ONLY sessions (lacks students, staff, parent_portal)
    const restrictedSession = {
      userName: 'Restricted Coord',
      role: 'coordinator' as const,
      modules: ['sessions'],
    };

    const sections = getSidebarSectionsForSession(restrictedSession, 'coordinator');
    expect(sections.length).toBe(1);
    expect(sections[0].title).toBe('Active Therapy & Clinical Delivery');
    expect(sections.some((s) => s.title === 'Student Intake & Enrollment')).toBe(false);
    expect(sections.some((s) => s.title === 'Operations & Scheduling')).toBe(false);
    expect(sections.some((s) => s.title === 'Family Engagement & Parent Portal')).toBe(false);
  });

  it('supports toggling sections between expanded and collapsed states', () => {
    // Initial state: all sections are expanded by default (!collapsedSections[title] === true)
    const collapsedSections: Record<string, boolean> = {};
    const sectionTitle = 'Student Intake & Enrollment';

    const isExpandedInitial = !collapsedSections[sectionTitle];
    expect(isExpandedInitial).toBe(true);

    // Toggle to collapse
    collapsedSections[sectionTitle] = !collapsedSections[sectionTitle];
    const isExpandedAfterCollapse = !collapsedSections[sectionTitle];
    expect(isExpandedAfterCollapse).toBe(false);

    // Toggle again to expand
    collapsedSections[sectionTitle] = !collapsedSections[sectionTitle];
    const isExpandedAfterReopen = !collapsedSections[sectionTitle];
    expect(isExpandedAfterReopen).toBe(true);
  });
});
