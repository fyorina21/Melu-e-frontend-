import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { NoteRecord } from '../dailyNotesTypes';

interface CoordinatorFeedbackModalProps {
  feedbackTarget: NoteRecord | null;
  onClose: () => void;
}

export const CoordinatorFeedbackModal: React.FC<CoordinatorFeedbackModalProps> = React.memo(
  ({ feedbackTarget, onClose }) => {
    return (
      <Modal visible={!!feedbackTarget} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Coordinator Feedback</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close feedback modal"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSessionMeta}>
              <Text style={styles.modalSessionDate}>{feedbackTarget?.date}</Text>
              <Text style={styles.modalSessionSub}>
                {feedbackTarget?.station} · {feedbackTarget?.room}
              </Text>
            </View>

            <View style={styles.modalFeedbackBox}>
              <Text style={styles.modalFeedbackText}>
                {feedbackTarget?.coordinatorFeedback || 'No written feedback provided.'}
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSessionMeta: {
    marginBottom: 10,
  },
  modalSessionDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  modalSessionSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modalFeedbackBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  modalFeedbackText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  modalCloseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
