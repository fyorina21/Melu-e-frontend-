// screens/programdirector/AssessmentReviewScreen.tsx
// SCR-PD-002: Assessment Review & Approval

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { type StatusType } from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAssessmentsForReview, getAssessmentReport, markAssessmentReviewed, addAssessmentNote } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

const STATUS_KEY: Record<string, StatusType> = {
  'Not Started': 'notStarted',
  'In Progress': 'inProgress',
  Complete: 'completed',
  Reviewed: 'approved',
};

const STATUS_OPTIONS = ['All', 'Not Started', 'In Progress', 'Complete', 'Reviewed'] as const;

interface AssessmentListItem {
  studentId: string;
  studentName: string;
  age: number;
  program: string;
  therapyGroup: string;
  therapist: string;
  status: string;
  abllsPct: number;
  behaviorStatus: string;
  sessionStatus: string;
  dateCompleted: string | null;
}

interface DomainScore {
  code: string;
  name: string;
  items: Array<{ id: string; description: string; score: unknown }>;
  scoredCount: number;
  total: number;
}

interface AssessmentReport {
  studentId: string;
  studentName: string;
  age: number;
  program: string;
  therapyGroup: string;
  therapist: string;
  status: string;
  skillsSummary: string;
  skillsStatus: string;
  domainScores: DomainScore[];
  behaviorSummary: string;
  behaviorStatus: string;
  preferences: string[];
  notes: string;
  dateCompleted: string | null;
  iupStatus: string;
  reviewNotes: string;
  assignedGoals?: { id: string; name: string; status: string }[];
}

function ReportModal({ visible, report, onClose, onMarkReviewed, onExport }: {
  visible: boolean;
  report: AssessmentReport | null;
  onClose: () => void;
  onMarkReviewed: (studentId: string, notes: string) => void;
  onExport: (report: AssessmentReport) => void;
}) {
  const [notes, setNotes] = useState('');
  if (!report) return null;

  const activeDomains = report.domainScores?.filter((d) => d.scoredCount > 0) || [];
  const unscoredDomains = report.domainScores?.filter((d) => d.scoredCount === 0) || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{report.studentName} — Assessment Summary</Text>
          <Text style={typography.caption}>{report.age ? `Age ${report.age}` : ''}{report.age ? ' · ' : ''}{report.program}{report.therapist !== 'Unassigned' ? ` · ${report.therapist}` : ''}</Text>

          <ScrollView style={{ maxHeight: 420 }}>
            <Text style={typography.h3}>Skills Assessment (ABLLS)</Text>
            <Text style={typography.body}>{report.skillsSummary}</Text>

            {activeDomains.length > 0 && (
              <View style={styles.domainSection}>
                {activeDomains.map((d) => (
                  <View key={d.code} style={styles.domainCard}>
                    <View style={styles.domainHeader}>
                      <Text style={styles.domainCode}>{d.code}</Text>
                      <Text style={styles.domainName}>{d.name}</Text>
                      <Text style={styles.domainScore}>{d.scoredCount}/{d.total}</Text>
                    </View>
                    <View style={styles.domainItems}>
                      {(d.items || []).filter((i) => i.score !== null && i.score !== undefined).map((i) => (
                        <View key={i.id} style={styles.domainItem}>
                          <Text style={styles.domainItemId}>{i.id}</Text>
                          <Text style={styles.domainItemDesc} numberOfLines={1}>{i.description}</Text>
                          <View style={[styles.scoreBadge, { backgroundColor: scoreColor(i.score) }]}>
                            <Text style={styles.scoreBadgeText}>{String(i.score)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {unscoredDomains.length > 0 && (
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>Unscored domains: {unscoredDomains.map((d) => `${d.code} (${d.name})`).join(', ')}</Text>
            )}

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Behavior Assessment (MASS/FAST)</Text>
            <Text style={typography.body}>{report.behaviorSummary}</Text>

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Top Preferences</Text>
            <Text style={typography.body}>{(report.preferences || []).join(', ')}</Text>

            {report.notes && report.notes !== 'No notes recorded.' && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Teacher Notes</Text>
                <Text style={typography.body}>{report.notes}</Text>
              </>
            )}

            <Text style={[typography.h3, { marginTop: spacing.md }]}>IUP Status</Text>
            <Text style={typography.body}>{report.iupStatus}</Text>

            {report.assignedGoals && report.assignedGoals.length > 0 && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Goal Status</Text>
                {report.assignedGoals.map((g, idx) => (
                  <Text key={idx} style={typography.body}>
                    • {g.name} ({g.status})
                  </Text>
                ))}
              </>
            )}

            {report.dateCompleted && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Date Completed</Text>
                <Text style={typography.body}>{report.dateCompleted}</Text>
              </>
            )}
          </ScrollView>

          <View style={styles.field}>
            <Text style={typography.label}>Internal Notes</Text>
            <TextInput style={styles.textArea} multiline value={notes} onChangeText={setNotes} placeholder="Not visible to parents or teachers..." placeholderTextColor={colors.mutedText} />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={() => onExport(report)}>
              <Feather name="share-2" size={14} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
            {report.status !== 'Reviewed' && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => onMarkReviewed(report.studentId, notes)}>
                <Text style={styles.approveBtnText}>Mark as Reviewed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function scoreColor(score: unknown): string {
  const n = typeof score === 'number' ? score : typeof score === 'string' ? parseInt(score, 10) : NaN;
  if (isNaN(n)) return '#94A3B8';
  if (n === 0) return '#EF4444';
  if (n <= 1) return '#EAB308';
  return '#16A34A';
}

export default function AssessmentReviewScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentReview'>) {
  const [list, setList] = useState<AssessmentListItem[] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [reportTarget, setReportTarget] = useState<AssessmentReport | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAssessmentsForReview({ search });
      setList(res);
    } catch (err) {
      setList([]);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!list) return [];
    if (statusFilter === 'All') return list;
    return list.filter((r) => r.status === statusFilter);
  }, [list, statusFilter]);

  if (!list) return <ScreenLoader />;

  const handleViewReport = async (studentId: string) => {
    try {
      const { data: res } = await getAssessmentReport(studentId);
      setReportTarget(res);
    } catch (err) {}
  };

  const handleMarkReviewed = async (studentId: string, notes: string) => {
    Alert.alert('Mark as reviewed?', 'Mark this assessment as reviewed and ready for IUP creation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await markAssessmentReviewed(studentId, {});
            if (notes) await addAssessmentNote(studentId, { note: notes });
            await load();
          } catch (err) {}
          setReportTarget(null);
        },
      },
    ]);
  };

  const handleExportPdf = (report: AssessmentReport) => {
    const lines = [
      `Melu'e Foundation — Assessment Summary Report`,
      `Student: ${report.studentName}`,
      report.age ? `Age: ${report.age}` : '',
      `Program: ${report.program}`,
      report.therapist !== 'Unassigned' ? `Therapist: ${report.therapist}` : '',
      '',
      'SKILLS ASSESSMENT (ABLLS)',
      report.skillsSummary,
    ];

    if ((report.domainScores || []).filter((d) => d.scoredCount > 0).length > 0) {
      lines.push('');
      lines.push('DOMAIN BREAKDOWN');
      for (const d of (report.domainScores || []).filter((d) => d.scoredCount > 0)) {
        lines.push(`  ${d.code} ${d.name}: ${d.scoredCount}/${d.total} items scored`);
        for (const i of (d.items || []).filter((i) => i.score !== null && i.score !== undefined)) {
          lines.push(`    ${i.id} ${i.description}: ${i.score}`);
        }
      }
    }

    lines.push('', 'BEHAVIOR ASSESSMENT (MASS/FAST)', report.behaviorSummary || '');
    lines.push('', 'TOP PREFERENCES', (report.preferences || []).join(', '));

    if (report.notes && report.notes !== 'No notes recorded.') {
      lines.push('', 'TEACHER NOTES', report.notes);
    }

    lines.push('', 'IUP STATUS', report.iupStatus);

    if (report.dateCompleted) {
      lines.push('', `DATE COMPLETED: ${report.dateCompleted}`);
    }

    lines.push('', `Generated ${new Date().toLocaleDateString()}`);

    setExportContent(lines.filter(Boolean).join('\n'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessment" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <Text style={typography.h1}>Assessment Review & Approval</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search by student name or ID..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.filterRow}>
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt;
          const count = opt === 'All' ? (list?.length ?? 0) : (list?.filter((r) => r.status === opt).length ?? 0);
          return (
            <TouchableOpacity key={opt} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setStatusFilter(opt)}>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{opt} ({count})</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((s) => (
          <View key={s.studentId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.studentName}</Text>
              <Text style={typography.caption}>
                Age {s.age} · {s.program}
                {s.therapist !== 'Unassigned' ? ` · ${s.therapist}` : ''}
                {s.dateCompleted ? ` · ${s.dateCompleted}` : ''}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <View style={styles.progressCol}>
                <Text style={styles.progressLabel}>ABLLS {s.abllsPct}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, s.abllsPct)}%` }]} />
                </View>
              </View>
              <StatusPill status={STATUS_KEY[s.status] || 'notStarted'} label={s.status} />
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewReport(s.studentId)}>
                  <Text style={styles.actionBtnText}>View Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <Text style={[typography.body, { textAlign: 'center', padding: spacing.lg, color: colors.mutedText }]}>
            No students match the current filters.
          </Text>
        )}
      </ScrollView>

      <ReportModal
        visible={!!reportTarget}
        report={reportTarget}
        onClose={() => setReportTarget(null)}
        onMarkReviewed={handleMarkReviewed}
        onExport={handleExportPdf}
      />

      <ExportPreviewModal
        visible={!!exportContent}
        title="Assessment Summary Report"
        filename={`${reportTarget?.studentName.replace(/\s+/g, '_') ?? 'Student'}_AssessmentSummary.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchRow: { padding: spacing.md, backgroundColor: colors.bgCard, paddingBottom: 0 },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, padding: spacing.md, backgroundColor: colors.bgCard },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgApp },
  chipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.mutedText },
  chipTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressCol: { width: 80, alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  progressBar: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: 2 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#16A34A' },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  domainSection: { marginTop: spacing.sm, gap: spacing.sm },
  domainCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  domainHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  domainCode: { fontWeight: '800', fontSize: 13, color: colors.primaryBlue },
  domainName: { fontWeight: '600', fontSize: 12, color: colors.navyText, flex: 1 },
  domainScore: { fontSize: 11, fontWeight: '700', color: colors.mutedText },
  domainItems: { gap: 4 },
  domainItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  domainItemId: { fontSize: 11, fontWeight: '700', color: colors.navyText, width: 26 },
  domainItemDesc: { fontSize: 11, color: colors.mutedText, flex: 1 },
  scoreBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill },
  scoreBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  field: { gap: spacing.xs },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top', color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  exportBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.statusPendingBg, borderRadius: radius.md, paddingVertical: spacing.md },
  exportBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  approveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  approveBtnText: { fontWeight: '700', color: colors.navyText },
});
