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

const Stack = createNativeStackNavigator<DirectorStackParamList>();

export default function DirectorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DirectorDashboard"
        component={DirectorDashboardScreen}
      />

      <Stack.Screen
        name="DirectorScheduling"
        component={DirectorSchedulingScreen}
      />

      <Stack.Screen
        name="GoalMasteryApproval"
        component={GoalMasteryApprovalScreen}
      />

      <Stack.Screen
        name="DirectorParentCommunication"
        component={DirectorParentCommunicationScreen}
      />

      <Stack.Screen
        name="ReportsOversight"
        component={ReportsOversightScreen}
      />

      <Stack.Screen
        name="DirectorStudentProgress"
        component={DirectorStudentProgressScreen}
      />

      <Stack.Screen
        name="ReportBuilder"
        component={ReportBuilderScreen}
      />
    </Stack.Navigator>
  );
}