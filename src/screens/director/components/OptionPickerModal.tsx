import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Option } from '../reportsTypes';

interface OptionPickerModalProps {
  visible: boolean;
  title: string;
  options: Option[];
  selectedId: string;
  emptyOptionLabel?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function OptionPickerModal({
  visible,
  title,
  options,
  selectedId,
  emptyOptionLabel = 'All Options',
  onSelect,
  onClose,
}: OptionPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close picker">
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            <TouchableOpacity
              style={[styles.pickerItem, !selectedId && styles.pickerItemActive]}
              onPress={() => {
                onSelect('');
                onClose();
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: !selectedId }}
            >
              <Text style={[styles.pickerItemText, !selectedId && styles.pickerItemTextActive]}>
                {emptyOptionLabel}
              </Text>
              {!selectedId && <Feather name="check" size={16} color={colors.navyText} />}
            </TouchableOpacity>
            {options.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                  onPress={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                    {opt.name}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color={colors.navyText} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.xs ?? radius.sm,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.bodyText,
  },
  pickerItemTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
