import React, { useCallback } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherNotifications, markNotificationRead } from '../../api/teacherExtrasApi';
import { getAlertsForTeacher, markCoordinatorAlertRead } from '../../utils/alertNotificationHelper';
import NotificationsList, { toAppNotification, type AppNotification } from './NotificationsList';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'Notifications'>;

export default function TeacherNotificationsScreen({ navigation }: Props) {
  const { session } = useAuth();

  const fetchAllNotifications = useCallback(async (): Promise<AppNotification[]> => {
    let backendList: any[] = [];
    try {
      const res = await getTeacherNotifications();
      backendList = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? []);
    } catch {}

    const backendMapped = backendList.map(toAppNotification);

    const localAlerts = getAlertsForTeacher(session?.userName, session?.email);
    const localMapped: AppNotification[] = localAlerts.map((a) => ({
      id: a.id,
      type: 'alert',
      title: `Coordinator Alert (${a.type})`,
      body: a.message,
      date: 'Today',
      read: Boolean(a.read),
    }));

    return [...localMapped, ...backendMapped];
  }, [session?.userName, session?.email]);

  const handleMarkRead = useCallback(async (notificationId: string) => {
    if (notificationId.startsWith('alert-')) {
      markCoordinatorAlertRead(notificationId);
      return;
    }
    await markNotificationRead(notificationId);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Notifications"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />
      <NotificationsList
        title="Notifications"
        subtitle="Reminders and alerts for your sessions"
        fetchData={fetchAllNotifications}
        demoData={[]}
        markRead={handleMarkRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
