// src/screens/parent/childprogress/components/ChildGoalsProgressCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { goalBarColor, statusBadge, type Goal } from '../childProgressTypes';

interface ChildGoalsProgressCardProps {
  childName: string;
  goals: Goal[];
}

export const ChildGoalsProgressCard: React.FC<ChildGoalsProgressCardProps> = React.memo(
  ({ childName, goals }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How is {childName} doing with their goals?</Text>
        {goals.map((g) => {
          const sb = statusBadge(g.status);
          return (
            <View key={g.id} style={styles.goalRow}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalName}>{g.name}</Text>
                <View style={styles.goalHeaderRight}>
                  <Text style={styles.goalPct}>{g.pct}%</Text>
                  <View style={[styles.goalBadge, { backgroundColor: sb.bg }]}>
                    <Text style={[styles.goalBadgeText, { color: sb.text }]}>{g.status}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.max(0, g.pct))}%`,
                      backgroundColor: goalBarColor(g.pct),
                    },
                  ]}
                />
              </View>
              {g.updated ? <Text style={styles.goalUpdated}>Last updated: {g.updated}</Text> : null}
            </View>
          );
        })}
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
  goalRow: {
    gap: 4,
    marginBottom: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: spacing.sm,
  },
  goalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  goalBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  goalUpdated: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
