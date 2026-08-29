import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
}

interface DynamicFormFieldsProps {
  formName: string;
  values: Record<string, any>;
  onChange: (fieldIdOrLabel: string, value: any) => void;
  excludeStandardLabels?: string[];
}

export default function DynamicFormFields({
  formName,
  values,
  onChange,
  excludeStandardLabels = [],
}: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<DynamicFormField[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getFormConfig(formName)
      .then(({ data }) => {
        if (mounted && Array.isArray(data?.fields)) {
          setFields(data.fields.filter((f: DynamicFormField) => f.visible !== false));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [formName]);

  const customFields = fields.filter(
    (f) => !excludeStandardLabels.some((l) => l.toLowerCase() === f.label.toLowerCase())
  );

  if (customFields.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Feather name="layers" size={14} color={colors.primaryYellowDark} />
        <Text style={styles.sectionTitle}>Custom Fields ({formName})</Text>
      </View>

      {customFields.map((field) => {
        const val = values[field.id] ?? values[field.label] ?? '';

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

        if (field.type === 'Checkbox' || field.type === 'Radio') {
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

        if (field.type === 'Dropdown') {
          const defaultOpts = field.options && field.options.length > 0 ? field.options : ['Standard', 'High Priority', 'Requires Review', 'Completed'];
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
                  {defaultOpts.map((opt) => (
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

        // Standard Text, Number, Date, File input
        return (
          <View key={field.id} style={styles.field}>
            <Text style={typography.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(val)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
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
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    marginVertical: spacing.sm,
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
