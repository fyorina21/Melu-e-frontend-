// navigation/teacherTabNavigation.tsx
//
// Shared handler for TopNav's onTabPress within the Teacher role
// (SessionStack). Every tab maps to a real screen in SessionStack.

import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { SessionStackParamList } from '../types';

const ROUTE_BY_TAB: Record<string, keyof SessionStackParamList> = {
  Dashboard: 'TeacherDashboard',
  Session: 'SessionDataCollection',
  Assessments: 'AssessmentDashboard',
  'Daily Notes': 'DailyNotes',
  'ABC Log': 'AbcLog',
  Scheduling: 'SchedulingCalendar',
  Attendance: 'Attendance',
  Parents: 'TeacherParentCommunication',
  Notifications: 'Notifications',
};

export function handleTeacherTabPress(
  navigation: NavigationProp<ParamListBase>,
  tab: string
) {
  const route = ROUTE_BY_TAB[tab];
  if (route) {
    // All mapped tabs go to routes with no params, so the union of route
    // names is safe to pass to navigate.
    navigation?.navigate?.(route as never);
  }
}
