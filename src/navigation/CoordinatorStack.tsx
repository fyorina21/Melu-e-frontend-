import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../types';
import CoordinatorDashboardScreen from '../screens/coordinator/CoordinatorDashboardScreen';
import LiveSessionMonitoringScreen from '../screens/coordinator/LiveSessionMonitoringScreen';
import SessionSummaryReviewScreen from '../screens/coordinator/SessionSummaryReviewScreen';
import CoordinatorStudentProgressScreen from '../screens/coordinator/CoordinatorStudentProgressScreen';
import CoordinatorScheduleScreen from '../screens/coordinator/CoordinatorScheduleScreen';
import CoordinatorParentCommunicationScreen from '../screens/coordinator/CoordinatorParentCommunicationScreen';
import StudentEnrollmentScreen from '../screens/coordinator/StudentEnrollmentScreen';
import StudentProfileScreen from '../screens/coordinator/StudentProfileScreen';
import WorkloadDashboardScreen from '../screens/coordinator/WorkloadDashboardScreen';
import RoomResourceSchedulingScreen from '../screens/coordinator/RoomResourceSchedulingScreen';
import CoordinatorNotificationsScreen from '../screens/notifications/CoordinatorNotificationsScreen';
import IupGenerationScreen from '../screens/programdirector/IupGenerationScreen';

const Stack = createNativeStackNavigator<CoordinatorStackParamList>();

export default function CoordinatorStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoordinatorDashboard" component={CoordinatorDashboardScreen} />
      <Stack.Screen name="LiveSessionMonitoring" component={LiveSessionMonitoringScreen} />
      <Stack.Screen name="SessionSummaryReview" component={SessionSummaryReviewScreen} />
      <Stack.Screen name="CoordinatorStudentProgress" component={CoordinatorStudentProgressScreen} />
      <Stack.Screen name="CoordinatorSchedule" component={CoordinatorScheduleScreen} />
      <Stack.Screen name="CoordinatorParentCommunication" component={CoordinatorParentCommunicationScreen} />
      <Stack.Screen name="StudentEnrollment" component={StudentEnrollmentScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
      <Stack.Screen name="WorkloadDashboard" component={WorkloadDashboardScreen} />
      <Stack.Screen name="RoomResourceScheduling" component={RoomResourceSchedulingScreen} />
      <Stack.Screen name="IupGeneration" component={IupGenerationScreen} />
      <Stack.Screen name="Notifications" component={CoordinatorNotificationsScreen} />
    </Stack.Navigator>
  );
}
