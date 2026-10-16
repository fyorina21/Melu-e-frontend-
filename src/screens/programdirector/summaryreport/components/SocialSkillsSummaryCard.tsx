// src/screens/programdirector/summaryreport/components/SocialSkillsSummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { SocialSkillsData } from '../summaryReportTypes';

interface SocialSkillsSummaryCardProps {
  socialSkills?: SocialSkillsData;
}

export const SocialSkillsSummaryCard: React.FC<SocialSkillsSummaryCardProps> = React.memo(
  ({ socialSkills }) => {
    const scores = socialSkills?.scores;
    const scoreKeys = scores ? Object.keys(scores) : [];

    if (!socialSkills || !scores || scoreKeys.length === 0) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Social Skills Questionnaire</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.subNote}>
            Completed: <Text style={styles.subNoteBold}>{socialSkills.percent ?? 0}%</Text>
          </Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Question ID</Text>
              <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 1 }]}>Score</Text>
            </View>

            {scoreKeys.map((key) => (
              <View key={key} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableBoldText, { flex: 2 }]}>{key}</Text>
                <Text style={[styles.tableCell, styles.tableRight, { flex: 1 }]}>
                  {scores[key]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  },
);

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
  subNote: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  subNoteBold: {
    fontWeight: '700',
    color: colors.navyText,
  },
  tableContainer: {
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    fontSize: 13,
    color: colors.bodyText,
  },
  tableBoldText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  tableRight: {
    textAlign: 'right',
  },
});
