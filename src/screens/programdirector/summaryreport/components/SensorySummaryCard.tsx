// src/screens/programdirector/summaryreport/components/SensorySummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { SensoryActivity } from '../summaryReportTypes';

interface SensorySummaryCardProps {
  activities?: SensoryActivity[];
}

export const SensorySummaryCard: React.FC<SensorySummaryCardProps> = React.memo(
  ({ activities = [] }) => {
    if (!activities || activities.length === 0) {
      return null;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Sensory Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Activity</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Engagement</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Reaction</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Notes</Text>
            </View>

            {activities.map((item, idx) => (
              <View key={`sensory-${idx}`} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableBoldText, { flex: 2 }]}>
                  {item.name}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {item.engagementLevel || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>
                  {item.responseReaction || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 2, color: colors.mutedText }]}>
                  {item.remark || 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  },
);

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
});
