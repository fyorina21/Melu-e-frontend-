import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import { CATEGORIES } from '../types';

interface AddCustomItemModalProps {
  visible: boolean;
  name: string;
  category: string;
  isDropdownOpen: boolean;
  onNameChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onToggleDropdown: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const AddCustomItemModal: React.FC<AddCustomItemModalProps> = React.memo(
  ({
    visible,
    name,
    category,
    isDropdownOpen,
    onNameChange,
    onCategoryChange,
    onToggleDropdown,
    onConfirm,
    onClose,
  }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Item</Text>

            {/* Input: Item Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Item Name</Text>
              <TextInput
                style={styles.textInputActive}
                placeholder="Enter item name..."
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={onNameChange}
              />
            </View>

            {/* Dropdown: Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category</Text>
              <TouchableOpacity
                style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]}
                onPress={onToggleDropdown}
                accessibilityRole="button"
                accessibilityLabel="Select category"
              >
                <Text style={styles.dropdownValue}>{category}</Text>
                <Feather name="chevron-down" size={16} color="#0F172A" />
              </TouchableOpacity>

              {/* Options Overlay */}
              {isDropdownOpen && (
                <View style={styles.dropdownOptionsContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.dropdownOptionRow,
                        cat === category && styles.dropdownOptionRowActive,
                      ]}
                      onPress={() => {
                        onCategoryChange(cat);
                        onToggleDropdown();
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          cat === category && styles.dropdownOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, !name.trim() && styles.confirmBtnDisabled]}
                disabled={!name.trim()}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Confirm add item"
              >
                <Text style={styles.confirmBtnText}>Add Item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: 6,
    position: 'relative',
    zIndex: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  textInputActive: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderColor: '#0284C7',
  },
  dropdownValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownOptionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 50,
  },
  dropdownOptionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionRowActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
