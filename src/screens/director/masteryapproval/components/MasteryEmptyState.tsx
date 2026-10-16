// src/screens/director/masteryapproval/components/MasteryEmptyState.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

export const MasteryEmptyState: React.FC = React.memo(() => {
  return (
    <View style={styles.emptyCard}>
      <Feather name="check-circle" size={32} color={colors.successGreen} />
      <Text style={styles.emptyTitle}>All Clear!</Text>
      <Text style={styles.emptySub}>No pending goal mastery approvals awaiting review.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: spacing.xs,
  },
  emptySub: {
    fontSize: 12,
    color: colors.mutedText,
  },
});
