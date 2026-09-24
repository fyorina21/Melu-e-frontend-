import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../types';
import FormBuilderScreen from '../screens/institutionaladmin/FormBuilderScreen';
import StaffAccountManagementScreen from '../screens/systemadmin/StaffAccountManagementScreen';
import RoleManagementScreen from '../screens/systemadmin/RoleManagementScreen';
import PermissionConfigurationScreen from '../screens/systemadmin/PermissionConfigurationScreen';
import AuditLogScreen from '../screens/systemadmin/AuditLogScreen';
import BehaviorAssessmentScreen from '../screens/assessments/BehaviorAssessmentScreen';
import PreferenceAssessmentScreen from '../screens/assessments/PreferenceAssessmentScreen';
import SensoryAssessmentScreen from '../screens/assessments/SensoryAssessmentScreen';

const Stack = createNativeStackNavigator<SystemAdminStackParamList>();

export default function SystemAdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="StaffAccountManagement">
      <Stack.Screen name="FormBuilder" component={FormBuilderScreen} />
      <Stack.Screen name="StaffAccountManagement" component={StaffAccountManagementScreen} />
      <Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
      <Stack.Screen name="PermissionConfiguration" component={PermissionConfigurationScreen} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} />
      <Stack.Screen name="BehaviorAssessment" component={BehaviorAssessmentScreen as any} />
      <Stack.Screen name="PreferenceAssessment" component={PreferenceAssessmentScreen as any} />
      <Stack.Screen name="SensoryAssessment" component={SensoryAssessmentScreen as any} />
    </Stack.Navigator>
  );
}