// src/screens/assessments/behavior/components/BehaviorSummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { MASS_ITEMS, FAST_ITEMS } from '../behaviorTypes';

interface BehaviorSummaryCardProps {
  massAnswered: number;
  fastAnswered: number;
  recordsCount: number;
  identifiedFunction: string;
}

export const BehaviorSummaryCard: React.FC<BehaviorSummaryCardProps> = React.memo(
  ({ massAnswered, fastAnswered, recordsCount, identifiedFunction }) => {
    return (
      <View style={styles.card}>
        <Text style={typography.h3}>Assessment Summary</Text>
        <Text style={typography.body}>
          MASS: {massAnswered}/{MASS_ITEMS.length} answered · FAST: {fastAnswered}/
          {FAST_ITEMS.length} answered · ABC: {recordsCount} incidents
        </Text>
        {(massAnswered > 0 || fastAnswered > 0) && (
          <View style={styles.summaryBox}>
            <Text style={typography.bodyBold}>Identified function: {identifiedFunction}</Text>
            <Text style={typography.caption}>
              Recommendation: prioritize antecedent manipulations and reinforcement strategies that
              address the {identifiedFunction} function, and continue ABC tracking to confirm
              patterns.
            </Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  summaryBox: {
    backgroundColor: colors.statusPendingBg,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
});
