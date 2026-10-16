// src/screens/systemadmin/permissionConfigHelpers.ts
//
// Production-ready helpers for Role-Based Access Control (RBAC) & Permission Configuration:
// - Granular, non-leaking mapping between page-level UI modules and backend permissions
// - Strict backend authority: server permissions as source of truth without stale cache revival
// - Least-privilege role defaults for standard and custom roles
// - Enforced permission dependencies (CREATE/EDIT/DELETE/APPROVE require VIEW; disabling VIEW cascades)
// - High-risk permission detection (restricting DELETE/APPROVE/Admin privileges)
// - Search and role-based filtering for page modules
// - Category grouping for table navigation
// - Change diff generation for review modals and audit logging

import type { Role } from '../../types';

export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as const;
export type ActionType = (typeof ACTIONS)[number];

export type PermissionMatrix = Record<string, Record<ActionType, boolean>>;

export interface AppPageModule {
  id: string;
  name: string;
  role: string;
  roleKey: Role;
  category: string;
  route: string;
  backendResource: string;
  subResource?: string;
  description: string;
}

export interface PermissionRole {
  id: string;
  name: string;
  description?: string;
  user_count?: number;
  is_system_critical?: boolean;
}

export interface AuditEntry {
  id?: string;
  date: string;
  user: string;
  resource: string;
  action: string;
  roleName: string;
  changeData?: any;
}

export interface CatalogPermission {
  id: string;
  resource: string;
  action: string;
  name?: string;
}

export const blankActions = (): Record<ActionType, boolean> => ({
  VIEW: false,
  CREATE: false,
  EDIT: false,
  DELETE: false,
  APPROVE: false,
});

// Canonical application pages organized by clinical/administrative roles
export const ALL_PAGE_MODULES: AppPageModule[] = [
  // --- DIRECTOR ---
  {
    id: 'director_dashboard',
    name: 'Director Overview Dashboard',
    role: 'Director',
    roleKey: 'director',
    category: 'Executive Oversight',
    route: 'DirectorDashboard',
    backendResource: 'reports',
    subResource: 'oversight',
    description: 'Executive clinical KPIs, facility approvals, scheduling & message escalations',
  },
  {
    id: 'director_scheduling',
    name: 'Staff Scheduling & Capacity',
    role: 'Director',
    roleKey: 'director',
    category: 'Operations & Scheduling',
    route: 'DirectorScheduling',
    backendResource: 'staff',
    subResource: 'staff_scheduling',
    description: 'Facility capacity limits, therapist schedules, and student blocks',
  },
  {
    id: 'director_goal_mastery',
    name: 'Goal Mastery Approval',
    role: 'Director',
    roleKey: 'director',
    category: 'Clinical Verification',
    route: 'GoalMasteryApproval',
    backendResource: 'iups',
    subResource: 'goals',
    description: 'Multi-therapist goal mastery verification and executive approval sign-off',
  },
  {
    id: 'director_parent_comm',
    name: 'Parent Communication Hub',
    role: 'Director',
    roleKey: 'director',
    category: 'Family & Messages',
    route: 'DirectorParentCommunication',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description: 'Executive parent messaging hub and escalated family incident resolution',
  },
  {
    id: 'director_reports_oversight',
    name: 'Reports & Executive Oversight',
    role: 'Director',
    roleKey: 'director',
    category: 'Executive Oversight',
    route: 'ReportsOversight',
    backendResource: 'reports',
    subResource: 'oversight',
    description: 'Clinical reports oversight, bi-annual reviews, and session record exports',
  },
  {
    id: 'director_student_progress',
    name: 'Student Progress Monitoring',
    role: 'Director',
    roleKey: 'director',
    category: 'Clinical Supervision',
    route: 'DirectorStudentProgress',
    backendResource: 'students',
    description: 'Clinical oversight of goals, sessions, assessments & behavior trends',
  },
  {
    id: 'director_report_builder',
    name: 'Custom Report Builder',
    role: 'Director',
    roleKey: 'director',
    category: 'Executive Oversight',
    route: 'ReportBuilder',
    backendResource: 'reports',
    description: 'Custom report generation, multi-metric filtering, and PDF generation',
  },

  // --- PROGRAM DIRECTOR ---
  {
    id: 'pd_dashboard',
    name: 'Program Director Dashboard',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Executive Oversight',
    route: 'ProgramDirectorDashboard',
    backendResource: 'reports',
    subResource: 'oversight',
    description: 'Program operations metrics, student intake pipelines, and milestones',
  },
  {
    id: 'pd_enrollment_wizard',
    name: 'Student Enrollment Wizard',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Intake & Registration',
    route: 'StudentEnrollmentWizard',
    backendResource: 'students',
    subResource: 'enrollments',
    description: 'Multi-step student onboarding questionnaire and clinical profile wizard',
  },
  {
    id: 'pd_iup_generation',
    name: 'IUP Creation & Goal Assignment',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Goal Management',
    route: 'IupGeneration',
    backendResource: 'iups',
    description: 'Generate individualized IUPs, assign baseline criteria and SMART goals',
  },
  {
    id: 'pd_assessment_summary',
    name: 'Assessment Summary Report',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Assessments',
    route: 'AssessmentSummaryReport',
    backendResource: 'assessments',
    description: 'Comprehensive 6-week assessment report review and export generation',
  },
  {
    id: 'pd_goal_mastery',
    name: 'Goal Mastery Approval',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Clinical Verification',
    route: 'GoalMasteryApproval',
    backendResource: 'iups',
    subResource: 'goals',
    description: 'Multi-therapist clinical verification and sign-off on goal completion',
  },
  {
    id: 'pd_assessment_review',
    name: 'Assessment Review & Sign-Off',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Assessments',
    route: 'AssessmentReview',
    backendResource: 'assessments',
    description: 'Review and verify teacher assessment submissions and preferences',
  },
  {
    id: 'pd_iup_library',
    name: 'IUP Library Management',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Goal Management',
    route: 'IupLibrary',
    backendResource: 'iups',
    description: 'Curriculum repository, standardized goal banks, and template library',
  },
  {
    id: 'pd_student_caseload',
    name: 'Student Caseload Management',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Operations & Scheduling',
    route: 'StudentCaseload',
    backendResource: 'students',
    description: 'Caseload allocation, therapist capacity, and tier readiness queue',
  },
  {
    id: 'pd_clinical_quality',
    name: 'Clinical Quality & Goal Bank',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Clinical Supervision',
    route: 'GoalBankManagement',
    backendResource: 'iups',
    subResource: 'goals',
    description: 'Clinical quality monitoring, program integrity, and goal bank catalog',
  },
  {
    id: 'pd_parent_comm',
    name: 'Program Director Parent Chat',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Family & Messages',
    route: 'PdParentCommunication',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description: 'Clinical director communication channel for parent updates and notes',
  },
  {
    id: 'pd_progress_charts',
    name: 'Clinical Reports & Progress Charts',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Executive Oversight',
    route: 'GraphChartView',
    backendResource: 'reports',
    description: 'Longitudinal skill acquisition curves, trials distribution, and progress charts',
  },

  // --- COORDINATOR ---
  {
    id: 'coord_dashboard',
    name: 'Coordinator Overview Dashboard',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations & Scheduling',
    route: 'CoordinatorDashboard',
    backendResource: 'reports',
    description: 'Therapy center overview, live room status, and pending approvals queue',
  },
  {
    id: 'coord_student_profile',
    name: 'Student Profile & Clinical Chart',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Clinical Supervision',
    route: 'StudentProfile',
    backendResource: 'students',
    description: 'Detailed student clinical profile, medical records, and behavior history',
  },
  {
    id: 'coord_live_sessions',
    name: 'Live Session Monitoring',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Therapy & Daily Clinical',
    route: 'LiveSessionMonitoring',
    backendResource: 'sessions',
    description: 'Real-time observation of active therapy rooms and therapist trial logs',
  },
  {
    id: 'coord_session_summary',
    name: 'Session Summary Review',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Therapy & Daily Clinical',
    route: 'SessionSummaryReview',
    backendResource: 'sessions',
    subResource: 'session_summaries',
    description: 'Review, approve, or request revision on therapist daily session notes',
  },
  {
    id: 'coord_student_progress',
    name: 'Coordinator Student Progress',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Clinical Supervision',
    route: 'CoordinatorStudentProgress',
    backendResource: 'students',
    description: 'Clinical goal tracking, trend charts, and incident pattern analysis',
  },
  {
    id: 'coord_schedule',
    name: 'Operational Schedule & Appointments',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations & Scheduling',
    route: 'CoordinatorSchedule',
    backendResource: 'staff',
    subResource: 'staff_scheduling',
    description: 'Session scheduling, station rotations, and therapist coverage grid',
  },
  {
    id: 'coord_parent_comm',
    name: 'Coordinator Parent Messages',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Family & Messages',
    route: 'CoordinatorParentCommunication',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description: 'Parent communication hub, escalated threads, and family observations',
  },
  {
    id: 'coord_student_registration',
    name: 'Student Intake & Registration',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Intake & Registration',
    route: 'StudentEnrollment',
    backendResource: 'students',
    subResource: 'enrollments',
    description: 'Student registration records, baseline evaluation intake, and documents',
  },
  {
    id: 'coord_staff_workload',
    name: 'Staff Workload & Therapist Linking',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations & Scheduling',
    route: 'WorkloadDashboard',
    backendResource: 'staff',
    description: 'Therapist case assignments, student pairing, and workload distribution',
  },
  {
    id: 'coord_room_scheduling',
    name: 'Room Resource Scheduling',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations & Scheduling',
    route: 'RoomResourceScheduling',
    backendResource: 'staff',
    subResource: 'session_block_definitions',
    description: 'Facility therapy rooms, sensory stations, and space availability',
  },
  {
    id: 'coord_iup_generation',
    name: 'IUP Creation & Objectives',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Goal Management',
    route: 'IupGeneration',
    backendResource: 'iups',
    description: 'Assist in drafting individualized education plans and target assignments',
  },

  // --- TEACHER / THERAPIST ---
  {
    id: 'teacher_dashboard',
    name: 'Teacher Dashboard',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Therapy & Daily Clinical',
    route: 'TeacherDashboard',
    backendResource: 'sessions',
    description: 'Daily therapist view: assigned students, scheduled sessions, and tasks',
  },
  {
    id: 'teacher_session_collection',
    name: 'Session Data Collection',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Therapy & Daily Clinical',
    route: 'SessionDataCollection',
    backendResource: 'sessions',
    subResource: 'trials',
    description: 'Active therapy interface: prompt hierarchy, trial recording, timers, tokens',
  },
  {
    id: 'teacher_assessments',
    name: 'Assessment Dashboard',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Assessments',
    route: 'AssessmentDashboard',
    backendResource: 'assessments',
    description: 'Conduct baseline assessments: ABLLS-R, FAST, MASS, and preference tests',
  },
  {
    id: 'teacher_daily_notes',
    name: 'Daily Session Notes',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Therapy & Daily Clinical',
    route: 'DailyNotes',
    backendResource: 'sessions',
    description: 'Draft qualitative clinical notes, incident logs, and submit for review',
  },
  {
    id: 'teacher_abc_log',
    name: 'ABC Behavior Incident Log',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Therapy & Daily Clinical',
    route: 'AbcLog',
    backendResource: 'behavior_incidents',
    subResource: 'abc_lists',
    description: 'Antecedent, Behavior, Consequence event tracking and behavior logs',
  },
  {
    id: 'teacher_parent_comm',
    name: 'Parent Communication Thread',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Family & Messages',
    route: 'ParentCommunication',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description: 'Direct messaging thread with parents, share approved summaries',
  },
  {
    id: 'teacher_notifications',
    name: 'Clinical Notifications',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Family & Messages',
    route: 'Notifications',
    backendResource: 'sessions',
    description: 'System alert list, supervisor feedback alerts, and session updates',
  },

  // --- INSTITUTIONAL ADMIN ---
  {
    id: 'ia_goal_domains',
    name: 'Goal Domain Definitions',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'GoalDomainDefinitions',
    backendResource: 'iups',
    subResource: 'goal_domains',
    description: 'Configure institutional developmental domains and skill taxonomies',
  },
  {
    id: 'ia_schedule_capacity',
    name: 'Schedule & Capacity Configuration',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'ScheduleCapacityConfig',
    backendResource: 'staff',
    subResource: 'session_schedule_configs',
    description: 'Configure facility working hours, room capacities, and student-staff ratios',
  },
  {
    id: 'ia_abc_dropdowns',
    name: 'ABC Dropdown Lists',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'AbcDropdownLists',
    backendResource: 'behavior_incidents',
    subResource: 'abc_lists',
    description: 'Standardize antecedent, behavior, and consequence choices facility-wide',
  },
  {
    id: 'ia_trial_logging',
    name: 'Trial Logging Format Config',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'TrialLoggingFormat',
    backendResource: 'sessions',
    subResource: 'prompt_levels',
    description: 'Configure prompt level hierarchies, scoring options, and data collection formats',
  },
  {
    id: 'ia_form_builder',
    name: 'Assessment & Form Builder',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'FormBuilder',
    backendResource: 'admin',
    subResource: 'form_configurations',
    description: 'Interactive form designer, assessment question editors, and form sections',
  },
  {
    id: 'ia_task_analysis',
    name: 'Task Analysis Templates',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration',
    route: 'TaskAnalysisTemplates',
    backendResource: 'iups',
    description: 'Curate forward and backward chaining task analysis templates and step lists',
  },

  // --- SYSTEM ADMIN ---
  {
    id: 'sys_staff_accounts',
    name: 'Staff Account Management',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration',
    route: 'StaffAccountManagement',
    backendResource: 'staff',
    subResource: 'staff_members',
    description: 'Staff account provisioning, passwords, credential verification, and status',
  },
  {
    id: 'sys_role_management',
    name: 'Role Management',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration',
    route: 'RoleManagement',
    backendResource: 'admin',
    subResource: 'roles',
    description: 'Create and configure custom system roles, descriptions, and user assignments',
  },
  {
    id: 'sys_permissions',
    name: 'Permission Configuration (RBAC)',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration',
    route: 'PermissionConfiguration',
    backendResource: 'admin',
    subResource: 'clinical_configs',
    description: 'Role-based access control matrix, page action permissions, and audit log',
  },
  {
    id: 'sys_audit_log',
    name: 'System Audit Log',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration',
    route: 'AuditLog',
    backendResource: 'reports',
    subResource: 'audit_logs',
    description: 'Security and administrative audit trail with IP address and timestamp records',
  },

  // --- PARENT ---
  {
    id: 'parent_dashboard',
    name: 'Parent Family Dashboard',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Parent Portal',
    route: 'ParentDashboard',
    backendResource: 'parent_portal',
    description: 'Guardian portal overview, therapy attendance, and weekly skill milestones',
  },
  {
    id: 'parent_child_progress',
    name: 'Child Progress Tracker',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Parent Portal',
    route: 'ChildProgress',
    backendResource: 'parent_portal',
    description: 'Visual goal progress charts, mastered skills, and family-friendly updates',
  },
  {
    id: 'parent_home_observations',
    name: 'Home Observation Log',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Parent Portal',
    route: 'HomeObservationLog',
    backendResource: 'parent_portal',
    subResource: 'home_observations',
    description: 'Log behaviors and skills observed at home with therapist feedback',
  },
  {
    id: 'parent_messages',
    name: 'Parent Messaging Hub',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Parent Portal',
    route: 'ParentCommunication',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description: 'Direct communication thread with child therapist and clinical team',
  },
];

/**
 * Returns role-appropriate, least-privilege default permissions.
 */
export function getDefaultMatrixForRole(roleName: string): PermissionMatrix {
  const norm = (roleName || '').toLowerCase();
  const mat: PermissionMatrix = {};

  ALL_PAGE_MODULES.forEach((page) => {
    mat[page.id] = blankActions();

    if (norm.includes('system admin') || norm.includes('super admin')) {
      // Full administrative access
      mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    } else if (
      norm.includes('institutional admin') ||
      norm.includes('institutional administrator')
    ) {
      if (page.roleKey === 'institutional_admin') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'system_admin') {
        // Institutional admins cannot modify system admin roles, permissions, or system audit log
        mat[page.id] = {
          VIEW: page.id === 'sys_audit_log',
          CREATE: false,
          EDIT: false,
          DELETE: false,
          APPROVE: false,
        };
      } else {
        // Operational oversight across clinical modules
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      }
    } else if (norm.includes('director') && !norm.includes('program')) {
      // Executive clinical director
      if (page.roleKey === 'director') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'program_director' || page.roleKey === 'coordinator') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else if (page.roleKey === 'parent') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('program director')) {
      // Clinical intake, IUPs, assessments
      if (page.roleKey === 'program_director') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'coordinator' || page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else if (page.roleKey === 'director') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('coordinator') || norm.includes('therapy coordinator')) {
      // Therapy coordinator: live session monitoring, workload, scheduling, reviewing notes
      if (page.roleKey === 'coordinator') {
        mat[page.id] = {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: false,
          APPROVE: page.id === 'coord_session_summary',
        };
      } else if (page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('teacher') || norm.includes('therapist')) {
      // Teacher / Therapist: daily trial logging, daily notes, ABC log
      // STRICT LEAST PRIVILEGE: NO APPROVE, NO DELETE!
      if (page.roleKey === 'teacher') {
        mat[page.id] = {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: false,
          APPROVE: false, // Critical: teachers do not approve their own clinical milestones
        };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('parent')) {
      // Guardian portal: home observations, messaging
      // STRICT LEAST PRIVILEGE: NO EDIT/DELETE/APPROVE on clinical charts
      if (page.roleKey === 'parent') {
        const canCreate = page.id === 'parent_home_observations' || page.id === 'parent_messages';
        mat[page.id] = {
          VIEW: true,
          CREATE: canCreate,
          EDIT: false,
          DELETE: false,
          APPROVE: false,
        };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else {
      // Custom / generic role: strict least privilege (no admin access)
      if (page.category.includes('Therapy') || page.category.includes('Clinical')) {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    }
  });

  return mat;
}

/**
 * Checks if a role is legitimately authorized to access or own a page module.
 */
export function isPageInRoleScope(page: AppPageModule, roleName: string): boolean {
  const norm = (roleName || '').toLowerCase().trim();
  if (norm.includes('system admin') || norm.includes('super admin')) return true;
  if (norm.includes('institutional admin') || norm.includes('institutional administrator')) {
    return page.roleKey !== 'system_admin';
  }
  if (norm.includes('director') && !norm.includes('program')) {
    return page.roleKey === 'director' || page.roleKey === 'parent';
  }
  if (norm.includes('program director')) {
    return page.roleKey === 'program_director';
  }
  if (norm.includes('coordinator') || norm.includes('therapy coordinator')) {
    return page.roleKey === 'coordinator';
  }
  if (norm.includes('teacher') || norm.includes('therapist')) {
    return page.roleKey === 'teacher';
  }
  if (norm.includes('parent')) {
    return page.roleKey === 'parent';
  }
  // Custom or newly created roles can be configured with any application page
  return true;
}

/**
 * Maps backend permissions onto the UI permission matrix.
 * BACKEND AUTHORITY: Ignores stale local storage.
 * PERMISSION MAPPING FIX: Ensures permissions for one page do not unintentionally
 * grant access to unrelated pages of other roles or distinct sub-resources.
 */
export function mapBackendPermissionsToMatrix(
  backendPerms:
    Array<string | { id?: string; resource?: string; action?: string }> | null | undefined,
  roleName: string,
): PermissionMatrix {
  const normRole = (roleName || '').toLowerCase();
  const mat: PermissionMatrix = {};

  // Initialize all pages to blank
  ALL_PAGE_MODULES.forEach((page) => {
    mat[page.id] = blankActions();
  });

  if (!Array.isArray(backendPerms)) {
    // If backend data is null/undefined, load least-privilege defaults
    return getDefaultMatrixForRole(roleName);
  }

  if (backendPerms.length === 0) {
    // If backend explicitly returned empty array, all permissions are revoked
    return mat;
  }

  // Set of granted resource:action strings from backend
  const granted = new Set<string>();
  backendPerms.forEach((p) => {
    if (typeof p === 'string') {
      if (p.includes(':')) {
        granted.add(p.toLowerCase());
      }
    } else if (p && typeof p === 'object') {
      if (p.resource && p.action) {
        granted.add(`${p.resource.toLowerCase()}:${p.action.toLowerCase()}`);
      }
    }
  });

  ALL_PAGE_MODULES.forEach((page) => {
    ACTIONS.forEach((act) => {
      const actLower = act.toLowerCase();

      // 1. Direct sub-resource match (e.g. 'staff_members:view')
      if (page.subResource && granted.has(`${page.subResource.toLowerCase()}:${actLower}`)) {
        mat[page.id][act] = true;
        return;
      }

      // 2. Primary backend resource match (e.g. 'sessions:view')
      // CRITICAL FIX: Only apply if this page is legitimately within the role's scope!
      if (granted.has(`${page.backendResource.toLowerCase()}:${actLower}`)) {
        if (isPageInRoleScope(page, roleName)) {
          mat[page.id][act] = true;
        } else if (normRole.includes('system admin') || normRole.includes('institutional admin')) {
          // Administrators can see broad resource grants across allowed pages
          if (page.roleKey !== 'system_admin' || normRole.includes('system admin')) {
            mat[page.id][act] = true;
          }
        }
      }
    });
  });

  return mat;
}

/**
 * Enforces permission dependencies:
 * - Enabling CREATE, EDIT, DELETE, or APPROVE requires VIEW = true.
 * - Disabling VIEW automatically cascades and disables CREATE, EDIT, DELETE, APPROVE.
 * - Enabling APPROVE or DELETE also implies EDIT = true.
 */
export function applyPermissionDependencies(
  currentPerms: Record<ActionType, boolean>,
  action: ActionType,
  nextVal: boolean,
): Record<ActionType, boolean> {
  const updated = { ...currentPerms, [action]: nextVal };

  if (action === 'VIEW' && !nextVal) {
    // If VIEW is revoked, all child capabilities are revoked
    updated.CREATE = false;
    updated.EDIT = false;
    updated.DELETE = false;
    updated.APPROVE = false;
  } else if (nextVal && action !== 'VIEW') {
    // Any action requires VIEW
    updated.VIEW = true;
    if (action === 'APPROVE' || action === 'DELETE') {
      updated.EDIT = true;
    }
  }

  return updated;
}

/**
 * High-Risk Permission Detection:
 * Flags dangerous permission assignments (e.g. granting DELETE, APPROVE, or admin privileges
 * to non-executive roles such as Teacher or Parent).
 */
export function checkHighRiskPermission(
  page: AppPageModule,
  action: ActionType,
  roleName: string,
): { isHighRisk: boolean; reason?: string } {
  const normRole = (roleName || '').toLowerCase();
  const isExecutive =
    normRole.includes('system admin') ||
    normRole.includes('institutional admin') ||
    normRole.includes('director') ||
    normRole.includes('program director');

  if (!isExecutive) {
    if (action === 'DELETE') {
      return {
        isHighRisk: true,
        reason: `Granting DELETE access on "${page.name}" to non-executive role "${roleName}" can cause irreversible data loss.`,
      };
    }
    if (action === 'APPROVE') {
      return {
        isHighRisk: true,
        reason: `Granting clinical APPROVAL privilege on "${page.name}" to role "${roleName}" bypasses supervisor verification.`,
      };
    }
    if (page.category === 'Administration' || page.backendResource === 'admin') {
      return {
        isHighRisk: true,
        reason: `Granting administrative access on "${page.name}" to non-admin role "${roleName}" violates separation of duties.`,
      };
    }
  }

  return { isHighRisk: false };
}

/**
 * Filter pages by free-text search and role filter strip.
 */
export function filterPageModules(
  pages: AppPageModule[],
  query: string,
  roleFilter: string,
): AppPageModule[] {
  let list = Array.isArray(pages) ? pages : [];

  if (roleFilter && roleFilter !== 'All') {
    list = list.filter((p) => p.role.toLowerCase() === roleFilter.toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q),
    );
  }

  return list;
}

/**
 * Group pages by Category for clean table navigation.
 */
export function groupPagesByCategory(pages: AppPageModule[]): Record<string, AppPageModule[]> {
  const groups: Record<string, AppPageModule[]> = {};
  pages.forEach((p) => {
    const cat = p.category || 'General';
    groups[cat] = groups[cat] || [];
    groups[cat].push(p);
  });
  return groups;
}

/**
 * Builds backend save payload and generates diff summary for review modals.
 */
export function buildSavePayload(
  matrix: PermissionMatrix,
  catalogPermissions: CatalogPermission[],
  roleName: string,
): {
  permission_ids: string[];
  matrix: Record<string, Record<string, boolean>>;
  activeCount: number;
  highRiskCount: number;
} {
  const backendMatrix: Record<string, Record<string, boolean>> = {};
  const permissionIdsSet = new Set<string>();
  let count = 0;
  let highRisk = 0;

  ALL_PAGE_MODULES.forEach((page) => {
    const perms = matrix[page.id];
    if (!perms) return;

    ACTIONS.forEach((act) => {
      if (perms[act]) {
        count++;
        const hr = checkHighRiskPermission(page, act, roleName);
        if (hr.isHighRisk) highRisk++;

        const res = page.backendResource;
        const actLower = act.toLowerCase();

        backendMatrix[res] = backendMatrix[res] || {
          view: false,
          create: false,
          edit: false,
          delete: false,
          approve: false,
        };
        backendMatrix[res][actLower] = true;

        // Also add sub-resource if defined
        if (page.subResource) {
          backendMatrix[page.subResource] = backendMatrix[page.subResource] || {
            view: false,
            create: false,
            edit: false,
            delete: false,
            approve: false,
          };
          backendMatrix[page.subResource][actLower] = true;
        }

        // Map catalog permission ID
        let matchedCatalog = false;
        if (Array.isArray(catalogPermissions) && catalogPermissions.length > 0) {
          const match = catalogPermissions.find(
            (cp) =>
              (cp.resource === res || (page.subResource && cp.resource === page.subResource)) &&
              cp.action.toLowerCase() === actLower,
          );
          if (match?.id) {
            permissionIdsSet.add(match.id);
            matchedCatalog = true;
          }
        }
        if (!matchedCatalog) {
          permissionIdsSet.add(`${res}:${actLower}`);
          if (page.subResource) {
            permissionIdsSet.add(`${page.subResource}:${actLower}`);
          }
        }
      }
    });
  });

  return {
    permission_ids: Array.from(permissionIdsSet),
    matrix: backendMatrix,
    activeCount: count,
    highRiskCount: highRisk,
  };
}
