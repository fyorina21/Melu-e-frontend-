// src/screens/director/progress/components/DirectorStudentPickerCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StudentAvatar from '../../../../components/StudentAvatar';
import type { StudentOption } from '../../../../api/optionsApi';
import type { DirectorStudentData } from '../directorProgressTypes';

interface DirectorStudentPickerCardProps {
  currentStudent: DirectorStudentData;
  studentOptions: StudentOption[];
  selectedStudentId: string;
  dropdownOpen: boolean;
  searchStudent: string;
  onToggleDropdown: () => void;
  onSearchChange: (text: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const DirectorStudentPickerCard: React.FC<DirectorStudentPickerCardProps> = React.memo(
  ({
    currentStudent,
    studentOptions,
    selectedStudentId,
    dropdownOpen,
    searchStudent,
    onToggleDropdown,
    onSearchChange,
    onSelectStudent,
  }) => {
    const filteredStudents = searchStudent.trim()
      ? studentOptions.filter((s) => s.name.toLowerCase().includes(searchStudent.toLowerCase()))
      : studentOptions;

    const rawPhoto = currentStudent.photoUrl || currentStudent.headshotUrl || currentStudent.photo;

    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={onToggleDropdown}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Select student, currently ${currentStudent.name}`}
        >
          <View style={styles.dropdownLeft}>
            <StudentAvatar
              name={currentStudent.name}
              studentId={currentStudent.studentId || selectedStudentId}
              photoUrl={rawPhoto}
              size={40}
            />
            <View>
              <Text style={styles.selectedStudentName}>{currentStudent.name}</Text>
              <Text style={styles.selectedStudentMeta}>
                Age {currentStudent.age} · {currentStudent.program}
              </Text>
            </View>
          </View>
          <Feather
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.bodyText}
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            <View style={styles.searchBar}>
              <Feather name="search" size={14} color={colors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                placeholderTextColor={colors.mutedText}
                value={searchStudent}
                onChangeText={onSearchChange}
              />
            </View>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {filteredStudents.map((s) => {
                const isSelected = s.id === selectedStudentId;
                const photoUri = (s as any).photoUrl || (s as any).headshotUrl || (s as any).photo;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => onSelectStudent(s.id)}
                  >
                    <StudentAvatar
                      name={s.name}
                      studentId={s.id}
                      photoUrl={photoUri}
                      size={32}
                      style={{ marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                      <Text style={styles.dropdownItemSub}>
                        {s.assessmentStatus ?? s.status} · {s.program || 'ABA Therapy'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        s.status === 'Active' ? styles.statusActive : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          s.status === 'Active'
                            ? styles.statusActiveText
                            : styles.statusPendingText,
                        ]}
                      >
                        {s.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selectedStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  selectedStudentMeta: {
    fontSize: 12,
    color: colors.bodyText,
    marginTop: 2,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
});
