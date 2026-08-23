// screens/director/DirectorDashboardScreen.js
// SCR-DIR-001: Director Dashboard

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getDirectorDashboard } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

interface NotificationItem {
  id: string;
  text: string;
  time: string;
}

interface DirectorDashboardData {
  unreadCount: number;
  totalStudents: number;
  activeTeachers: number;
  pendingApprovals: number;
  unreadParentMessages: number;
  pendingReports: number;
  recentActivity: string[];
  notifications: NotificationItem[];
}

function StatCard({ label, value, tab, onPress }: { label: string; value: number; tab?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {tab && <Text style={styles.statSubtext}>{tab}</Text>}
    </TouchableOpacity>
  );
}

export default function DirectorDashboardScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList, 'DirectorDashboard'>) {
  const [data, setData] = useState<DirectorDashboardData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getDirectorDashboard();
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goto = (tab: string) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[tab]);

  const handleMarkRead = (id: string) => {
    if (!data) return;
    const updatedNotifications = data.notifications.filter((n) => n.id !== id);
    setData({
      ...data,
      notifications: updatedNotifications,
      unreadCount: Math.max(0, data.unreadCount - 1),
    });
  };

  const handleMarkAllRead = () => {
    if (!data) return;
    setData({
      ...data,
      notifications: [],
      unreadCount: 0,
    });
  };

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainLayout}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Header Banner */}
            <View style={styles.headerBanner}>
              <View style={styles.headerTitleGroup}>
                <Text style={styles.welcomeText}>WELCOME BACK, COORDINATOR A</Text>
                <View style={styles.titleWithBell}>
                  <Text style={styles.bannerTitle}>Director Dashboard</Text>
                  <View style={styles.bellContainer}>
                    <Feather name="bell" size={20} color={colors.white} />
                    {data.unreadCount > 0 && (
                      <View style={styles.bellBadge}>
                        <Text style={styles.bellBadgeText}>{data.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.dateText}>Saturday, August 22, 2026</Text>
              </View>
              <View style={styles.clockContainer}>
                <Text style={styles.clockTime}>02:31:44 PM</Text>
                <Text style={styles.clockLabel}>Live clock</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard label="Total Students" value={data.totalStudents} tab="typography.caption-Progress tab" onPress={() => goto('Progress')} />
              <StatCard label="Active Teachers" value={data.activeTeachers} tab="caption - Scheduling tab" onPress={() => goto('Scheduling')} />
              <StatCard label="Pending Mastery Approvals" value={data.pendingApprovals} tab="caption - Approvals tab" onPress={() => goto('Approvals')} />
              <StatCard label="Pending Mastery Approvals" value={data.pendingApprovals} tab="caption - Approvals tab" onPress={() => goto('Approvals')} />
              <StatCard label="Unread Parent Messages" value={data.unreadParentMessages} tab="caption - Parents tab" onPress={() => goto('Parents')} />
              <StatCard label="Session Reports Pending Review" value={data.pendingReports} tab="Reports tab" onPress={() => goto('Reports')} />
            </View>

            {/* Recent Activity Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeaderTitle}>Recent Activity</Text>
              <View style={styles.activityList}>
                {data.recentActivity.map((a, i) => (
                  <View key={i} style={styles.activityRow}>
                    <Text style={styles.activityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Notifications Card */}
            <View style={styles.card}>
              <View style={styles.notifHeaderRow}>
                <View style={styles.notifTitleGroup}>
                  <Feather name="bell" size={18} color={colors.navyText} />
                  <Text style={styles.cardHeaderTitle}>Notifications ({data.notifications.length})</Text>
                </View>
                {data.notifications.length > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={styles.actionText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.notifList}>
                {data.notifications.length === 0 ? (
                  <Text style={styles.emptyText}>No new notifications</Text>
                ) : (
                  data.notifications.map((item) => (
                    <View key={item.id} style={styles.notifItem}>
                      <View style={styles.notifItemHeader}>
                        <Feather name="message-square" size={16} color={colors.navyText} style={styles.notifIcon} />
                        <Text style={styles.notifItemText}>{item.text}</Text>
                        <TouchableOpacity onPress={() => handleMarkRead(item.id)}>
                          <Text style={styles.actionText}>Mark read</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Scheduling')}>
                <Feather name="calendar" size={22} color={colors.navyText} />
                <Text style={styles.quickActionText}>Staff Scheduling</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Approvals')}>
                <Feather name="check-circle" size={22} color={colors.navyText} />
                <Text style={styles.quickActionText}>Mastery Approval</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Parents')}>
                <Feather name="user" size={22} color={colors.navyText} />
                <Text style={styles.quickActionText}>Parent Communication</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Reports')}>
                <Feather name="file-text" size={22} color={colors.navyText} />
                <Text style={styles.quickActionText}>Reports</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: DirectorDashboardData = {
  unreadCount: 3,
  totalStudents: 24,
  activeTeachers: 5,
  pendingApprovals: 2,
  unreadParentMessages: 6,
  pendingReports: 3,
  recentActivity: [
    'Goal mastery submitted for approval - Student A, Identify Colors',
    'Session report flagged for review - Teacher B',
    'Parent message escalated - Student C',
  ],
  notifications: [
    { id: '1', text: 'Goal mastery requires approval - Student A', time: '10 min ago' },
    { id: '2', text: 'New message from Parent of Student B', time: '1 hr ago' },
    { id: '3', text: 'Parent message escalated - Student C', time: '2 hr ago' },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg },
  mainLayout: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap' },
  leftColumn: { flex: 2, minWidth: 320, gap: spacing.lg },
  rightColumn: { flex: 1, minWidth: 300, gap: spacing.lg },
  
  /* Header Banner */
  headerBanner: {
    backgroundColor: '#1E293B',
    borderRadius: radius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: { gap: 4 },
  welcomeText: { color: '#94A3B8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  titleWithBell: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerTitle: { color: colors.white, fontSize: 24, fontWeight: '700' },
  bellContainer: { position: 'relative' },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  dateText: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  clockContainer: { alignItems: 'flex-end' },
  clockTime: { color: '#EAB308', fontSize: 22, fontWeight: '700' },
  clockLabel: { color: '#94A3B8', fontSize: 11 },

  /* Stats Grid */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    width: '31%',
    backgroundColor: '#EEF2F6',
    borderRadius: radius.md,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  statLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  statSubtext: { fontSize: 11, color: '#64748B', marginTop: 2 },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  
  /* Recent Activity */
  activityList: { marginTop: spacing.md },
  activityRow: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  activityText: { fontSize: 13, color: '#334155' },

  /* Notifications */
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionText: { fontSize: 12, color: '#2563EB', fontWeight: '500' },
  notifList: { marginTop: spacing.md, gap: spacing.sm },
  notifItem: { backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: radius.sm },
  notifItemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  notifIcon: { marginTop: 2 },
  notifItemText: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  notifTime: { fontSize: 11, color: '#94A3B8', marginTop: 4, marginLeft: 22 },
  emptyText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginVertical: spacing.md },

  /* Quick Actions Grid */
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FACC15',
    borderRadius: radius.md,
    padding: spacing.lg,
    height: 100,
    justifyContent: 'space-between',
  },
  quickActionText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});