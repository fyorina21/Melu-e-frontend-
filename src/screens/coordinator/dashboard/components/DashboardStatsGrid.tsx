import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { CoordinatorStackParamList } from '../../../../types';

interface DashboardStatsGridProps {
  counts: {
    active: number;
    pending: number;
    students: number;
    teachers: number;
  };
  onNavigate: (route: keyof CoordinatorStackParamList) => void;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = React.memo(
  ({ counts, onNavigate }) => {
    const stats: {
      label: string;
      value: number;
      icon: keyof typeof Feather.glyphMap;
      color: string;
      bg: string;
      route: keyof CoordinatorStackParamList;
    }[] = [
      {
        label: 'Active Sessions Now',
        value: counts.active,
        icon: 'activity',
        color: colors.primaryYellowDark,
        bg: colors.bgApp,
        route: 'LiveSessionMonitoring',
      },
      {
        label: 'Sessions Pending Review',
        value: counts.pending,
        icon: 'file-text',
        color: '#FCD34D',
        bg: '#FFFBEB',
        route: 'SessionSummaryReview',
      },
      {
        label: 'Students in Therapy',
        value: counts.students,
        icon: 'target',
        color: '#22C55E',
        bg: '#F0FDF4',
        route: 'CoordinatorStudentProgress',
      },
      {
        label: 'Teachers On Duty',
        value: counts.teachers,
        icon: 'users',
        color: '#A855F7',
        bg: '#FAF5FF',
        route: 'WorkloadDashboard',
      },
    ];

    return (
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.label}
            style={styles.statCard}
            onPress={() => onNavigate(stat.route)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${stat.label}: ${stat.value}`}
          >
            <View style={[styles.statIconWrap, { backgroundColor: stat.bg }]}>
              <Feather name={stat.icon} size={24} color={stat.color} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
    flexGrow: 1,
    flexBasis: 220,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flexShrink: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
    marginTop: 2,
  },
});
