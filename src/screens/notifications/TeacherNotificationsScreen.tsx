import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherNotifications, markNotificationRead } from '../../api/teacherExtrasApi';
import NotificationsList, { type AppNotification } from './NotificationsList';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'Notifications'>;

export default function TeacherNotificationsScreen({ navigation }: Props) {
  const { logout } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Notifications" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />
      <NotificationsList
        title="Notifications"
        subtitle="MR-52 — reminders and alerts for your sessions"
        fetchData={async () => (await getTeacherNotifications()).data}
        demoData={DEMO}
        markRead={markNotificationRead}
      />
    </SafeAreaView>
  );
}

const DEMO: AppNotification[] = [
  { id: 'n1', type: 'appointment', title: 'Session at 10:00 AM', body: 'Student A · Room 2. Starting soon.', date: 'Today · 9:45 AM', read: false },
  { id: 'n2', type: 'goal', title: 'Goal mastered', body: 'Emily Johnson mastered "Eye Contact" (8/10).', date: 'Aug 13, 2026', read: false },
  { id: 'n3', type: 'announcement', title: 'Clinic closed Friday', body: 'Public holiday — no sessions.', date: 'Aug 11, 2026', read: true },
];

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
