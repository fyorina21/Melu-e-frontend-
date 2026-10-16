import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface FlagStudentModalProps {
  visible: boolean;
  studentName?: string;
  flagReason: string;
  onReasonChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function FlagStudentModal({
  visible,
  studentName,
  flagReason,
  onReasonChange,
  onClose,
  onConfirm,
}: FlagStudentModalProps) {
  const isSubmitDisabled = !flagReason.trim();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.flagHeaderLeft}>
              <Feather name="flag" size={16} color="#EF4444" />
              <Text style={styles.modalTitle}>Flag Student</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close flag modal"
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.flagDescription}>
              This will create a priority alert for{' '}
              <Text style={{ fontWeight: '700' }}>{studentName || 'this student'}</Text>. All
              supervisors will be notified.
            </Text>
            <Text style={styles.notesSectionLabel}>
              REASON FOR FLAG <Text style={{ color: '#F87171' }}>*</Text>
            </Text>
            <TextInput
              value={flagReason}
              onChangeText={onReasonChange}
              placeholder="Describe the concern requiring immediate attention..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              style={styles.flagInput}
              textAlignVertical="top"
            />
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
              style={[styles.confirmFlagButton, isSubmitDisabled && { opacity: 0.4 }]}
              onPress={onConfirm}
              disabled={isSubmitDisabled}
              activeOpacity={0.8}
            >
              <Feather name="flag" size={16} color={colors.white} />
              <Text style={styles.confirmFlagText}>Confirm Flag</Text>
            </TouchableOpacity>
          </View>
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
  flagDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  notesSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  flagInput: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.navyText,
    minHeight: 80,
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
  confirmFlagButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#DC2626',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  confirmFlagText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
