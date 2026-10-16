// src/screens/director/reportbuilder/components/ReportResultsCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StatusPill from '../../../../components/StatusPill';
import type { ReportRow } from '../reportBuilderTypes';

interface ReportResultsCardProps {
  results: ReportRow[];
  onExport: (format: 'CSV' | 'TXT' | 'PRINT') => void;
}

export const ReportResultsCard: React.FC<ReportResultsCardProps> = React.memo(
  ({ results, onExport }) => {
    return (
      <View style={styles.card}>
        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.cardTitle}>Report Results</Text>
            <Text style={styles.resultSubtitle}>{results.length} Student Record(s) Matched</Text>
          </View>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => onExport('CSV')}
              accessibilityRole="button"
              accessibilityLabel="Export as CSV"
            >
              <Feather name="download" size={13} color={colors.navyText} />
              <Text style={styles.exportBtnText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => onExport('TXT')}
              accessibilityRole="button"
              accessibilityLabel="Export as Document"
            >
              <Feather name="file-text" size={13} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => onExport('PRINT')}
              accessibilityRole="button"
              accessibilityLabel="Print or export as PDF"
            >
              <Feather name="printer" size={13} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Print / PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Table */}
        <View style={styles.table}>
          {results.map((r) => (
            <View key={r.id} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.studentTitleRow}>
                  <Text style={styles.studentName}>{r.name}</Text>
                  <Text style={styles.studentMeta}>
                    Age {r.age} · {r.program}
                  </Text>
                </View>
                <Text style={styles.studentSubMeta}>
                  Therapist: {r.therapist} · Diagnosis: {r.diagnosis} · Behavior: {r.behaviorType}
                </Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricText}>Attendance: {r.attendance}%</Text>
                  <Text style={styles.metricText}>Assessment: {r.assessmentScore}%</Text>
                </View>
              </View>
              <StatusPill
                status={r.goalStatus === 'On Track' ? 'approved' : 'pending'}
                label={r.goalStatus}
              />
            </View>
          ))}

          {results.length === 0 && (
            <View style={styles.emptyResults}>
              <Feather name="info" size={28} color={colors.mutedText} />
              <Text style={styles.emptyResultsTitle}>No Students Matched</Text>
              <Text style={styles.emptyResultsSub}>
                Try adjusting your filter parameters above.
              </Text>
            </View>
          )}
        </View>
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
    paddingBottom: spacing.sm,
  },
  resultSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bgApp,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  table: {
    gap: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
    gap: spacing.md,
  },
  studentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  studentMeta: {
    fontSize: 12,
    color: colors.bodyText,
  },
  studentSubMeta: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 4,
  },
  metricText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
  },
  emptyResults: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptyResultsSub: {
    fontSize: 12,
    color: colors.mutedText,
  },
});
