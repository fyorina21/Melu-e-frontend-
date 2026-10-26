// screens/programdirector/AssessmentReviewScreen.tsx
// SCR-PD-002: Assessment Review & Approval

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatusPill, { type StatusType } from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getAssessmentsForReview,
  getAssessmentReport,
  markAssessmentReviewed,
  addAssessmentNote,
} from '../../api/programDirectorApi';
import { generateClinicalAssessmentHtml } from '../../utils/clinicalAssessmentPdfGenerator';
import { openPrintWindow, downloadTextFile } from '../../utils/webExport';
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

function ReportModal({
  visible,
  report,
  onClose,
  onMarkReviewed,
}: {
  visible: boolean;
  report: AssessmentReport | null;
  onClose: () => void;
  onMarkReviewed: (studentId: string, notes: string) => void;
  onExport: (report: AssessmentReport) => void;
}) {
  const [notes, setNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);
  if (!report) return null;

  const isReviewed = report.status === 'Reviewed';

  const htmlContent = generateClinicalAssessmentHtml({
    student: {
      id: report.studentId,
      name: report.studentName,
      full_name: report.studentName,
      age: report.age,
      program_type: report.program,
      therapy_group: report.therapyGroup,
      lead_clinician: report.therapist,
      status: report.status,
    },
    assessment: {
      id: report.studentId,
      status: isReviewed ? 'reviewed' : 'complete',
      completed_on: report.dateCompleted || undefined,
    },
    skills: {
      status: report.skillsStatus,
      domains: report.domainScores.map((d) => ({
        code: d.code,
        name: d.name,
        scored_items: d.scoredCount,
        total_items: d.total,
        total_points: Math.round((d.scoredCount / (d.total || 1)) * (d.total * 2)),
        max_possible_points: d.total * 2,
        percentage: Math.round((d.scoredCount / (d.total || 1)) * 100),
      })),
    },
    behavior: {
      status: report.behaviorStatus,
    },
    preferences: {
      top_preferences: (report.preferences || []).map((name, i) => ({
        rank: i + 1,
        name,
      })),
    },
  });

  const handlePrint = () => {
    openPrintWindow(htmlContent, `Clinical_Assessment_${report.studentName}`, {
      formId: 'MCTC-TRP-015',
      revisionNumber: 'Rev: August 2025',
    });
  };

  const handleDownload = () => {
    downloadTextFile(
      `Clinical_Assessment_MCTC-TRP-015_${report.studentName.replace(/\s+/g, '_')}.html`,
      htmlContent,
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#525659' }}>
        {/* Sleek Top Action Bar */}
        <View
          style={{
            height: 56,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 7,
              paddingHorizontal: 10,
              backgroundColor: '#EFF6FF',
              borderRadius: radius.md,
            }}
            onPress={onClose}
          >
            <Feather name="arrow-left" size={15} color={colors.primaryBlue} />
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.primaryBlue }}>
              Back to Assessment Pipeline
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 13, color: '#334155', fontWeight: '500' }}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>{report.studentName}</Text>
              {` • Age ${report.age || 6} • Program: ${report.program}`}
            </Text>
            <View
              style={{
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: isReviewed ? '#DCFCE7' : '#FEF3C7',
                borderWidth: 1,
                borderColor: isReviewed ? '#86EFAC' : '#FDE68A',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isReviewed ? '#166534' : '#92400E',
                }}
              >
                Status:{' '}
                {isReviewed ? 'Reviewed / Ready for IUP' : 'Assessment Complete / Pending Review'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: radius.md,
              }}
              onPress={handlePrint}
            >
              <Feather name="printer" size={14} color="#1E293B" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B' }}>Print / PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                borderRadius: radius.md,
              }}
              onPress={handleDownload}
            >
              <Feather name="download" size={14} color="#1E293B" />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B' }}>Download</Text>
            </TouchableOpacity>

            {!isReviewed ? (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: '#16A34A',
                  borderRadius: radius.md,
                }}
                onPress={() => onMarkReviewed(report.studentId, notes)}
              >
                <Feather name="check-circle" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  Approve & Sign-Off (Ready for IUP)
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: '#059669',
                  borderRadius: radius.md,
                  opacity: 0.85,
                }}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  Approved (Ready for IUP)
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pure PDF Viewport */}
        <View style={{ flex: 1, backgroundColor: '#525659' }}>
          <iframe
            srcDoc={htmlContent}
            title="Clinical Intake Evaluation Report"
            style={{ width: '100%', height: '100%', border: 'none' } as any}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function scoreColor(score: unknown): string {
  const n =
    typeof score === 'number' ? score : typeof score === 'string' ? parseInt(score, 10) : NaN;
  if (isNaN(n)) return '#94A3B8';
  if (n === 0) return '#EF4444';
  if (n <= 1) return '#EAB308';
  return '#16A34A';
}

function normalizeStatus(rawStatus?: string): string {
  if (!rawStatus) return 'Not Started';
  const s = rawStatus
    .toLowerCase()
    .replace(/[_\s-]+/g, ' ')
    .trim();
  if (s === 'not started' || s === 'notstarted') return 'Not Started';
  if (s === 'in progress' || s === 'inprogress') return 'In Progress';
  if (s === 'complete' || s === 'completed') return 'Complete';
  if (s === 'reviewed' || s === 'approved') return 'Reviewed';
  return rawStatus;
}

function normalizeAssessmentItem(item: any): AssessmentListItem {
  return {
    studentId: String(item.studentId ?? item.student_id ?? item.id ?? ''),
    studentName: String(item.studentName ?? item.student_name ?? item.name ?? 'Unknown Student'),
    age: Number(item.age ?? 0),
    program: String(item.program ?? item.program_type ?? 'Regular'),
    therapyGroup: String(item.therapyGroup ?? item.therapy_group ?? ''),
    therapist: String(item.therapist ?? item.therapist_name ?? 'Unassigned'),
    status: normalizeStatus(item.status),
    abllsPct: Number(item.abllsPct ?? item.assessment_progress ?? item.completion_percentage ?? 0),
    behaviorStatus: String(item.behaviorStatus ?? item.behavior_assessment ?? 'notStarted'),
    sessionStatus: String(item.sessionStatus ?? ''),
    dateCompleted:
      item.dateCompleted ??
      item.completed_at ??
      item.completed_on ??
      (normalizeStatus(item.status) === 'Complete' ? new Date().toISOString().split('T')[0] : null),
  };
}

function normalizeAssessmentReport(res: any): AssessmentReport {
  const student = res?.student || {};
  const assessment = res?.assessment || {};
  const skills = res?.skills || {};
  const behavior = res?.behavior || {};
  const preferences = res?.preferences || {};

  const domainScores: DomainScore[] = Array.isArray(res?.domainScores)
    ? res.domainScores
    : Array.isArray(skills?.domains)
      ? skills.domains.map((d: any) => ({
          code: String(d.code || d.domain_code || ''),
          name: String(d.name || d.domain_name || ''),
          items: Array.isArray(d.items) ? d.items : [],
          scoredCount: Number(d.scoredCount ?? d.completed_items ?? d.scored_count ?? 0),
          total: Number(d.total ?? d.total_items ?? 0),
        }))
      : [];

  const prefList: string[] = Array.isArray(res?.preferences)
    ? res.preferences
    : Array.isArray(preferences?.top_items)
      ? preferences.top_items.map((p: any) =>
          typeof p === 'string' ? p : p.name || p.item_name || '',
        )
      : Array.isArray(res?.top_preferences)
        ? res.top_preferences.map((p: any) => (typeof p === 'string' ? p : p.name || ''))
        : [];

  return {
    studentId: String(student.id ?? res?.studentId ?? ''),
    studentName: String(student.name ?? student.full_name ?? res?.studentName ?? 'Unknown Student'),
    age: Number(student.age ?? res?.age ?? 0),
    program: String(student.program_type ?? student.program ?? res?.program ?? 'Regular'),
    therapyGroup: String(student.therapy_group ?? res?.therapyGroup ?? ''),
    therapist: String(res?.therapist ?? student.therapist ?? 'Unassigned'),
    status: normalizeStatus(assessment.status ?? res?.status),
    skillsSummary: String(skills.summary ?? res?.skillsSummary ?? 'No skills summary available.'),
    skillsStatus: String(skills.status ?? res?.skillsStatus ?? 'not_started'),
    domainScores,
    behaviorSummary: String(
      behavior.summary ?? res?.behaviorSummary ?? 'No behavior summary available.',
    ),
    behaviorStatus: String(behavior.status ?? res?.behaviorStatus ?? 'not_started'),
    preferences: prefList,
    notes: String(res?.notes ?? res?.teacher_notes ?? 'No notes recorded.'),
    dateCompleted: assessment.completed_on ?? res?.dateCompleted ?? null,
    iupStatus: String(res?.iupStatus ?? 'Draft'),
    reviewNotes: String(res?.reviewNotes ?? res?.review_notes ?? ''),
    assignedGoals: res?.assignedGoals ?? [],
  };
}

export default function AssessmentReviewScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentReview'>) {
  const [list, setList] = useState<AssessmentListItem[] | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [reportTarget, setReportTarget] = useState<AssessmentReport | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAssessmentsForReview(
        search.trim() ? { search: search.trim() } : undefined,
      );
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.assessments)
          ? res.assessments
          : Array.isArray(res?.data)
            ? res.data
            : [];
      const deduplicatedMap = new Map<string, AssessmentListItem>();
      for (const raw of rawList) {
        const item = normalizeAssessmentItem(raw);
        if (!item.studentId) continue;
        const existing = deduplicatedMap.get(item.studentId);
        if (!existing) {
          deduplicatedMap.set(item.studentId, item);
        } else {
          // Priority ranking: Reviewed (4) > Complete (3) > In Progress (2) > Not Started (1)
          const priority = (s: string) =>
            s === 'Reviewed' ? 4 : s === 'Complete' ? 3 : s === 'In Progress' ? 2 : 1;
          if (priority(item.status) > priority(existing.status)) {
            deduplicatedMap.set(item.studentId, item);
          }
        }
      }
      setList(Array.from(deduplicatedMap.values()));
    } catch (err) {
      console.error('Failed to load assessments for review', err);
      setList([]);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!Array.isArray(list)) return [];
    let items = list;
    if (statusFilter !== 'All') {
      items = items.filter(
        (r) => r.status === statusFilter || normalizeStatus(r.status) === statusFilter,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.program.toLowerCase().includes(q) ||
          r.therapist.toLowerCase().includes(q),
      );
    }
    return items;
  }, [list, statusFilter, search]);

  if (!list) return <ScreenLoader />;

  const handleViewReport = (studentId: string) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('AssessmentSummaryReport', { studentId });
    } else {
      getAssessmentReport(studentId)
        .then(({ data: res }) => {
          setReportTarget(normalizeAssessmentReport(res));
        })
        .catch((err) => {
          console.error('Failed to get assessment report', err);
        });
    }
  };

  const handleMarkReviewed = async (studentId: string, notes: string) => {
    Alert.alert(
      'Mark as reviewed?',
      'Mark this assessment as reviewed and ready for IUP creation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await markAssessmentReviewed(studentId, { notes, status: 'ready_for_iup' });
              if (notes) await addAssessmentNote(studentId, { note: notes });
              setList((prev) =>
                prev
                  ? prev.map((item) =>
                      item.studentId === studentId ? { ...item, status: 'Reviewed' } : item,
                    )
                  : prev,
              );
              await load();
            } catch (err) {
              console.error('Failed to mark assessment reviewed', err);
            }
            setReportTarget(null);
          },
        },
      ],
    );
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
      <AppNavbar
        activeTab="Assessment"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])}
      />

      <View style={styles.header}>
        <Text style={typography.h1}>Assessment Review & Approval</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name or ID..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt;
          const count =
            opt === 'All'
              ? Array.isArray(list)
                ? list.length
                : 0
              : Array.isArray(list)
                ? list.filter((r) => r.status === opt || normalizeStatus(r.status) === opt).length
                : 0;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setStatusFilter(opt)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt} ({count})
              </Text>
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
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleViewReport(s.studentId)}
                >
                  <Text style={styles.actionBtnText}>View Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        {filtered.length === 0 && (
          <Text
            style={[
              typography.body,
              { textAlign: 'center', padding: spacing.lg, color: colors.mutedText },
            ]}
          >
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: { padding: spacing.md, backgroundColor: colors.bgCard, paddingBottom: 0 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  chipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.mutedText },
  chipTextActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressCol: { width: 80, alignItems: 'center' },
  progressLabel: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  progressBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#16A34A' },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
  },
  domainSection: { marginTop: spacing.sm, gap: spacing.sm },
  domainCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
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
  textArea: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.navyText,
  },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.statusPendingBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  exportBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  approveBtnText: { fontWeight: '700', color: colors.navyText },
});
