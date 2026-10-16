import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { Goal } from '../caseloadTypes';

interface GoalCardProps {
  goal: Goal;
  onAssign: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = React.memo(({ goal, onAssign }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={typography.bodyBold} numberOfLines={1}>
            {goal.name}
          </Text>
          <View style={styles.domainBadge}>
            <Text style={styles.domainBadgeText}>{goal.domain}</Text>
          </View>
        </View>

        <Text style={typography.caption} numberOfLines={2}>
          {goal.description}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.assignBtn}
        onPress={() => onAssign(goal)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Assign goal ${goal.name}`}
      >
        <Text style={styles.assignBtnText}>Assign</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  cardBody: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  domainBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
  },
  assignBtn: {
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
