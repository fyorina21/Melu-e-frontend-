// src/screens/coordinator/components/StudentSelectorCard.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { StudentListItem } from '../studentProgressTypes';

interface StudentSelectorCardProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  selectedStudent: StudentListItem | null;
  filteredStudents: StudentListItem[];
  onSelectStudent: (student: StudentListItem) => void;
}

export default function StudentSelectorCard({
  searchQuery,
  onSearchQueryChange,
  showDropdown,
  onToggleDropdown,
  selectedStudent,
  filteredStudents,
  onSelectStudent,
}: StudentSelectorCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
      <View style={styles.searchRow}>
        <Feather name="search" size={16} color="#9CA3AF" />
        <TextInput
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          style={styles.searchInput}
          accessibilityLabel="Search students"
        />
        {selectedStudent && (
          <View style={styles.selectedChip}>
            <Text style={styles.selectedChipText}>{selectedStudent.fullName}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onToggleDropdown}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Toggle student list dropdown"
        >
          <Feather name={showDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled>
            {filteredStudents.length === 0 ? (
              <Text style={styles.emptyDropdownText}>No students found</Text>
            ) : (
              filteredStudents.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.dropdownItem,
                    selectedStudent?.id === s.id && styles.dropdownItemActive,
                  ]}
                  onPress={() => onSelectStudent(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select student ${s.fullName}`}
                >
                  <Text
                    style={[
                      styles.dropdownItemName,
                      selectedStudent?.id === s.id && { color: colors.navyText },
                    ]}
                  >
                    {s.fullName}
                  </Text>
                  <Text style={styles.dropdownItemStation}>{s.programType}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.bodyText,
    padding: 0,
  },
  selectedChip: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdown: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  dropdownItemStation: {
    fontSize: 11,
    color: colors.mutedText,
  },
  emptyDropdownText: {
    padding: spacing.md,
    textAlign: 'center',
    fontSize: 13,
    color: colors.mutedText,
  },
});
