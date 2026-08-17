import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

interface TopNavProps {
  activeTab: string;
  onTabPress?: (tab: string) => void;
  userName?: string;
  role?: string;
  onLogout?: () => void;
}

// NOTE: Scheduling and Attendance are added here beyond the Figma's
// original 6 tabs — those two screens didn't exist when Figma was built
// (they came from the later requirements doc, MR-38/MR-40), but they're
// real built screens and need a way to be reached.
const TABS = ['Dashboard', 'Session', 'Assessments', 'Daily Notes', 'ABC Log', 'Scheduling', 'Attendance', 'Notifications', 'Parents'];

export default function TopNav({
  activeTab,
  onTabPress,
  userName = 'Teacher A',
  role = 'Teacher',
  onLogout,
}: TopNavProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.logoBlock}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>Melu'e Foundation</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
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

      <View style={styles.userBlock}>
        <View>
          <Text style={typography.bodyBold}>{userName}</Text>
          <Text style={typography.caption}>{role}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} accessibilityLabel="Log out">
          <Feather name="log-out" size={20} color={colors.navyText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primaryYellow },
  tabText: { fontWeight: '600', color: colors.bodyText, fontSize: 13 },
  tabTextActive: { color: colors.navyText },
  userBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoutBtn: { padding: spacing.xs },
});
