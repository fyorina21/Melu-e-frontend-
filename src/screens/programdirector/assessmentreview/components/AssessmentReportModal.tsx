// src/screens/programdirector/assessmentreview/components/AssessmentReportModal.tsx

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
import { typography } from '../../../../theme/typography';
import { scoreColor, type AssessmentReport } from '../reviewTypes';

interface AssessmentReportModalProps {
  visible: boolean;
  report: AssessmentReport | null;
  onClose: () => void;
  onMarkReviewed: (studentId: string, notes: string) => void;
  onExport: (report: AssessmentReport) => void;
}

export const AssessmentReportModal: React.FC<AssessmentReportModalProps> = React.memo(
  ({ visible, report, onClose, onMarkReviewed, onExport }) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
      if (visible) {
        setNotes('');
      }
    }, [visible]);

    if (!report) return null;

    const activeDomains = report.domainScores?.filter((d) => d.scoredCount > 0) || [];
    const unscoredDomains = report.domainScores?.filter((d) => d.scoredCount === 0) || [];

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <Text style={typography.h2}>{report.studentName} — Assessment Summary</Text>
            <Text style={typography.caption}>
              {report.age ? `Age ${report.age}` : ''}
              {report.age ? ' · ' : ''}
              {report.program}
              {report.therapist !== 'Unassigned' ? ` · ${report.therapist}` : ''}
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={typography.h3}>Skills Assessment (ABLLS)</Text>
              <Text style={typography.body}>{report.skillsSummary}</Text>

              {activeDomains.length > 0 && (
                <View style={styles.domainSection}>
                  {activeDomains.map((d) => (
                    <View key={d.code} style={styles.domainCard}>
                      <View style={styles.domainHeader}>
                        <Text style={styles.domainCode}>{d.code}</Text>
                        <Text style={styles.domainName}>{d.name}</Text>
                        <Text style={styles.domainScore}>
                          {d.scoredCount}/{d.total}
                        </Text>
                      </View>
                      <View style={styles.domainItems}>
                        {(d.items || [])
                          .filter((i) => i.score !== null && i.score !== undefined)
                          .map((i) => (
                            <View key={i.id} style={styles.domainItem}>
                              <Text style={styles.domainItemId}>{i.id}</Text>
                              <Text style={styles.domainItemDesc} numberOfLines={1}>
                                {i.description}
                              </Text>
                              <View
                                style={[
                                  styles.scoreBadge,
                                  { backgroundColor: scoreColor(i.score) },
                                ]}
                              >
                                <Text style={styles.scoreBadgeText}>{String(i.score)}</Text>
                              </View>
                            </View>
                          ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {unscoredDomains.length > 0 && (
                <Text style={[typography.caption, { marginTop: spacing.sm }]}>
                  Unscored domains: {unscoredDomains.map((d) => `${d.code} (${d.name})`).join(', ')}
                </Text>
              )}

              <Text style={[typography.h3, { marginTop: spacing.md }]}>
                Behavior Assessment (MASS/FAST)
              </Text>
              <Text style={typography.body}>{report.behaviorSummary}</Text>

              <Text style={[typography.h3, { marginTop: spacing.md }]}>Top Preferences</Text>
              <Text style={typography.body}>{(report.preferences || []).join(', ')}</Text>

              {report.notes && report.notes !== 'No notes recorded.' && (
                <>
                  <Text style={[typography.h3, { marginTop: spacing.md }]}>Teacher Notes</Text>
                  <Text style={typography.body}>{report.notes}</Text>
                </>
              )}

              <Text style={[typography.h3, { marginTop: spacing.md }]}>IUP Status</Text>
              <Text style={typography.body}>{report.iupStatus}</Text>

              {report.assignedGoals && report.assignedGoals.length > 0 && (
                <>
                  <Text style={[typography.h3, { marginTop: spacing.md }]}>Goal Status</Text>
                  {report.assignedGoals.map((g, idx) => (
                    <Text key={idx} style={typography.body}>
                      • {g.name} ({g.status})
                    </Text>
                  ))}
                </>
              )}

              {report.dateCompleted && (
                <>
                  <Text style={[typography.h3, { marginTop: spacing.md }]}>Date Completed</Text>
                  <Text style={typography.body}>{report.dateCompleted}</Text>
                </>
              )}
            </ScrollView>

            <View style={styles.field}>
              <Text style={typography.label}>Internal Notes</Text>
              <TextInput
                style={styles.textArea}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Not visible to parents or teachers..."
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() => onExport(report)}
                accessibilityRole="button"
                accessibilityLabel="Export Assessment Summary"
              >
                <Feather name="share-2" size={14} color={colors.navyText} />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
              {report.status !== 'Reviewed' && (
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => onMarkReviewed(report.studentId, notes.trim())}
                  accessibilityRole="button"
                  accessibilityLabel="Mark assessment as reviewed"
                >
                  <Text style={styles.approveBtnText}>Mark as Reviewed</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  domainSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  domainCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  domainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  domainCode: {
    fontWeight: '800',
    fontSize: 13,
    color: colors.primaryBlue,
  },
  domainName: {
    fontWeight: '600',
    fontSize: 12,
    color: colors.navyText,
    flex: 1,
  },
  domainScore: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
  },
  domainItems: {
    gap: 4,
  },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  domainItemId: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navyText,
    width: 26,
  },
  domainItemDesc: {
    fontSize: 11,
    color: colors.mutedText,
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  field: {
    gap: spacing.xs,
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
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  cancelBtnText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.statusPendingBg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  exportBtnText: {
    fontWeight: '700',
    color: colors.navyText,
    fontSize: 12,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  approveBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
