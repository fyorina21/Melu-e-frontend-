import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import ScreenLoader from '../../../components/ScreenLoader';
import { useToast } from '../../../context/ToastContext';
import { getDirectorSchedule, saveAssignment } from '../../../api/directorApi';
import { studentsApi } from '../../../api/resources/students';
import {
  type StaffMember,
  type LinkStation,
  type LinkRoom,
  type LinkStudent,
  type TeacherLinkAssignment,
  LINK_ROOMS,
  TEACHER_CAPACITY,
} from '../types';

export interface TeacherStudentLinkingModalProps {
  teacher: StaffMember;
  onClose: () => void;
}

export function TeacherStudentLinkingModal({ teacher, onClose }: TeacherStudentLinkingModalProps) {
  const { showToast } = useToast();
  const [station, setStation] = useState<LinkStation>('1');
  const [room, setRoom] = useState<LinkRoom>(1);
  const [assignments, setAssignments] = useState<TeacherLinkAssignment[]>([]);
  const [students, setStudents] = useState<LinkStudent[] | null>(null);
  const [selectedForAssign, setSelectedForAssign] = useState<string[]>([]);
  const [selectedForRemove, setSelectedForRemove] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      const res = await studentsApi.list();
      setStudents(
        res.map((s) => ({
          id: s.id,
          name: s.fullName,
          group: s.therapyGroup,
          program: (s.programType === 'ABA' ? 'regular' : 'pooled-out') as LinkStudent['program'],
        })),
      );
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const loadAssignments = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId: teacher.id });
      const mapped = data
        .filter((b: any) => (b.studentIds || []).length > 0)
        .map((b: any) => {
          const match = String(b.id).match(/^b(\d)_(\d)$/);
          let s = '1';
          let r = 1;
          if (match) {
            s = match[1];
            r = parseInt(match[2], 10);
          } else {
            s = b.stationName.includes('Station 2') ? '2' : '1';
            r = b.id === 'b1' ? 1 : 2;
          }
          return {
            teacherId: teacher.id,
            teacherName: teacher.name,
            station: s as LinkStation,
            room: r as LinkRoom,
            students: b.studentIds || [],
          };
        });
      setAssignments(mapped);
    } catch (err) {
      console.warn('Failed to load assignments:', err);
    }
  }, [teacher.id, teacher.name]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const currentAssignment = assignments.find(
    (a) => a.teacherId === teacher.id && a.station === station && a.room === room,
  );
  const assignedStudentIds = currentAssignment?.students ?? [];

  const groups = Array.from(new Set((students ?? []).map((s) => s.group)));
  let availableStudents = (students ?? []).filter((s) => !assignedStudentIds.includes(s.id));
  if (groupFilter !== 'all')
    availableStudents = availableStudents.filter((s) => s.group === groupFilter);
  if (programFilter !== 'all')
    availableStudents = availableStudents.filter((s) => s.program === programFilter);

  const canAssignMore = assignedStudentIds.length < TEACHER_CAPACITY;

  const switchContext = (fn: () => void) => {
    setSelectedForAssign([]);
    setSelectedForRemove([]);
    fn();
  };

  const handleStudentToggle = (studentId: string, isForAssign: boolean) => {
    if (isForAssign) {
      if (selectedForAssign.includes(studentId)) {
        setSelectedForAssign((prev) => prev.filter((id) => id !== studentId));
      } else {
        if (selectedForAssign.length + assignedStudentIds.length >= TEACHER_CAPACITY) return;
        setSelectedForAssign((prev) => [...prev, studentId]);
      }
    } else {
      if (selectedForRemove.includes(studentId)) {
        setSelectedForRemove((prev) => prev.filter((id) => id !== studentId));
      } else {
        setSelectedForRemove((prev) => [...prev, studentId]);
      }
    }
  };

  const handleAssign = async () => {
    if (!selectedForAssign.length) return;

    const newStudents = [...assignedStudentIds, ...selectedForAssign];
    const blockId = 'b' + station + '_' + room;

    try {
      await saveAssignment({ blockId, studentIds: newStudents, teacherId: teacher.id });
      await loadAssignments();
      showToast('Students assigned successfully', 'success');
    } catch (err) {
      console.warn('Failed to save assignment:', err);
      showToast('Failed to assign students', 'error');
    }

    setSelectedForAssign([]);
  };

  const handleRemove = () => {
    if (!selectedForRemove.length) {
      showToast('Please select students to remove', 'info');
      return;
    }
    setShowRemoveConfirm(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedForRemove.length) return;

    const remainingStudents = assignedStudentIds.filter((id) => !selectedForRemove.includes(id));
    const blockId = 'b' + station + '_' + room;

    try {
      await saveAssignment({ blockId, studentIds: remainingStudents, teacherId: teacher.id });
      await loadAssignments();
      showToast('Students removed successfully', 'success');
    } catch (err) {
      console.warn('Failed to remove assignment:', err);
      showToast('Failed to remove students', 'error');
    }

    setSelectedForRemove([]);
    setShowRemoveConfirm(false);
  };

  const teacherAssignments = assignments.filter((a) => a.teacherId === teacher.id);

  if (students === null) return <ScreenLoader />;

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalSheet, { maxHeight: '90%', flex: 1, padding: 0 }]}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            <View style={styles.linkingHeader}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>Teacher-Student Linking</Text>
                <Text style={typography.caption}>
                  {teacher.name} — assign students to a station &amp; room (max {TEACHER_CAPACITY}{' '}
                  per room).
                </Text>
              </View>
              <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
                <Feather name="x" size={14} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            {/* Station & Room Selection */}
            <View style={styles.field}>
              <Text style={typography.label}>Station</Text>
              <View style={styles.selectorRow}>
                {(['1', '2'] as LinkStation[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.selectorBtn, station === s && styles.selectorBtnStationActive]}
                    onPress={() => switchContext(() => setStation(s))}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        station === s && styles.selectorBtnTextActive,
                      ]}
                    >
                      Station {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={typography.label}>Room</Text>
              <View style={styles.selectorRow}>
                {LINK_ROOMS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.selectorBtn, room === r && styles.selectorBtnRoomActive]}
                    onPress={() => switchContext(() => setRoom(r))}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        room === r && styles.selectorBtnRoomTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Two-Panel Layout */}
            <View style={styles.linkingRow}>
              {/* Available Students Panel */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={typography.bodyBold}>Available Students</Text>
                  <Text style={typography.caption}>{selectedForAssign.length} selected</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {['all', ...groups].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.filterChip, groupFilter === g && styles.filterChipActive]}
                      onPress={() => setGroupFilter(g)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          groupFilter === g && styles.filterChipTextActive,
                        ]}
                      >
                        {g === 'all' ? 'All Groups' : g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {['all', 'regular', 'pooled-out'].map((p) => (
                    <TouchableOpacity
                      key={`p-${p}`}
                      style={[styles.filterChip, programFilter === p && styles.filterChipActive]}
                      onPress={() => setProgramFilter(p)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          programFilter === p && styles.filterChipTextActive,
                        ]}
                      >
                        {p === 'all' ? 'All Programs' : p === 'regular' ? 'Regular' : 'Pooled Out'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <ScrollView style={styles.panelList} nestedScrollEnabled={true}>
                  {availableStudents.length === 0 ? (
                    <Text style={styles.emptyText}>No available students</Text>
                  ) : (
                    availableStudents.map((s) => {
                      const selected = selectedForAssign.includes(s.id);
                      const disabled = !canAssignMore && !selected;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.checkRow,
                            selected && styles.checkRowAvailableSelected,
                            disabled && styles.checkRowDisabled,
                          ]}
                          onPress={() => handleStudentToggle(s.id, true)}
                          disabled={disabled}
                        >
                          <Feather
                            name={selected ? 'check-square' : 'square'}
                            size={16}
                            color={selected ? colors.statusInProgressText : colors.mutedText}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={typography.body}>{s.name}</Text>
                            <Text style={typography.caption}>
                              {s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    selectedForAssign.length > 0 && styles.primaryBtnActive,
                  ]}
                  onPress={handleAssign}
                  disabled={selectedForAssign.length === 0}
                >
                  <Text
                    style={[
                      styles.primaryBtnText,
                      selectedForAssign.length > 0 && styles.primaryBtnTextActive,
                    ]}
                  >
                    Assign Selected
                  </Text>
                </TouchableOpacity>
                {!canAssignMore && (
                  <Text style={styles.warnText}>Maximum 2 students per teacher for this room</Text>
                )}
              </View>

              {/* Assigned Students Panel */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={typography.bodyBold}>Assigned Students</Text>
                  <Text style={typography.caption}>
                    {assignedStudentIds.length}/{TEACHER_CAPACITY}
                  </Text>
                </View>

                <ScrollView
                  style={[styles.panelList, styles.panelListAssigned]}
                  nestedScrollEnabled={true}
                >
                  {assignedStudentIds.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Feather name="users" size={40} color={colors.border} />
                      <Text style={styles.emptyStateText}>No students assigned</Text>
                    </View>
                  ) : (
                    assignedStudentIds.map((id) => {
                      const s = (students ?? []).find((x) => x.id === id);
                      if (!s) return null;
                      const selected = selectedForRemove.includes(s.id);
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[
                            styles.checkRow,
                            styles.assignedRow,
                            selected ? styles.checkRowRemoveSelected : styles.checkRowAssigned,
                          ]}
                          onPress={() => handleStudentToggle(s.id, false)}
                        >
                          <Feather
                            name={selected ? 'check-square' : 'square'}
                            size={16}
                            color={
                              selected ? colors.statusRevisionText : colors.statusInProgressText
                            }
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={typography.body}>{s.name}</Text>
                            <Text style={typography.caption}>
                              {s.group} • {s.program === 'pooled-out' ? 'Pooled Out' : 'Regular'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.removeBtn, selectedForRemove.length > 0 && styles.removeBtnActive]}
                  onPress={handleRemove}
                  disabled={selectedForRemove.length === 0}
                >
                  <Text
                    style={[
                      styles.removeBtnText,
                      selectedForRemove.length > 0 && styles.removeBtnTextActive,
                    ]}
                  >
                    Remove Selected
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* All Assignments Summary */}
            <View style={styles.field}>
              <Text style={typography.label}>All Assignments</Text>
              {teacherAssignments.length === 0 ? (
                <Text style={typography.caption}>No assignments yet for {teacher.name}.</Text>
              ) : (
                teacherAssignments.map((a) => {
                  const names = a.students
                    .map((id) => (students ?? []).find((x) => x.id === id)?.name)
                    .filter(Boolean);
                  return (
                    <View key={`${a.station}|${a.room}`} style={styles.summaryRow}>
                      <Text style={typography.bodyBold}>
                        Station {a.station} · Room {a.room}
                      </Text>
                      <Text style={typography.caption}>
                        {names.length ? names.join(' · ') : '—'}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            {/* Remove Confirmation Modal */}
            <Modal
              visible={showRemoveConfirm}
              transparent
              animationType="fade"
              onRequestClose={() => setShowRemoveConfirm(false)}
            >
              <View style={styles.overlay}>
                <View style={[styles.modalSheet, styles.confirmModal]}>
                  <Text style={typography.h2}>Remove Students?</Text>
                  <Text style={typography.body}>
                    Remove{' '}
                    {selectedForRemove
                      .map((id) => (students ?? []).find((s) => s.id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}{' '}
                    from this assignment?
                  </Text>
                  <Text style={typography.caption}>Historical session data will be kept.</Text>
                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setShowRemoveConfirm(false)}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, styles.confirmRemoveBtn]}
                      onPress={handleRemoveConfirm}
                    >
                      <Text style={styles.confirmRemoveBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Main Modal Footer */}
            <View style={[styles.modalFooter, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (selectedForAssign.length > 0) await handleAssign();
                  if (selectedForRemove.length > 0) await handleRemoveConfirm();
                  onClose();
                }}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  },
  linkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
  },
  field: { gap: spacing.xs },
  selectorRow: { flexDirection: 'row', gap: spacing.sm },
  selectorBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  selectorBtnText: { fontWeight: '600', color: colors.bodyText },
  selectorBtnStationActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  selectorBtnRoomActive: {
    backgroundColor: colors.statusInProgressText,
    borderColor: colors.statusInProgressText,
  },
  selectorBtnTextActive: { fontWeight: '700', color: colors.navyText },
  selectorBtnRoomTextActive: { fontWeight: '700', color: colors.white },
  linkingRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'stretch' },
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgApp,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterRow: { gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  filterChipText: { fontSize: 11, color: colors.bodyText },
  filterChipTextActive: { fontWeight: '700', color: colors.navyText },
  panelList: { gap: spacing.xs, maxHeight: 260 },
  panelListAssigned: {
    minHeight: 160,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.mutedText,
    paddingVertical: spacing.xl,
    fontSize: 13,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    marginBottom: spacing.xs,
  },
  checkRowAvailableSelected: {
    borderColor: colors.statusInProgressText,
    backgroundColor: colors.statusInProgressBg,
  },
  checkRowAssigned: {
    borderColor: colors.statusInProgressText,
    backgroundColor: colors.statusInProgressBg,
  },
  checkRowRemoveSelected: {
    borderColor: colors.statusRevisionText,
    backgroundColor: colors.statusRevisionBg,
  },
  assignedRow: { borderWidth: 2 },
  checkRowDisabled: { opacity: 0.5 },
  primaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtnActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  primaryBtnText: { fontWeight: '600', color: colors.mutedText },
  primaryBtnTextActive: { fontWeight: '700', color: colors.navyText },
  warnText: { textAlign: 'center', fontSize: 11, color: '#EA580C', marginTop: spacing.xs },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  removeBtnActive: { backgroundColor: colors.error, borderColor: colors.error },
  removeBtnText: { fontWeight: '600', color: colors.mutedText },
  removeBtnTextActive: { fontWeight: '700', color: colors.white },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: { color: colors.mutedText, fontSize: 13 },
  confirmModal: { maxWidth: 420, width: '100%', alignSelf: 'center' },
  confirmRemoveBtn: { backgroundColor: colors.error },
  confirmRemoveBtnText: { fontWeight: '700', color: colors.white },
  summaryRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: { color: colors.bodyText, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveBtnText: { color: colors.navyText, fontWeight: '700' },
});

export const TeacherLinkingPanel = TeacherStudentLinkingModal;
export default TeacherStudentLinkingModal;
