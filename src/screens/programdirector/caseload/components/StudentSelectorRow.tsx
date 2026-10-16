import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import StudentAvatar from '../../../../components/StudentAvatar';
import type { StudentOption } from '../../../../api/optionsApi';

interface StudentSelectorRowProps {
  students: StudentOption[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
}

export const StudentSelectorRow: React.FC<StudentSelectorRowProps> = React.memo(
  ({ students, selectedStudentId, onSelectStudent }) => {
    const list =
      students.length > 0 ? students : [{ id: 's1', name: 'Student A', studentId: 's1' }];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorRow}
      >
        {list.map((s) => {
          const isSelected = selectedStudentId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.studentChip, isSelected && styles.studentChipActive]}
              onPress={() => onSelectStudent(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select student ${s.name}`}
            >
              <StudentAvatar
                name={s.name}
                studentId={s.id}
                photoUrl={(s as any)?.photoUrl || (s as any)?.headshotUrl || (s as any)?.photo}
                size={26}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.studentChipText, isSelected && styles.studentChipTextActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  studentChipText: {
    ...typography.bodyBold,
    color: colors.bodyText,
  },
  studentChipTextActive: {
    color: colors.navyText,
  },
});
