// src/screens/session/components/SessionFooterActions.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import type { SessionFooterActionsProps } from '../sessionDataTypes';

export const SessionFooterActions: React.FC<SessionFooterActionsProps> = React.memo(
  ({ onSwapStudents, onSessionSummary }) => {
    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSwapStudents}
          accessibilityRole="button"
          accessibilityLabel="Swap student stations"
        >
          <Text style={styles.secondaryBtnText}>⇄ Swap Students</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onSessionSummary}
          accessibilityRole="button"
          accessibilityLabel="View session summary"
        >
          <Text style={styles.primaryBtnText}>📄 Session Summary</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
