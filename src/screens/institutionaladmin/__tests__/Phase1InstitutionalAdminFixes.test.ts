import { describe, it, expect } from 'vitest';
import {
  ROLE_TABS,
  MODULE_TO_TABS,
  IA_ROUTE_BY_TAB,
  getTabsForSession,
} from '../../../components/appNavConfig';
import { SCREEN_TO_MODULE } from '../../../auth/permissions';
import type { AuthSession } from '../../../types';

describe('Phase 1: Institutional Admin Routing & Module Guards', () => {
  it('includes Goals and excludes Task Analysis from ROLE_TABS for institutional_admin', () => {
    expect(ROLE_TABS.institutional_admin).not.toContain('Task Analysis');
    expect(ROLE_TABS.institutional_admin).toContain('Goals');
    expect(ROLE_TABS.institutional_admin).toEqual([
      'Goals',
      'Schedule & Capacity',
      'ABC Dropdown Lists',
      'Trial Logging Format',
      'Form Builder',
    ]);
  });

  it('maps Goals to GoalDomainDefinitions route in IA_ROUTE_BY_TAB', () => {
    expect(IA_ROUTE_BY_TAB['Goals']).toBe('GoalDomainDefinitions');
    expect(IA_ROUTE_BY_TAB['Schedule & Capacity']).toBe('ScheduleCapacityConfig');
    expect(IA_ROUTE_BY_TAB['ABC Dropdown Lists']).toBe('AbcDropdownLists');
    expect(IA_ROUTE_BY_TAB['Trial Logging Format']).toBe('TrialLoggingFormat');
    expect(IA_ROUTE_BY_TAB['Form Builder']).toBe('FormBuilder');
  });

  it('wires institutional admin tabs into MODULE_TO_TABS for RBAC filtering', () => {
    expect(MODULE_TO_TABS.iups).toContain('Goals');
    expect(MODULE_TO_TABS.iups).not.toContain('Task Analysis');
    expect(MODULE_TO_TABS.sessions).toContain('Trial Logging Format');
    expect(MODULE_TO_TABS.behavior_incidents).toContain('ABC Dropdown Lists');
    expect(MODULE_TO_TABS.staff).toContain('Schedule & Capacity');
    expect(MODULE_TO_TABS.admin).toContain('Form Builder');
  });

  it('filters institutional admin tabs dynamically based on granted modules', () => {
    const sessionWithOnlyIupsAndSessions: AuthSession = {
      userName: 'Specialized Clinical Admin',
      role: 'institutional_admin',
      modules: ['iups', 'sessions'],
    };

    const tabs = getTabsForSession(sessionWithOnlyIupsAndSessions, ROLE_TABS.institutional_admin);

    expect(tabs).toContain('Goals');
    expect(tabs).not.toContain('Task Analysis');
    expect(tabs).toContain('Trial Logging Format');

    // Modules not granted should be filtered out
    expect(tabs).not.toContain('ABC Dropdown Lists');
    expect(tabs).not.toContain('Schedule & Capacity');
    expect(tabs).not.toContain('Form Builder');
  });

  it('verifies SCREEN_TO_MODULE alignment for GoalDomainDefinitions and TaskAnalysisTemplates', () => {
    expect(SCREEN_TO_MODULE.GoalDomainDefinitions).toBe('iups');
    expect(SCREEN_TO_MODULE.TaskAnalysisTemplates).toBe('iups');
  });
});
