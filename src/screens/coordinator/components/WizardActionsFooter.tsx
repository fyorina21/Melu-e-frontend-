// src/screens/coordinator/components/WizardActionsFooter.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme/colors';

interface WizardActionsFooterProps {
  step: number;
  totalSteps: number;
  currentStepName: string;
  nextStepName?: string;
  saving: boolean;
  onPrev: () => void;
  onSaveProgress: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const WizardActionsFooter: React.FC<WizardActionsFooterProps> = React.memo(
  ({ step, totalSteps, nextStepName, saving, onPrev, onSaveProgress, onNext, onSubmit }) => {
    const isLastStep = step >= totalSteps - 1;

    return (
      <View style={styles.actionsRow}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onPrev}
            accessibilityRole="button"
            accessibilityLabel="Go to previous step"
          >
            <Feather name="arrow-left" size={16} color={colors.navyText} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSaveProgress}
          accessibilityRole="button"
          accessibilityLabel="Save enrollment progress"
        >
          <Feather name="bookmark" size={14} color={colors.navyText} />
          <Text style={styles.secondaryBtnText}>Save Progress</Text>
        </TouchableOpacity>
        {!isLastStep ? (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={`Proceed to next step: ${nextStepName || 'Next'}`}
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Feather name="arrow-right" size={16} color={colors.navyText} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={onSubmit}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Finish and submit student enrollment"
            accessibilityState={{ busy: saving, disabled: saving }}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.navyText} />
            ) : (
              <Feather name="check" size={16} color={colors.navyText} />
            )}
            <Text style={styles.nextBtnText}>{saving ? 'Submitting…' : 'Finish Enrollment'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  backBtnText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 12,
    color: colors.navyText,
    textAlign: 'center',
  },
  nextBtn: {
    flex: 1.6,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  nextBtnText: {
    fontWeight: '700',
    color: '#1F2937',
  },
});
