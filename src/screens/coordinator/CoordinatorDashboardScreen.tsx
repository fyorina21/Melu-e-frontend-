import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { getCoordinatorDashboard, getCoordinatorNotifications } from '../../api/coordinatorApi';
import { colors, spacing } from '../../theme/colors';

import {
  type LiveSession,
  type PendingReview,
  type NotificationItem,
  type DashboardPayload,
  type ApiNotification,
  STATUS_FROM_API,
  toNotificationItem,
} from './dashboard/types';
import { DashboardHeader } from './dashboard/components/DashboardHeader';
import { DashboardStatsGrid } from './dashboard/components/DashboardStatsGrid';
import { LiveSessionStatusBoard } from './dashboard/components/LiveSessionStatusBoard';
import { DailySummaryCard } from './dashboard/components/DailySummaryCard';
import { QuickActionsCard } from './dashboard/components/QuickActionsCard';
import { PendingReviewAlertsCard } from './dashboard/components/PendingReviewAlertsCard';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorDashboard'>;

export default function CoordinatorDashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [counts, setCounts] = useState({ active: 0, pending: 0, students: 0, teachers: 0 });
  const [summary, setSummary] = useState({
    completed: 0,
    trials: 0,
    incidents: 0,
    goalsMastered: 0,
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const { data } = await getCoordinatorDashboard();
      const payload = (data ?? {}) as DashboardPayload;
      setSessions(
        (payload.liveSessions ?? []).map((row) => ({
          id: row.id,
          teacher: row.teacherName,
          station: row.stationName,
          students:
            row.studentCount > 0
              ? [`${row.studentCount} student${row.studentCount > 1 ? 's' : ''}`]
              : [],
          timer: 0,
          trials: 0,
          status: STATUS_FROM_API[row.status] ?? 'on-track',
        })),
      );
      setPendingReviews(
        (payload.pendingReviews ?? []).map((row) => ({
          id: row.id,
          teacher: row.teacherName,
          station: row.stationName ?? '',
          date: row.date ?? '',
          students: row.studentNames ?? [],
          independence: row.independencePercent ?? 0,
          incidents: row.incidents ?? 0,
        })),
      );
      setCounts({
        active: payload.activeSessionsCount ?? payload.liveSessions?.length ?? 0,
        pending: payload.pendingReviewCount ?? payload.pendingReviews?.length ?? 0,
        students: payload.studentsInTherapyCount ?? 0,
        teachers: payload.teachersOnDutyCount ?? 0,
      });
      setSummary({
        completed: payload.summary?.sessionsCompleted ?? 0,
        trials: payload.summary?.trialsLogged ?? 0,
        incidents: payload.summary?.incidents ?? 0,
        goalsMastered: payload.summary?.goalsMastered ?? 0,
      });
    } catch {
      setSessions([]);
      setPendingReviews([]);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let cancelled = false;
    getCoordinatorNotifications()
      .then(({ data }) => {
        if (!cancelled) setNotifications((data as ApiNotification[]).map(toNotificationItem));
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Timer interval with early guard: only ticks when active sessions exist
  useEffect(() => {
    const id = setInterval(() => {
      setSessions((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((s) => ({ ...s, timer: s.timer + 1 }));
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleTabPress = useCallback(
    (tab: string) => {
      const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
        Dashboard: 'CoordinatorDashboard',
        'Live Sessions': 'LiveSessionMonitoring',
        Review: 'SessionSummaryReview',
        Progress: 'CoordinatorStudentProgress',
        Schedule: 'CoordinatorSchedule',
        Parents: 'CoordinatorParentCommunication',
        Notifications: 'Notifications',
      };
      const route = routeByTab[tab];
      if (route) navigation?.navigate?.(route as never);
    },
    [navigation],
  );

  const navigateTo = useCallback(
    (route: keyof CoordinatorStackParamList) => {
      navigation?.navigate?.(route as never);
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={handleTabPress} unreadCount={unreadCount} />
      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          unreadCount={unreadCount}
          bellOpen={bellOpen}
          onToggleBell={() => setBellOpen((v) => !v)}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onCloseBell={() => setBellOpen(false)}
        />

        <DashboardStatsGrid counts={counts} onNavigate={navigateTo} />

        <LiveSessionStatusBoard
          sessions={sessions}
          onViewAll={() => navigateTo('LiveSessionMonitoring')}
        />

        <DailySummaryCard summary={summary} />

        <QuickActionsCard onNavigate={navigateTo} />

        <PendingReviewAlertsCard
          pendingReviews={pendingReviews}
          onReview={() => navigateTo('SessionSummaryReview')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tabletContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
});
