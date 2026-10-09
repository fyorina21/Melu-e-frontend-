import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CoordinatorStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { getActiveSessions, sendAlertToTeacher, exportSessionLog } from '../../api/coordinatorApi';
import { downloadTextFile } from '../../utils/webExport';
import { colors, radius, spacing } from '../../theme/colors';

import { type Session, type ActiveSessionRow, mapActiveSession } from './livesession/types';
import { LiveSessionStatsGrid } from './livesession/components/LiveSessionStatsGrid';
import { LiveSessionFilterBar } from './livesession/components/LiveSessionFilterBar';
import { LiveSessionCard } from './livesession/components/LiveSessionCard';
import { LiveSessionDetailModal } from './livesession/components/LiveSessionDetailModal';
import { SendAlertModal } from './livesession/components/SendAlertModal';

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'LiveSessionMonitoring'>;

export default function LiveSessionMonitoringScreen({ navigation }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [alertSession, setAlertSession] = useState<Session | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('FYI');
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await getActiveSessions({});
      setSessions(((Array.isArray(data) ? data : []) as ActiveSessionRow[]).map(mapActiveSession));
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) => prev.map((s) => ({ ...s, timer: s.timer + 1 })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) return 30;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setRefreshCountdown(30);
    loadSessions();
  }, [loadSessions]);

  const handleExport = useCallback(async () => {
    try {
      const { data } = await exportSessionLog({});
      const csv = (data as { csv?: string })?.csv ?? '';
      downloadTextFile('session_log.csv', csv);
    } catch {
      Alert.alert('Export failed', 'Could not export the session log.');
    }
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchStation = stationFilter === 'all' || s.station === stationFilter;
      return matchStatus && matchStation;
    });
  }, [sessions, statusFilter, stationFilter]);

  const counts = useMemo(() => {
    return {
      total: sessions.length,
      onTrack: sessions.filter((s) => s.status === 'on-track').length,
      needsAttention: sessions.filter((s) => s.status === 'needs-attention').length,
      overdue: sessions.filter((s) => s.status === 'overdue').length,
    };
  }, [sessions]);

  const closeAlertModal = useCallback(() => {
    setAlertSession(null);
    setAlertMessage('');
    setAlertType('FYI');
  }, []);

  const handleSendAlert = useCallback(async () => {
    if (!alertMessage.trim() || !alertSession) {
      Alert.alert('Error', 'Please enter an alert message');
      return;
    }
    try {
      await sendAlertToTeacher(alertSession.id, { type: alertType, message: alertMessage });
      Alert.alert('Sent', `Alert sent to ${alertSession.teacher}`);
    } catch {
      Alert.alert('Failed', 'Could not deliver the alert.');
    }
    closeAlertModal();
  }, [alertMessage, alertSession, alertType, closeAlertModal]);

  const openStudent = useCallback(
    (studentId: string) => {
      setSelectedSession(null);
      navigation?.navigate?.('StudentProfile', { studentId });
    },
    [navigation],
  );

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

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Live Sessions" onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          <LiveSessionFilterBar
            statusFilter={statusFilter}
            stationFilter={stationFilter}
            refreshCountdown={refreshCountdown}
            onStatusFilterChange={setStatusFilter}
            onStationFilterChange={setStationFilter}
            onManualRefresh={handleManualRefresh}
            onExport={handleExport}
          />

          <LiveSessionStatsGrid counts={counts} />

          {/* Session Cards Grid */}
          <View style={styles.sessionGrid}>
            {filtered.map((session) => (
              <LiveSessionCard
                key={session.id}
                session={session}
                onSelectStudent={openStudent}
                onViewDetails={setSelectedSession}
                onSendAlert={setAlertSession}
              />
            ))}
            {filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No sessions match the selected filters.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Session Detail Modal */}
      <LiveSessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />

      {/* Send Alert Modal */}
      <SendAlertModal
        session={alertSession}
        alertType={alertType}
        alertMessage={alertMessage}
        onAlertTypeChange={setAlertType}
        onAlertMessageChange={setAlertMessage}
        onSend={handleSendAlert}
        onClose={closeAlertModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgCard,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1200,
    gap: spacing.lg,
  },
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  emptyState: {
    flexBasis: '100%',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
