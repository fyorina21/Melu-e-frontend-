// screens/director/DirectorDashboardScreen.js
// SCR-DIR-001: Director Dashboard

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DirectorNav, { DIRECTOR_ROUTE_BY_TAB } from './components/DirectorNav';
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

function StatCard({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
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

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <DirectorNav activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={typography.h1}>Director Dashboard</Text>
          <View style={styles.notifBell}>
            <Feather name="bell" size={18} color={colors.navyText} />
            {data.unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{data.unreadCount}</Text></View>}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Students" value={data.totalStudents} onPress={() => goto('Progress')} />
          <StatCard label="Active Teachers" value={data.activeTeachers} onPress={() => goto('Scheduling')} />
          <StatCard label="Pending Mastery Approvals" value={data.pendingApprovals} onPress={() => goto('Approvals')} />
          <StatCard label="Unread Parent Messages" value={data.unreadParentMessages} onPress={() => goto('Parents')} />
          <StatCard label="Session Reports Pending Review" value={data.pendingReports} onPress={() => goto('Reports')} />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Recent Activity</Text>
          {data.recentActivity.map((a, i) => (
            <Text key={i} style={[typography.body, styles.activityRow]}>{a}</Text>
          ))}
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Scheduling')}>
            <Text style={typography.bodyBold}>Staff Scheduling</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Approvals')}>
            <Text style={typography.bodyBold}>Mastery Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Parents')}>
            <Text style={typography.bodyBold}>Parent Communication</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Reports')}>
            <Text style={typography.bodyBold}>Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: DirectorDashboardData = {
  unreadCount: 4,
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
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifBell: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '30%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.navyText },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  activityRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.primaryYellow, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
});
