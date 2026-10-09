import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing, shadows } from '../../theme';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { loginWithCredentials } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ Login: undefined; ForgotPassword: undefined }>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const passwordInputRef = React.useRef<TextInput>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter both your email address and password.');
      return;
    }
    setSubmitting(true);
    try {
      await loginWithCredentials(email, password, remember);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.foundationName}>Melu'e Foundation</Text>

          <Text accessibilityRole="header" style={typography.h1}>
            Sign In to Your Account
          </Text>
          <Text accessibilityRole="text" style={[typography.body, { textAlign: 'center' }]}>
            Melu'e Foundation Therapy Portal
          </Text>

          <View style={styles.field}>
            <Text nativeID="emailLabel" style={typography.label}>
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
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
                value={email}
                onChangeText={setEmail}
                editable={!submitting}
                accessibilityLabel="Email Address"
                aria-label="Email Address"
                aria-labelledby="emailLabel"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text nativeID="passwordLabel" style={typography.label}>
              Password
            </Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={16} color={colors.mutedText} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
                value={password}
                onChangeText={setPassword}
                editable={!submitting}
                accessibilityLabel="Password"
                aria-label="Password"
                aria-labelledby="passwordLabel"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((p) => !p)}
                disabled={submitting}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityState={{ selected: showPassword }}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.mutedText}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((r) => !r)}
              disabled={submitting}
              accessibilityRole="checkbox"
              accessibilityLabel="Remember this device"
              accessibilityState={{ checked: remember, disabled: submitting }}
            >
              <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
              <Text style={typography.body}>Remember this device</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={submitting}
              accessibilityRole="link"
              accessibilityLabel="Forgot Password? Navigate to password recovery"
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInBtn, submitting && styles.signInBtnDisabled]}
            onPress={handleSignIn}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
            accessibilityState={{ busy: submitting, disabled: submitting }}
          >
            {submitting ? (
              <ActivityIndicator color={colors.navyText} size="small" />
            ) : (
              <Text style={styles.signInBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  logo: { width: 64, height: 64 },
  foundationName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primaryYellowDark,
    marginBottom: spacing.sm,
  },
  field: { width: '100%', gap: spacing.xs },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: { flex: 1, paddingVertical: spacing.md, color: colors.navyText, fontSize: 14 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.navyText, borderColor: colors.navyText },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 13 },
  signInBtn: {
    width: '100%',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.sm,
  },
  signInBtnDisabled: { opacity: 0.7 },
  signInBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 15 },
});
