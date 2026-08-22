
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getParentNotifications, markParentNotificationRead } from '../../api/parentApi';
import NotificationsList, { type AppNotification } from './NotificationsList';
import type { ParentStackParamList } from '../../types';

type Props = NativeStackScreenProps<ParentStackParamList, 'Notifications'>;

export default function ParentNotificationsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Notifications" onTabPress={(t) => t !== 'Notifications' && navigation?.navigate?.(PARENT_ROUTE_BY_TAB[t])} />
      <NotificationsList
        title="Notifications"
        subtitle="Clinic announcements and updates for your child"
        fetchData={async () => (await getParentNotifications()).data}
        demoData={[]}
        markRead={markParentNotificationRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
