import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getProgramDirectorDashboard } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

interface PipelineStage {
  name: string;
  count: number;
}

interface ProgramDirectorDashboardData {
  unreadCount: number;
  studentsInAssessment: number;
  readyForIup: number;
  activeIupPlans: number;
  goalsAssignedThisMonth: number;
  pipeline: PipelineStage[];
  recentActivity: string[];
}

function StatCard({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.caption}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProgramDirectorDashboardScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'ProgramDirectorDashboard'>) {
  const [data, setData] = useState<ProgramDirectorDashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getProgramDirectorDashboard();
      setData(res);
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const goto = (tab: string) => navigation?.navigate?.(PD_ROUTE_BY_TAB[tab]);

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={typography.h1}>Program Director Dashboard</Text>
          <View style={styles.notifBell}>
            <Feather name="bell" size={18} color={colors.navyText} />
            {data.unreadCount > 0 && <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{data.unreadCount}</Text></View>}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Students in Assessment" value={data.studentsInAssessment} onPress={() => goto('Assessments')} />
          <StatCard label="Ready for IUP" value={data.readyForIup} onPress={() => goto('IUP')} />
          <StatCard label="Active IUP Plans" value={data.activeIupPlans} onPress={() => goto('Library')} />
          <StatCard label="Goals Assigned This Month" value={data.goalsAssignedThisMonth} onPress={() => goto('Caseload')} />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Assessment Pipeline</Text>
          <View style={styles.pipelineRow}>
            {data.pipeline.map((stage, i) => (
              <TouchableOpacity key={stage.name} style={styles.pipelineStage} onPress={() => goto('Assessments')}>
                <Text style={styles.pipelineCount}>{stage.count}</Text>
                <Text style={typography.caption}>{stage.name}</Text>
                {i < data.pipeline.length - 1 && <Feather name="arrow-right" size={14} color={colors.mutedText} style={styles.pipelineArrow} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Recent Activity</Text>
          {data.recentActivity.map((a, i) => (
            <Text key={i} style={[typography.body, styles.activityRow]}>{a}</Text>
          ))}
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Assessments')}>
            <Text style={typography.bodyBold}>Review Assessments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('IUP')}>
            <Text style={typography.bodyBold}>Generate IUP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Caseload')}>
            <Text style={typography.bodyBold}>Assign Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Clinical Quality')}>
            <Text style={typography.bodyBold}>View Goal Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => goto('Enrollment')}>
            <Text style={typography.bodyBold}>Enroll Student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifBell: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  pipelineRow: { flexDirection: 'row', gap: spacing.md },
  pipelineStage: { flex: 1, alignItems: 'center', backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md, position: 'relative' },
  pipelineCount: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pipelineArrow: { position: 'absolute', right: -18, top: '50%' },
  activityRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickActionCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.primaryYellow, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center' },
});
