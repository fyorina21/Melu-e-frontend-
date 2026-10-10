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
    expect(tabs.length).toBe(7);

    // Standalone tabs
    expect(tabs[0]).toBe('Dashboard');
    expect(tabs[5]).toBe('Parent Communication');
    expect(tabs[6]).toBe('Reports');

    // Group tabs
    const studentsGroup = tabs[1];
    expect(isNavGroup(studentsGroup)).toBe(true);
    if (isNavGroup(studentsGroup)) {
      expect(studentsGroup.label).toBe('Students');
      expect(studentsGroup.items).toEqual(['Enrollment Wizard', 'Student Caseload Management']);
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
      expect(iupsGroup.items).toEqual(['IUP Creation & Goal Assignment', 'IUP Library Management']);
    }

    const qualityGroup = tabs[4];
    expect(isNavGroup(qualityGroup)).toBe(true);
    if (isNavGroup(qualityGroup)) {
      expect(qualityGroup.label).toBe('Approvals & Quality');
      expect(qualityGroup.items).toEqual(['Goal Mastery Approval', 'Clinical Quality Monitoring']);
    }
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
        'Student Progress',
        'IUP Creation & Goal Assignment',
      ]);
    }

    const operationsGroup = tabs[3];
    expect(isNavGroup(operationsGroup)).toBe(true);
    if (isNavGroup(operationsGroup)) {
      expect(operationsGroup.label).toBe('Operations');
      expect(operationsGroup.items).toEqual([
        'Operational Management',
        'Staff Management & Linking',
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
