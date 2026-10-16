import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import StatusPill from '../../../components/StatusPill';

interface SessionSummaryHeaderProps {
  stationName: string;
  teacherName: string;
  status: string;
  coordinatorFeedback?: string;
  onBack: () => void;
  onPreviewPdf: () => void;
}

export const SessionSummaryHeader: React.FC<SessionSummaryHeaderProps> = React.memo(
  ({ stationName, teacherName, status, coordinatorFeedback, onBack, onPreviewPdf }) => {
    const summaryStatus = status || 'pending_review';
    const isDraft = summaryStatus === 'draft';
    const statusLabel =
      summaryStatus === 'approved'
        ? 'Approved'
        : summaryStatus === 'revised_required'
          ? 'Revision Required'
          : isDraft
            ? 'Draft'
            : 'Pending Review';
    const isReviewed = summaryStatus !== 'pending_review' && summaryStatus !== 'draft';
    const showCoordinatorFeedback = isReviewed && !!coordinatorFeedback;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.topBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to session"
        >
          <Feather name="arrow-left" size={16} color="#64748B" />
          <Text style={styles.topBackText}>Back to Session</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Session Summary</Text>
            <TouchableOpacity
              onPress={onPreviewPdf}
              style={styles.previewPdfBtn}
              accessibilityRole="button"
              accessibilityLabel="Preview PDF export"
            >
              <Feather name="file-text" size={16} color="#1E293B" />
              <Text style={styles.previewPdfText}>Preview PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sessionMetaGrid}>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Station</Text>
              <Text style={styles.metaValue}>{stationName || 'Station A'}</Text>
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Teacher</Text>
              <Text style={styles.metaValue}>{teacherName || 'Teacher'}</Text>
            </View>
          </View>

          <View style={styles.summaryStatusRow}>
            <Text style={styles.summaryStatusLabel}>Status</Text>
            <StatusPill
              status={
                summaryStatus === 'approved'
                  ? 'approved'
                  : summaryStatus === 'revised_required'
                    ? 'revision'
                    : isDraft
                      ? 'draft'
                      : 'pending'
              }
              label={statusLabel}
            />
          </View>
        </View>

        {showCoordinatorFeedback && (
          <View style={styles.coordinatorFeedbackCard}>
            <View style={styles.coordinatorFeedbackHeader}>
              <Feather name="message-square" size={16} color="#DC2626" />
              <Text style={styles.coordinatorFeedbackTitle}>Coordinator Feedback</Text>
            </View>
            <Text style={styles.coordinatorFeedbackText}>{coordinatorFeedback}</Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  topBackText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  previewPdfText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionMetaGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaColumn: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryStatusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  coordinatorFeedbackCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  coordinatorFeedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordinatorFeedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  coordinatorFeedbackText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
});
