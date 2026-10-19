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
  iups: [
    'IUP Creation & Goal Assignment',
    'IUP Library Management',
    'Student Caseload Management',
    'Clinical Quality Monitoring',
  ],
  goals: ['Goal Mastery Approval'],
  assessments: ['Assessments', 'Assessment Review', 'Assessment Summary Report'],
  sessions: ['Session', 'Daily Notes', 'Live Sessions', 'Session Summary', 'Trial Logging Format'],
  behavior_incidents: ['ABC Log', 'ABC Dropdown Lists'],
  parent_portal: ['Parent Communication', 'Progress', 'Observations'],
  students: ['Registered Student', 'Enrollment Wizard'],
  reports: ['Reports & Oversight', 'Report Builder'],
  staff: [
    'Staff Scheduling',
    'Staff Management & Linking',
    'Room Resource Scheduling',
    'Schedule & Capacity',
  ],
  admin: [
    'Staff Accounts',
    'Role Management',
    'Permission Configuration',
    'Audit Log',
    'Form Builder',
  ],
};

export const TAB_ALIASES_TO_MODULE: Record<string, string> = {
  // Students
  'Student Register': 'students',
  'Registered Student': 'students',
  'Registered Students': 'students',
  'Student Registration': 'students',
  'Student Enrollment Wizard': 'students',
  'Enrollment Wizard': 'students',
  Enrollment: 'students',
  Students: 'students',

  // Clinical Verification
  'Goal Mastery Approval': 'goals',
  Approvals: 'goals',

  // Assessments
  Assessments: 'assessments',
  'Assessment Dashboard': 'assessments',
  'Assessment Review': 'assessments',
  'Assessment Summary Report': 'assessments',

  // Sessions
  Session: 'sessions',
  'Active Therapy': 'sessions',
  'Daily Notes': 'sessions',
  'Live Sessions': 'sessions',
  'Session Summary': 'sessions',
  'Session Summary Review': 'sessions',
  'Trial Logging Format': 'sessions',

  // IUPs & Goal Management
  'IUP Creation & Goal Assignment': 'iups',
  'IUP Library Management': 'iups',
  'Student Caseload Management': 'iups',
  'Clinical Quality Monitoring': 'iups',
  Goals: 'iups',
  'Goal Domains': 'iups',
  Caseload: 'iups',
  IUPs: 'iups',
  IUP: 'iups',
  Library: 'iups',
  'Clinical Quality': 'iups',
  Quality: 'iups',

  // Staff & Operations
  'Room Resource Scheduling': 'staff',
  'Staff Scheduling': 'staff',
  'Operational Management': 'staff',
  'Staff Management & Linking': 'staff',
  'Schedule & Capacity': 'staff',
  Workload: 'staff',
  Scheduling: 'staff',

  // Reports
  'Reports & Oversight': 'reports',
  'Report & Oversight': 'reports',
  Reports: 'reports',
  'Report Builder': 'reports',
  Charts: 'reports',

  // Admin
  'Staff Accounts': 'admin',
  'Staff account management': 'admin',
  'Staff Management': 'admin',
  Staff: 'admin',
  'Role Management': 'admin',
  'Permission Configuration': 'admin',
  'Audit Log': 'admin',
  'Form Builder': 'admin',

  // Parent
  Parents: 'parent_portal',
  Messages: 'parent_portal',
  'Parent Communication': 'parent_portal',
  Progress: 'parent_portal',
  Observations: 'parent_portal',
};

export const MODULE_DEFAULT_ROUTES: Record<string, string> = {
  admin: 'StaffAccountManagement',
  staff: 'DirectorScheduling',
  assessments: 'AssessmentDashboard',
  sessions: 'SessionDataCollection',
  behavior_incidents: 'AbcLog',
  iups: 'IupGeneration',
  goals: 'GoalMasteryApproval',
  students: 'StudentEnrollmentWizard',
  reports: 'ReportsOversight',
  parent_portal: 'ParentCommunication',
};

/**
 * Returns dynamic tabs for the current session based on configured modules.
 * Strictly derives visible links from active permissions (session.modules / session.permissions).
 * Preserves Dashboard, filters out ungranted modules, and dynamically injects newly granted modules.
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

  // If no modules or permissions are available, fall back to defaultRoleTabs
  if (grantedModules.size === 0) {
    return defaultRoleTabs;
  }

  // System admin retains all admin tabs + default tabs
  if (session.role === 'system_admin') {
    return defaultRoleTabs && defaultRoleTabs.length > 0 ? defaultRoleTabs : ROLE_TABS.system_admin;
  }

  // Custom role or empty defaultRoleTabs: build tabs from all granted modules
  if (!defaultRoleTabs || defaultRoleTabs.length === 0) {
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
    return customTabs;
  }

  // Start with filtered defaultRoleTabs (preserving Dashboard and tabs for granted modules)
  const tabs: string[] = [];
  for (const tab of defaultRoleTabs) {
    if (tab === 'Dashboard') {
      tabs.push(tab);
      continue;
    }
    let moduleId = Object.entries(MODULE_TO_TABS).find(([_, tList]) => tList.includes(tab))?.[0];
    if (!moduleId) {
      moduleId = TAB_ALIASES_TO_MODULE[tab];
    }
    if (!moduleId) {
      // Tab not tied to a specific module, keep if dashboard/utility
      tabs.push(tab);
    } else {
      if (grantedModules.has(moduleId.toLowerCase())) {
        tabs.push(tab);
      }
    }
  }

  // Dynamically inject primary tab for any granted module not yet present in tabs
  for (const [moduleId, moduleTabs] of Object.entries(MODULE_TO_TABS)) {
    if (grantedModules.has(moduleId.toLowerCase())) {
      const alreadyHasTabForModule = moduleTabs.some((t) => tabs.includes(t));
      if (!alreadyHasTabForModule && moduleTabs.length > 0) {
        tabs.push(moduleTabs[0]);
      }
    }
  }

  return tabs.length > 0 ? tabs : defaultRoleTabs;
}

export const ROLE_TABS: Record<Role, string[]> = {
  teacher: ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Parents'],
  therapist: ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Parents'],
  coordinator: [
    'Dashboard',
    'Live Sessions',
    'Session Summary',
    'Registered Student',
    'Enrollment Wizard',
    'Staff Management & Linking',
    'Room Resource Scheduling',
    'IUP Creation & Goal Assignment',
    'Parent Communication',
  ],
  director: [
    'Dashboard',
    'Staff Scheduling',
    'Goal Mastery Approval',
    'Parent Communication',
    'Reports & Oversight',
    'Report Builder',
  ],
  program_director: [
    'Dashboard',
    'Registered Student',
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
    'Goals',
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
      items: ['Registered Student', 'Enrollment Wizard', 'IUP Creation & Goal Assignment'],
    },
    {
      label: 'Operations',
      items: ['Staff Management & Linking', 'Room Resource Scheduling'],
    },
    'Parent Communication',
  ],
  program_director: [
    'Dashboard',
    {
      label: 'Students',
      items: ['Registered Student', 'Enrollment Wizard'],
    },
    {
      label: 'Assessments',
      items: ['Assessment Review', 'Assessment Summary Report'],
    },
    {
      label: 'IUPs',
      items: [
        'IUP Creation & Goal Assignment',
        'IUP Library Management',
        'Student Caseload Management',
        'Clinical Quality Monitoring',
      ],
    },
    'Goal Mastery Approval',
    'Parent Communication',
    'Reports',
  ],
};

export function getGroupedTabsForSession(
  session: AuthSession | null | undefined,
  role: Role,
  defaultTabs: string[],
): NavTabItem[] {
  const dynamicTabs = getTabsForSession(session, defaultTabs);
  const grouped = ROLE_GROUPED_TABS[role];

  if (!grouped) {
    return dynamicTabs;
  }

  // If session has no modules and no permissions, return raw grouped definition
  if (!session || (!session.modules && !session.permissions)) {
    return grouped;
  }

  const grantedTabSet = new Set(dynamicTabs);
  const filteredGrouped: NavTabItem[] = [];
  const includedTabs = new Set<string>();

  for (const item of grouped) {
    if (typeof item === 'string') {
      if (item === 'Dashboard' || grantedTabSet.has(item)) {
        filteredGrouped.push(item);
        includedTabs.add(item);
      }
    } else if (isNavGroup(item)) {
      const filteredItems = item.items.filter((subTab) => grantedTabSet.has(subTab));
      if (filteredItems.length > 0) {
        filteredGrouped.push({
          label: item.label,
          items: filteredItems,
        });
        filteredItems.forEach((t) => includedTabs.add(t));
      }
    }
  }

  // Append any newly granted dynamic tabs that were not in the default grouped definition
  for (const tab of dynamicTabs) {
    if (!includedTabs.has(tab) && tab !== 'Dashboard') {
      filteredGrouped.push(tab);
    }
  }

  return filteredGrouped.length > 0 ? filteredGrouped : dynamicTabs;
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
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Student Profile': 'StudentProfile',
  'Reports & Oversight': 'ReportsOversight',
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
  'Report Builder': 'ReportBuilder',
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
  Goals: 'GoalDomainDefinitions',
  'Goal Domains': 'GoalDomainDefinitions',
  'Task Analysis Templates': 'TaskAnalysisTemplates',
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
  'Task Analysis': 'TaskAnalysisTemplates',
};

export const PD_ROUTE_BY_TAB: Record<string, keyof ProgramDirectorStackParamList> = {
  // Canonical tabs
  Dashboard: 'ProgramDirectorDashboard',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Assessment Review': 'AssessmentReview',
  'Assessment Dashboard': 'AssessmentDashboard',
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
  Students: 'StudentEnrollment',
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
  'Session Summary Review': 'SessionSummaryReview',
  'Student Progress': 'CoordinatorStudentProgress',
  'Operational Management': 'CoordinatorSchedule',
  'Room Resource Scheduling': 'RoomResourceScheduling',
  'Parent Communication': 'CoordinatorParentCommunication',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'registred student': 'StudentEnrollment',
  'Registred Student': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
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
  'Staff account management': 'StaffAccountManagement',
  'Staff Management': 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  'Permission Configuration': 'PermissionConfiguration',
  'Audit Log': 'AuditLog',
  'Form Builder': 'FormBuilder',
  Goals: 'GoalDomainDefinitions',
  'Goal Domains': 'GoalDomainDefinitions',
  'Task Analysis Templates': 'TaskAnalysisTemplates',
  'Task Analysis': 'TaskAnalysisTemplates',
  'Schedule & Capacity': 'ScheduleCapacityConfig',
  'ABC Dropdown Lists': 'AbcDropdownLists',
  'Trial Logging Format': 'TrialLoggingFormat',
  'Staff Scheduling': 'DirectorScheduling',
  'Operational Management': 'CoordinatorSchedule',
  'Staff Management & Linking': 'WorkloadDashboard',
  'Room Resource Scheduling': 'RoomResourceScheduling',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Reports & Oversight': 'ReportsOversight',
  'Report & Oversight': 'ReportsOversight',
  Reports: 'ReportsOversight',
  'Report Builder': 'ReportBuilder',
  'Clinical Progress Charts': 'GraphChartView',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Student Caseload Management': 'StudentCaseload',
  'Student Profile': 'StudentProfile',
  'Student Progress': 'CoordinatorStudentProgress',
  'Live Sessions': 'LiveSessionMonitoring',
  'Session Summary': 'SessionSummaryReview',
  'Session Summary Review': 'SessionSummaryReview',
  'ABC Log': 'AbcLog',
  Session: 'SessionDataCollection',
  'Active Therapy': 'SessionDataCollection',
  'Daily Notes': 'DailyNotes',
  Assessments: 'AssessmentDashboard',
  'Assessment Dashboard': 'AssessmentDashboard',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Assessment Review': 'AssessmentReview',
  'IUP Library Management': 'IupLibrary',
  'Clinical Quality Monitoring': 'GoalBankManagement',
  Parents: 'ParentCommunication',
  'Parent Communication': 'ParentCommunication',
  Messages: 'ParentCommunication',
  Progress: 'ChildProgress',
  Observations: 'HomeObservationLog',
  Notifications: 'Notifications',
};

export function routeMapForRole(role: Role): Record<string, string> {
  const specificMap: Record<string, string> = (() => {
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
        return {};
    }
  })();

  return { ...GLOBAL_ROUTE_BY_TAB, ...specificMap };
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
