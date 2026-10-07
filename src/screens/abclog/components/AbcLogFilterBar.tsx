import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface AbcLogFilterBarProps {
  from: string;
  to: string;
  behaviorFilter: string;
  categoryFilter: string;
  behaviorOptions: string[];
  categoryOptions: string[];
  behaviorMenuOpen: boolean;
  categoryMenuOpen: boolean;
  exportMenuOpen: boolean;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onToggleBehaviorMenu: () => void;
  onToggleCategoryMenu: () => void;
  onToggleExportMenu: () => void;
  onSelectBehavior: (val: string) => void;
  onSelectCategory: (val: string) => void;
  onExport: (type: 'csv' | 'pdf') => void;
}

export const AbcLogFilterBar: React.FC<AbcLogFilterBarProps> = React.memo(
  ({
    from,
    to,
    behaviorFilter,
    categoryFilter,
    behaviorOptions,
    categoryOptions,
    behaviorMenuOpen,
    categoryMenuOpen,
    exportMenuOpen,
    onFromChange,
    onToChange,
    onToggleBehaviorMenu,
    onToggleCategoryMenu,
    onToggleExportMenu,
    onSelectBehavior,
    onSelectCategory,
    onExport,
  }) => {
    return (
      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>From</Text>
            <TextInput
              style={styles.filterInput}
              value={from}
              onChangeText={onFromChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>To</Text>
            <TextInput
              style={styles.filterInput}
              value={to}
              onChangeText={onToChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>Behavior</Text>
            <View>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={onToggleBehaviorMenu}
                accessibilityRole="button"
                accessibilityLabel="Filter by behavior"
              >
                <Text style={styles.selectBtnText}>{behaviorFilter}</Text>
                <Feather name="chevron-down" size={12} color="#64748B" />
              </TouchableOpacity>
              {behaviorMenuOpen && (
                <View style={styles.selectMenu}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {behaviorOptions.map((b) => (
                      <TouchableOpacity
                        key={b}
                        style={styles.dropdownItem}
                        onPress={() => onSelectBehavior(b)}
                      >
                        <Text style={styles.dropdownItemText}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>Category</Text>
            <View>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={onToggleCategoryMenu}
                accessibilityRole="button"
                accessibilityLabel="Filter by category"
              >
                <Text style={styles.selectBtnText}>{categoryFilter}</Text>
                <Feather name="chevron-down" size={12} color="#64748B" />
              </TouchableOpacity>
              {categoryMenuOpen && (
                <View style={styles.selectMenu}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {categoryOptions.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.dropdownItem}
                        onPress={() => onSelectCategory(c)}
                      >
                        <Text style={styles.dropdownItemText}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Export Menu */}
          <View style={styles.exportWrap}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={onToggleExportMenu}
              accessibilityRole="button"
              accessibilityLabel="Export options"
            >
              <Text style={styles.exportBtnText}>Export</Text>
              <Feather name="chevron-down" size={14} color="#1E293B" />
            </TouchableOpacity>
            {exportMenuOpen && (
              <View style={styles.exportMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => onExport('csv')}
                  accessibilityRole="button"
                  accessibilityLabel="Export CSV"
                >
                  <Text style={styles.dropdownItemText}>Export CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => onExport('pdf')}
                  accessibilityRole="button"
                  accessibilityLabel="Export PDF"
                >
                  <Text style={styles.dropdownItemText}>Export PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  filterCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  filterField: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.navyText,
    minWidth: 120,
    backgroundColor: colors.white,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.white,
    minWidth: 140,
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: 13,
    color: colors.navyText,
  },
  selectMenu: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 170,
    zIndex: 1000,
    elevation: 5,
  },
  exportWrap: {
    position: 'relative',
    marginLeft: 'auto',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  exportMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minWidth: 150,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
  },
});
