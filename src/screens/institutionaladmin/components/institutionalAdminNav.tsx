// screens/institutionaladmin/components/InstitutionalAdminNav.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { useAuth } from '../../../context/AuthContext';
import type { InstitutionalAdminStackParamList } from '../../../types';

const TABS = ['Admin Panel', 'Forms', 'Trial Logging', 'ABC Lists', 'Schedule', 'Goal Domains', 'Task Analysis', 'Programs', 'Clinic Info', 'Working Hours', 'Schools'];

export const IA_ROUTE_BY_TAB: Record<string, keyof InstitutionalAdminStackParamList> = {
  'Admin Panel': 'AdminPanelOverview',
  Forms: 'FormBuilder',
  'Trial Logging': 'TrialLoggingFormat',
  'ABC Lists': 'AbcDropdownLists',
  Schedule: 'ScheduleCapacityConfig',
  'Goal Domains': 'GoalDomainDefinitions',
  'Task Analysis': 'TaskAnalysisTemplates',
  Programs: 'ClinicalCategoriesConfig',
  'Clinic Info': 'ClinicInfoConfig',
  'Working Hours': 'WorkingHoursConfig',
  Schools: 'SchoolSettingsConfig',
};

interface InstitutionalAdminNavProps {
  activeTab: string;
  onTabPress?: (tab: string) => void;
}

export default function InstitutionalAdminNav({ activeTab, onTabPress }: InstitutionalAdminNavProps) {
  const { session, logout } = useAuth();
  return (
    <View style={styles.wrap}>
      <View style={styles.logoBlock}>
        <Image source={require('../../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>Melu'e Foundation</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity key={tab} style={[styles.tab, active && styles.tabActive]} onPress={() => onTabPress?.(tab)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.userBlock}>
        <View>
          <Text style={typography.bodyBold}>{session?.userName}</Text>
          <Text style={typography.caption}>Institutional Admin</Text>
        </View>
        <TouchableOpacity onPress={logout} accessibilityLabel="Log out">
          <Feather name="log-out" size={20} color={colors.navyText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.lg },
  logoBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoImage: { width: 28, height: 28 },
  logo: { fontWeight: '700', fontSize: 15, color: colors.navyText },
  tabsScroll: { flex: 1 },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryYellow },
  tabText: { fontWeight: '600', color: colors.bodyText, fontSize: 13 },
  tabTextActive: { color: colors.navyText },
  userBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
