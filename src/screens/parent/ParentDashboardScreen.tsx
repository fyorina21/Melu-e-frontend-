import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import ParentNav, { PARENT_ROUTE_BY_TAB } from './components/ParentNav';
import { useAuth } from '../../context/AuthContext';
import { getParentDashboard } from '../../api/parentApi';
import type { ParentStackParamList } from '../../types';

interface ParentDashboardData {
  unreadCount: number;
  childName: string;
  sessionsThisMonth: number;
  avgIndependence: number;
  recentUpdates: string[];
  latestMessage: { senderLabel: string; preview: string };
}

export default function ParentDashboardScreen({ navigation }: NativeStackScreenProps<ParentStackParamList, 'ParentDashboard'>) {
  const { session } = useAuth();
  const [data, setData] = useState<ParentDashboardData | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getParentDashboard();
      setData(res);
    } catch (err) {
      setData(DEMO_DATA);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goto = (tab: string) => navigation?.navigate?.(PARENT_ROUTE_BY_TAB[tab]);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ParentNav activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={typography.h1}>Welcome, {session?.userName?.split(' ')[0] || 'Parent'}!</Text>
          <TouchableOpacity style={styles.notifBell} onPress={() => navigation?.navigate?.('Notifications')}>
            <Feather name="bell" size={18} color={colors.navyText} />
            {data.unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{data.unreadCount}</Text></View>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>{data.childName}'s Progress</Text>
          <Text style={typography.body}>{data.sessionsThisMonth} sessions this month · {data.avgIndependence}% average independence</Text>
          <TouchableOpacity onPress={() => goto('Progress')}>
            <Text style={styles.linkText}>View Full Progress →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Recent Updates</Text>
          {data.recentUpdates.map((u, i) => (
            <Text key={i} style={[typography.body, styles.updateRow]}>{u}</Text>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h3}>Latest Message</Text>
            <TouchableOpacity onPress={() => goto('Messages')}>
              <Text style={styles.linkText}>Open →</Text>
            </TouchableOpacity>
          </View>
          <Text style={typography.body}>{data.latestMessage.senderLabel}: {data.latestMessage.preview}</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Progress')}>
            <Feather name="trending-up" size={20} color={colors.navyText} />
            <Text style={typography.bodyBold}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Observations')}>
            <Feather name="edit-3" size={20} color={colors.navyText} />
            <Text style={typography.bodyBold}>Log Observation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Messages')}>
            <Feather name="message-circle" size={20} color={colors.navyText} />
            <Text style={typography.bodyBold}>Messages</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEMO_DATA: ParentDashboardData = {
  unreadCount: 2,
  childName: 'Student A',
  sessionsThisMonth: 8,
  avgIndependence: 62,
  recentUpdates: [
    'New goal mastered: Identify Colors (pending final approval)',
    'Session summary available for Aug 11, 2026',
  ],
  latestMessage: { senderLabel: 'Coordinator', preview: 'Great progress on requesting items!' },
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifBell: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 12 },
  updateRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  quickActionsGrid: { flexDirection: 'row', gap: spacing.md },
  quickActionCard: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', gap: spacing.xs },
});
