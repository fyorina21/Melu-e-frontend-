// screens/director/DirectorSchedulingScreen.tsx
// SCR-DIR-002: Staff Scheduling (Director View)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getDirectorSchedule, saveAssignment, removeAllAssignments } from '../../api/directorApi';
import { getStaffOptions, getStudentOptions } from '../../api/optionsApi';
import type { DirectorStackParamList } from '../../types';

interface Option {
  id: string;
  name: string;
}

interface ScheduleBlock {
  id: string;
  teacherName: string;
  stationName: string;
  startTime: string;
  endTime: string;
  studentIds: string[];
}

const CAPACITY = 2;

function AssignmentEditorModal({
  visible,
  block,
  students,
  assignedIds,
  onClose,
  onSave,
}: {
  visible: boolean;
  block: ScheduleBlock | null;
  students: Option[];
  assignedIds?: string[];
  onClose: () => void;
  onSave: (blockId: string, studentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(assignedIds || []);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    setSelected(assignedIds || []);
    setStudentSearch('');
  }, [assignedIds, visible]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= CAPACITY) return prev; // block adding beyond limit
      return [...prev, id];
    });

  const overCapacity = selected.length > CAPACITY;
  const filteredStudents = students.filter((s) =>
    String(s.name || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (!block) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{block.teacherName} — {block.stationName}</Text>
              <Text style={styles.modalSub}>{block.startTime} – {block.endTime}</Text>
            </View>
            <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
              <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>
                {selected.length}/{CAPACITY} Students
              </Text>
            </View>
          </View>

          <View style={styles.modalSearchRow} onStartShouldSetResponder={() => true}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search students by name..."
              placeholderTextColor={colors.mutedText}
              value={studentSearch}
              onChangeText={(text) => setStudentSearch(text)}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="always">
            {filteredStudents.length === 0 && (
              <Text style={styles.emptyListText}>No students found.</Text>
            )}
            {filteredStudents.map((s) => {
              const isChecked = selected.includes(s.id);
              const atCapacity = selected.length >= CAPACITY;
              const isDisabled = !isChecked && atCapacity;
              const sAny = s as any;
              const status: string = sAny.status || 'Active';
              const subtitle = sAny.program ? (status + ' · ' + sAny.program) : status;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentDropdownItem, isChecked && styles.studentDropdownItemActive, isDisabled && { opacity: 0.35 }]}
                  onPress={() => toggle(s.id)}
                  activeOpacity={isDisabled ? 1 : 0.7}
                >
                  <View style={[styles.studentAvatar, isChecked && styles.studentAvatarActive]}>
                    <Text style={styles.studentAvatarText}>{(s.name || 'S').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentDropdownName, isChecked && styles.studentDropdownNameActive]}>
                      {s.name}
                    </Text>
                    <Text style={styles.studentDropdownSub}>{subtitle}</Text>
                  </View>
                  <View style={[styles.statusBadge, status === 'Active' ? styles.statusActive : styles.statusPending]}>
                    <Text style={[styles.statusBadgeText, status === 'Active' ? styles.statusActiveText : styles.statusPendingText]}>
                      {status}
                    </Text>
                  </View>
                  {isChecked && (
                    <View style={styles.checkmarkBadge}>
                      <Feather name="check" size={12} color={colors.navyText} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, overCapacity && styles.saveBtnDisabled]}
              disabled={overCapacity}
              onPress={() => onSave(block.id, selected)}
            >
              <Text style={styles.saveBtnText}>Save Assignment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function DirectorSchedulingScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorScheduling'>) {
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [blocks, setBlocks] = useState<ScheduleBlock[] | null>(null);
  const [editorTarget, setEditorTarget] = useState<ScheduleBlock | null>(null);

  // Dropdown Picker State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTeacher, setSearchTeacher] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId });
      setBlocks(Array.isArray(data) ? data : []);
    } catch {
      setBlocks([]);
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getStaffOptions()
      .then(({ data: opts }) => {
        const teacherRows = opts.filter((t) => t.role === 'teacher');
        setTeachers(teacherRows);
        setTeacherId((prev) => prev || teacherRows[0]?.id || '');
      })
      .catch(() => setTeachers([]));

    getStudentOptions()
      .then(({ data: opts }) => setStudents(opts))
      .catch(() => setStudents([]));
  }, []);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === teacherId) ?? null,
    [teachers, teacherId]
  );

  const filteredTeachers = useMemo(() => {
    if (!searchTeacher.trim()) return teachers;
    return teachers.filter((t) =>
      t.name.toLowerCase().includes(searchTeacher.toLowerCase())
    );
  }, [teachers, searchTeacher]);

  const handleSaveAssignment = async (blockId: string, studentIds: string[]) => {
    try {
      await saveAssignment({ blockId, studentIds, teacherId });
      await load();
    } catch {}
    setEditorTarget(null);
  };

  const handleRemoveAll = (block: ScheduleBlock) => {
    Alert.alert('Remove All Assignments', 'Remove all students assigned to this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove All',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAllAssignments(block.id);
            await load();
          } catch {}
        },
      },
    ]);
  };

  if (!blocks) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Staff Scheduling" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.badgeIcon}>
              <Feather name="calendar" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Staff Scheduling</Text>
              <Text style={styles.pageSubtitle}>Manage staff station blocks, student capacity, and timetable assignments</Text>
            </View>
          </View>
        </View>

        {/* Staff Selector Dropdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SELECT THERAPIST / STAFF MEMBER</Text>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(selectedTeacher?.name || 'T').charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.selectedTeacherName}>
                  {selectedTeacher ? selectedTeacher.name : 'Choose a therapist...'}
                </Text>
                <Text style={styles.selectedTeacherMeta}>Therapist / Special Educator</Text>
              </View>
            </View>
            <Feather name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.bodyText} />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              <View style={styles.searchBar}>
                <Feather name="search" size={14} color={colors.mutedText} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search staff..."
                  placeholderTextColor={colors.mutedText}
                  value={searchTeacher}
                  onChangeText={setSearchTeacher}
                />
              </View>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredTeachers.map((t) => {
                  const isSelected = t.id === teacherId;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => {
                        setTeacherId(t.id);
                        setDropdownOpen(false);
                        setSearchTeacher('');
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {t.name}
                      </Text>
                      {isSelected && <Feather name="check" size={14} color={colors.navyText} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Schedule Blocks */}
        <View style={styles.blocksSection}>
          <View style={styles.blocksHeaderRow}>
            <Text style={styles.sectionHeading}>SESSION SCHEDULE BLOCKS</Text>
            <Text style={styles.capacityNotice}>Max Capacity: {CAPACITY} Students / Block</Text>
          </View>

          {blocks.map((block) => {
            const count = block.studentIds.length;
            const overCapacity = count > CAPACITY;
            return (
              <View key={block.id} style={styles.blockCard}>
                <View style={styles.blockHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stationTitle}>{block.stationName}</Text>
                    <View style={styles.timeTagRow}>
                      <Feather name="clock" size={12} color={colors.bodyText} />
                      <Text style={styles.timeTagText}>
                        {block.startTime} – {block.endTime}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
                    <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>
                      {count}/{CAPACITY} Students
                    </Text>
                  </View>
                </View>

                {/* Assigned Students */}
                <View style={styles.studentsWrap}>
                  <Text style={styles.studentsWrapLabel}>Assigned Students:</Text>
                  {count > 0 ? (
                    <View style={styles.chipsRow}>
                      {block.studentIds.map((id) => {
                        const studentName = students.find((s) => s.id === id)?.name ?? id;
                        return (
                          <View key={id} style={styles.studentChipBadge}>
                            <Feather name="user" size={11} color={colors.navyText} />
                            <Text style={styles.studentChipBadgeText}>{studentName}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noStudentsText}>No students assigned to this block yet.</Text>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.blockActionsRow}>
                  <TouchableOpacity
                    style={styles.editAssignmentBtn}
                    onPress={() => setEditorTarget(block)}
                  >
                    <Feather name="user-plus" size={14} color={colors.navyText} />
                    <Text style={styles.editAssignmentBtnText}>
                      {count > 0 ? 'Edit Assigned Students' : 'Assign Students'}
                    </Text>
                  </TouchableOpacity>
                  {count > 0 && (
                    <TouchableOpacity
                      style={styles.removeAllBtn}
                      onPress={() => handleRemoveAll(block)}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                      <Text style={styles.removeAllBtnText}>Remove All</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {blocks.length === 0 && (
            <View style={styles.emptyBlocks}>
              <Feather name="calendar" size={32} color={colors.mutedText} />
              <Text style={styles.emptyBlocksTitle}>No Schedule Blocks Found</Text>
              <Text style={styles.emptyBlocksSub}>Select another therapist or configure session rounds in Institutional Admin.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AssignmentEditorModal
        visible={!!editorTarget}
        block={editorTarget}
        students={students}
        assignedIds={editorTarget?.studentIds}
        onClose={() => setEditorTarget(null)}
        onSave={handleSaveAssignment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 260 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.8 },

  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  selectedTeacherName: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  selectedTeacherMeta: { fontSize: 12, color: colors.bodyText, marginTop: 2 },

  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: { backgroundColor: '#FEF9C3' },
  dropdownItemText: { fontSize: 13, color: colors.navyText, fontWeight: '500' },
  dropdownItemTextActive: { fontWeight: '700' },

  blocksSection: { gap: spacing.md },
  blocksHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeading: { fontSize: 12, fontWeight: '700', color: colors.bodyText, letterSpacing: 0.8 },
  capacityNotice: { fontSize: 11, color: colors.mutedText, fontWeight: '600' },

  blockCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  blockHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  stationTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  timeTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeTagText: { fontSize: 12, color: colors.bodyText, fontWeight: '500' },
  capacityBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: radius.pill },
  capacityBadgeOver: { backgroundColor: '#EF4444' },
  capacityText: { fontSize: 11, fontWeight: '700', color: '#166534' },

  studentsWrap: { gap: spacing.xs },
  studentsWrapLabel: { fontSize: 11, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  studentChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  studentChipBadgeText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  noStudentsText: { fontSize: 13, color: colors.mutedText, fontStyle: 'italic' },

  blockActionsRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.xs },
  editAssignmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  editAssignmentBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  removeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  removeAllBtnText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  emptyBlocks: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  emptyBlocksTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText, marginTop: spacing.xs },
  emptyBlocksSub: { fontSize: 12, color: colors.mutedText, textAlign: 'center' },

  /* Modal */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalSub: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
  },
  modalSearchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 13, color: colors.navyText, minHeight: 36, outlineWidth: 0 } as any,
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  studentRowSelected: { backgroundColor: '#FEF9C3', borderRadius: radius.sm, paddingHorizontal: spacing.xs },
  studentRowText: { fontSize: 13, color: colors.navyText, fontWeight: '500' },
  studentRowTextActive: { fontWeight: '700' },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellowDark },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },

  /* IUP-style student dropdown rows */
  emptyListText: { padding: 12, fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  studentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentDropdownItemActive: { backgroundColor: '#FEF9C3' },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarActive: { backgroundColor: '#FDE047' },
  studentAvatarText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  studentDropdownName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  studentDropdownNameActive: { fontWeight: '700' },
  studentDropdownSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusActiveText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPendingText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  checkmarkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});