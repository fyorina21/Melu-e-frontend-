// navigation/SessionStack.tsx
//
// Stack containing the Daily Operations module screens (MR-33, 35, 36, 38,
// 39, 40).
// TODO: merge these routes into the app's real root navigator once
// it exists (whoever owns MR-6 Admin Panel Shell / overall app shell).
// Requires @react-navigation/native-stack.
//
// NOTE: This does NOT wrap itself in a NavigationContainer. If you're using
// Expo Router, the router already provides one at the app root - render
// this component directly from app/index.tsx (see that file). If you're
// using plain React Navigation (no Expo Router), wrap THIS component in a
// <NavigationContainer> yourself, one level up, e.g. in your own App.tsx.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SessionStackParamList } from '../types';

import TeacherDashboardScreen from '../screens/teacherdashboard/TeacherDashboardScreen';
import AssessmentDashboardScreen from '../screens/assessments/AssessmentDashboardScreen';
import AbcLogScreen from '../screens/abclog/AbcLogScreen';
import SessionDataCollectionScreen from '../screens/session/SessionDataCollectionScreen';
import DailyNotesScreen from '../screens/dailynotes/DailyNotesScreen';
import SessionNoteEditorScreen from '../screens/dailynotes/SessionNoteEditorScreen';
import GoalProgressScreen from '../screens/goalprogress/GoalProgressScreen';
import SchedulingCalendarScreen from '../screens/scheduling/SchedulingCalendarScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import GoalMasteryCheckScreen from '../screens/goalmastery/GoalMasteryCheckScreen';
import SessionSummaryScreen from '../screens/sessionsummary/SessionSummaryScreen';
import SkillsAssessmentScreen from '../screens/assessments/SkillsAssessmentScreen';
import AbllsNeedAnalysisMapScreen from '../screens/assessments/AbllsNeedAnalysisMapScreen';
import BehaviorAssessmentScreen from '../screens/assessments/BehaviorAssessmentScreen';
import PreferenceAssessmentScreen from '../screens/assessments/PreferenceAssessmentScreen';
import SensoryAssessmentScreen from '../screens/assessments/SensoryAssessmentScreen';
import TeacherParentCommunicationScreen from '../screens/teacherparent/TeacherParentCommunicationScreen';
import TeacherNotificationsScreen from '../screens/notifications/TeacherNotificationsScreen';
import StudentProfileScreen from '../screens/session/StudentProfileScreen';
// MR-39 Appointment & Session Management is now built as
// AppointmentFormModal, reached from the Scheduling Calendar (MR-38) -
// it doesn't need its own stack route since it's a modal, not a screen.

const Stack = createNativeStackNavigator<SessionStackParamList>();

export default function SessionStack() {
  return (
    <Stack.Navigator initialRouteName="TeacherDashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <Stack.Screen name="AssessmentDashboard" component={AssessmentDashboardScreen} />
      <Stack.Screen name="AbcLog" component={AbcLogScreen} />
      <Stack.Screen name="SessionDataCollection" component={SessionDataCollectionScreen} />
      <Stack.Screen name="DailyNotes" component={DailyNotesScreen} />
      <Stack.Screen name="SessionNoteEditor" component={SessionNoteEditorScreen} />
      <Stack.Screen name="GoalProgress" component={GoalProgressScreen} />
      <Stack.Screen name="SchedulingCalendar" component={SchedulingCalendarScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="GoalMasteryCheck" component={GoalMasteryCheckScreen} />
      <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
      <Stack.Screen name="SkillsAssessment" component={SkillsAssessmentScreen} />
      <Stack.Screen name="AbllsNeedMap" component={AbllsNeedAnalysisMapScreen} />
      <Stack.Screen name="BehaviorAssessment" component={BehaviorAssessmentScreen} />
      <Stack.Screen name="PreferenceAssessment" component={PreferenceAssessmentScreen} />
      <Stack.Screen name="SensoryAssessment" component={SensoryAssessmentScreen} />
      <Stack.Screen name="TeacherParentCommunication" component={TeacherParentCommunicationScreen} />
      <Stack.Screen name="Notifications" component={TeacherNotificationsScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
}
