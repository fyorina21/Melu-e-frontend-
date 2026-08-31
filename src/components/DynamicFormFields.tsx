import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { getFormConfig } from '../api/institutionalAdminApi';

export interface DynamicFormField {
  id: string;
  type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'Radio' | 'TextArea' | 'File' | string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  section?: string;
}

interface DynamicFormFieldsProps {
  formName: string;
  values: Record<string, any>;
  onChange: (fieldIdOrLabel: string, value: any) => void;
  excludeStandardLabels?: string[];
  onValidationChange?: (isValid: boolean, missingRequiredLabels: string[]) => void;
  initialFields?: DynamicFormField[];
  showSectionHeader?: boolean;
  section?: string;
}

export default function DynamicFormFields({
  formName,
  values,
  onChange,
  excludeStandardLabels = [],
  onValidationChange,
  initialFields,
  showSectionHeader = false,
  section,
}: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<DynamicFormField[]>(initialFields || []);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialFields);

  useEffect(() => {
    if (initialFields) {
      setFields(initialFields.filter((f) => f.visible !== false));
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    getFormConfig(formName)
      .then(({ data }) => {
        if (mounted && Array.isArray(data?.fields)) {
          setFields(data.fields.filter((f: DynamicFormField) => f.visible !== false));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [formName, initialFields]);

  const customFields = fields.filter((f) => {
    if (excludeStandardLabels.some((l) => l.toLowerCase() === f.label.toLowerCase())) {
      return false;
    }
    if (section) {
      if (f.section) {
        return f.section.toLowerCase().trim() === section.toLowerCase().trim();
      }
      // Smart keyword fallback when no explicit section was selected
      const normLabel = f.label.toLowerCase();
      const normSec = section.toLowerCase();
      if (normSec.includes('parent')) {
        return (
          normLabel.includes('parent') ||
          normLabel.includes('guardian') ||
          normLabel.includes('mother') ||
          normLabel.includes('father') ||
          normLabel.includes('emergency') ||
          normLabel.includes('family') ||
          normLabel.includes('contact')
        );
      }
      if (normSec.includes('medical')) {
        return (
          normLabel.includes('medical') ||
          normLabel.includes('allerg') ||
          normLabel.includes('doctor') ||
          normLabel.includes('health') ||
          normLabel.includes('insurance') ||
          normLabel.includes('medication') ||
          normLabel.includes('hospital') ||
          normLabel.includes('physician') ||
          normLabel.includes('diet')
        );
      }
      if (normSec.includes('student')) {
        const isParent =
          normLabel.includes('parent') ||
          normLabel.includes('guardian') ||
          normLabel.includes('mother') ||
          normLabel.includes('father') ||
          normLabel.includes('emergency') ||
          normLabel.includes('family') ||
          normLabel.includes('contact');
        const isMed =
          normLabel.includes('medical') ||
          normLabel.includes('allerg') ||
          normLabel.includes('doctor') ||
          normLabel.includes('health') ||
          normLabel.includes('insurance') ||
          normLabel.includes('medication') ||
          normLabel.includes('hospital') ||
          normLabel.includes('physician') ||
          normLabel.includes('diet');
        return !isParent && !isMed;
      }
    }
    return true;
  });

  // Validate required fields
  useEffect(() => {
    if (!onValidationChange) return;
    const missing: string[] = [];
    customFields.forEach((field) => {
      if (field.required) {
        const val = values[field.id] ?? values[field.label];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          missing.push(field.label);
        }
      }
    });
    onValidationChange(missing.length === 0, missing);
  }, [customFields, values, onValidationChange]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.primaryYellowDark} />
        <Text style={styles.loadingText}>Loading fields...</Text>
      </View>
    );
  }

  if (customFields.length === 0) return null;

  const handlePickFile = async (fieldId: string, fieldLabel: string) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        onChange(fieldId, file.name);
        onChange(fieldLabel, file.name);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      {showSectionHeader && (
        <View style={styles.headerRow}>
          <Feather name="layers" size={14} color={colors.primaryYellowDark} />
          <Text style={styles.sectionTitle}>Additional Fields ({formName})</Text>
        </View>
      )}

      {customFields.map((field) => {
        const val = values[field.id] ?? values[field.label] ?? '';
        const fieldOptions = Array.isArray(field.options) && field.options.length > 0
          ? field.options
          : (typeof field.options === 'string' && (field.options as string).length > 0
              ? (field.options as string).split(',').map((s) => s.trim()).filter(Boolean)
              : ['Option 1', 'Option 2', 'Option 3']);

        if (field.type === 'TextArea') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={String(val)}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                placeholderTextColor={colors.mutedText}
                onChangeText={(text) => {
                  onChange(field.id, text);
                  onChange(field.label, text);
                }}
                multiline
                numberOfLines={3}
              />
            </View>
          );
        }

        if (field.type === 'Checkbox') {
          const isChecked = Boolean(val);
          return (
            <TouchableOpacity
              key={field.id}
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => {
                const next = !isChecked;
                onChange(field.id, next);
                onChange(field.label, next);
              }}
            >
              <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
                {isChecked && <Feather name="check" size={12} color={colors.navyText} />}
              </View>
              <Text style={styles.checkboxLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
            </TouchableOpacity>
          );
        }

        if (field.type === 'Radio') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.radioGroup}>
                {fieldOptions.map((opt) => {
                  const isSelected = val === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.radioChip, isSelected && styles.radioChipSelected]}
                      onPress={() => {
                        onChange(field.id, opt);
                        onChange(field.label, opt);
                      }}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={[styles.radioChipText, isSelected && styles.radioChipTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }

        if (field.type === 'File') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.fileUploadRow}>
                <TouchableOpacity
                  style={styles.fileUploadBtn}
                  onPress={() => handlePickFile(field.id, field.label)}
                >
                  <Feather name="upload" size={14} color={colors.navyText} />
                  <Text style={styles.fileUploadBtnText}>
                    {val ? 'Replace File' : 'Choose File'}
                  </Text>
                </TouchableOpacity>
                {val ? (
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {String(val)}
                  </Text>
                ) : (
                  <Text style={styles.noFileText}>No file chosen</Text>
                )}
              </View>
            </View>
          );
        }

        if (field.type === 'Dropdown') {
          const isOpen = openDropdownId === field.id;

          return (
            <View key={field.id} style={[styles.field, { zIndex: isOpen ? 100 : 1 }]}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                activeOpacity={0.8}
                onPress={() => setOpenDropdownId(isOpen ? null : field.id)}
              >
                <Text style={val ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                  {val ? String(val) : `Select ${field.label}...`}
                </Text>
                <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedText} />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.dropdownMenu}>
                  {fieldOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.dropdownItem, val === opt && styles.dropdownItemActive]}
                      onPress={() => {
                        onChange(field.id, opt);
                        onChange(field.label, opt);
                        setOpenDropdownId(null);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, val === opt && styles.dropdownItemTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }

        // Standard Text, Number, Date input
        return (
          <View key={field.id} style={styles.field}>
            <Text style={typography.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(val)}
              placeholder={field.type === 'Date' ? 'YYYY-MM-DD' : `Enter ${field.label.toLowerCase()}...`}
              placeholderTextColor={colors.mutedText}
              keyboardType={field.type === 'Number' ? 'numeric' : 'default'}
              onChangeText={(text) => {
                onChange(field.id, text);
                onChange(field.label, text);
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    gap: 4,
    position: 'relative',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    color: colors.navyText,
    fontSize: 14,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.navyText,
    fontWeight: '500',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  radioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  radioChipSelected: {
    borderColor: colors.primaryYellowDark,
    backgroundColor: '#FEF9C3',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primaryYellowDark,
  },
  radioInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryYellowDark,
  },
  radioChipText: {
    fontSize: 13,
    color: colors.navyText,
  },
  radioChipTextSelected: {
    fontWeight: '600',
    color: '#854D0E',
  },
  fileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  fileUploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  fileNameText: {
    fontSize: 13,
    color: '#0284C7',
    flex: 1,
  },
  noFileText: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: colors.mutedText,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: colors.navyText,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: {
    backgroundColor: '#FEF3C7',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#92400E',
  },
});

