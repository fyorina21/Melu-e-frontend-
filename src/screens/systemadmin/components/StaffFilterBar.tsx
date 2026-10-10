import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface StaffFilterBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  roleFilterOpen: boolean;
  onToggleRoleFilter: () => void;
  availableRoles: string[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const StaffFilterBar: React.FC<StaffFilterBarProps> = React.memo(
  ({
    search,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    roleFilterOpen,
    onToggleRoleFilter,
    availableRoles,
    statusFilter,
    onStatusFilterChange,
  }) => {
    return (
      <View style={[styles.filtersRow, { zIndex: 100 }]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />

        <View style={styles.filterControlsRow}>
          {/* Role Filter Dropdown */}
          <View style={styles.filterDropdownContainer}>
            <TouchableOpacity
              style={[
                styles.filterDropdownTrigger,
                roleFilter !== 'All' && styles.filterDropdownTriggerActive,
              ]}
              onPress={onToggleRoleFilter}
              accessibilityRole="combobox"
              accessibilityLabel="Filter by role"
            >
              <Feather
                name="shield"
                size={14}
                color={roleFilter !== 'All' ? colors.navyText : colors.mutedText}
              />
              <Text
                style={[
                  styles.filterDropdownTriggerText,
                  roleFilter !== 'All' && styles.filterDropdownTriggerTextActive,
                ]}
              >
                {roleFilter === 'All' ? 'Role: All' : `Role: ${roleFilter}`}
              </Text>
              <Feather
                name={roleFilterOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.navyText}
              />
            </TouchableOpacity>

            {roleFilterOpen && (
              <View style={styles.filterDropdownMenu}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {['All', ...availableRoles].map((r) => {
                    const isSelected = roleFilter === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.filterDropdownItem,
                          isSelected && styles.filterDropdownItemActive,
                        ]}
                        onPress={() => onRoleFilterChange(r)}
                        accessibilityRole="button"
                        accessibilityLabel={`Select role ${r}`}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            isSelected && styles.filterDropdownItemTextActive,
                          ]}
                        >
                          {r === 'All' ? 'All Roles' : r}
                        </Text>
                        {isSelected && <Feather name="check" size={14} color={colors.navyText} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Status Filter Chips */}
          <View style={styles.statusChipsContainer}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['All', 'Active', 'Inactive'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                onPress={() => onStatusFilterChange(s)}
                accessibilityRole="button"
                accessibilityLabel={`Filter status ${s}`}
                accessibilityState={{ selected: statusFilter === s }}
              >
                <Text
                  style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  filtersRow: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    fontSize: 14,
    color: colors.navyText,
  },
  filterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterDropdownContainer: {
    position: 'relative',
    minWidth: 160,
  },
  filterDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
  },
  filterDropdownTriggerActive: {
    borderColor: colors.primaryYellow,
    backgroundColor: '#FEF9C3',
  },
  filterDropdownTriggerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    flex: 1,
  },
  filterDropdownTriggerTextActive: {
    color: colors.navyText,
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 200,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterDropdownItemActive: {
    backgroundColor: '#FEF9C3',
  },
  filterDropdownItemText: {
    fontSize: 12,
    color: colors.bodyText,
  },
  filterDropdownItemTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
  statusChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    marginRight: 4,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
  },
  filterChipTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
  },
});
