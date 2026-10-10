import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { DOMAINS } from '../types';

interface GoalSearchFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  domainFilter: string;
  onDomainFilterChange: (domain: string) => void;
}

export const GoalSearchFilterBar: React.FC<GoalSearchFilterBarProps> = React.memo(
  ({ search, onSearchChange, domainFilter, onDomainFilterChange }) => {
    return (
      <View style={styles.card}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Feather name="search" size={16} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search goals by name or description..."
              placeholderTextColor={colors.mutedText}
              value={search}
              onChangeText={onSearchChange}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Feather name="x" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DOMAINS.map((d) => {
              const isActive = domainFilter === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => onDomainFilterChange(d)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${d}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  searchRow: {
    width: '100%',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.navyText,
    paddingVertical: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});
