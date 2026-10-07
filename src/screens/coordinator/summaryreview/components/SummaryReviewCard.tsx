import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import {
  type Summary,
  type SummaryStatus,
  STATUS_CONFIG,
  DARK,
  AMBER,
  independenceColor,
} from '../types';

interface SummaryReviewCardProps {
  summary: Summary;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onReview: (summary: Summary) => void;
}

function StatusBadge({ status }: { status: SummaryStatus }) {
  const sc = STATUS_CONFIG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Feather name={sc.icon} size={12} color={sc.text} />
      <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
    </View>
  );
}

export const SummaryReviewCard: React.FC<SummaryReviewCardProps> = React.memo(
  ({ summary, isSelected, onToggleSelect, onReview }) => {
    return (
      <View style={[styles.summaryCard, isSelected && styles.summaryCardSelected]}>
        <View style={styles.cardTopRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onToggleSelect(summary.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
          >
            <View style={[styles.checkboxBox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Feather name="check-circle" size={14} color={DARK} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.cardDate}>{summary.date}</Text>
          <StatusBadge status={summary.status} />
        </View>

        <Text style={styles.cardTeacher}>{summary.teacher}</Text>
        <Text style={styles.cardMeta}>
          {summary.station}
          {summary.room ? ` · ${summary.room}` : ''}
        </Text>

        <View style={styles.tagRow}>
          {summary.students.map((st) => (
            <View key={st} style={styles.studentTag}>
              <Text style={styles.studentTagText}>{st}</Text>
            </View>
          ))}
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{summary.trials}</Text>
            <Text style={styles.metricLabel}>Trials</Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: independenceColor(summary.independence) }]}>
              {summary.independence}%
            </Text>
            <Text style={styles.metricLabel}>Independence</Text>
          </View>
          <View style={styles.metric}>
            <Text
              style={[styles.metricValue, { color: summary.incidents > 0 ? '#FB923C' : '#6B7280' }]}
            >
              {summary.incidents}
            </Text>
            <Text style={styles.metricLabel}>Incidents</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => onReview(summary)}
          accessibilityRole="button"
          accessibilityLabel={`Review session by ${summary.teacher}`}
        >
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: spacing.md,
    gap: 8,
  },
  summaryCardSelected: {
    borderColor: AMBER,
    backgroundColor: 'rgba(252,211,77,0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    padding: 2,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AMBER,
    borderColor: AMBER,
  },
  cardDate: {
    flex: 1,
    color: '#6B7280',
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTeacher: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#6B7280',
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  studentTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  studentTagText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    padding: spacing.sm,
    justifyContent: 'space-around',
    marginTop: 4,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  reviewBtnText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '600',
  },
});
