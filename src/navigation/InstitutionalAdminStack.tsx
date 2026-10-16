import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../types';
import FormBuilderScreen from '../screens/institutionaladmin/FormBuilderScreen';
import TrialLoggingFormatScreen from '../screens/institutionaladmin/TrialLoggingFormatScreen';
import AbcDropdownListsScreen from '../screens/institutionaladmin/AbcDropdownListsScreen';
import ScheduleCapacityConfigScreen from '../screens/institutionaladmin/ScheduleCapacityConfigScreen';
import GoalDomainDefinitionsScreen from '../screens/institutionaladmin/GoalDomainDefinitionsScreen';
import TaskAnalysisTemplatesScreen from '../screens/institutionaladmin/TaskAnalysisTemplatesScreen';
import BehaviorAssessmentScreen from '../screens/assessments/BehaviorAssessmentScreen';
import PreferenceAssessmentScreen from '../screens/assessments/PreferenceAssessmentScreen';
import SensoryAssessmentScreen from '../screens/assessments/SensoryAssessmentScreen';
import { ErrorBoundary, withErrorBoundary } from '../components/ErrorBoundary';

const Stack = createNativeStackNavigator<InstitutionalAdminStackParamList>();

const SafeFormBuilder = withErrorBoundary(FormBuilderScreen, 'Form Builder');
const SafeTrialLoggingFormat = withErrorBoundary(TrialLoggingFormatScreen, 'Trial Logging Format');
const SafeAbcDropdownLists = withErrorBoundary(AbcDropdownListsScreen, 'ABC Dropdown Lists');
const SafeScheduleCapacityConfig = withErrorBoundary(
  ScheduleCapacityConfigScreen,
  'Session Schedule & Capacity',
);
const SafeGoalDomainDefinitions = withErrorBoundary(
  GoalDomainDefinitionsScreen,
  'Goal Domains & Task Analysis',
);
const SafeTaskAnalysisTemplates = withErrorBoundary(
  TaskAnalysisTemplatesScreen,
  'Task Analysis Templates',
);
const SafeBehaviorAssessment = withErrorBoundary(
  BehaviorAssessmentScreen as any,
  'Behavior Assessment',
);
const SafePreferenceAssessment = withErrorBoundary(
  PreferenceAssessmentScreen as any,
  'Preference Assessment',
);
const SafeSensoryAssessment = withErrorBoundary(
  SensoryAssessmentScreen as any,
  'Sensory Assessment',
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
        <Stack.Screen name="BehaviorAssessment" component={SafeBehaviorAssessment} />
        <Stack.Screen name="PreferenceAssessment" component={SafePreferenceAssessment} />
        <Stack.Screen name="SensoryAssessment" component={SafeSensoryAssessment} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
