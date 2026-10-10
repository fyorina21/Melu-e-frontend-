// src/screens/director/reportbuilder/components/DropdownPickerModal.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DropdownPickerModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

export const DropdownPickerModal: React.FC<DropdownPickerModalProps> = React.memo(
  ({ visible, title, options, selected, onSelect, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select {title}</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close picker"
              >
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {options.map((opt) => {
                const isSelected = opt === selected;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      onSelect(opt);
                      onClose();
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color={colors.navyText} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  pickerItemActive: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.sm,
  },
  pickerItemText: {
    fontSize: 13,
    color: colors.navyText,
    fontWeight: '500',
  },
  pickerItemTextActive: {
    fontWeight: '700',
  },
});
