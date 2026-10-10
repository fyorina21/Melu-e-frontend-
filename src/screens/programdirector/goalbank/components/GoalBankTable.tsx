import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type ExtendedGoal } from '../types';

interface GoalBankTableProps {
  goals: ExtendedGoal[];
  totalGoalsCount: number;
  onEdit: (goal: ExtendedGoal) => void;
  onPreview: (goal: ExtendedGoal) => void;
}

export const GoalBankTable: React.FC<GoalBankTableProps> = React.memo(
  ({ goals, totalGoalsCount, onEdit, onPreview }) => {
    return (
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            <View style={[styles.tr, styles.trHeader]}>
              <Text style={[styles.th, styles.colName]}>Goal Name</Text>
              <Text style={[styles.th, styles.colDomain]}>Domain</Text>
              <Text style={[styles.th, styles.colDesc]}>Description</Text>
              <Text style={[styles.th, styles.colUsage]}>Usage</Text>
              <Text style={[styles.th, styles.colStatus]}>Status</Text>
              <Text style={[styles.th, styles.colActions]}>Actions</Text>
            </View>

            {goals.length === 0 ? (
              <View style={styles.emptyRow}>
                <Feather name="search" size={20} color={colors.mutedText} />
                <Text style={styles.emptyText}>
                  {totalGoalsCount === 0
                    ? 'No goals in the bank yet. Add your first goal above.'
                    : 'No goals match your search.'}
                </Text>
              </View>
            ) : (
              goals.map((g) => (
                <View key={g.id} style={styles.tr}>
                  <Text style={[styles.td, styles.colName, styles.tdName]} numberOfLines={2}>
                    {g.name}
                  </Text>
                  <View style={[styles.cell, styles.colDomain]}>
                    <View style={styles.domainBadge}>
                      <Text style={styles.domainBadgeText} numberOfLines={1}>
                        {g.domain}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.td, styles.colDesc]} numberOfLines={2}>
                    {g.description}
                  </Text>
                  <View style={[styles.cell, styles.colUsage]}>
                    <View
                      style={[
                        styles.badge,
                        g.usageCount > 0 ? styles.badgeUsage : styles.badgeUsageZero,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          g.usageCount > 0 ? styles.badgeTextUsage : styles.badgeTextUsageZero,
                        ]}
                      >
                        {g.usageCount}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.cell, styles.colStatus]}>
                    <View
                      style={[
                        styles.badge,
                        g.status === 'active' ? styles.badgeActive : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          g.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive,
                        ]}
                      >
                        {g.status === 'active' ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.cell, styles.colActions]}>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.actionBtnEdit}
                        onPress={() => onEdit(g)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${g.name}`}
                      >
                        <Feather name="edit-2" size={12} color={colors.navyText} />
                        <Text style={styles.actionBtnTextEdit}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtnPreview}
                        onPress={() => onPreview(g)}
                        accessibilityRole="button"
                        accessibilityLabel={`Preview ${g.name}`}
                      >
                        <Feather name="eye" size={12} color="#0369A1" />
                        <Text style={styles.actionBtnTextPreview}>Preview</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  table: {
    minWidth: 800,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trHeader: {
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 13,
    color: colors.bodyText,
  },
  cell: {
    justifyContent: 'center',
  },
  tdName: {
    fontWeight: '600',
    color: colors.navyText,
  },
  colName: { width: 170, paddingRight: spacing.sm },
  colDomain: { width: 150, paddingRight: spacing.sm },
  colDesc: { flex: 1, minWidth: 220, paddingRight: spacing.sm },
  colUsage: { width: 75, alignItems: 'center' },
  colStatus: { width: 85, alignItems: 'center' },
  colActions: { width: 150, alignItems: 'flex-end' },
  domainBadge: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  domainBadgeText: {
    fontSize: 12,
    color: colors.bodyText,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeInactive: { backgroundColor: '#F1F5F9' },
  badgeUsage: { backgroundColor: '#E0F2FE' },
  badgeUsageZero: { backgroundColor: '#F8FAFC' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextActive: { color: '#16A34A' },
  badgeTextInactive: { color: '#64748B' },
  badgeTextUsage: { color: '#0369A1' },
  badgeTextUsageZero: { color: '#94A3B8' },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryYellow,
  },
  actionBtnTextEdit: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
  actionBtnPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  actionBtnTextPreview: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
  },
});
