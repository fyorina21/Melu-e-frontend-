// Persistent, in-flow sidebar used by institutional admin and system admin.
// Lists only that role's links and supports collapsing to an icon rail or hiding on mobile.

import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NavigationState } from '@react-navigation/native';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import { ROLE_TABS, ROLE_LABELS, routeMapForRole } from './appNavConfig';
import { SidebarNavContext } from '../navigation/SidebarNavContext';
import { useBreakpoint } from '../utils/useBreakpoint';
import type { Role } from '../types';

function activeRouteName(state: NavigationState | undefined): string | undefined {
  if (!state || state.routes == null) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (route?.state) return activeRouteName(route.state as NavigationState);
  return route?.name;
}

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  'Staff Accounts': 'users',
  'Staff account management': 'users',
  'Role Management': 'shield',
  'Permission Configuration': 'lock',
  'Audit Log': 'activity',
  'Goal Domains': 'target',
  'Task Analysis': 'check-square',
  'Schedule & Capacity': 'calendar',
  'ABC Dropdown Lists': 'list',
  'Trial Logging Format': 'check-circle',
  'Form Builder': 'file-plus',
};

export default function RoleSidebar({ role }: { role: Role }) {
  const { navRef, version, isCollapsed, toggleSidebar, setIsCollapsed } =
    useContext(SidebarNavContext);
  const bp = useBreakpoint();
  const isCompact = bp !== 'desktop';
  const tabs = ROLE_TABS[role] ?? [];
  const routeMap = routeMapForRole(role);

  const current = activeRouteName(navRef.current?.getState());
  void version; // re-render on navigation state changes
  const activeTab = current ? tabs.find((tab) => routeMap?.[tab] === current) : undefined;

  const handlePress = (tab: string) => {
    const route = routeMap?.[tab];
    if (route) {
      navRef.current?.navigate(route as never);
      if (isCompact) {
        setIsCollapsed(true);
      }
    }
  };

  // On compact/mobile screens, hide completely when collapsed
  if (isCompact && isCollapsed) {
    return null;
  }

  const isCollapsedDesktop = !isCompact && isCollapsed;

  if (isCollapsedDesktop) {
    return (
      <View style={[styles.sidebarCollapsed, Platform.OS === 'web' && styles.sidebarWebTransition]}>
        <View style={styles.headerRowCollapsed}>
          <TouchableOpacity
            onPress={toggleSidebar}
            style={styles.toggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Expand sidebar"
          >
            <Feather name="chevron-right" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
        <View style={styles.listCollapsed}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            const iconName = TAB_ICONS[tab] ?? 'circle';
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.itemCollapsed, active && styles.itemActiveCollapsed]}
                onPress={() => handlePress(tab)}
                accessibilityRole="tab"
                accessibilityLabel={tab}
                accessibilityState={{ selected: active }}
                {...(Platform.OS === 'web' ? { title: tab } : {})}
              >
                <Feather
                  name={iconName}
                  size={20}
                  color={active ? colors.navyText : colors.mutedText}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        isCompact ? styles.sidebarCompactOpen : styles.sidebar,
        Platform.OS === 'web' && styles.sidebarWebTransition,
      ]}
    >
      <View style={styles.headerRow}>
        {isCompact && (
          <View style={styles.compactBrand}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle} numberOfLines={1}>
              Melu'e
            </Text>
          </View>
        )}
        <Text style={styles.roleLabel} numberOfLines={1}>
          {ROLE_LABELS[role]}
        </Text>
        <TouchableOpacity
          onPress={toggleSidebar}
          style={styles.toggleBtn}
          accessibilityRole="button"
          accessibilityLabel={isCompact ? 'Close sidebar' : 'Collapse sidebar'}
        >
          <Feather name={isCompact ? 'x' : 'chevron-left'} size={18} color={colors.mutedText} />
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {tabs.map((tab) => {
          const active = tab === activeTab;
          const iconName = TAB_ICONS[tab] ?? 'circle';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => handlePress(tab)}
              accessibilityRole="tab"
              accessibilityLabel={tab}
              accessibilityState={{ selected: active }}
            >
              <View style={styles.itemContent}>
                <Feather
                  name={iconName}
                  size={16}
                  color={active ? colors.navyText : colors.mutedText}
                />
                <Text style={[styles.itemText, active && styles.itemTextActive]}>{tab}</Text>
              </View>
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
  sidebarCollapsed: {
    width: 68,
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    alignItems: 'center',
  },
  sidebarCompactOpen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    maxWidth: '85%',
    backgroundColor: colors.bgCard,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    zIndex: 300,
    ...makeShadow(8, 24, 0.25, '0, 0, 0', 16),
  },
  compactBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginRight: spacing.xs,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  sidebarWebTransition: {
    // Smooth transition on web
    ...({
      transition: 'width 0.2s ease, padding 0.2s ease',
    } as any),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    minHeight: 28,
  },
  headerRowCollapsed: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  toggleBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.xs,
  },
  listCollapsed: {
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  itemCollapsed: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  itemActive: {
    backgroundColor: colors.primaryYellow,
  },
  itemActiveCollapsed: {
    backgroundColor: colors.primaryYellow,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.bodyText,
  },
  itemTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
