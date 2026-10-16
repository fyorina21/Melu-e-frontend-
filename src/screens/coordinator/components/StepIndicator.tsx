import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme/colors';

interface StepIndicatorProps {
  current: number;
  steps: string[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  i < current && styles.stepDotDone,
                  i === current && styles.stepDotCurrent,
                ]}
              >
                {i < current ? (
                  <Feather name="check" size={13} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNum, i === current && styles.stepNumCurrent]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, i < current && styles.stepLineDone]} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[styles.stepLabel, i === current && styles.stepLabelCurrent]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepWrap: { flex: 1, alignItems: 'center' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 2,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  stepDotCurrent: { backgroundColor: '#FCD34D', borderColor: '#FCD34D', borderWidth: 1.5 },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumCurrent: { color: '#1F2937' },
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: '#38BDF8' },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  stepLabelCurrent: { color: '#1F2937', fontWeight: '700' },
});
