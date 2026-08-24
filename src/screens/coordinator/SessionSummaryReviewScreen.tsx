import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
} from 'react-native';
import {
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Users,
} from 'lucide-react-native';
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

type SummaryStatus = 'pending' | 'revision-required' | 'approved';

interface Summary {
  id: string;
  teacher: string;
  station: string;
  room: string;
  date: string;
  students: string[];
  trials: number;
  independence: number;
  incidents: number;
  status: SummaryStatus;
  notes: string;
}

interface ApiSummaryRow {
  id: string;
  sessionId: string;
  teacherName: string;
  stationName: string;
  date: string;
  bodyPreview: string;
  status: string;
  studentNames: string[];
  independencePercent: number;
}

const STATUS_FROM_API: Record<string, SummaryStatus> = {
  Pending: 'pending',
  Approved: 'approved',
  'Revision Required': 'revision-required',
};

function mapSummary(row: ApiSummaryRow): Summary {
  return {
    id: row.id,
    teacher: row.teacherName,
    station: row.stationName,
    room: '',
    date: row.date,
    students: row.studentNames ?? [],
    trials: 0,
    independence: row.independencePercent ?? 0,
    incidents: 0,
    status: STATUS_FROM_API[row.status] ?? 'pending',
    notes: row.bodyPreview ?? '',
  };
}

const STATUS_CONFIG: Record<SummaryStatus, { label: string; bg: string; text: string; border: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', bg: 'rgba(252,211,77,0.15)', text: '#B45309', border: 'rgba(252,211,77,0.45)', icon: Clock },
  'revision-required': { label: 'Revision Required', bg: 'rgba(248,113,113,0.12)', text: '#DC2626', border: 'rgba(248,113,113,0.35)', icon: AlertCircle },
  approved: { label: 'Approved', bg: 'rgba(74,222,128,0.12)', text: '#16A34A', border: 'rgba(74,222,128,0.35)', icon: CheckCircle },
};

const SECTIONS = ['Notes', 'Trial Data', 'Incident Report', 'General'];

const DARK = '#1F2937';
const SKY = '#38BDF8';
const AMBER = '#FCD34D';

function StatusBadge({ status }: { status: SummaryStatus }) {
  const sc = STATUS_CONFIG[status];
  const Icon = sc.icon;
  return (
    <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Icon size={12} color={sc.text} />
      <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
    </View>
  );
}

function FilterSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View style={styles.filterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.filterChip, value === opt && styles.filterChipActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.filterChipText, value === opt && styles.filterChipTextActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function SessionSummaryReviewScreen({ navigation }: NativeStackScreenProps<CoordinatorStackParamList, 'SessionSummaryReview'>) {
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
      setSummaries((Array.isArray(data) ? data : []).map(mapSummary));
    } catch (err) {
      setSummaries([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allStudents = Array.from(new Set(summaries.flatMap((s) => s.students))).sort();
  const allTeachers = Array.from(new Set(summaries.map((s) => s.teacher))).sort();

  const filtered = summaries.filter((s) => {
    const matchSearch =
      search === '' ||
      s.teacher.toLowerCase().includes(search.toLowerCase()) ||
      s.students.some((st) => st.toLowerCase().includes(search.toLowerCase()));
    const matchTeacher = teacherFilter === 'all' || s.teacher === teacherFilter;
    const matchStudent = studentFilter === 'all' || s.students.includes(studentFilter);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchTeacher && matchStudent && matchStatus;
  });

  const pendingCount = summaries.filter((s) => s.status === 'pending' || s.status === 'revision-required').length;

  const toggleSelectAll = () => {
    const filteredIds = filtered.map((s) => s.id);
    if (selectedIds.length === filteredIds.length && filteredIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIds);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const approveSelected = async () => {
    try {
      await bulkApproveSummaries(selectedIds);
    } catch (err) {}
    setSummaries((prev) => prev.map((s) => (selectedIds.includes(s.id) ? { ...s, status: 'approved' } : s)));
    showToast(`${selectedIds.length} session${selectedIds.length > 1 ? 's' : ''} approved`);
    setSelectedIds([]);
    setShowBulkConfirm(false);
  };

  const approveSingle = async (summary: Summary) => {
    try {
      await approveSummary(summary.id, { notes: coordinatorNotes });
    } catch (err) {}
    setSummaries((prev) => prev.map((s) => (s.id === summary.id ? { ...s, status: 'approved' } : s)));
    showToast(`Session by ${summary.teacher} approved`);
    setSelectedSummary(null);
    setCoordinatorNotes('');
    setShowRequestForm(false);
  };

  const handleRequestChanges = async (summary: Summary) => {
    if (!requestReason.trim()) {
      showToast('Please provide a reason for requesting changes', 'error');
      return;
    }
    try {
      await requestSummaryChanges(summary.id, { section: requestSection, reason: requestReason });
    } catch (err) {}
    setSummaries((prev) => prev.map((s) => (s.id === summary.id ? { ...s, status: 'revision-required' } : s)));
    showToast(`Changes requested for ${summary.teacher}'s session`, 'info');
    setSelectedSummary(null);
    setRequestReason('');
    setRequestSection('Notes');
    setShowRequestForm(false);
    setCoordinatorNotes('');
  };

  const openReview = (summary: Summary) => {
    setSelectedSummary(summary);
    setShowRequestForm(false);
    setCoordinatorNotes('');
    setRequestReason('');
  };

  const closeModal = () => {
    setSelectedSummary(null);
    setShowRequestForm(false);
    setCoordinatorNotes('');
    setRequestReason('');
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.id));

  const independenceColor = (v: number) => (v >= 70 ? '#4ADE80' : v >= 60 ? AMBER : '#F87171');

  const handleTabPress = (tab: string) => {
    const routeByTab: Record<string, keyof CoordinatorStackParamList> = {
      Dashboard: 'CoordinatorDashboard',
      Review: 'SessionSummaryReview',
      Schedule: 'CoordinatorSchedule',
      Parents: 'CoordinatorParentCommunication',
    };
    const route = routeByTab[tab];
    if (route) navigation?.navigate?.(route as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Review" onTabPress={handleTabPress} />

      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <FileText size={20} color={AMBER} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Session Summary Review</Text>
          <Text style={styles.headerSubtitle}>Therapy Coordinator · Review submitted summaries</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingPill}>
            <Clock size={14} color={AMBER} />
            <Text style={styles.pendingPillText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchWrap}>
          <Search size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search teacher or student..."
            placeholderTextColor="#6B7280"
          />
        </View>

        <Text style={styles.filterLabel}>Student</Text>
        <FilterSelect value={studentFilter} options={['all', ...allStudents]} onChange={setStudentFilter} />
        <Text style={styles.filterLabel}>Teacher</Text>
        <FilterSelect value={teacherFilter} options={['all', ...allTeachers]} onChange={setTeacherFilter} />
        <Text style={styles.filterLabel}>Status</Text>
        <FilterSelect
          value={statusFilter}
          options={['all', 'pending', 'revision-required', 'approved']}
          onChange={setStatusFilter}
        />

        <View style={styles.bulkRow}>
          <TouchableOpacity style={styles.checkbox} onPress={toggleSelectAll}>
            <View style={[styles.checkboxBox, allFilteredSelected && styles.checkboxChecked]}>
              {allFilteredSelected && <CheckCircle size={14} color={DARK} />}
            </View>
            <Text style={styles.bulkLabel}>
              {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkApproveBtn, selectedIds.length === 0 && { opacity: 0.3 }]}
            disabled={selectedIds.length === 0}
            onPress={() => setShowBulkConfirm(true)}
          >
            <Text style={styles.bulkApproveText}>Bulk Approve ({selectedIds.length})</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No summaries match the current filters.</Text>}
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <View style={[styles.summaryCard, selected && styles.summaryCardSelected]}>
                <View style={styles.cardTopRow}>
                  <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelect(item.id)}>
                    <View style={[styles.checkboxBox, selected && styles.checkboxChecked]}>
                      {selected && <CheckCircle size={14} color={DARK} />}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cardDate}>{item.date}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={styles.cardTeacher}>{item.teacher}</Text>
                <Text style={styles.cardMeta}>{item.station} · {item.room}</Text>
                <View style={styles.tagRow}>
                  {item.students.map((st) => (
                    <View key={st} style={styles.studentTag}>
                      <Text style={styles.studentTagText}>{st}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.metricRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricValue}>{item.trials}</Text>
                    <Text style={styles.metricLabel}>Trials</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: independenceColor(item.independence) }]}>{item.independence}%</Text>
                    <Text style={styles.metricLabel}>Independence</Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={[styles.metricValue, { color: item.incidents > 0 ? '#FB923C' : '#6B7280' }]}>{item.incidents}</Text>
                    <Text style={styles.metricLabel}>Incidents</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.reviewBtn} onPress={() => openReview(item)}>
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </ScrollView>

      {/* Bulk Approve Confirmation */}
      <Modal visible={showBulkConfirm} transparent animationType="fade" onRequestClose={() => setShowBulkConfirm(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalPanel, styles.confirmPanel]}>
            <Text style={styles.modalTitle}>Confirm Bulk Approve</Text>
            <Text style={styles.modalBody}>
              You are about to approve <Text style={styles.modalBodyStrong}>{selectedIds.length}</Text> session summar{selectedIds.length > 1 ? 'ies' : 'y'}. This action cannot be undone.
            </Text>
            <View style={[styles.modalFooter, { paddingHorizontal: 0, paddingBottom: 0, marginTop: 24 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBulkConfirm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveAllBtn} onPress={approveSelected}>
                <Text style={styles.approveAllBtnText}>Approve All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Session Detail Modal */}
      <Modal visible={selectedSummary !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={[styles.modalPanel, styles.detailPanel]}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Review</Text>
                {selectedSummary && (
                  <Text style={styles.headerSubtitle}>
                    {selectedSummary.teacher} · {selectedSummary.date} · {selectedSummary.station} · {selectedSummary.room}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={closeModal} hitSlop={8}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.detailBody} keyboardShouldPersistTaps="handled">
              {selectedSummary && (
                <>
                  <StatusBadge status={selectedSummary.status} />

                  <Text style={styles.sectionLabel}>Students</Text>
                  <View style={styles.tagRow}>
                    {selectedSummary.students.map((st) => (
                      <View key={st} style={styles.studentTagLg}>
                        <Users size={14} color={SKY} />
                        <Text style={styles.studentTagLgText}>{st}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: SKY }]}>{selectedSummary.trials}</Text>
                      <Text style={styles.statLabel}>Trials</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: independenceColor(selectedSummary.independence) }]}>
                        {selectedSummary.independence}%
                      </Text>
                      <Text style={styles.statLabel}>Independence</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: selectedSummary.incidents > 0 ? '#FB923C' : '#4ADE80' }]}>
                        {selectedSummary.incidents}
                      </Text>
                      <Text style={styles.statLabel}>Incidents</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>Teacher Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{selectedSummary.notes}</Text>
                  </View>

                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Coordinator Notes</Text>
                    <View style={styles.internalTag}>
                      <Text style={styles.internalTagText}>Internal only</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.textArea}
                    value={coordinatorNotes}
                    onChangeText={setCoordinatorNotes}
                    multiline
                    placeholder="Add internal notes (not visible to teacher)..."
                    placeholderTextColor="#6B7280"
                  />

                  {showRequestForm && (
                    <View style={styles.requestForm}>
                      <Text style={[styles.sectionLabel, { color: '#F87171' }]}>Request Changes</Text>
                      <Text style={styles.fieldLabel}>Section</Text>
                      <FilterSelect value={requestSection} options={SECTIONS} onChange={setRequestSection} />
                      <Text style={styles.fieldLabel}>Reason</Text>
                      <TextInput
                        style={styles.textArea}
                        value={requestReason}
                        onChangeText={setRequestReason}
                        multiline
                        placeholder="Describe what needs to be corrected or added..."
                        placeholderTextColor="#6B7280"
                      />
                      <TouchableOpacity style={styles.submitRequestBtn} onPress={() => handleRequestChanges(selectedSummary)}>
                        <Text style={styles.submitRequestText}>Submit Change Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { paddingHorizontal: 20, paddingBottom: 16, marginTop: 0, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}>
              <TouchableOpacity
                style={styles.requestChangesFooterBtn}
                onPress={() => setShowRequestForm((v) => !v)}
              >
                <Text style={styles.requestChangesFooterText}>
                  {showRequestForm ? 'Cancel Request' : 'Request Changes'}
                </Text>
              </TouchableOpacity>
              {!showRequestForm && selectedSummary && (
                <TouchableOpacity style={styles.approveSingleBtn} onPress={() => approveSingle(selectedSummary)}>
                  <Text style={styles.approveSingleBtnText}>Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerIconWrap: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(252,211,77,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: DARK, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#6B7280', fontSize: 11, marginTop: 2 },
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
  pendingPillText: { color: AMBER, fontSize: 11, fontWeight: '700' },

  content: { padding: 16, gap: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: DARK, fontSize: 13, paddingVertical: 0 },
  filterLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  filterChipActive: { borderColor: SKY, backgroundColor: 'rgba(56,189,248,0.15)' },
  filterChipText: { color: '#4B5563', fontSize: 12 },
  filterChipTextActive: { color: SKY, fontWeight: '600' },

  bulkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: AMBER, borderColor: AMBER },
  bulkLabel: { color: '#4B5563', fontSize: 13 },
  bulkApproveBtn: { backgroundColor: AMBER, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  bulkApproveText: { color: DARK, fontSize: 13, fontWeight: '700' },

  summaryCard: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 8 },
  summaryCardSelected: { backgroundColor: '#EFF6FF', borderColor: SKY },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardDate: { color: '#4B5563', fontSize: 12, flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '500' },
  cardTeacher: { color: DARK, fontSize: 15, fontWeight: '600' },
  cardMeta: { color: '#6B7280', fontSize: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  studentTag: { backgroundColor: 'rgba(56,189,248,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  studentTagText: { color: SKY, fontSize: 11 },
  metricRow: { flexDirection: 'row', gap: 8 },
  metric: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  metricValue: { color: DARK, fontSize: 16, fontWeight: '700' },
  metricLabel: { color: '#6B7280', fontSize: 10, marginTop: 2 },
  reviewBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reviewBtnText: { color: SKY, fontSize: 12, fontWeight: '600' },

  emptyText: { color: '#6B7280', textAlign: 'center', paddingVertical: 40 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalPanel: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', width: '100%', maxWidth: 560, maxHeight: '92%', overflow: 'hidden' },
  confirmPanel: { maxWidth: 400, padding: 24 },
  detailPanel: { maxHeight: '92%' },
  modalTitle: { color: DARK, fontSize: 17, fontWeight: '700' },
  modalBody: { color: '#6B7280', fontSize: 13, lineHeight: 19, marginTop: 8 },
  modalBodyStrong: { color: DARK, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText: { color: DARK, fontSize: 13, fontWeight: '500' },
  approveAllBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: AMBER, alignItems: 'center' },
  approveAllBtnText: { color: DARK, fontSize: 13, fontWeight: '700' },

  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  detailBody: { padding: 20, gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  internalTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  internalTagText: { color: '#6B7280', fontSize: 10 },
  studentTagLg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  studentTagLgText: { color: SKY, fontSize: 13, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  notesBox: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  notesText: { color: '#374151', fontSize: 13, lineHeight: 20 },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    color: DARK,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  requestForm: {
    backgroundColor: 'rgba(248,113,113,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  fieldLabel: { fontSize: 12, color: '#9CA3AF' },
  submitRequestBtn: { backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  submitRequestText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  requestChangesFooterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    alignItems: 'center',
  },
  requestChangesFooterText: { color: '#F87171', fontSize: 13, fontWeight: '500' },
  approveSingleBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#22C55E', alignItems: 'center' },
  approveSingleBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
