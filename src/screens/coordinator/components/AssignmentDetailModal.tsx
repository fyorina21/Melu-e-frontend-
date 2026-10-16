import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Teacher } from '../scheduleTypes';
import { StationChip } from './WeeklyScheduleGrid';

interface AssignmentDetailModalProps {
  cellModal: {
    teacher: Teacher;
    day: string;
    cell: { station: string; room: string };
  } | null;
  onClose: () => void;
}

export function AssignmentDetailModal({ cellModal, onClose }: AssignmentDetailModalProps) {
  return (
    <Modal visible={cellModal !== null} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 340 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assignment Detail</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close detail modal"
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {cellModal && (
            <>
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Teacher</Text>
                  <Text style={styles.detailValue}>{cellModal.teacher?.name || 'Teacher'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Day</Text>
                  <Text style={styles.detailValue}>{cellModal.day}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Station</Text>
                  <StationChip station={cellModal.cell.station} />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Room</Text>
                  <Text style={styles.detailValue}>{cellModal.cell.room}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Status</Text>
                  <View style={styles.statusInline}>
                    {cellModal.teacher.available ? (
                      <>
                        <Feather name="check-circle" size={14} color="#16A34A" />
                        <Text style={[styles.statusText, { color: '#16A34A' }]}>Scheduled</Text>
                      </>
                    ) : (
                      <>
                        <Feather name="alert-triangle" size={14} color="#EF4444" />
                        <Text style={[styles.statusText, { color: '#EF4444' }]}>Unavailable</Text>
                      </>
                    )}
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
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalBody: { gap: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailKey: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  statusInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  modalFooterSingle: { marginTop: spacing.xl },
  closeDarkButton: {
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeDarkButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
