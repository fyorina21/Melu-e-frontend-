import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProgramDirectorStackParamList } from '../types';
import ProgramDirectorDashboardScreen from '../screens/programdirector/ProgramDirectorDashboardScreen';
import AssessmentReviewScreen from '../screens/programdirector/AssessmentReviewScreen';
import IupGenerationScreen from '../screens/programdirector/IupGenerationScreen';
import IupLibraryScreen from '../screens/programdirector/IupLibraryScreen';
import StudentCaseloadScreen from '../screens/programdirector/StudentCaseloadScreen';
import GoalBankManagementScreen from '../screens/programdirector/GoalBankManagementScreen';
import ParentCommunicationScreen from '../screens/parent/ParentCommunicationScreen';
import GraphChartViewScreen from '../screens/programdirector/GraphChartViewScreen';
import GoalMasteryApprovalScreen from '../screens/director/GoalMasteryApprovalScreen';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import StudentProfileScreen from '../screens/coordinator/StudentProfileScreen';
import StudentEnrollmentWizardScreen from '../screens/coordinator/StudentEnrollmentWizardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';
import AssessmentSummaryReportScreen from '../screens/programdirector/AssessmentSummaryReport';
import SessionDataCollectionScreen from '../screens/session/SessionDataCollectionScreen';
import GoalDomainDefinitionsScreen from '../screens/institutionaladmin/GoalDomainDefinitionsScreen';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedAssessmentReview = withModuleGuard(AssessmentReviewScreen, 'assessments');
const GuardedIupGeneration = withModuleGuard(IupGenerationScreen, 'iups');
const GuardedIupLibrary = withModuleGuard(IupLibraryScreen, 'iups');
const GuardedStudentCaseload = withModuleGuard(StudentCaseloadScreen, 'students');
const GuardedGoalBankManagement = withModuleGuard(GoalBankManagementScreen, 'iups');
const GuardedGoalMasteryApproval = withModuleGuard(GoalMasteryApprovalScreen, 'iups');
const GuardedPdParentCommunication = withModuleGuard(ParentCommunicationScreen, 'parent_portal');
const GuardedGraphChartView = withModuleGuard(GraphChartViewScreen, 'reports');
const GuardedStudentEnrollmentWizard = withModuleGuard(StudentEnrollmentWizardScreen, 'students');
const GuardedAssessmentSummaryReport = withModuleGuard(
  AssessmentSummaryReportScreen,
  'assessments',
);
const GuardedAssessmentDashboard = withModuleGuard(AssessmentDashboardScreen, 'assessments');
const GuardedSessionDataCollection = withModuleGuard(SessionDataCollectionScreen, 'sessions');
const GuardedStudentEnrollment = withModuleGuard(StudentEnrollmentScreen, 'students');
const GuardedStudentProfile = withModuleGuard(StudentProfileScreen, 'students');
const GuardedGoalDomainDefinitions = withModuleGuard(GoalDomainDefinitionsScreen, 'iups');

const Stack = createNativeStackNavigator<ProgramDirectorStackParamList>();

export default function ProgramDirectorStack() {
  return (
    <ErrorBoundary screenName="Program Director Navigator">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProgramDirectorDashboard" component={ProgramDirectorDashboardScreen} />
        <Stack.Screen name="AssessmentReview" component={GuardedAssessmentReview} />
        <Stack.Screen name="IupGeneration" component={GuardedIupGeneration} />
        <Stack.Screen name="IupLibrary" component={GuardedIupLibrary} />
        <Stack.Screen name="StudentCaseload" component={GuardedStudentCaseload} />
        <Stack.Screen name="GoalBankManagement" component={GuardedGoalBankManagement} />
        <Stack.Screen name="GoalMasteryApproval" component={GuardedGoalMasteryApproval} />
        <Stack.Screen name="PdParentCommunication" component={GuardedPdParentCommunication} />
        <Stack.Screen name="GraphChartView" component={GuardedGraphChartView} />
        <Stack.Screen name="StudentEnrollment" component={GuardedStudentEnrollment as never} />
        <Stack.Screen name="StudentProfile" component={GuardedStudentProfile as never} />
        <Stack.Screen name="StudentEnrollmentWizard" component={GuardedStudentEnrollmentWizard} />
        <Stack.Screen
          name="AssessmentSummaryReport"
          component={GuardedAssessmentSummaryReport as never}
        />
        <Stack.Screen name="AssessmentDashboard" component={GuardedAssessmentDashboard as never} />
        <Stack.Screen
          name="SessionDataCollection"
          component={GuardedSessionDataCollection as never}
        />
        <Stack.Screen
          name="GoalDomainDefinitions"
          component={GuardedGoalDomainDefinitions as never}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
