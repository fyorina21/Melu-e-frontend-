import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherNotifications, markNotificationRead } from '../../api/teacherExtrasApi';
import NotificationsList from './NotificationsList';
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
        demoData={[]}
        markRead={markNotificationRead}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bgApp } });
