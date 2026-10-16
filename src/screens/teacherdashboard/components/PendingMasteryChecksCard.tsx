import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { MasteryCheck } from '../teacherDashboardTypes';

interface PendingMasteryChecksCardProps {
  checks: MasteryCheck[];
  onReview: (check: MasteryCheck) => void;
}

export const PendingMasteryChecksCard: React.FC<PendingMasteryChecksCardProps> = React.memo(
  ({ checks, onReview }) => {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Feather name="award" size={18} color="#8B5CF6" />
            <Text style={typography.h3}>Pending Mastery Checks</Text>
          </View>
          <View style={styles.readyPill}>
            <Text style={styles.readyPillText}>{checks.length} Ready</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {checks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending mastery checks.</Text>
            </View>
          ) : (
            checks.map((m) => (
              <View key={m.id} style={styles.masteryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={typography.bodyBold}>{m.goalName}</Text>
                  <Text style={typography.caption}>• {m.studentName}</Text>
                  <View
                    style={[
                      styles.pendingTag,
                      m.pendingLabel.includes('Director') && styles.pendingTagDirector,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pendingTagText,
                        m.pendingLabel.includes('Director') && { color: '#8B5CF6' },
                      ]}
                    >
                      {m.pendingLabel}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => onReview(m)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Review mastery check for ${m.studentName}`}
                >
                  <Text style={styles.reviewBtnText}>Review</Text>
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
  readyPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  readyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9333EA',
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pendingTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  pendingTagDirector: {
    backgroundColor: '#F3E8FF',
  },
  pendingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  reviewBtn: {
    backgroundColor: '#334155',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  reviewBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
});
