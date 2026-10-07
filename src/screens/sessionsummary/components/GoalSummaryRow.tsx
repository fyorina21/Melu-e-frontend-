import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { Goal } from '../../../types';
import { PROMPT_CONFIG } from '../types';

interface GoalSummaryRowProps {
  goal: Goal;
  onViewTrialLog: (goal: Goal) => void;
}

export const GoalSummaryRow: React.FC<GoalSummaryRowProps> = React.memo(
  ({ goal, onViewTrialLog }) => {
    const isTA = goal.goalType === 'task_analysis';
    const promptCounts = goal.promptBreakdown || {};

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeaderRow}>
          <View>
            <Text style={styles.goalTitle}>{goal.name}</Text>
            <Text style={styles.goalSubtitle}>{goal.totalTrials} trials</Text>
          </View>
          <View style={styles.independenceContainer}>
            <View style={styles.independenceTrend}>
              <Feather name="trending-up" size={14} color="#16A34A" />
              <Text style={styles.independencePercent}>{goal.independencePercent}%</Text>
            </View>
            <Text style={styles.independenceLabel}>Independence</Text>
          </View>
        </View>

        {isTA ? (
          <View style={styles.taContainer}>
            {(goal.steps || []).map((step, idx) => (
              <View key={step.id} style={styles.taStepSummaryRow}>
                <Text style={typography.body}>
                  Step {idx + 1}: {step.description}
                </Text>
                <Text style={typography.caption}>
                  {step.successCount}/{step.totalTrials} · {step.independencePercent}%
                </Text>
              </View>
            ))}
            <Text style={typography.caption}>
              Overall mastery status: {goal.overallMasteryStatus}
            </Text>
          </View>
        ) : (
          <View style={styles.promptGrid}>
            {[
              { key: 'FP', label: 'FP' },
              { key: 'PP', label: 'PP' },
              { key: 'G', label: 'G' },
              { key: 'INDEPENDENT', label: '+' },
            ].map(({ key, label }) => {
              const config = PROMPT_CONFIG[key];
              const count = promptCounts[key] ?? promptCounts[label] ?? 0;
              return (
                <View key={key} style={[styles.promptBox, { backgroundColor: config.bg }]}>
                  <Text style={[styles.promptCount, { color: config.text }]}>{count}</Text>
                  <Text style={[styles.promptLabel, { color: config.text }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={() => onViewTrialLog(goal)}
          style={styles.trialLogBtn}
          accessibilityRole="button"
          accessibilityLabel={`View trial log for ${goal.name}`}
        >
          <Text style={styles.linkText}>View Trial Log →</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.sm,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  independenceContainer: {
    alignItems: 'flex-end',
  },
  independenceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  independencePercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    fontVariant: ['tabular-nums'],
  },
  independenceLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  taContainer: {
    gap: 6,
    backgroundColor: colors.bgApp,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  taStepSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  promptGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  promptBox: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    gap: 2,
  },
  promptCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  trialLogBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
});
