import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';
import type { SensoryMetrics } from '../types';

interface SensorySummaryCardProps {
  metrics: SensoryMetrics;
}

export const SensorySummaryCard: React.FC<SensorySummaryCardProps> = React.memo(({ metrics }) => {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Summary</Text>

      <Text style={styles.summarySubtitle}>BY ENGAGEMENT LEVEL</Text>
      <View style={styles.badgeRow}>
        <View style={styles.blueBadge}>
          <Text style={styles.badgeValBlue}>{metrics.engagementCounts['Independent']}</Text>
          <Text style={styles.badgeLabelBlue}>Independent</Text>
        </View>
        <View style={styles.blueBadge}>
          <Text style={styles.badgeValBlue}>
            {metrics.engagementCounts['Partial Physical Prompt']}
          </Text>
          <Text style={styles.badgeLabelBlue}>Partial Physical Prompt</Text>
        </View>
        <View style={styles.blueBadge}>
          <Text style={styles.badgeValBlue}>
            {metrics.engagementCounts['Full Physical Prompt']}
          </Text>
          <Text style={styles.badgeLabelBlue}>Full Physical Prompt</Text>
        </View>
        <View style={styles.blueBadge}>
          <Text style={styles.badgeValBlue}>{metrics.engagementCounts['Not Applicable']}</Text>
          <Text style={styles.badgeLabelBlue}>Not Applicable</Text>
        </View>
      </View>

      <Text style={[styles.summarySubtitle, styles.reactionTitleOffset]}>
        BY RESPONSE / REACTION
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.yellowBadge}>
          <Text style={styles.badgeValYellow}>{metrics.reactionCounts['Enjoyed']}</Text>
          <Text style={styles.badgeLabelYellow}>Enjoyed</Text>
        </View>
        <View style={styles.yellowBadge}>
          <Text style={styles.badgeValYellow}>{metrics.reactionCounts['Neutral']}</Text>
          <Text style={styles.badgeLabelYellow}>Neutral</Text>
        </View>
        <View style={styles.yellowBadge}>
          <Text style={styles.badgeValYellow}>{metrics.reactionCounts['Refused']}</Text>
          <Text style={styles.badgeLabelYellow}>Refused</Text>
        </View>
        <View style={styles.yellowBadge}>
          <Text style={styles.badgeValYellow}>{metrics.reactionCounts['Not Observed']}</Text>
          <Text style={styles.badgeLabelYellow}>Not Observed</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summarySubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  reactionTitleOffset: {
    marginTop: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  blueBadge: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  badgeValBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284C7',
  },
  badgeLabelBlue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
    textAlign: 'center',
    marginTop: 2,
  },
  yellowBadge: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: '#FEFCE8',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  badgeValYellow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#CA8A04',
  },
  badgeLabelYellow: {
    fontSize: 10,
    fontWeight: '600',
    color: '#854D0E',
    textAlign: 'center',
    marginTop: 2,
  },
});
