// The single, unified app navbar used by every role. It renders the logo,
// the role's tab set (from appNavConfig), a notification bell (only when the
// role has a notifications screen to navigate to), and a profile dropdown
// with the user's name, role, and a Log out action.
//
// Screens only need to pass `activeTab` and `onTabPress` — everything else is
// derived from the auth session.
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import { ROLE_TABS, ROLE_LABELS, ROLE_NOTIFICATION_ROUTE } from './appNavConfig';
import { useBreakpoint } from '../utils/useBreakpoint';
import type { Role } from '../types';

interface AppNavbarProps {
  activeTab: string;
  onTabPress?: (tab: string) => void;
  unreadCount?: number;
}

export default function AppNavbar({ activeTab, onTabPress, unreadCount = 0 }: AppNavbarProps) {
  const { session, logout } = useAuth();
  const navigation = useNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bp = useBreakpoint();
  const isCompact = bp !== 'desktop';

  const role = (session?.role ?? 'teacher') as Role;
  const tabs = ROLE_TABS[role] ?? [];
  const roleLabel = ROLE_LABELS[role] ?? '';
  const userName = session?.userName ?? 'User';
  const initial = userName.charAt(0).toUpperCase() || 'U';
  const notificationRoute = ROLE_NOTIFICATION_ROUTE[role];

  const openNotifications = () => {
    if (!notificationRoute) return;
    navigation?.navigate?.(notificationRoute as never);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setDrawerOpen(false);
    logout();
  };

  const handleTabPress = (tab: string) => {
    setDrawerOpen(false);
    onTabPress?.(tab);
  };

  const renderTabs = () => (
    <View style={styles.tabs}>
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, isCompact && styles.wrapCompact]}>
      <View style={styles.logoBlock}>
        {isCompact && (
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.hamburgerBtn} accessibilityLabel="Open menu">
            <Feather name="menu" size={20} color={colors.navyText} />
          </TouchableOpacity>
        )}
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>Melu'e Foundation</Text>
      </View>

      {!isCompact && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {renderTabs()}
        </ScrollView>
      )}

      <View style={styles.rightBlock}>
        {notificationRoute && (
          <TouchableOpacity onPress={openNotifications} style={styles.iconBtn} accessibilityLabel="Notifications">
            <Feather name="bell" size={18} color={colors.navyText} />
            {unreadCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.profileWrap}>
          <TouchableOpacity onPress={() => setMenuOpen((v) => !v)} style={styles.profileBtn} accessibilityLabel="Profile menu">
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            {!isCompact && (
              <>
                <View style={styles.profileText}>
                  <Text style={typography.bodyBold} numberOfLines={1}>{userName}</Text>
                  <Text style={typography.caption}>{roleLabel}</Text>
                </View>
                <Feather name="chevron-down" size={14} color={colors.mutedText} />
              </>
            )}
          </TouchableOpacity>

          <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
            <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
              <View style={styles.menuCard}>
                <View style={styles.menuHeader}>
                  <View style={[styles.avatar, styles.menuAvatar]}><Text style={styles.avatarText}>{initial}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{userName}</Text>
                    <Text style={typography.caption}>{roleLabel}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Feather name="log-out" size={16} color={colors.navyText} />
                  <Text style={styles.menuItemText}>Log out</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </View>
      </View>

      <Modal transparent visible={drawerOpen} animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.logo}>Melu'e Foundation</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)} style={styles.drawerClose} accessibilityLabel="Close menu">
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.drawerList}>
              {tabs.map((tab) => {
                const active = tab === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.drawerItem, active && styles.drawerItemActive]}
                    onPress={() => handleTabPress(tab)}
                  >
                    <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{tab}</Text>
                    {active && <Feather name="chevron-right" size={14} color={colors.navyText} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.drawerLogout} onPress={handleLogout}>
                <Feather name="log-out" size={16} color={colors.navyText} />
                <Text style={styles.drawerLogoutText}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Pressable style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.lg,
  },
  wrapCompact: { gap: spacing.sm, justifyContent: 'space-between' },
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoImage: { width: 28, height: 28 },
  logo: { fontWeight: '700', fontSize: 15, color: colors.navyText },
  hamburgerBtn: { padding: spacing.xs },
  tabsScroll: { flex: 1 },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryYellow },
  tabText: { fontWeight: '600', color: colors.bodyText, fontSize: 13 },
  tabTextActive: { color: colors.navyText },
  rightBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBtn: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  profileWrap: { position: 'relative' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', color: colors.navyText, fontSize: 14 },
  profileText: { maxWidth: 120 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 60, paddingRight: spacing.lg },
  menuCard: {
    minWidth: 220,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    padding: spacing.md,
    gap: spacing.xs,
  },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuAvatar: { width: 40, height: 40, borderRadius: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, borderRadius: radius.md },
  menuItemText: { fontSize: 14, fontWeight: '600', color: colors.navyText },

  drawerRoot: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' },
  drawerOverlay: { flex: 1 },
  drawer: { width: 300, backgroundColor: colors.bgCard, height: '100%', padding: spacing.md, flexDirection: 'column' },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  drawerClose: { marginLeft: 'auto', padding: spacing.xs },
  drawerList: { paddingVertical: spacing.sm, gap: spacing.xs },
  drawerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
  drawerItemActive: { backgroundColor: colors.primaryYellow, borderRadius: radius.md },
  drawerItemText: { fontSize: 14, fontWeight: '500', color: colors.bodyText },
  drawerItemTextActive: { fontWeight: '700', color: colors.navyText },
  drawerFooter: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  drawerLogout: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  drawerLogoutText: { fontSize: 14, fontWeight: '600', color: colors.navyText },
});