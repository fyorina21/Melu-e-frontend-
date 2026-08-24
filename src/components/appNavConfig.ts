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
  ParentStackParamList,
  DirectorStackParamList,
  SystemAdminStackParamList,
  InstitutionalAdminStackParamList,
  ProgramDirectorStackParamList,
  CoordinatorStackParamList,
} from '../types';

export const ROLE_TABS: Record<Role, string[]> = {
  teacher: ['Dashboard', 'Assessments', 'Daily Notes', 'ABC Log', 'Parents'],
  coordinator: [
    'Dashboard',
    'Live Sessions',
    'Session Summary',
    'Student Progress',
    'Operational Management',
    'Parent Communication',
    'Student Registration',
    'Staff Management & Linking',
    'IUP Creation & Goal Assignment',
  ],
  director: ['Dashboard', 'Staff Scheduling', 'Goal Mastery Approval', 'Parent Communication', 'Report & Oversight', 'Student Progress'],
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
  institutional_admin: ['Dashboard', 'Task Analysis', 'Goal Domains', 'Schedule & Capacity', 'ABC Dropdown Lists', 'Trial Logging Format', 'Form Builder'],
  system_admin: ['Dashboard', 'Staff account management', 'Role Management', 'Permission Configuration'],
  parent: ['Dashboard', 'Progress', 'Observations', 'Messages'],
};

export const ROLE_LABELS: Record<Role, string> = {
  teacher: 'Teacher',
  coordinator: 'Therapy Coordinator',
  director: 'Director',
  program_director: 'Program Director',
  institutional_admin: 'Institutional Admin',
  system_admin: 'System Admin',
  parent: 'Parent',
};

export const ROLE_NOTIFICATION_ROUTE: Record<Role, string | undefined> = {
  teacher: 'Notifications',
  coordinator: 'Notifications',
  director: undefined,
  program_director: undefined,
  institutional_admin: undefined,
  system_admin: undefined,
  parent: 'Notifications',
};

// ---- Tab → route maps (used by AppNavbar and screens for navigation) ----

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
  'Report & Oversight': 'ReportsOversight',
  'Student Progress': 'DirectorStudentProgress',
  // Legacy aliases (existing screens / internal links)
  Scheduling: 'DirectorScheduling',
  Approvals: 'GoalMasteryApproval',
  Parents: 'DirectorParentCommunication',
  Reports: 'ReportsOversight',
  Progress: 'DirectorStudentProgress',
  Builder: 'ReportBuilder',
};

export const SYS_ROUTE_BY_TAB: Record<string, keyof SystemAdminStackParamList> = {
  Dashboard: 'AdminPanelOverview',
  'Admin Panel': 'StaffAccountManagement',
  'Staff account management': 'StaffAccountManagement',
  'Role Management': 'RoleManagement',
  'Permission Configuration': 'PermissionConfiguration',
  'Audit Log': 'AuditLog',
};

export const IA_ROUTE_BY_TAB: Record<string, keyof InstitutionalAdminStackParamList> = {
  // Canonical tabs
  Dashboard: 'AdminPanelOverview',
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
  Programs: 'ClinicalCategoriesConfig',
  'Clinic Info': 'ClinicInfoConfig',
  'Working Hours': 'WorkingHoursConfig',
  Schools: 'SchoolSettingsConfig',
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
  'Students Registration': 'StudentEnrollmentWizard',
  Charts: 'GraphChartView',
  Progress: 'GraphChartView',
  Parents: 'PdParentCommunication',
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
  'Student Registration': 'StudentEnrollment',
  'Staff Management & Linking': 'WorkloadDashboard',
  'IUP Creation & Goal Assignment': 'IupGeneration',
  // Legacy aliases (existing screens / internal links)
  Student: 'StudentProfile',
  Live: 'LiveSessionMonitoring',
  Review: 'SessionSummaryReview',
  Progress: 'CoordinatorStudentProgress',
  Schedule: 'CoordinatorSchedule',
  Operational: 'CoordinatorSchedule',
  Parents: 'CoordinatorParentCommunication',
  Enrollment: 'StudentEnrollment',
  Registration: 'StudentEnrollment',
  Workload: 'WorkloadDashboard',
  Staff: 'WorkloadDashboard',
  Rooms: 'RoomResourceScheduling',
  Notifications: 'Notifications',
};

export function routeMapForRole(role: Role): Record<string, string> | undefined {
  switch (role) {
    case 'coordinator': return COORDINATOR_ROUTE_BY_TAB;
    case 'program_director': return PD_ROUTE_BY_TAB;
    case 'director': return DIRECTOR_ROUTE_BY_TAB;
    case 'institutional_admin': return IA_ROUTE_BY_TAB;
    case 'system_admin': return SYS_ROUTE_BY_TAB;
    case 'parent': return PARENT_ROUTE_BY_TAB;
    default: return undefined;
  }
}
