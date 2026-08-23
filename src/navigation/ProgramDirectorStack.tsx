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
import StudentEnrollmentWizardScreen from '../screens/coordinator/StudentEnrollmentWizardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';

const Stack = createNativeStackNavigator<ProgramDirectorStackParamList>();

export default function ProgramDirectorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramDirectorDashboard" component={ProgramDirectorDashboardScreen} />
      <Stack.Screen name="AssessmentReview" component={AssessmentReviewScreen} />
      <Stack.Screen name="IupGeneration" component={IupGenerationScreen} />
      <Stack.Screen name="IupLibrary" component={IupLibraryScreen} />
      <Stack.Screen name="StudentCaseload" component={StudentCaseloadScreen} />
      <Stack.Screen name="GoalBankManagement" component={GoalBankManagementScreen} />
      <Stack.Screen name="GoalMasteryApproval" component={GoalMasteryApprovalScreen} />
      <Stack.Screen name="PdParentCommunication" component={ParentCommunicationScreen} />
      <Stack.Screen name="GraphChartView" component={GraphChartViewScreen} />
      <Stack.Screen name="StudentEnrollmentWizard" component={StudentEnrollmentWizardScreen} />
      <Stack.Screen name="AssessmentSummaryReport" component={AssessmentDashboardScreen as never} />
    </Stack.Navigator>
  );
}
