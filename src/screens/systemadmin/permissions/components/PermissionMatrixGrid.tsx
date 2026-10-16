import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import {
  ACTIONS,
  type ActionType,
  type CatalogModule,
  type PermissionMatrix,
} from '../permissionTypes';

interface PermissionMatrixGridProps {
  modules: CatalogModule[];
  matrix: PermissionMatrix;
  onToggleCell: (moduleName: string, action: ActionType) => void;
  onToggleRow: (moduleName: string) => void;
  onToggleColumn: (action: ActionType) => void;
}

export const PermissionMatrixGrid: React.FC<PermissionMatrixGridProps> = React.memo(
  ({ modules, matrix, onToggleCell, onToggleRow, onToggleColumn }) => {
    return (
      <View style={styles.tableCard}>
        {/* Header Row */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.columnHeader, { flex: 2.2 }]}>MODULE</Text>
          {ACTIONS.map((act) => (
            <TouchableOpacity
              key={act}
              style={[styles.columnHeaderCell, { flex: 1 }]}
              onPress={() => onToggleColumn(act)}
              accessibilityRole="button"
              accessibilityLabel={`Toggle all ${act} permissions`}
            >
              <Text style={styles.columnHeader}>{act}</Text>
              <Feather name="check-square" size={12} color="#0284C7" />
            </TouchableOpacity>
          ))}
          <Text style={[styles.columnHeader, { flex: 0.8, textAlign: 'center' }]}>ALL</Text>
        </View>

        {/* Module Rows */}
        {modules.map((mod) => {
          const isRowAllChecked = ACTIONS.every((a) => matrix[mod.name]?.[a]);

          return (
            <View key={mod.id || mod.name} style={styles.tableRow}>
              <View style={{ flex: 2.2 }}>
                <Text style={typography.bodyBold}>{mod.name}</Text>
                {mod.description ? (
                  <Text style={[typography.caption, { color: colors.mutedText }]} numberOfLines={1}>
                    {mod.description}
                  </Text>
                ) : null}
              </View>

              {ACTIONS.map((act) => {
                const checked = !!matrix[mod.name]?.[act];
                return (
                  <TouchableOpacity
                    key={act}
                    style={styles.cellBtn}
                    onPress={() => onToggleCell(mod.name, act)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`Toggle ${act} on ${mod.name}`}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Feather name="check" size={12} color={colors.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.cellBtn}
                onPress={() => onToggleRow(mod.name)}
                accessibilityRole="button"
                accessibilityLabel={`Toggle all permissions for ${mod.name}`}
              >
                <View style={[styles.checkbox, isRowAllChecked && styles.checkboxCheckedRowAll]}>
                  {isRowAllChecked && <Feather name="check" size={12} color={colors.navyText} />}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
    letterSpacing: 0.5,
  },
  columnHeaderCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cellBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkboxCheckedRowAll: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
});
