import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { SCORE_COLOR } from '../abllsConfigHelper';
import {
  type AbllsSummaryDomain,
  type SelectedItemState,
  getMaxCellsForItem,
  getFilledCells,
} from '../types';

export interface AbllsDomainCardsProps {
  summaryData: AbllsSummaryDomain[];
  priorityNames: Set<string>;
  onSelectItem: (item: SelectedItemState) => void;
}

export function AbllsDomainCards({
  summaryData,
  priorityNames,
  onSelectItem,
}: AbllsDomainCardsProps) {
  return (
    <View style={styles.cardsContainer}>
      {summaryData.map((domain) => (
        <View key={domain.name} style={styles.domainCard}>
          <View style={styles.domainCardHeader}>
            <View style={styles.domainCardTitleRow}>
              <Text style={styles.domainCodeBadge}>{domain.code}</Text>
              <Text style={styles.domainCardTitle}>{domain.name}</Text>
              {priorityNames.has(domain.name) && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>High Need</Text>
                </View>
              )}
            </View>
            <Text style={styles.domainCardPct}>{domain.masteredPct}% Mastered</Text>
          </View>

          {/* Grid items in this domain */}
          <View style={styles.domainItemsGrid}>
            {domain.items.map((item) => {
              const maxCells = getMaxCellsForItem(item);
              const filled = getFilledCells(item);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardItemTile}
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
                  <View style={styles.cardTileHeader}>
                    <Text style={styles.cardTileId}>{item.id}</Text>
                    <Text style={[styles.cardTileScoreBadge, { color: SCORE_COLOR[item.score] }]}>
                      {item.score === 'NA' ? 'N/A' : `Score: ${item.score}`}
                    </Text>
                  </View>
                  <Text style={styles.cardTileDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.cardTileCells}>
                    {Array.from({ length: maxCells }, (_, cIdx) => {
                      const isFilled = cIdx < filled;
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

                      return (
                        <View
                          key={cIdx}
                          style={[
                            styles.cardMiniCell,
                            {
                              backgroundColor: isFilled ? cellColor : isNA ? '#E2E8F0' : '#FFFFFF',
                              borderColor: '#64748B',
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    gap: spacing.lg,
  },
  domainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  domainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
  },
  domainCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  domainCodeBadge: {
    backgroundColor: colors.navyText,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  domainCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  priorityBadge: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.errorDark,
  },
  domainCardPct: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  domainItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardItemTile: {
    width: 170,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  cardTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTileId: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navyText,
  },
  cardTileScoreBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTileDesc: {
    fontSize: 11,
    color: colors.bodyText,
    lineHeight: 14,
    height: 28,
    marginBottom: 6,
  },
  cardTileCells: {
    flexDirection: 'row',
    gap: 3,
  },
  cardMiniCell: {
    flex: 1,
    height: 8,
    borderWidth: 1,
  },
});

export default AbllsDomainCards;
