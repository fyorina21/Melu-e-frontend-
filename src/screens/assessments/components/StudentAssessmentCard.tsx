import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { StudentProgressRing } from './StudentProgressRing';
import type {
  StudentAssessmentItem,
  AssessmentSubModule,
  SubModuleKey,
} from '../assessmentDashboardTypes';

interface Props {
  student: StudentAssessmentItem;
  onNavigateModule: (key: SubModuleKey, studentId: string, isCompleted: boolean) => void;
  onSubmitForReview: (student: StudentAssessmentItem) => void;
  isSubmitting: boolean;
}

const DOT_COLORS = {
  green: '#22C55E',
  amber: '#F59E0B',
  gray: '#94A3B8',
};

export const StudentAssessmentCard: React.FC<Props> = React.memo(
  ({ student, onNavigateModule, onSubmitForReview, isSubmitting }) => {
    const modulesList: AssessmentSubModule[] = [
      student.modules.skills,
      student.modules.behavior,
      student.modules.preference,
      student.modules.sensory,
    ];

    const completedCount = student.completedModulesCount;
    const allFullyFilled = modulesList.every(
      (m) => (m.progressPercentage ?? 0) >= 100 || m.status === 'completed',
    );
    const allCompleted = completedCount === 4 || allFullyFilled;
    const oneRemaining =
      !allCompleted &&
      (completedCount === 3 ||
        modulesList.filter((m) => (m.progressPercentage ?? 0) >= 100 || m.status === 'completed')
          .length === 3);

    // Find the single uncompleted module for Case 2
    const uncompletedModule = modulesList.find(
      (m) => m.status !== 'completed' && (m.progressPercentage ?? 0) < 100,
    );

    const renderModuleCard = (m: AssessmentSubModule) => {
      const isComp = m.status === 'completed';
      const isInProg = m.status === 'in_progress';

      return (
        <TouchableOpacity
          key={m.key}
          style={styles.moduleCard}
          onPress={() => onNavigateModule(m.key, student.id, isComp)}
          activeOpacity={0.7}
        >
          {/* Header with Title and Status Pill */}
          <View style={styles.moduleHeaderRow}>
            <View style={{ flex: 1, paddingRight: 4 }}>
              <Text style={styles.moduleLabel} numberOfLines={1}>
                {m.label}
              </Text>
              <Text style={styles.moduleSub} numberOfLines={1}>
                {m.subtitle}
              </Text>
            </View>
            {isComp ? (
              <View style={[styles.badge, styles.badgeCompleted]}>
                <Feather name="check" size={11} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.badgeTextCompleted}>Completed</Text>
              </View>
            ) : isInProg ? (
              <View style={[styles.badge, styles.badgeInProgress]}>
                <Feather name="clock" size={11} color="#B45309" style={{ marginRight: 2 }} />
                <Text style={styles.badgeTextInProgress}>In Progress</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeNotStarted]}>
                <Feather name="plus" size={11} color="#64748B" style={{ marginRight: 2 }} />
                <Text style={styles.badgeTextNotStarted}>Not Started</Text>
              </View>
            )}
          </View>

          {/* Progress Row */}
          <View style={styles.moduleProgressRow}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>{m.progressPercentage}%</Text>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${m.progressPercentage}%`,
                  backgroundColor: isComp
                    ? '#2563EB' // solid blue
                    : isInProg
                      ? '#F59E0B' // solid amber
                      : '#CBD5E1', // gray
                },
              ]}
            />
          </View>

          {/* Action CTA */}
          <View style={styles.ctaRow}>
            <Text
              style={[
                styles.ctaText,
                isComp && { color: '#2563EB' },
                isInProg && { color: '#D97706' },
                !isComp && !isInProg && { color: '#0284C7' },
              ]}
            >
              {isComp ? 'Review Scoring →' : isInProg ? 'Continue Logging →' : 'Start Assessment →'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.container}>
        {/* NFR-022: Draft Expiry Warning Banner */}
        {student.hasStaleDraft && (
          <View style={styles.warningBanner}>
            <Feather name="alert-triangle" size={14} color="#B45309" />
            <Text style={styles.warningText}>
              Draft untouched for {student.staleDays} days. Assessments must be finalized within the
              6-week window.
            </Text>
          </View>
        )}

        {/* Section A: Student Card Header */}
        <View style={styles.headerRow}>
          {/* Avatar Badge with Status Dot */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarSquare}>
              <Text style={styles.avatarText}>{student.initial}</Text>
            </View>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: DOT_COLORS[student.statusDot] || DOT_COLORS.green },
              ]}
            />
          </View>

          {/* Student Info */}
          <View style={styles.studentInfoCol}>
            <View style={styles.nameAndProgramRow}>
              <Text style={styles.studentName} numberOfLines={1}>
                {student.fullName}
              </Text>
              <View style={styles.programPill}>
                <Text style={styles.programPillText}>{student.programType}</Text>
              </View>
            </View>
            <Text style={styles.metaRow} numberOfLines={1}>
              Age {student.age} • Therapist: {student.therapistName} • Last:{' '}
              {student.lastActivityDisplay}
            </Text>
          </View>

          {/* Overall Progress Ring Widget */}
          <StudentProgressRing
            completedModules={completedCount}
            percentage={student.overallScore}
            size={52}
          />
        </View>

        {/* Section B: 4-Module Assessment Grid (2x2 Layout) */}
        <View style={styles.modulesGrid}>{modulesList.map(renderModuleCard)}</View>

        {/* Section D: Dynamic Footer & Submission Workflow */}
        <View style={styles.footerRow}>
          {allCompleted ? (
            /* Case 3: All 4 Modules Complete */
            <>
              <View style={styles.footerStatusRow}>
                <View style={[styles.inlineDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.footerSuccessText}>
                  All 4 sub-modules verified & ready for review
                </Text>
              </View>
              <TouchableOpacity
                style={styles.submitBtnActive}
                onPress={() => onSubmitForReview(student)}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnTextActive}>Submit Assessments for Review</Text>
                    <Feather
                      name="arrow-right"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginLeft: 4 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : oneRemaining ? (
            /* Case 2: 1 Module Remaining */
            <>
              <View style={styles.footerStatusRow}>
                <View style={[styles.inlineDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.footerWarningText}>
                  1 remaining module to complete submission
                </Text>
              </View>
              <TouchableOpacity
                style={styles.completeFinalBtn}
                onPress={() => {
                  if (uncompletedModule) {
                    onNavigateModule(uncompletedModule.key, student.id, false);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.completeFinalBtnText}>Complete Final Sub-Assessment →</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* Case 1: Incomplete (0 to 2 modules complete) */
            <>
              <View style={styles.footerStatusRow}>
                <Text style={styles.footerMutedText}>{completedCount} of 4 modules ready</Text>
              </View>
              <View style={styles.submitBtnDisabled}>
                <Feather name="lock" size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnTextDisabled}>Submit File</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  studentInfoCol: {
    flex: 1,
    minWidth: 180,
    gap: 2,
  },
  nameAndProgramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  programPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  programPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  metaRow: {
    fontSize: 12,
    color: colors.mutedText,
  },

  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  moduleCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moduleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  moduleSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCompleted: {
    backgroundColor: '#2563EB', // solid blue
  },
  badgeTextCompleted: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badgeInProgress: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeTextInProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeNotStarted: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeTextNotStarted: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },

  moduleProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    color: colors.mutedText,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  ctaRow: {
    marginTop: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.sm,
    marginTop: 4,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  footerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  inlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerMutedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  footerWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  footerSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },

  submitBtnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitBtnTextDisabled: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  completeFinalBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  completeFinalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  submitBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB', // solid blue
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  submitBtnTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
});
