
import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getGoalProgress, updateGoalProgress } from '../../api/sessionApi';
import { getTeacherStudentProfile } from '../../api/teacherExtrasApi';
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
  trend: number[];
}

interface GoalProgressRow {
  id: string;
  name: string;
  status: string;
  progressPercent: number;
}

interface GoalProgressResponse {
  studentId: string;
  goals: GoalProgressRow[];
}

interface StudentProfile {
  id: string;
  fullName: string;
}

export default function GoalProgressScreen({ navigation, route }: Props) {
  const { studentId, goalId } = route.params;
  const [goal, setGoal] = useState<GoalProgressData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getGoalProgress(studentId, goalId);
      const payload = res as GoalProgressResponse;
      const row = payload.goals.find((g) => g.id === goalId) ?? payload.goals[0];
      let studentName = '';
      try {
        const { data: profile } = await getTeacherStudentProfile(studentId);
        studentName = profile?.fullName ?? '';
      } catch (err) {}
      if (!row) {
        setLoadError(true);
        return;
      }
      setGoal({
        name: row.name,
        studentName,
        category: '',
        overallPercent: row.progressPercent,
        currentPhaseName: `Status: ${row.status}`,
        currentPhaseDescription: '',
        consecutiveIndependentTrials: 0,
        masteryThreshold: 0,
        trend: [row.progressPercent],
      });
    } catch (err) {
      setLoadError(true);
    }
  }, [studentId, goalId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvancePhase = async () => {
    try {
      await updateGoalProgress(studentId, goalId, {
        progressPercent: Math.min(100, (goal?.overallPercent ?? 0) + 10),
        status: 'active',
      });
      load();
    } catch (err) {
      // TODO: error toast
    }
  };

  if (loadError) return <ScreenError onRetry={load} />;
  if (!goal) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Progress</Text>
        <View style={{ width: 80 }} />
      </View>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  headerTitle: { ...typography.h2, textAlign: 'center' },
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
