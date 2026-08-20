import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { getCoordinatorDashboard } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

const STATUS_DOT_COLOR: Record<string, string> = { green: '#22C55E', yellow: '#EAB308', red: '#EF4444' };

interface LiveSession {
  id: string;
  teacherName: string;
  stationName: string;
  status: string;
  studentCount: number;
}

interface PendingReview {
  id: string;
  teacherName: string;
  studentNames: string[];
}

interface CoordinatorDashboardData {
  unreadCount: number;
  activeSessionsCount: number;
  pendingReviewCount: number;
  studentsInTherapyCount: number;
  teachersOnDutyCount: number;
  liveSessions: LiveSession[];
  pendingReviews: PendingReview[];
  summary: { sessionsCompleted: number; trialsLogged: number; incidents: number; goalsMastered: number };
}

function StatCard({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </TouchableOpacity>
  );
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'CoordinatorDashboard'>;

export default function CoordinatorDashboardScreen({ navigation }: Props) {
  const [data, setData] = useState<CoordinatorDashboardData | null>(null);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const { data: res } = await getCoordinatorDashboard();
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabPress = (tab: string) => {
    const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
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
    };
    navigation?.navigate?.(routeByTab[tab] as never);
  };

  if (!data) return null;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={handleTabPress} unreadCount={data.unreadCount} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h1}>Therapy Coordinator Dashboard</Text>
            <Text style={typography.body}>{dateStr}</Text>
          </View>
          <View style={styles.clockPill}>
            <Feather name="clock" size={14} color={colors.mutedText} style={{ marginRight: spacing.xs }} />
            <Text style={styles.clockText}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Active Sessions Now" value={data.activeSessionsCount} onPress={() => handleTabPress('Live Sessions')} />
          <StatCard label="Sessions Pending Review" value={data.pendingReviewCount} onPress={() => handleTabPress('Review')} />
          <StatCard label="Students in Therapy" value={data.studentsInTherapyCount} onPress={() => handleTabPress('Progress')} />
          <StatCard label="Teachers On Duty" value={data.teachersOnDutyCount} onPress={() => handleTabPress('Schedule')} />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.('IupGeneration')}>
              <Feather name="file-text" size={14} color={colors.navyText} />
              <Text style={styles.quickActionText}>Generate IUP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleTabPress('Enrollment')}>
              <Feather name="user-plus" size={14} color={colors.navyText} />
              <Text style={styles.quickActionText}>Enroll Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => handleTabPress('Schedule')}>
              <Feather name="calendar" size={14} color={colors.navyText} />
              <Text style={styles.quickActionText}>Open Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Live Session Status</Text>
          {data.liveSessions.map((s) => (
            <View key={s.id} style={styles.liveSessionRow}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_DOT_COLOR[s.status] }]} />
              <Text style={[typography.body, { flex: 1 }]}>{s.teacherName} · {s.stationName}</Text>
              <Text style={typography.caption}>{s.studentCount} students</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Pending Review Alerts</Text>
          {data.pendingReviews.map((r) => (
            <View key={r.id} style={styles.reviewRow}>
              <Text style={typography.body}>{r.teacherName} — {r.studentNames.join(', ')}</Text>
              <TouchableOpacity onPress={() => handleTabPress('Review')}>
                <Text style={styles.linkText}>Review →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Daily Operational Summary</Text>
          <View style={styles.summaryGrid}>
            <Text style={typography.body}>Sessions Completed: {data.summary.sessionsCompleted}</Text>
            <Text style={typography.body}>Trials Logged: {data.summary.trialsLogged}</Text>
            <Text style={typography.body}>Incidents: {data.summary.incidents}</Text>
            <Text style={typography.body}>Goals Mastered: {data.summary.goalsMastered}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: CoordinatorDashboardData = {
  unreadCount: 3,
  activeSessionsCount: 4,
  pendingReviewCount: 2,
  studentsInTherapyCount: 12,
  teachersOnDutyCount: 5,
  liveSessions: [
    { id: '1', teacherName: 'Teacher A', stationName: 'Station 1', status: 'green', studentCount: 2 },
    { id: '2', teacherName: 'Teacher B', stationName: 'Station 2', status: 'yellow', studentCount: 1 },
  ],
  pendingReviews: [
    { id: '1', teacherName: 'Teacher A', studentNames: ['Student A', 'Student B'] },
  ],
  summary: { sessionsCompleted: 6, trialsLogged: 124, incidents: 1, goalsMastered: 2 },
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  clockPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  clockText: { fontWeight: '700', color: colors.navyText, fontVariant: ['tabular-nums'] },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  liveSessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  quickActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  quickActionText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
