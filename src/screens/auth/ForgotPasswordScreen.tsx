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

  const handleRequestCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestResetCode({ email: trimmedEmail });
      Alert.alert('Reset Code Sent', 'If an account exists with this email address, you will receive a verification code.');
      setStep('reset');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not send reset code. Please try again.';
      Alert.alert('Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please re-enter the same password in both fields.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), password: newPassword });
      setStep('done');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reset password. Please verify the code and try again.';
      Alert.alert('Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} disabled={loading}>
            <Feather name="arrow-left" size={16} color={colors.statusInProgressText} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          <Text style={typography.h1}>Reset Your Password</Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>
            {step === 'request' && 'Enter your account email and we’ll send a reset code.'}
            {step === 'reset' && 'Enter the reset code and choose a new password.'}
            {step === 'done' && 'Your password has been successfully reset.'}
          </Text>

          {step === 'request' && (
            <>
              <View style={styles.field}>
                <Text style={typography.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@domain.com"
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestCode} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'reset' && (
            <>
              <View style={styles.field}>
                <Text style={typography.label}>Reset Code</Text>
                <View style={styles.inputRow}>
                  <Feather name="key" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Verification code"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                    editable={!loading}
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={typography.label}>New Password</Text>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.mutedText}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!loading}
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={typography.label}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.mutedText}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
                <Text style={styles.primaryBtnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <>
              <Feather name="check-circle" size={48} color={colors.statusApprovedText} />
              <Text style={[typography.body, { textAlign: 'center' }]}>
                You can now sign in with your new password.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
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
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
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
