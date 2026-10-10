import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface GoalDomainsHeaderProps {
  title?: string;
  subtitle?: string;
}

export function GoalDomainsHeader({
  title = 'Goal Domains & Task Analysis',
  subtitle = 'Unified clinical workbench for goal categories, milestones & task analysis step templates',
}: GoalDomainsHeaderProps) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.badgeIcon}>
          <Feather name="layers" size={20} color={colors.navyText} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.pageSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

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
  textContainer: {
    flex: 1,
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
