// Persistent, in-flow sidebar used by institutional admin and system admin.
// Lists only that role's links and supports collapsing to an icon rail or hiding on mobile.

import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NavigationState } from '@react-navigation/native';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import { ROLE_TABS, ROLE_LABELS, routeMapForRole, getTabsForSession } from './appNavConfig';
import { SidebarNavContext } from '../navigation/SidebarNavContext';
import { useBreakpoint } from '../utils/useBreakpoint';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

function activeRouteName(state: NavigationState | undefined): string | undefined {
  if (!state || state.routes == null) return undefined;
  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (route?.state) return activeRouteName(route.state as NavigationState);
  return route?.name;
}

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Dashboard: 'home',
  'Director Dashboard': 'home',
  'Coordinator Dashboard': 'home',
  'Teacher Dashboard': 'home',
  'PD Dashboard': 'home',
  'Parent Dashboard': 'home',
  Overview: 'home',
  Home: 'home',
  Notifications: 'bell',
  'Staff Accounts': 'users',
  'Staff account management': 'users',
  'Staff Management': 'users',
  'Role Management': 'shield',
  'Permission Configuration': 'lock',
  'Audit Log': 'activity',
  Goals: 'target',
  'Goal Domains': 'target',
  'Task Analysis': 'check-square',
  'Task Analysis Templates': 'check-square',
  'Schedule & Capacity': 'calendar',
  'ABC Dropdown Lists': 'list',
  'Trial Logging Format': 'check-circle',
  'Form Builder': 'file-plus',
  'Reports & Oversight': 'bar-chart-2',
  'Report & Oversight': 'bar-chart-2',
  Reports: 'bar-chart-2',
  'Report Builder': 'file-text',
  'Clinical Progress Charts': 'trending-up',
  'Staff Scheduling': 'clock',
  'Operational Management': 'calendar',
  'Staff Management & Linking': 'users',
  'Room Resource Scheduling': 'map-pin',
  'Live Sessions': 'video',
  Session: 'play-circle',
  'Active Therapy': 'play-circle',
  'Daily Notes': 'file-text',
  'Session Summary': 'clipboard',
  'Session Summary Review': 'clipboard',
  Assessments: 'clipboard',
  'Assessment Dashboard': 'clipboard',
  'Assessment Review': 'check-circle',
  'Assessment Summary Report': 'file-text',
  'IUP Creation & Goal Assignment': 'plus-circle',
  'Goal Mastery Approval': 'award',
  'IUP Library Management': 'book',
  'Clinical Quality Monitoring': 'activity',
  'ABC Log': 'alert-triangle',
  Parents: 'message-circle',
  'Parent Communication': 'message-circle',
  Messages: 'message-circle',
  Progress: 'trending-up',
  Observations: 'eye',
  'Student Progress': 'trending-up',
  'Enrollment Wizard': 'user-plus',
  'Student Enrollment Wizard': 'user-plus',
  'Student Register': 'user-check',
  'Registered Student': 'user-check',
  'Registered Students': 'user-check',
  'Student Registration': 'user-check',
  'Student Caseload Management': 'users',
  'Student Profile': 'user',
};

import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import { confirmAction } from '../utils/dialogs';

export default function RoleSidebar({ role }: { role: Role }) {
  const { navRef, version, isCollapsed, toggleSidebar, setIsCollapsed } =
    useContext(SidebarNavContext);
  const { session } = useAuth();
  const { isDirty, setDirty } = useUnsavedChanges();
  const bp = useBreakpoint();
  const isCompact = bp !== 'desktop';
  const defaultTabs = ROLE_TABS[role] ?? [];
  const tabs = getTabsForSession(session, defaultTabs);
  const routeMap = routeMapForRole(role);

  const current = activeRouteName(navRef.current?.getState());
  void version; // re-render on navigation state changes
  const activeTab = current ? tabs.find((tab) => routeMap?.[tab] === current) : undefined;

  const handlePress = (tab: string) => {
    const route = routeMap?.[tab];
    if (route) {
      if (isDirty) {
        confirmAction({
          title: 'Unsaved Changes',
          message:
            'You have unsaved changes on this page. If you leave now, your modifications will be lost. Are you sure you want to navigate away?',
          confirmLabel: 'Leave without saving',
          cancelLabel: 'Keep Editing',
          destructive: true,
          onConfirm: () => {
            setDirty(false);
            navRef.current?.navigate(route as never);
            if (isCompact) {
              setIsCollapsed(true);
            }
          },
        });
        return;
      }
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
        <ScrollView
          style={styles.listCollapsedScroll}
          contentContainerStyle={styles.listCollapsed}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
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
          {ROLE_LABELS[role] || (session as any)?.roleTitle || session?.role || 'Staff'}
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
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
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
  listScroll: {
    flex: 1,
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  listCollapsedScroll: {
    flex: 1,
    width: '100%',
  },
  listCollapsed: {
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
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
