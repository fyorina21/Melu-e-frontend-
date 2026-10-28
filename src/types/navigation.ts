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
  SessionDataCollection: { sessionId?: string; students?: any[]; teacherId?: string } | undefined;
  DailyNotes: { studentId?: string };
  SessionNoteEditor: { sessionId: string; mode: 'view' | 'edit' };
  GoalProgress: { studentId: string; goalId: string };
  SchedulingCalendar: undefined;
  Attendance: { sessionId?: string } | undefined;
  GoalMasteryCheck: { studentId: string; goalId: string };
  SessionSummary: { sessionId: string; localIncidents?: IncidentPayload[]; students?: any[] };
  SocialSkillsAssessment: { studentId: string };
  TeacherParentCommunication: undefined;
  ParentCommunication: undefined;
  Notifications: undefined;
  StudentProfile: { studentId: string };
  StudentEditProfile: { studentId?: string } | undefined;
  StudentEnrollmentWizard: { draftId?: string } | undefined;
  StudentEnrollment?: undefined;

  IupGeneration: { studentId?: string } | undefined;
  GoalMasteryApproval?: undefined;
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
  StudentEditProfile: { studentId?: string } | undefined;
  WorkloadDashboard: undefined;
  RoomResourceScheduling: undefined;
  IupGeneration: { studentId?: string } | undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
  Notifications: undefined;
  StudentEnrollmentWizard: { draftId?: string } | undefined;
  AssessmentDashboard: undefined;
  SessionDataCollection: { sessionId?: string; students?: any[]; teacherId?: string } | undefined;
  ChildProgress?: undefined;
};

export type DirectorStackParamList = {
  DirectorDashboard: undefined;
  DirectorScheduling: undefined;
  GoalMasteryApproval: undefined;
  DirectorParentCommunication: undefined;
  ReportsOversight: undefined;
  DirectorStudentProgress: { studentId?: string } | undefined;
  ReportBuilder: undefined;
  StudentEnrollment?: undefined;
  StudentEnrollmentWizard?: undefined;
  StudentProfile?: { studentId?: string } | undefined;

  AssessmentSummaryReport?: { studentId?: string } | undefined;
  StudentEditProfile: { studentId?: string } | undefined;
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
  StudentEnrollment?: undefined;
  StudentProfile: { studentId?: string } | undefined;
  StudentEditProfile: { studentId?: string } | undefined;
  StudentEnrollmentWizard: { draftId?: string } | undefined;
  AssessmentSummaryReport?: { studentId?: string } | undefined;
  AssessmentDashboard: undefined;
  SessionDataCollection: { sessionId?: string; students?: any[]; teacherId?: string } | undefined;
  GoalDomainDefinitions?: undefined;
  ReportsOversight?: undefined;
  SessionSummaryReview?: undefined;
};

export type InstitutionalAdminStackParamList = {
  FormBuilder: undefined;
  TrialLoggingFormat: undefined;
  AbcDropdownLists: undefined;
  ScheduleCapacityConfig: undefined;
  GoalDomainDefinitions: { defaultSection?: 'domains' | 'goals' | 'templates' } | undefined;
  TaskAnalysisTemplates: { defaultSection?: 'domains' | 'goals' | 'templates' } | undefined;
};

export type SystemAdminStackParamList = {
  StaffAccountManagement: undefined;
  RoleManagement: undefined;
  PermissionConfiguration: { roleId?: string } | undefined;
  AuditLog: undefined;
};

export type ParentStackParamList = {
  ParentDashboard: undefined;
  ChildProgress: undefined;
  HomeObservationLog: undefined;
  ParentCommunication: undefined;
  Notifications: undefined;
};
