import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type ExtendedGoal } from '../types';

interface GoalPreviewModalProps {
  goal: ExtendedGoal | null;
  onClose: () => void;
}

export const GoalPreviewModal: React.FC<GoalPreviewModalProps> = React.memo(({ goal, onClose }) => {
  return (
    <Modal visible={goal !== null} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.previewTitleWrap}>
              <Text style={styles.previewTitle} numberOfLines={2}>
                {goal?.name}
              </Text>
              <View
                style={[
                  styles.badge,
                  goal?.status === 'active' ? styles.badgeActive : styles.badgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    goal?.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive,
                  ]}
                >
                  {goal?.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.formFields}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewGrid}>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Domain</Text>
                <Text style={styles.previewValue}>{goal?.domain || '—'}</Text>
              </View>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Usage</Text>
                <Text style={styles.previewValue}>
                  {goal ? `${goal.usageCount} session${goal.usageCount === 1 ? '' : 's'}` : '—'}
                </Text>
              </View>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Age Range</Text>
                <Text style={styles.previewValue}>—</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.previewBody}>{goal?.description || '—'}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mastery Criteria</Text>
              <View style={styles.masteryBox}>
                <Feather name="activity" size={14} color="#0369A1" />
                <Text style={styles.masteryText}>
                  {goal?.masteryCriteria?.trim() ? goal.masteryCriteria : '—'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewTitleWrap: {
    flex: 1,
    gap: 6,
    paddingRight: spacing.sm,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#16A34A',
  },
  badgeTextInactive: {
    color: '#64748B',
  },
  formFields: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  previewGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewGridCell: {
    flex: 1,
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  previewBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.bodyText,
  },
  masteryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  masteryText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewCloseBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
});
