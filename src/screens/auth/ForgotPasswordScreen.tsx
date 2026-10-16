import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, shadows, typography } from '../../theme';
import { resetPassword, requestResetCode } from '../../api/sessionApi';
import { toApiError } from '../../api/http/errors';
import { Button, FormField } from '../../shared/components';

type RootStackParamList = { Login: undefined; ForgotPassword: undefined };

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleRequestCode = async () => {
    setGeneralError(null);
    setGeneralSuccess(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError(null);

    setLoading(true);
    try {
      await requestResetCode({ email: trimmedEmail });
      setGeneralSuccess(
        'If an account exists with this email address, you will receive a password reset link.',
      );
      setStep('reset');
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      setGeneralError(apiErr.message || 'Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setGeneralError(null);
    let hasErr = false;

    if (!code.trim()) {
      setCodeError('Please enter the reset key from your email');
      hasErr = true;
    } else {
      setCodeError(null);
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      hasErr = true;
    } else {
      setPasswordError(null);
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasErr = true;
    } else {
      setConfirmPasswordError(null);
    }

    if (hasErr) return;

    setLoading(true);
    try {
      await resetPassword({
        reset_password_key: code.trim(),
        password: newPassword,
        password_confirm: confirmPassword,
      });
      setStep('done');
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      setGeneralError(
        apiErr.message || 'Failed to reset password. Please verify the key and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => navigation.goBack()}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Back to Sign In"
          >
            <Feather name="arrow-left" size={16} color={colors.primaryBlue} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          <Text accessibilityRole="header" style={typography.h1}>
            Reset Your Password
          </Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>
            {step === 'request' && 'Enter your account email and we\u2019ll send you a reset link.'}
            {step === 'reset' && 'Copy the reset key from your email, then choose a new password.'}
            {step === 'done' && 'Your password has been successfully reset.'}
          </Text>

          {generalError && (
            <View style={styles.bannerError} accessibilityRole="alert">
              <Feather name="alert-triangle" size={16} color={colors.error} />
              <Text style={styles.bannerErrorText}>{generalError}</Text>
            </View>
          )}

          {generalSuccess && (
            <View style={styles.bannerSuccess} accessibilityRole="alert">
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.bannerSuccessText}>{generalSuccess}</Text>
            </View>
          )}

          {step === 'request' && (
            <>
              <FormField
                label="Email Address"
                required
                error={emailError}
                style={{ width: '100%' }}
              >
                <View style={[styles.inputRow, !!emailError && styles.inputRowError]}>
                  <Feather name="mail" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@domain.com"
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="go"
                    onSubmitEditing={handleRequestCode}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError(null);
                    }}
                    editable={!loading}
                    accessibilityLabel="Email Address"
                  />
                </View>
              </FormField>

              <Button
                label={loading ? 'Sending...' : 'Send Reset Code'}
                onPress={handleRequestCode}
                loading={loading}
                disabled={loading}
                fullWidth
                variant="primary"
                size="lg"
              />
            </>
          )}

          {step === 'reset' && (
            <>
              <FormField label="Reset Key" required error={codeError} style={{ width: '100%' }}>
                <View style={[styles.inputRow, !!codeError && styles.inputRowError]}>
                  <Feather name="key" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Paste the reset key from your email"
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                    value={code}
                    onChangeText={(val) => {
                      setCode(val);
                      if (codeError) setCodeError(null);
                    }}
                    editable={!loading}
                    accessibilityLabel="Reset Key"
                  />
                </View>
              </FormField>

              <FormField
                label="New Password"
                required
                error={passwordError}
                style={{ width: '100%' }}
              >
                <View style={[styles.inputRow, !!passwordError && styles.inputRowError]}>
                  <Feather name="lock" size={16} color={colors.mutedText} />
                  <TextInput
                    ref={newPasswordRef}
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedText}
                    secureTextEntry
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      if (passwordError) setPasswordError(null);
                    }}
                    editable={!loading}
                    accessibilityLabel="New Password"
                  />
                </View>
              </FormField>

              <FormField
                label="Confirm New Password"
                required
                error={confirmPasswordError}
                style={{ width: '100%' }}
              >
                <View style={[styles.inputRow, !!confirmPasswordError && styles.inputRowError]}>
                  <Feather name="lock" size={16} color={colors.mutedText} />
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.mutedText}
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={handleReset}
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    editable={!loading}
                    accessibilityLabel="Confirm New Password"
                  />
                </View>
              </FormField>

              <Button
                label={loading ? 'Resetting...' : 'Reset Password'}
                onPress={handleReset}
                loading={loading}
                disabled={loading}
                fullWidth
                variant="primary"
                size="lg"
              />
            </>
          )}

          {step === 'done' && (
            <>
              <Feather name="check-circle" size={48} color={colors.success} />
              <Text accessibilityRole="text" style={[typography.body, { textAlign: 'center' }]}>
                You can now sign in with your new password.
              </Text>
              <Button
                label="Back to Sign In"
                onPress={() => navigation.goBack()}
                fullWidth
                variant="primary"
                size="lg"
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.primaryBlue,
    fontWeight: '600',
    fontSize: 13,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.promptFP,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  bannerErrorText: {
    flex: 1,
    fontSize: 13,
    color: colors.errorDark,
    fontWeight: '500',
  },
  bannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.statusApprovedBg,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
  },
  bannerSuccessText: {
    flex: 1,
    fontSize: 13,
    color: colors.successDark,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    height: 44,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.navyText,
    fontSize: 14,
    height: '100%',
  },
});
