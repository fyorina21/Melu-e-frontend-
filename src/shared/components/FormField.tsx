import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  style,
  labelStyle,
  errorStyle,
  testID = 'form-field',
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>{children}</View>

      {hasError ? (
        <View style={styles.errorRow} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Feather name="alert-circle" size={13} color={colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, errorStyle]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  requiredAsterisk: {
    color: colors.error,
    fontWeight: '700',
  },
  inputContainer: {
    width: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: spacing.xs,
  },
});

export default FormField;
