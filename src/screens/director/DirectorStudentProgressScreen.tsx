// screens/director/DirectorDashboardScreen.tsx
// SCR-DIR-001: Director Dashboard Screen

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getDirectorDashboard } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

interface AlertItem {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
}

interface GroupSummary {
  id: string;
  name: string;
  studentsCount: number;
  teachersCount: number;
  status: string;
}

interface DirectorDashboardData {
  stats: {
    totalStudents: number;
    activeSessions: number;
    teachersOnDuty: number;
    pendingReviews: number;
  };
  alerts: AlertItem[];
  activities: ActivityItem[];
  groups: GroupSummary[];
}

const FALLBACK_DATA: DirectorDashboardData = {
  stats: {
    totalStudents: 42,
    activeSessions: 8,
    teachersOnDuty: 12,
    pendingReviews: 3,
  },
  alerts: [
    {
      id: 'a1',
      type: 'warning',
      title: 'IEP Review Due',
      description: 'Student Aiden Rivera has an IEP review scheduled for this Friday.',
      timestamp: '10m ago',
    },
    {
      id: 'a2',
      type: 'danger',
      title: 'Incident Logged',
      description: 'Behavior incident logged in Group B during morning station.',
      timestamp: '1h ago',
    },
  ],
  activities: [
    { id: 'act1', user: 'Ms. Reyes', action: 'Completed ABA session for Student A', time: '15m ago' },
    { id: 'act2', user: 'Mr. Cruz', action: 'Submitted weekly progress report', time: '45m ago' },
    { id: 'act3', user: 'Ms. Santos', action: 'Updated trial logs for Group C', time: '2h ago' },
  ],
  groups: [
    { id: 'g1', name: 'Group A - Basic Therapy', studentsCount: 12, teachersCount: 4, status: 'Active' },
    { id: 'g2', name: 'Group B - Advanced ABA', studentsCount: 15, teachersCount: 5, status: 'Active' },
    { id: 'g3', name: 'Group C - Early Intervention', studentsCount: 15, teachersCount: 3, status: 'Active' },
  ],
};

export default function DirectorDashboardScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorStudentProgress'>) {  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DirectorDashboardData>(FALLBACK_DATA);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDirectorDashboard();
      if (res?.data) {
        setData({
          stats: res.data.stats || FALLBACK_DATA.stats,
          alerts: Array.isArray(res.data.alerts) ? res.data.alerts : [],
          activities: Array.isArray(res.data.activities) ? res.data.activities : [],
          groups: Array.isArray(res.data.groups) ? res.data.groups : [],
        });
      }
    } catch {
      setData(FALLBACK_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Dashboard"
          onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as any)}
        />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.navyText} />
        </View>
      </SafeAreaView>
    );
  }

  // Safe extractions with fallback arrays to guarantee .map never receives undefined
  const alertsList = Array.isArray(data?.alerts) ? data.alerts : [];
  const activitiesList = Array.isArray(data?.activities) ? data.activities : [];
  const groupsList = Array.isArray(data?.groups) ? data.groups : [];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Dashboard"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as any)}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={typography.h1}>Director Dashboard</Text>
          <Text style={typography.caption}>Overview & Operational Metrics</Text>
        </View>

        {/* Key Operational Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={typography.caption}>Total Students</Text>
            <Text style={typography.h1}>{data?.stats?.totalStudents ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.caption}>Active Sessions</Text>
            <Text style={typography.h1}>{data?.stats?.activeSessions ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.caption}>Teachers On Duty</Text>
            <Text style={typography.h1}>{data?.stats?.teachersOnDuty ?? 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={typography.caption}>Pending Reviews</Text>
            <Text style={typography.h1}>{data?.stats?.pendingReviews ?? 0}</Text>
          </View>
        </View>

        {/* Priority Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.navyText} />
            <Text style={typography.h3}>Priority Alerts</Text>
          </View>
          {alertsList.length === 0 ? (
            <Text style={typography.caption}>No active alerts at this time.</Text>
          ) : (
            alertsList.map((alert) => (
              <View key={alert.id} style={styles.alertRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{alert.title}</Text>
                  <Text style={typography.caption}>{alert.description}</Text>
                </View>
                <Text style={typography.caption}>{alert.timestamp}</Text>
              </View>
            ))
          )}
        </View>

        {/* Active Therapy Groups */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people-outline" size={20} color={colors.navyText} />
            <Text style={typography.h3}>Active Groups</Text>
          </View>
          {groupsList.length === 0 ? (
            <Text style={typography.caption}>No active groups found.</Text>
          ) : (
            groupsList.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupRow}
                onPress={() => navigation.navigate('DirectorStudentProgress')}
              >
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{group.name}</Text>
                  <Text style={typography.caption}>
                    {group.studentsCount} Students · {group.teachersCount} Teachers
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Staff Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={20} color={colors.navyText} />
            <Text style={typography.h3}>Recent Staff Activity</Text>
          </View>
          {activitiesList.length === 0 ? (
            <Text style={typography.caption}>No recent activity logged.</Text>
          ) : (
            activitiesList.map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{act.user}</Text>
                  <Text style={typography.caption}>{act.action}</Text>
                </View>
                <Text style={typography.caption}>{act.time}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});