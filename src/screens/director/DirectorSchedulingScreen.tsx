// screens/director/DirectorSchedulingScreen.js
// SCR-DIR-002: Director Scheduling

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { DirectorStackParamList } from '../../types';

interface Option {
  id: string;
  name: string;
  colorBg: string;
}

interface ScheduleEntry {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  block: 'Morning AM' | 'Afternoon PM';
  studentIds: string[];
}

const TEACHERS: Option[] = [
  { id: 't-a', name: 'Teacher A', colorBg: '' },
  { id: 't-b', name: 'Teacher B', colorBg: '' },
  { id: 't-c', name: 'Teacher C', colorBg: '' },
];

const ALL_STUDENTS: Option[] = [
  { id: 'student-a', name: 'Student A', colorBg: '#DBEAFE' },
  { id: 'student-b', name: 'Student B', colorBg: '#F3E8FF' },
  { id: 'student-c', name: 'Student C', colorBg: '#DCFCE7' },
  { id: 'student-d', name: 'Student D', colorBg: '#FFEDD5' },
];

const DAYS: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI')[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const CAPACITY = 2; // Strict capacity limit

export default function DirectorSchedulingScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList, 'DirectorScheduling'>) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t-a');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmRemoveVisible, setConfirmRemoveVisible] = useState(false);

  // Weekly Schedule Grid State
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleEntry[]>>({
    't-a': [
      { day: 'MON', block: 'Morning AM', studentIds: ['student-a', 'student-b'] },
      { day: 'TUE', block: 'Morning AM', studentIds: ['student-c'] },
      { day: 'WED', block: 'Morning AM', studentIds: ['student-b', 'student-c'] },
      { day: 'THU', block: 'Morning AM', studentIds: ['student-a'] },
      { day: 'FRI', block: 'Morning AM', studentIds: ['student-c', 'student-d'] },
      { day: 'MON', block: 'Afternoon PM', studentIds: [] },
      { day: 'TUE', block: 'Afternoon PM', studentIds: ['student-a', 'student-d'] },
      { day: 'WED', block: 'Afternoon PM', studentIds: [] },
      { day: 'THU', block: 'Afternoon PM', studentIds: ['student-b'] },
      { day: 'FRI', block: 'Afternoon PM', studentIds: [] },
    ],
  });

  const [activeCell, setActiveCell] = useState<{ day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI'; block: 'Morning AM' | 'Afternoon PM' } | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [selectedStation] = useState('Station 1 (Basic Skills)');

  const currentTeacher = TEACHERS.find((t) => t.id === selectedTeacherId) || TEACHERS[0];
  const teacherSchedule = scheduleData[selectedTeacherId] || [];

  const getCellData = (day: string, block: string) => {
    return teacherSchedule.find((item) => item.day === day && item.block === block) || { day: day as ScheduleEntry['day'], block: block as ScheduleEntry['block'], studentIds: [] };
  };

  const handleToggleStudent = (day: string, block: string, studentId: string) => {
    setScheduleData((prev) => {
      const teacherList = prev[selectedTeacherId] || [];
      const updatedList = teacherList.map((entry) => {
        if (entry.day === day && entry.block === block) {
          const exists = entry.studentIds.includes(studentId);
          if (exists) {
            return { ...entry, studentIds: entry.studentIds.filter((id) => id !== studentId) };
          }
          if (entry.studentIds.length >= CAPACITY) {
            Alert.alert('Capacity Exceeded', `Only ${CAPACITY} students can be assigned to 1 teacher per session block.`);
            return entry;
          }
          return { ...entry, studentIds: [...entry.studentIds, studentId] };
        }
        return entry;
      });
      return { ...prev, [selectedTeacherId]: updatedList };
    });
  };

  const handleConfirmRemoveAll = () => {
    setScheduleData((prev) => ({
      ...prev,
      [selectedTeacherId]: (prev[selectedTeacherId] || []).map((entry) => ({
        ...entry,
        studentIds: [],
      })),
    }));
    setConfirmRemoveVisible(false);
  };

  const activeEntry = activeCell ? getCellData(activeCell.day, activeCell.block) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Scheduling" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Select Teacher Dropdown Section */}
        <View style={styles.cardContainer}>
          <Text style={styles.label}>Select Teacher <Text style={{ color: '#EF4444' }}>*</Text></Text>
          <TouchableOpacity style={styles.dropdownSelector} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>{currentTeacher.name}</Text>
            <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {TEACHERS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedTeacherId(t.id);
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsBar}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={styles.yellowBtn} onPress={() => setActiveCell({ day: 'MON', block: 'Morning AM' })}>
              <Feather name="plus" size={16} color={colors.navyText} />
              <Text style={styles.yellowBtnText}>Add Assignment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={() => setSummaryVisible(true)}>
              <Feather name="eye" size={16} color={colors.navyText} />
              <Text style={styles.outlineBtnText}>View Teacher Summary</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.removeBtn} onPress={() => setConfirmRemoveVisible(true)}>
            <Feather name="trash-2" size={16} color="#DC2626" />
            <Text style={styles.removeBtnText}>Remove All Assignments</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Schedule Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridHeaderRow}>
            <View style={[styles.gridHeaderCell, { width: 120 }]} />
            {DAYS.map((d) => (
              <View key={d} style={styles.gridHeaderCell}>
                <Text style={styles.gridHeaderText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Morning AM Row */}
          <View style={styles.gridBodyRow}>
            <View style={[styles.timeCell, { width: 120 }]}>
              <Text style={styles.blockTitleText}>Morning AM</Text>
              <Text style={styles.blockTimeText}>8:07–12:00</Text>
            </View>

            {DAYS.map((day) => {
              const cell = getCellData(day, 'Morning AM');
              const isFull = cell.studentIds.length === CAPACITY;
              return (
                <TouchableOpacity key={day} style={styles.gridCell} onPress={() => setActiveCell({ day, block: 'Morning AM' })}>
                  <View style={[styles.badge, cell.studentIds.length === 0 ? styles.badgeEmpty : isFull ? styles.badgeFull : styles.badgePartial]}>
                    <Text style={[styles.badgeText, isFull ? styles.badgeTextFull : styles.badgeTextPartial]}>
                      {cell.studentIds.length}/{CAPACITY} {isFull ? '✓' : ''}
                    </Text>
                  </View>
                  <View style={styles.studentBadgeList}>
                    {cell.studentIds.map((sid) => {
                      const st = ALL_STUDENTS.find((s) => s.id === sid);
                      return (
                        <View key={sid} style={[styles.studentPill, { backgroundColor: st?.colorBg || '#E2E8F0' }]}>
                          <Text style={styles.studentPillText}>{st?.name}</Text>
                        </View>
                      );
                    })}
                    {cell.studentIds.length === 0 && <Text style={styles.emptyCellText}>Empty</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Afternoon PM Row */}
          <View style={styles.gridBodyRow}>
            <View style={[styles.timeCell, { width: 120 }]}>
              <Text style={styles.blockTitleText}>Afternoon PM</Text>
              <Text style={styles.blockTimeText}>1:10–4:45</Text>
            </View>

            {DAYS.map((day) => {
              const cell = getCellData(day, 'Afternoon PM');
              const isFull = cell.studentIds.length === CAPACITY;
              return (
                <TouchableOpacity key={day} style={styles.gridCell} onPress={() => setActiveCell({ day, block: 'Afternoon PM' })}>
                  <View style={[styles.badge, cell.studentIds.length === 0 ? styles.badgeEmpty : isFull ? styles.badgeFull : styles.badgePartial]}>
                    <Text style={[styles.badgeText, isFull ? styles.badgeTextFull : styles.badgeTextPartial]}>
                      {cell.studentIds.length}/{CAPACITY} {isFull ? '✓' : ''}
                    </Text>
                  </View>
                  <View style={styles.studentBadgeList}>
                    {cell.studentIds.map((sid) => {
                      const st = ALL_STUDENTS.find((s) => s.id === sid);
                      return (
                        <View key={sid} style={[styles.studentPill, { backgroundColor: st?.colorBg || '#E2E8F0' }]}>
                          <Text style={styles.studentPillText}>{st?.name}</Text>
                        </View>
                      );
                    })}
                    {cell.studentIds.length === 0 && <Text style={styles.emptyCellText}>Empty</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Custom Remove Confirmation Modal */}
      <Modal visible={confirmRemoveVisible} transparent animationType="fade" onRequestClose={() => setConfirmRemoveVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.warningBadge}>
              <Feather name="alert-triangle" size={22} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>Remove All Assignments?</Text>
            <Text style={styles.confirmSubtext}>
              This will clear all student assignments for {currentTeacher.name}. This cannot be undone.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setConfirmRemoveVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerModalBtn} onPress={handleConfirmRemoveAll}>
                <Text style={styles.dangerModalBtnText}>Remove All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assignment Editor Modal */}
      {activeCell && activeEntry && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setActiveCell(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalDialog}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Students — {activeCell.day} {activeCell.block}</Text>
                <TouchableOpacity onPress={() => setActiveCell(null)}>
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.inputLabel}>Station</Text>
                <TouchableOpacity style={styles.dropdownSelector}>
                  <Text style={styles.dropdownText}>{selectedStation}</Text>
                  <Feather name="chevron-down" size={16} color="#64748B" />
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Block</Text>
                <View style={styles.disabledInput}>
                  <Text style={styles.disabledInputText}>
                    {activeCell.day} · {activeCell.block} {activeCell.block === 'Morning AM' ? '(8:07–12:00)' : '(1:10–4:45)'}
                  </Text>
                </View>

                <View style={styles.capacityHeaderRow}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <View style={[styles.badge, activeEntry.studentIds.length === CAPACITY ? styles.badgeFull : styles.badgePartial]}>
                    <Text style={[styles.badgeText, activeEntry.studentIds.length === CAPACITY ? styles.badgeTextFull : styles.badgeTextPartial]}>
                      {activeEntry.studentIds.length} / {CAPACITY} students assigned
                    </Text>
                  </View>
                </View>

                {/* Assigned Students List */}
                <Text style={styles.inputLabel}>Assigned Students</Text>
                {activeEntry.studentIds.length === 0 ? (
                  <Text style={styles.italicEmpty}>No students assigned yet.</Text>
                ) : (
                  activeEntry.studentIds.map((sid) => {
                    const st = ALL_STUDENTS.find((s) => s.id === sid);
                    return (
                      <View key={sid} style={[styles.assignedRow, { backgroundColor: st?.colorBg || '#EFF6FF' }]}>
                        <Text style={styles.assignedStudentText}>{st?.name}</Text>
                        <TouchableOpacity onPress={() => handleToggleStudent(activeCell.day, activeCell.block, sid)}>
                          <Feather name="x" size={16} color="#2563EB" />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}

                {/* Available Students List */}
                <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>Available Students</Text>
                {ALL_STUDENTS.map((st) => {
                  const isAssigned = activeEntry.studentIds.includes(st.id);
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={styles.availableStudentRow}
                      onPress={() => handleToggleStudent(activeCell.day, activeCell.block, st.id)}
                    >
                      <View style={[styles.checkboxSquare, isAssigned && styles.checkboxSquareActive]} />
                      <Text style={styles.availableStudentName}>{st.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveCell(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setActiveCell(null)}>
                  <Text style={styles.modalSaveText}>Save Assignment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* View Teacher Summary Modal */}
      {summaryVisible && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSummaryVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalDialog, { maxWidth: 700 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{currentTeacher.name} — Weekly Schedule</Text>
                <TouchableOpacity onPress={() => setSummaryVisible(false)}>
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: spacing.lg }}>
                <View style={styles.gridContainer}>
                  <View style={styles.gridHeaderRow}>
                    <View style={[styles.gridHeaderCell, { width: 100 }]}><Text style={styles.gridHeaderText}>BLOCK</Text></View>
                    {DAYS.map((d) => (
                      <View key={d} style={styles.gridHeaderCell}><Text style={styles.gridHeaderText}>{d}</Text></View>
                    ))}
                  </View>

                  {/* Summary Rows */}
                  {['Morning AM', 'Afternoon PM'].map((blk) => (
                    <View key={blk} style={styles.gridBodyRow}>
                      <View style={[styles.timeCell, { width: 100 }]}><Text style={styles.blockTitleText}>{blk}</Text></View>
                      {DAYS.map((day) => {
                        const cell = getCellData(day, blk);
                        return (
                          <View key={day} style={styles.gridCell}>
                            {cell.studentIds.length > 0 ? (
                              cell.studentIds.map((sid) => {
                                const st = ALL_STUDENTS.find((s) => s.id === sid);
                                return (
                                  <View key={sid} style={[styles.studentPill, { backgroundColor: st?.colorBg || '#E2E8F0', marginBottom: 2 }]}>
                                    <Text style={styles.studentPillText}>{st?.name}</Text>
                                  </View>
                                );
                              })
                            ) : (
                              <Text style={styles.emptyDash}>—</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg, gap: spacing.md },
  
  /* Select Teacher Card */
  cardContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    zIndex: 10,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: spacing.xs },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: '#FACC15',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  dropdownText: { fontSize: 14, color: '#0F172A', fontWeight: '500' },
  dropdownMenu: {
    position: 'absolute',
    top: 75,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  dropdownOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 14, color: '#334155' },

  /* Action Bar */
  actionsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  yellowBtn: { backgroundColor: '#FACC15', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm },
  yellowBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  outlineBtn: { borderWidth: 1, borderColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.white },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  removeBtn: { borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: '#FEF2F2' },
  removeBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },

  /* Weekly Schedule Grid */
  gridContainer: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  gridHeaderRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  gridHeaderCell: { flex: 1, padding: spacing.md, alignItems: 'center', justifyContent: 'center' },
  gridHeaderText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  gridBodyRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  timeCell: { padding: spacing.md, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  blockTitleText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  blockTimeText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  gridCell: { flex: 1, padding: spacing.sm, borderRightWidth: 1, borderRightColor: '#E2E8F0', minHeight: 90 },
  
  /* Status Badges */
  badge: { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6 },
  badgeFull: { backgroundColor: '#DCFCE7' },
  badgePartial: { backgroundColor: '#FEF08A' },
  badgeEmpty: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextFull: { color: '#166534' },
  badgeTextPartial: { color: '#854D0E' },

  /* Student Pills */
  studentBadgeList: { gap: 4 },
  studentPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'stretch' },
  studentPillText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  emptyCellText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  emptyDash: { color: '#CBD5E1', textAlign: 'center', marginVertical: spacing.sm },

  /* Modals Base */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
  modalDialog: { backgroundColor: colors.white, width: '100%', maxWidth: 480, borderRadius: radius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalBody: { padding: spacing.lg },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  disabledInput: { backgroundColor: '#F1F5F9', borderRadius: radius.sm, padding: spacing.md, borderWidth: 1, borderColor: '#E2E8F0' },
  disabledInputText: { fontSize: 13, color: '#64748B' },
  capacityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.md },
  assignedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.xs },
  assignedStudentText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  italicEmpty: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginBottom: spacing.md },
  availableStudentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: spacing.xs },
  checkboxSquare: { width: 16, height: 16, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 3, backgroundColor: colors.white },
  checkboxSquareActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  availableStudentName: { fontSize: 13, fontWeight: '500', color: '#334155' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, padding: spacing.lg, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  modalCancelBtn: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalCancelText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  modalSaveBtn: { backgroundColor: '#FACC15', borderRadius: radius.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalSaveText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

  /* Remove Confirmation Card Styles */
  confirmCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  warningBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  dangerModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  dangerModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});