import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resetPassword, requestResetCode } from '../../api/sessionApi';

type RootStackParamList = { Login: undefined; ForgotPassword: undefined };

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const newPasswordRef = React.useRef<TextInput>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);

  const handleRequestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestResetCode({ email: trimmedEmail });
      Alert.alert(
        'Reset Link Sent',
        'If an account exists with this email address, you will receive a password reset link.',
      );
      setStep('reset');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (status === 500
          ? 'The password reset service is temporarily unavailable. Please try again later.'
          : 'Could not send reset code. Please try again.');
      Alert.alert('Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim()) {
      Alert.alert('Missing Key', 'Please enter the reset key from your email.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please re-enter the same password in both fields.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        reset_password_key: code.trim(),
        password: newPassword,
        password_confirm: confirmPassword,
      });
      setStep('done');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. Please verify the key and try again.';
      Alert.alert('Reset Failed', msg);
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
            <Feather name="arrow-left" size={16} color={colors.statusInProgressText} />
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

          {step === 'request' && (
            <>
              <View style={styles.field}>
                <Text nativeID="forgotEmailLabel" style={typography.label}>
                  Email Address
                </Text>
                <View style={styles.inputRow}>
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
                    onChangeText={setEmail}
                    editable={!loading}
                    accessibilityLabel="Email Address"
                    aria-label="Email Address"
                    aria-labelledby="forgotEmailLabel"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRequestCode}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Send Reset Code"
                accessibilityState={{ busy: loading, disabled: loading }}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'reset' && (
            <>
              <View style={styles.field}>
                <Text nativeID="resetKeyLabel" style={typography.label}>
                  Reset Key
                </Text>
                <View style={styles.inputRow}>
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
                    onChangeText={setCode}
                    editable={!loading}
                    accessibilityLabel="Reset Key"
                    aria-label="Reset Key"
                    aria-labelledby="resetKeyLabel"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text nativeID="newPasswordLabel" style={typography.label}>
                  New Password
                </Text>
                <View style={styles.inputRow}>
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
                    onChangeText={setNewPassword}
                    editable={!loading}
                    accessibilityLabel="New Password"
                    aria-label="New Password"
                    aria-labelledby="newPasswordLabel"
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text nativeID="confirmPasswordLabel" style={typography.label}>
                  Confirm New Password
                </Text>
                <View style={styles.inputRow}>
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
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                    accessibilityLabel="Confirm New Password"
                    aria-label="Confirm New Password"
                    aria-labelledby="confirmPasswordLabel"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleReset}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Reset Password"
                accessibilityState={{ busy: loading, disabled: loading }}
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <>
              <Feather name="check-circle" size={48} color={colors.statusApprovedText} />
              <Text accessibilityRole="text" style={[typography.body, { textAlign: 'center' }]}>
                You can now sign in with your new password.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Back to Sign In"
              >
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
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
    maxWidth: 420,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  backText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 13 },
  field: { width: '100%', gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, paddingVertical: spacing.md, color: colors.navyText },
  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: { fontWeight: '700', color: colors.navyText },
});
