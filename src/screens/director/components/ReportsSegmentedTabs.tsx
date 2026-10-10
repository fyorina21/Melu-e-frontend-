// src/screens/director/components/ReportsSegmentedTabs.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { REPORT_TABS } from '../reportsTypes';

interface ReportsSegmentedTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export default function ReportsSegmentedTabs({
  activeTab,
  onSelectTab,
}: ReportsSegmentedTabsProps) {
  return (
    <View style={styles.segmentedContainer} accessibilityRole="tablist">
      {REPORT_TABS.map((t) => {
        const isSelected = activeTab === t;
        return (
          <TouchableOpacity
            key={t}
            style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
            onPress={() => onSelectTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.segmentTabText, isSelected && styles.segmentTabTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentTabActive: {
    backgroundColor: '#FEF08A',
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  segmentTabTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
