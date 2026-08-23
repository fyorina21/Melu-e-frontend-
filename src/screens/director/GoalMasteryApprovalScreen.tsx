// screens/director/GoalMasteryApprovalScreen.js
// SCR-DIR-003: Goal Mastery Approval

import React, { useEffect, useState, useCallback } from 'react';
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
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB, PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth, ROLES } from '../../context/AuthContext';
import type { DirectorStackParamList, ProgramDirectorStackParamList } from '../../types';

interface MasteryListItem {
  goalId: string;
  studentName: string;
  goalName: string;
  domain: string;
  description: string;
  teacherA: string;
  teacherBOutcome: string;
  teacherCOutcome: string;
  dateSubmitted: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  station: string;
  teacherBName: string;
  teacherCName: string;
  teacherBNotes: string;
  teacherCNotes: string;
  trials: Array<{ id: string; date: string; time: string; code: '+' | 'G' | 'PP' | 'FP' }>;
}

const INITIAL_DATA: MasteryListItem[] = [
  {
    goalId: 'g1',
    studentName: 'Student A',
    goalName: 'Identify Colors',
    domain: 'Cognitive',
    description: 'Student will independently identify 5 colors across novel settings.',
    teacherA: 'Teacher A',
    teacherBOutcome: 'Independent with Novel Person',
    teacherCOutcome: 'Both',
    dateSubmitted: '2026-08-01',
    status: 'Pending',
    station: 'Station 1 — Basic Skills',
    teacherBName: 'Teacher B',
    teacherCName: 'Teacher C',
    teacherBNotes: 'Performed well across all colors.',
    teacherCNotes: 'Excellent generalization.',
    trials: [
      { id: 't1', date: '2026-07-28', time: '9:02 AM', code: '+' },
      { id: 't2', date: '2026-07-29', time: '9:15 AM', code: '+' },
      { id: 't3', date: '2026-07-30', time: '10:05 AM', code: 'G' },
      { id: 't4', date: '2026-07-31', time: '9:30 AM', code: '+' },
      { id: 't5', date: '2026-08-01', time: '9:00 AM', code: 'PP' },
    ],
  },
  {
    goalId: 'g2',
    studentName: 'Student B',
    goalName: 'Request Items',
    domain: 'Communication',
    description: 'Student will independently request desired items using PECS.',
    teacherA: 'Teacher A',
    teacherBOutcome: 'Independent in Novel Environment',
    teacherCOutcome: 'Failed - Required Prompt',
    dateSubmitted: '2026-08-02',
    status: 'Pending',
    station: 'Station 1 — Basic Skills',
    teacherBName: 'Teacher B',
    teacherCName: 'Teacher C',
    teacherBNotes: 'Requested items independently during snack.',
    teacherCNotes: 'Needed partial physical prompt on trial 2.',
    trials: [
      { id: 't1', date: '2026-07-29', time: '1:10 PM', code: '+' },
      { id: 't2', date: '2026-07-30', time: '1:15 PM', code: '+' },
      { id: 't3', date: '2026-07-31', time: '2:00 PM', code: 'G' },
      { id: 't4', date: '2026-08-01', time: '1:30 PM', code: '+' },
      { id: 't5', date: '2026-08-02', time: '1:45 PM', code: 'PP' },
    ],
  },
  {
    goalId: 'g3',
    studentName: 'Student A',
    goalName: 'Eye Contact',
    domain: 'Social',
    description: 'Student will maintain eye contact for 3 seconds upon greeting.',
    teacherA: 'Teacher A',
    teacherBOutcome: 'Both',
    teacherCOutcome: 'Both',
    dateSubmitted: '2026-08-03',
    status: 'Approved',
    station: 'Station 2 — Advanced Skills',
    teacherBName: 'Teacher B',
    teacherCName: 'Teacher C',
    teacherBNotes: 'Solid eye contact during arrivals.',
    teacherCNotes: 'Maintained eye contact consistently.',
    trials: [
      { id: 't1', date: '2026-07-30', time: '8:30 AM', code: '+' },
      { id: 't2', date: '2026-07-31', time: '8:35 AM', code: '+' },
      { id: 't3', date: '2026-08-01', time: '8:30 AM', code: '+' },
      { id: 't4', date: '2026-08-02', time: '8:40 AM', code: '+' },
      { id: 't5', date: '2026-08-03', time: '8:30 AM', code: '+' },
    ],
  },
  {
    goalId: 'g4',
    studentName: 'Student C',
    goalName: 'Sort by Category',
    domain: 'Cognitive',
    description: 'Student will sort items into 3 categories independently.',
    teacherA: 'Teacher A',
    teacherBOutcome: 'Failed - Required Prompt',
    teacherCOutcome: 'Independent with Novel Person',
    dateSubmitted: '2026-08-03',
    status: 'Pending',
    station: 'Station 2 — Advanced Skills',
    teacherBName: 'Teacher B',
    teacherCName: 'Teacher C',
    teacherBNotes: 'Struggled with food vs animal categories.',
    teacherCNotes: 'Sorted correctly after setup.',
    trials: [
      { id: 't1', date: '2026-07-30', time: '10:00 AM', code: 'G' },
      { id: 't2', date: '2026-07-31', time: '10:15 AM', code: '+' },
      { id: 't3', date: '2026-08-01', time: '10:05 AM', code: 'PP' },
      { id: 't4', date: '2026-08-02', time: '10:30 AM', code: '+' },
      { id: 't5', date: '2026-08-03', time: '10:00 AM', code: '+' },
    ],
  },
];

export default function GoalMasteryApprovalScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList | ProgramDirectorStackParamList, 'GoalMasteryApproval'>) {
  const { session } = useAuth();
  const isProgramDirector = session?.role === ROLES.PROGRAM_DIRECTOR;

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('All Students');
  const [selectedTeacher, setSelectedTeacher] = useState('All Teachers');
  const [selectedStation, setSelectedStation] = useState('All Stations');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Dropdown Visibility Toggle States
  const [openDropdown, setOpenDropdown] = useState<'student' | 'teacher' | 'station' | null>(null);

  // Data & Modal States
  const [list, setList] = useState<MasteryListItem[]>(INITIAL_DATA);
  const [selectedGoal, setSelectedGoal] = useState<MasteryListItem | null>(null);
  const [trialLogVisible, setTrialLogVisible] = useState(false);
  const [directorNotes, setDirectorNotes] = useState('');
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [exportContent, setExportContent] = useState<string | null>(null);

  // Filter Logic
  const filteredList = list.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.goalName.toLowerCase().includes(search.toLowerCase());
    const matchesStudent = selectedStudent === 'All Students' || item.studentName === selectedStudent;
    const matchesTeacher = selectedTeacher === 'All Teachers' || item.teacherA === selectedTeacher;
    const matchesStation = selectedStation === 'All Stations' || item.station === selectedStation;
    return matchesSearch && matchesStudent && matchesTeacher && matchesStation;
  });

  const handleApprove = () => {
    if (!selectedGoal) return;
    setList((prev) =>
      prev.map((g) => (g.goalId === selectedGoal.goalId ? { ...g, status: 'Approved' } : g))
    );
    setShowConfirmApprove(false);
    setSelectedGoal(null);
    setDirectorNotes('');
    Alert.alert('Success', 'Goal mastery has been approved.');
  };

  const handleReject = () => {
    if (!selectedGoal) return;
    setList((prev) =>
      prev.map((g) => (g.goalId === selectedGoal.goalId ? { ...g, status: 'Rejected' } : g))
    );
    setSelectedGoal(null);
    setDirectorNotes('');
    Alert.alert('Rejected', 'Sent back to Teacher A for review.');
  };

  const renderOutcomeBadge = (outcome: string) => {
    let bg = '#DCFCE7';
    let text = '#15803D';

    if (outcome.includes('Independent')) {
      bg = '#DBEAFE';
      text = '#1D4ED8';
    } else if (outcome.includes('Failed')) {
      bg = '#FEE2E2';
      text = '#DC2626';
    }

    return (
      <View style={[styles.pillBadge, { backgroundColor: bg }]}>
        <Text style={[styles.pillBadgeText, { color: text }]}>{outcome}</Text>
      </View>
    );
  };

  const renderStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
    let bg = '#FEF3C7';
    let text = '#D97706';
    let icon = 'alert-circle';

    if (status === 'Approved') {
      bg = '#DCFCE7';
      text = '#16A34A';
      icon = 'check-circle';
    } else if (status === 'Rejected') {
      bg = '#FEE2E2';
      text = '#DC2626';
      icon = 'x-circle';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={12} color={text} />
        <Text style={[styles.statusBadgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const renderTrialCircle = (code: '+' | 'G' | 'PP' | 'FP') => {
    let bg = '#22C55E';
    let text = '+';

    if (code === 'G') {
      bg = '#EAB308';
      text = 'G';
    } else if (code === 'PP') {
      bg = '#F97316';
      text = 'PP';
    } else if (code === 'FP') {
      bg = '#EF4444';
      text = 'FP';
    }

    return (
      <View key={Math.random()} style={[styles.trialCircle, { backgroundColor: bg }]}>
        <Text style={styles.trialCircleText}>{text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Approvals"
        onTabPress={(t) =>
          navigation?.navigate?.(
            (isProgramDirector ? PD_ROUTE_BY_TAB[t] : DIRECTOR_ROUTE_BY_TAB[t]) as never
          )
        }
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Top Filter Bar */}
        <View style={styles.filterBar}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.filterLabel}>Search</Text>
            <View style={styles.searchInputWrapper}>
              <Feather name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Student or goal name..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Student Filter Dropdown */}
          <View style={styles.filterDropdownWrapper}>
            <Text style={styles.filterLabel}>Student</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setOpenDropdown(openDropdown === 'student' ? null : 'student')}
            >
              <Text style={styles.dropdownBtnText}>{selectedStudent}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'student' && (
              <View style={styles.dropdownMenu}>
                {['All Students', 'Student A', 'Student B', 'Student C', 'Student D'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedStudent(s);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedStudent === s && styles.dropdownItemActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Teacher Filter Dropdown */}
          <View style={styles.filterDropdownWrapper}>
            <Text style={styles.filterLabel}>Teacher</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setOpenDropdown(openDropdown === 'teacher' ? null : 'teacher')}
            >
              <Text style={styles.dropdownBtnText}>{selectedTeacher}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'teacher' && (
              <View style={styles.dropdownMenu}>
                {['All Teachers', 'Teacher A', 'Teacher B', 'Teacher C'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedTeacher(t);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedTeacher === t && styles.dropdownItemActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Station Filter Dropdown */}
          <View style={styles.filterDropdownWrapper}>
            <Text style={styles.filterLabel}>Station</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setOpenDropdown(openDropdown === 'station' ? null : 'station')}
            >
              <Text style={styles.dropdownBtnText}>{selectedStation}</Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {openDropdown === 'station' && (
              <View style={styles.dropdownMenu}>
                {[
                  'All Stations',
                  'Station 1 — Basic Skills',
                  'Station 2 — Advanced Skills',
                ].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedStation(st);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedStation === st && styles.dropdownItemActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* From Date Filter */}
          <View style={styles.filterDateWrapper}>
            <Text style={styles.filterLabel}>From</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="mm/dd/yyyy"
              placeholderTextColor="#94A3B8"
              value={fromDate}
              onChangeText={setFromDate}
            />
          </View>

          {/* To Date Filter */}
          <View style={styles.filterDateWrapper}>
            <Text style={styles.filterLabel}>To</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="mm/dd/yyyy"
              placeholderTextColor="#94A3B8"
              value={toDate}
              onChangeText={setToDate}
            />
          </View>
        </View>

        {/* Goal Mastery Approval Data Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 1.2 }]}>STUDENT</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>GOAL</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>TEACHER A</Text>
            <Text style={[styles.th, { flex: 2 }]}>TEACHER B OUTCOME</Text>
            <Text style={[styles.th, { flex: 2 }]}>TEACHER C OUTCOME</Text>
            <Text style={[styles.th, { flex: 1.3 }]}>DATE SUBMITTED</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>STATUS</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>ACTIONS</Text>
          </View>

          {filteredList.map((item, idx) => (
            <View
              key={item.goalId}
              style={[
                styles.tableBodyRow,
                idx % 2 === 1 && { backgroundColor: '#F8FAFC' },
              ]}
            >
              <Text style={[styles.tdBold, { flex: 1.2 }]}>{item.studentName}</Text>
              <Text style={[styles.td, { flex: 1.5 }]}>{item.goalName}</Text>
              <Text style={[styles.td, { flex: 1.2 }]}>{item.teacherA}</Text>
              <View style={[{ flex: 2 }, styles.tdFlex]}>
                {renderOutcomeBadge(item.teacherBOutcome)}
              </View>
              <View style={[{ flex: 2 }, styles.tdFlex]}>
                {renderOutcomeBadge(item.teacherCOutcome)}
              </View>
              <Text style={[styles.tdMuted, { flex: 1.3 }]}>{item.dateSubmitted}</Text>
              <View style={[{ flex: 1.2 }, styles.tdFlex]}>
                {renderStatusBadge(item.status)}
              </View>
              <View style={[{ flex: 1, alignItems: 'flex-end' }]}>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => setSelectedGoal(item)}
                >
                  <Feather name="file-text" size={12} color="#334155" />
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredList.length === 0 && (
            <View style={styles.emptyTable}>
              <Text style={styles.emptyTableText}>No mastery verification records found.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Review Mastery Modal */}
      {selectedGoal && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedGoal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reviewModalContainer}>
              {/* Modal Header */}
              <View style={styles.reviewModalHeader}>
                <View>
                  <Text style={styles.reviewModalTitle}>
                    Mastery Review — {selectedGoal.goalName}
                  </Text>
                  <Text style={styles.reviewModalSubtitle}>
                    {selectedGoal.studentName} · Submitted {selectedGoal.dateSubmitted}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedGoal(null)}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.reviewModalBody}>
                {/* Student & Goal Info Box */}
                <View style={styles.infoCard}>
                  <Text style={styles.sectionHeaderTitle}>STUDENT & GOAL</Text>
                  <View style={styles.infoGridRow}>
                    <View style={styles.infoGridCol}>
                      <Text style={styles.infoLabel}>Student</Text>
                      <Text style={styles.infoValueBold}>{selectedGoal.studentName}</Text>
                    </View>
                    <View style={styles.infoGridCol}>
                      <Text style={styles.infoLabel}>Goal</Text>
                      <Text style={styles.infoValueBold}>{selectedGoal.goalName}</Text>
                    </View>
                    <View style={styles.infoGridCol}>
                      <Text style={styles.infoLabel}>Domain</Text>
                      <Text style={styles.infoValueBold}>{selectedGoal.domain}</Text>
                    </View>
                  </View>
                  <Text style={[styles.infoLabel, { marginTop: spacing.sm }]}>Description</Text>
                  <Text style={styles.infoValueDesc}>{selectedGoal.description}</Text>
                </View>

                {/* Teacher A Data Block */}
                <View style={styles.teacherABlock}>
                  <Text style={styles.blueSectionTitle}>
                    TEACHER A DATA — {selectedGoal.teacherA.toUpperCase()}
                  </Text>
                  <Text style={styles.criteriaText}>
                    Mastery criteria: 80% independent over 3 consecutive sessions across 2 novel contexts.
                  </Text>
                  <Text style={styles.lastTrialsLabel}>Last 5 trials:</Text>

                  <View style={styles.trialsRow}>
                    {selectedGoal.trials.map((tr) => renderTrialCircle(tr.code))}
                  </View>

                  <View style={styles.trialsLegendRow}>
                    <Text style={styles.legendText}>
                      <Text style={{ color: '#22C55E', fontWeight: 'bold' }}>+ </Text>
                      Independent
                    </Text>
                    <Text style={styles.legendText}>
                      <Text style={{ color: '#EAB308', fontWeight: 'bold' }}>G </Text>
                      Gestural
                    </Text>
                    <Text style={styles.legendText}>
                      <Text style={{ color: '#F97316', fontWeight: 'bold' }}>PP </Text>
                      Partial Physical
                    </Text>
                    <Text style={styles.legendText}>
                      <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>FP </Text>
                      Full Physical
                    </Text>
                  </View>
                </View>

                {/* Teacher B and Teacher C Split Cards */}
                <View style={styles.splitTeachersRow}>
                  <View style={styles.teacherSubCard}>
                    <Text style={styles.subCardTitle}>TEACHER B</Text>
                    <Text style={styles.subCardName}>{selectedGoal.teacherBName}</Text>
                    <View style={{ marginVertical: 6 }}>
                      {renderOutcomeBadge(selectedGoal.teacherBOutcome)}
                    </View>
                    <Text style={styles.subCardNotes}>{selectedGoal.teacherBNotes}</Text>
                  </View>

                  <View style={styles.teacherSubCard}>
                    <Text style={styles.subCardTitle}>TEACHER C</Text>
                    <Text style={styles.subCardName}>{selectedGoal.teacherCName}</Text>
                    <View style={{ marginVertical: 6 }}>
                      {renderOutcomeBadge(selectedGoal.teacherCOutcome)}
                    </View>
                    <Text style={styles.subCardNotes}>{selectedGoal.teacherCNotes}</Text>
                  </View>
                </View>

                {/* View Trial Log Button */}
                <TouchableOpacity
                  style={styles.trialLogOutlineBtn}
                  onPress={() => setTrialLogVisible(true)}
                >
                  <Feather name="file-text" size={14} color="#2563EB" />
                  <Text style={styles.trialLogOutlineBtnText}>View Trial Log</Text>
                </TouchableOpacity>

                {/* Director Notes Input */}
                <View style={{ marginTop: spacing.md }}>
                  <Text style={styles.sectionHeaderTitle}>DIRECTOR NOTES (OPTIONAL)</Text>
                  <TextInput
                    style={styles.directorNotesArea}
                    multiline
                    placeholder="Add your notes here..."
                    placeholderTextColor="#94A3B8"
                    value={directorNotes}
                    onChangeText={setDirectorNotes}
                  />
                </View>

                {/* Confirmation Box (Inside Modal Footer flow) */}
                {showConfirmApprove && (
                  <View style={styles.confirmInlineBox}>
                    <Text style={styles.confirmInlineTitle}>
                      Approve mastery for {selectedGoal.goalName}?
                    </Text>
                    <View style={styles.confirmInlineActions}>
                      <TouchableOpacity
                        style={styles.confirmCancelBtn}
                        onPress={() => setShowConfirmApprove(false)}
                      >
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmApproveBtn} onPress={handleApprove}>
                        <Text style={styles.confirmApproveText}>Yes, Approve</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal Bottom Actions */}
              <View style={styles.reviewModalFooter}>
                <TouchableOpacity
                  style={styles.exportPdfBtn}
                  onPress={() =>
                    setExportContent(
                      `Goal Mastery Approval Record\nStudent: ${selectedGoal.studentName}\nGoal: ${selectedGoal.goalName}\nStatus: ${selectedGoal.status}`
                    )
                  }
                >
                  <Feather name="file-text" size={14} color="#334155" />
                  <Text style={styles.exportPdfBtnText}>Export PDF</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity style={styles.rejectOutlineBtn} onPress={handleReject}>
                    <Feather name="x-circle" size={14} color="#DC2626" />
                    <Text style={styles.rejectOutlineText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveYellowBtn}
                    onPress={() => setShowConfirmApprove(true)}
                  >
                    <Feather name="check-circle" size={14} color="#0F172A" />
                    <Text style={styles.approveYellowText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Trial Log Detailed Modal */}
      {trialLogVisible && selectedGoal && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setTrialLogVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.trialLogModalDialog}>
              <View style={styles.trialLogHeader}>
                <Text style={styles.trialLogTitle}>Trial Log</Text>
                <TouchableOpacity onPress={() => setTrialLogVisible(false)}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: spacing.lg }}>
                {selectedGoal.trials.map((tr) => (
                  <View key={tr.id} style={styles.trialLogRow}>
                    <View>
                      <Text style={styles.trialLogDate}>{tr.date}</Text>
                      <Text style={styles.trialLogTime}>{tr.time}</Text>
                    </View>
                    {renderTrialCircle(tr.code)}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Export Modal Component */}
      <ExportPreviewModal
        visible={!!exportContent}
        title="Mastery Approval Record"
        filename={`MasteryRecord_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: spacing.lg, gap: spacing.md },

  /* Top Filter Bar */
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    zIndex: 20,
  },
  filterLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  searchBox: { flex: 2, minWidth: 200 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 36,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },

  filterDropdownWrapper: { flex: 1.2, minWidth: 130, position: 'relative' },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 36,
    backgroundColor: '#FFFFFF',
  },
  dropdownBtnText: { fontSize: 13, color: '#0F172A', fontWeight: '500' },
  dropdownMenu: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 30,
  },
  dropdownItem: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 12, color: '#334155' },
  dropdownItemActive: { fontWeight: '700', color: '#2563EB' },

  filterDateWrapper: { width: 110 },
  dateInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: 36,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  /* Data Table Card */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  th: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },

  tableBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  td: { fontSize: 13, color: '#334155' },
  tdBold: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  tdMuted: { fontSize: 12, color: '#64748B' },
  tdFlex: { justifyContent: 'center' },

  emptyTable: { padding: spacing.xl, alignItems: 'center' },
  emptyTableText: { color: '#94A3B8', fontSize: 13 },

  /* Badges */
  pillBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillBadgeText: { fontSize: 11, fontWeight: '600' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  reviewBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  /* Review Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  reviewModalContainer: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 620,
    borderRadius: radius.lg,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reviewModalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  reviewModalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  reviewModalBody: { padding: spacing.lg, gap: spacing.md },

  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: spacing.xs,
  },
  infoGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoGridCol: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94A3B8' },
  infoValueBold: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  infoValueDesc: { fontSize: 12, color: '#334155', marginTop: 2 },

  teacherABlock: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  blueSectionTitle: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  criteriaText: { fontSize: 12, color: '#1E40AF', marginTop: 4 },
  lastTrialsLabel: { fontSize: 11, fontWeight: '600', color: '#1E3A8A', marginTop: spacing.sm },

  trialsRow: { flexDirection: 'row', gap: 8, marginVertical: spacing.xs },
  trialCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialCircleText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },

  trialsLegendRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginTop: 4 },
  legendText: { fontSize: 11, color: '#475569' },

  splitTeachersRow: { flexDirection: 'row', gap: spacing.md },
  teacherSubCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  subCardTitle: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  subCardName: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginTop: 2 },
  subCardNotes: { fontSize: 12, color: '#475569', marginTop: 4 },

  trialLogOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  trialLogOutlineBtnText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },

  directorNotesArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },

  confirmInlineBox: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  confirmInlineTitle: { fontSize: 13, fontWeight: '700', color: '#854D0E', marginBottom: spacing.sm },
  confirmInlineActions: { flexDirection: 'row', gap: spacing.sm },
  confirmCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmCancelText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  confirmApproveBtn: {
    backgroundColor: '#FACC15',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmApproveText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },

  reviewModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  exportPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exportPdfBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  rejectOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  rejectOutlineText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  approveYellowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  approveYellowText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },

  /* Trial Log Detailed Modal */
  trialLogModalDialog: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  trialLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  trialLogTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  trialLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  trialLogDate: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  trialLogTime: { fontSize: 11, color: '#94A3B8' },
});