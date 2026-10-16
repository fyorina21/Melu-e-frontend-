// src/screens/programdirector/assessmentreview/components/AssessmentReviewRow.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import StatusPill from '../../../../components/StatusPill';
import { STATUS_KEY, type AssessmentListItem } from '../reviewTypes';

interface AssessmentReviewRowProps {
  item: AssessmentListItem;
  onViewReport: (studentId: string) => void;
}

export const AssessmentReviewRow: React.FC<AssessmentReviewRowProps> = React.memo(
  ({ item, onViewReport }) => {
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={typography.bodyBold}>{item.studentName}</Text>
          <Text style={typography.caption}>
            Age {item.age} · {item.program}
            {item.therapist !== 'Unassigned' ? ` · ${item.therapist}` : ''}
            {item.dateCompleted ? ` · ${item.dateCompleted}` : ''}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <View style={styles.progressCol}>
            <Text style={styles.progressLabel}>ABLLS {item.abllsPct}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, item.abllsPct)}%` }]} />
            </View>
          </View>
          <StatusPill status={STATUS_KEY[item.status] || 'notStarted'} label={item.status} />
          <View style={styles.rowActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onViewReport(item.studentId)}
              accessibilityRole="button"
              accessibilityLabel={`View report for ${item.studentName}`}
            >
              <Text style={styles.actionBtnText}>View Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  progressCol: {
    width: 80,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navyText,
  },
  progressBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#16A34A',
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
});
