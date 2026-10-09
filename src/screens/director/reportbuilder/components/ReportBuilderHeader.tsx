// src/screens/director/reportbuilder/components/ReportBuilderHeader.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

export const ReportBuilderHeader: React.FC = React.memo(() => {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.badgeIcon}>
          <Feather name="filter" size={20} color={colors.navyText} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Custom Report Builder</Text>
          <Text style={styles.pageSubtitle}>
            Build, filter, analyze, and export customized student clinical data
          </Text>
        </View>
      </View>
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
});
