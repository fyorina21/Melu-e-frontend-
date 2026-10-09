// screens/programdirector/AssessmentReviewScreen.tsx
// SCR-PD-002: Assessment Review & Approval

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
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
  AssessmentReviewHeader,
  AssessmentReviewFilterBar,
  AssessmentReviewRow,
  AssessmentReportModal,
} from './assessmentreview/components';
import {
  normalizeStatus,
  normalizeAssessmentItem,
  normalizeAssessmentReport,
  generateAssessmentReportText,
  type AssessmentListItem,
  type AssessmentReport,
} from './assessmentreview/reviewTypes';

export default function AssessmentReviewScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentReview'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
      setList(rawList.map(normalizeAssessmentItem));
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

  const handleViewReport = async (studentId: string) => {
    try {
      const { data: res } = await getAssessmentReport(studentId);
      setReportTarget(normalizeAssessmentReport(res));
    } catch (err) {
      console.error('Failed to get assessment report', err);
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
              await markAssessmentReviewed(studentId, {
                notes,
                status: 'ready_for_iup',
              });
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
    setExportContent(generateAssessmentReportText(report));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessment"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])}
      />

      <View style={[styles.headerWrapper, isTablet && styles.headerWrapperTablet]}>
        <AssessmentReviewHeader />
        <AssessmentReviewFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          list={list}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.bodyWrapper, isTablet && styles.bodyWrapperTablet]}>
          {filtered.map((s) => (
            <AssessmentReviewRow key={s.studentId} item={s} onViewReport={handleViewReport} />
          ))}
          {filtered.length === 0 && (
            <Text style={[typography.body, styles.emptyText]}>
              No students match the current filters.
            </Text>
          )}
        </View>
      </ScrollView>

      <AssessmentReportModal
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
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  headerWrapper: {
    width: '100%',
  },
  headerWrapperTablet: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 50,
  },
  bodyWrapper: {
    gap: spacing.md,
    width: '100%',
  },
  bodyWrapperTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.lg,
    color: colors.mutedText,
  },
});
