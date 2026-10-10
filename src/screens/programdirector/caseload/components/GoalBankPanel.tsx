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
  onAddNewGoal: () => void;
  onAssignGoal: (goal: Goal) => void;
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
  }) => {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h3}>Goal Bank</Text>
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
              <Text style={styles.noResults}>No goals match your search.</Text>
            </View>
          ) : (
            goals.map((goal) => <GoalCard key={goal.id} goal={goal} onAssign={onAssignGoal} />)
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
