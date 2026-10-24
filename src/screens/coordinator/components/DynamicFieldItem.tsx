import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DobPicker from '../../../components/DobPicker';
import { colors, radius, spacing, makeShadow } from '../../../theme/colors';
import { calculateAge, getTherapyGroupAgeWarning } from '../enrollmentWizardTypes';
import { resolveFieldOptions } from '../../../components/DynamicFormFields';

const C_YELLOW = '#FCD34D';
const C_SKY = '#38BDF8';
const C_INK = '#374151';
const C_INPUT_BORDER = '#D1D5DB';
const C_RED = '#DC2626';

interface DynamicFieldItemProps {
  field: any;
  value: any;
  onChange: (value: any) => void;
  onTakePhoto?: () => void;
  onChoosePhoto?: () => void;
  onRemovePhoto?: () => void;
  studentDob?: string;
  therapists?: any[];
}

export function DynamicFieldItem({
  field,
  value,
  onChange,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  studentDob,
  therapists = [],
}: DynamicFieldItemProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isRequired = Boolean(field.required);
  const normType = (field.type || 'text').toLowerCase().replace(/[- ]/g, '_');
  const options = resolveFieldOptions(field);

  // 1. File / Image
  if (
    normType === 'file' ||
    normType === 'image' ||
    normType === 'file_upload' ||
    normType === 'image_picker'
  ) {
    const isPhoto = field.id === 'f_photo' || /photo/i.test(field.id) || /photo/i.test(field.label);
    return (
      <View style={styles.photoUploadCard}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <View style={styles.photoRow}>
          <View style={styles.photoAvatarContainer}>
            {value ? (
              <View style={styles.photoWrapper}>
                <Image source={{ uri: value }} style={styles.photoImage} />
                {onRemovePhoto && (
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={onRemovePhoto}
                    accessibilityLabel="Remove photo"
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name={isPhoto ? 'user' : 'file-text'} size={30} color="#94A3B8" />
              </View>
            )}
          </View>

          <View style={styles.photoButtonContainer}>
            {onTakePhoto && (
              <TouchableOpacity style={styles.cameraBtn} onPress={onTakePhoto}>
                <Feather name="camera" size={15} color="#FFFFFF" />
                <Text style={styles.cameraBtnText}>Open Camera</Text>
              </TouchableOpacity>
            )}
            {onChoosePhoto && (
              <TouchableOpacity style={styles.uploadBtn} onPress={onChoosePhoto}>
                <Feather name="upload" size={15} color={colors.navyText} />
                <Text style={styles.uploadBtnText}>Upload File</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.fieldHint}>
          {field.helpText ||
            field.help_text ||
            'Capture using camera or upload a file from your device.'}
        </Text>
      </View>
    );
  }

  // 2. Date Input
  if (normType === 'date') {
    const isDob = field.id === 'f2' || /birth|dob/i.test(field.label);
    const calculatedAge = isDob && value ? calculateAge(value) : null;
    return (
      <View style={styles.field}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          {calculatedAge !== null ? (
            <View style={styles.ageBadge}>
              <Feather name="calendar" size={12} color="#0284C7" />
              <Text style={styles.ageBadgeText}>
                Calculated Age: {calculatedAge} {calculatedAge === 1 ? 'year' : 'years'} old
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dobWrap}>
          <DobPicker
            value={value || ''}
            maximumDate={isDob ? new Date() : undefined}
            onChange={onChange}
          />
        </View>
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 3. Dropdown
  if (normType === 'dropdown' || normType === 'select') {
    const isTherapistField = field.id === 'f_therapist' || /therapist/i.test(field.label);
    const dropdownOpts =
      isTherapistField && therapists.length > 0 ? therapists.map((t) => t.name) : options;

    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>

        <TouchableOpacity
          style={[styles.dropdownSelector, dropdownOpen && styles.dropdownSelectorOpen]}
          onPress={() => setDropdownOpen(!dropdownOpen)}
          accessibilityRole="combobox"
        >
          <Text style={[styles.dropdownSelectedText, !value && styles.dropdownPlaceholderText]}>
            {value || field.placeholder || 'Select an option...'}
          </Text>
          <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
        </TouchableOpacity>

        {dropdownOpen && (
          <Modal
            transparent
            animationType="fade"
            visible={dropdownOpen}
            onRequestClose={() => setDropdownOpen(false)}
          >
            <TouchableOpacity
              style={styles.dropdownModalBackdrop}
              activeOpacity={1}
              onPress={() => setDropdownOpen(false)}
            >
              <View style={styles.dropdownModalCard}>
                <View style={styles.dropdownModalHeader}>
                  <Text style={styles.dropdownModalTitle}>{field.label}</Text>
                  <TouchableOpacity
                    onPress={() => setDropdownOpen(false)}
                    style={styles.dropdownModalCloseBtn}
                  >
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.dropdownModalList}>
                  {dropdownOpts.map((opt) => {
                    const selected = value === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.dropdownOptionItem,
                          selected && styles.dropdownOptionItemSelected,
                        ]}
                        onPress={() => {
                          onChange(opt);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selected && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                        {selected && <Feather name="check" size={16} color="#0284C7" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 4. Radio Group
  if (normType === 'radio') {
    const isTherapyField = field.id === 'f_therapy' || /therapy/i.test(field.label);
    const calculatedAge = studentDob ? calculateAge(studentDob) : null;
    const ageWarning =
      isTherapyField && value ? getTherapyGroupAgeWarning(value, calculatedAge) : null;

    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <View style={styles.chipRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, value === opt && styles.chipSelected]}
              onPress={() => onChange(opt)}
            >
              <Text style={[styles.chipText, value === opt && styles.chipTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {ageWarning ? (
          <View style={styles.ageWarningBox}>
            <Feather name="info" size={13} color="#D97706" />
            <Text style={styles.ageWarningText}>{ageWarning}</Text>
          </View>
        ) : null}
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 5. TextArea
  if (normType === 'textarea') {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder || 'Type here...'}
          placeholderTextColor={colors.mutedText}
          multiline
          textAlignVertical="top"
        />
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 6. Checkbox Group
  if (normType === 'checkbox' || normType === 'checkbox_group') {
    const selectedValues: string[] = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      const next = selectedValues.includes(opt)
        ? selectedValues.filter((v) => v !== opt)
        : [...selectedValues, opt];
      onChange(next);
    };

    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <View style={styles.chipRow}>
          {options.map((opt) => {
            const checked = selectedValues.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, checked && styles.chipSelected]}
                onPress={() => toggle(opt)}
              >
                <Text style={[styles.chipText, checked && styles.chipTextSelected]}>
                  {checked ? '✓ ' : ''}
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 7. Switch (Boolean)
  if (normType === 'switch') {
    const boolVal = Boolean(value);
    return (
      <View style={styles.field}>
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <Switch
            value={boolVal}
            onValueChange={onChange}
            trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
          />
        </View>
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 8. Phone
  if (normType === 'phone') {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={[styles.textInput, styles.textInputMax]}
          value={value}
          onChangeText={onChange}
          keyboardType="phone-pad"
          placeholder={field.placeholder || '(555) 000-0000'}
          placeholderTextColor={colors.mutedText}
        />
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 9. Number
  if (normType === 'number') {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={[styles.textInput, styles.textInputMax]}
          value={String(value)}
          onChangeText={(val) => onChange(val.replace(/[^0-9.-]/g, ''))}
          keyboardType="numeric"
          placeholder={field.placeholder || '0'}
          placeholderTextColor={colors.mutedText}
        />
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  }

  // 10. Default: Text input
  const isEmail = /email/i.test(field.label);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {field.label}
        {isRequired && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        keyboardType={isEmail ? 'email-address' : 'default'}
        placeholder={field.placeholder || 'Type here...'}
        placeholderTextColor={colors.mutedText}
      />
      {Boolean(field.helpText || field.help_text) && (
        <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginBottom: spacing.md },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C_INK, marginBottom: 2 },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  ageWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  ageWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  requiredStar: { color: C_RED, fontWeight: '700' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  dobWrap: { paddingVertical: 2 },
  textInput: {
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: colors.white,
    minHeight: 44,
  },
  textInputMax: { maxWidth: 320 },
  textArea: { minHeight: 100, textAlignVertical: 'top', alignSelf: 'stretch' },

  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  dropdownSelectorOpen: {
    borderColor: C_SKY,
    borderWidth: 1.5,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    color: colors.mutedText,
  },
  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdownModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...makeShadow(2, 8, 0.15, '0, 0, 0', 2),
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownModalCloseBtn: {
    padding: 4,
  },
  dropdownModalList: {
    paddingVertical: 4,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownOptionItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 44,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: C_YELLOW, borderColor: C_YELLOW },
  chipText: { fontSize: 12, fontWeight: '600', color: C_INK },
  chipTextSelected: { color: '#1F2937', fontWeight: '700' },

  photoUploadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 4,
  },
  photoAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: C_SKY,
  },
  photoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C_RED,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  photoButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 44,
    ...makeShadow(1, 2, 0.08, '0, 0, 0', 1),
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    minHeight: 44,
  },
  uploadBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
});
