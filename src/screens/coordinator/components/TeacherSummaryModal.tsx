import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../components/StudentAvatar';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Teacher } from '../scheduleTypes';

interface TeacherSummaryModalProps {
  selectedTeacher: Teacher | null;
  onClose: () => void;
}

export function TeacherSummaryModal({ selectedTeacher, onClose }: TeacherSummaryModalProps) {
  return (
    <Modal
      visible={selectedTeacher !== null}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.summaryHeaderLeft}>
              <View style={styles.avatarMedium}>
                <Text style={styles.avatarMediumText}>
                  {selectedTeacher?.name.charAt(selectedTeacher.name.length - 1)}
                </Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>{selectedTeacher?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedTeacher?.station} · {selectedTeacher?.room}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close summary modal"
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {selectedTeacher && (
            <>
              <View style={styles.modalBody}>
                <View style={styles.statsGrid2x2}>
                  <View style={styles.statTile}>
                    <Text style={styles.statTileLabel}>Total Sessions</Text>
                    <Text style={styles.statTileValue}>{selectedTeacher.sessions}</Text>
                  </View>
                  <View style={styles.statTile}>
                    <Text style={styles.statTileLabel}>Total Trials</Text>
                    <Text style={styles.statTileValue}>{selectedTeacher.trials}</Text>
                  </View>
                  <View style={[styles.statTile, { backgroundColor: colors.bgApp }]}>
                    <Text style={styles.statTileLabel}>Avg Independence</Text>
                    <Text style={[styles.statTileValue, { color: colors.primaryYellowDark }]}>
                      {selectedTeacher.independence}%
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statTile,
                      { backgroundColor: selectedTeacher.incidents > 3 ? '#FEF2F2' : '#F0FDF4' },
                    ]}
                  >
                    <Text style={styles.statTileLabel}>Incidents</Text>
                    <Text
                      style={[
                        styles.statTileValue,
                        { color: selectedTeacher.incidents > 3 ? '#DC2626' : '#16A34A' },
                      ]}
                    >
                      {selectedTeacher.incidents}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.notesSectionLabel}>ASSIGNED STUDENTS</Text>
                  {selectedTeacher.students.length === 0 ? (
                    <View style={styles.noStudentsBox}>
                      <Text style={styles.noStudentsText}>No students currently assigned</Text>
                    </View>
                  ) : (
                    <View style={{ gap: spacing.sm }}>
                      {selectedTeacher.students.map((s) => (
                        <View key={s} style={styles.studentRow}>
                          <StudentAvatar name={s} size={24} style={{ marginRight: 8 }} />
                          <Text style={styles.studentRowName}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View>
                  <Text style={styles.notesSectionLabel}>AVAILABILITY</Text>
                  <View
                    style={[
                      styles.availabilityRow,
                      { backgroundColor: selectedTeacher.available ? '#F0FDF4' : '#FEF2F2' },
                    ]}
                  >
                    {selectedTeacher.available ? (
                      <Feather name="check-circle" size={16} color="#15803D" />
                    ) : (
                      <Feather name="alert-triangle" size={16} color="#DC2626" />
                    )}
                    <Text
                      style={[
                        styles.availabilityRowText,
                        { color: selectedTeacher.available ? '#15803D' : '#DC2626' },
                      ]}
                    >
                      {selectedTeacher.available ? 'Available this week' : 'Marked as unavailable'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.modalFooterSingle}>
                <TouchableOpacity
                  style={styles.closeDarkButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeDarkButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarMedium: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMediumText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  modalBody: { gap: spacing.lg },
  statsGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navyText,
    marginTop: 4,
  },
  notesSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  noStudentsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noStudentsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  studentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  studentRowName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  availabilityRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooterSingle: { marginTop: spacing.xl },
  closeDarkButton: {
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeDarkButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
