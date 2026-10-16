import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { SessionHistoryRow } from '../studentProgressTypes';
import { MiniProgressBar } from './AssessmentProgressCards';

interface SessionHistoryTableProps {
  sessions: SessionHistoryRow[];
  onSelectSession: (session: SessionHistoryRow) => void;
}

export function SessionHistoryTable({ sessions, onSelectSession }: SessionHistoryTableProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Feather name="activity" size={16} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Session History</Text>
      </View>
      {sessions.map((session, i, arr) => (
        <View
          key={session.id}
          style={[styles.tableRow, i < arr.length - 1 && styles.tableRowBorder]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionDate}>{session.date}</Text>
            <Text style={styles.sessionStation}>
              {session.stationName ?? 'Session'}
              {session.status ? ` · ${session.status}` : ''}
            </Text>
          </View>
          <View style={styles.sessionRightCol}>
            <MiniProgressBar value={session.independencePercent ?? 0} />
            <View style={styles.incidentInline}>
              <Feather name="check-circle" size={14} color="#16A34A" />
              <Text style={styles.incidentCheck}>✓</Text>
            </View>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onSelectSession(session)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`View session details for ${session.date}`}
            >
              <Feather name="eye" size={14} color={colors.primaryYellowDark} />
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {sessions.length === 0 && <Text style={styles.emptyText}>No session history yet.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  sessionStation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 200,
  },
  incidentInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  incidentCheck: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: '#FEF9C3',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryYellowDark,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
