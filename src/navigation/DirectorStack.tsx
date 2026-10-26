import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DirectorStackParamList } from '../types';

import DirectorDashboardScreen from '../screens/director/DirectorDashboardScreen';
import DirectorSchedulingScreen from '../screens/director/DirectorSchedulingScreen';
import GoalMasteryApprovalScreen from '../screens/director/GoalMasteryApprovalScreen';
import DirectorParentCommunicationScreen from '../screens/director/DirectorParentCommunicationScreen';
import ReportsOversightScreen from '../screens/director/ReportsOversightScreen';
import DirectorStudentProgressScreen from '../screens/director/DirectorStudentProgressScreen';
import ReportBuilderScreen from '../screens/director/ReportBuilderScreen';
import AssessmentSummaryReportScreen from '../screens/programdirector/AssessmentSummaryReport';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import StudentProfileScreen from '../screens/coordinator/StudentProfileScreen';
import StudentEditProfileScreen from '../screens/coordinator/StudentEditProfileScreen';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedDirectorScheduling = withModuleGuard(DirectorSchedulingScreen, 'staff');
const GuardedGoalMasteryApproval = withModuleGuard(GoalMasteryApprovalScreen, 'iups');
const GuardedDirectorParentCommunication = withModuleGuard(
  DirectorParentCommunicationScreen,
  'parent_portal',
);
const GuardedReportsOversight = withModuleGuard(ReportsOversightScreen, 'reports');
const GuardedDirectorStudentProgress = withModuleGuard(DirectorStudentProgressScreen, 'reports');
const GuardedReportBuilder = withModuleGuard(ReportBuilderScreen, 'reports');
const GuardedAssessmentSummaryReport = withModuleGuard(
  AssessmentSummaryReportScreen,
  'assessments',
);
const GuardedStudentEnrollment = withModuleGuard(StudentEnrollmentScreen, 'students');
const GuardedStudentProfile = withModuleGuard(StudentProfileScreen, 'students');
const GuardedStudentEditProfile = withModuleGuard(StudentEditProfileScreen, 'students');

const Stack = createNativeStackNavigator<DirectorStackParamList>();

export default function DirectorStack() {
  return (
    <ErrorBoundary screenName="Director Navigator">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="DirectorDashboard" component={DirectorDashboardScreen} />

        <Stack.Screen name="DirectorScheduling" component={GuardedDirectorScheduling} />

        <Stack.Screen name="GoalMasteryApproval" component={GuardedGoalMasteryApproval} />

        <Stack.Screen
          name="DirectorParentCommunication"
          component={GuardedDirectorParentCommunication}
        />

        <Stack.Screen name="ReportsOversight" component={GuardedReportsOversight} />

        <Stack.Screen name="DirectorStudentProgress" component={GuardedDirectorStudentProgress} />

        <Stack.Screen name="ReportBuilder" component={GuardedReportBuilder} />

        <Stack.Screen
          name="AssessmentSummaryReport"
          component={GuardedAssessmentSummaryReport as never}
        />

        <Stack.Screen name="StudentEnrollment" component={GuardedStudentEnrollment as never} />

        <Stack.Screen name="StudentProfile" component={GuardedStudentProfile as never} />

        <Stack.Screen name="StudentEditProfile" component={GuardedStudentEditProfile as never} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
