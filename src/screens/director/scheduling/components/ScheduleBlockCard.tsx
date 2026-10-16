import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type ScheduleBlock, type Option, isBlockOverCapacity } from '../types';

interface ScheduleBlockCardProps {
  block: ScheduleBlock;
  capacity: number;
  students: Option[];
  onEdit: (block: ScheduleBlock) => void;
  onRemoveAll: (block: ScheduleBlock) => void;
}

export const ScheduleBlockCard: React.FC<ScheduleBlockCardProps> = React.memo(
  ({ block, capacity, students, onEdit, onRemoveAll }) => {
    const count = block.studentIds.length;
    const overCapacity = isBlockOverCapacity(block, capacity);

    return (
      <View style={styles.blockCard}>
        <View style={styles.blockHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stationTitle}>{block.stationName}</Text>
            <View style={styles.timeTagRow}>
              <Feather name="clock" size={12} color={colors.bodyText} />
              <Text style={styles.timeTagText}>
                {block.startTime} – {block.endTime}
              </Text>
            </View>
          </View>
          <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
            <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>
              {count}/{capacity} Students
            </Text>
          </View>
        </View>

        {/* Assigned Students */}
        <View style={styles.studentsWrap}>
          <Text style={styles.studentsWrapLabel}>Assigned Students:</Text>
          {count > 0 ? (
            <View style={styles.chipsRow}>
              {block.studentIds.map((id) => {
                const studentName = students.find((s) => s.id === id)?.name ?? id;
                return (
                  <View key={id} style={styles.studentChipBadge}>
                    <Feather name="user" size={11} color={colors.navyText} />
                    <Text style={styles.studentChipBadgeText}>{studentName}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noStudentsText}>No students assigned to this block yet.</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.blockActionsRow}>
          <TouchableOpacity
            style={styles.editAssignmentBtn}
            onPress={() => onEdit(block)}
            accessibilityRole="button"
            accessibilityLabel={
              count > 0
                ? `Edit assigned students for ${block.stationName}`
                : `Assign students to ${block.stationName}`
            }
          >
            <Feather name="user-plus" size={14} color={colors.navyText} />
            <Text style={styles.editAssignmentBtnText}>
              {count > 0 ? 'Edit Assigned Students' : 'Assign Students'}
            </Text>
          </TouchableOpacity>
          {count > 0 && (
            <TouchableOpacity
              style={styles.removeAllBtn}
              onPress={() => onRemoveAll(block)}
              accessibilityRole="button"
              accessibilityLabel={`Remove all students from ${block.stationName}`}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
              <Text style={styles.removeAllBtnText}>Remove All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  blockCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  timeTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  timeTagText: { fontSize: 12, color: colors.bodyText },
  capacityBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: colors.primaryYellow,
  },
  capacityBadgeOver: { backgroundColor: '#EF4444', borderColor: '#DC2626' },
  capacityText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  studentsWrap: { gap: spacing.xs },
  studentsWrapLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  studentChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  studentChipBadgeText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  noStudentsText: { fontSize: 12, color: colors.mutedText, fontStyle: 'italic' },
  blockActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  editAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  editAssignmentBtnText: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  removeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeAllBtnText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
});
