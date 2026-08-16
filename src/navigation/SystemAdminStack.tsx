// navigation/SystemAdminStack.tsx
// System Administrator role stack - SCR-SYS-001 through SCR-SYS-003.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../types';
import AdminPanelOverviewScreen from '../screens/admin/AdminPanelOverviewScreen';
import StaffAccountManagementScreen from '../screens/systemadmin/StaffAccountManagementScreen';
import RoleManagementScreen from '../screens/systemadmin/RoleManagementScreen';
import PermissionConfigurationScreen from '../screens/systemadmin/PermissionConfigurationScreen';
import AuditLogScreen from '../screens/systemadmin/AuditLogScreen';

const Stack = createNativeStackNavigator<SystemAdminStackParamList>();

export default function SystemAdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminPanelOverview" component={AdminPanelOverviewScreen} initialParams={{ panel: 'system' }} />
      <Stack.Screen name="StaffAccountManagement" component={StaffAccountManagementScreen} />
      <Stack.Screen name="RoleManagement" component={RoleManagementScreen} />
      <Stack.Screen name="PermissionConfiguration" component={PermissionConfigurationScreen} />
      <Stack.Screen name="AuditLog" component={AuditLogScreen} />
    </Stack.Navigator>
  );
}
