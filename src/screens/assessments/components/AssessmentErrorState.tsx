import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface Props {
  onRetry: () => void;
}

export const AssessmentErrorState: React.FC<Props> = React.memo(({ onRetry }) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Feather name="alert-circle" size={32} color="#EF4444" />
      </View>
      <Text style={styles.heading}>Failed to load assessment caseload</Text>
      <Text style={styles.message}>
        We encountered an issue fetching the 6-week assessment dashboard data. Please check your
        network connection and try again.
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Feather name="refresh-cw" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    minHeight: 280,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
