import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import { FIELD_TYPES, type FieldType } from '../formBuilderConfig';
import type { FormField } from '../../../types';

interface EditFieldModalProps {
  editingField: FormField | null;
  editLabel: string;
  editType: FieldType;
  editOptions: string;
  editRequired: boolean;
  editSection: string;
  onLabelChange: (label: string) => void;
  onTypeChange: (type: FieldType) => void;
  onOptionsChange: (options: string) => void;
  onRequiredChange: (required: boolean) => void;
  onSectionChange: (section: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const EditFieldModal: React.FC<EditFieldModalProps> = React.memo(
  ({
    editingField,
    editLabel,
    editType,
    editOptions,
    editRequired,
    editSection,
    onLabelChange,
    onTypeChange,
    onOptionsChange,
    onRequiredChange,
    onSectionChange,
    onSave,
    onClose,
  }) => {
    if (!editingField) return null;

    return (
      <Modal
        visible={Boolean(editingField)}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Field — {editingField.id}</Text>
                <Text style={styles.modalSubtitle}>Configure field label, type, and options</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close edit modal"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Field Label</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editLabel}
                  onChangeText={onLabelChange}
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Field Type</Text>
                <View style={styles.typeSelectorRow}>
                  {FIELD_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeSelectPill,
                        editType === type && styles.typeSelectPillActive,
                      ]}
                      onPress={() => onTypeChange(type)}
                    >
                      <Text
                        style={[
                          styles.typeSelectPillText,
                          editType === type && styles.typeSelectPillTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {(editType === 'Dropdown' || editType === 'Radio') && (
                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Options (comma separated)</Text>
                  <TextInput
                    style={styles.inlineTextInput}
                    value={editOptions}
                    onChangeText={onOptionsChange}
                    placeholder="Option 1, Option 2, Option 3"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Section / Domain</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editSection}
                  onChangeText={onSectionChange}
                />
              </View>

              <View style={[styles.inlineToggleCol, { marginTop: 8 }]}>
                <Text style={styles.inlineFieldLabel}>Required</Text>
                <Switch
                  value={editRequired}
                  onValueChange={onRequiredChange}
                  trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={onSave}>
                <Text style={styles.confirmAddBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelAddBtn} onPress={onClose}>
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    marginBottom: spacing.md,
  },
  editFormGroup: {
    marginBottom: 12,
    gap: 4,
  },
  inlineFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeSelectPillActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  typeSelectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeSelectPillTextActive: {
    color: '#FFFFFF',
  },
  inlineTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  inlineToggleCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  confirmAddBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  confirmAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
