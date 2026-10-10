import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { type FormData, type GoalStatus, EMPTY_FORM } from '../types';
import { DomainPicker } from './DomainPicker';

interface GoalFormModalProps {
  visible: boolean;
  initial: FormData | null;
  onClose: () => void;
  onSave: (payload: FormData) => void;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = React.memo(
  ({ visible, initial, onClose, onSave }) => {
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [domainPickerOpen, setDomainPickerOpen] = useState(false);

    useEffect(() => {
      setForm(initial ? { ...initial } : { ...EMPTY_FORM });
    }, [initial, visible]);

    const valid = form.name.trim().length > 0 && form.description.trim().length > 0;

    const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.h2}>{initial ? 'Edit Goal' : 'Add Goal'}</Text>
                <Text style={typography.caption}>
                  {initial
                    ? 'Update the goal definition and status.'
                    : 'Create a new goal to add to the shared bank.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close form"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formFields}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Goal Name <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  placeholder="e.g. Identify Colors"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Domain</Text>
                <TouchableOpacity
                  style={[styles.selectBtn, domainPickerOpen && styles.selectBtnOpen]}
                  onPress={() => setDomainPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Choose domain"
                >
                  <Text style={styles.selectBtnText}>{form.domain}</Text>
                  <Feather name="chevron-down" size={14} color={colors.mutedText} />
                </TouchableOpacity>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Description <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  value={form.description}
                  onChangeText={(v) => set('description', v)}
                  placeholder="Describe the goal and success criteria..."
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Mastery Criteria</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  value={form.masteryCriteria}
                  onChangeText={(v) => set('masteryCriteria', v)}
                  placeholder="e.g. 80% accuracy across 3 consecutive sessions"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Suggested Age Range</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.suggestedAgeRange}
                  onChangeText={(v) => set('suggestedAgeRange', v)}
                  placeholder="e.g. 4–8 years"
                  placeholderTextColor={colors.mutedText}
                />
                <Text style={styles.fieldHint}>
                  For reference only — not saved to the goal record.
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {(['active', 'inactive'] as GoalStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, form.status === s && styles.chipSelected]}
                      onPress={() => set('status', s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set status to ${s}`}
                      accessibilityState={{ selected: form.status === s }}
                    >
                      <Text style={[styles.chipText, form.status === s && styles.chipTextSelected]}>
                        {s === 'active' ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
                onPress={() => onSave({ ...form })}
                disabled={!valid}
                accessibilityRole="button"
                accessibilityLabel={initial ? 'Save Changes' : 'Create Goal'}
              >
                <Text style={styles.saveBtnText}>{initial ? 'Save Changes' : 'Create Goal'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <DomainPicker
            visible={domainPickerOpen}
            selected={form.domain}
            onSelect={(d) => set('domain', d)}
            onClose={() => setDomainPickerOpen(false)}
          />
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formFields: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  fieldHint: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.navyText,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectBtnOpen: {
    borderColor: '#38BDF8',
  },
  selectBtnText: {
    fontSize: 14,
    color: colors.navyText,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  chipSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: '#0284C7',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
