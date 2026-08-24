import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, SafeAreaView, Alert } from 'react-native';
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

const CAPACITY = 6;

function AssignmentEditorModal({ visible, block, students, assignedIds, onClose, onSave }: {
  visible: boolean;
  block: ScheduleBlock | null;
  students: Option[];
  assignedIds?: string[];
  onClose: () => void;
  onSave: (blockId: string, studentIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(assignedIds || []);
  useEffect(() => setSelected(assignedIds || []), [assignedIds, visible]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const overCapacity = selected.length > CAPACITY;

  if (!block) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h2}>{block.teacherName} — {block.stationName}</Text>
          <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
            <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>{selected.length}/{CAPACITY} students</Text>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {students.map((s) => (
              <TouchableOpacity key={s.id} style={styles.studentRow} onPress={() => toggle(s.id)}>
                <View style={[styles.checkbox, selected.includes(s.id) && styles.checkboxChecked]} />
                <Text style={typography.body}>{s.name}</Text>
              </TouchableOpacity>
            ))}
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

export default function DirectorSchedulingScreen({ navigation }: NativeStackScreenProps<DirectorStackParamList, 'DirectorScheduling'>) {
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [blocks, setBlocks] = useState<ScheduleBlock[] | null>(null);
  const [editorTarget, setEditorTarget] = useState<ScheduleBlock | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId });
      setBlocks(data);
    } catch (err) {
      setBlocks([]);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

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

  const handleSaveAssignment = async (blockId: string, studentIds: string[]) => {
    try {
      await saveAssignment({ blockId, studentIds });
      await load();
    } catch (err) {}
    setEditorTarget(null);
  };

  const handleRemoveAll = (block: ScheduleBlock) => {
    Alert.alert('Remove all assignments for this block?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove All',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAllAssignments(block.id);
            await load();
          } catch (err) {}
        },
      },
    ]);
  };

  if (!blocks) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Scheduling" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Staff Scheduling</Text>
      </View>

      <View style={styles.selectorRow}>
        {teachers.map((t) => (
          <TouchableOpacity key={t.id} style={[styles.teacherChip, teacherId === t.id && styles.teacherChipActive]} onPress={() => setTeacherId(t.id)}>
            <Text style={[typography.bodyBold, teacherId === t.id && { color: colors.navyText }]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {blocks.map((block) => {
          const count = block.studentIds.length;
          const overCapacity = count > CAPACITY;
          return (
            <View key={block.id} style={styles.blockCard}>
              <View style={styles.blockHeaderRow}>
                <Text style={typography.h3}>{block.stationName}</Text>
                <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
                  <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>{count}/{CAPACITY}</Text>
                </View>
              </View>
              <Text style={typography.caption}>{block.startTime} – {block.endTime}</Text>
              <Text style={typography.body}>
                {block.studentIds.map((id) => students.find((s) => s.id === id)?.name ?? id).join(', ') || 'No students assigned'}
              </Text>
              <View style={styles.blockActionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setEditorTarget(block)}>
                  <Text style={styles.actionBtnText}>{count > 0 ? 'Edit Assignment' : 'Add Assignment'}</Text>
                </TouchableOpacity>
                {count > 0 && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemoveAll(block)}>
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove All</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
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
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  teacherChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  teacherChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  blockCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
  blockHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityBadge: { backgroundColor: colors.statusApprovedBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  capacityBadgeOver: { backgroundColor: '#EF4444' },
  capacityText: { fontSize: 11, fontWeight: '700', color: colors.statusApprovedText },
  blockActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: '85%' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
