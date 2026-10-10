import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../components/StudentAvatar';
import { colors, radius, spacing } from '../../../theme/colors';
import type { StudentOption } from '../../../api/optionsApi';

interface AbcLogHeaderProps {
  currentStudent?: StudentOption;
  studentOptions: StudentOption[];
  studentId: string;
  studentMenuOpen: boolean;
  onToggleStudentMenu: () => void;
  onSelectStudent: (id: string) => void;
}

export const AbcLogHeader: React.FC<AbcLogHeaderProps> = React.memo(
  ({
    currentStudent,
    studentOptions,
    studentId,
    studentMenuOpen,
    onToggleStudentMenu,
    onSelectStudent,
  }) => {
    return (
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.studentBlock}>
            <StudentAvatar
              name={currentStudent?.name}
              studentId={currentStudent?.id}
              photoUrl={
                (currentStudent as any)?.photoUrl ||
                (currentStudent as any)?.headshotUrl ||
                (currentStudent as any)?.photo
              }
              size={44}
              style={{ marginRight: 10 }}
            />
            <View>
              <View style={styles.studentSelector}>
                <TouchableOpacity
                  style={styles.studentDropdown}
                  onPress={onToggleStudentMenu}
                  accessibilityRole="button"
                  accessibilityLabel="Select student"
                >
                  <Text style={styles.studentName}>{currentStudent?.name ?? 'Select student'}</Text>
                  <Feather name="chevron-down" size={14} color="#64748B" />
                </TouchableOpacity>
                <Text style={styles.ageText}>Age {currentStudent?.age ?? '—'}</Text>
              </View>
              <Text style={styles.sheetLabel}>ABC Data Sheet</Text>
            </View>

            {studentMenuOpen && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 220 }}>
                  {studentOptions.map((s) => {
                    const isSelected = s.id === studentId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                        onPress={() => onSelectStudent(s.id)}
                      >
                        <StudentAvatar
                          name={s.name}
                          studentId={s.id}
                          photoUrl={
                            (s as any)?.photoUrl || (s as any)?.headshotUrl || (s as any)?.photo
                          }
                          size={26}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>SCR-003A</Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    position: 'relative',
    zIndex: 100,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#94A3B8',
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  studentDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  ageText: {
    fontSize: 13,
    color: '#64748B',
  },
  sheetLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 56,
    left: 64,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 180,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dropdownItemSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: '#0369A1',
  },
});
