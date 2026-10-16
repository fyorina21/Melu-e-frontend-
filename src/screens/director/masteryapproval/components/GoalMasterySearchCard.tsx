// src/screens/director/masteryapproval/components/GoalMasterySearchCard.tsx

import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface GoalMasterySearchCardProps {
  search: string;
  onSearchChange: (text: string) => void;
}

export const GoalMasterySearchCard: React.FC<GoalMasterySearchCardProps> = React.memo(
  ({ search, onSearchChange }) => {
    return (
      <View style={styles.searchCard}>
        <Feather name="search" size={16} color={colors.mutedText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name or goal domain..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={onSearchChange}
          accessibilityRole="search"
          accessibilityLabel="Search students or goals"
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 13,
    color: colors.navyText,
  },
});
