// screens/director/DirectorDashboardScreen.tsx
// SCR-DIR-001: Director Dashboard

import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getDirectorDashboard } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

interface DirectorDashboardData {
  unreadCount: number;
  totalStudents: number;
  activeTeachers: number;
  pendingApprovals: number;
  unreadParentMessages: number;
  pendingReports: number;
  recentActivity: string[];
}

export default function DirectorDashboardScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorDashboard'>) {
  const [data, setData] = useState<DirectorDashboardData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getDirectorDashboard();
      setData(res);
    } catch {
      setData({
        unreadCount: 0,
        totalStudents: 14,
        activeTeachers: 6,
        pendingApprovals: 2,
        unreadParentMessages: 3,
        pendingReports: 4,
        recentActivity: [
          'Mastery check submitted for Student Leo (Hand Washing TA)',
          'Session summary submitted by Sarah Miller for 2 students',
          'New parent message received from Mrs. Davis',
          'Weekly schedule assignments updated for ABA Station 1',
        ],
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goto = (tab: string) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[tab]);

  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="grid" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Director Overview Dashboard</Text>
              <Text style={styles.pageSubtitle}>Executive oversight, clinical approvals, scheduling & parent communications</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => goto('Parents')}>
            <Feather name="bell" size={18} color={colors.navyText} />
            {data.unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{data.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => goto('Student Progress')} activeOpacity={0.7}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Feather name="users" size={20} color="#1E40AF" />
            </View>
            <Text style={styles.statValue}>{data.totalStudents}</Text>
            <Text style={styles.statLabel}>Total Enrolled Students</Text>
            <View style={styles.statArrow}>
              <Text style={styles.statArrowText}>View Progress</Text>
              <Feather name="chevron-right" size={12} color={colors.bodyText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => goto('Staff Scheduling')} activeOpacity={0.7}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="calendar" size={20} color="#166534" />
            </View>
            <Text style={styles.statValue}>{data.activeTeachers}</Text>
            <Text style={styles.statLabel}>Active Therapists / Staff</Text>
            <View style={styles.statArrow}>
              <Text style={styles.statArrowText}>Manage Schedule</Text>
              <Feather name="chevron-right" size={12} color={colors.bodyText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => goto('Goal Mastery Approval')} activeOpacity={0.7}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="award" size={20} color="#B45309" />
            </View>
            <Text style={[styles.statValue, { color: '#B45309' }]}>{data.pendingApprovals}</Text>
            <Text style={styles.statLabel}>Pending Mastery Approvals</Text>
            <View style={styles.statArrow}>
              <Text style={styles.statArrowText}>Review Now</Text>
              <Feather name="chevron-right" size={12} color={colors.bodyText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => goto('Parent Communication')} activeOpacity={0.7}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="message-circle" size={20} color="#6B21A8" />
            </View>
            <Text style={styles.statValue}>{data.unreadParentMessages}</Text>
            <Text style={styles.statLabel}>Unread Parent Messages</Text>
            <View style={styles.statArrow}>
              <Text style={styles.statArrowText}>Open Hub</Text>
              <Feather name="chevron-right" size={12} color={colors.bodyText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => goto('Report & Oversight')} activeOpacity={0.7}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="file-text" size={20} color="#991B1B" />
            </View>
            <Text style={styles.statValue}>{data.pendingReports}</Text>
            <Text style={styles.statLabel}>Reports Pending Review</Text>
            <View style={styles.statArrow}>
              <Text style={styles.statArrowText}>View Reports</Text>
              <Feather name="chevron-right" size={12} color={colors.bodyText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Management Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Staff Scheduling')}>
              <Feather name="calendar" size={18} color={colors.navyText} />
              <Text style={styles.quickActionTitle}>Staff Scheduling</Text>
              <Text style={styles.quickActionSub}>Assign student blocks & check capacity</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Goal Mastery Approval')}>
              <Feather name="check-circle" size={18} color={colors.navyText} />
              <Text style={styles.quickActionTitle}>Mastery Approvals</Text>
              <Text style={styles.quickActionSub}>Multi-therapist verification review</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Parent Communication')}>
              <Feather name="message-square" size={18} color={colors.navyText} />
              <Text style={styles.quickActionTitle}>Parent Messages</Text>
              <Text style={styles.quickActionSub}>Communication hub & escalation log</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Report & Oversight')}>
              <Feather name="bar-chart-2" size={18} color={colors.navyText} />
              <Text style={styles.quickActionTitle}>Reports & Oversight</Text>
              <Text style={styles.quickActionSub}>Custom report builder & analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent Clinical Activity</Text>
            <Feather name="clock" size={16} color={colors.mutedText} />
          </View>
          <View style={styles.activityList}>
            {data.recentActivity.map((a, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 260 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  notifBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    minWidth: 180,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.navyText },
  statLabel: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  statArrow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs },
  statArrowText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: {
    flexGrow: 1,
    minWidth: 220,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  quickActionTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText, marginTop: 4 },
  quickActionSub: { fontSize: 11, color: colors.mutedText },

  activityList: { gap: spacing.sm },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryYellowDark,
  },
  activityText: { fontSize: 13, color: colors.navyText, flex: 1 },
});

