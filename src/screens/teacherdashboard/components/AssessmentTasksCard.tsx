import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { AssessmentTask } from '../teacherDashboardTypes';

interface AssessmentTasksCardProps {
  tasks: AssessmentTask[];
  onContinue: (task: AssessmentTask) => void;
}

export const AssessmentTasksCard: React.FC<AssessmentTasksCardProps> = React.memo(
  ({ tasks, onContinue }) => {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Feather name="clipboard" size={18} color={colors.statusInProgressText} />
            <Text style={typography.h3}>Assessment Tasks</Text>
          </View>
          <View style={styles.reviewPill}>
            <Text style={styles.reviewPillText}>6-Week Review</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending assessment tasks.</Text>
            </View>
          ) : (
            tasks.map((t) => (
              <View key={t.id} style={styles.taskRow}>
                <View style={styles.taskHeaderRow}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{t.studentInitial}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{t.studentName}</Text>
                    <Text style={typography.caption}>{t.assessmentName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      t.status === 'In Progress'
                        ? styles.statusBadgeProgress
                        : styles.statusBadgeNotStarted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        t.status === 'In Progress' && { color: colors.statusInProgressText },
                      ]}
                    >
                      {t.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text style={typography.caption}>Progress</Text>
                  <Text style={typography.caption}>{t.progress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, t.progress))}%` },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.touchableLink}
                  onPress={() => onContinue(t)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>Continue ›</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 310,
    maxHeight: 360,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  reviewPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  reviewPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  taskRow: {
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 2,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusBadgeProgress: {
    backgroundColor: '#E0F2FE',
  },
  statusBadgeNotStarted: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  touchableLink: {
    paddingVertical: 4,
  },
  linkText: {
    color: '#0284C7',
    fontWeight: '600',
    fontSize: 13,
  },
});
