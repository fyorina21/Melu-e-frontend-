// screens/admin/AdminPanelOverviewScreen.tsx
// Landing dashboard shared by institutional admin ('clinical') and system
// admin ('system'). Shows a card for every page in that role's sidebar.
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { ROLE_TABS, IA_ROUTE_BY_TAB, SYS_ROUTE_BY_TAB } from '../../components/appNavConfig';

interface Props {
  navigation: { navigate: (name: string, params?: Record<string, unknown>) => void };
  route: { params?: { panel?: 'clinical' | 'system' } };
}

const CARD_ICONS = [
  'settings',
  'target',
  'calendar',
  'list',
  'edit-3',
  'file-text',
  'users',
  'shield',
  'activity',
] as const;

export default function AdminPanelOverviewScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const role = (session?.role ?? 'institutional_admin') as 'institutional_admin' | 'system_admin';
  const isSystem = role === 'system_admin';
  const routeMap = isSystem ? SYS_ROUTE_BY_TAB : IA_ROUTE_BY_TAB;

  const links = (ROLE_TABS[role] ?? [])
    .filter((tab) => tab !== 'Dashboard')
    .map((tab, i) => ({
      label: tab,
      route: routeMap[tab],
      icon: (CARD_ICONS[i % CARD_ICONS.length] as string) ?? 'grid',
    }));

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Feather name={isSystem ? 'server' : 'home'} size={20} color={colors.navyText} />
          <View style={{ flex: 1 }}>
            <Text style={typography.h1}>{isSystem ? 'System Administration' : 'Institutional Administration'}</Text>
            <Text style={typography.caption}>
              {isSystem
                ? 'Accounts, roles, permissions and audit overview'
                : 'Clinic configuration, templates and forms overview'}
              {route.params?.panel ? '' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {links.map((link) => (
            <TouchableOpacity key={link.label} style={styles.card} onPress={() => link.route && navigation.navigate(link.route)} activeOpacity={0.7}>
              <View style={styles.cardIcon}>
                <Feather name={link.icon as never} size={18} color={colors.navyText} />
              </View>
              <Text style={styles.cardLabel}>{link.label}</Text>
              <Feather name="chevron-right" size={14} color={colors.mutedText} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { flexGrow: 1, minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.navyText },
});
