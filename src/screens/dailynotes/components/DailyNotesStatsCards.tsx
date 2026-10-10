import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';
import type { DailyNotesStats } from '../dailyNotesTypes';

interface DailyNotesStatsCardsProps {
  stats: DailyNotesStats;
}

export const DailyNotesStatsCards: React.FC<DailyNotesStatsCardsProps> = React.memo(({ stats }) => {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Sessions Completed</Text>
        <Text style={[styles.statValue, { color: '#0284C7' }]}>{stats.sessionsCompleted}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Total Trials</Text>
        <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.totalTrials}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Avg Independence</Text>
        <Text style={[styles.statValue, { color: '#059669' }]}>{stats.avgIndependence}%</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Reviews Pending</Text>
        <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.reviewsPending}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
