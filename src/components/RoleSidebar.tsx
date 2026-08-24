// Persistent, in-flow sidebar used by institutional admin and system admin.
// It is always open, not closable, and lists only that role's links.
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NavigationState } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { ROLE_TABS, ROLE_LABELS, routeMapForRole } from './appNavConfig';
import { SidebarNavContext } from '../navigation/SidebarNavContext';
import type { Role } from '../types';

function activeRouteName(state: NavigationState | undefined): string | undefined {
  if (!state || state.routes == null) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (route?.state) return activeRouteName(route.state as NavigationState);
  return route?.name;
}

export default function RoleSidebar({ role }: { role: Role }) {
  const { navRef, version } = useContext(SidebarNavContext);
  const tabs = ROLE_TABS[role] ?? [];
  const routeMap = routeMapForRole(role);

  const current = activeRouteName(navRef.current?.getState());
  void version; // re-render on navigation state changes
  const activeTab = current
    ? tabs.find((tab) => routeMap?.[tab] === current)
    : undefined;

  const handlePress = (tab: string) => {
    const route = routeMap?.[tab];
    if (route) navRef.current?.navigate(route as never);
  };

  return (
    <View style={styles.sidebar}>
      <Text style={styles.roleLabel}>{ROLE_LABELS[role]}</Text>
      <View style={styles.list}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => handlePress(tab)}
            >
              <Text style={[styles.itemText, active && styles.itemTextActive]}>{tab}</Text>
              {active && <Feather name="chevron-right" size={14} color={colors.navyText} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.sm,
  },
  list: { gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  itemActive: { backgroundColor: colors.primaryYellow },
  itemText: { fontSize: 14, fontWeight: '500', color: colors.bodyText },
  itemTextActive: { fontWeight: '700', color: colors.navyText },
});
