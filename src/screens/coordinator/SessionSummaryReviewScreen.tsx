import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToast } from '../../context/ToastContext';
import AppNavbar from '../../components/AppNavbar';
import {
  getPendingSummaries,
  approveSummary,
  requestSummaryChanges,
  bulkApproveSummaries,
} from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

import { type Summary, type ApiSummaryRow, mapSummary, DARK, AMBER } from './summaryreview/types';
import { SummaryFilterBar } from './summaryreview/components/SummaryFilterBar';
import { SummaryReviewCard } from './summaryreview/components/SummaryReviewCard';
import { BulkApproveModal } from './summaryreview/components/BulkApproveModal';
import { SummaryDetailModal } from './summaryreview/components/SummaryDetailModal';

export default function SessionSummaryReviewScreen({
  navigation,
}: NativeStackScreenProps<CoordinatorStackParamList, 'SessionSummaryReview'>) {
  const { showToast } = useToast();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [search, setSearch] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestSection, setRequestSection] = useState('Notes');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getPendingSummaries({});
      setSummaries(((Array.isArray(data) ? data : []) as ApiSummaryRow[]).map(mapSummary));
    } catch {
      setSummaries([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allStudents = useMemo(() => {
    return Array.from(new Set(summaries.flatMap((s) => s.students))).sort();
  }, [summaries]);

  const allTeachers = useMemo(() => {
    return Array.from(new Set(summaries.map((s) => s.teacher))).sort();
  }, [summaries]);

  const filtered = useMemo(() => {
    return summaries.filter((s) => {
      const matchSearch =
        search === '' ||
        s.teacher.toLowerCase().includes(search.toLowerCase()) ||
        s.students.some((st) => st.toLowerCase().includes(search.toLowerCase()));
      const matchTeacher = teacherFilter === 'all' || s.teacher === teacherFilter;
      const matchStudent = studentFilter === 'all' || s.students.includes(studentFilter);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchTeacher && matchStudent && matchStatus;
    });
  }, [summaries, search, teacherFilter, studentFilter, statusFilter]);

  const pendingCount = useMemo(() => {
    return summaries.filter((s) => s.status === 'pending' || s.status === 'revision-required')
      .length;
  }, [summaries]);

  const toggleSelectAll = useCallback(() => {
    const filteredIds = filtered.map((s) => s.id);
    if (
      selectedIds.length === filteredIds.length &&
      filteredIds.every((id) => selectedIds.includes(id))
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIds);
    }
  }, [filtered, selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const approveSelected = useCallback(async () => {
    try {
      await bulkApproveSummaries(selectedIds);
    } catch {
      // Best-effort local update
    }
    setSummaries((prev) =>
      prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status: 'approved' } : s)),
    );
    showToast(`${selectedIds.length} session${selectedIds.length > 1 ? 's' : ''} approved`);
    setSelectedIds([]);
    setShowBulkConfirm(false);
  }, [selectedIds, showToast]);

  const approveSingle = useCallback(
    async (summary: Summary) => {
      try {
        await approveSummary(summary.id, { notes: coordinatorNotes });
      } catch {
        // Best-effort local update
      }
      setSummaries((prev) =>
        prev.map((s) => (s.id === summary.id ? { ...s, status: 'approved' } : s)),
      );
      showToast(`Session by ${summary.teacher} approved`);
      setSelectedSummary(null);
      setCoordinatorNotes('');
      setShowRequestForm(false);
    },
    [coordinatorNotes, showToast],
  );

  const handleRequestChanges = useCallback(
    async (summary: Summary) => {
      if (!requestReason.trim()) {
        showToast('Please provide a reason for requesting changes', 'error');
        return;
      }
      try {
        await requestSummaryChanges(summary.id, { section: requestSection, reason: requestReason });
      } catch {
        // Best-effort local update
      }
      setSummaries((prev) =>
        prev.map((s) => (s.id === summary.id ? { ...s, status: 'revision-required' } : s)),
      );
      showToast(`Changes requested for ${summary.teacher}'s session`, 'info');
      setSelectedSummary(null);
      setRequestReason('');
      setRequestSection('Notes');
      setShowRequestForm(false);
      setCoordinatorNotes('');
    },
    [requestReason, requestSection, showToast],
  );

  const openReview = useCallback((summary: Summary) => {
    setSelectedSummary(summary);
    setShowRequestForm(false);
    setCoordinatorNotes('');
    setRequestReason('');
  }, []);

  const closeModal = useCallback(() => {
    setSelectedSummary(null);
    setShowRequestForm(false);
    setCoordinatorNotes('');
    setRequestReason('');
  }, []);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const handleTabPress = useCallback(
    (tab: string) => {
      const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
        Dashboard: 'CoordinatorDashboard',
        Review: 'SessionSummaryReview',
        Schedule: 'CoordinatorSchedule',
        Parents: 'CoordinatorParentCommunication',
      };
      const route = routeByTab[tab];
      if (route) navigation?.navigate?.(route as never);
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Review" onTabPress={handleTabPress} />

      <View style={styles.header}>
        <View style={styles.headerResponsive}>
          <View style={styles.headerIconWrap}>
            <Feather name="file-text" size={20} color={AMBER} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Session Summary Review</Text>
            <Text style={styles.headerSubtitle}>
              Therapy Coordinator · Review submitted summaries
            </Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingPill}>
              <Feather name="clock" size={14} color={AMBER} />
              <Text style={styles.pendingPillText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveContainer}>
          <SummaryFilterBar
            search={search}
            studentFilter={studentFilter}
            teacherFilter={teacherFilter}
            statusFilter={statusFilter}
            students={allStudents}
            teachers={allTeachers}
            selectedCount={selectedIds.length}
            allFilteredSelected={allFilteredSelected}
            onSearchChange={setSearch}
            onStudentFilterChange={setStudentFilter}
            onTeacherFilterChange={setTeacherFilter}
            onStatusFilterChange={setStatusFilter}
            onToggleSelectAll={toggleSelectAll}
            onBulkApprovePress={() => setShowBulkConfirm(true)}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No summaries match the current filters.</Text>
            }
            renderItem={({ item }) => (
              <SummaryReviewCard
                summary={item}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={toggleSelect}
                onReview={openReview}
              />
            )}
          />
        </View>
      </ScrollView>

      {/* Bulk Approve Confirmation Modal */}
      <BulkApproveModal
        visible={showBulkConfirm}
        count={selectedIds.length}
        onConfirm={approveSelected}
        onCancel={() => setShowBulkConfirm(false)}
      />

      {/* Session Detail Modal */}
      <SummaryDetailModal
        summary={selectedSummary}
        coordinatorNotes={coordinatorNotes}
        showRequestForm={showRequestForm}
        requestSection={requestSection}
        requestReason={requestReason}
        onCoordinatorNotesChange={setCoordinatorNotes}
        onToggleRequestForm={() => setShowRequestForm((v) => !v)}
        onRequestSectionChange={setRequestSection}
        onRequestReasonChange={setRequestReason}
        onRequestChanges={handleRequestChanges}
        onApproveSingle={approveSingle}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerResponsive: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(252,211,77,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.3)',
  },
  pendingPillText: {
    color: AMBER,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1200,
    gap: 10,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
