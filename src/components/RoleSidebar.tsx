// Persistent, in-flow sidebar used by institutional admin and system admin.
// Lists only that role's links and supports collapsing to an icon rail or hiding on mobile.

import React, { useContext, useState } from 'react';
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
import {
  ROLE_TABS,
  ROLE_LABELS,
  routeMapForRole,
  getTabsForSession,
  getSidebarSectionsForSession,
} from './appNavConfig';
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

  // System Administration
  'Staff Account Management': 'users',
  'Staff Accounts': 'users',
  'Staff account management': 'users',
  'Staff Management': 'users',
  Staff: 'users',
  'Role Management': 'shield',
  Roles: 'shield',
  'Permission Configuration (RBAC)': 'lock',
  'Permission Configuration': 'lock',
  Permissions: 'lock',
  'System Audit Log': 'activity',
  'Audit Log': 'activity',
  'Audit Logs': 'activity',
  Audit: 'activity',

  // Institutional Administration
  'Schedule & Capacity Configuration': 'calendar',
  'Schedule & Capacity': 'calendar',
  'Form Builder': 'file-plus',
  'Assessment & Form Builder': 'file-plus',
  Forms: 'file-plus',
  'ABC Dropdown Lists': 'list',
  'ABC Lists': 'list',
  'Trial Logging Format Config': 'check-circle',
  'Trial Logging Format': 'check-circle',
  'Trial Logging': 'check-circle',
  'Goal Bank / Domains': 'target',
  'Goal Domains': 'target',
  Goals: 'target',
  'Task Analysis': 'check-square',
  'Task Analysis Templates': 'check-square',

  // Student Intake & Enrollment
  'Student Enrollment Wizard': 'user-plus',
  'Enrollment Wizard': 'user-plus',
  Enrollment: 'user-plus',
  'Student Register & Roster List': 'user-check',
  'Student Register': 'user-check',
  'Registered Student': 'user-check',
  'Registered Students': 'user-check',
  'Student Registration': 'user-check',

  // Assessments
  'Assessment Dashboard': 'clipboard',
  Assessments: 'clipboard',
  'Assessment Review & Sign-Off': 'check-circle',
  'Assessment Review': 'check-circle',
  'Assessment Summary Report': 'file-text',

  // IUP & Goals
  'IUP Creation & Goal Assignment': 'plus-circle',
  'IUP Library Management': 'book',
  'Student Caseload Management': 'users',
  'Goal Bank': 'activity',
  'Clinical Quality Monitoring': 'activity',

  // Active Therapy & Clinical Delivery
  'Session Data Collection': 'play-circle',
  Session: 'play-circle',
  'Active Therapy': 'play-circle',
  'Daily Session Notes': 'file-text',
  'Daily Notes': 'file-text',
  'ABC Behavior Incident Log': 'alert-triangle',
  'ABC Log': 'alert-triangle',
  'Live Session Monitoring': 'video',
  'Live Sessions': 'video',
  'Session Summary Review': 'clipboard',
  'Session Summary': 'clipboard',
  'Goal Mastery Approval': 'award',

  // Operations & Scheduling
  'Staff Scheduling & Capacity': 'clock',
  'Staff Scheduling': 'clock',
  'Staff Workload & Therapist Linking': 'users',
  'Staff Management & Linking': 'users',
  Workload: 'users',
  'Room Resource Scheduling': 'map-pin',
  'Operational Management': 'calendar',

  // Family Engagement & Parent Portal
  'Parent Communication': 'message-circle',
  'Parent Communication (Messages)': 'message-circle',
  Parents: 'message-circle',
  Messages: 'message-circle',
  'Child Progress Tracker': 'trending-up',
  Progress: 'trending-up',
  'Home Observation Log': 'eye',
  Observations: 'eye',

  // Executive Oversight
  'Reports & Executive Oversight': 'bar-chart-2',
  'Reports & Oversight': 'bar-chart-2',
  'Report & Oversight': 'bar-chart-2',
  Reports: 'bar-chart-2',
  'Custom Report Builder': 'file-text',
  'Report Builder': 'file-text',
  'Clinical Progress Charts': 'trending-up',
  'Student Progress': 'trending-up',
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

  const sections = getSidebarSectionsForSession(session, role);
  const routeMap = routeMapForRole(role);
  const hasDashboard = (ROLE_TABS[role] ?? []).includes('Dashboard');

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const current = activeRouteName(navRef.current?.getState());
  void version; // re-render on navigation state changes

  const isDashboardActive =
    current === 'TeacherDashboard' ||
    current === 'CoordinatorDashboard' ||
    current === 'DirectorDashboard' ||
    current === 'ProgramDirectorDashboard' ||
    current === 'ParentDashboard' ||
    current === routeMap?.['Dashboard'];

  const isItemActive = (label: string, route: string) => {
    return current === route || routeMap?.[label] === current;
  };

  const handlePress = (tab: string, targetRoute?: string) => {
    const route = targetRoute || routeMap?.[tab];
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
          {hasDashboard && (
            <TouchableOpacity
              style={[styles.itemCollapsed, isDashboardActive && styles.itemActiveCollapsed]}
              onPress={() => handlePress('Dashboard')}
              accessibilityRole="tab"
              accessibilityLabel="Dashboard"
              accessibilityState={{ selected: isDashboardActive }}
              {...(Platform.OS === 'web' ? { title: 'Dashboard' } : {})}
            >
              <Feather
                name="home"
                size={20}
                color={isDashboardActive ? colors.navyText : colors.mutedText}
              />
            </TouchableOpacity>
          )}

          {sections.map((section, sIdx) => (
            <React.Fragment key={section.title}>
              {(sIdx > 0 || hasDashboard) && <View style={styles.collapsedDivider} />}
              {section.items.map((item) => {
                const active = isItemActive(item.label, item.route);
                const iconName = TAB_ICONS[item.label] ?? 'circle';
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.itemCollapsed, active && styles.itemActiveCollapsed]}
                    onPress={() => handlePress(item.label, item.route)}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                    {...(Platform.OS === 'web' ? { title: item.label } : {})}
                  >
                    <Feather
                      name={iconName}
                      size={20}
                      color={active ? colors.navyText : colors.mutedText}
                    />
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          ))}
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
        {hasDashboard && (
          <TouchableOpacity
            style={[styles.item, isDashboardActive && styles.itemActive]}
            onPress={() => handlePress('Dashboard')}
            accessibilityRole="tab"
            accessibilityLabel="Dashboard"
            accessibilityState={{ selected: isDashboardActive }}
          >
            <View style={styles.itemContent}>
              <Feather
                name="home"
                size={16}
                color={isDashboardActive ? colors.navyText : colors.mutedText}
              />
              <Text style={[styles.itemText, isDashboardActive && styles.itemTextActive]}>
                Dashboard
              </Text>
            </View>
            {isDashboardActive && (
              <Feather name="chevron-right" size={14} color={colors.navyText} />
            )}
          </TouchableOpacity>
        )}

        {sections.map((section) => {
          const isExpanded = !collapsedSections[section.title];
          return (
            <View key={section.title} style={styles.sectionContainer}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.title)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${section.title}, ${isExpanded ? 'collapse section' : 'expand section'}`}
              >
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {section.title}
                </Text>
                <Feather
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={13}
                  color={colors.mutedText}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionItems}>
                  {section.items.map((item) => {
                    const active = isItemActive(item.label, item.route);
                    const iconName = TAB_ICONS[item.label] ?? 'circle';
                    return (
                      <TouchableOpacity
                        key={item.label}
                        style={[styles.item, active && styles.itemActive]}
                        onPress={() => handlePress(item.label, item.route)}
                        accessibilityRole="tab"
                        accessibilityLabel={item.label}
                        accessibilityState={{ selected: active }}
                      >
                        <View style={styles.itemContent}>
                          <Feather
                            name={iconName}
                            size={16}
                            color={active ? colors.navyText : colors.mutedText}
                          />
                          <Text style={[styles.itemText, active && styles.itemTextActive]}>
                            {item.label}
                          </Text>
                        </View>
                        {active && (
                          <Feather name="chevron-right" size={14} color={colors.navyText} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
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
  sectionContainer: {
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer', userSelect: 'none' } as any) : {}),
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionItems: {
    gap: 2,
    marginTop: 2,
  },
  collapsedDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: 32,
    marginVertical: spacing.xs,
    alignSelf: 'center',
  },
});
