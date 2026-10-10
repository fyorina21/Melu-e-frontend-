import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { SlotKey, StudentGoals, GoalWithStatus } from '../caseloadTypes';
import { StationGoalSlotCard } from './StationGoalSlotCard';

interface StationGoalsPanelProps {
  studentGoals: StudentGoals;
  savedFeedback: boolean;
  onRemove: (slot: SlotKey) => void;
  onViewProgress: (goal: GoalWithStatus) => void;
  onSave: () => void;
}

export const StationGoalsPanel: React.FC<StationGoalsPanelProps> = React.memo(
  ({ studentGoals, savedFeedback, onRemove, onViewProgress, onSave }) => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.label}>ASSIGNED GOALS & STATIONS</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {[1, 2].map((stationNum) => (
            <View key={stationNum} style={styles.stationBlock}>
              <View style={styles.stationHeader}>
                <View
                  style={[
                    styles.stationBadge,
                    stationNum === 1 ? styles.stationBadgeBlue : styles.stationBadgeYellow,
                  ]}
                >
                  <Text
                    style={
                      stationNum === 1 ? styles.stationBadgeTextWhite : styles.stationBadgeTextDark
                    }
                  >
                    {stationNum}
                  </Text>
                </View>
                <Text style={typography.label}>Station {stationNum}</Text>
              </View>

              <View style={styles.stationSlots}>
                <StationGoalSlotCard
                  slot={`station${stationNum}-0` as SlotKey}
                  goal={studentGoals[`station${stationNum}-0` as SlotKey]}
                  onRemove={onRemove}
                  onViewProgress={onViewProgress}
                />
                <StationGoalSlotCard
                  slot={`station${stationNum}-1` as SlotKey}
                  goal={studentGoals[`station${stationNum}-1` as SlotKey]}
                  onRemove={onRemove}
                  onViewProgress={onViewProgress}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save caseload changes"
        >
          {savedFeedback ? (
            <>
              <Feather name="check-circle" size={16} color="#059669" />
              <Text style={styles.saveBtnText}>Saved!</Text>
            </>
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
  },
  stationBlock: {
    gap: spacing.sm,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationBadgeBlue: {
    backgroundColor: '#38BDF8',
  },
  stationBadgeYellow: {
    backgroundColor: colors.promptPP,
  },
  stationBadgeTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  stationBadgeTextDark: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  stationSlots: {
    gap: spacing.sm,
  },
  saveBtn: {
    margin: spacing.md,
    marginTop: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.promptPP,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
});
