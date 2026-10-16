import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { SessionReport } from '../reportsTypes';

interface SessionReportsTabProps {
  filteredSessionReports: SessionReport[];
}

export function SessionReportsTab({ filteredSessionReports }: SessionReportsTabProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Submitted Session Summaries</Text>
        <Text style={styles.countBadge}>{filteredSessionReports.length} Summaries</Text>
      </View>

      <View style={styles.reportList}>
        {filteredSessionReports.map((r) => (
          <View key={r.id} style={styles.sessionItem}>
            <View style={styles.sessionIconWrap}>
              <Feather name="file-text" size={16} color={colors.navyText} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.sessionTitleRow}>
                <Text style={styles.sessionDate}>{r.date}</Text>
                <Text style={styles.sessionTeacher}>Lead: {r.teacherName}</Text>
              </View>
              <Text style={styles.sessionStudents}>Students: {r.studentNames.join(', ')}</Text>
            </View>
          </View>
        ))}

        {filteredSessionReports.length === 0 && (
          <View style={styles.emptyWrap}>
            <Feather name="file-text" size={32} color={colors.mutedText} />
            <Text style={styles.emptyTitle}>No Matching Session Reports</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  reportList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  sessionTeacher: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryYellowDark,
  },
  sessionStudents: {
    fontSize: 12,
    color: colors.bodyText,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: colors.mutedText,
    fontWeight: '500',
  },
});
