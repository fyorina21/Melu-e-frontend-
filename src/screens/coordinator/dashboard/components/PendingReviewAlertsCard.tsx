import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../../components/StudentAvatar';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type PendingReview } from '../types';

interface PendingReviewAlertsCardProps {
  pendingReviews: PendingReview[];
  onReview: () => void;
}

export const PendingReviewAlertsCard: React.FC<PendingReviewAlertsCardProps> = React.memo(
  ({ pendingReviews, onReview }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.pendingHeaderLeft}>
            <Feather name="clock" size={16} color="#FCD34D" />
            <Text style={styles.cardTitle}>Pending Review Alerts</Text>
            <View style={styles.pendingCountBadge}>
              <Text style={styles.pendingCountText}>{pendingReviews.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onReview}
            accessibilityRole="button"
            accessibilityLabel="View all pending reviews"
          >
            <Text style={styles.linkText}>View All</Text>
          </TouchableOpacity>
        </View>

        {pendingReviews.length === 0 ? (
          <Text style={styles.emptyText}>No summaries pending review.</Text>
        ) : (
          pendingReviews.map((review, idx) => {
            const independenceColor =
              review.independence >= 70
                ? '#16A34A'
                : review.independence >= 60
                  ? '#CA8A04'
                  : '#EF4444';

            return (
              <View
                key={review.id}
                style={[
                  styles.reviewRow,
                  idx < pendingReviews.length - 1 && styles.reviewRowBorder,
                ]}
              >
                <View style={styles.reviewMainCol}>
                  <View style={styles.reviewTopRow}>
                    <Text style={styles.reviewTeacher}>{review.teacher}</Text>
                    <Text style={styles.reviewDot}>·</Text>
                    <Text style={styles.reviewStation}>{review.station}</Text>
                    {review.incidents > 0 && (
                      <View style={styles.incidentRow}>
                        <Feather name="alert-circle" size={12} color="#EA580C" />
                        <Text style={styles.incidentText}>
                          {review.incidents} incident{review.incidents > 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.reviewMetaRow}>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                    <View style={styles.chipRow}>
                      {review.students.map((s) => (
                        <View
                          key={s}
                          style={[
                            styles.studentChip,
                            { flexDirection: 'row', alignItems: 'center', gap: 4 },
                          ]}
                        >
                          <StudentAvatar name={s} size={14} />
                          <Text style={styles.studentChipText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.reviewRightCol}>
                  <Text style={[styles.independenceText, { color: independenceColor }]}>
                    {review.independence}%
                  </Text>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={onReview}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Review session for ${review.teacher}`}
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navyText,
  },
  pendingCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  pendingCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryYellowDark,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  reviewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewMainCol: {
    flex: 1,
    gap: 4,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewTeacher: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  reviewDot: {
    color: colors.mutedText,
  },
  reviewStation: {
    fontSize: 13,
    color: colors.bodyText,
  },
  incidentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  incidentText: {
    fontSize: 11,
    color: '#EA580C',
    fontWeight: '600',
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.mutedText,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  studentChip: {
    backgroundColor: colors.bgApp,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  studentChipText: {
    fontSize: 10,
    color: colors.primaryYellowDark,
  },
  reviewRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  independenceText: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  reviewButton: {
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
});
