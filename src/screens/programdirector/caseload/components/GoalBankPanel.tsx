import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { type Goal, allDomains } from '../caseloadTypes';
import { GoalCard } from './GoalCard';

interface GoalBankPanelProps {
  goals: Goal[];
  searchTerm: string;
  domainFilter: string;
  onSearchChange: (text: string) => void;
  onDomainFilterChange: (domain: string) => void;
  onAddNewGoal?: () => void;
  onAssignGoal: (goal: Goal) => void;
  isAssignDisabled?: boolean;
  assignedCount?: number;
  assignedGoalIds?: string[];
}

export const GoalBankPanel: React.FC<GoalBankPanelProps> = React.memo(
  ({
    goals,
    searchTerm,
    domainFilter,
    onSearchChange,
    onDomainFilterChange,
    onAddNewGoal,
    onAssignGoal,
    isAssignDisabled = false,
    assignedCount,
    assignedGoalIds = [],
  }) => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.titleWithBadge}>
              <Text style={typography.h3}>Goal Bank</Text>
              {assignedCount !== undefined && (
                <View style={[styles.countBadge, isAssignDisabled && styles.countBadgeMax]}>
                  <Text
                    style={[styles.countBadgeText, isAssignDisabled && styles.countBadgeTextMax]}
                  >
                    {assignedCount}/2 Assigned
                  </Text>
                </View>
              )}
            </View>
            {isAssignDisabled && (
              <Text style={styles.maxGoalsNotice}>
                Maximum 2 goals assigned at a time. Remove a goal to assign another.
              </Text>
            )}
          </View>
          {onAddNewGoal && (
            <TouchableOpacity
              style={styles.addGoalBtn}
              onPress={onAddNewGoal}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Add new goal to bank"
            >
              <Feather name="plus" size={14} color={colors.navyText} />
              <Text style={styles.addGoalBtnText}>Add New Goal to Bank</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchBlock}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={colors.mutedText} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search goals..."
              placeholderTextColor={colors.mutedText}
              value={searchTerm}
              onChangeText={onSearchChange}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.domainChipsRow}
          >
            {allDomains.map((d) => {
              const isActive = domainFilter === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => onDomainFilterChange(d)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.goalList} showsVerticalScrollIndicator={false}>
          {goals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noResults}>
                {searchTerm
                  ? 'No goals match your search.'
                  : 'No goals assigned from IUP Generation for this student yet.'}
              </Text>
            </View>
          ) : (
            goals.map((goal) => {
              const isAlreadyAssigned = assignedGoalIds.includes(goal.id);
              const disabled = isAssignDisabled || isAlreadyAssigned;
              const buttonText = isAlreadyAssigned ? 'Assigned' : 'Assign';
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onAssign={onAssignGoal}
                  disabled={disabled}
                  buttonText={buttonText}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  countBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeMax: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  countBadgeTextMax: {
    color: '#B45309',
  },
  maxGoalsNotice: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.promptPP,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addGoalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  searchBlock: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  searchWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: 40,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.navyText,
    fontSize: 14,
    backgroundColor: colors.bgApp,
  },
  domainChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  goalList: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResults: {
    ...typography.body,
    textAlign: 'center',
    color: colors.mutedText,
  },
});
