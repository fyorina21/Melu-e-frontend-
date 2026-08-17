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
import { DEMO_ACCOUNTS, EXTRA_ROLES } from '../../context/AuthContext';
import { resetPassword, requestResetCode } from '../../api/sessionApi';

type RootStackParamList = { Login: undefined; ForgotPassword: undefined };

const DEMO_RESET_CODE = '123456';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestCode = async () => {
    const known = [...DEMO_ACCOUNTS, ...EXTRA_ROLES].some(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!email.trim() || !known) {
      Alert.alert('Unknown email', 'Enter one of the demo account emails shown on the login screen.');
      return;
    }
    try {
      await requestResetCode({ email });
    } catch (err) {}
    Alert.alert('Reset code sent', `Your reset code is ${DEMO_RESET_CODE}`);
    setStep('reset');
  };

  const handleReset = async () => {
    if (code.trim() !== DEMO_RESET_CODE) {
      Alert.alert('Invalid code', `Enter the reset code we sent (demo: ${DEMO_RESET_CODE}).`);
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter the same password in both fields.');
      return;
    }
    try {
      await resetPassword({ email, code, password: newPassword });
    } catch (err) {}
    setStep('done');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={16} color={colors.statusInProgressText} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>

          <Text style={typography.h1}>Reset Your Password</Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>
            {step === 'request' && 'Enter your account email and we\u2019ll send a reset code.'}
            {step === 'reset' && 'Enter the reset code and choose a new password.'}
            {step === 'done' && 'Your password has been reset.'}
          </Text>

          {step === 'request' && (
            <>
              <View style={styles.field}>
                <Text style={typography.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={16} color={colors.mutedText} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@melue.org"
                    placeholderTextColor={colors.mutedText}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestCode}>
                <Text style={styles.primaryBtnText}>Send Reset Code</Text>
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
                    placeholder="6-digit code"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
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
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReset}>
                <Text style={styles.primaryBtnText}>Reset Password</Text>
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
