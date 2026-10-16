import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { type AbcIncident, TABLE_COLUMNS, PAGE_SIZE, intensityStyle } from '../types';

interface AbcLogTableProps {
  incidents: AbcIncident[];
  paginated: AbcIncident[];
  safePage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onSelectIncident: (inc: AbcIncident) => void;
}

export const AbcLogTable: React.FC<AbcLogTableProps> = React.memo(
  ({ incidents, paginated, safePage, totalPages, onPageChange, onSelectIncident }) => {
    return (
      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={styles.tableHeaderRow}>
              {TABLE_COLUMNS.map((col) => (
                <View key={col.key} style={[styles.headerCell, { width: col.width }]}>
                  <Text style={styles.headerCellText}>{col.label}</Text>
                </View>
              ))}
            </View>

            {paginated.length === 0 && (
              <Text style={styles.emptyText}>No incidents found for the selected filters.</Text>
            )}

            {paginated.map((inc, idx) => (
              <TouchableOpacity
                key={inc.id}
                style={[styles.tableRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                onPress={() => onSelectIncident(inc)}
                accessibilityRole="button"
                accessibilityLabel={`View incident on ${inc.date || 'unknown date'}`}
              >
                {TABLE_COLUMNS.map((col) => (
                  <View key={col.key} style={[styles.cell, { width: col.width }]}>
                    {col.key === 'intensity' ? (
                      <View
                        style={[
                          styles.intensityBadge,
                          { backgroundColor: intensityStyle(inc.intensity).bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.intensityBadgeText,
                            { color: intensityStyle(inc.intensity).text },
                          ]}
                        >
                          {inc.intensity ?? '—'}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          col.key === 'behavior'
                            ? styles.cellTextStrong
                            : col.key === 'date'
                              ? styles.cellTextDate
                              : styles.cellText
                        }
                        numberOfLines={2}
                      >
                        {inc[col.key] || '—'}
                      </Text>
                    )}
                  </View>
                ))}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Pagination Bar */}
        <View style={styles.paginationBar}>
          <Text style={styles.paginationInfo}>
            Showing {incidents.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, incidents.length)} of {incidents.length} incidents
          </Text>
          {totalPages > 1 && (
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageBtn, safePage === 1 && styles.pageBtnDisabled]}
                disabled={safePage === 1}
                onPress={() => onPageChange(Math.max(1, safePage - 1))}
                accessibilityRole="button"
                accessibilityLabel="Previous page"
              >
                <Text style={styles.pageBtnText}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>
                {safePage} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, safePage === totalPages && styles.pageBtnDisabled]}
                disabled={safePage === totalPages}
                onPress={() => onPageChange(Math.min(totalPages, safePage + 1))}
                accessibilityRole="button"
                accessibilityLabel="Next page"
              >
                <Text style={styles.pageBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  headerCell: {
    paddingHorizontal: spacing.sm,
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowEven: {
    backgroundColor: colors.white,
  },
  rowOdd: {
    backgroundColor: '#FAFAFA',
  },
  cell: {
    paddingHorizontal: spacing.sm,
  },
  cellText: {
    fontSize: 12,
    color: '#334155',
  },
  cellTextStrong: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  cellTextDate: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  intensityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 13,
    color: '#64748B',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FAFAFA',
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationInfo: {
    fontSize: 12,
    color: '#64748B',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
