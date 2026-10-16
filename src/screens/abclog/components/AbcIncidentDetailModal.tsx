import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { AbcIncident } from '../types';

interface AbcIncidentDetailModalProps {
  incident: AbcIncident | null;
  isSysadmin: boolean;
  deleteConfirm: boolean;
  onSetDeleteConfirm: (val: boolean) => void;
  onDeleteIncident: () => void;
  onClose: () => void;
}

export const AbcIncidentDetailModal: React.FC<AbcIncidentDetailModalProps> = React.memo(
  ({ incident, isSysadmin, deleteConfirm, onSetDeleteConfirm, onDeleteIncident, onClose }) => {
    return (
      <Modal visible={incident !== null} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Incident Details</Text>
              <TouchableOpacity
                hitSlop={8}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close incident details"
              >
                <Feather name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.detailGrid}>
                {(
                  [
                    ['Date', incident?.date],
                    ['Time', incident?.time],
                    ['Location', incident?.location],
                    ['Teacher', incident?.teacher],
                    ['Behavior', incident?.behavior],
                    ['Frequency', incident?.frequency],
                    ['Intensity', incident?.intensity],
                    ['Category', incident?.category],
                    ['Antecedent', incident?.antecedent],
                    ['Consequence', incident?.consequence],
                  ] as Array<[string, string | undefined]>
                ).map(([label, value]) => (
                  <View key={label} style={styles.detailField}>
                    <Text style={styles.statCaption}>{label}</Text>
                    <Text style={styles.detailFieldValue}>{value || '—'}</Text>
                  </View>
                ))}
                <View style={styles.detailNotes}>
                  <Text style={styles.statCaption}>Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{incident?.notes || 'No notes recorded.'}</Text>
                  </View>
                </View>
              </View>

              {isSysadmin && (
                <View style={styles.deleteSection}>
                  {!deleteConfirm ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => onSetDeleteConfirm(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete Incident"
                    >
                      <Text style={styles.deleteBtnText}>Delete Incident</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.confirmBox}>
                      <Text style={styles.confirmText}>
                        Are you sure you want to delete this incident? This action cannot be undone.
                      </Text>
                      <View style={styles.confirmRow}>
                        <TouchableOpacity
                          style={styles.confirmDeleteBtn}
                          onPress={onDeleteIncident}
                          accessibilityRole="button"
                          accessibilityLabel="Confirm delete incident"
                        >
                          <Text style={styles.deleteBtnText}>Yes, Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelDeleteBtn}
                          onPress={() => onSetDeleteConfirm(false)}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel delete"
                        >
                          <Text style={styles.cancelDeleteText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailField: {
    width: '47%',
    gap: 2,
  },
  statCaption: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  detailNotes: {
    width: '100%',
    gap: 4,
    marginTop: 4,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  deleteSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  confirmBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  confirmText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelDeleteText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
});
