// src/screens/director/progress/components/DirectorAssessmentSummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import StatusPill from '../../../../components/StatusPill';
import { assessmentStatusType } from '../directorProgressTypes';

interface DirectorAssessmentSummaryCardProps {
  skillsStatus: string;
  behaviorStatus: string;
  preferencesStatus: string;
}

export const DirectorAssessmentSummaryCard: React.FC<DirectorAssessmentSummaryCardProps> =
  React.memo(({ skillsStatus, behaviorStatus, preferencesStatus }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Clinical Assessment Summary</Text>
        <View style={styles.assessmentGrid}>
          <View style={styles.assessmentItem}>
            <Text style={styles.assessmentLabel}>Skills Assessment</Text>
            <StatusPill status={assessmentStatusType(skillsStatus)} />
          </View>
          <View style={styles.assessmentItem}>
            <Text style={styles.assessmentLabel}>Behavior Assessment</Text>
            <StatusPill status={assessmentStatusType(behaviorStatus)} />
          </View>
          <View style={styles.assessmentItem}>
            <Text style={styles.assessmentLabel}>Preferences Assessment</Text>
            <StatusPill status={assessmentStatusType(preferencesStatus)} />
          </View>
        </View>
      </View>
    );
  });

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  assessmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  assessmentItem: {
    flexGrow: 1,
    minWidth: 200,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  assessmentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
  },
});
