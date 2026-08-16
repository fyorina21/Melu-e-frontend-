import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../types';
import AdminPanelOverviewScreen from '../screens/admin/AdminPanelOverviewScreen';
import FormBuilderScreen from '../screens/institutionaladmin/FormBuilderScreen';
import TrialLoggingFormatScreen from '../screens/institutionaladmin/TrialLoggingFormatScreen';
import AbcDropdownListsScreen from '../screens/institutionaladmin/AbcDropdownListsScreen';
import ScheduleCapacityConfigScreen from '../screens/institutionaladmin/ScheduleCapacityConfigScreen';
import GoalDomainDefinitionsScreen from '../screens/institutionaladmin/GoalDomainDefinitionsScreen';
import TaskAnalysisTemplatesScreen from '../screens/institutionaladmin/TaskAnalysisTemplatesScreen';
import ClinicInfoConfigScreen from '../screens/institutionaladmin/ClinicInfoConfigScreen';
import WorkingHoursConfigScreen from '../screens/institutionaladmin/WorkingHoursConfigScreen';
import SchoolSettingsConfigScreen from '../screens/institutionaladmin/SchoolSettingsConfigScreen';
import ClinicalCategoriesConfigScreen from '../screens/institutionaladmin/ClinicalCategoriesConfigScreen';

const Stack = createNativeStackNavigator<InstitutionalAdminStackParamList>();

export default function InstitutionalAdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminPanelOverview" component={AdminPanelOverviewScreen} initialParams={{ panel: 'clinical' }} />
      <Stack.Screen name="FormBuilder" component={FormBuilderScreen} />
      <Stack.Screen name="TrialLoggingFormat" component={TrialLoggingFormatScreen} />
      <Stack.Screen name="AbcDropdownLists" component={AbcDropdownListsScreen} />
      <Stack.Screen name="ScheduleCapacityConfig" component={ScheduleCapacityConfigScreen} />
      <Stack.Screen name="GoalDomainDefinitions" component={GoalDomainDefinitionsScreen} />
      <Stack.Screen name="TaskAnalysisTemplates" component={TaskAnalysisTemplatesScreen} />
      <Stack.Screen name="ClinicInfoConfig" component={ClinicInfoConfigScreen} />
      <Stack.Screen name="WorkingHoursConfig" component={WorkingHoursConfigScreen} />
      <Stack.Screen name="SchoolSettingsConfig" component={SchoolSettingsConfigScreen} />
      <Stack.Screen name="ClinicalCategoriesConfig" component={ClinicalCategoriesConfigScreen} />
    </Stack.Navigator>
  );
}
