import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface GoalBankHeaderProps {
  onAddGoal: () => void;
}

export const GoalBankHeader: React.FC<GoalBankHeaderProps> = React.memo(({ onAddGoal }) => {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.badgeIcon}>
          <Feather name="target" size={20} color={colors.navyText} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Goal Bank Management</Text>
          <Text style={styles.pageSubtitle}>
            Review, add, and manage the shared clinical goal bank
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addGoalBtn}
        onPress={onAddGoal}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Add new goal"
      >
        <Feather name="plus" size={16} color={colors.navyText} />
        <Text style={styles.addGoalBtnText}>Add Goal</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: typography.h1,
  pageSubtitle: typography.caption,
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addGoalBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 12,
  },
});
