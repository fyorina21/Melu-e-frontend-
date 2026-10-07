import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';
import { type ScheduleBlock } from '../types';
import { TimePickerSelector } from './TimePickerSelector';

interface SessionBlocksTableProps {
  blocks: ScheduleBlock[];
  onOpenPicker: (blockId: string, subField: 'startTime' | 'endTime') => void;
}

export const SessionBlocksTable: React.FC<SessionBlocksTableProps> = React.memo(
  ({ blocks, onOpenPicker }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Session Block Definitions</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colName]}>BLOCK NAME</Text>
            <Text style={[styles.th, styles.colTime]}>START TIME</Text>
            <Text style={[styles.th, styles.colTime]}>END TIME</Text>
          </View>

          {blocks.map((b) => (
            <View key={b.id} style={styles.tableRow}>
              <Text style={[styles.blockNameText, styles.colName]}>{b.name}</Text>
              <View style={[styles.colTime, styles.timeColPadding]}>
                <TimePickerSelector
                  value={b.startTime}
                  onPress={() => onOpenPicker(b.id, 'startTime')}
                  accessibilityLabel={`${b.name} start time`}
                />
              </View>
              <View style={styles.colTime}>
                <TimePickerSelector
                  value={b.endTime}
                  onPress={() => onOpenPicker(b.id, 'endTime')}
                  accessibilityLabel={`${b.name} end time`}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  colName: {
    flex: 4,
  },
  colTime: {
    flex: 3,
  },
  timeColPadding: {
    paddingRight: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  blockNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
});
