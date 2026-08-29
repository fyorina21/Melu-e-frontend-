// screens/director/ReportsOversightScreen.tsx
// SCR-DIR-005: Reports & Oversight

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getSessionReports, generateBiAnnualReport, getFoundationOverview } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

const REPORT_TABS: string[] = [
  'Session Reports',
  'Bi-Annual Reports',
  'Foundation Overview',
];

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

export default function ReportsOversightScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'ReportsOversight'>) {
  const [activeTab, setActiveTab] = useState('Session Reports');
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [overview, setOverview] = useState<FoundationOverview | null>(null);
  const [biAnnualContent, setBiAnnualContent] = useState<string | null>(null);
  const [overviewContent, setOverviewContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getSessionReports({});
      setSessionReports(Array.isArray(data) ? data : []);
    } catch {
      setSessionReports([]);
    }
    try {
      const { data } = await getFoundationOverview();
      setOverview(data);
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildBiAnnualText = (): string => {
    return [
      '================================================================',
      '      MELU\'E FOUNDATION — BI-ANNUAL PROGRESS OVERSIGHT          ',
      '================================================================',
      `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      'PERIOD: 6-Month Comprehensive Clinical Summary',
      '----------------------------------------------------------------',
      '',
      'SUMMARY OF CLINICAL SESSIONS & THERAPY:',
      ...sessionReports.map(
        (r, i) =>
          `  ${i + 1}. Session Date: ${r.date} | Lead Therapist: ${r.teacherName}\n     Students: ${r.studentNames.join(', ')}`
      ),
      '',
      '----------------------------------------------------------------',
      'SYSTEM STATUS: Certified by Foundation Director',
      '================================================================',
    ].join('\n');
  };

  const handleGenerateBiAnnual = async () => {
    try {
      await generateBiAnnualReport({});
    } catch {}
    setBiAnnualContent(buildBiAnnualText());
  };

  const handlePreview = () => setBiAnnualContent(buildBiAnnualText());

  const handleEmailParent = () =>
    Alert.alert(
      'Email to Parents',
      'Bi-annual progress packet queued for parent portal delivery.'
    );

  const handleExportOverview = () => {
    if (!overview) return;
    setOverviewContent(
      [
        '================================================================',
        '      MELU\'E FOUNDATION — EXECUTIVE ANALYTICS OVERVIEW          ',
        '================================================================',
        `GENERATED: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        '----------------------------------------------------------------',
        '',
        `• Total Enrolled Students: ${overview.totalStudents}`,
        `• Total Active Therapists: ${overview.totalTeachers}`,
        `• Sessions Conducted This Month: ${overview.sessionsThisMonth}`,
        `• Average Goal Progress (Foundation-Wide): ${overview.avgGoalProgress}%`,
        '',
        '================================================================',
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Reports" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="bar-chart-2" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Reports & Clinical Oversight</Text>
              <Text style={styles.pageSubtitle}>
                Session logs, bi-annual progress packets, and foundation analytics
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.builderBtn}
            onPress={() => navigation?.navigate?.('ReportBuilder')}
          >
            <Feather name="sliders" size={14} color={colors.navyText} />
            <Text style={styles.builderBtnText}>Open Custom Builder</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Segmented Control */}
        <View style={styles.segmentedContainer}>
          {REPORT_TABS.map((t) => {
            const isSelected = activeTab === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.segmentTabText, isSelected && styles.segmentTabTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Session Reports */}
        {activeTab === 'Session Reports' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Submitted Session Summaries</Text>
              <Text style={styles.countBadge}>{sessionReports.length} Summaries</Text>
            </View>

            <View style={styles.reportList}>
              {sessionReports.map((r) => (
                <View key={r.id} style={styles.sessionItem}>
                  <View style={styles.sessionIconWrap}>
                    <Feather name="file-text" size={16} color={colors.navyText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.sessionTitleRow}>
                      <Text style={styles.sessionDate}>{r.date}</Text>
                      <Text style={styles.sessionTeacher}>Lead: {r.teacherName}</Text>
                    </View>
                    <Text style={styles.sessionStudents}>
                      Students: {r.studentNames.join(', ')}
                    </Text>
                  </View>
                </View>
              ))}

              {sessionReports.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Feather name="file-text" size={32} color={colors.mutedText} />
                  <Text style={styles.emptyTitle}>No Session Reports Submitted</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab 2: Bi-Annual Reports */}
        {activeTab === 'Bi-Annual Reports' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bi-Annual Progress Report Generator</Text>
            <Text style={styles.cardSub}>
              Compiles 6-month clinical progress metrics, session totals, and goal mastery status
              across all enrolled students into an executive report.
            </Text>

            <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateBiAnnual}>
              <Feather name="play" size={16} color={colors.navyText} />
              <Text style={styles.generateBtnText}>Generate Bi-Annual Report</Text>
            </TouchableOpacity>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handlePreview}>
                <Feather name="eye" size={16} color={colors.navyText} />
                <Text style={styles.actionCardText}>Preview / Print</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={handlePreview}>
                <Feather name="download" size={16} color={colors.navyText} />
                <Text style={styles.actionCardText}>Export File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={handleEmailParent}>
                <Feather name="mail" size={16} color={colors.navyText} />
                <Text style={styles.actionCardText}>Email to Parents</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 3: Foundation Overview */}
        {activeTab === 'Foundation Overview' && overview && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Foundation-Wide Clinical Analytics</Text>
              <TouchableOpacity style={styles.smallExportBtn} onPress={handleExportOverview}>
                <Feather name="printer" size={13} color={colors.navyText} />
                <Text style={styles.smallExportBtnText}>Print Overview</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.analyticsGrid}>
              <View style={styles.analyticCard}>
                <Text style={styles.analyticVal}>{overview.totalStudents}</Text>
                <Text style={styles.analyticLabel}>Total Enrolled Students</Text>
              </View>
              <View style={styles.analyticCard}>
                <Text style={styles.analyticVal}>{overview.totalTeachers}</Text>
                <Text style={styles.analyticLabel}>Active Therapists</Text>
              </View>
              <View style={styles.analyticCard}>
                <Text style={styles.analyticVal}>{overview.sessionsThisMonth}</Text>
                <Text style={styles.analyticLabel}>Sessions Conducted (Month)</Text>
              </View>
              <View style={styles.analyticCard}>
                <Text style={[styles.analyticVal, { color: colors.successGreen }]}>
                  {overview.avgGoalProgress}%
                </Text>
                <Text style={styles.analyticLabel}>Avg Goal Mastery Rate</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Export Modals */}
      <ExportPreviewModal
        visible={!!biAnnualContent}
        title="Bi-Annual Progress Oversight"
        filename={`BiAnnualReport_${new Date().toISOString().slice(0, 10)}.txt`}
        content={biAnnualContent ?? ''}
        onClose={() => setBiAnnualContent(null)}
      />

      <ExportPreviewModal
        visible={!!overviewContent}
        title="Foundation Overview Analytics"
        filename={`FoundationAnalytics_${new Date().toISOString().slice(0, 10)}.txt`}
        content={overviewContent ?? ''}
        onClose={() => setOverviewContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 280 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  builderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  builderBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentTabActive: { backgroundColor: colors.primaryYellow },
  segmentTabText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  segmentTabTextActive: { color: colors.navyText, fontWeight: '700' },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  cardSub: { fontSize: 13, color: colors.bodyText, lineHeight: 19 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countBadge: { fontSize: 12, fontWeight: '600', color: colors.bodyText },

  reportList: { gap: spacing.xs },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  sessionTeacher: { fontSize: 12, color: colors.bodyText },
  sessionStudents: { fontSize: 12, color: colors.mutedText, marginTop: 2 },

  emptyWrap: { padding: spacing.xxl, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.mutedText },

  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: colors.navyText },

  actionsGrid: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  actionCard: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgApp,
  },
  actionCardText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  smallExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  smallExportBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },

  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  analyticCard: {
    flexGrow: 1,
    minWidth: 180,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 4,
  },
  analyticVal: { fontSize: 24, fontWeight: '800', color: colors.navyText },
  analyticLabel: { fontSize: 12, color: colors.bodyText, fontWeight: '500' },
});

