// screens/session/components/StudentSessionCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import PromptEntryRow from './PromptEntryRow';
import type { Student, Goal } from '../../../types';

// Per SCR-002 spec: trial stream icons are color-coded by prompt level.
const TRIAL_ICON_COLOR: Record<string, string> = {
  INDEPENDENT: '#22C55E', // Green
  G: '#EAB308', // Yellow
  PP: '#F97316', // Orange
  FP: '#EF4444', // Red
};

interface StudentSessionCardProps {
  student: Student;
  onSelectPromptLevel: (studentId: string, goalId: string | undefined, level: string, stepId?: string) => void;
  onRecordIncident: (studentId: string, goalId: string | undefined) => void;
  onMasteryCheck: (studentId: string, goalId: string | undefined) => void;
  onUndo: () => void;
  onActivate: (studentId: string) => void;
  onViewGoalProgress: (studentId: string, goalId: string) => void;
  onViewProfile: (studentId: string) => void;
}

export default function StudentSessionCard({
  student,
  onSelectPromptLevel,
  onRecordIncident,
  onMasteryCheck,
  onUndo,
  onActivate,
  onViewGoalProgress,
  onViewProfile,
}: StudentSessionCardProps) {
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const activeGoal = student.goals?.[activeGoalIndex];
  const isActive = student.active;
  const isTaskAnalysis = activeGoal?.goalType === 'task_analysis';
  const trials = student.trials || [];
  const trialCount = trials.length;
  const independentCount = trials.filter((t) => t.promptLevel === 'INDEPENDENT').length;
  const accuracyPct = trialCount ? Math.round((independentCount / trialCount) * 100) : 0;

  // Per SCR-002: "Tapping anywhere on this card's prompt bar swaps it to
  // Active" for the secondary (inactive) student.
  const handlePromptBarPress = () => {
    if (!isActive) {
      onActivate?.(student.id);
    }
  };

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{student.initial}</Text>
          </View>
          <View>
            <TouchableOpacity onPress={() => onViewProfile?.(student.id)} accessibilityLabel={`View ${student.name} profile`}>
              <Text style={[typography.h3, styles.studentNameLink]}>{student.name}</Text>
            </TouchableOpacity>
            <Text style={typography.caption}>{student.program}</Text>
          </View>
        </View>
        {isActive && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        )}
      </View>

      {/* Goal tabs */}
      <View style={styles.goalTabs}>
        {(student.goals || []).map((goal, idx) => (
          <TouchableOpacity
            key={goal.id}
            style={[
              styles.goalTab,
              idx === activeGoalIndex && isActive && styles.goalTabActive,
            ]}
            disabled={!isActive}
            onPress={() => setActiveGoalIndex(idx)}
          >
            <Text
              style={[
                styles.goalTabText,
                idx === activeGoalIndex && isActive && styles.goalTabTextActive,
              ]}
            >
              Goal {idx + 1}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active goal detail */}
      {activeGoal && (
        <View style={styles.goalDetail}>
          <View style={styles.goalDetailHeaderRow}>
            <Text style={typography.bodyBold}>{activeGoal.name}</Text>
            {/* Goal Type Indicator badge, per SCR-002 component table */}
            <View style={[styles.goalTypeBadge, isTaskAnalysis && styles.goalTypeBadgeTA]}>
              <Text style={styles.goalTypeBadgeText}>
                {isTaskAnalysis ? 'Task Analysis' : 'Standard'}
              </Text>
            </View>
          </View>
          <Text style={typography.caption}>{activeGoal.category}</Text>
          <TouchableOpacity onPress={() => onViewGoalProgress?.(student.id, activeGoal.id)}>
            <Text style={styles.viewProgressLink}>View Progress →</Text>
          </TouchableOpacity>
        </View>
      )}

      {isTaskAnalysis ? (
        <TaskAnalysisStepList
          goal={activeGoal}
          disabled={!isActive}
          onStepPrompt={(stepId, level) =>
            onSelectPromptLevel(student.id, activeGoal?.id, level, stepId)
          }
          onPressAnywhere={handlePromptBarPress}
        />
      ) : (
        <>
          {/* Prompt entry */}
          <View style={styles.promptHeaderRow}>
            <Text style={typography.label}>Prompt Entry</Text>
            {isActive && (
              <TouchableOpacity onPress={onUndo}>
                <Text style={styles.undoText}>↺ Undo</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity activeOpacity={isActive ? 1 : 0.6} onPress={handlePromptBarPress}>
            <PromptEntryRow
              disabled={!isActive}
              onSelect={(level) => onSelectPromptLevel(student.id, activeGoal?.id, level)}
            />
          </TouchableOpacity>

          {/* Last 5 trials - color-coded icons per SCR-002 spec */}
          <View style={styles.statsHeaderRow}>
            <Text style={typography.label}>Last 5 Trials</Text>
            {trialCount > 0 && (
              // Automatic calculation per issues doc: Correct/Incorrect/Accuracy% -
              // treating INDEPENDENT trials as "correct", any prompted trial as
              // "incorrect", since this app's trial model is prompt-level based
              // rather than a raw correct/incorrect toggle.
              <Text style={typography.caption}>
                {independentCount}/{trialCount} independent · {accuracyPct}% accuracy
              </Text>
            )}
          </View>
          <View style={styles.trialsBox}>
            {trialCount ? (
              <View style={styles.trialIconsRow}>
                {trials.slice(0, 5).map((t, i) => (
                  <View
                    key={i}
                    style={[
                      styles.trialIcon,
                      { backgroundColor: TRIAL_ICON_COLOR[t.promptLevel] || colors.mutedText },
                    ]}
                  >
                    <Text style={styles.trialIconText}>
                      {t.promptLevel === 'INDEPENDENT' ? '+' : t.promptLevel}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center' }]}>
                No trials recorded yet
              </Text>
            )}
          </View>
        </>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={!isActive}
          onPress={() => onRecordIncident(student.id, activeGoal?.id)}
        >
          <Feather name="alert-triangle" size={14} color={isActive ? colors.navyText : colors.mutedText} />
          <Text style={[styles.actionBtnText, !isActive && styles.actionBtnTextDisabled]}>
            Record Incident
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={!isActive}
          onPress={() => onMasteryCheck(student.id, activeGoal?.id)}
        >
          <Feather name="check-circle" size={14} color={isActive ? colors.navyText : colors.mutedText} />
          <Text style={[styles.actionBtnText, !isActive && styles.actionBtnTextDisabled]}>
            Mastery Check
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface TaskStep {
  id: string;
  description: string;
  successCount: number;
  totalTrials: number;
  independencePercent: number;
  mastered?: boolean;
}

interface TaskAnalysisStepListProps {
  goal: Goal | undefined;
  disabled: boolean;
  onStepPrompt: (stepId: string, level: string) => void;
  onPressAnywhere: () => void;
}

// Task Analysis variant: scrollable step list, each with its own prompt
// buttons and success/fail toggle, per the SCR-002 component table.
// Simplified relative to the full spec (no per-step drag reorder, etc.) -
// flag for design/product review before treating as final.
function TaskAnalysisStepList({ goal, disabled, onStepPrompt, onPressAnywhere }: TaskAnalysisStepListProps) {
  const steps = (goal?.steps as TaskStep[] | undefined) || [];
  const masteredCount = steps.filter((s) => s.mastered).length;
  const overallPct = steps.length ? Math.round((masteredCount / steps.length) * 100) : 0;

  return (
    <View>
      <View style={styles.taOverallRow}>
        <Text style={typography.label}>Overall Progress</Text>
        <Text style={typography.bodyBold}>{overallPct}%</Text>
      </View>
      <View style={styles.taProgressTrack}>
        <View style={[styles.taProgressFill, { width: `${overallPct}%` }]} />
      </View>

      {steps.map((step, idx) => (
        <View key={step.id} style={styles.taStepRow}>
          <Text style={typography.bodyBold}>
            Step {idx + 1}: {step.description}
          </Text>
          <View style={styles.taStepProgressTrack}>
            <View style={[styles.taStepProgressFill, { width: `${step.independencePercent || 0}%` }]} />
          </View>
          <TouchableOpacity activeOpacity={disabled ? 0.6 : 1} onPress={onPressAnywhere}>
            <PromptEntryRow
              disabled={disabled}
              onSelect={(level) => onStepPrompt(step.id, level)}
            />
          </TouchableOpacity>
        </View>
      ))}

      {steps.length === 0 && (
        <Text style={[typography.body, { color: colors.mutedText }]}>No steps configured for this goal.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardActive: {
    borderColor: colors.bgActiveCardBorder,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  studentNameLink: { textDecorationLine: 'underline', color: colors.navyText },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.promptG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  activePill: {
    backgroundColor: colors.bgActiveCardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  activePillText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  goalTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  goalTab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
  },
  goalTabActive: { backgroundColor: colors.primaryYellow },
  goalTabText: { fontWeight: '600', color: colors.mutedText },
  goalTabTextActive: { color: colors.navyText },
  goalDetail: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  goalDetailHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewProgressLink: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 11, marginTop: spacing.xs },
  goalTypeBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  goalTypeBadgeTA: { backgroundColor: '#DDD6FE' },
  goalTypeBadgeText: { fontSize: 10, fontWeight: '700', color: colors.navyText },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  undoText: { color: colors.bodyText, fontSize: 12, fontWeight: '600' },
  trialsBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 56,
    justifyContent: 'center',
  },
  trialIconsRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  trialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialIconText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 13 },
  actionBtnTextDisabled: { color: colors.mutedText },
  taOverallRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  taProgressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden', marginBottom: spacing.md },
  taProgressFill: { height: '100%', backgroundColor: colors.statusInProgressText },
  taStepRow: { marginBottom: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  taStepProgressTrack: { height: 4, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden', marginVertical: spacing.xs },
  taStepProgressFill: { height: '100%', backgroundColor: '#8B5CF6' },
});
