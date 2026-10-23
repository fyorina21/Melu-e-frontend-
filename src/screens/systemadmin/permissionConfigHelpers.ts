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
  subCategory?: string;
  route: string;
  screen?: string;
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

export const CATEGORY_ORDER = [
  'Student Intake & Enrollment',
  '6-Week Baseline Assessments',
  'IUP & Goal Curriculum Management',
  'Active Therapy & Clinical Delivery',
  'Operations, Staffing & Scheduling',
  'Family Engagement & Parent Portal',
  'Executive Reports & Clinical Oversight',
  'Administration & Governance',
] as const;

export type CategoryName = (typeof CATEGORY_ORDER)[number];

export interface CategoryInfo {
  index: number;
  title: string;
  pageCount: number;
  description: string;
}

export const CATEGORY_METADATA: Record<string, CategoryInfo> = {
  'Student Intake & Enrollment': {
    index: 1,
    title: 'Student Intake & Enrollment',
    pageCount: 2,
    description:
      'Covers student lifecycle entry, initial demographic and diagnostic data capture, and roster management.',
  },
  '6-Week Baseline Assessments': {
    index: 2,
    title: '6-Week Baseline Assessments',
    pageCount: 3,
    description:
      'Dedicated to the initial evaluation phase (ABLLS, MASS/FAST, ABC, and Preferences) that precedes IUP generation.',
  },
  'IUP & Goal Curriculum Management': {
    index: 3,
    title: 'IUP & Goal Curriculum Management',
    pageCount: 4,
    description:
      'Focuses on curriculum design, goal repositories, and individual intervention plans.',
  },
  'Active Therapy & Clinical Delivery': {
    index: 4,
    title: 'Active Therapy & Clinical Delivery',
    pageCount: 6,
    description:
      'Consolidates real-time therapy room execution, trial data logging, incident capture, supervisory review, and multi-teacher goal mastery verification.',
  },
  'Operations, Staffing & Scheduling': {
    index: 5,
    title: 'Operations, Staffing & Scheduling',
    pageCount: 3,
    description:
      'Covers operational scheduling, physical therapy stations/rooms, and staff assignment limits.',
  },
  'Family Engagement & Parent Portal': {
    index: 6,
    title: 'Family Engagement & Parent Portal',
    pageCount: 3,
    description:
      'Consolidates all two-way parent communication, home logs, and family-facing visibility.',
  },
  'Executive Reports & Clinical Oversight': {
    index: 7,
    title: 'Executive Reports & Clinical Oversight',
    pageCount: 2,
    description: 'Director-level analytics, bi-annual reviews, and long-term reporting.',
  },
  'Administration & Governance': {
    index: 8,
    title: 'Administration & Governance',
    pageCount: 8,
    description:
      'Separated logically into Institutional Admin (Clinical Parameters) and System Admin (IT Security & Access).',
  },
};

export const CATEGORY_FILTER_OPTIONS: string[] = ['All Categories', ...CATEGORY_ORDER];

// Canonical application pages organized strictly across the 8 SRS modules
export const ALL_PAGE_MODULES: AppPageModule[] = [
  // =========================================================================
  // 1. Student Intake & Enrollment (2 pages)
  // Covers student lifecycle entry, initial demographic and diagnostic data capture, and roster management (SRS §3.2).
  // =========================================================================
  {
    id: 'pd_enrollment_wizard',
    name: 'Student Enrollment Wizard',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'Student Intake & Enrollment',
    route: 'StudentEnrollmentWizard',
    screen: 'SCR-009',
    backendResource: 'students',
    subResource: 'enrollments',
    description:
      'Multi-step student onboarding questionnaire, document uploads (birth certificate, diagnosis papers), baseline photo/video, and clinical profile setup.',
  },
  {
    id: 'coord_student_registration',
    name: 'Student Register & Roster List',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Student Intake & Enrollment',
    route: 'StudentEnrollment',
    screen: 'SCR-006',
    backendResource: 'students',
    subResource: 'enrollments',
    description:
      'Student register, roster search, cohort filtering (Regular/Pulled Out, Basic/Functional Living), and enrollment status management.',
  },

  // =========================================================================
  // 2. 6-Week Baseline Assessments (3 pages)
  // Dedicated to the initial evaluation phase (ABLLS, MASS/FAST, ABC, and Preferences) that precedes IUP generation (SRS §3.3).
  // =========================================================================
  {
    id: 'teacher_assessments',
    name: 'Assessment Dashboard',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: '6-Week Baseline Assessments',
    route: 'AssessmentDashboard',
    screen: 'SCR-010 / SCR-TEA-002 / SCR-TEA-003',
    backendResource: 'assessments',
    description:
      'Launch and conduct baseline evaluations: ABLLS-R skill domains, MASS/FAST behavioral questionnaires, and Sensory/Preference inventories.',
  },
  {
    id: 'pd_assessment_review',
    name: 'Assessment Review & Sign-Off',
    role: 'Program Director',
    roleKey: 'program_director',
    category: '6-Week Baseline Assessments',
    route: 'AssessmentReview',
    screen: 'SCR-PD-002',
    backendResource: 'assessments',
    description:
      'Program Director review pipeline to verify teacher assessment data, score distributions, and approve transition to "Ready for IUP".',
  },
  {
    id: 'pd_assessment_summary',
    name: 'Assessment Summary Report',
    role: 'Program Director',
    roleKey: 'program_director',
    category: '6-Week Baseline Assessments',
    route: 'AssessmentSummaryReport',
    screen: 'SCR-015',
    backendResource: 'assessments',
    description:
      'Comprehensive 6-week assessment report generation, Skills Radar charts, behavior function breakdowns, and PDF export.',
  },

  // =========================================================================
  // 3. IUP & Goal Curriculum Management (4 pages)
  // Focuses on curriculum design, goal repositories, and individual intervention plans (SRS §3.4, §3.5).
  // =========================================================================
  {
    id: 'pd_iup_generation',
    name: 'IUP Creation & Goal Assignment',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'IUP & Goal Curriculum Management',
    route: 'IupGeneration',
    screen: 'SCR-PD-003',
    backendResource: 'iups',
    description:
      'Formulate individualized intervention plans informed by 6-week assessment metrics; assign up to 2 goals per station.',
  },
  {
    id: 'pd_iup_library',
    name: 'IUP Library Management',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'IUP & Goal Curriculum Management',
    route: 'IupLibrary',
    screen: 'SCR-PD-004',
    backendResource: 'iups',
    description:
      'Central repository for IUP documents across Draft, Active, and Archived lifecycle states.',
  },
  {
    id: 'pd_clinical_quality',
    name: 'Goal Bank',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'IUP & Goal Curriculum Management',
    route: 'GoalBankManagement',
    screen: 'SCR-PD-006',
    backendResource: 'iups',
    subResource: 'goals',
    description:
      'Standardized goal banks across developmental domains, task analysis multi-step templates, and program integrity auditing.',
  },
  {
    id: 'pd_student_caseload',
    name: 'Student Caseload Management',
    role: 'Program Director',
    roleKey: 'program_director',
    category: 'IUP & Goal Curriculum Management',
    route: 'StudentCaseload',
    screen: 'SCR-PD-005',
    backendResource: 'iups',
    description:
      'Student-level clinical goal slot allocation, active goal tracking per station, and station readiness transitions.',
  },

  // =========================================================================
  // 4. Active Therapy & Clinical Delivery (6 pages)
  // Consolidates real-time therapy room execution, trial data logging, incident capture, supervisory review, and multi-teacher goal mastery verification (SRS §3.6).
  // =========================================================================
  {
    id: 'teacher_session_collection',
    name: 'Session Data Collection',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Active Therapy & Clinical Delivery',
    route: 'SessionDataCollection',
    screen: 'SCR-002',
    backendResource: 'sessions',
    subResource: 'trials',
    description:
      'Active touch-first therapy interface: FP/PP/G/+ prompt hierarchy, task analysis step recording, countdown timers, and token systems.',
  },
  {
    id: 'teacher_daily_notes',
    name: 'Daily Session Notes',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Active Therapy & Clinical Delivery',
    route: 'DailyNotes',
    screen: 'SCR-TEA-004',
    backendResource: 'sessions',
    description:
      'Draft qualitative clinical notes, record shift observations, log environmental factors, and submit for end-of-day sign-off.',
  },
  {
    id: 'teacher_abc_log',
    name: 'ABC Behavior Incident Log',
    role: 'Teacher / Therapist',
    roleKey: 'teacher',
    category: 'Active Therapy & Clinical Delivery',
    route: 'AbcLog',
    screen: 'SCR-003',
    backendResource: 'behavior_incidents',
    subResource: 'abc_lists',
    description:
      'Antecedent, Behavior, Consequence incident logging, intensity/frequency scoring, and immediate behavior tracking.',
  },
  {
    id: 'coord_live_sessions',
    name: 'Live Session Monitoring',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Active Therapy & Clinical Delivery',
    route: 'LiveSessionMonitoring',
    screen: 'SCR-TC-002',
    backendResource: 'sessions',
    description:
      'Real-time observation of active therapy stations, room occupancies, and live therapist trial stream monitoring.',
  },
  {
    id: 'coord_session_summary',
    name: 'Session Summary Review',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Active Therapy & Clinical Delivery',
    route: 'SessionSummaryReview',
    screen: 'SCR-TC-003 / SCR-005',
    backendResource: 'sessions',
    subResource: 'session_summaries',
    description:
      'Therapy Coordinator review and approval workflow for submitted therapist daily session notes and trial summaries.',
  },
  {
    id: 'goal_mastery_approval',
    name: 'Goal Mastery Approval',
    role: 'Program Director / Director',
    roleKey: 'program_director',
    category: 'Active Therapy & Clinical Delivery',
    route: 'GoalMasteryApproval',
    screen: 'SCR-004 / SCR-PD-009',
    backendResource: 'goals',
    description:
      '3-teacher verification workflow (Primary + 2 Verifying Teachers) and Program Director / Director final mastery sign-off.',
  },

  // =========================================================================
  // 5. Operations, Staffing & Scheduling (3 pages)
  // Covers operational scheduling, physical therapy stations/rooms, and staff assignment limits (SRS §3.7).
  // =========================================================================
  {
    id: 'director_scheduling',
    name: 'Staff Scheduling & Capacity',
    role: 'Director',
    roleKey: 'director',
    category: 'Operations, Staffing & Scheduling',
    route: 'DirectorScheduling',
    screen: 'SCR-DIR-002',
    backendResource: 'staff',
    subResource: 'staff_scheduling',
    description:
      'Calendar/grid view for morning/afternoon block scheduling, teacher-to-student capacity limits, and conflict detection.',
  },
  {
    id: 'coord_staff_workload',
    name: 'Staff Workload & Therapist Linking',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations, Staffing & Scheduling',
    route: 'WorkloadDashboard',
    screen: 'SCR-TC-005',
    backendResource: 'staff',
    description:
      'Daily operational availability management, teacher absences, emergency caseload reassignment, and therapist-student pairings.',
  },
  {
    id: 'coord_room_scheduling',
    name: 'Room Resource Scheduling',
    role: 'Therapy Coordinator',
    roleKey: 'coordinator',
    category: 'Operations, Staffing & Scheduling',
    route: 'RoomResourceScheduling',
    screen: 'Operational/Facility',
    backendResource: 'staff',
    subResource: 'session_block_definitions',
    description:
      'Physical room allocations across Stations 1 and 2, sensory gym availability, and station rotation scheduling.',
  },

  // =========================================================================
  // 6. Family Engagement & Parent Portal (3 pages)
  // Consolidates all two-way parent communication, home logs, and family-facing visibility (SRS §3.1, §4.1).
  // =========================================================================
  {
    id: 'director_parent_comm',
    name: 'Parent Communication',
    role: 'Director',
    roleKey: 'director',
    category: 'Family Engagement & Parent Portal',
    route: 'ParentCommunication',
    screen: 'SCR-DIR-004 / SCR-TC-006 / SCR-PAR-004',
    backendResource: 'parent_portal',
    subResource: 'parent_communications',
    description:
      'Centralized family messaging, incident notifications, progress sharing, and escalated family communication management.',
  },
  {
    id: 'parent_child_progress',
    name: 'Child Progress Tracker',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Family Engagement & Parent Portal',
    route: 'ChildProgress',
    screen: 'SCR-PAR-002',
    backendResource: 'parent_portal',
    description:
      'Simplified, visual goal progress charts, mastered milestones, and non-technical updates tailored for parents.',
  },
  {
    id: 'parent_home_observations',
    name: 'Home Observation Log',
    role: 'Parent',
    roleKey: 'parent',
    category: 'Family Engagement & Parent Portal',
    route: 'HomeObservationLog',
    screen: 'SCR-PAR-003',
    backendResource: 'parent_portal',
    subResource: 'home_observations',
    description:
      'Interface for parents to record home-based behaviors, routine developments, and skill generalization with therapist feedback.',
  },

  // =========================================================================
  // 7. Executive Reports & Clinical Oversight (2 pages)
  // Director-level analytics, bi-annual reviews, and long-term reporting (SRS §3.8).
  // =========================================================================
  {
    id: 'director_reports_oversight',
    name: 'Reports & Executive Oversight',
    role: 'Director',
    roleKey: 'director',
    category: 'Executive Reports & Clinical Oversight',
    route: 'ReportsOversight',
    screen: 'SCR-DIR-005',
    backendResource: 'reports',
    subResource: 'oversight',
    description:
      'Executive reporting hub: bi-annual progress reports, foundation overview KPIs, session attendance metrics, and compliance exports.',
  },
  {
    id: 'director_report_builder',
    name: 'Custom Report Builder',
    role: 'Director',
    roleKey: 'director',
    category: 'Executive Reports & Clinical Oversight',
    route: 'ReportBuilder',
    screen: 'SCR-DIR-006 / SCR-PD-008',
    backendResource: 'reports',
    description:
      'Multi-metric trend analysis, custom graph generation (ABLLS radar, trial distribution, behavior incidents), and filtered data extraction.',
  },

  // =========================================================================
  // 8. Administration & Governance (8 pages)
  // Separated logically into Institutional Admin (Clinical Parameters) and System Admin (IT Security & Access) as specified in SRS §3.9.
  // =========================================================================
  // --- A. Institutional Administration (Clinical & Operational Configuration) ---
  {
    id: 'ia_form_builder',
    name: 'Assessment & Form Builder',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration & Governance',
    subCategory: 'Institutional Administration',
    route: 'FormBuilder',
    screen: 'SCR-ADMIN-001',
    backendResource: 'admin',
    subResource: 'form_configurations',
    description:
      'Dynamic form designer for Enrollment, IUP, and ABLLS forms; custom field definitions and metadata header layouts.',
  },
  {
    id: 'ia_trial_logging',
    name: 'Trial Logging Format Config',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration & Governance',
    subCategory: 'Institutional Administration',
    route: 'TrialLoggingFormat',
    screen: 'SCR-ADMIN-002',
    backendResource: 'sessions',
    subResource: 'prompt_levels',
    description:
      'Prompt hierarchy definitions (FP, PP, G, +), button colors, trial stream layouts (3–20 counts), and mastery threshold rules.',
  },
  {
    id: 'ia_abc_dropdowns',
    name: 'ABC Dropdown Lists',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration & Governance',
    subCategory: 'Institutional Administration',
    route: 'AbcDropdownLists',
    screen: 'SCR-ADMIN-003',
    backendResource: 'behavior_incidents',
    subResource: 'abc_lists',
    description:
      'Facility-wide standardization of antecedent choices, consequence responses, behavior definitions, and severity options.',
  },
  {
    id: 'ia_schedule_capacity',
    name: 'Schedule & Capacity Configuration',
    role: 'Institutional Admin',
    roleKey: 'institutional_admin',
    category: 'Administration & Governance',
    subCategory: 'Institutional Administration',
    route: 'ScheduleCapacityConfig',
    screen: 'SCR-ADMIN-004',
    backendResource: 'staff',
    subResource: 'session_schedule_configs',
    description:
      'Round block timing (morning/afternoon), station durations, default staff-to-student ratios, and draft document expiry intervals.',
  },

  // --- B. System Administration (IT, Governance & Security) ---
  {
    id: 'sys_staff_accounts',
    name: 'Staff Account Management',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration & Governance',
    subCategory: 'System Administration',
    route: 'StaffAccountManagement',
    screen: 'SCR-SYS-001',
    backendResource: 'staff',
    subResource: 'staff_members',
    description:
      'Staff credential provisioning, password reset dispatch, active/inactive status toggles, and user directory management.',
  },
  {
    id: 'sys_role_management',
    name: 'Role Management',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration & Governance',
    subCategory: 'System Administration',
    route: 'RoleManagement',
    screen: 'SCR-SYS-002',
    backendResource: 'admin',
    subResource: 'roles',
    description:
      'Role creation, assignment of multiple system roles per employee, role descriptions, and privilege presets.',
  },
  {
    id: 'sys_permissions',
    name: 'Permission Configuration (RBAC)',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration & Governance',
    subCategory: 'System Administration',
    route: 'PermissionConfiguration',
    screen: 'SCR-SYS-003',
    backendResource: 'admin',
    subResource: 'clinical_configs',
    description:
      'Granular matrix for View, Create, Edit, Delete, and Approve privileges per page and action endpoint.',
  },
  {
    id: 'sys_audit_log',
    name: 'System Audit Log',
    role: 'System Admin',
    roleKey: 'system_admin',
    category: 'Administration & Governance',
    subCategory: 'System Administration',
    route: 'AuditLog',
    screen: 'Audit & Compliance',
    backendResource: 'reports',
    subResource: 'audit_logs',
    description:
      'Immutable chronological log tracking sensitive PII access, configuration changes, user logins, timestamps, and IP addresses.',
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

      // 0. Direct page-level match (e.g. 'teacher_session_collection:view' or 'coord_live_sessions:view')
      if (granted.has(`${page.id.toLowerCase()}:${actLower}`)) {
        mat[page.id][act] = true;
        return;
      }

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
    if (
      page.category === 'Administration & Governance' ||
      page.category.includes('Admin') ||
      page.backendResource === 'admin'
    ) {
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
  filter?: string,
): AppPageModule[] {
  let list = Array.isArray(pages) ? pages : [];

  if (filter && filter !== 'All' && filter !== 'All Categories') {
    const fLower = filter.toLowerCase();
    list = list.filter(
      (p) =>
        p.category.toLowerCase() === fLower ||
        (p.subCategory && p.subCategory.toLowerCase() === fLower) ||
        p.role.toLowerCase() === fLower ||
        p.role.toLowerCase().includes(fLower),
    );
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        (p.screen && p.screen.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q),
    );
  }

  return list;
}

/**
 * Group pages by Category for clean table navigation, preserving canonical order.
 */
export function groupPagesByCategory(pages: AppPageModule[]): Record<string, AppPageModule[]> {
  const groups: Record<string, AppPageModule[]> = {};

  // Initialize in canonical order
  CATEGORY_ORDER.forEach((cat) => {
    groups[cat] = [];
  });

  pages.forEach((p) => {
    const cat = p.category || 'General';
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(p);
  });

  // Keep only groups that have matching pages
  const result: Record<string, AppPageModule[]> = {};
  Object.keys(groups).forEach((key) => {
    if (groups[key].length > 0) {
      result[key] = groups[key];
    }
  });

  return result;
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
        // Always include exact page module identifier so page-level precision is preserved
        permissionIdsSet.add(`${page.id}:${actLower}`);
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
