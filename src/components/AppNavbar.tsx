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
    logout();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.logoBlock}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>Melu'e Foundation</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => onTabPress?.(tab)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
            <View style={styles.profileText}>
              <Text style={typography.bodyBold} numberOfLines={1}>{userName}</Text>
              <Text style={typography.caption}>{roleLabel}</Text>
            </View>
            <Feather name="chevron-down" size={14} color={colors.mutedText} />
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
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoImage: { width: 28, height: 28 },
  logo: { fontWeight: '700', fontSize: 15, color: colors.navyText },
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
});