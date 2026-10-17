import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../types';
import {
  FormBuilderScreen,
  TrialLoggingFormatScreen,
  AbcDropdownListsScreen,
  ScheduleCapacityConfigScreen,
  GoalDomainDefinitionsScreen,
  TaskAnalysisTemplatesScreen,
} from '../screens/institutionaladmin';
import { ErrorBoundary, withErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const Stack = createNativeStackNavigator<InstitutionalAdminStackParamList>();

const SafeFormBuilder = withModuleGuard(
  withErrorBoundary(FormBuilderScreen, 'Form Builder'),
  'admin',
);
const SafeTrialLoggingFormat = withModuleGuard(
  withErrorBoundary(TrialLoggingFormatScreen, 'Trial Logging Format'),
  'sessions',
);
const SafeAbcDropdownLists = withModuleGuard(
  withErrorBoundary(AbcDropdownListsScreen, 'ABC Dropdown Lists'),
  'behavior_incidents',
);
const SafeScheduleCapacityConfig = withModuleGuard(
  withErrorBoundary(ScheduleCapacityConfigScreen, 'Session Schedule & Capacity'),
  'staff',
);
const SafeGoalDomainDefinitions = withModuleGuard(
  withErrorBoundary(GoalDomainDefinitionsScreen, 'Goal Domains & Task Analysis'),
  'iups',
);
const SafeTaskAnalysisTemplates = withModuleGuard(
  withErrorBoundary(TaskAnalysisTemplatesScreen, 'Task Analysis Templates'),
  'iups',
);

export default function InstitutionalAdminStack() {
  return (
    <ErrorBoundary screenName="Institutional Admin Navigator">
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FormBuilder">
        <Stack.Screen name="FormBuilder" component={SafeFormBuilder} />
        <Stack.Screen name="TrialLoggingFormat" component={SafeTrialLoggingFormat} />
        <Stack.Screen name="AbcDropdownLists" component={SafeAbcDropdownLists} />
        <Stack.Screen name="ScheduleCapacityConfig" component={SafeScheduleCapacityConfig} />
        <Stack.Screen name="GoalDomainDefinitions" component={SafeGoalDomainDefinitions} />
        <Stack.Screen name="TaskAnalysisTemplates" component={SafeTaskAnalysisTemplates} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
