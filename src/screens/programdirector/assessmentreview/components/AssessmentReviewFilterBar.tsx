// src/screens/programdirector/assessmentreview/components/AssessmentReviewFilterBar.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { STATUS_OPTIONS, normalizeStatus, type AssessmentListItem } from '../reviewTypes';

interface AssessmentReviewFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  list: AssessmentListItem[] | null;
}

export const AssessmentReviewFilterBar: React.FC<AssessmentReviewFilterBarProps> = React.memo(
  ({ search, onSearchChange, statusFilter, onStatusFilterChange, list }) => {
    return (
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or ID..."
            placeholderTextColor={colors.mutedText}
            value={search}
            onChangeText={onSearchChange}
            accessibilityRole="search"
            accessibilityLabel="Search by student name or ID"
          />
        </View>

        <View style={styles.filterRow}>
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt;
            const count =
              opt === 'All'
                ? Array.isArray(list)
                  ? list.length
                  : 0
                : Array.isArray(list)
                  ? list.filter((r) => r.status === opt || normalizeStatus(r.status) === opt).length
                  : 0;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => onStatusFilterChange(opt)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`${opt} status filter, ${count} students`}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {opt} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    color: colors.navyText,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  chipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedText,
  },
  chipTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
