import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import {
  type AbllsSummaryDomain,
  type SelectedItemState,
  getMaxCellsForItem,
  getFilledCells,
} from '../types';

export interface AbllsGridSheetProps {
  summaryData: AbllsSummaryDomain[];
  onSelectItem: (item: SelectedItemState) => void;
}

export function AbllsGridSheet({ summaryData, onSelectItem }: AbllsGridSheetProps) {
  return (
    <View style={styles.sheetContainer}>
      <View style={styles.sheetNoticeRow}>
        <Feather name="info" size={14} color="#0284C7" />
        <Text style={styles.sheetNoticeText}>
          Tap any skill floor/cell to inspect specific criteria, mastery level, and description.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.gridColumnsContainer}
      >
        {summaryData.map((domain) => {
          // Stacked ascending from bottom (A1 at bottom floor) to top (A7 at peak)
          const ascendingItems = [...domain.items].reverse();

          return (
            <View key={domain.code} style={styles.towerColumn}>
              {/* Domain Header Tag */}
              <View style={styles.towerTopTag}>
                <Text style={styles.towerTopCode}>{domain.code}</Text>
                <Text style={styles.towerTopCount}>{domain.items.length} items</Text>
              </View>

              {/* Skill Floors (Tower of dynamic cell rows) */}
              <View style={styles.towerStackBox}>
                {ascendingItems.map((item) => {
                  const maxCells = getMaxCellsForItem(item);
                  const filledCount = getFilledCells(item);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.skillFloorRow}
                      onPress={() =>
                        onSelectItem({
                          id: item.id,
                          domain: domain.name,
                          description: item.description,
                          score: item.score,
                          options: item.options,
                          maxCells: item.maxCells,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.floorLabelBox}>
                        <View
                          style={[
                            styles.floorIndicatorDot,
                            {
                              backgroundColor:
                                item.score === 2
                                  ? colors.success
                                  : item.score === 1
                                    ? colors.warning
                                    : item.score === 0
                                      ? colors.error
                                      : '#CBD5E1',
                            },
                          ]}
                        />
                        <Text style={styles.floorItemCode}>{item.id}</Text>
                      </View>

                      {/* Cells / Floors based on configured level count */}
                      <View style={styles.fourCellsWrapper}>
                        {Array.from({ length: maxCells }, (_, cellIdx) => {
                          const isFilled = cellIdx < filledCount;
                          const isNA = item.score === 'NA';
                          const scoreNum =
                            typeof item.score === 'number'
                              ? item.score
                              : parseInt(String(item.score), 10);
                          const cellColor =
                            item.score === 0
                              ? colors.error
                              : scoreNum >= 2
                                ? colors.success
                                : colors.warning;
                          const cellBg = isFilled ? cellColor : isNA ? '#E2E8F0' : '#FFFFFF';

                          return (
                            <View
                              key={cellIdx}
                              style={[
                                styles.cellBox,
                                {
                                  backgroundColor: cellBg,
                                  borderColor: '#475569',
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bottom Domain Footer */}
              <View style={styles.towerBottomBox}>
                <Text style={styles.towerBottomTitle} numberOfLines={2}>
                  {domain.name}
                </Text>
                <View
                  style={[
                    styles.towerMasteryPill,
                    domain.masteredPct >= 70
                      ? styles.pillGreen
                      : domain.masteredPct >= 40
                        ? styles.pillYellow
                        : styles.pillRed,
                  ]}
                >
                  <Text style={styles.towerMasteryText}>{domain.masteredPct}%</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  sheetNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0F9FF',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  sheetNoticeText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
  },
  gridColumnsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  towerColumn: {
    width: 130,
    alignItems: 'center',
  },
  towerTopTag: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  towerTopCode: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.navyText,
  },
  towerTopCount: {
    fontSize: 11,
    color: colors.mutedText,
    fontWeight: '600',
  },
  towerStackBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 4,
    padding: 4,
    gap: 3,
  },
  skillFloorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  floorLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 32,
  },
  floorIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floorItemCode: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.navyText,
  },
  fourCellsWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    marginLeft: 4,
  },
  cellBox: {
    flex: 1,
    height: 12,
    borderWidth: 1,
  },
  towerBottomBox: {
    alignItems: 'center',
    marginTop: spacing.sm,
    width: '100%',
  },
  towerBottomTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 4,
  },
  towerMasteryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  towerMasteryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pillGreen: { backgroundColor: colors.success },
  pillYellow: { backgroundColor: colors.warning },
  pillRed: { backgroundColor: colors.error },
});

export default AbllsGridSheet;
