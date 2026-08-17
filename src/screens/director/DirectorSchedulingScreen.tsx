import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, SafeAreaView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DirectorNav, { DIRECTOR_ROUTE_BY_TAB } from './components/DirectorNav';
import { getDirectorSchedule, saveAssignment, removeAllAssignments } from '../../api/directorApi';
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

const TEACHERS: Option[] = [
  { id: 't-a', name: 'Teacher A' },
  { id: 't-b', name: 'Teacher B' },
  { id: 't-c', name: 'Teacher C' },
];
const ALL_STUDENTS: Option[] = [
  { id: 'student-a', name: 'Student A' },
  { id: 'student-b', name: 'Student B' },
  { id: 'student-c', name: 'Student C' },
  { id: 'student-d', name: 'Student D' },
];
const CAPACITY = 6;

function AssignmentEditorModal({ visible, block, assignedIds, onClose, onSave }: {
  visible: boolean;
  block: ScheduleBlock | null;
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
            {ALL_STUDENTS.map((s) => (
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
  const [teacherId, setTeacherId] = useState('t-a');
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [editorTarget, setEditorTarget] = useState<ScheduleBlock | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId });
      setBlocks(data);
    } catch (err) {
      setBlocks(DEMO_BLOCKS[teacherId] || []);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveAssignment = async (blockId: string, studentIds: string[]) => {
    try {
      await saveAssignment({ blockId, studentIds });
    } catch (err) {}
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, studentIds } : b)));
    setEditorTarget(null);
  };

  const handleRemoveAll = (block: ScheduleBlock) => {
    Alert.alert('Remove all assignments for this block?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove All',
        style: 'destructive',
        onPress: async () => {
          try { await removeAllAssignments(block.id); } catch (err) {}
          setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, studentIds: [] } : b)));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <DirectorNav activeTab="Scheduling" onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Staff Scheduling</Text>
      </View>

      <View style={styles.selectorRow}>
        {TEACHERS.map((t) => (
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
                {ALL_STUDENTS.filter((s) => block.studentIds.includes(s.id)).map((s) => s.name).join(', ') || 'No students assigned'}
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
        assignedIds={editorTarget?.studentIds}
        onClose={() => setEditorTarget(null)}
        onSave={handleSaveAssignment}
      />
    </SafeAreaView>
  );
}

const DEMO_BLOCKS: Record<string, ScheduleBlock[]> = {
  't-a': [
    { id: 'b1', teacherName: 'Teacher A', stationName: 'Station 1 (Basic Skills)', startTime: '9:00 AM', endTime: '10:30 AM', studentIds: ['student-a', 'student-b'] },
    { id: 'b2', teacherName: 'Teacher A', stationName: 'Station 2 (Advanced Skills)', startTime: '11:00 AM', endTime: '12:30 PM', studentIds: [] },
  ],
  't-b': [
    { id: 'b3', teacherName: 'Teacher B', stationName: 'Station 1 (Basic Skills)', startTime: '9:00 AM', endTime: '10:30 AM', studentIds: ['student-c'] },
  ],
  't-c': [],
};

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
