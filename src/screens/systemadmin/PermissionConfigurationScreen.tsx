import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getRoles,
  getPermissionMatrix,
  savePermissionMatrix,
  resetDefaultPermissions,
  copyPermissionsFromRole,
  getPermissionAuditTrail,
  getPermissionsCatalog,
} from '../../api/SystemAdminApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList, Role } from '../../types';

// ============================================================================
// CANONICAL APPLICATION PAGES FROM ALL ROLES
// ============================================================================

export interface AppPageModule {
  id: string;
  name: string;
  role: string;
  roleKey: Role;
  category: string;
  route: string;
  backendResource: string;
  description: string;
}

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
    description: 'Direct communication thread with child therapist and clinical team',
  },
];

export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as const;
export type ActionType = typeof ACTIONS[number];

export type PermissionMatrix = Record<string, Record<ActionType, boolean>>;

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
}

const STORAGE_KEY_PREFIX = 'melue_page_perms_v3_';

function getStoredMatrix(roleId: string): PermissionMatrix | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${roleId}`);
      if (item) return JSON.parse(item);
    }
  } catch {}
  return null;
}

function setStoredMatrix(roleId: string, mat: PermissionMatrix) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${roleId}`, JSON.stringify(mat));
    }
  } catch {}
}

const blankActions = (): Record<ActionType, boolean> => ({
  VIEW: false,
  CREATE: false,
  EDIT: false,
  DELETE: false,
  APPROVE: false,
});

/**
 * Returns role-appropriate default permissions for a role when unconfigured.
 */
function getDefaultMatrixForRole(roleName: string): PermissionMatrix {
  const norm = roleName.toLowerCase();
  const mat: PermissionMatrix = {};

  ALL_PAGE_MODULES.forEach((page) => {
    mat[page.id] = blankActions();

    if (norm.includes('system admin') || norm.includes('super admin')) {
      // Full access everywhere
      mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    } else if (norm.includes('institutional admin')) {
      if (page.roleKey === 'institutional_admin') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'system_admin') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      }
    } else if (norm.includes('director') && !norm.includes('program')) {
      if (page.roleKey === 'director') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'parent') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'system_admin') {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      }
    } else if (norm.includes('program director')) {
      if (page.roleKey === 'program_director') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'director') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'coordinator' || page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'system_admin' || page.roleKey === 'institutional_admin') {
        mat[page.id] = { VIEW: false, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('coordinator')) {
      if (page.roleKey === 'coordinator') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
      } else if (page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else if (page.roleKey === 'director' || page.roleKey === 'program_director') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      } else if (page.roleKey === 'parent') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('teacher') || norm.includes('therapist')) {
      if (page.roleKey === 'teacher') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: true };
      } else if (page.id === 'coord_student_profile' || page.id === 'director_student_progress') {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    } else if (norm.includes('parent')) {
      if (page.roleKey === 'parent') {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false };
      }
    } else {
      // Custom / generic role
      if (page.category.includes('Therapy') || page.category.includes('Supervision')) {
        mat[page.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: false, APPROVE: false };
      } else {
        mat[page.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
      }
    }
  });

  return mat;
}

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  director: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  program_director: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  coordinator: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  teacher: { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' },
  institutional_admin: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  system_admin: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  parent: { bg: '#FEFCE8', text: '#A16207', border: '#FEF08A' },
};

export default function PermissionConfigurationScreen({
  navigation,
}: NativeStackScreenProps<SystemAdminStackParamList, 'PermissionConfiguration'>) {
  const { showToast } = useToast();
  const { session } = useAuth();

  const [roles, setRoles] = useState<PermissionRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Modals & Menus
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [catalogPermissions, setCatalogPermissions] = useState<any[]>([]);

  // Load available roles & catalog
  const loadRoles = useCallback(async () => {
    try {
      const { data } = await getRoles();
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      setSelectedRoleId((prev) => prev || list[0]?.id || '');
    } catch {
      setRoles([]);
    }

    try {
      const { data: catalog } = await getPermissionsCatalog();
      if (Array.isArray(catalog?.all_permissions)) {
        setCatalogPermissions(catalog.all_permissions);
      }
    } catch {
      // Backend catalog optional
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Load matrix for selected role
  useEffect(() => {
    if (!selectedRoleId) return;

    const currentRole = roles.find((r) => r.id === selectedRoleId);
    const roleName = currentRole?.name || selectedRoleId;

    // 1. Check local storage first
    const stored = getStoredMatrix(selectedRoleId);

    // 2. Fetch from backend
    getPermissionMatrix(selectedRoleId)
      .then(({ data }) => {
        const backendPerms = data?.permissions;
        const initial = stored || getDefaultMatrixForRole(roleName);

        // If backend returned mapped permissions, overlay them on corresponding pages
        if (Array.isArray(backendPerms) && backendPerms.length > 0) {
          const merged = { ...initial };
          backendPerms.forEach((p: any) => {
            if (!p.resource || !p.action) return;
            const actUpper = p.action.toUpperCase() as ActionType;
            if (!ACTIONS.includes(actUpper)) return;

            ALL_PAGE_MODULES.forEach((page) => {
              if (page.backendResource === p.resource) {
                merged[page.id] = merged[page.id] || blankActions();
                merged[page.id][actUpper] = true;
              }
            });
          });
          setMatrix(merged);
        } else {
          setMatrix(initial);
        }
        setDirty(false);
      })
      .catch(() => {
        setMatrix(stored || getDefaultMatrixForRole(roleName));
        setDirty(false);
      });

    // 3. Load audit trail
    getPermissionAuditTrail(selectedRoleId)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const formatted: AuditEntry[] = data.map((a: any) => ({
            id: String(a.id || Math.random()),
            date: a.created_at ? new Date(a.created_at).toLocaleString() : a.date || 'Recent',
            user: a.changed_by || a.metadata?.updated_by || a.user || 'System Admin',
            resource: a.resource_type || a.resource || 'Role Permissions',
            action: (a.action || 'Updated permissions').replace(/_/g, ' '),
            roleName: a.metadata?.role_name || a.roleName || roleName,
          }));
          setAuditTrail(formatted);
        }
      })
      .catch(() => setAuditTrail([]));
  }, [selectedRoleId, roles]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || { id: selectedRoleId, name: selectedRoleId },
    [roles, selectedRoleId]
  );

  // Filtered page list
  const filteredPages = useMemo(() => {
    return ALL_PAGE_MODULES.filter((page) => {
      const matchesRole = roleFilter === 'All' || page.role === roleFilter;
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !term ||
        page.name.toLowerCase().includes(term) ||
        page.role.toLowerCase().includes(term) ||
        page.category.toLowerCase().includes(term) ||
        page.description.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchQuery]);

  // Checkbox interactions
  const toggleCell = (pageId: string, action: ActionType) => {
    setMatrix((prev) => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] ?? blankActions()),
        [action]: !prev[pageId]?.[action],
      },
    }));
    setDirty(true);
  };

  const toggleRow = (pageId: string) => {
    setMatrix((prev) => {
      const currentVal = prev[pageId] ?? blankActions();
      const allChecked = ACTIONS.every((a) => currentVal[a]);
      const nextState: Record<ActionType, boolean> = {
        VIEW: !allChecked,
        CREATE: !allChecked,
        EDIT: !allChecked,
        DELETE: !allChecked,
        APPROVE: !allChecked,
      };
      return { ...prev, [pageId]: nextState };
    });
    setDirty(true);
  };

  const toggleColumn = (action: ActionType) => {
    setMatrix((prev) => {
      const allChecked = filteredPages.every((page) => prev[page.id]?.[action]);
      const updated = { ...prev };
      filteredPages.forEach((page) => {
        updated[page.id] = {
          ...(updated[page.id] ?? blankActions()),
          [action]: !allChecked,
        };
      });
      return updated;
    });
    setDirty(true);
  };

  const toggleAllVisible = () => {
    setMatrix((prev) => {
      const allChecked = filteredPages.every((p) =>
        ACTIONS.every((a) => prev[p.id]?.[a])
      );
      const updated = { ...prev };
      filteredPages.forEach((p) => {
        updated[p.id] = {
          VIEW: !allChecked,
          CREATE: !allChecked,
          EDIT: !allChecked,
          DELETE: !allChecked,
          APPROVE: !allChecked,
        };
      });
      return updated;
    });
    setDirty(true);
  };

  // Presets
  const handleFullAccess = () => {
    const full: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      full[p.id] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
    });
    setMatrix(full);
    setDirty(true);
  };

  const handleReadOnly = () => {
    const ro: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      ro[p.id] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
    });
    setMatrix(ro);
    setDirty(true);
  };

  const handleRoleRecommended = () => {
    const recommended = getDefaultMatrixForRole(selectedRole.name);
    setMatrix(recommended);
    setDirty(true);
    showToast(`Loaded standard recommended permissions for ${selectedRole.name}`, 'info');
  };

  const handleClearAll = () => {
    const empty: PermissionMatrix = { ...matrix };
    filteredPages.forEach((p) => {
      empty[p.id] = blankActions();
    });
    setMatrix(empty);
    setDirty(true);
  };

  const handleCopyFromRole = async (sourceRoleId: string) => {
    const sourceRole = roles.find((r) => r.id === sourceRoleId);
    try {
      // 1. Try local storage of source role
      const stored = getStoredMatrix(sourceRoleId);
      if (stored) {
        setMatrix(stored);
      } else {
        // 2. Fetch from backend
        const { data } = await getPermissionMatrix(sourceRoleId);
        const sourceName = sourceRole?.name || sourceRoleId;
        const fallback = getDefaultMatrixForRole(sourceName);
        if (Array.isArray(data?.permissions) && data.permissions.length > 0) {
          const merged = { ...fallback };
          data.permissions.forEach((p: any) => {
            const actUpper = p.action?.toUpperCase() as ActionType;
            if (ACTIONS.includes(actUpper)) {
              ALL_PAGE_MODULES.forEach((page) => {
                if (page.backendResource === p.resource) {
                  merged[page.id] = merged[page.id] || blankActions();
                  merged[page.id][actUpper] = true;
                }
              });
            }
          });
          setMatrix(merged);
        } else {
          setMatrix(fallback);
        }
      }
      setDirty(true);
      setCopyModalOpen(false);
      showToast(`Copied permissions from "${sourceRole?.name || 'role'}" into "${selectedRole.name}"`, 'success');
    } catch {
      setCopyModalOpen(false);
      showToast('Failed to copy role permissions', 'error');
    }
  };

  const handleResetDefault = async () => {
    Alert.alert(
      'Reset Permissions?',
      `Are you sure you want to reset all permissions for ${selectedRole.name} to the system defaults?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Default',
          style: 'destructive',
          onPress: async () => {
            const defaults = getDefaultMatrixForRole(selectedRole.name);
            setMatrix(defaults);
            setStoredMatrix(selectedRoleId, defaults);
            try {
              await resetDefaultPermissions(selectedRoleId);
            } catch {
              // Local fallback is already applied
            }
            setDirty(false);
            showToast(`Permissions for ${selectedRole.name} reset to defaults`, 'success');
          },
        },
      ]
    );
  };

  // Save Configuration Handler
  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);

    try {
      // 1. Persist to storage
      setStoredMatrix(selectedRoleId, matrix);

      // 2. Build backend matrix payload
      const backendMatrix: Record<string, Record<string, boolean>> = {};
      const permissionIds: string[] = [];

      ALL_PAGE_MODULES.forEach((page) => {
        const perms = matrix[page.id];
        if (!perms) return;
        const res = page.backendResource;
        backendMatrix[res] = backendMatrix[res] || { view: false, create: false, edit: false, delete: false, approve: false };
        if (perms.VIEW) backendMatrix[res].view = true;
        if (perms.CREATE) backendMatrix[res].create = true;
        if (perms.EDIT) backendMatrix[res].edit = true;
        if (perms.DELETE) backendMatrix[res].delete = true;
        if (perms.APPROVE) backendMatrix[res].approve = true;

        // Map catalog permission IDs if present
        if (catalogPermissions.length > 0) {
          ACTIONS.forEach((act) => {
            if (perms[act]) {
              const catalogMatch = catalogPermissions.find(
                (cp) => cp.resource === res && cp.action.toLowerCase() === act.toLowerCase()
              );
              if (catalogMatch?.id) permissionIds.push(catalogMatch.id);
            }
          });
        }
      });

      // 3. Post to backend
      await savePermissionMatrix(selectedRoleId, {
        matrix: backendMatrix,
        permission_ids: Array.from(new Set(permissionIds)),
      });

      // 4. Update audit trail in local state
      const newAudit: AuditEntry = {
        id: String(Date.now()),
        date: new Date().toLocaleString(),
        user: session?.userName || 'System Admin',
        resource: 'Role Permissions',
        action: 'Updated page permissions',
        roleName: selectedRole.name,
      };
      setAuditTrail((prev) => [newAudit, ...prev]);

      setDirty(false);
      showToast(`Permissions for "${selectedRole.name}" successfully saved!`, 'success');
    } catch (err: any) {
      // Even if network call fails, local state and localStorage are preserved
      setDirty(false);
      showToast(`Permissions for "${selectedRole.name}" saved locally.`, 'success');
    } finally {
      setSaving(false);
    }
  };

  // Dynamic Permission Summary statements
  const { summaryList, activeCount, totalPossible } = useMemo(() => {
    const statements: string[] = [];
    let count = 0;
    const total = ALL_PAGE_MODULES.length * ACTIONS.length;

    ALL_PAGE_MODULES.forEach((page) => {
      const perms = matrix[page.id];
      if (!perms) return;

      const activeActs: string[] = [];
      if (perms.VIEW) { activeActs.push('view'); count++; }
      if (perms.CREATE) { activeActs.push('create'); count++; }
      if (perms.EDIT) { activeActs.push('edit'); count++; }
      if (perms.DELETE) { activeActs.push('delete'); count++; }
      if (perms.APPROVE) { activeActs.push('approve'); count++; }

      if (activeActs.length > 0) {
        let actionStr = '';
        if (activeActs.length === 1) {
          actionStr = activeActs[0];
        } else if (activeActs.length === 2) {
          actionStr = `${activeActs[0]} and ${activeActs[1]}`;
        } else {
          const last = activeActs.pop();
          actionStr = `${activeActs.join(', ')}, and ${last}`;
        }
        statements.push(`Can ${actionStr} [${page.role}] ${page.name}`);
      }
    });

    return { summaryList: statements, activeCount: count, totalPossible: total };
  }, [matrix]);

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Permissions"
        onTabPress={(t) => navigation?.navigate?.(SYS_ROUTE_BY_TAB[t])}
      />

      <View style={styles.subHeader}>
        <View style={styles.titleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.headerIconWrap}>
              <Feather name="shield" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={typography.h1}>Role-Based Permission Configuration</Text>
              <Text style={styles.breadcrumbText}>
                System Administration · Granular Page & Action Privileges per Role
              </Text>
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RBAC MATRIX</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Control Bar: Role Selection & Quick Presets */}
        <View style={styles.controlsCard}>
          <View style={styles.roleSelectorBox}>
            <Text style={styles.fieldLabel}>ACTIVE ROLE TO CONFIGURE</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownBtnContent}>
                <Feather name="user-check" size={16} color="#0284C7" />
                <Text style={styles.dropdownBtnText}>{selectedRole.name}</Text>
              </View>
              <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.navyText} />
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                  {roles.map((r) => {
                    const isSelected = selectedRoleId === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                        onPress={() => {
                          setSelectedRoleId(r.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemTitle, isSelected && styles.dropdownItemTitleActive]}>
                            {r.name}
                          </Text>
                          {Boolean(r.description) && (
                            <Text style={styles.dropdownItemDesc} numberOfLines={1}>
                              {r.description}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Feather name="check" size={16} color="#0284C7" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.presetsBox}>
            <Text style={styles.fieldLabel}>QUICK PERMISSION ACTIONS</Text>
            <View style={styles.presetsRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={handleFullAccess}>
                <Feather name="check-circle" size={13} color="#059669" />
                <Text style={styles.presetBtnText}>Full Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleReadOnly}>
                <Feather name="eye" size={13} color="#0284C7" />
                <Text style={styles.presetBtnText}>Read Only</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleRoleRecommended}>
                <Feather name="zap" size={13} color="#D97706" />
                <Text style={styles.presetBtnText}>Recommended</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setCopyModalOpen(true)}>
                <Feather name="copy" size={13} color="#475569" />
                <Text style={styles.presetBtnText}>Copy Role...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={handleClearAll}>
                <Feather name="x-circle" size={13} color="#DC2626" />
                <Text style={styles.presetBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtnDanger} onPress={handleResetDefault}>
                <Feather name="rotate-ccw" size={13} color="#DC2626" />
                <Text style={styles.presetBtnTextDanger}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search & Filter Toolbar */}
        <View style={styles.filterToolbar}>
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pages by name, role, route, or category..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterStrip}>
            {[
              'All',
              'Director',
              'Program Director',
              'Therapy Coordinator',
              'Teacher / Therapist',
              'Institutional Admin',
              'System Admin',
              'Parent',
            ].map((rf) => {
              const active = roleFilter === rf;
              return (
                <TouchableOpacity
                  key={rf}
                  style={[styles.roleFilterTab, active && styles.roleFilterTabActive]}
                  onPress={() => setRoleFilter(rf)}
                >
                  <Text style={[styles.roleFilterTabText, active && styles.roleFilterTabTextActive]}>
                    {rf === 'All' ? 'All Roles' : rf}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.filterMetaRow}>
            <Text style={styles.filterCountText}>
              Showing <Text style={{ fontWeight: '700', color: colors.navyText }}>{filteredPages.length}</Text> of{' '}
              {ALL_PAGE_MODULES.length} application pages across all roles
            </Text>
            {dirty && (
              <View style={styles.unsavedBadge}>
                <Feather name="alert-circle" size={12} color="#D97706" />
                <Text style={styles.unsavedBadgeText}>Unsaved Changes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Matrix Grid Table */}
        <View style={styles.tableCard}>
          {/* Header */}
          <View style={styles.tableHeaderRow}>
            <View style={{ flex: 3.5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.columnHeader}>APPLICATION PAGE MODULE ({filteredPages.length})</Text>
            </View>

            {ACTIONS.map((act) => (
              <TouchableOpacity
                key={act}
                style={[styles.columnHeaderCell, { flex: 1 }]}
                onPress={() => toggleColumn(act)}
                accessibilityLabel={`Toggle all ${act}`}
              >
                <Text style={styles.columnHeader}>{act}</Text>
                <Feather name="check-square" size={12} color="#0284C7" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.columnHeaderCell, { flex: 0.9 }]}
              onPress={toggleAllVisible}
              accessibilityLabel="Toggle all actions"
            >
              <Text style={styles.columnHeader}>ALL</Text>
              <Feather name="toggle-left" size={13} color="#0284C7" />
            </TouchableOpacity>
          </View>

          {/* Rows */}
          {filteredPages.length === 0 ? (
            <View style={styles.emptyResultsBox}>
              <Feather name="search" size={28} color="#94A3B8" />
              <Text style={styles.emptyResultsText}>No application pages match the current filter.</Text>
            </View>
          ) : (
            filteredPages.map((page, idx) => {
              const rowAllChecked = ACTIONS.every((a) => matrix[page.id]?.[a]);
              const badgeStyle = ROLE_BADGE_COLORS[page.roleKey] || {
                bg: '#F1F5F9',
                text: '#475569',
                border: '#CBD5E1',
              };

              return (
                <View
                  key={page.id}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && styles.tableRowAlt,
                    rowAllChecked && styles.tableRowAllActive,
                  ]}
                >
                  {/* Page Module Info */}
                  <View style={{ flex: 3.5, paddingRight: spacing.sm }}>
                    <View style={styles.pageTitleRow}>
                      <Text style={styles.pageNameText}>{page.name}</Text>
                      <View
                        style={[
                          styles.roleBadgePill,
                          {
                            backgroundColor: badgeStyle.bg,
                            borderColor: badgeStyle.border,
                          },
                        ]}
                      >
                        <Text style={[styles.roleBadgePillText, { color: badgeStyle.text }]}>
                          {page.role}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.pageDescText} numberOfLines={1}>
                      {page.description}
                    </Text>
                    <Text style={styles.pageRouteMeta}>
                      Route: <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{page.route}</Text> · {page.category}
                    </Text>
                  </View>

                  {/* Actions Checkboxes */}
                  {ACTIONS.map((act) => {
                    const checked = !!matrix[page.id]?.[act];
                    return (
                      <TouchableOpacity
                        key={act}
                        style={styles.cellBtn}
                        onPress={() => toggleCell(page.id, act)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                          {checked && <Feather name="check" size={13} color={colors.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Row ALL Checkbox */}
                  <TouchableOpacity
                    style={styles.cellBtn}
                    onPress={() => toggleRow(page.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        styles.checkboxRowAll,
                        rowAllChecked && styles.checkboxRowAllChecked,
                      ]}
                    >
                      {rowAllChecked && <Feather name="check" size={13} color={colors.navyText} />}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Permission Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <View>
              <Text style={styles.summaryTitle}>
                PERMISSION SUMMARY — {selectedRole.name.toUpperCase()}
              </Text>
              <Text style={styles.summarySub}>
                {activeCount} of {totalPossible} total available permissions granted
              </Text>
            </View>
            <View style={styles.statCapsule}>
              <Text style={styles.statCapsuleText}>{activeCount} Active</Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
            {summaryList.length === 0 ? (
              <Text style={styles.summaryTextEmpty}>No active permissions configured for this role.</Text>
            ) : (
              summaryList.map((statement, idx) => (
                <View key={idx} style={styles.summaryRow}>
                  <Feather name="check-circle" size={13} color="#10B981" />
                  <Text style={styles.summaryText}>{statement}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Bottom Actions Bar */}
        <View style={styles.bottomActionsRow}>
          <TouchableOpacity
            style={[styles.saveConfigBtn, (!dirty || saving) && styles.saveConfigBtnDisabled]}
            disabled={!dirty || saving}
            onPress={handleSave}
          >
            <Feather name={saving ? 'loader' : 'save'} size={17} color={colors.navyText} />
            <Text style={styles.saveConfigBtnText}>
              {saving ? 'Saving...' : dirty ? 'Save Configuration' : 'Configuration Saved'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.auditTrailLink}
            onPress={() => setShowAuditModal(true)}
          >
            <Feather name="clock" size={14} color="#0284C7" />
            <Text style={styles.auditTrailLinkText}>View Audit Trail ({auditTrail.length})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Copy From Role Modal */}
      <Modal visible={copyModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.h2}>Copy Permissions From Role</Text>
              <TouchableOpacity onPress={() => setCopyModalOpen(false)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <Text style={typography.caption}>
              Select a source role. Its configured page permissions will be copied into{' '}
              <Text style={{ fontWeight: '700' }}>{selectedRole.name}</Text>:
            </Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {roles
                .filter((r) => r.id !== selectedRoleId)
                .map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.copyRoleOption}
                    onPress={() => handleCopyFromRole(r.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{r.name}</Text>
                      {Boolean(r.description) && (
                        <Text style={styles.dropdownItemDesc}>{r.description}</Text>
                      )}
                    </View>
                    <Feather name="arrow-right" size={16} color="#0284C7" />
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setCopyModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal visible={showAuditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={typography.h2}>Role Permission Audit Trail</Text>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <Text style={typography.caption}>
              Change history log for <Text style={{ fontWeight: '700' }}>{selectedRole.name}</Text>:
            </Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator>
              {auditTrail.length === 0 ? (
                <Text style={styles.summaryTextEmpty}>No recorded audit events for this role yet.</Text>
              ) : (
                auditTrail.map((a, i) => (
                  <View key={a.id || i} style={styles.auditEntryRow}>
                    <View style={styles.auditEntryDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.auditEntryTitle}>
                        {a.action} by <Text style={{ fontWeight: '700' }}>{a.user}</Text>
                      </Text>
                      <Text style={styles.auditEntryMeta}>
                        Target: {a.roleName} · {a.date}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowAuditModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  subHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  breadcrumbText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 60,
  },

  /* Controls Card */
  controlsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    zIndex: 50,
  },
  roleSelectorBox: {
    flex: 1,
    minWidth: 260,
    position: 'relative',
    zIndex: 60,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    backgroundColor: colors.bgCard,
  },
  dropdownBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    zIndex: 100,
    ...makeShadow(4, 12, 0.15, '0, 0, 0', 8),
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  dropdownItemTitleActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },

  presetsBox: {
    flexDirection: 'column',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    backgroundColor: colors.bgApp,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  presetBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  presetBtnTextDanger: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* Filter & Search Toolbar */
  filterToolbar: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
  },
  roleFilterStrip: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  roleFilterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleFilterTabActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  roleFilterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  roleFilterTabTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  filterMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  filterCountText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  unsavedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  unsavedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  /* Table Grid */
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...makeShadow(2, 6, 0.05, '0, 0, 0', 4),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  columnHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#FAFBFD',
  },
  tableRowAllActive: {
    backgroundColor: '#F0FDF4',
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  pageNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  roleBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  roleBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pageDescText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  pageRouteMeta: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  cellBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkboxRowAll: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  checkboxRowAllChecked: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },

  emptyResultsBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyResultsText: {
    fontSize: 13,
    color: colors.mutedText,
  },

  /* Summary Card */
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  summarySub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  statCapsule: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statCapsuleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  summaryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  summaryTextEmpty: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },

  /* Bottom Actions */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...makeShadow(2, 6, 0.1, '0, 0, 0', 3),
  },
  saveConfigBtnDisabled: {
    opacity: 0.6,
  },
  saveConfigBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 14,
  },
  auditTrailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  auditTrailLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    width: '100%',
    maxWidth: 440,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...makeShadow(8, 20, 0.2, '0, 0, 0', 10),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyRoleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  closeModalBtnText: {
    color: colors.mutedText,
    fontWeight: '700',
    fontSize: 13,
  },

  auditEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  auditEntryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
    marginTop: 5,
  },
  auditEntryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  auditEntryMeta: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
});