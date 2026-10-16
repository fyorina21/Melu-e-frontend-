// src/screens/director/masteryapproval/components/MasterySubmissionCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StatusPill from '../../../../components/StatusPill';
import type { MasteryListItem } from '../masteryApprovalTypes';

interface MasterySubmissionCardProps {
  item: MasteryListItem;
  onReview: (checkId: string) => void;
}

export const MasterySubmissionCard: React.FC<MasterySubmissionCardProps> = React.memo(
  ({ item, onReview }) => {
    return (
      <View style={styles.masteryCard}>
        <View style={styles.cardTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentTitle}>{item.studentName}</Text>
            <Text style={styles.goalTitle}>{item.goalName}</Text>
          </View>
          <StatusPill status="pending" label="Pending Director" />
        </View>

        {/* Observers Row */}
        <View style={styles.observersWrap}>
          <View style={styles.obsItem}>
            <Text style={styles.obsLabel}>Teacher A (Primary):</Text>
            <Text style={styles.obsVal}>{item.teacherA}</Text>
          </View>
          <View style={styles.obsItem}>
            <Text style={styles.obsLabel}>Teacher B (Cross):</Text>
            <Text style={styles.obsVal}>{item.teacherB}</Text>
          </View>
          <View style={styles.obsItem}>
            <Text style={styles.obsLabel}>Teacher C (Cross):</Text>
            <Text style={styles.obsVal}>{item.teacherC}</Text>
          </View>
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.dateSubmittedText}>Submitted: {item.dateSubmitted}</Text>
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => onReview(item.checkId)}
            accessibilityRole="button"
            accessibilityLabel={`Review and verify mastery for ${item.studentName}`}
          >
            <Feather name="check-square" size={14} color={colors.navyText} />
            <Text style={styles.reviewBtnText}>Review & Verify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  masteryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  goalTitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  observersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  obsItem: {
    flexGrow: 1,
    minWidth: 140,
  },
  obsLabel: {
    fontSize: 10,
    color: colors.mutedText,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  obsVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.bgApp,
    paddingTop: spacing.sm,
  },
  dateSubmittedText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
});
