import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../theme/colors';
import Tooltip from '../../../components/Tooltip';

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
      <View style={[styles.filtersRow, { zIndex: roleFilterOpen ? 1000 : 10 }]}>
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
          accessibilityLabel="Search staff by name or email"
        />

        <View style={[styles.filterControlsRow, { zIndex: roleFilterOpen ? 1000 : 1 }]}>
          {/* Role Filter Dropdown */}
          <View style={[styles.filterDropdownContainer, { zIndex: roleFilterOpen ? 1001 : 1 }]}>
            <Tooltip label="Click to filter staff accounts by role">
              <TouchableOpacity
                style={[
                  styles.filterDropdownTrigger,
                  roleFilter !== 'All' && styles.filterDropdownTriggerActive,
                ]}
                onPress={onToggleRoleFilter}
                accessibilityRole="combobox"
                accessibilityLabel="Filter by role"
                {...(Platform.OS === 'web'
                  ? { title: 'Click to filter staff accounts by role' }
                  : {})}
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
            </Tooltip>

            {roleFilterOpen && (
              <View style={styles.filterDropdownMenu}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {['All', ...availableRoles].map((r) => {
                    const isSelected = roleFilter === r;
                    const itemLabel = r === 'All' ? 'All Roles' : r;
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
                        {...(Platform.OS === 'web'
                          ? { title: `Filter staff list by role: ${itemLabel}` }
                          : {})}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            isSelected && styles.filterDropdownItemTextActive,
                          ]}
                        >
                          {itemLabel}
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
          <View style={[styles.statusChipsContainer, { zIndex: 1 }]}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['All', 'Active', 'Inactive'].map((s) => (
              <Tooltip
                key={s}
                label={`Filter staff accounts by ${s.toLowerCase()} status`}
                placement="bottom"
              >
                <TouchableOpacity
                  style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
                  onPress={() => onStatusFilterChange(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter status ${s}`}
                  accessibilityState={{ selected: statusFilter === s }}
                  {...(Platform.OS === 'web'
                    ? { title: `Filter staff accounts by ${s.toLowerCase()} status` }
                    : {})}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      statusFilter === s && styles.filterChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              </Tooltip>
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
    position: 'relative',
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
    position: 'relative',
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
    minWidth: 220,
    marginTop: 4,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(4, 14, 0.18, '0, 0, 0', 10),
    zIndex: 1002,
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
    position: 'relative',
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
