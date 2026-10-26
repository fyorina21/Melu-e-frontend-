// src/screens/assessments/behavior/components/MassAssessmentTab.tsx

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import {
  MASS_ITEMS,
  LIKERT_OPTIONS,
  LIKERT_SCORE,
  MAS_CATEGORIES,
  MAS_CATEGORY_ITEM_NUMBERS,
  calculateMassCategoryScores,
  type MassItem,
  type MasCategory,
} from '../behaviorTypes';

interface MassAssessmentTabProps {
  behaviorName: string;
  massAnswers: Record<string, string | number>;
  onSetAnswer: (id: string, value: string) => void;
  items?: MassItem[];
}

export const MassAssessmentTab: React.FC<MassAssessmentTabProps> = React.memo(
  ({ behaviorName, massAnswers, onSetAnswer, items = MASS_ITEMS }) => {
    // 5-category scoring result
    const scoringResult = useMemo(() => {
      return calculateMassCategoryScores(massAnswers);
    }, [massAnswers]);

    const answeredCount = useMemo(() => {
      return items.filter((item) => {
        const val = massAnswers[item.id] ?? massAnswers[String(item.questionNumber)];
        return val !== undefined && val !== null && val !== '';
      }).length;
    }, [items, massAnswers]);

    // Items grouped by 4 categories
    const itemsByCategory = useMemo(() => {
      const map: Record<MasCategory, MassItem[]> = {
        Sensory: [],
        Escape: [],
        Attention: [],
        Tangible: [],
      };

      // Index items by question number
      const itemByNum = new Map<number, MassItem>();
      items.forEach((item) => itemByNum.set(item.questionNumber, item));

      MAS_CATEGORIES.forEach((cat) => {
        const qNums = MAS_CATEGORY_ITEM_NUMBERS[cat] || [];
        qNums.forEach((qNum) => {
          const item = itemByNum.get(qNum);
          if (item) {
            map[cat].push(item);
          }
        });
      });

      return map;
    }, [items]);

    return (
      <View style={styles.container}>
        {/* Main Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerTextGroup}>
              <Text style={typography.h3}>MAS — Motivation Assessment Scale</Text>
              <Text style={typography.caption}>
                Rate how often "{behaviorName}" occurs in each situation (16 items, 0–6 Likert
                scale).
              </Text>
            </View>
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
          </View>

          {/* Grouped Category Sections */}
          {MAS_CATEGORIES.map((category) => {
            const categoryItems = itemsByCategory[category] || [];
            const catScore = scoringResult.scores[category];

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {catScore?.answeredCount || 0} / {categoryItems.length} items
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.categoryMeanText}>
                    Mean:{' '}
                    <Text style={styles.categoryMeanVal}>
                      {catScore?.mean.toFixed(2) || '0.00'}
                    </Text>
                  </Text>
                </View>

                {categoryItems.map((item) => {
                  const currentAnswer =
                    massAnswers[item.id] ?? massAnswers[String(item.questionNumber)];

                  return (
                    <View key={item.id} style={styles.itemBlock}>
                      <Text style={typography.body}>
                        <Text style={typography.bodyBold}>Q{item.questionNumber}.</Text> {item.text}
                      </Text>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.likertRow}
                      >
                        {LIKERT_OPTIONS.map((opt) => {
                          const isSelected =
                            currentAnswer === opt ||
                            currentAnswer === LIKERT_SCORE[opt] ||
                            String(currentAnswer) === String(LIKERT_SCORE[opt]);

                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.likertBtn, isSelected && styles.likertBtnActive]}
                              onPress={() => onSetAnswer(item.id, opt)}
                              accessibilityRole="radio"
                              accessibilityState={{ selected: isSelected }}
                              accessibilityLabel={`${opt} (${LIKERT_SCORE[opt]}) for Q${item.questionNumber}`}
                            >
                              <Text
                                style={[styles.likertText, isSelected && styles.likertTextActive]}
                              >
                                {opt} ({LIKERT_SCORE[opt]})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            );
          })}

          {/* Dynamic MAS-II Scoring Summary Engine */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Feather name="bar-chart-2" size={18} color={colors.navyText} />
              <Text style={styles.summaryTitle}>
                MAS-II Dynamic Scoring Engine — {behaviorName}
              </Text>
            </View>

            {/* Motivational Ranking & Hypothesized Variable */}
            {answeredCount > 0 ? (
              <View style={styles.primaryVariableBanner}>
                <View>
                  <Text style={styles.primaryVariableLabel}>
                    Primary Hypothesized Maintaining Variable
                  </Text>
                  <Text style={styles.primaryVariableValue}>
                    {scoringResult.primaryMaintainingVariable}
                  </Text>
                </View>
                <View style={styles.rankOneBadge}>
                  <Text style={styles.rankOneText}>Rank 1</Text>
                </View>
              </View>
            ) : null}

            {/* Scoring Table */}
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>Motivational Category</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>Items</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>Total</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>Mean</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>Rank</Text>
              </View>

              {scoringResult.ranking.map((row) => {
                const isPrimary = row.rank === 1 && answeredCount > 0;
                return (
                  <View
                    key={row.category}
                    style={[styles.tableRow, isPrimary && styles.tableRowPrimary]}
                  >
                    <View
                      style={[
                        styles.tableCol,
                        { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 },
                      ]}
                    >
                      {isPrimary && <Feather name="award" size={14} color="#D97706" />}
                      <Text
                        style={[
                          styles.categoryNameText,
                          isPrimary && { fontWeight: '700', color: colors.navyText },
                        ]}
                      >
                        {row.category}
                      </Text>
                    </View>
                    <Text style={[styles.tableColText, { flex: 1, textAlign: 'center' }]}>
                      {row.answeredCount}/{row.itemCount}
                    </Text>
                    <Text
                      style={[
                        styles.tableColText,
                        { flex: 1, textAlign: 'center', fontWeight: '600' },
                      ]}
                    >
                      {row.total}
                    </Text>
                    <Text
                      style={[
                        styles.tableColText,
                        { flex: 1, textAlign: 'center', fontWeight: '700' },
                      ]}
                    >
                      {row.mean.toFixed(2)}
                    </Text>
                    <View style={[styles.tableCol, { flex: 1, alignItems: 'center' }]}>
                      <View style={[styles.rankBadge, isPrimary && styles.rankBadgePrimary]}>
                        <Text
                          style={[styles.rankBadgeText, isPrimary && styles.rankBadgeTextPrimary]}
                        >
                          #{row.rank}
                        </Text>
                      </View>
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
  categorySection: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  categoryBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: colors.bodyText,
    fontWeight: '600',
  },
  categoryMeanText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  categoryMeanVal: {
    fontWeight: '700',
    color: colors.navyText,
  },
  itemBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  likertRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  likertBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  likertBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: '#EAB308',
  },
  likertText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
  },
  likertTextActive: {
    color: colors.navyText,
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
  primaryVariableBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  primaryVariableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  primaryVariableValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78350F',
    marginTop: 2,
  },
  rankOneBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  rankOneText: {
    fontSize: 12,
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
  tableRowPrimary: {
    backgroundColor: '#FFFBEB',
  },
  tableCol: {
    justifyContent: 'center',
  },
  tableColText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  categoryNameText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  rankBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  rankBadgePrimary: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
  },
  rankBadgeTextPrimary: {
    color: '#B45309',
    fontWeight: '800',
  },
});
