// screens/director/ReportsOversightScreen.js
// SCR-DIR-005: Reports & Oversight

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DirectorNav, { DIRECTOR_ROUTE_BY_TAB } from './components/DirectorNav';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getSessionReports, generateBiAnnualReport, getFoundationOverview } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

const REPORT_TABS: string[] = ['Session Reports', 'Bi-Annual Reports', 'Student Progress', 'Foundation Overview'];

interface SessionReport {
  id: string;
  date: string;
  teacherName: string;
  studentNames: string[];
}

interface FoundationOverview {
  totalStudents: number;
  totalTeachers: number;
  sessionsThisMonth: number;
  avgGoalProgress: number;
}

export default function ReportsOversightScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList, 'ReportsOversight'>) {
  const [activeTab, setActiveTab] = useState('Session Reports');
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [overview, setOverview] = useState<FoundationOverview | null>(null);
  const [biAnnualContent, setBiAnnualContent] = useState<string | null>(null);
  const [overviewContent, setOverviewContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionReports({});
      setSessionReports(data);
    } catch (err) {
      setSessionReports(DEMO_SESSION_REPORTS);
    }
    try {
      const { data } = await getFoundationOverview();
      setOverview(data);
    } catch (err) {
      setOverview(DEMO_OVERVIEW);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const buildBiAnnualText = (): string => {
    const lines: string[] = [];
    lines.push('BI-ANNUAL REPORT — MELUE FOUNDATION');
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('6-month progress summary across all active students.');
    lines.push('');
    lines.push('Active Students (subset)');
    sessionReports.forEach((r) => {
      lines.push(`- ${r.studentNames.join(', ')} — teacher ${r.teacherName}, latest summary ${r.date}`);
    });
    lines.push('');
    lines.push('This draft reflects the report content generated in-app; final formatting is handled by the file-service when a backend exists.');
    return lines.join('\n');
  };

  const handleGenerateBiAnnual = async () => {
    try {
      await generateBiAnnualReport({});
    } catch (err) {}
    setBiAnnualContent(buildBiAnnualText());
  };

  const handlePreview = () => setBiAnnualContent(buildBiAnnualText());
  const handleDownload = () => setBiAnnualContent(buildBiAnnualText());
  const handleEmailParent = () => Alert.alert('Email Report to Parent', 'Uses Parent Communication - not wired up yet (stub).');
  const handleExportOverview = () => {
    if (!overview) return;
    setOverviewContent(
      [
        'FOUNDATION-WIDE ANALYTICS',
        `Total Students: ${overview.totalStudents}`,
        `Total Teachers: ${overview.totalTeachers}`,
        `Sessions This Month: ${overview.sessionsThisMonth}`,
        `Avg Goal Progress: ${overview.avgGoalProgress}%`,
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DirectorNav activeTab="Reports" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Reports & Oversight</Text>
      </View>

      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {REPORT_TABS.map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={typography.body}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'Session Reports' && (
          <View style={styles.card}>
            <Text style={typography.h3}>Submitted Session Summaries</Text>
            {sessionReports.map((r) => (
              <View key={r.id} style={styles.reportRow}>
                <Text style={typography.body}>{r.date} — {r.teacherName} — {r.studentNames.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Bi-Annual Reports' && (
          <View style={styles.card}>
            <Text style={typography.h3}>Bi-Annual Report Generator</Text>
            <Text style={typography.body}>Generates a 6-month progress summary across all active students.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerateBiAnnual}>
              <Text style={styles.primaryBtnText}>Generate Report</Text>
            </TouchableOpacity>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handlePreview}><Text style={styles.secondaryBtnText}>Preview Report</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload}><Text style={styles.secondaryBtnText}>Export / Download</Text></TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleEmailParent}><Text style={styles.secondaryBtnText}>Email to Parent</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'Student Progress' && (
          <View style={styles.card}>
            <Text style={typography.h3}>Student Progress Chart</Text>
            <Text style={typography.body}>Select a student from the Progress tab to view their detailed goal chart.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation?.navigate?.('DirectorStudentProgress')}>
              <Text style={styles.secondaryBtnText}>Go to Student Progress Monitoring</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Foundation Overview' && overview && (
          <View style={styles.card}>
            <Text style={typography.h3}>Foundation-Wide Analytics</Text>
            <Text style={typography.body}>Total Students: {overview.totalStudents}</Text>
            <Text style={typography.body}>Total Teachers: {overview.totalTeachers}</Text>
            <Text style={typography.body}>Sessions This Month: {overview.sessionsThisMonth}</Text>
            <Text style={typography.body}>Avg Goal Progress: {overview.avgGoalProgress}%</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportOverview}>
              <Text style={styles.secondaryBtnText}>Export Overview</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ExportPreviewModal
        visible={!!biAnnualContent}
        title="Bi-Annual Report"
        filename={`BiAnnualReport_${new Date().toISOString().slice(0, 10)}.txt`}
        content={biAnnualContent ?? ''}
        onClose={() => setBiAnnualContent(null)}
      />

      <ExportPreviewModal
        visible={!!overviewContent}
        title="Foundation Overview"
        filename={`FoundationOverview_${new Date().toISOString().slice(0, 10)}.txt`}
        content={overviewContent ?? ''}
        onClose={() => setOverviewContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_SESSION_REPORTS: SessionReport[] = [
  { id: '1', date: 'Aug 11, 2026', teacherName: 'Teacher A', studentNames: ['Student A', 'Student B'] },
  { id: '2', date: 'Aug 10, 2026', teacherName: 'Teacher B', studentNames: ['Student C'] },
];
const DEMO_OVERVIEW: FoundationOverview = { totalStudents: 24, totalTeachers: 5, sessionsThisMonth: 96, avgGoalProgress: 61 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  tab: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  tabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  reportRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  primaryBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  primaryBtnText: { fontWeight: '700', color: colors.navyText },
  btnRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  secondaryBtn: { flex: 1, minWidth: '30%', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  secondaryBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText, textAlign: 'center' },
});
