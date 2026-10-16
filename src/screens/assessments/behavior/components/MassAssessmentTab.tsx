// src/screens/assessments/behavior/components/MassAssessmentTab.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { MASS_ITEMS, LIKERT_OPTIONS, type MassFunction } from '../behaviorTypes';

interface MassAssessmentTabProps {
  massAnswers: Record<string, string>;
  functionTotals: Record<MassFunction, number>;
  identifiedFunction: string;
  onSetAnswer: (id: string, value: string) => void;
}

export const MassAssessmentTab: React.FC<MassAssessmentTabProps> = React.memo(
  ({ massAnswers, functionTotals, identifiedFunction, onSetAnswer }) => {
    return (
      <View style={styles.card}>
        <Text style={typography.h3}>MASS — Motivation Assessment Scale</Text>
        <Text style={typography.caption}>
          Rate each statement: how often the behavior occurs in that situation.
        </Text>

        {MASS_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={typography.body}>
              <Text style={typography.bodyBold}>{item.id}.</Text> {item.text}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.likertRow}>
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = massAnswers[item.id] === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.likertBtn, isSelected && styles.likertBtnActive]}
                      onPress={() => onSetAnswer(item.id, opt)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${opt} for question ${item.id}`}
                    >
                      <Text style={[styles.likertText, isSelected && styles.likertTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ))}

        <View style={styles.functionBox}>
          <Text style={typography.label}>Function Totals</Text>
          {Object.entries(functionTotals).map(([fn, total]) => (
            <View key={fn} style={styles.functionRow}>
              <Text
                style={[
                  typography.body,
                  fn === identifiedFunction && {
                    fontWeight: '700',
                    color: colors.navyText,
                  },
                ]}
              >
                {fn}
              </Text>
              <Text style={typography.bodyBold}>{total}</Text>
            </View>
          ))}
        </View>
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
  itemBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  likertRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  likertBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  likertBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  likertText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
  },
  likertTextActive: {
    color: colors.navyText,
  },
  functionBox: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  functionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
