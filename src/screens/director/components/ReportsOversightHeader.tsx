// src/screens/director/components/ReportsOversightHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface ReportsOversightHeaderProps {
  onOpenCustomBuilder: () => void;
}

export default function ReportsOversightHeader({
  onOpenCustomBuilder,
}: ReportsOversightHeaderProps) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerLeft}>
        <View style={styles.badgeIcon}>
          <Feather name="bar-chart-2" size={20} color={colors.navyText} />
        </View>
        <View>
          <Text style={styles.pageTitle}>Reports & Clinical Oversight</Text>
          <Text style={styles.pageSubtitle}>
            Session logs, bi-annual progress packets, and foundation analytics
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.builderBtn}
        onPress={onOpenCustomBuilder}
        accessibilityRole="button"
        accessibilityLabel="Open custom report builder"
      >
        <Feather name="sliders" size={14} color={colors.navyText} />
        <Text style={styles.builderBtnText}>Open Custom Builder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  builderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  builderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
