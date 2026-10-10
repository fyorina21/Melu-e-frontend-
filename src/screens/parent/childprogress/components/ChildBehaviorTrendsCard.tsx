// src/screens/parent/childprogress/components/ChildBehaviorTrendsCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { BehaviorTrend } from '../childProgressTypes';

interface ChildBehaviorTrendsCardProps {
  behaviorTrends: BehaviorTrend[];
}

export const ChildBehaviorTrendsCard: React.FC<ChildBehaviorTrendsCardProps> = React.memo(
  ({ behaviorTrends }) => {
    const max = Math.max(1, ...behaviorTrends.map((d) => d.incidents));

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Behavior Observations</Text>
        <Text style={styles.behaviorSub}>
          This month:{' '}
          <Text style={styles.behaviorSubBold}>
            {behaviorTrends[behaviorTrends.length - 1]?.incidents ?? 0} incidents recorded
          </Text>{' '}
          <Text style={{ color: '#16A34A' }}>(improving overall)</Text>
        </Text>
        <View style={styles.chartWrap}>
          <View style={styles.chartRow}>
            {behaviorTrends.map((d) => (
              <View key={d.month} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: `${Math.max(6, Math.round((d.incidents / max) * 100))}%`,
                      backgroundColor: '#38BDF8',
                    },
                  ]}
                />
                <Text style={styles.chartX}>{d.month}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartCaption}>Monthly behavior incidents — lower is better</Text>
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
    borderColor: '#F3F4F6',
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: spacing.md,
  },
  behaviorSub: {
    fontSize: 13,
    color: colors.mutedText,
    marginBottom: spacing.md,
  },
  behaviorSubBold: {
    fontWeight: '600',
    color: '#374151',
  },
  chartWrap: {
    gap: spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    height: 130,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  chartBar: {
    width: '70%',
    maxWidth: 28,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 6,
  },
  chartX: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chartCaption: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
