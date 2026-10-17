import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../types';
import FormBuilderScreen from '../screens/institutionaladmin/FormBuilderScreen';
import TrialLoggingFormatScreen from '../screens/institutionaladmin/TrialLoggingFormatScreen';
import AbcDropdownListsScreen from '../screens/institutionaladmin/AbcDropdownListsScreen';
import ScheduleCapacityConfigScreen from '../screens/institutionaladmin/ScheduleCapacityConfigScreen';
import GoalDomainDefinitionsScreen from '../screens/institutionaladmin/GoalDomainDefinitionsScreen';
import TaskAnalysisTemplatesScreen from '../screens/institutionaladmin/TaskAnalysisTemplatesScreen';
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
