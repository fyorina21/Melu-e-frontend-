import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { Slots, StationKey } from '../types';

interface GoalAssignmentTabProps {
  slots: Slots;
  onOpenGoalSelector: (station: StationKey, slotIndex: number) => void;
  onRemoveGoal: (station: StationKey, slotIndex: number) => void;
}

export function GoalAssignmentTab({
  slots,
  onOpenGoalSelector,
  onRemoveGoal,
}: GoalAssignmentTabProps) {
  return (
    <View style={styles.tabContentWrap}>
      {/* Station 1 Card */}
      <View style={styles.card}>
        <View style={styles.stationHeader}>
          <View style={styles.stationNumberBadge}>
            <Text style={styles.stationNumberText}>1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Station 1 — Basic Skills</Text>
            <Text style={styles.stationSub}>
              Foundational acquisition, receptive language, and early imitation
            </Text>
          </View>
        </View>

        <View style={styles.slotList}>
          {slots.station1.map((goal, idx) => (
            <View key={`s1-${idx}`} style={styles.slotContainer}>
              <Text style={styles.slotTag}>Slot {idx + 1}</Text>
              {goal ? (
                <View style={styles.filledGoalCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalTitleRow}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <View style={styles.domainChip}>
                        <Text style={styles.domainChipText}>{goal.domain}</Text>
                      </View>
                      {goal.goalType === 'task_analysis' && (
                        <View style={styles.taskChip}>
                          <Text style={styles.taskChipText}>Task Analysis</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.goalDesc} numberOfLines={2}>
                      {goal.description}
                    </Text>
                    <View style={styles.masteryRow}>
                      <Feather name="check-circle" size={12} color={colors.successGreen} />
                      <Text style={styles.masteryText}>
                        Mastery Criteria: {goal.masteryCriteria}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.changeGoalBtn}
                      onPress={() => onOpenGoalSelector('station1', idx)}
                      accessibilityLabel="Change goal"
                    >
                      <Feather name="refresh-cw" size={14} color={colors.navyText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeGoalBtn}
                      onPress={() => onRemoveGoal('station1', idx)}
                      accessibilityLabel="Remove goal"
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyGoalSlot}
                  onPress={() => onOpenGoalSelector('station1', idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign goal for Station 1 Slot ${idx + 1}`}
                >
                  <View style={styles.plusIconWrap}>
                    <Feather name="plus" size={16} color={colors.navyText} />
                  </View>
                  <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Station 2 Card */}
      <View style={styles.card}>
        <View style={styles.stationHeader}>
          <View style={[styles.stationNumberBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.stationNumberText, { color: '#1E40AF' }]}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Station 2 — Advanced Skills</Text>
            <Text style={styles.stationSub}>
              Expressive language, academic readiness, and generalization
            </Text>
          </View>
        </View>

        <View style={styles.slotList}>
          {slots.station2.map((goal, idx) => (
            <View key={`s2-${idx}`} style={styles.slotContainer}>
              <Text style={styles.slotTag}>Slot {idx + 1}</Text>
              {goal ? (
                <View style={styles.filledGoalCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalTitleRow}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <View style={styles.domainChip}>
                        <Text style={styles.domainChipText}>{goal.domain}</Text>
                      </View>
                      {goal.goalType === 'task_analysis' && (
                        <View style={styles.taskChip}>
                          <Text style={styles.taskChipText}>Task Analysis</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.goalDesc} numberOfLines={2}>
                      {goal.description}
                    </Text>
                    <View style={styles.masteryRow}>
                      <Feather name="check-circle" size={12} color={colors.successGreen} />
                      <Text style={styles.masteryText}>
                        Mastery Criteria: {goal.masteryCriteria}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.changeGoalBtn}
                      onPress={() => onOpenGoalSelector('station2', idx)}
                      accessibilityLabel="Change goal"
                    >
                      <Feather name="refresh-cw" size={14} color={colors.navyText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeGoalBtn}
                      onPress={() => onRemoveGoal('station2', idx)}
                      accessibilityLabel="Remove goal"
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.emptyGoalSlot}
                  onPress={() => onOpenGoalSelector('station2', idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Assign goal for Station 2 Slot ${idx + 1}`}
                >
                  <View style={styles.plusIconWrap}>
                    <Feather name="plus" size={16} color={colors.navyText} />
                  </View>
                  <Text style={styles.emptySlotText}>Assign Goal from Goal Bank</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentWrap: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stationNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyText,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  stationSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  slotList: {
    gap: 12,
  },
  slotContainer: {
    gap: 4,
  },
  slotTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  filledGoalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: 12,
    gap: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  domainChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  taskChip: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  taskChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  goalDesc: {
    fontSize: 12,
    color: colors.bodyText,
    marginBottom: 6,
    lineHeight: 18,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masteryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.successGreen,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 6,
  },
  changeGoalBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  removeGoalBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emptyGoalSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingVertical: 18,
  },
  plusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
});
