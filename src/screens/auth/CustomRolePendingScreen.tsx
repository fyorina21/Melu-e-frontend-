import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../components/appNavConfig';
import { authApi } from '../../api/resources/auth';
import { useToast } from '../../context/ToastContext';
import type { Role } from '../../types';

export default function CustomRolePendingScreen() {
  const { session, logout } = useAuth();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(false);

  const role = (session?.role ?? 'staff') as Role;
  const roleLabel =
    ROLE_LABELS[role] ??
    (session?.role
      ? session.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Custom Role');

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      const user = await authApi.me();
      if (user?.modules && user.modules.length > 0) {
        showToast('Permissions have been updated! Reloading application...', 'success');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } else {
        showToast('No new permissions configured yet. Please check back later.', 'info');
      }
    } catch {
      showToast('Could not reach the server to verify permissions.', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="" />
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="shield" size={36} color={colors.primaryBlue} />
          </View>

          <Text style={[typography.h1, styles.title]}>Role Permissions Pending</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Welcome, <Text style={styles.bold}>{session?.userName || 'User'}</Text>. Your account
            has been assigned the <Text style={styles.badge}>{roleLabel}</Text> role, but no page
            permissions have been configured yet.
          </Text>

          <View style={styles.infoBox}>
            <Feather name="info" size={18} color={colors.primaryBlue} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>
              A System Administrator needs to grant access to pages for the{' '}
              <Text style={styles.bold}>{roleLabel}</Text> role in{' '}
              <Text style={styles.bold}>System Admin → Permission Configuration</Text>.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={handleCheckUpdates}
              disabled={checking}
              accessibilityRole="button"
              accessibilityLabel="Check for permission updates"
            >
              {checking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="refresh-cw" size={16} color="#FFFFFF" />
                  <Text style={styles.refreshBtnText}>Check for Updates</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={logout}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <Feather name="log-out" size={16} color={colors.navyText} />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(4),
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  bold: {
    fontWeight: '700',
    color: colors.navyText,
  },
  badge: {
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.navyText,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  refreshBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
});
