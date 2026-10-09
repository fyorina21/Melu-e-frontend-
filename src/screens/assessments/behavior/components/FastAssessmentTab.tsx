// src/screens/assessments/behavior/components/FastAssessmentTab.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { FAST_ITEMS, type FastCategory } from '../behaviorTypes';

interface FastAssessmentTabProps {
  fastAnswers: Record<string, boolean>;
  categoryTotals: Record<FastCategory, number>;
  identifiedFunction: string;
  onSetAnswer: (id: string, value: boolean) => void;
}

export const FastAssessmentTab: React.FC<FastAssessmentTabProps> = React.memo(
  ({ fastAnswers, categoryTotals, identifiedFunction, onSetAnswer }) => {
    return (
      <View style={styles.card}>
        <Text style={typography.h3}>FAST — Functional Analysis Screening Tool</Text>
        <Text style={typography.caption}>Answer Yes or No for each statement.</Text>

        {FAST_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemBlock}>
            <Text style={typography.body}>
              <Text style={typography.bodyBold}>{item.id}.</Text> {item.text}
            </Text>
            <View style={styles.yesNoRow}>
              {[true, false].map((value) => {
                const isSelected = fastAnswers[item.id] === value;
                return (
                  <TouchableOpacity
                    key={String(value)}
                    style={[styles.yesNoBtn, isSelected && styles.yesNoBtnActive]}
                    onPress={() => onSetAnswer(item.id, value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${value ? 'Yes' : 'No'} for question ${item.id}`}
                  >
                    <Text style={[styles.yesNoText, isSelected && styles.yesNoTextActive]}>
                      {value ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.functionBox}>
          <Text style={typography.label}>Category Scores (Yes counts)</Text>
          {Object.entries(categoryTotals).map(([cat, total]) => (
            <View key={cat} style={styles.functionRow}>
              <Text
                style={[
                  typography.body,
                  cat === identifiedFunction && {
                    fontWeight: '700',
                    color: colors.navyText,
                  },
                ]}
              >
                {cat}
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
  yesNoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  yesNoBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  yesNoBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  yesNoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  yesNoTextActive: {
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
