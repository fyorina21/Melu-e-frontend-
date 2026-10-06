import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme/colors';

export interface WizardFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'phone-pad' | 'email-address';
  multiline?: boolean;
  placeholder?: string;
  maxWidth?: boolean;
  hint?: string;
  error?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
}

export function WizardField({
  label,
  required,
  value,
  onChangeText,
  keyboardType,
  multiline,
  placeholder,
  maxWidth,
  hint,
  error,
  returnKeyType = 'next',
  onSubmitEditing,
}: WizardFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label ? (
        <Text
          style={styles.fieldLabel}
          nativeID={label ? `${label.replace(/\s+/g, '_')}_label` : undefined}
        >
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textArea,
          focused && styles.textInputFocused,
          maxWidth && styles.textInputMax,
          !!error && styles.textInputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label || placeholder}
        aria-label={label || placeholder}
        returnKeyType={multiline ? undefined : returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 },
  requiredStar: { color: '#DC2626', fontWeight: '700' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: 2, fontWeight: '500' },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: colors.white,
  },
  textInputFocused: { borderColor: '#38BDF8', borderWidth: 1.5 },
  textInputError: { borderColor: '#DC2626', borderWidth: 1.5 },
  textInputMax: { maxWidth: 360 },
  textArea: { minHeight: 100, textAlignVertical: 'top', alignSelf: 'stretch' },
});
