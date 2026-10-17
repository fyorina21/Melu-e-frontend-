// Central config for the unified app navbar: which tabs each role sees,
// the display label for each role, which roles have a notifications screen
// (so the bell only appears where it can navigate somewhere), and the
// tab → route maps previously scattered across the per-role nav components.
//
// The navbar itself navigates via these maps (see AppNavbar), so each map
// contains both the canonical tab labels AND legacy aliases used by older
// screens' `activeTab` props.
import type {
  Role,
  AuthSession,
  ParentStackParamList,
  DirectorStackParamList,
  SystemAdminStackParamList,
  InstitutionalAdminStackParamList,
  ProgramDirectorStackParamList,
  CoordinatorStackParamList,
} from '../types';

import { RESOURCE_ALIAS_MAP } from '../screens/systemadmin/permissions/permissionTypes';
import { SCREEN_TO_MODULE, hasModuleAccess } from '../auth/permissions';

export const MODULE_TO_TABS: Record<string, string[]> = {
  iups: ['IUP Creation & Goal Assignment', 'Goal Domains', 'Task Analysis'],
  assessments: ['Assessments'],
  sessions: ['Session', 'Daily Notes', 'Trial Logging Format'],
  behavior_incidents: ['ABC Log', 'ABC Dropdown Lists'],
  parent_portal: ['Parents'],
  students: ['Enrollment Wizard'],
  reports: ['Reports & Oversight'],
  staff: ['Staff Scheduling', 'Schedule & Capacity'],
  admin: [
    'Staff Accounts',
    'Role Management',
    'Permission Configuration',
    'Audit Log',
    'Form Builder',
  ],
};

export const MODULE_DEFAULT_ROUTES: Record<string, string> = {
  admin: 'StaffAccountManagement',
  staff: 'DirectorScheduling',
  assessments: 'AssessmentDashboard',
  sessions: 'SessionDataCollection',
  behavior_incidents: 'AbcLog',
  iups: 'IupGeneration',
  students: 'StudentEnrollmentWizard',
  reports: 'ReportsOversight',
  parent_portal: 'ParentCommunication',
};

/**
 * Returns dynamic tabs for the current session based on configured modules.
 * When session.modules is provided, tabs are filtered to only granted modules
 * (preserving Dashboard). When defaultRoleTabs is empty (custom role), tabs are
 * dynamically derived directly from granted modules and permissions.
 */
export function getTabsForSession(
  session: AuthSession | null | undefined,
  defaultRoleTabs: string[],
): string[] {
  if (!session) return defaultRoleTabs;

  const grantedModules = new Set<string>();
  if (session.modules && Array.isArray(session.modules)) {
    for (const rawMod of session.modules) {
      if (typeof rawMod === 'string') {
        const canonical = (RESOURCE_ALIAS_MAP[rawMod.toLowerCase()] ?? rawMod).toLowerCase();
        grantedModules.add(canonical);
      }
    }
  }

  // Also extract module names from session.permissions if present
  if (session.permissions && Array.isArray(session.permissions)) {
    for (const rawPerm of session.permissions) {
      if (typeof rawPerm === 'string' && rawPerm.includes(':')) {
        const rawRes = rawPerm.split(':')[0]?.trim().toLowerCase();
        if (rawRes) {
          const canonical = (RESOURCE_ALIAS_MAP[rawRes] ?? rawRes).toLowerCase();
          grantedModules.add(canonical);
        }
      }
    }
  }

  if (defaultRoleTabs && defaultRoleTabs.length > 0) {
    if (grantedModules.size > 0) {
      const dynamicTabs = defaultRoleTabs.filter((tab) => {
        if (tab === 'Dashboard') return true;
        const entry = Object.entries(MODULE_TO_TABS).find(([_, tabs]) => tabs.includes(tab));
        if (!entry) return true;
        const [moduleId] = entry;
        return grantedModules.has(moduleId);
      });

      if (dynamicTabs.length > 0) {
        return dynamicTabs;
      }
    }
    return defaultRoleTabs;
  }

  // Custom role or empty defaultRoleTabs: build tabs from granted modules
  if (grantedModules.size > 0) {
    const customTabs: string[] = [];
    for (const [moduleId, moduleTabs] of Object.entries(MODULE_TO_TABS)) {
      if (grantedModules.has(moduleId.toLowerCase())) {
        for (const tab of moduleTabs) {
          if (!customTabs.includes(tab)) {
            customTabs.push(tab);
          }
        }
      }
    }
    if (customTabs.length > 0) {
      return customTabs;
    }
  }

  return [];
}

export const ROLE_TABS: Record<Role, string[]> = {
  teacher: ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Parents'],
  therapist: ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Parents'],
  coordinator: [
    'Dashboard',
    'Live Sessions',
    'Session Summary',
    'Student Progress',
    'Operational Management',
    'Parent Communication',
    'Registered Student',
    'Staff Management & Linking',
    'IUP Creation & Goal Assignment',
  ],
  director: [
    'Dashboard',
    'Staff Scheduling',
    'Goal Mastery Approval',
    'Parent Communication',
    'Report & Oversight',
    'Student Progress',
  ],
  program_director: [
    'Dashboard',
    'Enrollment Wizard',
    'IUP Creation & Goal Assignment',
    'Assessment Summary Report',
    'Goal Mastery Approval',
    'Assessment Review',
    'IUP Library Management',
    'Student Caseload Management',
    'Clinical Quality Monitoring',
    'Parent Communication',
    'Reports',
  ],
  institutional_admin: [
    'Goal Domains',
    'Task Analysis',
    'Schedule & Capacity',
    'ABC Dropdown Lists',
    'Trial Logging Format',
    'Form Builder',
  ],
  system_admin: ['Staff Accounts', 'Role Management', 'Permission Configuration', 'Audit Log'],
  parent: ['Dashboard', 'Progress', 'Observations', 'Messages'],
};

export interface NavGroupTab {
  label: string;
  items: string[];
}

export type NavTabItem = string | NavGroupTab;

export const isNavGroup = (tab: NavTabItem): tab is NavGroupTab => {
  return typeof tab !== 'string' && Array.isArray((tab as any)?.items);
};

export const ROLE_GROUPED_TABS: Partial<Record<Role, NavTabItem[]>> = {
  coordinator: [
    'Dashboard',
    {
      label: 'Sessions',
      items: ['Live Sessions', 'Session Summary'],
    },
    {
      label: 'Students',
      items: ['Registered Student', 'Student Progress', 'IUP Creation & Goal Assignment'],
    },
    {
      label: 'Operations',
      items: ['Operational Management', 'Staff Management & Linking'],
    },
    'Parent Communication',
  ],
  program_director: [
    'Dashboard',
    {
      label: 'Students',
      items: ['Enrollment Wizard', 'Student Caseload Management'],
    },
    {
      label: 'Assessments',
      items: ['Assessment Review', 'Assessment Summary Report'],
    },
    {
      label: 'IUPs',
      items: ['IUP Creation & Goal Assignment', 'IUP Library Management'],
    },
    {
      label: 'Approvals & Quality',
      items: ['Goal Mastery Approval', 'Clinical Quality Monitoring'],
    },
    'Parent Communication',
    'Reports',
  ],
};

export function getGroupedTabsForSession(
  session: AuthSession | null | undefined,
  role: Role,
  defaultTabs: string[],
): NavTabItem[] {
  const grouped = ROLE_GROUPED_TABS[role];
  if (grouped) {
    return grouped;
  }
  return getTabsForSession(session, defaultTabs);
}

export const ROLE_LABELS: Record<Role, string> = {
  teacher: 'Teacher',
  therapist: 'Therapist',
  coordinator: 'Therapy Coordinator',
  director: 'Director',
  program_director: 'Program Director',
  institutional_admin: 'Institutional Admin',
  system_admin: 'System Admin',
  parent: 'Parent',
};

export const ROLE_NOTIFICATION_ROUTE: Record<Role, string | undefined> = {
  teacher: 'Notifications',
  therapist: 'Notifications',
  coordinator: 'Notifications',
  director: undefined,
  program_director: undefined,
  institutional_admin: undefined,
  system_admin: undefined,
  parent: 'Notifications',
};

// ---- Tab → route maps (used by AppNavbar and screens for navigation) ----

export const TEACHER_ROUTE_BY_TAB: Record<string, string> = {
  Dashboard: 'TeacherDashboard',
  Session: 'SessionDataCollection',
  'Active Therapy': 'SessionDataCollection',
  Assessments: 'AssessmentDashboard',
  'Assessment Dashboard': 'AssessmentDashboard',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Daily Notes': 'DailyNotes',
  'ABC Log': 'AbcLog',
  Parents: 'ParentCommunication',
  Notifications: 'Notifications',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  IUPs: 'IupGeneration',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Profile': 'StudentProfile',
  'Reports & Oversight': 'AssessmentSummaryReport',
};

export const PARENT_ROUTE_BY_TAB: Record<string, keyof ParentStackParamList> = {
  Dashboard: 'ParentDashboard',
  Progress: 'ChildProgress',
  Observations: 'HomeObservationLog',
  Messages: 'ParentCommunication',
  Notifications: 'Notifications',
};

export const DIRECTOR_ROUTE_BY_TAB: Record<string, keyof DirectorStackParamList> = {
  // Canonical tabs
  Dashboard: 'DirectorDashboard',
  'Staff Scheduling': 'DirectorScheduling',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Parent Communication': 'DirectorParentCommunication',
  'Reports & Oversight': 'ReportsOversight',
  'Report & Oversight': 'ReportsOversight',
  'Student Progress': 'DirectorStudentProgress',
  Assessments: 'AssessmentSummaryReport',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  // Legacy aliases (existing screens / internal links)
  Scheduling: 'DirectorScheduling',
  Approvals: 'GoalMasteryApproval',
  Parents: 'DirectorParentCommunication',
  Reports: 'ReportsOversight',
  Progress: 'DirectorStudentProgress',
  Builder: 'ReportBuilder',
};

export const SYS_ROUTE_BY_TAB: Record<string, keyof SystemAdminStackParamList> = {
  'Admin Panel': 'StaffAccountManagement',
  'Staff Accounts': 'StaffAccountManagement',
  'Staff account management': 'StaffAccountManagement',
  'Staff Management': 'StaffAccountManagement',
  Staff: 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  Roles: 'RoleManagement',
  'Permission Configuration': 'PermissionConfiguration',
  Permissions: 'PermissionConfiguration',
  Permission: 'PermissionConfiguration',
  'Audit Log': 'AuditLog',
  'Audit Logs': 'AuditLog',
  Audit: 'AuditLog',
};

export const IA_ROUTE_BY_TAB: Record<string, keyof InstitutionalAdminStackParamList> = {
  // Canonical tabs
  Dashboard: 'FormBuilder',
  'Task Analysis': 'TaskAnalysisTemplates',
  'Goal Domains': 'GoalDomainDefinitions',
  'Schedule & Capacity': 'ScheduleCapacityConfig',
  'ABC Dropdown Lists': 'AbcDropdownLists',
  'Trial Logging Format': 'TrialLoggingFormat',
  'Form Builder': 'FormBuilder',
  // Legacy aliases (existing screens / internal links)
  Forms: 'FormBuilder',
  Form: 'FormBuilder',
  'Trial Logging': 'TrialLoggingFormat',
  'ABC Lists': 'AbcDropdownLists',
  ABC: 'AbcDropdownLists',
  Schedule: 'ScheduleCapacityConfig',
  Capacity: 'ScheduleCapacityConfig',
  Goal: 'GoalDomainDefinitions',
  Task: 'TaskAnalysisTemplates',
};

export const PD_ROUTE_BY_TAB: Record<string, keyof ProgramDirectorStackParamList> = {
  // Canonical tabs
  Dashboard: 'ProgramDirectorDashboard',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Assessment Review': 'AssessmentReview',
  'IUP Library Management': 'IupLibrary',
  'Student Caseload Management': 'StudentCaseload',
  'Clinical Quality Monitoring': 'GoalBankManagement',
  'Parent Communication': 'PdParentCommunication',
  Reports: 'GraphChartView',
  'Reports & Oversight': 'GraphChartView',
  // Legacy aliases (existing screens / internal links)
  Caseload: 'StudentCaseload',
  Assessments: 'AssessmentSummaryReport',
  Assessment: 'AssessmentReview',
  IUP: 'IupGeneration',
  Library: 'IupLibrary',
  'IUP Library': 'IupLibrary',
  Approvals: 'GoalMasteryApproval',
  'Clinical Quality': 'GoalBankManagement',
  Enrollment: 'StudentEnrollmentWizard',
  Charts: 'GraphChartView',
  Progress: 'GraphChartView',
  Parents: 'PdParentCommunication',
  Students: 'StudentEnrollmentWizard',
  IUPs: 'IupGeneration',
  'Approvals & Quality': 'GoalMasteryApproval',
  Quality: 'GoalBankManagement',
};

export const COORDINATOR_ROUTE_BY_TAB: Record<string, keyof CoordinatorStackParamList> = {
  // Canonical tabs
  Dashboard: 'CoordinatorDashboard',
  'Student Profile': 'StudentProfile',
  'Live Sessions': 'LiveSessionMonitoring',
  'Session Summary': 'SessionSummaryReview',
  'Student Progress': 'CoordinatorStudentProgress',
  'Operational Management': 'CoordinatorSchedule',
  'Parent Communication': 'CoordinatorParentCommunication',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'registred student': 'StudentEnrollment',
  'Registred Student': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  Enrollment: 'StudentEnrollment',
  'Staff Management & Linking': 'WorkloadDashboard',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  // Group aliases
  Sessions: 'LiveSessionMonitoring',
  Students: 'StudentEnrollment',
  Operations: 'CoordinatorSchedule',
  // Legacy aliases (existing screens / internal links)
  Student: 'StudentProfile',
  Live: 'LiveSessionMonitoring',
  Review: 'SessionSummaryReview',
  Progress: 'CoordinatorStudentProgress',
  Schedule: 'CoordinatorSchedule',
  Operational: 'CoordinatorSchedule',
  Parents: 'CoordinatorParentCommunication',
  Registration: 'StudentEnrollment',
  Workload: 'WorkloadDashboard',
  Staff: 'WorkloadDashboard',
  Rooms: 'RoomResourceScheduling',
  Notifications: 'Notifications',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  Assessments: 'AssessmentDashboard',
};

export const GLOBAL_ROUTE_BY_TAB: Record<string, string> = {
  ...TEACHER_ROUTE_BY_TAB,
  ...COORDINATOR_ROUTE_BY_TAB,
  ...PD_ROUTE_BY_TAB,
  ...DIRECTOR_ROUTE_BY_TAB,
  ...IA_ROUTE_BY_TAB,
  ...SYS_ROUTE_BY_TAB,
  ...PARENT_ROUTE_BY_TAB,
  // Canonical overrides
  'Staff Accounts': 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  'Permission Configuration': 'PermissionConfiguration',
  'Audit Log': 'AuditLog',
  'Form Builder': 'FormBuilder',
  'Goal Domains': 'GoalDomainDefinitions',
  'Schedule & Capacity': 'ScheduleCapacityConfig',
  'ABC Dropdown Lists': 'AbcDropdownLists',
  'Trial Logging Format': 'TrialLoggingFormat',
  'Task Analysis': 'TaskAnalysisTemplates',
  'Staff Scheduling': 'DirectorScheduling',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Reports & Oversight': 'ReportsOversight',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Registered Student': 'StudentEnrollment',
  'Live Sessions': 'LiveSessionMonitoring',
  'Session Summary': 'SessionSummary',
  'ABC Log': 'AbcLog',
  Session: 'SessionDataCollection',
  'Daily Notes': 'DailyNotes',
  Assessments: 'AssessmentDashboard',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Assessment Review': 'AssessmentReview',
  'IUP Library Management': 'IupLibrary',
  'Student Caseload Management': 'StudentCaseload',
  'Clinical Quality Monitoring': 'GoalBankManagement',
  Parents: 'ParentCommunication',
  'Parent Communication': 'ParentCommunication',
  Notifications: 'Notifications',
};

export function routeMapForRole(role: Role): Record<string, string> {
  switch (role) {
    case 'teacher':
    case 'therapist':
      return TEACHER_ROUTE_BY_TAB;
    case 'coordinator':
      return COORDINATOR_ROUTE_BY_TAB;
    case 'program_director':
      return PD_ROUTE_BY_TAB;
    case 'director':
      return DIRECTOR_ROUTE_BY_TAB;
    case 'institutional_admin':
      return IA_ROUTE_BY_TAB;
    case 'system_admin':
      return SYS_ROUTE_BY_TAB;
    case 'parent':
      return PARENT_ROUTE_BY_TAB;
    default:
      return GLOBAL_ROUTE_BY_TAB;
  }
}

/**
 * Resolves the primary landing screen for a custom or non-standard role
 * based on its granted permissions and configured modules. Never falls back to
 * TeacherDashboard unless explicitly permitted.
 */
export function resolveInitialRouteForCustomRole(session: AuthSession | null | undefined): string {
  if (!session) return 'CustomRolePending';

  // 1. If an explicit home route is specified and user has access, honor it
  if (session.homeRoute) {
    const requiredMod = SCREEN_TO_MODULE[session.homeRoute];
    if (!requiredMod || hasModuleAccess(session.modules, requiredMod)) {
      return session.homeRoute;
    }
  }

  // 2. Derive dynamic tabs for this custom role session
  const tabs = getTabsForSession(session, []);
  if (tabs.length > 0) {
    for (const tab of tabs) {
      const route = GLOBAL_ROUTE_BY_TAB[tab];
      if (route) {
        const requiredMod = SCREEN_TO_MODULE[route];
        if (!requiredMod || hasModuleAccess(session.modules, requiredMod)) {
          return route;
        }
      }
    }
  }

  // 3. Fallback to the first granted module's default route
  if (session.modules && session.modules.length > 0) {
    for (const mod of session.modules) {
      if (typeof mod === 'string') {
        const canonical = (RESOURCE_ALIAS_MAP[mod.toLowerCase()] ?? mod).toLowerCase();
        const defRoute = MODULE_DEFAULT_ROUTES[canonical];
        if (defRoute) return defRoute;
      }
    }
  }

  return 'CustomRolePending';
}
