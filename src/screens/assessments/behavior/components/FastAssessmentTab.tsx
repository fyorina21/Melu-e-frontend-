// src/screens/assessments/behavior/components/FastAssessmentTab.tsx

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import {
  FAST_ITEMS,
  FAST_MAINTAINING_VARIABLES,
  FAST_SETTING_CONTEXT_OPTIONS,
  calculateFastCategoryScores,
  isFastYes,
  type FastItem,
  type FastMaintainingVariable,
  type FastSettingContext,
} from '../behaviorTypes';

interface FastAssessmentTabProps {
  behaviorName: string;
  fastAnswers: Record<string, boolean | string | number>;
  onSetAnswer: (id: string, value: boolean) => void;
  items?: FastItem[];
  settingContext?: FastSettingContext[];
  onToggleSettingContext?: (context: FastSettingContext) => void;
}

export const FastAssessmentTab: React.FC<FastAssessmentTabProps> = React.memo(
  ({
    behaviorName,
    fastAnswers,
    onSetAnswer,
    items = FAST_ITEMS,
    settingContext = [],
    onToggleSettingContext,
  }) => {
    // Dynamic FAST scoring result
    const scoringResult = useMemo(() => {
      return calculateFastCategoryScores(fastAnswers);
    }, [fastAnswers]);

    const answeredCount = useMemo(() => {
      return items.filter((item) => {
        const val = fastAnswers[item.id] ?? fastAnswers[String(item.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
    }, [items, fastAnswers]);

    // Total Yes count across all items
    const totalYesCount = useMemo(() => {
      return items.filter((item) => {
        const val = fastAnswers[item.id] ?? fastAnswers[String(item.questionNumber)];
        return isFastYes(val);
      }).length;
    }, [items, fastAnswers]);

    // Separate Part I, Part II (Social Reinforcement Q4-18), and Part III (Automatic Reinforcement Q19-27)
    const partOneItems = useMemo(() => items.filter((i) => i.questionNumber <= 3), [items]);
    const partTwoItems = useMemo(
      () => items.filter((i) => i.questionNumber >= 4 && i.questionNumber <= 18),
      [items],
    );
    const partThreeItems = useMemo(() => items.filter((i) => i.questionNumber >= 19), [items]);

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTextGroup}>
              <Text style={typography.h3}>FAST — Functional Assessment Screening Tool</Text>
              <Text style={typography.caption}>
                Florida Center on Self-Injury / Iwata et al. Answer Yes or No for "{behaviorName}"
                (27 items).
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <View style={styles.progressBadge}>
                <Feather
                  name={answeredCount === items.length ? 'check-circle' : 'activity'}
                  size={14}
                  color={answeredCount === items.length ? '#16A34A' : colors.navyText}
                />
                <Text style={styles.progressBadgeText}>
                  {answeredCount} / {items.length} Answered
                </Text>
              </View>
              <View
                style={[
                  styles.progressBadge,
                  { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
                ]}
              >
                <Feather name="check" size={14} color="#1D4ED8" />
                <Text style={[styles.progressBadgeText, { color: '#1D4ED8' }]}>
                  {totalYesCount} Total "Yes"
                </Text>
              </View>
            </View>
          </View>

          {/* Setting Context Checkboxes */}
          <View style={styles.contextSection}>
            <View style={styles.contextHeader}>
              <Feather name="map-pin" size={14} color={colors.navyText} />
              <Text style={styles.contextTitle}>Informant Setting Context</Text>
              <Text style={[typography.caption, { marginLeft: 'auto' }]}>
                Select settings where behavior occurs
              </Text>
            </View>
            <View style={styles.contextGrid}>
              {FAST_SETTING_CONTEXT_OPTIONS.map((ctx) => {
                const isSelected = settingContext.includes(ctx);
                return (
                  <TouchableOpacity
                    key={ctx}
                    style={[styles.contextChip, isSelected && styles.contextChipSelected]}
                    onPress={() => onToggleSettingContext && onToggleSettingContext(ctx)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`Setting Context: ${ctx}`}
                  >
                    <Feather
                      name={isSelected ? 'check-square' : 'square'}
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.mutedText}
                    />
                    <Text
                      style={[styles.contextChipText, isSelected && styles.contextChipTextSelected]}
                    >
                      {ctx}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Part I: Social Influences on Behavior (Q1-3) */}
          <View style={styles.partSection}>
            <View style={styles.partHeader}>
              <View>
                <Text style={styles.partTitle}>
                  Part I: Social Influences on Behavior (Items 1–3)
                </Text>
                <Text style={typography.caption}>
                  Screening for social vs. automatic maintaining factors. If any item is "Yes", Part
                  II is scored and included in summary.
                </Text>
              </View>
            </View>

            {/* Gating Status Banner */}
            <View
              style={[
                styles.gatingBanner,
                scoringResult.partOneHasSocialInfluence
                  ? styles.gatingBannerActive
                  : styles.gatingBannerInactive,
              ]}
            >
              <Feather
                name={scoringResult.partOneHasSocialInfluence ? 'info' : 'minus-circle'}
                size={16}
                color={scoringResult.partOneHasSocialInfluence ? '#1D4ED8' : colors.mutedText}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.gatingBannerTitle,
                    scoringResult.partOneHasSocialInfluence && styles.gatingBannerTitleActive,
                  ]}
                >
                  {scoringResult.partOneHasSocialInfluence
                    ? 'Part I Gating Active: Social Reinforcement Present'
                    : 'Part I Gating: No Social Influence Indicated Yet'}
                </Text>
                <Text style={styles.gatingBannerText}>
                  {scoringResult.partOneHasSocialInfluence
                    ? `Questions 1, 2, and 3 are automatically rolled into Attention, Tangibles, and Escape categories.`
                    : 'If any question 1, 2, or 3 is answered "Yes", it is automatically rolled into all social reinforcement categories.'}
                </Text>
              </View>
            </View>

            {partOneItems.map((item) => {
              const currentVal = fastAnswers[item.id] ?? fastAnswers[String(item.questionNumber)];
              const isAnswered =
                currentVal !== undefined && currentVal !== null && currentVal !== '';
              const isYes = isFastYes(currentVal);

              return (
                <View key={item.id} style={styles.itemBlock}>
                  <Text style={typography.body}>
                    <Text style={typography.bodyBold}>Q{item.questionNumber}.</Text> {item.text}
                  </Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && isYes && styles.yesBtnActive]}
                      onPress={() => onSetAnswer(item.id, true)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && isYes }}
                      accessibilityLabel={`Yes for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="check"
                        size={14}
                        color={isAnswered && isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && isYes && styles.yesBtnTextActive]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && !isYes && styles.noBtnActive]}
                      onPress={() => onSetAnswer(item.id, false)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && !isYes }}
                      accessibilityLabel={`No for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="x"
                        size={14}
                        color={isAnswered && !isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && !isYes && styles.noBtnTextActive]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Part II: Social Reinforcement (Items 4–18) */}
          <View style={styles.partSection}>
            <View style={styles.partHeader}>
              <View>
                <Text style={styles.partTitle}>Part II: Social Reinforcement (Items 4–18)</Text>
                <Text style={typography.caption}>
                  Attention (Q4–8), Tangibles / Activities (Q9–13), and Escape (Q14–18).
                </Text>
              </View>
            </View>

            {partTwoItems.map((item) => {
              const currentVal = fastAnswers[item.id] ?? fastAnswers[String(item.questionNumber)];
              const isAnswered =
                currentVal !== undefined && currentVal !== null && currentVal !== '';
              const isYes = isFastYes(currentVal);

              return (
                <View key={item.id} style={styles.itemBlock}>
                  <View style={styles.questionMetaRow}>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>
                        {item.section.replace('Part II: ', '')}
                      </Text>
                    </View>
                  </View>
                  <Text style={typography.body}>
                    <Text style={typography.bodyBold}>Q{item.questionNumber}.</Text> {item.text}
                  </Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && isYes && styles.yesBtnActive]}
                      onPress={() => onSetAnswer(item.id, true)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && isYes }}
                      accessibilityLabel={`Yes for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="check"
                        size={14}
                        color={isAnswered && isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && isYes && styles.yesBtnTextActive]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && !isYes && styles.noBtnActive]}
                      onPress={() => onSetAnswer(item.id, false)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && !isYes }}
                      accessibilityLabel={`No for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="x"
                        size={14}
                        color={isAnswered && !isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && !isYes && styles.noBtnTextActive]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Part III: Nonsocial / Automatic Reinforcement (Items 19–27) */}
          <View style={styles.partSection}>
            <View style={styles.partHeader}>
              <View>
                <Text style={styles.partTitle}>
                  Part III: Nonsocial / Automatic Reinforcement (Items 19–27)
                </Text>
                <Text style={typography.caption}>
                  Sensory Stimulation (Q19–24) and Pain Attenuation (Q19, 20, 24–27).
                </Text>
              </View>
            </View>

            {partThreeItems.map((item) => {
              const currentVal = fastAnswers[item.id] ?? fastAnswers[String(item.questionNumber)];
              const isAnswered =
                currentVal !== undefined && currentVal !== null && currentVal !== '';
              const isYes = isFastYes(currentVal);

              return (
                <View key={item.id} style={styles.itemBlock}>
                  <View style={styles.questionMetaRow}>
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>
                        {item.section.replace('Part III: ', '')}
                      </Text>
                    </View>
                  </View>
                  <Text style={typography.body}>
                    <Text style={typography.bodyBold}>Q{item.questionNumber}.</Text> {item.text}
                  </Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && isYes && styles.yesBtnActive]}
                      onPress={() => onSetAnswer(item.id, true)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && isYes }}
                      accessibilityLabel={`Yes for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="check"
                        size={14}
                        color={isAnswered && isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && isYes && styles.yesBtnTextActive]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.yesNoBtn, isAnswered && !isYes && styles.noBtnActive]}
                      onPress={() => onSetAnswer(item.id, false)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isAnswered && !isYes }}
                      accessibilityLabel={`No for Q${item.questionNumber}`}
                    >
                      <Feather
                        name="x"
                        size={14}
                        color={isAnswered && !isYes ? '#FFFFFF' : colors.bodyText}
                      />
                      <Text
                        style={[styles.yesNoText, isAnswered && !isYes && styles.noBtnTextActive]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Dynamic FAST Scoring Index Engine */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Feather name="shield" size={18} color={colors.navyText} />
              <Text style={styles.summaryTitle}>
                FAST Maintaining Variable Scoring Index — {behaviorName}
              </Text>
            </View>

            {/* Dominant Hypothesized Variables Banner */}
            {scoringResult.dominantVariables.length > 0 ? (
              <View style={styles.dominantBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dominantLabel}>Dominant Maintaining Variable(s)</Text>
                  <View style={styles.dominantBadgesRow}>
                    {scoringResult.dominantVariables.map((v) => (
                      <View key={v} style={styles.dominantTag}>
                        <Feather name="check-circle" size={12} color="#FFFFFF" />
                        <Text style={styles.dominantTagText}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.maxPctBadge}>
                  <Text style={styles.maxPctText}>{scoringResult.maxPercentage}%</Text>
                </View>
              </View>
            ) : null}

            {/* Scores Table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 3 }]}>
                  Maintaining Variable Category
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'center' }]}>
                  Yes Count
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'center' }]}>
                  Percentage
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'center' }]}>
                  Status
                </Text>
              </View>

              {FAST_MAINTAINING_VARIABLES.map((variable) => {
                const score = scoringResult.scores[variable];
                const isDominant = score?.isDominant;

                return (
                  <View
                    key={variable}
                    style={[styles.tableRow, isDominant && styles.tableRowDominant]}
                  >
                    <View
                      style={[
                        styles.tableCol,
                        { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
                      ]}
                    >
                      {isDominant && <Feather name="star" size={14} color="#D97706" />}
                      <Text
                        style={[
                          styles.variableNameText,
                          isDominant && { fontWeight: '700', color: colors.navyText },
                        ]}
                      >
                        {variable}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.tableColText,
                        { flex: 1.5, textAlign: 'center', fontWeight: '600' },
                      ]}
                    >
                      {score?.yesCount || 0} / {score?.maxPoints || 0}
                    </Text>
                    <Text
                      style={[
                        styles.tableColText,
                        { flex: 1.5, textAlign: 'center', fontWeight: '700' },
                      ]}
                    >
                      {score?.percentage || 0}%
                    </Text>
                    <View style={[styles.tableCol, { flex: 1.5, alignItems: 'center' }]}>
                      {isDominant ? (
                        <View style={styles.dominantBadge}>
                          <Text style={styles.dominantBadgeText}>Dominant</Text>
                        </View>
                      ) : (
                        <Text style={styles.standardStatusText}>Secondary</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 240,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  contextSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  contextChipSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  contextChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  contextChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  partSection: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  partHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  partTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  gatingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  gatingBannerActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  gatingBannerInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  gatingBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
  },
  gatingBannerTitleActive: {
    color: '#1E40AF',
  },
  gatingBannerText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  itemBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  questionMetaRow: {
    flexDirection: 'row',
  },
  sectionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.navyText,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  yesNoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  yesBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  noBtnActive: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  yesNoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  yesBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  dominantBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  dominantLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  dominantBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dominantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dominantTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  maxPctBadge: {
    backgroundColor: '#B45309',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  maxPctText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  tableColHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  tableRowDominant: {
    backgroundColor: '#FFFBEB',
  },
  tableCol: {
    justifyContent: 'center',
  },
  tableColText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  variableNameText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  dominantBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  dominantBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  standardStatusText: {
    fontSize: 11,
    color: colors.mutedText,
    fontWeight: '500',
  },
});
