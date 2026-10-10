import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { FormField } from '../../../types';

interface FormFieldCardProps {
  field: FormField;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleRequired: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onEdit: (field: FormField) => void;
  onDelete: (id: string) => void;
}

export default function FormFieldCard({
  field,
  onMoveUp,
  onMoveDown,
  onToggleRequired,
  onToggleVisible,
  onEdit,
  onDelete,
}: FormFieldCardProps) {
  return (
    <View style={[styles.fieldRow, !field.visible && styles.fieldRowHidden]}>
      <View style={styles.rowLeftMain}>
        <View style={styles.idBadge}>
          <Text style={styles.idBadgeText}>{field.id}</Text>
        </View>

        <View style={styles.labelWrapper}>
          <Text style={styles.fieldLabelText}>
            {field.label} {field.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          {field.level ? (
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>{field.level}</Text>
            </View>
          ) : null}
        </View>

        {field.options && field.options.length > 0 && (
          <Text style={styles.fieldOptionsText} numberOfLines={1}>
            Options: {field.options.join(', ')}
          </Text>
        )}
      </View>

      <View style={styles.rowRightControls}>
        <TouchableOpacity
          onPress={() => onMoveUp(field.id)}
          style={styles.iconBtn}
          accessibilityLabel="Move Up"
        >
          <Feather name="arrow-up" size={15} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onMoveDown(field.id)}
          style={styles.iconBtn}
          accessibilityLabel="Move Down"
        >
          <Feather name="arrow-down" size={15} color="#475569" />
        </TouchableOpacity>

        <Text style={styles.controlLabel}>Required</Text>
        <Switch
          value={field.required}
          onValueChange={() => onToggleRequired(field.id)}
          trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
          thumbColor="#FFFFFF"
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />

        <TouchableOpacity
          onPress={() => onEdit(field)}
          style={styles.iconBtn}
          accessibilityLabel="Edit Field"
        >
          <Feather name="edit-2" size={15} color="#0284C7" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onToggleVisible(field.id)}
          style={styles.iconBtn}
          accessibilityLabel="Toggle Visibility"
        >
          <Feather
            name={field.visible ? 'eye' : 'eye-off'}
            size={16}
            color={field.visible ? '#0284C7' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(field.id)}
          style={styles.iconBtn}
          accessibilityLabel="Delete Field"
        >
          <Feather name="trash-2" size={16} color="#F87171" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  fieldRowHidden: {
    opacity: 0.55,
    backgroundColor: '#FAFAFA',
  },
  rowLeftMain: {
    flex: 1,
    marginRight: 12,
  },
  idBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  requiredStar: {
    color: '#EF4444',
  },
  levelPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  fieldOptionsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  rowRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: -4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
