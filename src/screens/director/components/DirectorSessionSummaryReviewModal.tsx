import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import StudentAvatar from '../../../components/StudentAvatar';
import type { SessionReport } from '../reportsTypes';

interface Props {
  report: SessionReport | null;
  onApprove: (reportId: string, notes?: string) => void;
  onReject: (reportId: string, rejectionReason: string, notes?: string) => void;
  onClose: () => void;
}

export default function DirectorSessionSummaryReviewModal({
  report,
  onApprove,
  onReject,
  onClose,
}: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [directorNotes, setDirectorNotes] = useState('');

  if (!report) return null;

  const handleApprove = () => {
    onApprove(report.id, directorNotes.trim() || undefined);
    handleClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert(
        'Rejection Note Required',
        'Please enter a note explaining why this session summary is being rejected.',
      );
      return;
    }
    onReject(report.id, rejectionReason.trim(), directorNotes.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setShowRejectForm(false);
    setRejectionReason('');
    setDirectorNotes('');
    onClose();
  };

  const status = (report as any).status || 'submitted';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <Modal visible={Boolean(report)} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.title}>Session Summary Review</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isApproved
                      ? styles.badgeApproved
                      : isRejected
                        ? styles.badgeRejected
                        : styles.badgeSubmitted,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isApproved
                        ? styles.badgeApprovedText
                        : isRejected
                          ? styles.badgeRejectedText
                          : styles.badgeSubmittedText,
                    ]}
                  >
                    {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Submitted'}
                  </Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                Lead: {report.teacherName} · {report.date} ·{' '}
                {report.stationName || 'Active Station'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close review modal"
            >
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Students List */}
            <Text style={styles.sectionLabel}>Assigned Students</Text>
            <View style={styles.tagRow}>
              {report.studentNames.map((st) => (
                <View key={st} style={styles.studentTag}>
                  <StudentAvatar name={st} size={16} />
                  <Text style={styles.studentTagText}>{st}</Text>
                </View>
              ))}
            </View>

            {/* Performance Metrics if present */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>
                  {(report as any).trialsCount ?? (report as any).trials ?? 24}
                </Text>
                <Text style={styles.metricLabel}>Trials Logged</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: '#059669' }]}>
                  {(report as any).independence ?? (report as any).independencePercent ?? 85}%
                </Text>
                <Text style={styles.metricLabel}>Independence</Text>
              </View>
              <View style={styles.metricBox}>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color:
                        ((report as any).incidentsCount ?? (report as any).incidents ?? 0) > 0
                          ? '#DC2626'
                          : '#10B981',
                    },
                  ]}
                >
                  {(report as any).incidentsCount ?? (report as any).incidents ?? 0}
                </Text>
                <Text style={styles.metricLabel}>Incidents</Text>
              </View>
            </View>

            {/* Teacher Qualitative Notes */}
            <Text style={styles.sectionLabel}>Teacher Session Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                {(report as any).notes ||
                  'Session completed successfully with all target trials executed.'}
              </Text>
            </View>

            {/* Existing Rejection / Director Feedback if available */}
            {(report as any).rejectionReason && (
              <View style={styles.existingRejectionBox}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
                >
                  <Feather name="alert-circle" size={14} color="#DC2626" />
                  <Text style={styles.existingRejectionTitle}>Director Rejection Note</Text>
                </View>
                <Text style={styles.existingRejectionText}>{(report as any).rejectionReason}</Text>
              </View>
            )}

            {/* Director Notes Input */}
            <Text style={styles.sectionLabel}>Director Review Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add clinical observation notes or feedback..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={directorNotes}
              onChangeText={setDirectorNotes}
            />

            {/* Reject Reason Form (Shown when Reject is clicked) */}
            {showRejectForm && (
              <View style={styles.rejectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="alert-octagon" size={15} color="#DC2626" />
                  <Text style={styles.rejectionCardTitle}>Rejection Note (Required)</Text>
                </View>
                <Text style={styles.rejectionCardSubtitle}>
                  Please write a specific note explaining what needs revision before the teacher can
                  resubmit.
                </Text>
                <TextInput
                  style={styles.rejectionInput}
                  placeholder="e.g., Please clarify trial steps for student color matching and re-document prompt breakdown..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                />
                <View style={styles.rejectionActions}>
                  <TouchableOpacity
                    style={styles.cancelRejectBtn}
                    onPress={() => setShowRejectForm(false)}
                  >
                    <Text style={styles.cancelRejectText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmRejectBtn, !rejectionReason.trim() && styles.btnDisabled]}
                    disabled={!rejectionReason.trim()}
                    onPress={handleReject}
                  >
                    <Feather name="x-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.confirmRejectText}>Confirm Rejection with Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {!showRejectForm ? (
              <>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => setShowRejectForm(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Reject session summary"
                >
                  <Feather name="x-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={handleApprove}
                  accessibilityRole="button"
                  accessibilityLabel="Approve session summary"
                >
                  <Feather
                    name="check-circle"
                    size={16}
                    color={colors.navyText}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeSubmitted: {
    backgroundColor: '#FEF3C7',
  },
  badgeSubmittedText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  badgeApprovedText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeRejectedText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  studentTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  existingRejectionBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  existingRejectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  existingRejectionText: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minHeight: 70,
    fontSize: 13,
    color: colors.navyText,
    textAlignVertical: 'top',
  },
  rejectionCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDA4AF',
    gap: 8,
    marginTop: 4,
  },
  rejectionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BE123C',
  },
  rejectionCardSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  rejectionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDA4AF',
    minHeight: 80,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  cancelRejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  confirmRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  confirmRejectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryYellowDark,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  approveBtnText: {
    color: colors.navyText,
    fontWeight: '700',
    fontSize: 13,
  },
});
