import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { GoalRow } from '../studentProgressTypes';
import { StatusBadge, MiniProgressBar } from './AssessmentProgressCards';

interface CurrentGoalsTableProps {
  goals: GoalRow[];
}

export function CurrentGoalsTable({ goals }: CurrentGoalsTableProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Feather name="target" size={16} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Current Goals</Text>
      </View>
      {goals.slice(0, 6).map((goal, i, arr) => (
        <View key={goal.id} style={[styles.tableRow, i < arr.length - 1 && styles.tableRowBorder]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalCellName}>{goal.name}</Text>
          </View>
          <View style={styles.goalRightCol}>
            <StatusBadge status={goal.status} />
            <MiniProgressBar
              value={goal.percent}
              color={goal.status === 'Mastered' ? '#22C55E' : colors.primaryYellowDark}
            />
          </View>
        </View>
      ))}
      {goals.length === 0 && <Text style={styles.emptyText}>No goals assigned yet.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalCellName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  goalRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 170,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
