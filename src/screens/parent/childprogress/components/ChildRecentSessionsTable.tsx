// src/screens/parent/childprogress/components/ChildRecentSessionsTable.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { independenceColor, type Session } from '../childProgressTypes';

interface ChildRecentSessionsTableProps {
  sessions: Session[];
  onOpenSession: (session: Session) => void;
}

export const ChildRecentSessionsTable: React.FC<ChildRecentSessionsTableProps> = React.memo(
  ({ sessions, onOpenSession }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Sessions</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thDate]}>Date</Text>
          <Text style={[styles.th, styles.thTeacher]}>Teacher</Text>
          <Text style={styles.th}>Duration</Text>
          <Text style={styles.th}>Trials</Text>
          <Text style={styles.th}>Indep.</Text>
        </View>
        {sessions.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.tableRow}
            onPress={() => onOpenSession(s)}
            accessibilityRole="button"
            accessibilityLabel={`Session on ${s.date} with ${s.teacher}`}
          >
            <Text style={[styles.td, styles.tdDate]}>{s.date}</Text>
            <Text style={[styles.td, styles.tdTeacher]}>{s.teacher}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{s.duration}</Text>
            <Text style={[styles.td, styles.tdCenter]}>{s.trials}</Text>
            <Text
              style={[
                styles.td,
                styles.tdCenter,
                {
                  color: independenceColor(s.independence),
                  fontWeight: '700',
                },
              ]}
            >
              {s.independence}%
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.tableHint}>Tap any row to see session details</Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  th: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  thDate: {
    textAlign: 'left',
    flex: 1.4,
  },
  thTeacher: {
    flex: 1.3,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    alignItems: 'center',
  },
  td: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    textAlign: 'center',
  },
  tdDate: {
    textAlign: 'left',
    flex: 1.4,
    fontWeight: '600',
    color: '#374151',
  },
  tdTeacher: {
    flex: 1.3,
    textAlign: 'left',
  },
  tdCenter: {},
  tableHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: spacing.md,
  },
});
