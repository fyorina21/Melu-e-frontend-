import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface QuickActionsGridProps {
  modules?: string[];
  onStartSession: () => void;
  onAssessments: () => void;
  onIupGeneration: () => void;
  onMasteryChecks: () => void;
  onParentCommunication: () => void;
  onAbcLog: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = React.memo(
  ({
    modules,
    onStartSession,
    onAssessments,
    onIupGeneration,
    onMasteryChecks,
    onParentCommunication,
    onAbcLog,
  }) => {
    return (
      <View style={styles.container}>
        <Text style={[typography.label, styles.sectionLabel]}>QUICK ACTIONS</Text>
        <View style={styles.grid}>
          {(!modules || modules.includes('sessions')) && (
            <TouchableOpacity
              style={styles.card}
              onPress={onStartSession}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Start session quick action"
            >
              <Feather name="play" size={22} color={colors.primaryYellowDark} />
              <Text style={styles.cardText}>Start Session</Text>
            </TouchableOpacity>
          )}

          {(!modules || modules.includes('assessments')) && (
            <TouchableOpacity
              style={styles.card}
              onPress={onAssessments}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Assessments quick action"
            >
              <Feather name="clipboard" size={22} color={colors.statusInProgressText} />
              <Text style={styles.cardText}>Assessments</Text>
            </TouchableOpacity>
          )}

          {(!modules || modules.includes('iups')) && (
            <TouchableOpacity
              style={styles.card}
              onPress={onIupGeneration}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="IUP & Goals quick action"
            >
              <Feather name="file-text" size={22} color="#0284C7" />
              <Text style={styles.cardText}>IUP & Goals</Text>
            </TouchableOpacity>
          )}

          {(!modules || modules.includes('iups') || modules.includes('sessions')) && (
            <TouchableOpacity
              style={styles.card}
              onPress={onMasteryChecks}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mastery checks quick action"
            >
              <Feather name="award" size={22} color="#8B5CF6" />
              <Text style={styles.cardText}>Mastery Checks</Text>
            </TouchableOpacity>
          )}

          {(!modules || modules.includes('parent_portal')) && (
            <TouchableOpacity
              style={styles.card}
              onPress={onParentCommunication}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Parent communication quick action"
            >
              <Feather name="message-circle" size={22} color="#22C55E" />
              <Text style={styles.cardText}>Parent Communication</Text>
            </TouchableOpacity>
          )}

          {modules?.includes('behavior_incidents') && (
            <TouchableOpacity
              style={styles.card}
              onPress={onAbcLog}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="ABC Log quick action"
            >
              <Feather name="activity" size={22} color="#DC2626" />
              <Text style={styles.cardText}>ABC Log</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: 130,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
});
