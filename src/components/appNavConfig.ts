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
    'Goal Bank',
    'Goal Bank / Domains',
    // legacy alias
    'Clinical Quality Monitoring',
  ],
  goals: ['Goal Mastery Approval'],
  assessments: [
    'Assessment Dashboard',
    'Assessment Review & Sign-Off',
    'Assessment Summary Report',
    // legacy aliases
    'Assessments',
    'Assessment Review',
  ],
  sessions: [
    'Session Data Collection',
    'Daily Session Notes',
    'Live Session Monitoring',
    'Session Summary Review',
    'Trial Logging Format Config',
    // legacy aliases
    'Session',
    'Daily Notes',
    'Live Sessions',
    'Session Summary',
    'Trial Logging Format',
  ],
  behavior_incidents: [
    'ABC Behavior Incident Log',
    'ABC Dropdown Lists',
    // legacy alias
    'ABC Log',
  ],
  parent_portal: [
    'Parent Communication',
    'Child Progress Tracker',
    'Home Observation Log',
    'Parent Communication (Messages)',
    // legacy aliases
    'Progress',
    'Observations',
    'Messages',
  ],
  students: [
    'Student Enrollment Wizard',
    'Student Register & Roster List',
    // legacy aliases
    'Registered Student',
    'Enrollment Wizard',
    'Student Register',
  ],
  reports: [
    'Reports & Executive Oversight',
    'Custom Report Builder',
    // legacy aliases
    'Reports & Oversight',
    'Report Builder',
    'Reports',
  ],
  staff: [
    'Staff Scheduling & Capacity',
    'Staff Workload & Therapist Linking',
    'Room Resource Scheduling',
    'Schedule & Capacity Configuration',
    'Staff Account Management',
    // legacy aliases
    'Staff Scheduling',
    'Staff Management & Linking',
    'Schedule & Capacity',
    'Staff Accounts',
  ],
  admin: [
    'Staff Account Management',
    'Role Management',
    'Permission Configuration (RBAC)',
    'System Audit Log',
    'Form Builder',
    // legacy aliases
    'Staff Accounts',
    'Permission Configuration',
    'Audit Log',
  ],
};

export const TAB_ALIASES_TO_MODULE: Record<string, string> = {
  // Students
  'Student Register & Roster List': 'students',
  'Student Register': 'students',
  'Registered Student': 'students',
  'Registered Students': 'students',
  'Student Registration': 'students',
  'Student Enrollment Wizard': 'students',
  'Enrollment Wizard': 'students',
  Enrollment: 'students',
  Students: 'students',

  // Clinical Verification & Goals
  'Goal Mastery Approval': 'goals',
  Approvals: 'goals',

  // Assessments
  'Assessment Dashboard': 'assessments',
  'Assessment Review & Sign-Off': 'assessments',
  'Assessment Review': 'assessments',
  'Assessment Summary Report': 'assessments',
  Assessments: 'assessments',

  // Sessions
  'Session Data Collection': 'sessions',
  'Daily Session Notes': 'sessions',
  'Live Session Monitoring': 'sessions',
  'Session Summary Review': 'sessions',
  'Trial Logging Format Config': 'sessions',
  Session: 'sessions',
  'Active Therapy': 'sessions',
  'Daily Notes': 'sessions',
  'Live Sessions': 'sessions',
  'Session Summary': 'sessions',
  'Trial Logging Format': 'sessions',

  // Behavior Incidents
  'ABC Behavior Incident Log': 'behavior_incidents',
  'ABC Dropdown Lists': 'behavior_incidents',
  'ABC Log': 'behavior_incidents',

  // IUPs & Goal Management
  'IUP Creation & Goal Assignment': 'iups',
  'IUP Library Management': 'iups',
  'Student Caseload Management': 'iups',
  'Goal Bank': 'iups',
  'Goal Bank / Domains': 'iups',
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
  'Staff Scheduling & Capacity': 'staff',
  'Staff Workload & Therapist Linking': 'staff',
  'Room Resource Scheduling': 'staff',
  'Schedule & Capacity Configuration': 'staff',
  'Staff Scheduling': 'staff',
  'Operational Management': 'staff',
  'Staff Management & Linking': 'staff',
  'Schedule & Capacity': 'staff',
  Workload: 'staff',
  Scheduling: 'staff',

  // Reports & Oversight
  'Reports & Executive Oversight': 'reports',
  'Custom Report Builder': 'reports',
  'Reports & Oversight': 'reports',
  'Report & Oversight': 'reports',
  Reports: 'reports',
  'Report Builder': 'reports',
  Charts: 'reports',

  // Admin & Governance
  'Staff Account Management': 'admin',
  'Staff Accounts': 'admin',
  'Staff account management': 'admin',
  'Staff Management': 'admin',
  Staff: 'admin',
  'Role Management': 'admin',
  'Permission Configuration (RBAC)': 'admin',
  'Permission Configuration': 'admin',
  'System Audit Log': 'admin',
  'Audit Log': 'admin',
  'Form Builder': 'admin',

  // Family Engagement & Parent Portal
  'Parent Communication': 'parent_portal',
  'Parent Communication (Messages)': 'parent_portal',
  'Child Progress Tracker': 'parent_portal',
  'Home Observation Log': 'parent_portal',
  Parents: 'parent_portal',
  Messages: 'parent_portal',
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
  teacher: [
    'Dashboard',
    'Session Data Collection',
    'Assessment Dashboard',
    'ABC Behavior Incident Log',
    'Daily Session Notes',
    'Parent Communication',
  ],
  therapist: [
    'Dashboard',
    'Session Data Collection',
    'Assessment Dashboard',
    'ABC Behavior Incident Log',
    'Daily Session Notes',
    'Parent Communication',
  ],
  coordinator: [
    'Dashboard',
    'Live Session Monitoring',
    'Session Summary Review',
    'Student Register & Roster List',
    'Student Enrollment Wizard',
    'Staff Workload & Therapist Linking',
    'Room Resource Scheduling',
    'Parent Communication',
  ],
  director: [
    'Dashboard',
    'Staff Scheduling & Capacity',
    'Goal Mastery Approval',
    'Parent Communication',
    'Reports & Executive Oversight',
    'Custom Report Builder',
  ],
  program_director: [
    'Dashboard',
    'Student Enrollment Wizard',
    'Student Register & Roster List',
    'IUP Creation & Goal Assignment',
    'IUP Library Management',
    'Assessment Review & Sign-Off',
    'Assessment Summary Report',
    'Student Caseload Management',
    'Goal Bank',
    'Reports & Executive Oversight',
  ],
  institutional_admin: [
    'Schedule & Capacity Configuration',
    'Form Builder',
    'ABC Dropdown Lists',
    'Trial Logging Format Config',
    'Goal Bank / Domains',
  ],
  system_admin: [
    'Staff Account Management',
    'Role Management',
    'Permission Configuration (RBAC)',
    'System Audit Log',
  ],
  parent: [
    'Dashboard',
    'Child Progress Tracker',
    'Home Observation Log',
    'Parent Communication (Messages)',
  ],
};

export interface NavGroupTab {
  label: string;
  items: string[];
}

export type NavTabItem = string | NavGroupTab;

export const isNavGroup = (tab: NavTabItem): tab is NavGroupTab => {
  return typeof tab !== 'string' && Boolean(tab) && Array.isArray(tab.items);
};

export const ROLE_GROUPED_TABS: Partial<Record<Role, NavTabItem[]>> = {
  coordinator: [
    'Dashboard',
    {
      label: 'Sessions',
      items: ['Live Session Monitoring', 'Session Summary Review'],
    },
    {
      label: 'Students',
      items: ['Student Register & Roster List', 'Student Enrollment Wizard'],
    },
    {
      label: 'Operations',
      items: ['Staff Workload & Therapist Linking', 'Room Resource Scheduling'],
    },
    'Parent Communication',
  ],
  program_director: [
    'Dashboard',
    {
      label: 'Students',
      items: ['Student Register & Roster List', 'Student Enrollment Wizard'],
    },
    {
      label: 'Assessments',
      items: ['Assessment Review & Sign-Off', 'Assessment Summary Report'],
    },
    {
      label: 'IUPs',
      items: [
        'IUP Creation & Goal Assignment',
        'IUP Library Management',
        'Student Caseload Management',
        'Goal Bank',
      ],
    },
    'Goal Mastery Approval',
    'Parent Communication',
    'Reports & Executive Oversight',
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

// =========================================================================
// Sidebar Navigation Architecture (Grouped by SRS Module Categories)
// =========================================================================

export interface SidebarNavItem {
  label: string;
  route: string;
  module: string;
  aliases?: string[];
}

export interface SidebarSection {
  title: string;
  category: string;
  items: SidebarNavItem[];
}

export const SIDEBAR_MODULE_CATEGORIES: SidebarSection[] = [
  {
    category: 'Student Intake & Enrollment',
    title: 'Student Intake & Enrollment',
    items: [
      {
        label: 'Student Enrollment Wizard',
        route: 'StudentEnrollmentWizard',
        module: 'students',
        aliases: ['Enrollment Wizard', 'Student Enrollment'],
      },
      {
        label: 'Student Register & Roster List',
        route: 'StudentEnrollment',
        module: 'students',
        aliases: [
          'Student Register',
          'Registered Student',
          'Registered Students',
          'Student Registration',
        ],
      },
    ],
  },
  {
    category: 'Assessments',
    title: 'Assessments',
    items: [
      {
        label: 'Assessment Dashboard',
        route: 'AssessmentDashboard',
        module: 'assessments',
        aliases: ['Assessments'],
      },
      {
        label: 'Assessment Review & Sign-Off',
        route: 'AssessmentReview',
        module: 'assessments',
        aliases: ['Assessment Review', 'Assessment'],
      },
      {
        label: 'Assessment Summary Report',
        route: 'AssessmentSummaryReport',
        module: 'assessments',
        aliases: ['Assessment Summary'],
      },
    ],
  },
  {
    category: 'IUP & Goals',
    title: 'IUP & Goals',
    items: [
      {
        label: 'IUP Creation & Goal Assignment',
        route: 'IupGeneration',
        module: 'iups',
        aliases: ['IUP Creation', 'IUPs', 'IUP'],
      },
      {
        label: 'IUP Library Management',
        route: 'IupLibrary',
        module: 'iups',
        aliases: ['IUP Library', 'Library'],
      },
      {
        label: 'Student Caseload Management',
        route: 'StudentCaseload',
        module: 'iups',
        aliases: ['Student Caseload', 'Caseload'],
      },
      {
        label: 'Goal Bank',
        route: 'GoalBankManagement',
        module: 'iups',
        aliases: ['Clinical Quality Monitoring', 'Clinical Quality', 'Quality'],
      },
    ],
  },
  {
    category: 'Active Therapy & Clinical Delivery',
    title: 'Active Therapy & Clinical Delivery',
    items: [
      {
        label: 'Session Data Collection',
        route: 'SessionDataCollection',
        module: 'sessions',
        aliases: ['Session', 'Active Therapy'],
      },
      {
        label: 'Daily Session Notes',
        route: 'DailyNotes',
        module: 'sessions',
        aliases: ['Daily Notes'],
      },
      {
        label: 'ABC Behavior Incident Log',
        route: 'AbcLog',
        module: 'behavior_incidents',
        aliases: ['ABC Log'],
      },
      {
        label: 'Live Session Monitoring',
        route: 'LiveSessionMonitoring',
        module: 'sessions',
        aliases: ['Live Sessions', 'Live'],
      },
      {
        label: 'Session Summary Review',
        route: 'SessionSummaryReview',
        module: 'sessions',
        aliases: ['Session Summary', 'Review'],
      },
      {
        label: 'Goal Mastery Approval',
        route: 'GoalMasteryApproval',
        module: 'goals',
        aliases: ['Approvals'],
      },
    ],
  },
  {
    category: 'Operations & Scheduling',
    title: 'Operations & Scheduling',
    items: [
      {
        label: 'Staff Scheduling & Capacity',
        route: 'DirectorScheduling',
        module: 'staff',
        aliases: ['Staff Scheduling', 'Scheduling'],
      },
      {
        label: 'Staff Workload & Therapist Linking',
        route: 'WorkloadDashboard',
        module: 'staff',
        aliases: ['Staff Management & Linking', 'Workload', 'Staff'],
      },
      {
        label: 'Room Resource Scheduling',
        route: 'RoomResourceScheduling',
        module: 'staff',
        aliases: ['Room Scheduling', 'Rooms'],
      },
    ],
  },
  {
    category: 'Family Engagement & Parent Portal',
    title: 'Family Engagement & Parent Portal',
    items: [
      {
        label: 'Child Progress Tracker',
        route: 'ChildProgress',
        module: 'parent_portal',
        aliases: ['Progress'],
      },
      {
        label: 'Home Observation Log',
        route: 'HomeObservationLog',
        module: 'parent_portal',
        aliases: ['Observations'],
      },
      {
        label: 'Parent Communication',
        route: 'ParentCommunication',
        module: 'parent_portal',
        aliases: ['Parents', 'Messages', 'Parent Communication (Messages)'],
      },
    ],
  },
  {
    category: 'Executive Oversight',
    title: 'Executive Oversight',
    items: [
      {
        label: 'Reports & Executive Oversight',
        route: 'ReportsOversight',
        module: 'reports',
        aliases: ['Reports & Oversight', 'Reports'],
      },
      {
        label: 'Custom Report Builder',
        route: 'ReportBuilder',
        module: 'reports',
        aliases: ['Report Builder', 'Builder'],
      },
    ],
  },
  {
    category: 'Institutional Administration',
    title: 'Institutional Administration',
    items: [
      {
        label: 'Schedule & Capacity Configuration',
        route: 'ScheduleCapacityConfig',
        module: 'staff',
        aliases: ['Schedule & Capacity', 'Schedule', 'Capacity'],
      },
      {
        label: 'Form Builder',
        route: 'FormBuilder',
        module: 'admin',
        aliases: ['Assessment & Form Builder', 'Forms', 'Form'],
      },
      {
        label: 'ABC Dropdown Lists',
        route: 'AbcDropdownLists',
        module: 'behavior_incidents',
        aliases: ['ABC Lists', 'ABC'],
      },
      {
        label: 'Trial Logging Format Config',
        route: 'TrialLoggingFormat',
        module: 'sessions',
        aliases: ['Trial Logging Format', 'Trial Logging'],
      },
      {
        label: 'Goal Bank / Domains',
        route: 'GoalDomainDefinitions',
        module: 'iups',
        aliases: ['Goals', 'Goal Domains', 'Goal'],
      },
    ],
  },
  {
    category: 'System Administration',
    title: 'System Administration',
    items: [
      {
        label: 'Staff Account Management',
        route: 'StaffAccountManagement',
        module: 'staff',
        aliases: ['Staff Accounts', 'Staff account management', 'Staff Management', 'Staff'],
      },
      {
        label: 'Role Management',
        route: 'RoleManagement',
        module: 'admin',
        aliases: ['Roles'],
      },
      {
        label: 'Permission Configuration (RBAC)',
        route: 'PermissionConfiguration',
        module: 'admin',
        aliases: ['Permission Configuration', 'Permissions', 'Permission'],
      },
      {
        label: 'System Audit Log',
        route: 'AuditLog',
        module: 'reports',
        aliases: ['Audit Log', 'Audit Logs', 'Audit'],
      },
    ],
  },
];

/**
 * Returns categorized sidebar sections dynamically filtered based on the active role and session permissions.
 * Sections with 0 permitted links are automatically hidden.
 */
export function getSidebarSectionsForSession(
  session: AuthSession | null | undefined,
  role: Role,
): SidebarSection[] {
  // 1. Collect granted modules from session
  const grantedModules = new Set<string>();
  if (session?.modules && Array.isArray(session.modules)) {
    for (const rawMod of session.modules) {
      if (typeof rawMod === 'string') {
        const canonical = (RESOURCE_ALIAS_MAP[rawMod.toLowerCase()] ?? rawMod).toLowerCase();
        grantedModules.add(canonical);
      }
    }
  }
  if (session?.permissions && Array.isArray(session.permissions)) {
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

  const roleTabs = ROLE_TABS[role] ?? [];
  const roleTabSet = new Set(roleTabs);
  const isSystemAdmin = role === 'system_admin' || session?.role === 'system_admin';

  const sections: SidebarSection[] = [];

  for (const cat of SIDEBAR_MODULE_CATEGORIES) {
    const visibleItems: SidebarNavItem[] = [];

    for (const item of cat.items) {
      // Check if this item or any of its aliases is part of this role's configured pages
      const belongsToRole =
        roleTabSet.has(item.label) ||
        (item.aliases && item.aliases.some((alias) => roleTabSet.has(alias)));

      if (grantedModules.size > 0) {
        const hasModule = grantedModules.has(item.module.toLowerCase());
        if (belongsToRole && hasModule) {
          visibleItems.push(item);
        } else if (roleTabs.length === 0 && hasModule) {
          visibleItems.push(item);
        }
      } else {
        // Without explicit module restrictions in session:
        if (isSystemAdmin && cat.category === 'System Administration') {
          visibleItems.push(item);
        } else if (belongsToRole) {
          visibleItems.push(item);
        }
      }
    }

    // Dynamic filtering: completely hide section if 0 visible links
    if (visibleItems.length > 0) {
      sections.push({
        title: cat.title,
        category: cat.category,
        items: visibleItems,
      });
    }
  }

  return sections;
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
  'Session Data Collection': 'SessionDataCollection',
  Session: 'SessionDataCollection',
  'Active Therapy': 'SessionDataCollection',
  'Assessment Dashboard': 'AssessmentDashboard',
  Assessments: 'AssessmentDashboard',
  'Assessment Review & Sign-Off': 'AssessmentReview',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Daily Session Notes': 'DailyNotes',
  'Daily Notes': 'DailyNotes',
  'ABC Behavior Incident Log': 'AbcLog',
  'ABC Log': 'AbcLog',
  'Parent Communication': 'ParentCommunication',
  Parents: 'ParentCommunication',
  Notifications: 'Notifications',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  IUPs: 'IupGeneration',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Register & Roster List': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Student Profile': 'StudentProfile',
  'Reports & Executive Oversight': 'ReportsOversight',
  'Reports & Oversight': 'ReportsOversight',
};

export const PARENT_ROUTE_BY_TAB: Record<string, keyof ParentStackParamList> = {
  Dashboard: 'ParentDashboard',
  'Child Progress Tracker': 'ChildProgress',
  Progress: 'ChildProgress',
  'Home Observation Log': 'HomeObservationLog',
  Observations: 'HomeObservationLog',
  'Parent Communication (Messages)': 'ParentCommunication',
  'Parent Communication': 'ParentCommunication',
  Messages: 'ParentCommunication',
  Notifications: 'Notifications',
};

export const DIRECTOR_ROUTE_BY_TAB: Record<string, keyof DirectorStackParamList> = {
  // Canonical tabs
  Dashboard: 'DirectorDashboard',
  'Staff Scheduling & Capacity': 'DirectorScheduling',
  'Staff Scheduling': 'DirectorScheduling',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Parent Communication': 'DirectorParentCommunication',
  'Reports & Executive Oversight': 'ReportsOversight',
  'Reports & Oversight': 'ReportsOversight',
  'Report & Oversight': 'ReportsOversight',
  'Custom Report Builder': 'ReportBuilder',
  'Report Builder': 'ReportBuilder',
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
  'Staff Account Management': 'StaffAccountManagement',
  'Staff Accounts': 'StaffAccountManagement',
  'Staff account management': 'StaffAccountManagement',
  'Staff Management': 'StaffAccountManagement',
  Staff: 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  Roles: 'RoleManagement',
  'Permission Configuration (RBAC)': 'PermissionConfiguration',
  'Permission Configuration': 'PermissionConfiguration',
  Permissions: 'PermissionConfiguration',
  Permission: 'PermissionConfiguration',
  'System Audit Log': 'AuditLog',
  'Audit Log': 'AuditLog',
  'Audit Logs': 'AuditLog',
  Audit: 'AuditLog',
};

export const IA_ROUTE_BY_TAB: Record<string, keyof InstitutionalAdminStackParamList> = {
  // Canonical tabs
  Dashboard: 'FormBuilder',
  'Schedule & Capacity Configuration': 'ScheduleCapacityConfig',
  'Schedule & Capacity': 'ScheduleCapacityConfig',
  'Form Builder': 'FormBuilder',
  'Assessment & Form Builder': 'FormBuilder',
  'ABC Dropdown Lists': 'AbcDropdownLists',
  'Trial Logging Format Config': 'TrialLoggingFormat',
  'Trial Logging Format': 'TrialLoggingFormat',
  'Goal Bank / Domains': 'GoalDomainDefinitions',
  'Goal Domains': 'GoalDomainDefinitions',
  Goals: 'GoalDomainDefinitions',
  'Task Analysis Templates': 'TaskAnalysisTemplates',
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
  'Student Register & Roster List': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Assessment Review & Sign-Off': 'AssessmentReview',
  'Assessment Review': 'AssessmentReview',
  'Assessment Dashboard': 'AssessmentDashboard',
  'IUP Library Management': 'IupLibrary',
  'Student Caseload Management': 'StudentCaseload',
  'Goal Bank': 'GoalBankManagement',
  'Clinical Quality Monitoring': 'GoalBankManagement',
  'Parent Communication': 'PdParentCommunication',
  'Reports & Executive Oversight': 'GraphChartView',
  Reports: 'GraphChartView',
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
  'Live Session Monitoring': 'LiveSessionMonitoring',
  'Live Sessions': 'LiveSessionMonitoring',
  'Session Summary Review': 'SessionSummaryReview',
  'Session Summary': 'SessionSummaryReview',
  'Student Progress': 'CoordinatorStudentProgress',
  'Operational Management': 'CoordinatorSchedule',
  'Room Resource Scheduling': 'RoomResourceScheduling',
  'Parent Communication': 'CoordinatorParentCommunication',
  'Student Register & Roster List': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'registred student': 'StudentEnrollment',
  'Registred Student': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  Enrollment: 'StudentEnrollment',
  'Staff Workload & Therapist Linking': 'WorkloadDashboard',
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
  'Staff Account Management': 'StaffAccountManagement',
  'Staff Accounts': 'StaffAccountManagement',
  'Staff account management': 'StaffAccountManagement',
  'Staff Management': 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  'Permission Configuration (RBAC)': 'PermissionConfiguration',
  'Permission Configuration': 'PermissionConfiguration',
  'System Audit Log': 'AuditLog',
  'Audit Log': 'AuditLog',
  'Form Builder': 'FormBuilder',
  'Assessment & Form Builder': 'FormBuilder',
  'Goal Bank / Domains': 'GoalDomainDefinitions',
  Goals: 'GoalDomainDefinitions',
  'Goal Domains': 'GoalDomainDefinitions',
  'Task Analysis Templates': 'TaskAnalysisTemplates',
  'Task Analysis': 'TaskAnalysisTemplates',
  'Schedule & Capacity Configuration': 'ScheduleCapacityConfig',
  'Schedule & Capacity': 'ScheduleCapacityConfig',
  'ABC Dropdown Lists': 'AbcDropdownLists',
  'Trial Logging Format Config': 'TrialLoggingFormat',
  'Trial Logging Format': 'TrialLoggingFormat',
  'Staff Scheduling & Capacity': 'DirectorScheduling',
  'Staff Scheduling': 'DirectorScheduling',
  'Operational Management': 'CoordinatorSchedule',
  'Staff Workload & Therapist Linking': 'WorkloadDashboard',
  'Staff Management & Linking': 'WorkloadDashboard',
  'Room Resource Scheduling': 'RoomResourceScheduling',
  'Goal Mastery Approval': 'GoalMasteryApproval',
  'Reports & Executive Oversight': 'ReportsOversight',
  'Reports & Oversight': 'ReportsOversight',
  'Report & Oversight': 'ReportsOversight',
  Reports: 'ReportsOversight',
  'Custom Report Builder': 'ReportBuilder',
  'Report Builder': 'ReportBuilder',
  'Clinical Progress Charts': 'GraphChartView',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  'Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Enrollment Wizard': 'StudentEnrollmentWizard',
  'Student Register & Roster List': 'StudentEnrollment',
  'Student Register': 'StudentEnrollment',
  'Registered Student': 'StudentEnrollment',
  'Registered Students': 'StudentEnrollment',
  'Student Registration': 'StudentEnrollment',
  'Student Caseload Management': 'StudentCaseload',
  'Student Profile': 'StudentProfile',
  'Student Progress': 'CoordinatorStudentProgress',
  'Live Session Monitoring': 'LiveSessionMonitoring',
  'Live Sessions': 'LiveSessionMonitoring',
  'Session Summary Review': 'SessionSummaryReview',
  'Session Summary': 'SessionSummaryReview',
  'ABC Behavior Incident Log': 'AbcLog',
  'ABC Log': 'AbcLog',
  'Session Data Collection': 'SessionDataCollection',
  Session: 'SessionDataCollection',
  'Active Therapy': 'SessionDataCollection',
  'Daily Session Notes': 'DailyNotes',
  'Daily Notes': 'DailyNotes',
  'Assessment Dashboard': 'AssessmentDashboard',
  Assessments: 'AssessmentDashboard',
  'Assessment Summary Report': 'AssessmentSummaryReport',
  'Assessment Review & Sign-Off': 'AssessmentReview',
  'Assessment Review': 'AssessmentReview',
  'IUP Library Management': 'IupLibrary',
  'Goal Bank': 'GoalBankManagement',
  'Clinical Quality Monitoring': 'GoalBankManagement',
  'Parent Communication': 'ParentCommunication',
  'Parent Communication (Messages)': 'ParentCommunication',
  Parents: 'ParentCommunication',
  Messages: 'ParentCommunication',
  'Child Progress Tracker': 'ChildProgress',
  Progress: 'ChildProgress',
  'Home Observation Log': 'HomeObservationLog',
  Observations: 'HomeObservationLog',
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
