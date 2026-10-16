// src/screens/programdirector/summaryreport/components/AbllsSummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import AbllsGridView from '../../../../components/AbllsGridView';

interface AbllsSummaryCardProps {
  abllsScores?: Record<string, any>;
}

export const AbllsSummaryCard: React.FC<AbllsSummaryCardProps> = React.memo(({ abllsScores }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderBlue}>
        <Text style={styles.cardHeaderText}>Skills Assessment — ABLLS-R</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.sectionTitle}>ABLLS-R Skill Tracking Grid</Text>
        <AbllsGridView scores={abllsScores || {}} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeaderBlue: {
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 4,
  },
});
