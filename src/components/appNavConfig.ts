// Central config for the unified app navbar: which tabs each role sees,
// the display label for each role, which roles have a notifications screen
// (so the bell only appears where it can navigate somewhere), and the
// tab → route maps previously scattered across the per-role nav components.
import type {
  Role,
  ParentStackParamList,
  DirectorStackParamList,
  SystemAdminStackParamList,
  InstitutionalAdminStackParamList,
  ProgramDirectorStackParamList,
} from '../types';

export const ROLE_TABS: Record<Role, string[]> = {
  teacher: ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Scheduling', 'Attendance', 'Notifications', 'Parents'],
  coordinator: ['Dashboard', 'Live Sessions', 'Review', 'Progress', 'Schedule', 'Parents', 'Enrollment', 'Workload', 'Rooms', 'Notifications'],
  director: ['Dashboard', 'Scheduling', 'Approvals', 'Parents', 'Reports', 'Progress', 'Builder'],
  program_director: ['Dashboard', 'Assessments', 'IUP', 'Library', 'Caseload', 'Goal Bank', 'Approvals', 'Enrollment', 'Charts', 'Parents'],
  institutional_admin: ['Admin Panel', 'Forms', 'Trial Logging', 'ABC Lists', 'Schedule', 'Goal Domains', 'Task Analysis', 'Programs', 'Clinic Info', 'Working Hours', 'Schools'],
  system_admin: ['Admin Panel', 'Staff Accounts', 'Roles', 'Permissions', 'Audit Log'],
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

// ---- Tab → route maps (used by screens for tab navigation) ----

export const PARENT_ROUTE_BY_TAB: Record<string, keyof ParentStackParamList> = {
  Dashboard: 'ParentDashboard',
  Progress: 'ChildProgress',
  Observations: 'HomeObservationLog',
  Messages: 'ParentCommunication',
  Notifications: 'Notifications',
};

export const DIRECTOR_ROUTE_BY_TAB: Record<string, keyof DirectorStackParamList> = {
  Dashboard: 'DirectorDashboard',
  Scheduling: 'DirectorScheduling',
  Approvals: 'GoalMasteryApproval',
  Parents: 'DirectorParentCommunication',
  Reports: 'ReportsOversight',
  Progress: 'DirectorStudentProgress',
  Builder: 'ReportBuilder',
};

export const SYS_ROUTE_BY_TAB: Record<string, keyof SystemAdminStackParamList> = {
  'Admin Panel': 'AdminPanelOverview',
  'Staff Accounts': 'StaffAccountManagement',
  Roles: 'RoleManagement',
  Permissions: 'PermissionConfiguration',
  'Audit Log': 'AuditLog',
};

export const IA_ROUTE_BY_TAB: Record<string, keyof InstitutionalAdminStackParamList> = {
  'Admin Panel': 'AdminPanelOverview',
  Forms: 'FormBuilder',
  'Trial Logging': 'TrialLoggingFormat',
  'ABC Lists': 'AbcDropdownLists',
  Schedule: 'ScheduleCapacityConfig',
  'Goal Domains': 'GoalDomainDefinitions',
  'Task Analysis': 'TaskAnalysisTemplates',
  Programs: 'ClinicalCategoriesConfig',
  'Clinic Info': 'ClinicInfoConfig',
  'Working Hours': 'WorkingHoursConfig',
  Schools: 'SchoolSettingsConfig',
};

export const PD_ROUTE_BY_TAB: Record<string, keyof ProgramDirectorStackParamList> = {
  Dashboard: 'ProgramDirectorDashboard',
  Assessments: 'AssessmentReview',
  IUP: 'IupGeneration',
  Library: 'IupLibrary',
  Caseload: 'StudentCaseload',
  'Goal Bank': 'GoalBankManagement',
  Approvals: 'GoalMasteryApproval',
  Enrollment: 'StudentEnrollmentWizard',
  Charts: 'GraphChartView',
  Parents: 'PdParentCommunication',
};