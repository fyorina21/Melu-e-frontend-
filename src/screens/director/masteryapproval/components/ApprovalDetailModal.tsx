// src/screens/director/masteryapproval/components/ApprovalDetailModal.tsx

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
import StatusPill from '../../../../components/StatusPill';
import { notify } from '../../../../utils/dialogs';
import type { MasteryDetail } from '../masteryApprovalTypes';

interface ApprovalDetailModalProps {
  visible: boolean;
  detail: MasteryDetail | null;
  onClose: () => void;
  onApprove: (checkId: string, notes: string) => void;
  onReject: (checkId: string, reason: string, notes: string) => void;
}

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = React.memo(
  ({ visible, detail, onClose, onApprove, onReject }) => {
    const [notes, setNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showTrialLog, setShowTrialLog] = useState(false);

    useEffect(() => {
      if (
        visible &&
        typeof document !== 'undefined' &&
        document.activeElement &&
        'blur' in document.activeElement
      ) {
        (document.activeElement as HTMLElement).blur();
      }
      if (visible) {
        setNotes('');
        setRejectReason('');
        setShowTrialLog(false);
      }
    }, [visible]);

    if (!detail) return null;

    const handleRejectClick = () => {
      if (!rejectReason.trim()) {
        notify('Feedback Required', 'Please enter a rejection reason.');
        return;
      }
      onReject(detail.checkId, rejectReason.trim(), notes.trim());
    };

    return (
      <Modal
        visible={visible}
        aria-modal={true}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{detail.studentName}</Text>
                <Text style={styles.modalSub}>{detail.goalName}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={colors.navyText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* 3-Therapist Verification Track */}
              <View style={styles.verificationSection}>
                <Text style={styles.sectionHeading}>3-THERAPIST CLINICAL VERIFICATION</Text>

                {/* Primary Teacher A */}
                <View style={styles.verifyCard}>
                  <View style={styles.verifyCardHeader}>
                    <View style={styles.teacherAvatar}>
                      <Text style={styles.teacherAvatarText}>A</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherRoleTitle}>Primary Therapist (Teacher A)</Text>
                      <Text style={styles.teacherOutcome}>
                        Initial 3-Consecutive Mastery Submission
                      </Text>
                    </View>
                    <StatusPill status="approved" label="Mastered (3x)" />
                  </View>
                  <Text style={styles.verifyNotes}>{detail.teacherA.summary}</Text>
                </View>

                {/* Generalization Teacher B */}
                <View style={styles.verifyCard}>
                  <View style={styles.verifyCardHeader}>
                    <View style={[styles.teacherAvatar, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.teacherAvatarText, { color: '#1E40AF' }]}>B</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherRoleTitle}>Cross-Observer (Teacher B)</Text>
                      <Text style={styles.teacherOutcome}>
                        Outcome: {detail.teacherB.outcome || 'Verified Independent'}
                      </Text>
                    </View>
                    <StatusPill status="approved" label="Verified" />
                  </View>
                  {detail.teacherB.notes ? (
                    <Text style={styles.verifyNotes}>{detail.teacherB.notes}</Text>
                  ) : null}
                </View>

                {/* Generalization Teacher C */}
                <View style={styles.verifyCard}>
                  <View style={styles.verifyCardHeader}>
                    <View style={[styles.teacherAvatar, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.teacherAvatarText, { color: '#166534' }]}>C</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.teacherRoleTitle}>Cross-Observer (Teacher C)</Text>
                      <Text style={styles.teacherOutcome}>
                        Outcome: {detail.teacherC.outcome || 'Verified Independent'}
                      </Text>
                    </View>
                    <StatusPill status="approved" label="Verified" />
                  </View>
                  {detail.teacherC.notes ? (
                    <Text style={styles.verifyNotes}>{detail.teacherC.notes}</Text>
                  ) : null}
                </View>
              </View>

              {/* View Trial Log (SCR-DIR-003) */}
              <TouchableOpacity
                style={styles.trialLogToggle}
                onPress={() => setShowTrialLog((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="View trial log"
              >
                <Feather name="list" size={14} color={colors.navyText} />
                <Text style={styles.trialLogToggleText}>
                  {showTrialLog ? 'Hide Trial Log' : 'View Trial Log'}
                </Text>
                <Feather
                  name={showTrialLog ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.bodyText}
                />
              </TouchableOpacity>

              {showTrialLog && (
                <View style={styles.trialLogSection}>
                  <Text style={styles.sectionHeading}>TEACHER A — CHRONOLOGICAL TRIAL LOG</Text>
                  {(detail.trialLog ?? []).map((t) => (
                    <View key={t.id} style={styles.trialRow}>
                      <Text style={styles.trialDate}>{t.date}</Text>
                      <Text style={styles.trialPrompt}>{t.prompt}</Text>
                      <StatusPill
                        status={t.result === 'Correct' ? 'approved' : 'pending'}
                        label={t.result}
                      />
                    </View>
                  ))}
                  {(detail.trialLog ?? []).length === 0 && (
                    <Text style={styles.trialEmpty}>No trials logged yet.</Text>
                  )}
                </View>
              )}

              {/* Notes & Feedback */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Director Approval Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  value={notes}
                  onChangeText={setNotes}
                  placeholderTextColor={colors.mutedText}
                  placeholder="Internal clinical notes for student records..."
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Rejection Reason (Required only if rejecting)</Text>
                <TextInput
                  style={styles.textInput}
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholderTextColor={colors.mutedText}
                  placeholder="Clinical feedback for Teacher A & required corrective actions..."
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={handleRejectClick}
                accessibilityRole="button"
                accessibilityLabel="Reject and Return"
              >
                <Feather name="x-circle" size={15} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Reject & Return</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => onApprove(detail.checkId, notes.trim())}
                accessibilityRole="button"
                accessibilityLabel="Approve Mastery"
              >
                <Feather name="check-circle" size={15} color={colors.navyText} />
                <Text style={styles.approveBtnText}>Approve Mastery</Text>
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
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '90%',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalSub: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.8,
  },
  verifyCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  verifyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teacherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navyText,
  },
  teacherRoleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  teacherOutcome: {
    fontSize: 11,
    color: colors.bodyText,
  },
  verifyNotes: {
    fontSize: 12,
    color: colors.navyText,
    marginTop: 4,
    fontStyle: 'italic',
  },
  trialLogToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
    marginBottom: spacing.sm,
  },
  trialLogToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    flex: 1,
    textAlign: 'center',
  },
  trialLogSection: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  trialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  trialDate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.bodyText,
    width: 84,
  },
  trialPrompt: {
    fontSize: 12,
    color: colors.navyText,
    flex: 1,
  },
  trialEmpty: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  field: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    backgroundColor: colors.bgApp,
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.navyText,
    backgroundColor: colors.bgApp,
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  rejectBtnText: {
    fontWeight: '700',
    color: '#EF4444',
    fontSize: 13,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  approveBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 13,
  },
});
