// src/screens/institutionaladmin/components/ModificationHistoryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';

export interface HistoryItem {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

interface ModificationHistoryCardProps {
  history: HistoryItem[];
}

export default function ModificationHistoryCard({ history }: ModificationHistoryCardProps) {
  if (!history || history.length === 0) return null;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Modification History</Text>
        <Feather name="chevron-up" size={16} color="#64748B" />
      </View>

      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableCol, { flex: 1.2 }]}>DATE</Text>
        <Text style={[styles.tableCol, { flex: 1 }]}>USER</Text>
        <Text style={[styles.tableCol, { flex: 1.5 }]}>FIELD</Text>
        <Text style={[styles.tableCol, { flex: 1 }]}>OLD VALUE</Text>
        <Text style={[styles.tableCol, { flex: 1 }]}>NEW VALUE</Text>
      </View>

      {history.map((item, idx) => (
        <View key={idx} style={styles.tableDataRow}>
          <Text style={[styles.tableDataCell, { flex: 1.2 }]}>{item.date}</Text>
          <Text style={[styles.tableDataCell, { flex: 1, fontWeight: '700' }]}>{item.user}</Text>
          <Text style={[styles.tableDataCell, { flex: 1.5 }]}>{item.field}</Text>
          <Text style={[styles.tableDataCell, { flex: 1, color: '#EF4444' }]}>{item.oldValue}</Text>
          <Text style={[styles.tableDataCell, { flex: 1, color: '#22C55E' }]}>{item.newValue}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableDataCell: {
    fontSize: 12,
    color: '#334155',
  },
});
