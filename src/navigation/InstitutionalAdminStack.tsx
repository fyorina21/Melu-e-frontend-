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

const Stack = createNativeStackNavigator<InstitutionalAdminStackParamList>();

export default function InstitutionalAdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FormBuilder">
      <Stack.Screen name="FormBuilder" component={FormBuilderScreen} />
      <Stack.Screen name="TrialLoggingFormat" component={TrialLoggingFormatScreen} />
      <Stack.Screen name="AbcDropdownLists" component={AbcDropdownListsScreen} />
      <Stack.Screen name="ScheduleCapacityConfig" component={ScheduleCapacityConfigScreen} />
      <Stack.Screen name="GoalDomainDefinitions" component={GoalDomainDefinitionsScreen} />
      <Stack.Screen name="TaskAnalysisTemplates" component={TaskAnalysisTemplatesScreen} />
      <Stack.Screen name="BehaviorAssessment" component={BehaviorAssessmentScreen as any} />
      <Stack.Screen name="PreferenceAssessment" component={PreferenceAssessmentScreen as any} />
      <Stack.Screen name="SensoryAssessment" component={SensoryAssessmentScreen as any} />
    </Stack.Navigator>
  );
}