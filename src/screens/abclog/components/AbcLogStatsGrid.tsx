import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import type { AbcStats } from '../types';

interface AbcLogStatsGridProps {
  stats: AbcStats | null;
}

export const AbcLogStatsGrid: React.FC<AbcLogStatsGridProps> = React.memo(({ stats }) => {
  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statCaption}>Total Incidents</Text>
        <Text style={[styles.statValueLg, { color: '#0EA5E9' }]}>{stats?.totalIncidents ?? 0}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCaption}>Most Common Behavior</Text>
        <Text style={styles.statValueMd}>{stats?.mostCommonBehavior ?? 'N/A'}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCaption}>Most Common Antecedent</Text>
        <Text style={styles.statValueMd}>{stats?.mostCommonAntecedent ?? 'N/A'}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCaption}>This Week</Text>
        <Text style={[styles.statValueLg, { color: '#FACC15' }]}>{stats?.thisWeek ?? 0}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  statCaption: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  statValueLg: {
    fontSize: 24,
    fontWeight: '700',
  },
  statValueMd: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});
