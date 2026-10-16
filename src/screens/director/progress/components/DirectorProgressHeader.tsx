// src/screens/director/progress/components/DirectorProgressHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DirectorProgressHeaderProps {
  onPrint: () => void;
}

export const DirectorProgressHeader: React.FC<DirectorProgressHeaderProps> = React.memo(
  ({ onPrint }) => {
    return (
      <View style={styles.pageHeader}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.badgeIcon}>
            <Feather name="activity" size={20} color={colors.navyText} />
          </View>
          <View>
            <Text style={styles.pageTitle}>Student Progress Monitoring</Text>
            <Text style={styles.pageSubtitle}>
              Clinical oversight of goals, sessions, assessments & behavior trends
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={onPrint}
          accessibilityRole="button"
          accessibilityLabel="Print Report"
        >
          <Feather name="printer" size={14} color={colors.navyText} />
          <Text style={styles.printBtnText}>Print Report</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 260,
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
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
