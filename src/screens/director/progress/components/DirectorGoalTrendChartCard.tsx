// src/screens/director/progress/components/DirectorGoalTrendChartCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DirectorGoalTrendChartCardProps {
  trend?: number[];
}

export const DirectorGoalTrendChartCard: React.FC<DirectorGoalTrendChartCardProps> = React.memo(
  ({ trend = [] }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Goal Progress Trend (Weekly)</Text>
        <View style={styles.chartWrap}>
          {trend.length > 0 ? (
            trend.map((v, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.barWrap}>
                  <View style={[styles.bar, { height: `${Math.min(100, Math.max(10, v))}%` }]} />
                </View>
                <Text style={styles.barLabel}>Wk {i + 1}</Text>
                <Text style={styles.barValue}>{v}%</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No weekly trend data recorded yet.</Text>
          )}
        </View>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: spacing.md,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barWrap: {
    width: 16,
    height: 110,
    justifyContent: 'flex-end',
    backgroundColor: colors.bgApp,
    borderRadius: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.primaryYellow,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.bodyText,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.navyText,
  },
});
