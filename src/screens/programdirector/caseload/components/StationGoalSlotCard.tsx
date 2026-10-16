import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { type SlotKey, type GoalWithStatus, slotLabels, statusBadgeColors } from '../caseloadTypes';

interface StationGoalSlotCardProps {
  slot: SlotKey;
  goal: GoalWithStatus | null;
  onRemove: (slot: SlotKey) => void;
  onViewProgress: (goal: GoalWithStatus) => void;
}

export const StationGoalSlotCard: React.FC<StationGoalSlotCardProps> = React.memo(
  ({ slot, goal, onRemove, onViewProgress }) => {
    if (!goal) {
      return (
        <View style={styles.emptySlot}>
          <Text style={styles.emptySlotText}>{slotLabels[slot]} — Empty</Text>
        </View>
      );
    }

    const badge = statusBadgeColors[goal.status] || statusBadgeColors.Active;

    return (
      <View style={styles.goalSlot}>
        <View style={styles.goalSlotHeader}>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={typography.caption}>{goal.domain}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{goal.status}</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabelsRow}>
            <Text style={typography.caption}>Progress</Text>
            <Text style={typography.caption}>{goal.progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, goal.progress))}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.slotActionsRow}>
          <TouchableOpacity
            style={[styles.slotActionBtn, styles.removeBtn]}
            onPress={() => onRemove(slot)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Remove goal ${goal.name}`}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.slotActionBtn, styles.chartBtn]}
            onPress={() => onViewProgress(goal)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View progress for goal ${goal.name}`}
          >
            <Feather name="bar-chart-2" size={12} color="#38BDF8" />
            <Text style={styles.chartBtnText}>View Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  emptySlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  emptySlotText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.mutedText,
  },
  goalSlot: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  goalSlotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBlock: {
    gap: spacing.xs,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.statusNotStartedBg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: '#38BDF8',
  },
  slotActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
  },
  slotActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  removeBtn: {
    borderColor: '#FECACA',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  chartBtn: {
    borderColor: '#BAE6FD',
  },
  chartBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
});
