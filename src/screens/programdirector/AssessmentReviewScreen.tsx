// screens/programdirector/AssessmentReviewScreen.js
// SCR-PD-002: Assessment Review & Approval

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { type StatusType } from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import ProgramDirectorNav from './components/ProgramDirectorNav';
import { PD_ROUTE_BY_TAB } from './components/pdNavRoutes';
import { getAssessmentsForReview, getAssessmentReport, markAssessmentReviewed, addAssessmentNote } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

const STATUS_KEY: Record<string, StatusType> = { 'In Progress': 'inProgress', Complete: 'completed', Reviewed: 'approved' };

interface AssessmentListItem {
  studentId: string;
  studentName: string;
  age: number;
  program: string;
  status: string;
  dateCompleted: string;
}

interface AssessmentReport {
  studentId: string;
  studentName: string;
  skillsSummary: string;
  behaviorSummary: string;
  preferences: string[];
  iupStatus: string;
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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{report.studentName} — Assessment Summary</Text>
          <ScrollView style={{ maxHeight: 340 }}>
            <Text style={typography.h3}>Skills Assessment (ABLLS)</Text>
            <Text style={typography.body}>{report.skillsSummary}</Text>
            <Text style={[typography.h3, { marginTop: spacing.md }]}>Behavior Assessment (MASS/FAST)</Text>
            <Text style={typography.body}>{report.behaviorSummary}</Text>
            <Text style={[typography.h3, { marginTop: spacing.md }]}>Top Preferences</Text>
            <Text style={typography.body}>{report.preferences.join(', ')}</Text>
            <Text style={[typography.h3, { marginTop: spacing.md }]}>IUP Status</Text>
            <Text style={typography.body}>{report.iupStatus}</Text>
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
            <TouchableOpacity style={styles.approveBtn} onPress={() => onMarkReviewed(report.studentId, notes)}>
              <Text style={styles.approveBtnText}>Mark as Reviewed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AssessmentReviewScreen({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentReview'>) {
  const [list, setList] = useState<AssessmentListItem[]>([]);
  const [search, setSearch] = useState('');
  const [reportTarget, setReportTarget] = useState<AssessmentReport | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getAssessmentsForReview({ search });
      setList(data);
    } catch (err) {
      setList(DEMO_LIST);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleViewReport = async (studentId: string) => {
    try {
      const { data } = await getAssessmentReport(studentId);
      setReportTarget(data);
    } catch (err) {
      setReportTarget(DEMO_REPORT);
    }
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
          } catch (err) {}
          setList((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, status: 'Reviewed' } : s)));
          setReportTarget(null);
        },
      },
    ]);
  };

  const handleExportPdf = (report: AssessmentReport) => {
    setExportContent(
      [
        `Melu'e Foundation — Assessment Summary Report`,
        `Student: ${report.studentName}`,
        '',
        'SKILLS ASSESSMENT (ABLLS)',
        report.skillsSummary,
        '',
        'BEHAVIOR ASSESSMENT (MASS/FAST)',
        report.behaviorSummary,
        '',
        'TOP PREFERENCES',
        report.preferences.join(', '),
        '',
        'IUP STATUS',
        report.iupStatus,
        '',
        `Generated ${new Date().toLocaleDateString()}`,
      ].join('\n')
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ProgramDirectorNav activeTab="Assessments" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />

      <View style={styles.header}>
        <Text style={typography.h1}>Assessment Review & Approval</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} placeholder="Search by student name..." placeholderTextColor={colors.mutedText} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {list.map((s) => (
          <View key={s.studentId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.studentName}</Text>
              <Text style={typography.caption}>Age {s.age} · {s.program} · Completed {s.dateCompleted}</Text>
            </View>
            <StatusPill status={STATUS_KEY[s.status] || 'notStarted'} label={s.status} />
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewReport(s.studentId)}>
                <Text style={styles.actionBtnText}>View Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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

const DEMO_LIST: AssessmentListItem[] = [
  { studentId: 'student-c', studentName: 'Student C', age: 5, program: 'Pooled-Out', status: 'Complete', dateCompleted: 'Aug 8, 2026' },
  { studentId: 'student-d', studentName: 'Student D', age: 6, program: 'Regular Program', status: 'In Progress', dateCompleted: '—' },
];
const DEMO_REPORT: AssessmentReport = {
  studentId: 'student-c',
  studentName: 'Student C',
  skillsSummary: 'Strong in receptive language and gross motor. Needs support in expressive language and self-help.',
  behaviorSummary: 'Primary function identified: escape/avoidance during transitions. Secondary: attention-seeking.',
  preferences: ['Bubbles', 'Tablet time', 'Music', 'Blocks', 'Swing'],
  iupStatus: 'No IUP created yet.',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
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
