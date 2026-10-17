import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';
import { SCREEN_TO_MODULE, hasModuleAccess } from '../auth/permissions';
import {
  GLOBAL_ROUTE_BY_TAB,
  MODULE_DEFAULT_ROUTES,
  getTabsForSession,
} from '../components/appNavConfig';
import { RESOURCE_ALIAS_MAP } from '../screens/systemadmin/permissions/permissionTypes';
import type { AuthSession } from '../types';

// Admin screens
import StaffAccountManagementScreen from '../screens/systemadmin/StaffAccountManagementScreen';
import RoleManagementScreen from '../screens/systemadmin/RoleManagementScreen';
import PermissionConfigurationScreen from '../screens/systemadmin/PermissionConfigurationScreen';
import AuditLogScreen from '../screens/systemadmin/AuditLogScreen';
import FormBuilderScreen from '../screens/institutionaladmin/FormBuilderScreen';

// Institutional admin screens
import TrialLoggingFormatScreen from '../screens/institutionaladmin/TrialLoggingFormatScreen';
import AbcDropdownListsScreen from '../screens/institutionaladmin/AbcDropdownListsScreen';
import ScheduleCapacityConfigScreen from '../screens/institutionaladmin/ScheduleCapacityConfigScreen';
import GoalDomainDefinitionsScreen from '../screens/institutionaladmin/GoalDomainDefinitionsScreen';
import TaskAnalysisTemplatesScreen from '../screens/institutionaladmin/TaskAnalysisTemplatesScreen';

// Clinical & therapy screens
import TeacherDashboardScreen from '../screens/teacherdashboard/TeacherDashboardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';
import AssessmentSummaryReportScreen from '../screens/programdirector/AssessmentSummaryReport';
import AssessmentReviewScreen from '../screens/programdirector/AssessmentReviewScreen';
import AbcLogScreen from '../screens/abclog/AbcLogScreen';
import SessionDataCollectionScreen from '../screens/session/SessionDataCollectionScreen';
import DailyNotesScreen from '../screens/dailynotes/DailyNotesScreen';
import SessionNoteEditorScreen from '../screens/dailynotes/SessionNoteEditorScreen';
import { SessionSummaryScreen } from '../screens/sessionsummary/SessionSummaryScreen';
import LiveSessionMonitoringScreen from '../screens/coordinator/LiveSessionMonitoringScreen';
import SessionSummaryReviewScreen from '../screens/coordinator/SessionSummaryReviewScreen';
import GoalProgressScreen from '../screens/goalprogress/GoalProgressScreen';
import GoalMasteryCheckScreen from '../screens/goalmastery/GoalMasteryCheckScreen';
import GoalMasteryApprovalScreen from '../screens/director/GoalMasteryApprovalScreen';
import GoalBankManagementScreen from '../screens/programdirector/GoalBankManagementScreen';
import IupGenerationScreen from '../screens/programdirector/IupGenerationScreen';
import IupLibraryScreen from '../screens/programdirector/IupLibraryScreen';
import StudentEnrollmentWizardScreen from '../screens/coordinator/StudentEnrollmentWizardScreen';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import StudentProfileScreen from '../screens/session/StudentProfileScreen';
import StudentCaseloadScreen from '../screens/programdirector/StudentCaseloadScreen';
import SkillsAssessmentScreen from '../screens/assessments/SkillsAssessmentScreen';
import AbllsNeedAnalysisMapScreen from '../screens/assessments/AbllsNeedAnalysisMapScreen';
import BehaviorAssessmentScreen from '../screens/assessments/BehaviorAssessmentScreen';
import PreferenceAssessmentScreen from '../screens/assessments/PreferenceAssessmentScreen';
import SensoryAssessmentScreen from '../screens/assessments/SensoryAssessmentScreen';
import SocialSkillsAssessmentScreen from '../screens/assessments/SocialSkillsAssessmentScreen';

// Scheduling & operations
import DirectorSchedulingScreen from '../screens/director/DirectorSchedulingScreen';
import CoordinatorScheduleScreen from '../screens/coordinator/CoordinatorScheduleScreen';
import WorkloadDashboardScreen from '../screens/coordinator/WorkloadDashboardScreen';
import RoomResourceSchedulingScreen from '../screens/coordinator/RoomResourceSchedulingScreen';

// Reports & dashboards
import DirectorDashboardScreen from '../screens/director/DirectorDashboardScreen';
import CoordinatorDashboardScreen from '../screens/coordinator/CoordinatorDashboardScreen';
import ProgramDirectorDashboardScreen from '../screens/programdirector/ProgramDirectorDashboardScreen';
import ReportsOversightScreen from '../screens/director/ReportsOversightScreen';
import ReportBuilderScreen from '../screens/director/ReportBuilderScreen';
import GraphChartViewScreen from '../screens/programdirector/GraphChartViewScreen';
import DirectorStudentProgressScreen from '../screens/director/DirectorStudentProgressScreen';
import CoordinatorStudentProgressScreen from '../screens/coordinator/CoordinatorStudentProgressScreen';

// Parent portal
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ParentCommunicationScreen from '../screens/parent/ParentCommunicationScreen';
import CoordinatorParentCommunicationScreen from '../screens/coordinator/CoordinatorParentCommunicationScreen';
import DirectorParentCommunicationScreen from '../screens/director/DirectorParentCommunicationScreen';
import PdParentCommunicationScreen from '../screens/programdirector/PdParentCommunicationScreen';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import HomeObservationLogScreen from '../screens/parent/HomeObservationLogScreen';

// Notifications & pending
import TeacherNotificationsScreen from '../screens/notifications/TeacherNotificationsScreen';
import CustomRolePendingScreen from '../screens/auth/CustomRolePendingScreen';

const Stack = createNativeStackNavigator<any>();

// Guarded screens
const GuardedStaffAccountManagement = withModuleGuard(StaffAccountManagementScreen, 'admin');
const GuardedRoleManagement = withModuleGuard(RoleManagementScreen, 'admin');
const GuardedPermissionConfiguration = withModuleGuard(PermissionConfigurationScreen, 'admin');
const GuardedAuditLog = withModuleGuard(AuditLogScreen, 'admin');
const GuardedFormBuilder = withModuleGuard(FormBuilderScreen, 'admin');

const GuardedTrialLoggingFormat = withModuleGuard(TrialLoggingFormatScreen, 'sessions');
const GuardedAbcDropdownLists = withModuleGuard(AbcDropdownListsScreen, 'behavior_incidents');
const GuardedScheduleCapacityConfig = withModuleGuard(ScheduleCapacityConfigScreen, 'staff');
const GuardedGoalDomainDefinitions = withModuleGuard(GoalDomainDefinitionsScreen, 'iups');
const GuardedTaskAnalysisTemplates = withModuleGuard(TaskAnalysisTemplatesScreen, 'iups');

const GuardedAssessmentDashboard = withModuleGuard(AssessmentDashboardScreen, 'assessments');
const GuardedAssessmentSummaryReport = withModuleGuard(
  AssessmentSummaryReportScreen,
  'assessments',
);
const GuardedAssessmentReview = withModuleGuard(AssessmentReviewScreen, 'assessments');
const GuardedSkillsAssessment = withModuleGuard(SkillsAssessmentScreen, 'assessments');
const GuardedAbllsNeedMap = withModuleGuard(AbllsNeedAnalysisMapScreen, 'assessments');
const GuardedBehaviorAssessment = withModuleGuard(BehaviorAssessmentScreen, 'assessments');
const GuardedPreferenceAssessment = withModuleGuard(PreferenceAssessmentScreen, 'assessments');
const GuardedSensoryAssessment = withModuleGuard(SensoryAssessmentScreen, 'assessments');
const GuardedSocialSkillsAssessment = withModuleGuard(SocialSkillsAssessmentScreen, 'assessments');

const GuardedAbcLog = withModuleGuard(AbcLogScreen, 'behavior_incidents');
const GuardedSessionDataCollection = withModuleGuard(SessionDataCollectionScreen, 'sessions');
const GuardedDailyNotes = withModuleGuard(DailyNotesScreen, 'sessions');
const GuardedSessionNoteEditor = withModuleGuard(SessionNoteEditorScreen, 'sessions');
const GuardedSessionSummary = withModuleGuard(SessionSummaryScreen, 'sessions');
const GuardedLiveSessionMonitoring = withModuleGuard(LiveSessionMonitoringScreen, 'sessions');
const GuardedSessionSummaryReview = withModuleGuard(SessionSummaryReviewScreen, 'sessions');

const GuardedGoalProgress = withModuleGuard(GoalProgressScreen, 'iups');
const GuardedGoalMasteryCheck = withModuleGuard(GoalMasteryCheckScreen, 'iups');
const GuardedGoalMasteryApproval = withModuleGuard(GoalMasteryApprovalScreen, 'iups');
const GuardedGoalBankManagement = withModuleGuard(GoalBankManagementScreen, 'iups');
const GuardedIupGeneration = withModuleGuard(IupGenerationScreen, 'iups');
const GuardedIupLibrary = withModuleGuard(IupLibraryScreen, 'iups');

const GuardedStudentEnrollmentWizard = withModuleGuard(StudentEnrollmentWizardScreen, 'students');
const GuardedStudentEnrollment = withModuleGuard(StudentEnrollmentScreen, 'students');
const GuardedStudentProfile = withModuleGuard(StudentProfileScreen, 'students');
const GuardedStudentCaseload = withModuleGuard(StudentCaseloadScreen, 'students');

const GuardedDirectorScheduling = withModuleGuard(DirectorSchedulingScreen, 'staff');
const GuardedCoordinatorSchedule = withModuleGuard(CoordinatorScheduleScreen, 'staff');
const GuardedWorkloadDashboard = withModuleGuard(WorkloadDashboardScreen, 'staff');
const GuardedRoomResourceScheduling = withModuleGuard(RoomResourceSchedulingScreen, 'staff');

const GuardedReportsOversight = withModuleGuard(ReportsOversightScreen, 'reports');
const GuardedReportBuilder = withModuleGuard(ReportBuilderScreen, 'reports');
const GuardedGraphChartView = withModuleGuard(GraphChartViewScreen, 'reports');
const GuardedDirectorStudentProgress = withModuleGuard(DirectorStudentProgressScreen, 'reports');
const GuardedCoordinatorStudentProgress = withModuleGuard(
  CoordinatorStudentProgressScreen,
  'reports',
);

const GuardedParentCommunication = withModuleGuard(ParentCommunicationScreen, 'parent_portal');
const GuardedCoordinatorParentCommunication = withModuleGuard(
  CoordinatorParentCommunicationScreen,
  'parent_portal',
);
const GuardedDirectorParentCommunication = withModuleGuard(
  DirectorParentCommunicationScreen,
  'parent_portal',
);
const GuardedPdParentCommunication = withModuleGuard(PdParentCommunicationScreen, 'parent_portal');
const GuardedChildProgress = withModuleGuard(ChildProgressScreen, 'parent_portal');
const GuardedHomeObservationLog = withModuleGuard(HomeObservationLogScreen, 'parent_portal');

import { resolveInitialRouteForCustomRole } from '../components/appNavConfig';
export { resolveInitialRouteForCustomRole };

export default function CustomRoleStack() {
  const { session } = useAuth();
  const initialRoute = resolveInitialRouteForCustomRole(session);

  return (
    <ErrorBoundary screenName="Custom Role Navigator">
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="CustomRolePending"
          component={CustomRolePendingScreen as React.ComponentType<any>}
        />

        {/* Admin Screens */}
        <Stack.Screen
          name="StaffAccountManagement"
          component={GuardedStaffAccountManagement as React.ComponentType<any>}
        />
        <Stack.Screen
          name="RoleManagement"
          component={GuardedRoleManagement as React.ComponentType<any>}
        />
        <Stack.Screen
          name="PermissionConfiguration"
          component={GuardedPermissionConfiguration as React.ComponentType<any>}
        />
        <Stack.Screen name="AuditLog" component={GuardedAuditLog as React.ComponentType<any>} />
        <Stack.Screen
          name="FormBuilder"
          component={GuardedFormBuilder as React.ComponentType<any>}
        />

        {/* Institutional Admin Screens */}
        <Stack.Screen
          name="TrialLoggingFormat"
          component={GuardedTrialLoggingFormat as React.ComponentType<any>}
        />
        <Stack.Screen
          name="AbcDropdownLists"
          component={GuardedAbcDropdownLists as React.ComponentType<any>}
        />
        <Stack.Screen
          name="ScheduleCapacityConfig"
          component={GuardedScheduleCapacityConfig as React.ComponentType<any>}
        />
        <Stack.Screen
          name="GoalDomainDefinitions"
          component={GuardedGoalDomainDefinitions as React.ComponentType<any>}
        />
        <Stack.Screen
          name="TaskAnalysisTemplates"
          component={GuardedTaskAnalysisTemplates as React.ComponentType<any>}
        />

        {/* Clinical Assessment Screens */}
        <Stack.Screen
          name="AssessmentDashboard"
          component={GuardedAssessmentDashboard as React.ComponentType<any>}
        />
        <Stack.Screen
          name="AssessmentSummaryReport"
          component={GuardedAssessmentSummaryReport as React.ComponentType<any>}
        />
        <Stack.Screen
          name="AssessmentReview"
          component={GuardedAssessmentReview as React.ComponentType<any>}
        />
        <Stack.Screen
          name="SkillsAssessment"
          component={GuardedSkillsAssessment as React.ComponentType<any>}
        />
        <Stack.Screen
          name="AbllsNeedMap"
          component={GuardedAbllsNeedMap as React.ComponentType<any>}
        />
        <Stack.Screen
          name="BehaviorAssessment"
          component={GuardedBehaviorAssessment as React.ComponentType<any>}
        />
        <Stack.Screen
          name="PreferenceAssessment"
          component={GuardedPreferenceAssessment as React.ComponentType<any>}
        />
        <Stack.Screen
          name="SensoryAssessment"
          component={GuardedSensoryAssessment as React.ComponentType<any>}
        />
        <Stack.Screen
          name="SocialSkillsAssessment"
          component={GuardedSocialSkillsAssessment as React.ComponentType<any>}
        />

        {/* Sessions & Therapy */}
        <Stack.Screen
          name="SessionDataCollection"
          component={GuardedSessionDataCollection as React.ComponentType<any>}
        />
        <Stack.Screen name="DailyNotes" component={GuardedDailyNotes as React.ComponentType<any>} />
        <Stack.Screen
          name="SessionNoteEditor"
          component={GuardedSessionNoteEditor as React.ComponentType<any>}
        />
        <Stack.Screen
          name="SessionSummary"
          component={GuardedSessionSummary as React.ComponentType<any>}
        />
        <Stack.Screen
          name="LiveSessionMonitoring"
          component={GuardedLiveSessionMonitoring as React.ComponentType<any>}
        />
        <Stack.Screen
          name="SessionSummaryReview"
          component={GuardedSessionSummaryReview as React.ComponentType<any>}
        />
        <Stack.Screen name="AbcLog" component={GuardedAbcLog as React.ComponentType<any>} />

        {/* Goals & IUPs */}
        <Stack.Screen
          name="IupGeneration"
          component={GuardedIupGeneration as React.ComponentType<any>}
        />
        <Stack.Screen name="IupLibrary" component={GuardedIupLibrary as React.ComponentType<any>} />
        <Stack.Screen
          name="GoalProgress"
          component={GuardedGoalProgress as React.ComponentType<any>}
        />
        <Stack.Screen
          name="GoalMasteryCheck"
          component={GuardedGoalMasteryCheck as React.ComponentType<any>}
        />
        <Stack.Screen
          name="GoalMasteryApproval"
          component={GuardedGoalMasteryApproval as React.ComponentType<any>}
        />
        <Stack.Screen
          name="GoalBankManagement"
          component={GuardedGoalBankManagement as React.ComponentType<any>}
        />

        {/* Students & Caseload */}
        <Stack.Screen
          name="StudentEnrollmentWizard"
          component={GuardedStudentEnrollmentWizard as React.ComponentType<any>}
        />
        <Stack.Screen
          name="StudentEnrollment"
          component={GuardedStudentEnrollment as React.ComponentType<any>}
        />
        <Stack.Screen
          name="StudentProfile"
          component={GuardedStudentProfile as React.ComponentType<any>}
        />
        <Stack.Screen
          name="StudentCaseload"
          component={GuardedStudentCaseload as React.ComponentType<any>}
        />

        {/* Staff & Scheduling */}
        <Stack.Screen
          name="DirectorScheduling"
          component={GuardedDirectorScheduling as React.ComponentType<any>}
        />
        <Stack.Screen
          name="CoordinatorSchedule"
          component={GuardedCoordinatorSchedule as React.ComponentType<any>}
        />
        <Stack.Screen
          name="WorkloadDashboard"
          component={GuardedWorkloadDashboard as React.ComponentType<any>}
        />
        <Stack.Screen
          name="RoomResourceScheduling"
          component={GuardedRoomResourceScheduling as React.ComponentType<any>}
        />

        {/* Reports & Oversight */}
        <Stack.Screen
          name="ReportsOversight"
          component={GuardedReportsOversight as React.ComponentType<any>}
        />
        <Stack.Screen
          name="ReportBuilder"
          component={GuardedReportBuilder as React.ComponentType<any>}
        />
        <Stack.Screen
          name="GraphChartView"
          component={GuardedGraphChartView as React.ComponentType<any>}
        />
        <Stack.Screen
          name="DirectorStudentProgress"
          component={GuardedDirectorStudentProgress as React.ComponentType<any>}
        />
        <Stack.Screen
          name="CoordinatorStudentProgress"
          component={GuardedCoordinatorStudentProgress as React.ComponentType<any>}
        />

        {/* Parent Portal */}
        <Stack.Screen
          name="ParentCommunication"
          component={GuardedParentCommunication as React.ComponentType<any>}
        />
        <Stack.Screen
          name="CoordinatorParentCommunication"
          component={GuardedCoordinatorParentCommunication as React.ComponentType<any>}
        />
        <Stack.Screen
          name="DirectorParentCommunication"
          component={GuardedDirectorParentCommunication as React.ComponentType<any>}
        />
        <Stack.Screen
          name="PdParentCommunication"
          component={GuardedPdParentCommunication as React.ComponentType<any>}
        />
        <Stack.Screen
          name="ChildProgress"
          component={GuardedChildProgress as React.ComponentType<any>}
        />
        <Stack.Screen
          name="HomeObservationLog"
          component={GuardedHomeObservationLog as React.ComponentType<any>}
        />

        {/* Role Dashboards (Available only if configured) */}
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboardScreen as React.ComponentType<any>}
        />
        <Stack.Screen
          name="CoordinatorDashboard"
          component={CoordinatorDashboardScreen as React.ComponentType<any>}
        />
        <Stack.Screen
          name="ProgramDirectorDashboard"
          component={ProgramDirectorDashboardScreen as React.ComponentType<any>}
        />
        <Stack.Screen
          name="DirectorDashboard"
          component={DirectorDashboardScreen as React.ComponentType<any>}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboardScreen as React.ComponentType<any>}
        />

        {/* Utilities */}
        <Stack.Screen
          name="Notifications"
          component={TeacherNotificationsScreen as React.ComponentType<any>}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
