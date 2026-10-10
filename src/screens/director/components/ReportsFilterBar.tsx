import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Option } from '../reportsTypes';

interface ReportsFilterBarProps {
  students: Option[];
  teachers: Option[];
  selectedStudentId: string;
  selectedTeacherId: string;
  selectedStation: string;
  filterDate: string;
  onOpenStudentPicker: () => void;
  onOpenTeacherPicker: () => void;
  onOpenStationPicker: () => void;
  onFilterDateChange: (val: string) => void;
  onResetFilters: () => void;
}

export function ReportsFilterBar({
  students,
  teachers,
  selectedStudentId,
  selectedTeacherId,
  selectedStation,
  filterDate,
  onOpenStudentPicker,
  onOpenTeacherPicker,
  onOpenStationPicker,
  onFilterDateChange,
  onResetFilters,
}: ReportsFilterBarProps) {
  const hasActiveFilters =
    Boolean(selectedStudentId) ||
    Boolean(selectedTeacherId) ||
    Boolean(selectedStation) ||
    Boolean(filterDate);

  const studentName = students.find((s) => s.id === selectedStudentId)?.name || 'Selected Student';
  const teacherName = teachers.find((t) => t.id === selectedTeacherId)?.name || 'Selected Teacher';

  return (
    <View style={styles.filterSection}>
      <View style={styles.filterHeaderRow}>
        <View style={styles.filterHeaderLeft}>
          <Feather name="filter" size={15} color={colors.navyText} />
          <Text style={styles.filterTitle}>Filter Controls</Text>
        </View>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onResetFilters} style={styles.clearFilterBtn}>
            <Feather name="x" size={12} color="#DC2626" />
            <Text style={styles.clearFilterText}>Reset Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterControlsGrid}>
        {/* Student Filter */}
        <TouchableOpacity
          style={[styles.filterSelector, !!selectedStudentId && styles.filterSelectorActive]}
          onPress={onOpenStudentPicker}
          accessibilityRole="combobox"
          accessibilityLabel="Filter by student"
        >
          <Feather
            name="user"
            size={13}
            color={selectedStudentId ? colors.navyText : colors.mutedText}
          />
          <Text
            style={[
              styles.filterSelectorText,
              !!selectedStudentId && styles.filterSelectorTextActive,
            ]}
            numberOfLines={1}
          >
            {selectedStudentId ? studentName : 'All Students'}
          </Text>
          <Feather name="chevron-down" size={13} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Teacher Filter */}
        <TouchableOpacity
          style={[styles.filterSelector, !!selectedTeacherId && styles.filterSelectorActive]}
          onPress={onOpenTeacherPicker}
          accessibilityRole="combobox"
          accessibilityLabel="Filter by therapist"
        >
          <Feather
            name="users"
            size={13}
            color={selectedTeacherId ? colors.navyText : colors.mutedText}
          />
          <Text
            style={[
              styles.filterSelectorText,
              !!selectedTeacherId && styles.filterSelectorTextActive,
            ]}
            numberOfLines={1}
          >
            {selectedTeacherId ? teacherName : 'All Teachers'}
          </Text>
          <Feather name="chevron-down" size={13} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Station Filter */}
        <TouchableOpacity
          style={[styles.filterSelector, !!selectedStation && styles.filterSelectorActive]}
          onPress={onOpenStationPicker}
          accessibilityRole="combobox"
          accessibilityLabel="Filter by station"
        >
          <Feather
            name="map-pin"
            size={13}
            color={selectedStation ? colors.navyText : colors.mutedText}
          />
          <Text
            style={[
              styles.filterSelectorText,
              !!selectedStation && styles.filterSelectorTextActive,
            ]}
            numberOfLines={1}
          >
            {selectedStation || 'All Stations'}
          </Text>
          <Feather name="chevron-down" size={13} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Date Filter */}
        <View style={[styles.filterDateInputWrap, !!filterDate && styles.filterSelectorActive]}>
          <Feather
            name="calendar"
            size={13}
            color={filterDate ? colors.navyText : colors.mutedText}
          />
          <TextInput
            style={styles.filterDateInput}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor={colors.mutedText}
            value={filterDate}
            onChangeText={onFilterDateChange}
          />
          {!!filterDate && (
            <TouchableOpacity onPress={() => onFilterDateChange('')}>
              <Feather name="x" size={12} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: '#FEE2E2',
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  filterControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterSelector: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  filterSelectorActive: {
    borderColor: colors.navyText,
    backgroundColor: '#FEF9C3',
  },
  filterSelectorText: {
    fontSize: 12,
    color: colors.mutedText,
    flex: 1,
  },
  filterSelectorTextActive: {
    color: colors.navyText,
    fontWeight: '600',
  },
  filterDateInputWrap: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  filterDateInput: {
    flex: 1,
    fontSize: 12,
    color: colors.navyText,
    paddingVertical: 4,
  },
});
