// src/screens/parent/childprogress/components/ChildProgressStatsGrid.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  bg: string;
  color: string;
  value: string;
  label: string;
}

function StatCard({ icon, bg, color, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface ChildProgressStatsGridProps {
  activeGoalsCount: number;
  goalsMasteredCount: number;
  sessionsThisMonthCount: number;
  averageIndependence: number;
}

export const ChildProgressStatsGrid: React.FC<ChildProgressStatsGridProps> = React.memo(
  ({ activeGoalsCount, goalsMasteredCount, sessionsThisMonthCount, averageIndependence }) => {
    return (
      <View style={styles.statsGrid}>
        <StatCard
          icon="clipboard"
          bg="#E0F2FE"
          color="#38BDF8"
          value={String(activeGoalsCount)}
          label="Goals Active"
        />
        <StatCard
          icon="check-circle"
          bg="#DCFCE7"
          color="#22C55E"
          value={String(goalsMasteredCount)}
          label="Goals Mastered"
        />
        <StatCard
          icon="calendar"
          bg="#FEF9C3"
          color="#EAB308"
          value={String(sessionsThisMonthCount)}
          label="Sessions This Month"
        />
        <StatCard
          icon="trending-up"
          bg="#F3E8FF"
          color="#A855F7"
          value={`${averageIndependence}%`}
          label="Independence Rate"
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
    fontWeight: '500',
  },
});
