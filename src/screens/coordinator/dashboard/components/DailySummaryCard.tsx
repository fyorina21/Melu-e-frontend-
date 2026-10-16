import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DailySummaryCardProps {
  summary: {
    completed: number;
    trials: number;
    incidents: number;
    goalsMastered: number;
  };
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = React.memo(({ summary }) => {
  const dailySummary: {
    label: string;
    value: number;
    icon: keyof typeof Feather.glyphMap;
    color: string;
  }[] = [
    {
      label: 'Sessions Completed',
      value: summary.completed,
      icon: 'check-circle',
      color: '#16A34A',
    },
    {
      label: 'Trials Logged',
      value: summary.trials,
      icon: 'clipboard',
      color: colors.primaryYellowDark,
    },
    {
      label: 'Incidents Recorded',
      value: summary.incidents,
      icon: 'alert-circle',
      color: '#F97316',
    },
    {
      label: 'Goals Mastered',
      value: summary.goalsMastered,
      icon: 'trending-up',
      color: '#A855F7',
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Feather name="clipboard" size={18} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Daily Summary</Text>
      </View>
      <View style={styles.summaryGrid}>
        {dailySummary.map((item) => (
          <View key={item.label} style={styles.summaryItem}>
            <Feather name={item.icon} size={16} color={item.color} />
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryItem: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});
