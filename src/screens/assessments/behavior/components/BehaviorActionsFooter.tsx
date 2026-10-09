// src/screens/assessments/behavior/components/BehaviorActionsFooter.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface BehaviorActionsFooterProps {
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export const BehaviorActionsFooter: React.FC<BehaviorActionsFooterProps> = React.memo(
  ({ onSaveDraft, onSubmit }) => {
    return (
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={onSaveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save Draft"
        >
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.actionBtnText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit Assessment"
        >
          <Feather name="check-circle" size={16} color={colors.navyText} />
          <Text style={styles.actionBtnText}>Submit Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primaryYellow,
  },
  actionBtnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  actionBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
