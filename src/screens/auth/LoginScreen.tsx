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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth, DEMO_ACCOUNTS, EXTRA_ROLES } from '../../context/AuthContext';
import type { DemoAccount } from '../../types';

const ALL_DEMO_ACCOUNTS: DemoAccount[] = [...DEMO_ACCOUNTS, ...EXTRA_ROLES];

export default function LoginScreen() {
  const { loginAsRole } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<{ Login: undefined; ForgotPassword: undefined }>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSignIn = () => {
    const match = ALL_DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) {
      Alert.alert('Unknown demo account', 'Use one of the demo emails listed below (any password works).');
      return;
    }
    loginAsRole(match);
  };

  const handleDemoTap = (account: DemoAccount) => {
    setEmail(account.email);
    loginAsRole(account);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.foundationName}>Melu'e Foundation</Text>

          <Text style={typography.h1}>Sign In to Your Account</Text>
          <Text style={[typography.body, { textAlign: 'center' }]}>Melu'e Foundation Therapy Portal</Text>

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

          <View style={styles.field}>
            <Text style={typography.label}>Password</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={16} color={colors.mutedText} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember((r) => !r)}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
              <Text style={typography.body}>Remember this device</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signInBtn} onPress={handleSignIn}>
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={[typography.caption, { textAlign: 'center' }]}>Demo Accounts (any password)</Text>
          {ALL_DEMO_ACCOUNTS.map((account) => (
            <TouchableOpacity key={account.role} style={styles.demoRow} onPress={() => handleDemoTap(account)}>
              <Text style={typography.bodyBold}>{account.label}</Text>
              <Text style={styles.demoEmail}>{account.email}</Text>
            </TouchableOpacity>
          ))}
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
  logo: { width: 64, height: 64 },
  foundationName: { fontWeight: '700', fontSize: 16, color: colors.primaryYellowDark, marginBottom: spacing.sm },
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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 3 },
  checkboxChecked: { backgroundColor: colors.navyText, borderColor: colors.navyText },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 13 },
  signInBtn: { width: '100%', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  signInBtnText: { fontWeight: '700', color: colors.navyText },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  demoRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  demoEmail: { color: colors.mutedText, fontSize: 13 },
});
