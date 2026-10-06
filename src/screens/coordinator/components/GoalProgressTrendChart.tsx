import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { GoalRow } from '../studentProgressTypes';

interface GoalProgressTrendChartProps {
  goals: GoalRow[];
}

export function GoalProgressTrendChart({ goals }: GoalProgressTrendChartProps) {
  const chartGoals = goals.slice(0, 2);
  const maxChartValue = Math.max(1, ...chartGoals.flatMap((g) => g.trend ?? []));

  return (
    <View style={styles.card}>
      <View style={styles.chartHeaderRow}>
        <Feather name="activity" size={16} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Goal Progress Trend</Text>
      </View>
      {chartGoals.length > 0 ? (
        <>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primaryYellowDark }]} />
              <Text style={styles.legendText}>{chartGoals[0]?.name ?? 'Goal 1'}</Text>
            </View>
            {chartGoals[1] && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FCD34D' }]} />
                <Text style={styles.legendText}>{chartGoals[1].name}</Text>
              </View>
            )}
          </View>
          <View style={styles.chartArea}>
            {(chartGoals[0]?.trend ?? []).map((v1, wi) => {
              const v2 = chartGoals[1]?.trend?.[wi];
              return (
                <View key={wi} style={styles.chartCol}>
                  <View style={styles.barsRow}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${(v1 / maxChartValue) * 100}%`,
                          backgroundColor: colors.primaryYellowDark,
                        },
                      ]}
                    >
                      <Text style={styles.chartBarValue}>{v1}%</Text>
                    </View>
                    {v2 !== undefined && (
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${(v2 / maxChartValue) * 100}%`,
                            backgroundColor: '#FCD34D',
                          },
                        ]}
                      >
                        <Text style={styles.chartBarValueDark}>{v2}%</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chartWeekLabel}>Wk {wi + 1}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No goal trend data yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 110,
  },
  chartBar: {
    width: 16,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    minHeight: 18,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartBarValueDark: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.navyText,
  },
  chartWeekLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
