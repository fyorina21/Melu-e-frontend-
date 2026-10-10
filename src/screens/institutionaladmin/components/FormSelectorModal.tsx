import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';

interface FormSelectorModalProps {
  visible: boolean;
  selectedForm: string;
  forms: readonly string[] | string[];
  onSelectForm: (form: string) => void;
  onClose: () => void;
}

export const FormSelectorModal: React.FC<FormSelectorModalProps> = React.memo(
  ({ visible, selectedForm, forms, onSelectForm, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.dropdownModalBox}>
            {forms.map((form) => (
              <TouchableOpacity
                key={form}
                style={[
                  styles.dropdownOption,
                  selectedForm === form && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  onSelectForm(form);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedForm === form && styles.dropdownOptionTextActive,
                  ]}
                >
                  {form}
                </Text>
              </TouchableOpacity>
            ))}
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
  dropdownModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.sm,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  dropdownOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
