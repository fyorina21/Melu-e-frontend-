import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { StudentListItem } from '../studentProgressTypes';

interface StudentProfileCardProps {
  selectedStudent: StudentListItem;
  flagged: boolean;
  onToggleFlag: () => void;
  onPrintReport: () => void;
}

export function StudentProfileCard({
  selectedStudent,
  flagged,
  onToggleFlag,
  onPrintReport,
}: StudentProfileCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        <View style={styles.profileLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{selectedStudent.fullName.charAt(0)}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.studentName}>{selectedStudent.fullName}</Text>
            <View style={styles.chipRow}>
              <View style={styles.grayChip}>
                <Text style={styles.grayChipText}>Age {selectedStudent.age}</Text>
              </View>
              <View style={styles.skyChip}>
                <Text style={styles.skyChipText}>{selectedStudent.programType}</Text>
              </View>
              <View style={styles.amberChip}>
                <Text style={styles.amberChipText}>{selectedStudent.therapyGroup} group</Text>
              </View>
              {selectedStudent.status && (
                <View style={styles.grayChip}>
                  <Text style={styles.grayChipText}>{selectedStudent.status}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.profileActions}>
        <TouchableOpacity
          style={[styles.actionButton, flagged ? styles.flaggedButton : styles.outlineButton]}
          onPress={onToggleFlag}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={flagged ? 'Student is flagged' : 'Flag student'}
        >
          <Feather name="flag" size={16} color={flagged ? '#DC2626' : '#4B5563'} />
          <Text style={[styles.actionButtonText, { color: flagged ? '#DC2626' : '#4B5563' }]}>
            {flagged ? 'Flagged' : 'Flag Student'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.outlineButton]}
          activeOpacity={0.8}
          onPress={onPrintReport}
          accessibilityRole="button"
          accessibilityLabel="Print student progress report"
        >
          <Feather name="printer" size={16} color="#4B5563" />
          <Text style={[styles.actionButtonText, { color: '#4B5563' }]}>Print Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyText,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  grayChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  grayChipText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '500',
  },
  skyChip: {
    backgroundColor: '#E0F2FE',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  skyChipText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  amberChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  amberChipText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  flaggedButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
