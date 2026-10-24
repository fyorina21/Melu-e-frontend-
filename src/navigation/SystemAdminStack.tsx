import React, { Suspense, lazy } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SystemAdminStackParamList } from '../types';
import ScreenLoader from '../components/ScreenLoader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const StaffAccountManagementScreen = lazy(
  () => import('../screens/systemadmin/StaffAccountManagementScreen'),
);
const RoleManagementScreen = lazy(() => import('../screens/systemadmin/RoleManagementScreen'));
const PermissionConfigurationScreen = lazy(
  () => import('../screens/systemadmin/PermissionConfigurationScreen'),
);
const AuditLogScreen = lazy(() => import('../screens/systemadmin/AuditLogScreen'));

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

const GuardedStaffAccountManagement = withModuleGuard(
  withLazySuspense(StaffAccountManagementScreen),
  'admin',
);
const GuardedRoleManagement = withModuleGuard(withLazySuspense(RoleManagementScreen), 'admin');
const GuardedPermissionConfiguration = withModuleGuard(
  withLazySuspense(PermissionConfigurationScreen),
  'admin',
);
const GuardedAuditLog = withModuleGuard(withLazySuspense(AuditLogScreen), 'admin');

const Stack = createNativeStackNavigator<SystemAdminStackParamList>();

export default function SystemAdminStack() {
  return (
    <ErrorBoundary screenName="System Admin Navigator">
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="StaffAccountManagement"
      >
        <Stack.Screen name="StaffAccountManagement" component={GuardedStaffAccountManagement} />
        <Stack.Screen name="RoleManagement" component={GuardedRoleManagement} />
        <Stack.Screen name="PermissionConfiguration" component={GuardedPermissionConfiguration} />
        <Stack.Screen name="AuditLog" component={GuardedAuditLog} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
