import type { IncidentPayload } from './domain';

export type SessionStackParamList = {
  TeacherDashboard: undefined;
  AssessmentDashboard: undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
  SkillsAssessment: { studentId: string };
  AbllsNeedMap: { studentId: string };
  BehaviorAssessment: { studentId: string };
  PreferenceAssessment: { studentId: string };
  SensoryAssessment: { studentId: string };
  AbcLog: undefined;
  SessionDataCollection: { sessionId?: string } | undefined;
  DailyNotes: { studentId?: string };
  SessionNoteEditor: { sessionId: string; mode: 'view' | 'edit' };
  GoalProgress: { studentId: string; goalId: string };
  SchedulingCalendar: undefined;
  Attendance: { sessionId?: string } | undefined;
  GoalMasteryCheck: { studentId: string; goalId: string };
  SessionSummary: { sessionId: string; localIncidents?: IncidentPayload[] };
  SocialSkillsAssessment: { studentId: string };
  TeacherParentCommunication: undefined;
  ParentCommunication: undefined;
  Notifications: undefined;
  StudentProfile: { studentId: string };
  StudentEnrollmentWizard: undefined;
  IupGeneration: { studentId?: string } | undefined;
  ChildProgress?: undefined;
};

export type CoordinatorStackParamList = {
  CoordinatorDashboard: undefined;
  LiveSessionMonitoring: undefined;
  SessionSummaryReview: undefined;
  CoordinatorStudentProgress: undefined;
  CoordinatorSchedule: undefined;
  CoordinatorParentCommunication: undefined;
  StudentEnrollment: undefined;
  StudentProfile: { studentId?: string } | undefined;
  WorkloadDashboard: undefined;
  RoomResourceScheduling: undefined;
  IupGeneration: { studentId?: string } | undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
  Notifications: undefined;
  StudentEnrollmentWizard: undefined;
  AssessmentDashboard: undefined;
  SessionDataCollection: { sessionId?: string } | undefined;
  ChildProgress?: undefined;
};

export type DirectorStackParamList = {
  DirectorDashboard: undefined;
  DirectorScheduling: undefined;
  GoalMasteryApproval: undefined;
  DirectorParentCommunication: undefined;
  ReportsOversight: undefined;
  DirectorStudentProgress: undefined;
  ReportBuilder: undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
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
  GraphChartView: { studentId?: string; goalIds?: string[] } | undefined;
  StudentEnrollmentWizard: undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
  AssessmentDashboard: undefined;
  SessionDataCollection: { sessionId?: string } | undefined;
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
  BehaviorAssessment?: { studentId?: string };
  PreferenceAssessment?: { studentId?: string };
  SensoryAssessment?: { studentId?: string };
};

export type SystemAdminStackParamList = {
  AdminPanelOverview: { panel?: 'clinical' | 'system' } | undefined;
  FormBuilder: undefined;
  StaffAccountManagement: undefined;
  RoleManagement: undefined;
  PermissionConfiguration: undefined;
  AuditLog: undefined;
  BehaviorAssessment?: { studentId?: string };
  PreferenceAssessment?: { studentId?: string };
  SensoryAssessment?: { studentId?: string };
};

export type ParentStackParamList = {
  ParentDashboard: undefined;
  ChildProgress: undefined;
  HomeObservationLog: undefined;
  ParentCommunication: undefined;
  Notifications: undefined;
};
