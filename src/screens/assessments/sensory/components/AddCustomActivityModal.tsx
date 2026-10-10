import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';

interface AddCustomActivityModalProps {
  visible: boolean;
  activityName: string;
  onActivityNameChange: (val: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const AddCustomActivityModal: React.FC<AddCustomActivityModalProps> = React.memo(
  ({ visible, activityName, onActivityNameChange, onConfirm, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Sensory Activity</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Activity Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Aromatherapy exploration..."
                placeholderTextColor="#94A3B8"
                value={activityName}
                onChangeText={onActivityNameChange}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !activityName.trim() && styles.confirmBtnDisabled]}
                disabled={!activityName.trim()}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Add Activity"
              >
                <Text style={styles.confirmBtnText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 400,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#0284C7',
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
