// src/screens/parent/ParentDashboardScreen.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import { spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PARENT_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useBreakpoint } from '../../utils/useBreakpoint';
import { parentApi } from '../../api';
import type { ParentStackParamList } from '../../types';

import {
  type ParentDashboardData,
  type RecentUpdateItem,
  type NotificationItem,
  formatTodayDisplay,
  buildRecentUpdates,
  buildNotifications,
} from './dashboard/parentDashboardTypes';

import {
  ParentDashboardHeader,
  ChildSummaryCard,
  NotificationsCard,
  RecentUpdatesCard,
  LatestMessageCard,
  QuickActionsCard,
} from './dashboard/components';

type Layout = 'mobile' | 'tablet' | 'desktop';

const cardFlex: Record<Layout, Record<string, number>> = {
  mobile: { child: 1, updates: 1, actions: 1, notifs: 1, message: 1 },
  tablet: { child: 1, updates: 1, actions: 1, notifs: 1, message: 1 },
  desktop: { child: 2, updates: 2, actions: 3, notifs: 1, message: 1 },
};

export default function ParentDashboardScreen({
  navigation,
}: NativeStackScreenProps<ParentStackParamList, 'ParentDashboard'>) {
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdateItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dash, setDash] = useState<ParentDashboardData | null>(null);

  const bp = useBreakpoint();
  const { width } = useWindowDimensions();
  const isMobile = bp === 'mobile';
  const isDesktop = bp === 'desktop';
  const ringSize = isMobile ? 96 : 108;
  const todayText = formatTodayDisplay();

  const load = useCallback(async () => {
    try {
      const res = await parentApi.dashboard();
      const child = res.childSummary;
      setDash({
        parentName: res.parentName ?? 'Parent',
        childName: child?.fullName ?? 'Student',
        childAge: child?.age ?? 0,
        childProgram: child?.programType ?? 'ABA',
        photoUrl: (child as any)?.photoUrl || (child as any)?.headshotUrl || (child as any)?.photo,
        independence: res.independencePercent ?? 0,
        sessionsThisWeek: res.sessionsThisWeek ?? 0,
        sessionsTotal: res.sessionsTotal ?? 0,
        latestMessage: res.latestMessage,
        unreadCount: (res as any).unreadCount ?? 0,
      });

      const updates = buildRecentUpdates(child?.goals, res.sessionsThisWeek ?? 0);
      setRecentUpdates(updates);

      const notifs = buildNotifications((res as any).unreadCount ?? 0, res.latestMessage);
      setNotifications(notifs);
    } catch {
      setDash({
        parentName: 'Parent',
        childName: 'Student',
        childAge: 0,
        childProgram: 'ABA',
        independence: 0,
        sessionsThisWeek: 0,
        sessionsTotal: 0,
        latestMessage: null,
        unreadCount: 0,
      });
      setRecentUpdates(buildRecentUpdates([], 0));
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!dash) return <ScreenLoader />;

  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const goto = (tab: string) => {
    const routeName = PARENT_ROUTE_BY_TAB[tab];
    if (routeName && navigation?.navigate) {
      (navigation.navigate as (r: string) => void)(routeName);
    }
  };

  const cardW = (key: 'child' | 'updates' | 'actions' | 'notifs' | 'message') => ({
    flex: cardFlex[bp][key],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { maxWidth: Math.min(width - 32, 1200) }]}>
          <ParentDashboardHeader parentName={dash.parentName} dateText={todayText} />

          <View style={isDesktop ? styles.gridRow : undefined}>
            <ChildSummaryCard
              childName={dash.childName}
              childAge={dash.childAge}
              childProgram={dash.childProgram}
              photoUrl={dash.photoUrl}
              independence={dash.independence}
              sessionsDone={dash.sessionsThisWeek}
              sessionsTotal={dash.sessionsTotal}
              isMobile={isMobile}
              ringSize={ringSize}
              onViewProgress={() => goto('Progress')}
              style={cardW('child')}
            />

            <NotificationsCard
              notifications={notifications}
              onDismiss={dismissNotification}
              style={cardW('notifs')}
            />
          </View>

          <View style={isDesktop ? styles.gridRow : undefined}>
            <RecentUpdatesCard
              updates={recentUpdates}
              onSelectUpdate={() => goto('Progress')}
              style={cardW('updates')}
            />

            <LatestMessageCard
              latestMessage={dash.latestMessage}
              unreadCount={dash.unreadCount}
              onOpenMessages={() => goto('Messages')}
              style={cardW('message')}
            />
          </View>

          <QuickActionsCard isDesktop={isDesktop} onSelectAction={goto} style={cardW('actions')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    gap: spacing.xl,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
});
