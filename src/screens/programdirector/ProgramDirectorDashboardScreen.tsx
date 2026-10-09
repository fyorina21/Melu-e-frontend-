// src/screens/programdirector/ProgramDirectorDashboardScreen.tsx
// SCR-PD-001: Program Director Dashboard

import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getProgramDirectorDashboard } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';
import { filterStudents, type DashboardData } from './dashboard/dashboardTypes';
import {
  PdDashboardHeader,
  PdStatsGrid,
  PdWorkflowPipelineCard,
  PdStudentProgressTable,
  PdQuickActionsCard,
  PdClinicalOverviewCard,
  PdRecentActivityCard,
} from './dashboard/components';

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'ProgramDirectorDashboard'>;

export default function ProgramDirectorDashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showNotif, setShowNotif] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getProgramDirectorDashboard();
      setData(res);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const goto = (tab: string) => navigation?.navigate?.(PD_ROUTE_BY_TAB[tab]);

  if (loadError) return <ScreenError onRetry={load} />;
  if (!data) return <ScreenLoader />;

  const stages = data.workflowStages ?? [];
  const allStudents = data.students ?? [];
  const filteredStudents = filterStudents(allStudents, filter, search);
  const notifications = data.notifications ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}>
        <View style={[styles.contentWrapper, isTablet && styles.tabletWrapper]}>
          <PdDashboardHeader
            notifications={notifications}
            showNotif={showNotif}
            onToggleNotif={() => setShowNotif((v) => !v)}
            onCloseNotif={() => setShowNotif(false)}
          />

          <PdStatsGrid
            totalStudents={data.totalStudents}
            inAssessment={data.inAssessment}
            assessmentCompleted={data.assessmentCompleted}
            readyForSessions={data.readyForSessions}
            onPressCard={() => goto('Assessment Review')}
          />

          <PdWorkflowPipelineCard stages={stages} />

          <PdStudentProgressTable
            students={filteredStudents}
            filter={filter}
            search={search}
            onSelectFilter={setFilter}
            onSearchChange={setSearch}
          />

          <View style={[styles.bottomRow, isTablet && styles.bottomRowTablet]}>
            <View style={styles.bottomCardWrapper}>
              <PdQuickActionsCard onNavigateTab={goto} />
            </View>
            <View style={styles.bottomCardWrapper}>
              <PdClinicalOverviewCard overview={data.clinicalOverview} />
            </View>
          </View>

          <PdRecentActivityCard recentActivity={data.recentActivity ?? []} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabletContent: {
    padding: spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    gap: spacing.md,
  },
  tabletWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  bottomRow: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  bottomRowTablet: {
    flexDirection: 'row',
  },
  bottomCardWrapper: {
    flex: 1,
  },
});
