import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Teacher } from '../scheduleTypes';

interface MarkUnavailableModalProps {
  unavailableModal: Teacher | null;
  unavailableFrom: string;
  unavailableTo: string;
  unavailableReason: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function MarkUnavailableModal({
  unavailableModal,
  unavailableFrom,
  unavailableTo,
  unavailableReason,
  onFromChange,
  onToChange,
  onReasonChange,
  onClose,
  onConfirm,
}: MarkUnavailableModalProps) {
  const isSubmitDisabled = !unavailableFrom || !unavailableTo || !unavailableReason.trim();

  return (
    <Modal
      visible={unavailableModal !== null}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.flagHeaderLeft}>
              <Feather name="user-minus" size={16} color="#F97316" />
              <Text style={styles.modalTitle}>Mark Teacher Unavailable</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close unavailable modal"
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {unavailableModal && (
            <>
              <View style={styles.modalBody}>
                <Text style={styles.descriptionText}>
                  Mark <Text style={{ fontWeight: '700' }}>{unavailableModal.name}</Text> as
                  unavailable for a date range. Their schedule will show a warning indicator.
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>FROM</Text>
                    <TextInput
                      value={unavailableFrom}
                      onChangeText={onFromChange}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TO</Text>
                    <TextInput
                      value={unavailableTo}
                      onChangeText={onToChange}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.fieldLabel}>REASON</Text>
                  <TextInput
                    value={unavailableReason}
                    onChangeText={onReasonChange}
                    placeholder="Enter reason for unavailability..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    style={[styles.textInput, { minHeight: 70 }]}
                    textAlignVertical="top"
                  />
                </View>
              </View>
              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  style={styles.cancelOutlineButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelOutlineText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmAmberButton, isSubmitDisabled && { opacity: 0.4 }]}
                  onPress={onConfirm}
                  disabled={isSubmitDisabled}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmAmberText}>Confirm</Text>
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
  flagHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalBody: { gap: spacing.md },
  descriptionText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 13,
    color: colors.navyText,
    backgroundColor: '#F8FAFC',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelOutlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelOutlineText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  confirmAmberButton: {
    flex: 1,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmAmberText: { fontSize: 14, fontWeight: '700', color: colors.navyText },
});
