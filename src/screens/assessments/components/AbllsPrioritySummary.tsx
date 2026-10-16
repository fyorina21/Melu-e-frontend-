import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import { type AbllsSummaryDomain, type PriorityArea } from '../types';

export interface AbllsPrioritySummaryProps {
  priorityAreas: PriorityArea[];
  rows: AbllsSummaryDomain[];
}

export function AbllsPrioritySummary({ priorityAreas, rows }: AbllsPrioritySummaryProps) {
  return (
    <View style={styles.container}>
      {/* Priority Areas of Need (Top 3) */}
      <View style={styles.summaryCard}>
        <View style={styles.sectionHeaderRow}>
          <Feather name="alert-triangle" size={16} color={colors.error} />
          <Text style={styles.sectionHeading}>Priority Areas of Need (Top Clinical Focus)</Text>
        </View>
        <Text style={styles.sectionSub}>
          Domains with the highest count of unmastered (0s) and emerging (1s) skills recommended for
          IEP / IUP target goals.
        </Text>

        <View style={styles.priorityCardsGrid}>
          {priorityAreas.map((p) => (
            <View key={p.rank} style={styles.priorityCardBox}>
              <View style={styles.priorityHeaderRow}>
                <View style={styles.priorityRankCircle}>
                  <Text style={styles.priorityRankNumber}>#{p.rank}</Text>
                </View>
                <Text style={styles.priorityDomainTitle}>{p.name}</Text>
              </View>
              <View style={styles.priorityCountsRow}>
                <View style={styles.priorityCountChipRed}>
                  <Text style={styles.priorityCountTextRed}>{p.c0} not demonstrated</Text>
                </View>
                <View style={styles.priorityCountChipYellow}>
                  <Text style={styles.priorityCountTextYellow}>{p.c1} emerging</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Comprehensive Domain Mastery Table */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionHeading}>Comprehensive Domain Summary</Text>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, styles.colDomain]}>Domain Area</Text>
          <Text style={[styles.th, styles.colBadge, { color: colors.error }]}>Score 0</Text>
          <Text style={[styles.th, styles.colBadge, { color: colors.warningDark }]}>Score 1</Text>
          <Text style={[styles.th, styles.colBadge, { color: colors.success }]}>Score 2</Text>
          <Text style={[styles.th, styles.colBadge, { color: colors.mutedText }]}>N/A</Text>
          <Text style={[styles.th, styles.colProgress]}>% Mastered</Text>
          <Text style={[styles.th, styles.colPriority]}>Status</Text>
        </View>

        {rows.map((row, idx) => (
          <View key={row.name} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.tdDomain, styles.colDomain]}>
              <Text style={{ fontWeight: '800', color: colors.primaryBlue }}>{row.code}. </Text>
              {row.name}
            </Text>

            <View style={styles.colBadge}>
              <View style={[styles.countBadge, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.error }]}>{row.c0}</Text>
              </View>
            </View>

            <View style={styles.colBadge}>
              <View style={[styles.countBadge, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.warningDark }]}>{row.c1}</Text>
              </View>
            </View>

            <View style={styles.colBadge}>
              <View style={[styles.countBadge, { backgroundColor: colors.statusCompletedBg }]}>
                <Text style={[styles.countBadgeText, { color: colors.success }]}>{row.c2}</Text>
              </View>
            </View>

            <Text style={[styles.tdNA, styles.colBadge]}>{row.cNA}</Text>

            <View style={[styles.colProgress, styles.progressCell]}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${row.masteredPct}%` }]} />
              </View>
              <Text style={styles.progressPctText}>{row.masteredPct}%</Text>
            </View>

            <View style={styles.colPriority}>
              {row.isPriority ? (
                <View style={styles.priorityPill}>
                  <Text style={styles.priorityPillText}>High Need</Text>
                </View>
              ) : (
                <Text style={styles.normalStatusText}>On Track</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navyText,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.bodyText,
    marginBottom: spacing.md,
  },
  priorityCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  priorityCardBox: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFF1F2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: spacing.md,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityRankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityRankNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  priorityDomainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
    flex: 1,
  },
  priorityCountsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  priorityCountChipRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  priorityCountTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.errorDark,
  },
  priorityCountChipYellow: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  priorityCountTextYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warningDark,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginTop: spacing.sm,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  colDomain: { flex: 4 },
  colBadge: { flex: 1.5, alignItems: 'center' },
  colProgress: { flex: 3 },
  colPriority: { flex: 2, alignItems: 'center' },
  tdDomain: {
    fontSize: 13,
    color: colors.navyText,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tdNA: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
  },
  progressCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radius.pill,
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    width: 36,
    textAlign: 'right',
  },
  priorityPill: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.errorDark,
  },
  normalStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});

export default AbllsPrioritySummary;
