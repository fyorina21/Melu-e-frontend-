// src/auth/permissions.ts

import type { ActionKey, ModuleId, PermissionMap } from '../types/auth';
import { RESOURCE_ALIAS_MAP } from '../screens/systemadmin/permissions/permissionTypes';

/**
 * Parse the flat string[] from the backend into a structured PermissionMap.
 *
 * Accepted formats:
 *   "sessions:view"             → resource=sessions, action=view
 *   "students:create"           → resource=students, action=create
 *   "behavior_incidents:delete" → resource=behavior_incidents, action=delete
 *
 * Unknown resources are normalized via RESOURCE_ALIAS_MAP (e.g., "trials:view" → "sessions:view").
 */
export function parsePermissions(raw: string[] | undefined): PermissionMap {
  const map: PermissionMap = {};
  if (!raw || !Array.isArray(raw)) return map;

  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const [rawResource, rawAction] = entry.toLowerCase().split(':');
    if (!rawResource || !rawAction) continue;

    const resource = RESOURCE_ALIAS_MAP[rawResource] ?? rawResource;
    const action = normalizeAction(rawAction);
    if (!action) continue;

    if (!map[resource]) map[resource] = new Set<ActionKey>();
    map[resource].add(action);
  }
  return map;
}

export function normalizeAction(raw: string): ActionKey | null {
  switch (raw.trim().toLowerCase()) {
    case 'view':
    case 'index':
    case 'show':
    case 'read':
      return 'view';
    case 'create':
      return 'create';
    case 'edit':
    case 'update':
    case 'manage':
      return 'edit';
    case 'delete':
    case 'destroy':
      return 'delete';
    case 'approve':
    case 'update_status':
      return 'approve';
    default:
      return null;
  }
}

/** Check if a specific action is granted on a resource. */
export function hasPermission(
  map: PermissionMap | undefined,
  resource: string,
  action: ActionKey,
): boolean {
  if (!map) return false;
  const canonical = RESOURCE_ALIAS_MAP[resource] ?? resource;
  return map[canonical]?.has(action) ?? false;
}

/** Check if ANY action is granted for a module (i.e., the module is accessible). */
export function hasModuleAccess(modules: string[] | undefined, moduleId: ModuleId): boolean {
  if (!modules || modules.length === 0) return false;
  return modules.some((m) => m.toLowerCase() === moduleId.toLowerCase());
}

/**
 * SCREEN_TO_MODULE: maps every registered screen name to the module
 * that must be granted for that screen to be accessible.
 *
 * Screens not listed here are considered "unguarded" — they are either
 * public (Login, ForgotPassword), always-accessible (Dashboards), or
 * utility screens (Notifications).
 */
export const SCREEN_TO_MODULE: Record<string, ModuleId> = {
  // ── Students / Enrollment ──
  StudentEnrollmentWizard: 'students',
  StudentEnrollment: 'students',
  StudentProfile: 'students',
  StudentCaseload: 'students',

  // ── Clinical Assessments ──
  AssessmentDashboard: 'assessments',
  AssessmentSummaryReport: 'assessments',
  SkillsAssessment: 'assessments',
  AbllsNeedMap: 'assessments',
  BehaviorAssessment: 'assessments',
  PreferenceAssessment: 'assessments',
  SensoryAssessment: 'assessments',
  SocialSkillsAssessment: 'assessments',
  AssessmentReview: 'assessments',

  // ── IUP & Goal Management ──
  IupGeneration: 'iups',
  IupLibrary: 'iups',
  GoalProgress: 'iups',
  GoalMasteryCheck: 'iups',
  GoalMasteryApproval: 'iups',
  GoalBankManagement: 'iups',
  GoalDomainDefinitions: 'iups',
  TaskAnalysisTemplates: 'iups',

  // ── Daily Active Therapy ──
  SessionDataCollection: 'sessions',
  DailyNotes: 'sessions',
  SessionNoteEditor: 'sessions',
  SessionSummary: 'sessions',
  LiveSessionMonitoring: 'sessions',
  SessionSummaryReview: 'sessions',
  TrialLoggingFormat: 'sessions',

  // ── Behavior & ABC Logging ──
  AbcLog: 'behavior_incidents',
  AbcDropdownLists: 'behavior_incidents',

  // ── Staff & Scheduling ──
  DirectorScheduling: 'staff',
  CoordinatorSchedule: 'staff',
  WorkloadDashboard: 'staff',
  RoomResourceScheduling: 'staff',
  ScheduleCapacityConfig: 'staff',

  // ── Reports & Oversight ──
  ReportsOversight: 'reports',
  ReportBuilder: 'reports',
  GraphChartView: 'reports',
  DirectorStudentProgress: 'reports',
  CoordinatorStudentProgress: 'reports',

  // ── Parent Portal ──
  ParentCommunication: 'parent_portal',
  CoordinatorParentCommunication: 'parent_portal',
  DirectorParentCommunication: 'parent_portal',
  PdParentCommunication: 'parent_portal',
  ChildProgress: 'parent_portal',
  HomeObservationLog: 'parent_portal',

  // ── System & Clinical Admin ──
  StaffAccountManagement: 'admin',
  RoleManagement: 'admin',
  PermissionConfiguration: 'admin',
  AuditLog: 'admin',
  FormBuilder: 'admin',
};

/** Screens that are always accessible (no module check needed). */
export const UNGUARDED_SCREENS = new Set([
  'Login',
  'ForgotPassword',
  // Role dashboards — always accessible once authenticated
  'TeacherDashboard',
  'CoordinatorDashboard',
  'DirectorDashboard',
  'ProgramDirectorDashboard',
  'ParentDashboard',
  'SystemAdminDashboard',
  // Notifications — cross-cutting, not module-bound
  'Notifications',
]);
