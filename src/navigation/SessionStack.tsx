import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SessionStackParamList } from '../types';

import TeacherDashboardScreen from '../screens/teacherdashboard/TeacherDashboardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';
import AssessmentSummaryReportScreen from '../screens/programdirector/AssessmentSummaryReport';
import AbcLogScreen from '../screens/abclog/AbcLogScreen';
import SessionDataCollectionScreen from '../screens/session/SessionDataCollectionScreen';
import DailyNotesScreen from '../screens/dailynotes/DailyNotesScreen';
import SessionNoteEditorScreen from '../screens/dailynotes/SessionNoteEditorScreen';
import GoalProgressScreen from '../screens/goalprogress/GoalProgressScreen';
import GoalMasteryCheckScreen from '../screens/goalmastery/GoalMasteryCheckScreen';
import { SessionSummaryScreen } from '../screens/sessionsummary/SessionSummaryScreen';
import AbllsNeedAnalysisMapScreen from '../screens/assessments/AbllsNeedAnalysisMapScreen';
import SkillsAssessmentScreen from '../screens/assessments/SkillsAssessmentScreen';
import BehaviorAssessmentScreen from '../screens/assessments/BehaviorAssessmentScreen';
import PreferenceAssessmentScreen from '../screens/assessments/PreferenceAssessmentScreen';
import SensoryAssessmentScreen from '../screens/assessments/SensoryAssessmentScreen';
import ParentCommunicationScreen from '../screens/parent/ParentCommunicationScreen';
import TeacherNotificationsScreen from '../screens/notifications/TeacherNotificationsScreen';
import StudentProfileScreen from '../screens/session/StudentProfileScreen';
import SocialSkillsAssessmentScreen from '../screens/assessments/SocialSkillsAssessmentScreen';
import StudentEnrollmentWizardScreen from '../screens/coordinator/StudentEnrollmentWizardScreen';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import IupGenerationScreen from '../screens/programdirector/IupGenerationScreen';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import GoalMasteryApprovalScreen from '../screens/director/GoalMasteryApprovalScreen';
// MR-39 Appointment & Session Management is now built as
// AppointmentFormModal, reached from the Scheduling Calendar (MR-38) -
// it doesn't need its own stack route since it's a modal, not a screen.

import { useAuth } from '../context/AuthContext';
import { ROLE_TABS, TEACHER_ROUTE_BY_TAB, getTabsForSession } from '../components/appNavConfig';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedAssessmentDashboard = withModuleGuard(AssessmentDashboardScreen, 'assessments');
const GuardedAssessmentSummaryReport = withModuleGuard(
  AssessmentSummaryReportScreen,
  'assessments',
);
const GuardedAbcLog = withModuleGuard(AbcLogScreen, 'behavior_incidents');
const GuardedSessionDataCollection = withModuleGuard(SessionDataCollectionScreen, 'sessions');
const GuardedDailyNotes = withModuleGuard(DailyNotesScreen, 'sessions');
const GuardedSessionNoteEditor = withModuleGuard(SessionNoteEditorScreen, 'sessions');
const GuardedGoalProgress = withModuleGuard(GoalProgressScreen, 'iups');
const GuardedGoalMasteryCheck = withModuleGuard(GoalMasteryCheckScreen, 'iups');
const GuardedSessionSummary = withModuleGuard(SessionSummaryScreen, 'sessions');
const GuardedSocialSkillsAssessment = withModuleGuard(SocialSkillsAssessmentScreen, 'assessments');
const GuardedSkillsAssessment = withModuleGuard(SkillsAssessmentScreen, 'assessments');
const GuardedAbllsNeedMap = withModuleGuard(AbllsNeedAnalysisMapScreen, 'assessments');
const GuardedBehaviorAssessment = withModuleGuard(BehaviorAssessmentScreen, 'assessments');
const GuardedPreferenceAssessment = withModuleGuard(PreferenceAssessmentScreen, 'assessments');
const GuardedSensoryAssessment = withModuleGuard(SensoryAssessmentScreen, 'assessments');
const GuardedParentCommunication = withModuleGuard(ParentCommunicationScreen, 'parent_portal');
const GuardedStudentProfile = withModuleGuard(StudentProfileScreen, 'students');
const GuardedStudentEnrollmentWizard = withModuleGuard(StudentEnrollmentWizardScreen, 'students');
const GuardedStudentEnrollment = withModuleGuard(StudentEnrollmentScreen, 'students');
const GuardedIupGeneration = withModuleGuard(IupGenerationScreen, 'iups');
const GuardedChildProgress = withModuleGuard(ChildProgressScreen, 'parent_portal');
const GuardedGoalMasteryApproval = withModuleGuard(GoalMasteryApprovalScreen, 'iups');

const Stack = createNativeStackNavigator<SessionStackParamList>();

export default function SessionStack() {
  const { session } = useAuth();
  const defaultTabs = ROLE_TABS[session?.role ?? 'teacher'] ?? [];
  const tabs = getTabsForSession(session, defaultTabs);
  const firstTab = tabs[0];
  const initialRoute = (firstTab && TEACHER_ROUTE_BY_TAB[firstTab]) || 'TeacherDashboard';

  return (
    <ErrorBoundary screenName="Session Navigator">
      <Stack.Navigator
        initialRouteName={initialRoute as keyof SessionStackParamList}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <Stack.Screen name="AssessmentDashboard" component={GuardedAssessmentDashboard} />
        <Stack.Screen name="AssessmentSummaryReport" component={GuardedAssessmentSummaryReport} />
        <Stack.Screen name="AbcLog" component={GuardedAbcLog} />
        <Stack.Screen name="SessionDataCollection" component={GuardedSessionDataCollection} />
        <Stack.Screen name="DailyNotes" component={GuardedDailyNotes} />
        <Stack.Screen name="SessionNoteEditor" component={GuardedSessionNoteEditor} />
        <Stack.Screen name="GoalProgress" component={GuardedGoalProgress} />
        <Stack.Screen name="GoalMasteryCheck" component={GuardedGoalMasteryCheck} />
        <Stack.Screen name="SessionSummary" component={GuardedSessionSummary} />
        <Stack.Screen name="SocialSkillsAssessment" component={GuardedSocialSkillsAssessment} />
        <Stack.Screen name="SkillsAssessment" component={GuardedSkillsAssessment} />
        <Stack.Screen name="AbllsNeedMap" component={GuardedAbllsNeedMap} />
        <Stack.Screen name="BehaviorAssessment" component={GuardedBehaviorAssessment} />
        <Stack.Screen name="PreferenceAssessment" component={GuardedPreferenceAssessment} />
        <Stack.Screen name="SensoryAssessment" component={GuardedSensoryAssessment} />
        <Stack.Screen name="ParentCommunication" component={GuardedParentCommunication} />
        <Stack.Screen name="Notifications" component={TeacherNotificationsScreen} />
        <Stack.Screen name="StudentProfile" component={GuardedStudentProfile} />
        <Stack.Screen
          name="StudentEnrollmentWizard"
          component={GuardedStudentEnrollmentWizard as never}
        />
        <Stack.Screen name="StudentEnrollment" component={GuardedStudentEnrollment as never} />
        <Stack.Screen name="IupGeneration" component={GuardedIupGeneration as never} />
        <Stack.Screen name="ChildProgress" component={GuardedChildProgress as never} />
        <Stack.Screen name="GoalMasteryApproval" component={GuardedGoalMasteryApproval as never} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
