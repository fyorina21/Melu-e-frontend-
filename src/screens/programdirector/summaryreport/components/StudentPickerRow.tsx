// src/screens/programdirector/summaryreport/components/StudentPickerRow.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import StudentAvatar from '../../../../components/StudentAvatar';
import type { StudentOption } from '../summaryReportTypes';

interface StudentPickerRowProps {
  students: StudentOption[];
  selectedStudentId: string;
  selectedStudentObj?: StudentOption;
  dropdownOpen: boolean;
  searchQuery: string;
  rawPhoto?: string;
  onToggleDropdown: () => void;
  onSearchChange: (query: string) => void;
  onSelectStudent: (studentId: string) => void;
}

export const StudentPickerRow: React.FC<StudentPickerRowProps> = React.memo(
  ({
    students,
    selectedStudentId,
    selectedStudentObj,
    dropdownOpen,
    searchQuery,
    rawPhoto,
    onToggleDropdown,
    onSearchChange,
    onSelectStudent,
  }) => {
    const filteredStudents = students.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <View style={[styles.selectRow, { zIndex: 10 }]}>
        <Text style={styles.selectLabel}>Select Student</Text>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={onToggleDropdown}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Select student, currently ${selectedStudentObj?.name || 'none'}`}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {selectedStudentObj ? (
                  <StudentAvatar
                    name={selectedStudentObj.name}
                    studentId={selectedStudentObj.id}
                    photoUrl={
                      selectedStudentObj.photoUrl ||
                      selectedStudentObj.headshotUrl ||
                      selectedStudentObj.photo ||
                      rawPhoto
                    }
                    size={28}
                  />
                ) : null}
                <Text style={styles.dropdownToggleText}>
                  {selectedStudentObj?.name || 'Select a Student'}
                </Text>
              </View>
              <Feather
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.mutedText}
              />
            </View>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                placeholderTextColor={colors.mutedText}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
              <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                {filteredStudents.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => onSelectStudent(s.id)}
                    style={[
                      styles.dropdownItem,
                      selectedStudentId === s.id && styles.dropdownItemActive,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <StudentAvatar
                        name={s.name}
                        studentId={s.id}
                        photoUrl={s.photoUrl || s.headshotUrl || s.photo}
                        size={32}
                      />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedStudentId === s.id && styles.dropdownItemTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredStudents.length === 0 && (
                  <Text style={styles.noStudentsText}>No students found.</Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  selectRow: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    textTransform: 'uppercase',
  },
  dropdownToggle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.bgApp,
  },
  dropdownToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xs,
    zIndex: 999,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.navyText,
    marginBottom: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  dropdownItemActive: {
    backgroundColor: '#E0F2FE',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },
  noStudentsText: {
    padding: 12,
    color: colors.mutedText,
    textAlign: 'center',
    fontSize: 13,
  },
});
