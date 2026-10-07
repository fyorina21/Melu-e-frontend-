import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { getCoordinatorNotifications, markCoordinatorNotificationRead } from '../../api/coordinatorApi';
import NotificationsList, { toAppNotification } from './NotificationsList';
import type { CoordinatorStackParamList } from '../../types';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'Notifications'>;

export default function CoordinatorNotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Notifications" onTabPress={(t) => t !== 'Notifications' && navigation?.navigate?.(navRouteForTab(t) as never)} />
      <NotificationsList
        title="Notifications"
        subtitle="Session alerts and review requests"
        fetchData={async () => {
          const res = await getCoordinatorNotifications();
          const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          return list.map(toAppNotification);
        }}
        demoData={[]}
        markRead={markCoordinatorNotificationRead}
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

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
