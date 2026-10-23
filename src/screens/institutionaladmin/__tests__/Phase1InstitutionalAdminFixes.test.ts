import { describe, it, expect } from 'vitest';
import {
  ROLE_TABS,
  MODULE_TO_TABS,
  TAB_ALIASES_TO_MODULE,
  IA_ROUTE_BY_TAB,
  getTabsForSession,
} from '../../../components/appNavConfig';
import { SCREEN_TO_MODULE } from '../../../auth/permissions';
import type { AuthSession } from '../../../types';

describe('Phase 1: Institutional Admin Routing & Module Guards', () => {
  it('includes Goal Bank / Domains and excludes Task Analysis from ROLE_TABS for institutional_admin', () => {
    expect(ROLE_TABS.institutional_admin).not.toContain('Task Analysis');
    expect(
      ROLE_TABS.institutional_admin.includes('Goal Bank / Domains') ||
        ROLE_TABS.institutional_admin.includes('Goals'),
    ).toBe(true);
    expect(ROLE_TABS.institutional_admin).toEqual([
      'Schedule & Capacity Configuration',
      'Form Builder',
      'ABC Dropdown Lists',
      'Trial Logging Format Config',
      'Goal Bank / Domains',
    ]);
  });

  it('maps Goals to GoalDomainDefinitions route in IA_ROUTE_BY_TAB', () => {
    expect(IA_ROUTE_BY_TAB['Goal Bank / Domains']).toBe('GoalDomainDefinitions');
    expect(IA_ROUTE_BY_TAB['Goals']).toBe('GoalDomainDefinitions');
    expect(IA_ROUTE_BY_TAB['Schedule & Capacity Configuration']).toBe('ScheduleCapacityConfig');
    expect(IA_ROUTE_BY_TAB['Schedule & Capacity']).toBe('ScheduleCapacityConfig');
    expect(IA_ROUTE_BY_TAB['ABC Dropdown Lists']).toBe('AbcDropdownLists');
    expect(IA_ROUTE_BY_TAB['Trial Logging Format Config']).toBe('TrialLoggingFormat');
    expect(IA_ROUTE_BY_TAB['Trial Logging Format']).toBe('TrialLoggingFormat');
    expect(IA_ROUTE_BY_TAB['Form Builder']).toBe('FormBuilder');
  });

  it('wires institutional admin tabs into MODULE_TO_TABS for RBAC filtering', () => {
    expect(TAB_ALIASES_TO_MODULE['Goals']).toBe('iups');
    expect(TAB_ALIASES_TO_MODULE['Goal Bank / Domains']).toBe('iups');
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

    expect(tabs.some((t) => t === 'Goal Bank / Domains' || t === 'Goals')).toBe(true);
    expect(tabs).not.toContain('Task Analysis');
    expect(
      tabs.some((t) => t === 'Trial Logging Format Config' || t === 'Trial Logging Format'),
    ).toBe(true);

    // Modules not granted should be filtered out
    expect(tabs).not.toContain('ABC Dropdown Lists');
    expect(tabs).not.toContain('Schedule & Capacity Configuration');
    expect(tabs).not.toContain('Form Builder');
  });

  it('verifies SCREEN_TO_MODULE alignment for GoalDomainDefinitions and TaskAnalysisTemplates', () => {
    expect(SCREEN_TO_MODULE.GoalDomainDefinitions).toBe('iups');
    expect(SCREEN_TO_MODULE.TaskAnalysisTemplates).toBe('iups');
  });
});
