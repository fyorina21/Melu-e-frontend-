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

import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedFormBuilder = withModuleGuard(FormBuilderScreen, 'admin');
const GuardedStaffAccountManagement = withModuleGuard(StaffAccountManagementScreen, 'admin');
const GuardedRoleManagement = withModuleGuard(RoleManagementScreen, 'admin');
const GuardedPermissionConfiguration = withModuleGuard(PermissionConfigurationScreen, 'admin');
const GuardedAuditLog = withModuleGuard(AuditLogScreen, 'admin');
const GuardedBehaviorAssessment = withModuleGuard(BehaviorAssessmentScreen as any, 'assessments');
const GuardedPreferenceAssessment = withModuleGuard(
  PreferenceAssessmentScreen as any,
  'assessments',
);
const GuardedSensoryAssessment = withModuleGuard(SensoryAssessmentScreen as any, 'assessments');

const Stack = createNativeStackNavigator<SystemAdminStackParamList>();

export default function SystemAdminStack() {
  return (
    <ErrorBoundary screenName="System Admin Navigator">
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="StaffAccountManagement"
      >
        <Stack.Screen name="FormBuilder" component={GuardedFormBuilder} />
        <Stack.Screen name="StaffAccountManagement" component={GuardedStaffAccountManagement} />
        <Stack.Screen name="RoleManagement" component={GuardedRoleManagement} />
        <Stack.Screen name="PermissionConfiguration" component={GuardedPermissionConfiguration} />
        <Stack.Screen name="AuditLog" component={GuardedAuditLog} />
        <Stack.Screen name="BehaviorAssessment" component={GuardedBehaviorAssessment} />
        <Stack.Screen name="PreferenceAssessment" component={GuardedPreferenceAssessment} />
        <Stack.Screen name="SensoryAssessment" component={GuardedSensoryAssessment} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
