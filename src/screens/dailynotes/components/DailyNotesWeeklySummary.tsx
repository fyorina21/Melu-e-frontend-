import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { WeeklySummaryData, NoteRecord } from '../dailyNotesTypes';

interface DailyNotesWeeklySummaryProps {
  summary: WeeklySummaryData;
  records: NoteRecord[];
  onExportWeekly: () => void;
}

export const DailyNotesWeeklySummary: React.FC<DailyNotesWeeklySummaryProps> = React.memo(
  ({ summary, records, onExportWeekly }) => {
    const approved = records.filter((r) => r.status === 'Approved').length;
    const pending = records.filter((r) => r.status === 'Pending').length;
    const revision = records.filter((r) => r.status === 'Revision Required').length;
    const draft = records.filter((r) => r.status === 'Draft').length;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Weekly Summary</Text>
          <TouchableOpacity
            style={styles.exportSummaryBtn}
            onPress={onExportWeekly}
            accessibilityRole="button"
            accessibilityLabel="Export weekly summary"
          >
            <Feather name="download" size={13} color="#0284C7" />
            <Text style={styles.exportSummaryText}>Export Summary</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Week of</Text>
          <Text style={styles.summaryValBold}>{summary.weekRange}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sessions this week</Text>
          <Text style={styles.summaryValBold}>{summary.sessionsThisWeek}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total trials this week</Text>
          <Text style={styles.summaryValBold}>{summary.totalTrialsThisWeek}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Avg independence this week</Text>
          <Text style={[styles.summaryValBold, { color: '#059669' }]}>
            {summary.avgIndependenceThisWeek}%
          </Text>
        </View>

        {/* Summary Status Badges */}
        <View style={styles.statusBadgesRow}>
          {approved > 0 && (
            <View style={styles.badgeApproved}>
              <Feather name="check-circle" size={12} color="#166534" />
              <Text style={styles.badgeApprovedText}>{approved} Approved</Text>
            </View>
          )}
          {pending > 0 && (
            <View style={styles.badgePending}>
              <Feather name="clock" size={12} color="#854D0E" />
              <Text style={styles.badgePendingText}>{pending} Pending</Text>
            </View>
          )}
          {revision > 0 && (
            <View style={styles.badgeRevision}>
              <Feather name="alert-circle" size={12} color="#991B1B" />
              <Text style={styles.badgeRevisionText}>{revision} Revision Required</Text>
            </View>
          )}
          {draft > 0 && (
            <View style={styles.badgeDraft}>
              <Feather name="file-text" size={12} color="#334155" />
              <Text style={styles.badgeDraftText}>{draft} Draft</Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  exportSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badgeApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  badgeRevision: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeRevisionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  badgeDraft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeDraftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
});
