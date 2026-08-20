import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { getCoordinatorNotifications } from '../../api/coordinatorApi';
import NotificationsList, { type AppNotification } from './NotificationsList';
import type { CoordinatorStackParamList } from '../../types';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'Notifications'>;

export default function CoordinatorNotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Notifications" onTabPress={(t) => t !== 'Notifications' && navigation?.navigate?.(navRouteForTab(t) as never)} />
      <NotificationsList
        title="Notifications"
        subtitle="MR-52 — session alerts and review requests"
        fetchData={async () => (await getCoordinatorNotifications()).data}
        demoData={DEMO}
        markRead={async () => undefined}
      />
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const DEMO: AppNotification[] = [
  { id: 'n1', type: 'alert', title: 'Live session flagged', body: 'Session in Room 1 exceeded target incidents today.', date: 'Today · 11:20 AM', read: false },
  { id: 'n2', type: 'goal', title: '3 summaries awaiting review', body: 'Teacher B submitted session summaries for approval.', date: 'Aug 13, 2026', read: false },
  { id: 'n3', type: 'appointment', title: 'Teacher C unavailable', body: 'Marked unavailable Thursday — 2 sessions need reassignment.', date: 'Aug 12, 2026', read: true },
];

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
