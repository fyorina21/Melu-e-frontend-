// screens/goalprogress/GoalProgressScreen.js
// MR-36: Goal Progress Update
//
// ⚠️ DRAFT — no Figma frame exists for this screen (confirmed: the 6 screens
// sent are the whole design file). Built to match the established visual
// language (cards, status pills, yellow CTA) so it's consistent, but get
// this reviewed/approved by whoever owns design/product before treating it
// as final.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getGoalProgress, updateGoalProgress } from '../../api/sessionApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'GoalProgress'>;

interface GoalProgressData {
  name: string;
  studentName: string;
  category: string;
  overallPercent: number;
  currentPhaseName: string;
  currentPhaseDescription: string;
  consecutiveIndependentTrials: number;
  masteryThreshold: number;
  currentPhaseIndex?: number;
  trend: number[];
}

export default function GoalProgressScreen({ route }: Props) {
  const { studentId = 'DEMO_STUDENT', goalId = 'DEMO_GOAL' } = route.params;
  const [goal, setGoal] = useState<GoalProgressData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getGoalProgress(studentId, goalId);
      setGoal(data);
    } catch (err) {
      setGoal(DEMO_GOAL);
    }
  }, [studentId, goalId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvancePhase = async () => {
    try {
      await updateGoalProgress(studentId, goalId, { phaseIndex: (goal?.currentPhaseIndex ?? 0) + 1 });
      load();
    } catch (err) {
      // TODO: error toast
    }
  };

  if (!goal) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.h1}>{goal.name}</Text>
        <Text style={typography.body}>{goal.studentName} · {goal.category}</Text>

        <View style={styles.card}>
          <Text style={typography.label}>Overall Progress</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${goal.overallPercent}%` }]} />
          </View>
          <Text style={typography.caption}>{goal.overallPercent}% toward mastery</Text>
        </View>

        <View style={styles.card}>
          <Text style={typography.label}>Current Phase</Text>
          <Text style={typography.h2}>{goal.currentPhaseName}</Text>
          <Text style={typography.body}>{goal.currentPhaseDescription}</Text>
          <Text style={typography.caption}>
            Consecutive independent trials: {goal.consecutiveIndependentTrials}/{goal.masteryThreshold}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAdvancePhase}>
            <Text style={styles.primaryBtnText}>Advance to Next Phase</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={typography.label}>Trend (last 10 sessions)</Text>
          {/* TODO: swap for a real chart lib (victory-native / react-native-svg-charts)
              once one is approved for the project. Plain bars for now. */}
          <View style={styles.trendRow}>
            {goal.trend.map((pct, i) => (
              <View key={i} style={styles.trendBarWrap}>
                <View style={[styles.trendBar, { height: Math.max(4, pct) }]} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_GOAL: GoalProgressData = {
  name: 'Identify Colors',
  studentName: 'Student A',
  category: 'Cognitive',
  overallPercent: 45,
  currentPhaseName: 'Phase 2: Partial Prompt Fading',
  currentPhaseDescription: 'Student identifies 4/6 target colors with partial physical prompting.',
  consecutiveIndependentTrials: 2,
  masteryThreshold: 5,
  trend: [20, 25, 30, 28, 35, 40, 38, 42, 45, 45],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.statusInProgressText },
  primaryBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: { fontWeight: '700', color: colors.navyText },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 60 },
  trendBarWrap: { flex: 1, justifyContent: 'flex-end' },
  trendBar: { backgroundColor: colors.promptG, borderRadius: 2 },
});
