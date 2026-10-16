import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { StudentOption } from '../dailyNotesTypes';

interface DailyNotesFilterBarProps {
  search: string;
  dateFilter: string;
  statusFilter: string;
  studentId?: string;
  studentOptions: StudentOption[];
  openDropdown: 'date' | 'status' | 'student' | null;
  dateOptions: string[];
  statusOptions: string[];
  onSearchChange: (text: string) => void;
  onDateFilterChange: (date: string) => void;
  onStatusFilterChange: (status: string) => void;
  onStudentSelect: (id?: string) => void;
  onToggleDropdown: (dropdown: 'date' | 'status' | 'student' | null) => void;
}

export const DailyNotesFilterBar: React.FC<DailyNotesFilterBarProps> = React.memo(
  ({
    search,
    dateFilter,
    statusFilter,
    studentId,
    studentOptions,
    openDropdown,
    dateOptions,
    statusOptions,
    onSearchChange,
    onDateFilterChange,
    onStatusFilterChange,
    onStudentSelect,
    onToggleDropdown,
  }) => {
    return (
      <View style={[styles.searchFilterCard, { zIndex: openDropdown ? 1000 : 1 }]}>
        {/* Search Input */}
        <View style={styles.searchInputWrapper}>
          <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students, station..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={onSearchChange}
          />
        </View>

        {/* Date Filter Dropdown */}
        <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'date' ? 1001 : 1 }]}>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              openDropdown === 'date' && styles.dropdownTriggerActive,
            ]}
            onPress={() => onToggleDropdown(openDropdown === 'date' ? null : 'date')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by date, currently ${dateFilter}`}
          >
            <Text style={styles.dropdownTriggerText}>{dateFilter}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          {openDropdown === 'date' && (
            <View style={styles.dropdownMenu}>
              {dateOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dropdownOption,
                    dateFilter === opt && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onDateFilterChange(opt);
                    onToggleDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      dateFilter === opt && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Status Filter Dropdown */}
        <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'status' ? 1001 : 1 }]}>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              openDropdown === 'status' && styles.dropdownTriggerActive,
            ]}
            onPress={() => onToggleDropdown(openDropdown === 'status' ? null : 'status')}
            accessibilityRole="button"
            accessibilityLabel={`Filter by status, currently ${statusFilter}`}
          >
            <Text style={styles.dropdownTriggerText}>{statusFilter}</Text>
            <Feather name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          {openDropdown === 'status' && (
            <View style={styles.dropdownMenu}>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dropdownOption,
                    statusFilter === opt && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    onStatusFilterChange(opt);
                    onToggleDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      statusFilter === opt && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Student Selector Dropdown */}
        <View style={[styles.dropdownContainer, { zIndex: openDropdown === 'student' ? 1001 : 1 }]}>
          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              openDropdown === 'student' && styles.dropdownTriggerActive,
            ]}
            onPress={() => onToggleDropdown(openDropdown === 'student' ? null : 'student')}
            accessibilityRole="button"
            accessibilityLabel="Select student"
          >
            <Text style={styles.dropdownTriggerText}>
              {studentOptions.find((o) => o.id === studentId)?.name ?? 'Select Student'}
            </Text>
            <Feather name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>

          {openDropdown === 'student' && (
            <View style={styles.dropdownMenu}>
              {studentOptions.length === 0 ? (
                <Text style={styles.dropdownOptionText}>No students available</Text>
              ) : (
                studentOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.dropdownOption,
                      studentId === opt.id && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onStudentSelect(opt.id);
                      onToggleDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        studentId === opt.id && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {opt.name} ({opt.initial})
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  searchFilterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 2,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  dropdownContainer: {
    position: 'relative',
    minWidth: 130,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownTriggerActive: {
    borderColor: '#0284C7',
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 9999,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '600',
  },
});
