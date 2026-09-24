import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DEFAULT_ABLLS_DOMAINS, getMaxCellsForItem, getFilledCells, Score } from '../screens/assessments/abllsConfigHelper';

export default function AbllsGridView({ scores }: { scores: Record<string, Score> }) {
  const summaryData = DEFAULT_ABLLS_DOMAINS.map((d) => {
    const items = d.items.map((it) => ({
      id: it.id,
      description: it.description,
      options: it.options,
      score: scores[it.id] ?? ('NA' as Score),
    }));
    return {
      code: d.code,
      name: d.name,
      items,
    };
  });

  return (
    <View style={gridStyles.sheetContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={gridStyles.gridColumnsContainer}>
        {summaryData.map((domain) => {
          const ascendingItems = [...domain.items].reverse();

          return (
            <View key={domain.code} style={gridStyles.towerColumn}>
              <View style={gridStyles.towerTopTag}>
                <Text style={gridStyles.towerTopCode}>{domain.code}</Text>
                <Text style={gridStyles.towerTopCount}>{domain.items.length} items</Text>
              </View>

              <View style={gridStyles.towerStackBox}>
                {ascendingItems.map((item) => {
                  const maxCells = getMaxCellsForItem(item);
                  const filledCount = getFilledCells(item);

                  return (
                    <View key={item.id} style={gridStyles.skillFloorRow}>
                      <View style={gridStyles.floorLabelBox}>
                        <View
                          style={[
                            gridStyles.floorIndicatorDot,
                            {
                              backgroundColor:
                                item.score === 2
                                  ? '#16A34A'
                                  : item.score === 1
                                  ? '#EAB308'
                                  : item.score === 0
                                  ? '#EF4444'
                                  : '#CBD5E1',
                            },
                          ]}
                        />
                        <Text style={gridStyles.floorItemCode}>{item.id}</Text>
                      </View>

                      <View style={gridStyles.fourCellsWrapper}>
                        {Array.from({ length: maxCells }, (_, cellIdx) => {
                          const isFilled = cellIdx < filledCount;
                          const isNA = item.score === 'NA';
                          const scoreNum = typeof item.score === 'number' ? item.score : parseInt(String(item.score), 10);
                          const cellColor = item.score === 0 ? '#EF4444' : scoreNum >= 2 ? '#16A34A' : '#EAB308';
                          const cellBg = isFilled ? cellColor : isNA ? '#E2E8F0' : '#FFFFFF';

                          return (
                            <View
                              key={cellIdx}
                              style={[
                                gridStyles.cellBox,
                                {
                                  backgroundColor: cellBg,
                                  borderColor: '#475569',
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={gridStyles.towerBottomBox}>
                <Text style={gridStyles.towerBottomTitle} numberOfLines={2}>
                  {domain.name}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  gridColumnsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 64,
  },
  towerColumn: {
    width: 176,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 8,
    padding: 8,
  },
  towerTopTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 6,
  },
  towerTopCode: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  towerTopCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  towerStackBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    gap: 3,
  },
  skillFloorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 4,
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
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  fourCellsWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    marginLeft: 6,
    marginRight: 2,
  },
  cellBox: {
    flex: 1,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  towerBottomBox: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
  },
  towerBottomTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 15,
  },
});
