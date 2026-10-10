// src/screens/programdirector/summaryreport/components/SummaryReportHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';

interface SummaryReportHeaderProps {
  onDownload: () => void;
}

export const SummaryReportHeader: React.FC<SummaryReportHeaderProps> = React.memo(
  ({ onDownload }) => {
    return (
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>ABA</Text>
          </View>
          <View>
            <Text style={styles.pageTitle}>Assessment Summary Report</Text>
            <Text style={styles.pageSubtitle}>6-Week Assessment Completion Report</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDownload}
          style={styles.downloadBtn}
          accessibilityRole="button"
          accessibilityLabel="Download assessment summary PDF"
        >
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  downloadBtn: {
    backgroundColor: colors.navyText,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  downloadBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
