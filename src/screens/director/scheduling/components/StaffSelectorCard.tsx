import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type Option } from '../types';

interface StaffSelectorCardProps {
  selectedTeacher: Option | null;
  teacherId: string;
  dropdownOpen: boolean;
  onToggleDropdown: () => void;
  searchTeacher: string;
  onSearchTeacherChange: (val: string) => void;
  filteredTeachers: Option[];
  onSelectTeacher: (id: string) => void;
}

export const StaffSelectorCard: React.FC<StaffSelectorCardProps> = React.memo(
  ({
    selectedTeacher,
    teacherId,
    dropdownOpen,
    onToggleDropdown,
    searchTeacher,
    onSearchTeacherChange,
    filteredTeachers,
    onSelectTeacher,
  }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>SELECT THERAPIST / STAFF MEMBER</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={onToggleDropdown}
          activeOpacity={0.8}
          accessibilityRole="combobox"
          accessibilityLabel="Select staff member"
          accessibilityState={{ expanded: dropdownOpen }}
        >
          <View style={styles.dropdownLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(selectedTeacher?.name || 'T').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.selectedTeacherName}>
                {selectedTeacher ? selectedTeacher.name : 'Choose a therapist...'}
              </Text>
              <Text style={styles.selectedTeacherMeta}>Therapist / Special Educator</Text>
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
                placeholder="Search staff..."
                placeholderTextColor={colors.mutedText}
                value={searchTeacher}
                onChangeText={onSearchTeacherChange}
              />
            </View>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredTeachers.map((t) => {
                const isSelected = t.id === teacherId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => onSelectTeacher(t.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${t.name}`}
                  >
                    <Text
                      style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}
                    >
                      {t.name}
                    </Text>
                    {isSelected && <Feather name="check" size={14} color={colors.navyText} />}
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
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  selectedTeacherName: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  selectedTeacherMeta: { fontSize: 12, color: colors.mutedText, marginTop: 1 },
  dropdownMenu: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.navyText, height: '100%' },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: { backgroundColor: '#FEF9C3' },
  dropdownItemText: { fontSize: 13, color: colors.navyText },
  dropdownItemTextActive: { fontWeight: '700' },
});
