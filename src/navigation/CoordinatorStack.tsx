import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../types';
import CoordinatorDashboardScreen from '../screens/coordinator/CoordinatorDashboardScreen';
import LiveSessionMonitoringScreen from '../screens/coordinator/LiveSessionMonitoringScreen';
import SessionSummaryReviewScreen from '../screens/coordinator/SessionSummaryReviewScreen';
import CoordinatorStudentProgressScreen from '../screens/coordinator/CoordinatorStudentProgressScreen';
import CoordinatorScheduleScreen from '../screens/coordinator/CoordinatorScheduleScreen';
import CoordinatorParentCommunicationScreen from '../screens/coordinator/CoordinatorParentCommunicationScreen';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import StudentProfileScreen from '../screens/coordinator/StudentProfileScreen';
import StudentEditProfileScreen from '../screens/coordinator/StudentEditProfileScreen';
import WorkloadDashboardScreen from '../screens/coordinator/WorkloadDashboardScreen';
import RoomResourceSchedulingScreen from '../screens/coordinator/RoomResourceSchedulingScreen';
import CoordinatorNotificationsScreen from '../screens/notifications/CoordinatorNotificationsScreen';
import IupGenerationScreen from '../screens/programdirector/IupGenerationScreen';
import StudentEnrollmentWizardScreen from '../screens/coordinator/StudentEnrollmentWizardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';
import SessionDataCollectionScreen from '../screens/session/SessionDataCollectionScreen';
import AssessmentSummaryReportScreen from '../screens/programdirector/AssessmentSummaryReport';

import { ErrorBoundary } from '../components/ErrorBoundary';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedLiveSessionMonitoring = withModuleGuard(LiveSessionMonitoringScreen, 'sessions');
const GuardedSessionSummaryReview = withModuleGuard(SessionSummaryReviewScreen, 'sessions');
const GuardedCoordinatorStudentProgress = withModuleGuard(
  CoordinatorStudentProgressScreen,
  'reports',
);
const GuardedCoordinatorSchedule = withModuleGuard(CoordinatorScheduleScreen, 'staff');
const GuardedCoordinatorParentCommunication = withModuleGuard(
  CoordinatorParentCommunicationScreen,
  'parent_portal',
);
const GuardedStudentEnrollment = withModuleGuard(StudentEnrollmentScreen, 'students');
const GuardedStudentProfile = withModuleGuard(StudentProfileScreen, 'students');
const GuardedStudentEditProfile = withModuleGuard(StudentEditProfileScreen, 'students');
const GuardedWorkloadDashboard = withModuleGuard(WorkloadDashboardScreen, 'staff');
const GuardedRoomResourceScheduling = withModuleGuard(RoomResourceSchedulingScreen, 'staff');
const GuardedIupGeneration = withModuleGuard(IupGenerationScreen, 'iups');
const GuardedStudentEnrollmentWizard = withModuleGuard(StudentEnrollmentWizardScreen, 'students');
const GuardedAssessmentDashboard = withModuleGuard(AssessmentDashboardScreen, 'assessments');
const GuardedSessionDataCollection = withModuleGuard(SessionDataCollectionScreen, 'sessions');
const GuardedAssessmentSummaryReport = withModuleGuard(
  AssessmentSummaryReportScreen,
  'assessments',
);
const GuardedChildProgress = withModuleGuard(ChildProgressScreen, 'parent_portal');

const Stack = createNativeStackNavigator<CoordinatorStackParamList>();

export default function CoordinatorStack() {
  return (
    <ErrorBoundary screenName="Coordinator Navigator">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CoordinatorDashboard" component={CoordinatorDashboardScreen} />
        <Stack.Screen name="LiveSessionMonitoring" component={GuardedLiveSessionMonitoring} />
        <Stack.Screen name="SessionSummaryReview" component={GuardedSessionSummaryReview} />
        <Stack.Screen
          name="CoordinatorStudentProgress"
          component={GuardedCoordinatorStudentProgress}
        />
        <Stack.Screen name="CoordinatorSchedule" component={GuardedCoordinatorSchedule} />
        <Stack.Screen
          name="CoordinatorParentCommunication"
          component={GuardedCoordinatorParentCommunication}
        />
        <Stack.Screen name="StudentEnrollment" component={GuardedStudentEnrollment} />
        <Stack.Screen name="StudentProfile" component={GuardedStudentProfile} />
        <Stack.Screen name="StudentEditProfile" component={GuardedStudentEditProfile as never} />
        <Stack.Screen name="WorkloadDashboard" component={GuardedWorkloadDashboard} />
        <Stack.Screen name="RoomResourceScheduling" component={GuardedRoomResourceScheduling} />
        <Stack.Screen name="IupGeneration" component={GuardedIupGeneration} />
        <Stack.Screen name="Notifications" component={CoordinatorNotificationsScreen} />
        <Stack.Screen
          name="StudentEnrollmentWizard"
          component={GuardedStudentEnrollmentWizard as never}
        />
        <Stack.Screen name="AssessmentDashboard" component={GuardedAssessmentDashboard as never} />
        <Stack.Screen
          name="SessionDataCollection"
          component={GuardedSessionDataCollection as never}
        />
        <Stack.Screen
          name="AssessmentSummaryReport"
          component={GuardedAssessmentSummaryReport as never}
        />
        <Stack.Screen name="ChildProgress" component={GuardedChildProgress as never} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
