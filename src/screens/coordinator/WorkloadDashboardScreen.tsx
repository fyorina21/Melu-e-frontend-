import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import CoordinatorNav from './components/CoordinatorNav';
import { getWorkloadDashboard, getWorkloadTrend } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

interface WorkloadRow {
  teacherId: string;
  teacherName: string;
  students: number;
  todaySessions: number;
  weeklySessions: number;
  hours: number;
  goals: number;
  pendingNotes: number;
  attendanceRate: number;
}

interface TrendPoint {
  label: string;
  sessions: number;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'WorkloadDashboard'>;

export default function WorkloadDashboardScreen({ navigation }: Props) {
  const [rows, setRows] = useState<WorkloadRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await getWorkloadDashboard();
      setRows(data);
    } catch (err) {
      setRows(DEMO_ROWS);
    }
    try {
      const { data } = await getWorkloadTrend();
      setTrend(data);
    } catch (err) {
      setTrend(DEMO_TREND);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalWeekly = rows.reduce((sum, r) => sum + r.weeklySessions, 0);
  const maxTrend = Math.max(...trend.map((t) => t.sessions), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <CoordinatorNav activeTab="Workload" onTabPress={(t) => t !== 'Workload' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="briefcase" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Therapist Workload</Text>
            <Text style={typography.caption}>MR-42 — weekly distribution across the team</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statValue}>{rows.length}</Text><Text style={typography.caption}>Therapists</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{rows.reduce((s, r) => s + r.students, 0)}</Text><Text style={typography.caption}>Total Students</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{totalWeekly}</Text><Text style={typography.caption}>Sessions This Week</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{rows.reduce((s, r) => s + r.pendingNotes, 0)}</Text><Text style={typography.caption}>Pending Notes</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Weekly Sessions by Therapist</Text>
          {trend.map((t) => (
            <View key={t.label} style={styles.trendRow}>
              <Text style={styles.trendLabel}>{t.label}</Text>
              <View style={styles.trendTrack}>
                <View style={[styles.trendFill, { width: `${(t.sessions / maxTrend) * 100}%` }]} />
              </View>
              <Text style={styles.trendValue}>{t.sessions}</Text>
            </View>
          ))}
        </View>

        <Text style={typography.h3}>Per-Therapist Load</Text>
        {rows.map((r) => (
          <View key={r.teacherId} style={styles.card}>
            <View style={styles.rowHeader}>
              <Text style={typography.bodyBold}>{r.teacherName}</Text>
              <Text style={[typography.caption, r.pendingNotes > 0 && { color: '#B45309', fontWeight: '700' }]}>{r.pendingNotes} pending note(s)</Text>
            </View>
            <View style={styles.metricRow}>
              <View style={styles.metric}><Text style={styles.metricValue}>{r.students}</Text><Text style={typography.caption}>Students</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{r.todaySessions}</Text><Text style={typography.caption}>Today</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{r.weeklySessions}</Text><Text style={typography.caption}>This Week</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{r.hours}h</Text><Text style={typography.caption}>Hours</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{r.goals}</Text><Text style={typography.caption}>Goals</Text></View>
            </View>
            <View style={styles.attendanceRow}>
              <Text style={typography.caption}>Attendance rate</Text>
              <View style={styles.trendTrack}>
                <View style={[styles.trendFill, { width: `${r.attendanceRate}%`, backgroundColor: colors.statusCompletedText }]} />
              </View>
              <Text style={typography.caption}>{r.attendanceRate}%</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const DEMO_ROWS: WorkloadRow[] = [
  { teacherId: 't-a', teacherName: 'Teacher A', students: 18, todaySessions: 6, weeklySessions: 24, hours: 7, goals: 31, pendingNotes: 2, attendanceRate: 95 },
  { teacherId: 't-b', teacherName: 'Teacher B', students: 14, todaySessions: 4, weeklySessions: 18, hours: 5, goals: 22, pendingNotes: 0, attendanceRate: 98 },
  { teacherId: 't-c', teacherName: 'Teacher C', students: 11, todaySessions: 5, weeklySessions: 20, hours: 6, goals: 19, pendingNotes: 1, attendanceRate: 91 },
];

const DEMO_TREND: TrendPoint[] = [
  { label: 'Mon', sessions: 20 },
  { label: 'Tue', sessions: 24 },
  { label: 'Wed', sessions: 22 },
  { label: 'Thu', sessions: 26 },
  { label: 'Fri', sessions: 18 },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trendLabel: { width: 40, fontSize: 12, fontWeight: '600', color: colors.bodyText },
  trendTrack: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  trendFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primaryYellow },
  trendValue: { fontSize: 12, fontWeight: '700', color: colors.navyText, width: 24, textAlign: 'right' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricRow: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, alignItems: 'center', gap: spacing.xs },
  metricValue: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
