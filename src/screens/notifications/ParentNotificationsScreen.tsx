
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import ParentNav, { PARENT_ROUTE_BY_TAB } from '../parent/components/ParentNav';
import { getParentNotifications, markParentNotificationRead } from '../../api/parentApi';
import NotificationsList, { type AppNotification } from './NotificationsList';
import type { ParentStackParamList } from '../../types';

type Props = NativeStackScreenProps<ParentStackParamList, 'Notifications'>;

export default function ParentNotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ParentNav activeTab="Notifications" onTabPress={(t) => t !== 'Notifications' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <NotificationsList
        title="Notifications"
        subtitle="MR-51/52 — clinic announcements and updates for your child"
        fetchData={async () => (await getParentNotifications()).data}
        demoData={DEMO}
        markRead={markParentNotificationRead}
      />
    </SafeAreaView>
  );
}

const DEMO: AppNotification[] = [
  { id: 'n1', type: 'announcement', title: 'Clinic closed Friday', body: 'The clinic will be closed on Friday due to a public holiday.', date: 'Today', read: false },
  { id: 'n2', type: 'goal', title: 'Great progress!', body: 'Emily\'s Communication goal moved from 70% to 75%.', date: 'Aug 13, 2026', read: false },
  { id: 'n3', type: 'appointment', title: 'Next session confirmed', body: 'Monday 10:00 AM with Teacher A in Room 2.', date: 'Aug 12, 2026', read: true },
  { id: 'n4', type: 'announcement', title: 'New progress report', body: 'Emily\'s July report is ready to view.', date: 'Aug 8, 2026', read: true },
];

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
