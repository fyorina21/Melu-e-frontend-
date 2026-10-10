import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type Session, ALERT_TYPES, DARK, DARK_TEXT, PANEL } from '../types';

interface SendAlertModalProps {
  session: Session | null;
  alertType: string;
  alertMessage: string;
  onAlertTypeChange: (type: string) => void;
  onAlertMessageChange: (message: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export const SendAlertModal: React.FC<SendAlertModalProps> = React.memo(
  ({
    session,
    alertType,
    alertMessage,
    onAlertTypeChange,
    onAlertMessageChange,
    onSend,
    onClose,
  }) => {
    return (
      <Modal visible={session !== null} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Send Alert</Text>
                {session && <Text style={styles.modalSubtitle}>To: {session.teacher}</Text>}
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close send alert modal"
              >
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.alertFormBody}>
              <Text style={styles.sectionLabel}>ALERT TYPE</Text>
              <View style={styles.optionRow}>
                {ALERT_TYPES.map((t) => {
                  const isActive = alertType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => onAlertTypeChange(t)}
                      style={[styles.optionChip, isActive && styles.optionChipActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          isActive && { color: '#FCD34D', fontWeight: '700' as const },
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>MESSAGE</Text>
              <TextInput
                value={alertMessage}
                onChangeText={onAlertMessageChange}
                multiline
                numberOfLines={4}
                placeholder="Type your message to the teacher..."
                placeholderTextColor="#4B5563"
                style={styles.messageInput}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, !alertMessage.trim() && styles.sendBtnDisabled]}
                disabled={!alertMessage.trim()}
                onPress={onSend}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Send alert"
              >
                <Text style={styles.sendBtnText}>Send Alert</Text>
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
    backgroundColor: 'rgba(26,34,51,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: DARK,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: DARK_TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  alertFormBody: {
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  optionChipActive: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252,211,77,0.1)',
  },
  optionChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  messageInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: DARK_TEXT,
    fontSize: 13,
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
  },
  closeButtonText: {
    color: DARK_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FCD34D',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: DARK,
    fontSize: 14,
    fontWeight: '700',
  },
});
