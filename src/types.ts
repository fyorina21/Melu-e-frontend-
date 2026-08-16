// types.ts
//
// Shared TypeScript types for the Melu'e Foundation app: auth roles and
// accounts, domain models used across the screens, and the React
// Navigation param lists for every role stack.

import type { ComponentProps } from 'react';
import type { Feather } from '@expo/vector-icons';

// Icon name union for the Feather icon set (used by screens that look up
// an icon name from data rather than hard-coding it in JSX).
export type FeatherIconName = ComponentProps<typeof Feather>['name'];

// ---- Auth ----

export type QueryParams = Record<string, unknown>;
export type Payload = Record<string, unknown>;

export type Role =
  | 'teacher'
  | 'coordinator'
  | 'director'
  | 'program_director'
  | 'institutional_admin'
  | 'system_admin'
  | 'parent';

export interface DemoAccount {
  role: Role;
  label: string;
  email: string;
  userName: string;
}

export interface AuthSession {
  role: Role;
  userName: string;
  email?: string;
}

// ---- Domain models ----

export type PromptLevel = 'FP' | 'PP' | 'G' | 'INDEPENDENT';

export interface Trial {
  promptLevel: string;
  timestamp: string;
}

export interface TaskAnalysisStep {
  id: string;
  description: string;
  successCount: number;
  totalTrials: number;
  independencePercent: number;
}

export interface Goal {
  id: string;
  name: string;
  category?: string;
  goalType?: string;
  independencePercent?: number;
  totalTrials?: number;
  promptBreakdown?: Record<string, number>;
  trialLog?: Trial[];
  overallMasteryStatus?: string;
  steps?: TaskAnalysisStep[];
}

export interface Student {
  id: string;
  name: string;
  initial?: string;
  program?: string;
  active?: boolean;
  goals: Goal[];
  trials?: Trial[];
}

export interface SessionRoster {
  teacherName: string;
  stationName: string;
  roomName: string;
  blockDurationMinutes?: number;
  students: Student[];
}

export interface SessionIncident {
  time: string;
  behavior: string;
  studentName: string;
}

export interface SessionSummaryStudent {
  id: string;
  name: string;
  goals: Goal[];
}

export interface SessionSummary {
  stationName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  students: SessionSummaryStudent[];
  incidents: SessionIncident[];
}

// ---- Navigation param lists (one per role stack) ----

export type SessionStackParamList = {
  TeacherDashboard: undefined;
  AssessmentDashboard: undefined;
  SkillsAssessment: { studentId: string };
  AbllsNeedMap: { studentId: string };
  BehaviorAssessment: { studentId: string };
  PreferenceAssessment: { studentId: string };
  SensoryAssessment: { studentId: string };
  AbcLog: undefined;
  SessionDataCollection: { sessionId?: string } | undefined;
  DailyNotes: undefined;
  SessionNoteEditor: { sessionId: string; mode: 'view' | 'edit' };
  GoalProgress: { studentId: string; goalId: string };
  SchedulingCalendar: undefined;
  Attendance: { sessionId?: string } | undefined;
  GoalMasteryCheck: { studentId: string; goalId: string };
  SessionSummary: { sessionId: string };
  TeacherParentCommunication: undefined;
  Notifications: undefined;
  StudentProfile: { studentId: string };
};

export type CoordinatorStackParamList = {
  CoordinatorDashboard: undefined;
  LiveSessionMonitoring: undefined;
  SessionSummaryReview: undefined;
  CoordinatorStudentProgress: undefined;
  CoordinatorSchedule: undefined;
  CoordinatorParentCommunication: undefined;
  StudentEnrollment: undefined;
  StudentEnrollmentWizard: undefined;
  StudentProfile: { studentId: string };
  WorkloadDashboard: undefined;
  RoomResourceScheduling: undefined;
  IupGeneration: { studentId?: string } | undefined;
  Notifications: undefined;
};

export type DirectorStackParamList = {
  DirectorDashboard: undefined;
  DirectorScheduling: undefined;
  GoalMasteryApproval: undefined;
  DirectorParentCommunication: undefined;
  ReportsOversight: undefined;
  DirectorStudentProgress: undefined;
  ReportBuilder: undefined;
};

export type ProgramDirectorStackParamList = {
  ProgramDirectorDashboard: undefined;
  AssessmentReview: undefined;
  IupGeneration: { studentId?: string } | undefined;
  IupLibrary: undefined;
  StudentCaseload: undefined;
  GoalBankManagement: undefined;
  GoalMasteryApproval: undefined;
  PdParentCommunication: undefined;
  GraphChartView: undefined;
  StudentEnrollmentWizard: undefined;
};

export type InstitutionalAdminStackParamList = {
  AdminPanelOverview: { panel?: 'clinical' | 'system' } | undefined;
  FormBuilder: undefined;
  TrialLoggingFormat: undefined;
  AbcDropdownLists: undefined;
  ScheduleCapacityConfig: undefined;
  GoalDomainDefinitions: undefined;
  TaskAnalysisTemplates: undefined;
  ClinicInfoConfig: undefined;
  WorkingHoursConfig: undefined;
  SchoolSettingsConfig: undefined;
  ClinicalCategoriesConfig: undefined;
};

export type SystemAdminStackParamList = {
  AdminPanelOverview: { panel?: 'clinical' | 'system' } | undefined;
  StaffAccountManagement: undefined;
  RoleManagement: undefined;
  PermissionConfiguration: undefined;
  AuditLog: undefined;
};

export type ParentStackParamList = {
  ParentDashboard: undefined;
  ChildProgress: undefined;
  HomeObservationLog: undefined;
  ParentCommunication: undefined;
  ParentReports: undefined;
  Notifications: undefined;
};
