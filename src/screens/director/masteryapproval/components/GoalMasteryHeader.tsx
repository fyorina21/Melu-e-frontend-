// src/screens/director/masteryapproval/components/GoalMasteryHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface GoalMasteryHeaderProps {
  onExport: () => void;
}

export const GoalMasteryHeader: React.FC<GoalMasteryHeaderProps> = React.memo(({ onExport }) => {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.badgeIcon}>
          <Feather name="award" size={20} color={colors.navyText} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Goal Mastery Approval</Text>
          <Text style={styles.pageSubtitle}>
            Multi-therapist generalization check & final clinical approval
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.exportTopBtn}
        onPress={onExport}
        accessibilityRole="button"
        accessibilityLabel="Export Record"
      >
        <Feather name="printer" size={14} color={colors.navyText} />
        <Text style={styles.exportTopBtnText}>Export Record</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 280,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  exportTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  exportTopBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
