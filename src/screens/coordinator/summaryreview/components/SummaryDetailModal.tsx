import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import {
  type Summary,
  type SummaryStatus,
  STATUS_CONFIG,
  SECTIONS,
  DARK,
  SKY,
  AMBER,
  independenceColor,
} from '../types';

interface SummaryDetailModalProps {
  summary: Summary | null;
  coordinatorNotes: string;
  showRequestForm: boolean;
  requestSection: string;
  requestReason: string;
  onCoordinatorNotesChange: (val: string) => void;
  onToggleRequestForm: () => void;
  onRequestSectionChange: (val: string) => void;
  onRequestReasonChange: (val: string) => void;
  onRequestChanges: (summary: Summary) => void;
  onApproveSingle: (summary: Summary) => void;
  onClose: () => void;
}

function StatusBadge({ status }: { status: SummaryStatus }) {
  const sc = STATUS_CONFIG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Feather name={sc.icon} size={12} color={sc.text} />
      <Text style={[styles.statusBadgeText, { color: sc.text }]}>{sc.label}</Text>
    </View>
  );
}

export const SummaryDetailModal: React.FC<SummaryDetailModalProps> = React.memo(
  ({
    summary,
    coordinatorNotes,
    showRequestForm,
    requestSection,
    requestReason,
    onCoordinatorNotesChange,
    onToggleRequestForm,
    onRequestSectionChange,
    onRequestReasonChange,
    onRequestChanges,
    onApproveSingle,
    onClose,
  }) => {
    return (
      <Modal visible={summary !== null} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Review</Text>
                {summary && (
                  <Text style={styles.headerSubtitle}>
                    {summary.teacher} · {summary.date} · {summary.station}
                    {summary.room ? ` · ${summary.room}` : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close session review"
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.detailBody}
              keyboardShouldPersistTaps="handled"
            >
              {summary && (
                <>
                  <StatusBadge status={summary.status} />

                  <Text style={styles.sectionLabel}>Students</Text>
                  <View style={styles.tagRow}>
                    {summary.students.map((st) => (
                      <View key={st} style={styles.studentTagLg}>
                        <Feather name="users" size={14} color={SKY} />
                        <Text style={styles.studentTagLgText}>{st}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, { color: SKY }]}>{summary.trials}</Text>
                      <Text style={styles.statLabel}>Trials</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text
                        style={[
                          styles.statValue,
                          { color: independenceColor(summary.independence) },
                        ]}
                      >
                        {summary.independence}%
                      </Text>
                      <Text style={styles.statLabel}>Independence</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text
                        style={[
                          styles.statValue,
                          { color: summary.incidents > 0 ? '#FB923C' : '#4ADE80' },
                        ]}
                      >
                        {summary.incidents}
                      </Text>
                      <Text style={styles.statLabel}>Incidents</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>Teacher Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{summary.notes}</Text>
                  </View>

                  <View style={styles.sectionLabelRow}>
                    <Text style={styles.sectionLabel}>Coordinator Notes</Text>
                    <View style={styles.internalTag}>
                      <Text style={styles.internalTagText}>Internal only</Text>
                    </View>
                  </View>
                  <TextInput
                    style={styles.textArea}
                    value={coordinatorNotes}
                    onChangeText={onCoordinatorNotesChange}
                    multiline
                    placeholder="Add internal notes (not visible to teacher)..."
                    placeholderTextColor="#6B7280"
                  />

                  {showRequestForm && (
                    <View style={styles.requestForm}>
                      <Text style={[styles.sectionLabel, { color: '#F87171' }]}>
                        Request Changes
                      </Text>
                      <Text style={styles.fieldLabel}>Section</Text>
                      <View style={styles.sectionChipsRow}>
                        {SECTIONS.map((sec) => (
                          <TouchableOpacity
                            key={sec}
                            style={[
                              styles.sectionChip,
                              requestSection === sec && styles.sectionChipActive,
                            ]}
                            onPress={() => onRequestSectionChange(sec)}
                          >
                            <Text
                              style={[
                                styles.sectionChipText,
                                requestSection === sec && styles.sectionChipTextActive,
                              ]}
                            >
                              {sec}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.fieldLabel}>Reason</Text>
                      <TextInput
                        style={styles.textArea}
                        value={requestReason}
                        onChangeText={onRequestReasonChange}
                        multiline
                        placeholder="Describe what needs to be corrected or added..."
                        placeholderTextColor="#6B7280"
                      />
                      <TouchableOpacity
                        style={styles.submitRequestBtn}
                        onPress={() => onRequestChanges(summary)}
                      >
                        <Text style={styles.submitRequestText}>Submit Change Request</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.requestChangesFooterBtn}
                onPress={onToggleRequestForm}
              >
                <Text style={styles.requestChangesFooterText}>
                  {showRequestForm ? 'Cancel Request' : 'Request Changes'}
                </Text>
              </TouchableOpacity>
              {!showRequestForm && summary && (
                <TouchableOpacity
                  style={styles.approveSingleBtn}
                  onPress={() => onApproveSingle(summary)}
                >
                  <Text style={styles.approveSingleBtnText}>Approve</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  detailPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  detailBody: {
    padding: 20,
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  internalTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  internalTagText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentTagLg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(252,211,77,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  studentTagLgText: {
    color: DARK,
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notesText: {
    color: '#374151',
    fontSize: 13,
    lineHeight: 18,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 80,
    color: DARK,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  requestForm: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  sectionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionChipActive: {
    backgroundColor: '#F87171',
    borderColor: '#F87171',
  },
  sectionChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  sectionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitRequestBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 4,
  },
  submitRequestText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  requestChangesFooterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  requestChangesFooterText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  approveSingleBtn: {
    backgroundColor: AMBER,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  approveSingleBtnText: {
    color: DARK,
    fontWeight: '700',
    fontSize: 13,
  },
});
