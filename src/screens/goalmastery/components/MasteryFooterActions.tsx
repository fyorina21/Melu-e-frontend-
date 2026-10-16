// src/screens/goalmastery/components/MasteryFooterActions.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, radius } from '../../../theme/colors';

interface MasteryFooterActionsProps {
  canSubmit: boolean;
  isSubmitted: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export const MasteryFooterActions: React.FC<MasteryFooterActionsProps> = React.memo(
  ({ canSubmit, isSubmitted, submitting, onCancel, onSubmit }) => {
    return (
      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={isSubmitted ? 'Close' : 'Cancel'}
        >
          <Text style={styles.cancelBtnText}>{isSubmitted ? 'Close' : 'Cancel'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            canSubmit && styles.submitBtnActive,
            (!canSubmit || isSubmitted || submitting) && styles.submitBtnDisabled,
          ]}
          disabled={!canSubmit}
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit for Review"
          accessibilityState={{ busy: submitting, disabled: !canSubmit }}
        >
          <Text style={[styles.submitBtnText, canSubmit && styles.submitBtnTextActive]}>
            {submitting
              ? 'Submitting…'
              : isSubmitted
                ? 'Submitted for Review'
                : 'Submit for Review'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: '#E2E8F0',
  },
  submitBtnActive: {
    backgroundColor: '#0284C7',
  },
  submitBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  submitBtnTextActive: {
    color: '#FFFFFF',
  },
});
