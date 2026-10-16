import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';
import { DARK, AMBER } from '../types';

interface BulkApproveModalProps {
  visible: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const BulkApproveModal: React.FC<BulkApproveModalProps> = React.memo(
  ({ visible, count, onConfirm, onCancel }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Confirm Bulk Approve</Text>
            <Text style={styles.modalBody}>
              You are about to approve <Text style={styles.modalBodyStrong}>{count}</Text> session
              summar
              {count > 1 ? 'ies' : 'y'}. This action cannot be undone.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel bulk approve"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveAllBtn}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Approve All selected summaries"
              >
                <Text style={styles.approveAllBtnText}>Approve All</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
  },
  modalTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  modalBodyStrong: {
    fontWeight: '700',
    color: DARK,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  approveAllBtn: {
    backgroundColor: AMBER,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  approveAllBtnText: {
    color: DARK,
    fontSize: 13,
    fontWeight: '700',
  },
});
