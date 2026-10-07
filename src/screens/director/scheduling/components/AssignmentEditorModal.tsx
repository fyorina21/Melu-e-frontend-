import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type Option, type ScheduleBlock, filterStudentOptions } from '../types';

interface AssignmentEditorModalProps {
  visible: boolean;
  block: ScheduleBlock | null;
  students: Option[];
  assignedIds?: string[];
  capacity?: number;
  onClose: () => void;
  onSave: (blockId: string, studentIds: string[]) => void;
}

export const AssignmentEditorModal: React.FC<AssignmentEditorModalProps> = React.memo(
  ({ visible, block, students, assignedIds, capacity = 2, onClose, onSave }) => {
    const [selected, setSelected] = useState<string[]>(assignedIds || []);
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => {
      setSelected(assignedIds || []);
      setStudentSearch('');
    }, [assignedIds, visible]);

    const toggle = (id: string) =>
      setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= capacity) return prev; // block adding beyond limit
        return [...prev, id];
      });

    const overCapacity = selected.length > capacity;
    const filteredStudents = filterStudentOptions(students, studentSearch);

    if (!block) return null;

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {block.teacherName} — {block.stationName}
                </Text>
                <Text style={styles.modalSub}>
                  {block.startTime} – {block.endTime}
                </Text>
              </View>
              <View style={[styles.capacityBadge, overCapacity && styles.capacityBadgeOver]}>
                <Text style={[styles.capacityText, overCapacity && { color: colors.white }]}>
                  {selected.length}/{capacity} Students
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

            <ScrollView style={styles.studentsScroll} keyboardShouldPersistTaps="always">
              {filteredStudents.length === 0 && (
                <Text style={styles.emptyListText}>No students found.</Text>
              )}
              {filteredStudents.map((s) => {
                const isChecked = selected.includes(s.id);
                const atCapacity = selected.length >= capacity;
                const isDisabled = !isChecked && atCapacity;
                const status: string = s.status || 'Active';
                const subtitle = s.program ? status + ' · ' + s.program : status;

                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.studentDropdownItem,
                      isChecked && styles.studentDropdownItemActive,
                      isDisabled && { opacity: 0.35 },
                    ]}
                    onPress={() => toggle(s.id)}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked, disabled: isDisabled }}
                    accessibilityLabel={`Select student ${s.name}`}
                  >
                    <View style={[styles.studentAvatar, isChecked && styles.studentAvatarActive]}>
                      <Text style={styles.studentAvatarText}>
                        {(s.name || 'S').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.studentDropdownName,
                          isChecked && styles.studentDropdownNameActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                      <Text style={styles.studentDropdownSub}>{subtitle}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        status === 'Active' ? styles.statusActive : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          status === 'Active' ? styles.statusActiveText : styles.statusPendingText,
                        ]}
                      >
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
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel assignment"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, overCapacity && styles.saveBtnDisabled]}
                disabled={overCapacity}
                onPress={() => onSave(block.id, selected)}
                accessibilityRole="button"
                accessibilityLabel="Save assignment"
              >
                <Text style={styles.saveBtnText}>Save Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 520,
    gap: spacing.md,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalSub: { fontSize: 13, color: colors.mutedText, marginTop: 2 },
  capacityBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: colors.primaryYellow,
  },
  capacityBadgeOver: { backgroundColor: '#EF4444', borderColor: '#DC2626' },
  capacityText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  modalSearchInput: { flex: 1, fontSize: 13, color: colors.navyText, height: '100%' },
  studentsScroll: { maxHeight: 320 },
  emptyListText: {
    textAlign: 'center',
    color: colors.mutedText,
    paddingVertical: spacing.lg,
    fontSize: 13,
  },
  studentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  studentDropdownItemActive: { backgroundColor: '#FEF9C3' },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  studentAvatarActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  studentAvatarText: { fontSize: 12, fontWeight: '700', color: colors.navyText },
  studentDropdownName: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  studentDropdownNameActive: { fontWeight: '700' },
  studentDropdownSub: { fontSize: 11, color: colors.mutedText },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActiveText: { color: '#16A34A' },
  statusPendingText: { color: '#D97706' },
  checkmarkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
});
