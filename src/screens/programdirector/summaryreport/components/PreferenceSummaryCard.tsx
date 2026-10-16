// src/screens/programdirector/summaryreport/components/PreferenceSummaryCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { filterPreferenceItemsByContext, type PreferenceItem } from '../summaryReportTypes';

interface PreferenceSummaryCardProps {
  items?: PreferenceItem[];
  prefTab: string;
  onTabChange: (tab: string) => void;
}

const PREF_TABS = ['Sensory Time', 'Circle Time', 'Play Time'] as const;

export const PreferenceSummaryCard: React.FC<PreferenceSummaryCardProps> = React.memo(
  ({ items = [], prefTab, onTabChange }) => {
    const filteredItems = filterPreferenceItemsByContext(items, prefTab);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Preference Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={radioStyles.row}>
            {PREF_TABS.map((tab) => {
              const isSelected = prefTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={radioStyles.radioBtn}
                  onPress={() => onTabChange(tab)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={tab}
                >
                  <View
                    style={[radioStyles.radioCircle, isSelected && radioStyles.radioCircleSelected]}
                  >
                    {isSelected && <View style={radioStyles.radioDot} />}
                  </View>
                  <Text
                    style={[radioStyles.radioText, isSelected && radioStyles.radioTextSelected]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>No preference observations recorded for {prefTab}.</Text>
          ) : (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: 50 }]}>Rank</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Preferred Item</Text>
                <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 1 }]}>
                  Duration
                </Text>
                <Text style={[styles.tableHeaderCell, styles.tableRight, { flex: 1 }]}>Freq</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Context</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Engagement</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Approach</Text>
              </View>

              {filteredItems.map((item, idx) => (
                <View
                  key={
                    item.id
                      ? `pref-${item.id}`
                      : item.rank !== undefined
                        ? `pref-rank-${item.rank}-${idx}`
                        : `pref-idx-${idx}`
                  }
                  style={styles.tableRow}
                >
                  <View style={{ width: 50 }}>
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankText}>{item.rank ?? idx + 1}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.tableBoldText, { flex: 2 }]}>
                    {item.item}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableRight, { flex: 1 }]}>
                    {item.duration || '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableRight, { flex: 1 }]}>
                    {item.frequency !== undefined ? `${item.frequency}x` : '—'}
                  </Text>
                  <Text
                    style={[styles.tableCell, { flex: 1.5, fontSize: 11, color: colors.mutedText }]}
                  >
                    {item.context || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontSize: 11 }]}>
                    {item.engaged || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontSize: 11 }]}>
                    {item.approached || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  },
);

const radioStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  radioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  radioText: {
    fontSize: 13,
    color: '#334155',
  },
  radioTextSelected: {
    fontWeight: '600',
    color: '#0284C7',
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeaderBlue: {
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  tableContainer: {
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    fontSize: 13,
    color: colors.bodyText,
  },
  tableBoldText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  tableRight: {
    textAlign: 'right',
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
});
