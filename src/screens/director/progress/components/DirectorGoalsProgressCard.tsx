// src/screens/director/progress/components/DirectorGoalsProgressCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { DirectorGoal } from '../directorProgressTypes';

interface DirectorGoalsProgressCardProps {
  goals: DirectorGoal[];
}

export const DirectorGoalsProgressCard: React.FC<DirectorGoalsProgressCardProps> = React.memo(
  ({ goals }) => {
    const uniqueGoals = goals.filter(
      (g, index, self) => index === self.findIndex((t) => t.name === g.name),
    );

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Current Active Goals</Text>
          <Text style={styles.countBadge}>{uniqueGoals.length} Goals Assigned</Text>
        </View>

        {uniqueGoals.length === 0 ? (
          <Text style={styles.emptyText}>No active goals assigned to this student yet.</Text>
        ) : (
          uniqueGoals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalName}>{g.name}</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, g.percent))}%` },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.goalRight}>
                <Text style={styles.goalPercent}>{g.percent}%</Text>
                <Text style={styles.goalStatusText}>
                  {g.percent >= 80 ? 'Mastery Ready' : 'In Progress'}
                </Text>
              </View>
            </View>
          ))
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  countBadge: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: radius.pill,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryYellowDark,
    borderRadius: radius.pill,
  },
  goalRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  goalPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.bodyText,
  },
});
