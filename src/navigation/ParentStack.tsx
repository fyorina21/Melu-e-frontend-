import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../types';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import HomeObservationLogScreen from '../screens/parent/HomeObservationLogScreen';
import ParentCommunicationScreen from '../screens/parent/ParentCommunicationScreen';
import ParentNotificationsScreen from '../screens/notifications/ParentNotificationsScreen';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { withModuleGuard } from '../auth/withModuleGuard';

const GuardedChildProgress = withModuleGuard(ChildProgressScreen, 'parent_portal');
const GuardedHomeObservationLog = withModuleGuard(HomeObservationLogScreen, 'parent_portal');
const GuardedParentCommunication = withModuleGuard(ParentCommunicationScreen, 'parent_portal');

const Stack = createNativeStackNavigator<ParentStackParamList>();

export default function ParentStack() {
  return (
    <ErrorBoundary screenName="Parent Navigator">
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
        <Stack.Screen name="ChildProgress" component={GuardedChildProgress} />
        <Stack.Screen name="HomeObservationLog" component={GuardedHomeObservationLog} />
        <Stack.Screen name="ParentCommunication" component={GuardedParentCommunication} />
        <Stack.Screen name="Notifications" component={ParentNotificationsScreen} />
      </Stack.Navigator>
    </ErrorBoundary>
  );
}
