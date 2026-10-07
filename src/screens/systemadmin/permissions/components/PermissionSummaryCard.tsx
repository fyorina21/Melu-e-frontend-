import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface PermissionSummaryCardProps {
  roleName: string;
  summaryList: string[];
}

export const PermissionSummaryCard: React.FC<PermissionSummaryCardProps> = React.memo(
  ({ roleName, summaryList }) => {
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>PERMISSION SUMMARY — {roleName.toUpperCase()}</Text>
        {summaryList.length === 0 ? (
          <Text style={styles.summaryTextEmpty}>
            No active permissions configured for this role.
          </Text>
        ) : (
          summaryList.map((statement, idx) => (
            <View key={idx} style={styles.summaryRow}>
              <Feather name="check" size={14} color="#10B981" />
              <Text style={styles.summaryText}>{statement}</Text>
            </View>
          ))
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 13,
    color: colors.navyText,
  },
  summaryTextEmpty: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
