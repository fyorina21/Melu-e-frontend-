import React, { Suspense, lazy } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../types';
import ScreenLoader from '../components/ScreenLoader';
import { ErrorBoundary, withErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const FormBuilderScreen = lazy(() => import('../screens/institutionaladmin/FormBuilderScreen'));
const TrialLoggingFormatScreen = lazy(
  () => import('../screens/institutionaladmin/TrialLoggingFormatScreen'),
);
const AbcDropdownListsScreen = lazy(
  () => import('../screens/institutionaladmin/AbcDropdownListsScreen'),
);
const ScheduleCapacityConfigScreen = lazy(
  () => import('../screens/institutionaladmin/ScheduleCapacityConfigScreen'),
);
const GoalDomainDefinitionsScreen = lazy(
  () => import('../screens/institutionaladmin/GoalDomainDefinitionsScreen'),
);
const TaskAnalysisTemplatesScreen = lazy(
  () => import('../screens/institutionaladmin/TaskAnalysisTemplatesScreen'),
);

function withLazySuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback = <ScreenLoader />,
) {
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

const Stack = createNativeStackNavigator<InstitutionalAdminStackParamList>();

const SafeFormBuilder = withModuleGuard(
  withErrorBoundary(withLazySuspense(FormBuilderScreen), 'Form Builder'),
  'admin',
);
const SafeTrialLoggingFormat = withModuleGuard(
  withErrorBoundary(withLazySuspense(TrialLoggingFormatScreen), 'Trial Logging Format'),
  'sessions',
);
const SafeAbcDropdownLists = withModuleGuard(
  withErrorBoundary(withLazySuspense(AbcDropdownListsScreen), 'ABC Dropdown Lists'),
  'behavior_incidents',
);
const SafeScheduleCapacityConfig = withModuleGuard(
  withErrorBoundary(withLazySuspense(ScheduleCapacityConfigScreen), 'Session Schedule & Capacity'),
  'staff',
);
const SafeGoalDomainDefinitions = withModuleGuard(
  withErrorBoundary(withLazySuspense(GoalDomainDefinitionsScreen), 'Goal Domains & Task Analysis'),
  'iups',
);
const SafeTaskAnalysisTemplates = withModuleGuard(
  withErrorBoundary(withLazySuspense(TaskAnalysisTemplatesScreen), 'Task Analysis Templates'),
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
