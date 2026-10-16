import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import { DARK, AMBER } from '../types';

interface SummaryFilterBarProps {
  search: string;
  studentFilter: string;
  teacherFilter: string;
  statusFilter: string;
  students: string[];
  teachers: string[];
  selectedCount: number;
  allFilteredSelected: boolean;
  onSearchChange: (text: string) => void;
  onStudentFilterChange: (val: string) => void;
  onTeacherFilterChange: (val: string) => void;
  onStatusFilterChange: (val: string) => void;
  onToggleSelectAll: () => void;
  onBulkApprovePress: () => void;
}

function FilterChipRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterRow}>
        {options.map((opt) => {
          const isActive = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onChange(opt)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export const SummaryFilterBar: React.FC<SummaryFilterBarProps> = React.memo(
  ({
    search,
    studentFilter,
    teacherFilter,
    statusFilter,
    students,
    teachers,
    selectedCount,
    allFilteredSelected,
    onSearchChange,
    onStudentFilterChange,
    onTeacherFilterChange,
    onStatusFilterChange,
    onToggleSelectAll,
    onBulkApprovePress,
  }) => {
    return (
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search teacher or student..."
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Filter Rows */}
        <FilterChipRow
          label="Student"
          value={studentFilter}
          options={['all', ...students]}
          onChange={onStudentFilterChange}
        />
        <FilterChipRow
          label="Teacher"
          value={teacherFilter}
          options={['all', ...teachers]}
          onChange={onTeacherFilterChange}
        />
        <FilterChipRow
          label="Status"
          value={statusFilter}
          options={['all', 'pending', 'revision-required', 'approved']}
          onChange={onStatusFilterChange}
        />

        {/* Bulk Action Controls */}
        <View style={styles.bulkRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={onToggleSelectAll}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allFilteredSelected }}
          >
            <View style={[styles.checkboxBox, allFilteredSelected && styles.checkboxChecked]}>
              {allFilteredSelected && <Feather name="check-circle" size={14} color={DARK} />}
            </View>
            <Text style={styles.bulkLabel}>
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkApproveBtn, selectedCount === 0 && { opacity: 0.3 }]}
            disabled={selectedCount === 0}
            onPress={onBulkApprovePress}
            accessibilityRole="button"
            accessibilityLabel={`Bulk approve ${selectedCount} items`}
          >
            <Text style={styles.bulkApproveText}>Bulk Approve ({selectedCount})</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterSection: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: 'rgba(252,211,77,0.25)',
    borderColor: AMBER,
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: DARK,
    fontWeight: '700',
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: AMBER,
    borderColor: AMBER,
  },
  bulkLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  bulkApproveBtn: {
    backgroundColor: AMBER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  bulkApproveText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '700',
  },
});
