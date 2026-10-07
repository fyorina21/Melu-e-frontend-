import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '../../../../theme/colors';
import type { GoalDomain } from '../types';

interface GoalDomainsTableProps {
  domains: GoalDomain[];
  editingDomainId: string | null;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleEdit: (id: string) => void;
  onUpdateField: (id: string, field: 'name' | 'description', val: string) => void;
  onDelete: (id: string) => void;
}

export const GoalDomainsTable: React.FC<GoalDomainsTableProps> = React.memo(
  ({ domains, editingDomainId, onMoveUp, onMoveDown, onToggleEdit, onUpdateField, onDelete }) => {
    return (
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { width: 50, textAlign: 'center' }]}>ORDER</Text>
          <Text style={[styles.th, { flex: 2.5 }]}>DOMAIN NAME</Text>
          <Text style={[styles.th, { flex: 4 }]}>DESCRIPTION</Text>
          <Text style={[styles.th, { width: 75, textAlign: 'center' }]}>STATUS</Text>
          <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {domains.map((item, index) => {
          const isEditing = editingDomainId === item.id;
          return (
            <View key={item.id} style={styles.tableRow}>
              {/* Order Controls */}
              <View style={styles.orderCol}>
                <TouchableOpacity
                  onPress={() => onMoveUp(index)}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Move domain ${item.name} up`}
                >
                  <Feather
                    name="chevron-up"
                    size={15}
                    color={index === 0 ? '#CBD5E1' : colors.navyText}
                  />
                </TouchableOpacity>
                <Text style={styles.orderNumberText}>{index + 1}</Text>
                <TouchableOpacity
                  onPress={() => onMoveDown(index)}
                  disabled={index === domains.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel={`Move domain ${item.name} down`}
                >
                  <Feather
                    name="chevron-down"
                    size={15}
                    color={index === domains.length - 1 ? '#CBD5E1' : colors.navyText}
                  />
                </TouchableOpacity>
              </View>

              {/* Name */}
              <View style={{ flex: 2.5, paddingRight: 10 }}>
                {isEditing ? (
                  <TextInput
                    style={styles.inlineInput}
                    value={item.name}
                    onChangeText={(v) => onUpdateField(item.id, 'name', v)}
                  />
                ) : (
                  <Text style={styles.domainNameText}>{item.name}</Text>
                )}
              </View>

              {/* Description */}
              <View style={{ flex: 4, paddingRight: 10 }}>
                {isEditing ? (
                  <TextInput
                    style={styles.inlineInput}
                    value={item.description}
                    onChangeText={(v) => onUpdateField(item.id, 'description', v)}
                  />
                ) : (
                  <Text style={styles.domainDescText}>{item.description}</Text>
                )}
              </View>

              {/* Status Pill */}
              <View style={{ width: 75, alignItems: 'center' }}>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Active</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  onPress={() => onToggleEdit(item.id)}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={isEditing ? 'Save domain inline' : 'Edit domain inline'}
                >
                  <Feather
                    name={isEditing ? 'check' : 'edit-2'}
                    size={15}
                    color={isEditing ? colors.successGreen : colors.navyText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDelete(item.id)}
                  style={{ padding: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete domain ${item.name}`}
                >
                  <Feather name="trash-2" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
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
    backgroundColor: colors.bgApp,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  orderCol: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  domainNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  domainDescText: {
    fontSize: 13,
    color: colors.bodyText,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: colors.navyText,
    backgroundColor: colors.bgCard,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  actionsCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
