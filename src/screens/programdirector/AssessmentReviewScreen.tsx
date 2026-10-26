// screens/programdirector/AssessmentReviewScreen.tsx
// SCR-PD-002: Assessment Review & Approval

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import StatusPill from '../../components/StatusPill';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getAssessmentsForReview,
  getAssessmentReport,
  markAssessmentReviewed,
  addAssessmentNote,
} from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';
import {
  STATUS_KEY,
  STATUS_OPTIONS,
  type StatusOption,
  type AssessmentListItem,
  type AssessmentReport,
  scoreColor,
  normalizeStatus,
  normalizeAssessmentItem,
  normalizeAssessmentReport,
  generateAssessmentReportText,
} from './assessmentreview/reviewTypes';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';

/* ------------------------------------------------------------------ */
/*  Report Modal                                                      */
/* ------------------------------------------------------------------ */

interface ReportModalProps {
  visible: boolean;
  report: AssessmentReport | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onMarkReviewed: (studentId: string, notes: string) => void;
  onExport: (report: AssessmentReport) => void;
}

function ReportModal({
  visible,
  report,
  isSubmitting = false,
  onClose,
  onMarkReviewed,
  onExport,
}: ReportModalProps) {
  const [notes, setNotes] = useState('');

  // Sync notes when report changes or modal opens
  useEffect(() => {
    if (visible && report) {
      setNotes(report.reviewNotes || '');
    }
  }, [visible, report]);

  if (!report) return null;

  const activeDomains = report.domainScores?.filter((d) => d.scoredCount > 0) || [];
  const unscoredDomains = report.domainScores?.filter((d) => d.scoredCount === 0) || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{report.studentName} — Assessment Summary</Text>
          <Text style={typography.caption}>
            {report.age ? `Age ${report.age}` : ''}
            {report.age ? ' · ' : ''}
            {report.program}
            {report.therapist && report.therapist !== 'Unassigned' ? ` · ${report.therapist}` : ''}
          </Text>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={typography.h3}>Skills Assessment (ABLLS)</Text>
            <Text style={typography.body}>{report.skillsSummary}</Text>

            {activeDomains.length > 0 && (
              <View style={styles.domainSection}>
                {activeDomains.map((d) => (
                  <View key={d.code} style={styles.domainCard}>
                    <View style={styles.domainHeader}>
                      <Text style={styles.domainCode}>{d.code}</Text>
                      <Text style={styles.domainName}>{d.name}</Text>
                      <Text style={styles.domainScore}>
                        {d.scoredCount}/{d.total}
                      </Text>
                    </View>
                    <View style={styles.domainItems}>
                      {(d.items || [])
                        .filter((i) => i.score !== null && i.score !== undefined)
                        .map((i) => (
                          <View key={i.id} style={styles.domainItem}>
                            <Text style={styles.domainItemId}>{i.id}</Text>
                            <Text style={styles.domainItemDesc} numberOfLines={1}>
                              {i.description}
                            </Text>
                            <View
                              style={[styles.scoreBadge, { backgroundColor: scoreColor(i.score) }]}
                            >
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
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                Unscored domains: {unscoredDomains.map((d) => `${d.code} (${d.name})`).join(', ')}
              </Text>
            )}

            <Text style={[typography.h3, { marginTop: spacing.md }]}>
              Behavior Assessment (MASS/FAST)
            </Text>
            <Text style={typography.body}>{report.behaviorSummary}</Text>

            <Text style={[typography.h3, { marginTop: spacing.md }]}>Top Preferences</Text>
            <Text style={typography.body}>{(report.preferences || []).join(', ') || 'None recorded'}</Text>

            {Boolean(report.notes && report.notes !== 'No notes recorded.') && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Teacher Notes</Text>
                <Text style={typography.body}>{report.notes}</Text>
              </>
            )}

            {Boolean(report.reviewNotes && report.reviewNotes !== 'No notes recorded.') && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Director Review Notes</Text>
                <Text style={typography.body}>{report.reviewNotes}</Text>
              </>
            )}

            <Text style={[typography.h3, { marginTop: spacing.md }]}>IUP Status</Text>
            <Text style={typography.body}>{report.iupStatus}</Text>

            {Boolean(report.assignedGoals && report.assignedGoals.length > 0) && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Goal Status</Text>
                {report.assignedGoals?.map((g, idx) => (
                  <Text key={idx} style={typography.body}>
                    • {g.name} ({g.status})
                  </Text>
                ))}
              </>
            )}

            {Boolean(report.dateCompleted) && (
              <>
                <Text style={[typography.h3, { marginTop: spacing.md }]}>Date Completed</Text>
                <Text style={typography.body}>{report.dateCompleted}</Text>
              </>
            )}
          </ScrollView>

          <View style={styles.field}>
            <Text style={typography.label}>Internal Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholder="Not visible to parents or teachers..."
              placeholderTextColor={colors.mutedText}
              accessibilityLabel="Internal notes for review"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Close report modal"
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => onExport(report)}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Export Assessment Summary"
            >
              <Feather name="share-2" size={14} color={colors.navyText} />
              <Text style={styles.exportBtnText}>Export</Text>
            </TouchableOpacity>
            {report.status !== 'Reviewed' && (
              <TouchableOpacity
                style={[styles.approveBtn, isSubmitting && styles.approveBtnDisabled]}
                onPress={() => onMarkReviewed(report.studentId, notes)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Mark assessment as reviewed"
                accessibilityState={{ busy: isSubmitting }}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.navyText} />
                ) : (
                  <Text style={styles.approveBtnText}>Mark as Reviewed</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                       */
/* ------------------------------------------------------------------ */

export default function AssessmentReviewScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentReview'>) {
  const [list, setList] = useState<AssessmentListItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusOption>('All');
  const [reportTarget, setReportTarget] = useState<AssessmentReport | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);

  // Guards against duplicate concurrent calls, stale responses, and unmounted state updates
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const lastFetchTimeRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    // Debounce duplicate calls within 400ms unless forced
    if (!force && now - lastFetchTimeRef.current < 400) {
      return;
    }
    lastFetchTimeRef.current = now;

    const currentReqId = ++requestIdRef.current;
    inFlightRef.current = true;

    try {
      const { data: res } = await getAssessmentsForReview();
      if (!isMountedRef.current || currentReqId !== requestIdRef.current) return;

      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.assessments)
          ? res.assessments
          : Array.isArray(res?.data)
            ? res.data
            : [];
      setList(rawList.map(normalizeAssessmentItem));
      setLoadError(false);
    } catch (err) {
      if (!isMountedRef.current || currentReqId !== requestIdRef.current) return;
      console.error('Failed to load assessments for review', err);
      setLoadError(true);
    } finally {
      if (currentReqId === requestIdRef.current) {
        inFlightRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdate = () => {
      load(true);
    };
    window.addEventListener('melue_assessment_updated', handleUpdate);
    window.addEventListener('melue_student_enrolled_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('melue_assessment_updated', handleUpdate);
      window.removeEventListener('melue_student_enrolled_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [load]);

  const handleNavTab = useCallback(
    (tab: string) => {
      if (!navigation?.navigate) return;
      const route =
        PD_ROUTE_BY_TAB[tab] || (tab in PD_ROUTE_BY_TAB ? PD_ROUTE_BY_TAB[tab] : undefined);
      if (route) {
        navigation.navigate(route as any);
        return;
      }
      navigation.navigate(tab as any);
    },
    [navigation],
  );

  const filtered = useMemo(() => {
    if (!Array.isArray(list)) return [];
    let items = list;
    if (statusFilter !== 'All') {
      items = items.filter((r) => normalizeStatus(r.status) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          r.program.toLowerCase().includes(q) ||
          r.therapist.toLowerCase().includes(q) ||
          r.therapyGroup.toLowerCase().includes(q),
      );
    }
    return items;
  }, [list, statusFilter, search]);

  if (loadError && !list) return <ScreenError onRetry={() => load(true)} />;
  if (!list) return <ScreenLoader />;

  const handleViewReport = async (studentId: string) => {
    if (!studentId) return;
    setLoadingReportId(studentId);
    try {
      const { data: res } = await getAssessmentReport(studentId);
      if (!isMountedRef.current) return;
      setReportTarget(normalizeAssessmentReport(res));
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Failed to get assessment report', err);
      Alert.alert(
        'Unable to Load Report',
        'Could not fetch the assessment report for this student. Please check your network and try again.',
      );
    } finally {
      if (isMountedRef.current) {
        setLoadingReportId(null);
      }
    }
  };

  const handleMarkReviewed = async (studentId: string, notes: string) => {
    if (!studentId) return;
    Alert.alert(
      'Mark as reviewed?',
      'Mark this assessment as reviewed and ready for IUP creation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSubmittingReview(true);
            try {
              const trimmed = notes.trim();
              await markAssessmentReviewed(studentId, {
                notes: trimmed,
                status: 'ready_for_iup',
              });
              if (trimmed) {
                await addAssessmentNote(studentId, { note: trimmed });
              }
              if (!isMountedRef.current) return;
              setList((prev) =>
                prev
                  ? prev.map((item) =>
                      item.studentId === studentId ? { ...item, status: 'Reviewed' } : item,
                    )
                  : prev,
              );
              setReportTarget(null);
              await load(true);
            } catch (err) {
              if (!isMountedRef.current) return;
              console.error('Failed to mark assessment reviewed', err);
              Alert.alert(
                'Review Failed',
                'Failed to mark the assessment as reviewed. Please try again.',
              );
            } finally {
              if (isMountedRef.current) {
                setIsSubmittingReview(false);
              }
            }
          },
        },
      ],
    );
  };

  const handleExportPdf = (report: AssessmentReport) => {
    const text = generateAssessmentReportText(report);
    setExportContent(text);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessment Review"
        onTabPress={handleNavTab}
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
          accessibilityLabel="Search students by name, ID, program, or therapist"
          returnKeyType="search"
          clearButtonMode="while-editing"
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
                ? list.filter((r) => normalizeStatus(r.status) === opt).length
                : 0;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setStatusFilter(opt)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${opt}, ${count} students`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {opt} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.map((s, index) => {
          const isLoadingThis = loadingReportId === s.studentId;
          const rowKey = s.studentId ? `${s.studentId}-${s.dateCompleted || ''}` : `student-${index}`;

          return (
            <View key={rowKey} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={typography.bodyBold}>{s.studentName}</Text>
                <Text style={typography.caption}>
                  {s.age > 0 ? `Age ${s.age} · ` : ''}
                  {s.program}
                  {s.therapist && s.therapist !== 'Unassigned' ? ` · ${s.therapist}` : ''}
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
                    style={[styles.actionBtn, isLoadingThis && styles.actionBtnLoading]}
                    onPress={() => handleViewReport(s.studentId)}
                    disabled={isLoadingThis}
                    accessibilityRole="button"
                    accessibilityLabel={`View assessment report for ${s.studentName}`}
                    accessibilityState={{ busy: isLoadingThis }}
                  >
                    {isLoadingThis ? (
                      <ActivityIndicator size="small" color={colors.navyText} />
                    ) : (
                      <Text style={styles.actionBtnText}>View Report</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather
              name="search"
              size={32}
              color={colors.mutedText}
              style={{ marginBottom: spacing.xs }}
            />
            <Text style={styles.emptyText}>No students match the current filters.</Text>
            {(statusFilter !== 'All' || search.trim() !== '') && (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setSearch('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Reset filters and search query"
              >
                <Text style={styles.clearFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <ReportModal
        visible={Boolean(reportTarget)}
        report={reportTarget}
        isSubmitting={isSubmittingReview}
        onClose={() => setReportTarget(null)}
        onMarkReviewed={handleMarkReviewed}
        onExport={handleExportPdf}
      />

      <ExportPreviewModal
        visible={Boolean(exportContent)}
        title="Assessment Summary Report"
        filename={`${reportTarget?.studentName.replace(/\s+/g, '_') ?? 'Student'}_AssessmentSummary.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bgCard,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    color: colors.navyText,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: {
    flex: 1,
    minWidth: 200,
  },
  rowRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
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
    minHeight: 34,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLoading: {
    backgroundColor: colors.bgApp,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.pill,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
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
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modalScroll: { maxHeight: 420 },
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
  modalFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  exportBtn: {
    flex: 1,
    minWidth: 90,
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
    minWidth: 140,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnDisabled: {
    opacity: 0.6,
  },
  approveBtnText: { fontWeight: '700', color: colors.navyText },
});
