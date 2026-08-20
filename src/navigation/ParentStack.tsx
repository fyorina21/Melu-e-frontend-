import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ParentStackParamList } from '../types';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import HomeObservationLogScreen from '../screens/parent/HomeObservationLogScreen';
import ParentCommunicationScreen from '../screens/parent/ParentCommunicationScreen';
import ParentNotificationsScreen from '../screens/notifications/ParentNotificationsScreen';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export default function ParentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
      <Stack.Screen name="ChildProgress" component={ChildProgressScreen} />
      <Stack.Screen name="HomeObservationLog" component={HomeObservationLogScreen} />
      <Stack.Screen name="ParentCommunication" component={ParentCommunicationScreen} />
      <Stack.Screen name="Notifications" component={ParentNotificationsScreen} />
    </Stack.Navigator>
  );
}
