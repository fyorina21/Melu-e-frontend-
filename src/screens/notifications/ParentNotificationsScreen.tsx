import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getParentNotifications, markParentNotificationRead } from '../../api/parentApi';
import NotificationsList, { toAppNotification, type AppNotification } from './NotificationsList';
import type { ParentStackParamList } from '../../types';

type Props = NativeStackScreenProps<ParentStackParamList, 'Notifications'>;

export default function ParentNotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Notifications"
        onTabPress={(t) => t !== 'Notifications' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])}
      />
      <NotificationsList
        title="Notifications"
        subtitle="Clinic announcements and updates for your child"
        fetchData={async () => {
          try {
            const res = await getParentNotifications();
            const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            return list.map(toAppNotification);
          } catch {
            return [];
          }
        }}
        demoData={[
          {
            id: 'demo-1',
            title: 'Session Completed',
            body: 'Sarah completed today’s therapy session with 83% independence.',
            read: false,
            date: 'Today',
            type: 'goal',
          },
          {
            id: 'demo-2',
            title: 'Weekly Progress Report',
            body: 'The updated IUP summary report is now ready for review.',
            read: true,
            date: 'Yesterday',
            type: 'announcement',
          },
        ]}
        markRead={markParentNotificationRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
