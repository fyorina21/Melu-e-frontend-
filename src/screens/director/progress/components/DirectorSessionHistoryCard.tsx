// src/screens/director/progress/components/DirectorSessionHistoryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StatusPill from '../../../../components/StatusPill';
import { sessionStatusType, type SessionHistoryEntry } from '../directorProgressTypes';

interface DirectorSessionHistoryCardProps {
  sessions: SessionHistoryEntry[];
}

export const DirectorSessionHistoryCard: React.FC<DirectorSessionHistoryCardProps> = React.memo(
  ({ sessions }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Session History</Text>
        {sessions.length === 0 ? (
          <Text style={styles.emptyText}>No sessions recorded for this student yet.</Text>
        ) : (
          sessions.map((s, i) => (
            <View key={s.id || i} style={styles.sessionRow}>
              <View style={styles.sessionIconWrap}>
                <Feather name="calendar" size={14} color={colors.navyText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionDate}>{s.date}</Text>
                <Text style={styles.sessionTherapist}>Therapist: {s.teacherName}</Text>
              </View>
              <View style={styles.sessionRight}>
                <StatusPill status={sessionStatusType(s.status)} />
              </View>
            </View>
          ))
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  sessionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  sessionTherapist: {
    fontSize: 11,
    color: colors.bodyText,
  },
  sessionRight: {
    alignSelf: 'center',
  },
});
