import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../theme/colors';

export interface FormMetadataValues {
  formId: string;
  formName: string;
  revision: string;
  pages: string;
}

interface EditMetadataModalProps {
  visible: boolean;
  initialValues: FormMetadataValues;
  onSave: (values: FormMetadataValues) => void;
  onClose: () => void;
}

export const EditMetadataModal: React.FC<EditMetadataModalProps> = React.memo(
  ({ visible, initialValues, onSave, onClose }) => {
    const [formId, setFormId] = useState(initialValues.formId);
    const [formName, setFormName] = useState(initialValues.formName);
    const [revision, setRevision] = useState(initialValues.revision);
    const [pages, setPages] = useState(initialValues.pages);

    useEffect(() => {
      setFormId(initialValues.formId);
      setFormName(initialValues.formName);
      setRevision(initialValues.revision);
      setPages(initialValues.pages);
    }, [initialValues]);

    const handleSave = () => {
      onSave({
        formId: formId.trim() || initialValues.formId,
        formName: formName.trim() || initialValues.formName,
        revision: revision.trim() || initialValues.revision,
        pages: pages.trim() || initialValues.pages,
      });
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Form Header & Metadata</Text>
                <Text style={styles.modalSubtitle}>
                  Configure Form ID, Name, Revision, and Page count
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityLabel="Close metadata modal"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.modalBody}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FORM ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={formId}
                  onChangeText={setFormId}
                  onSubmitEditing={handleSave}
                  placeholder="e.g. FRM-ENR-001"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FORM NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={formName}
                  onChangeText={setFormName}
                  onSubmitEditing={handleSave}
                  placeholder="e.g. Enrollment Wizard"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.rowTwoCol}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>REVISION</Text>
                  <TextInput
                    style={styles.textInput}
                    value={revision}
                    onChangeText={setRevision}
                    onSubmitEditing={handleSave}
                    placeholder="e.g. Rev 2.4 · 2026-09-19"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>PAGE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={pages}
                    onChangeText={setPages}
                    onSubmitEditing={handleSave}
                    placeholder="e.g. Page 1 of 3"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Update Header</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 480,
    ...makeShadow(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  fieldGroup: {
    gap: 4,
  },
  rowTwoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
