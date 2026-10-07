import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import StatusPill from '../../../components/StatusPill';
import { radius, spacing } from '../../../theme/colors';
import type { NoteRecord } from '../dailyNotesTypes';

interface DailyNotesSessionTableProps {
  records: NoteRecord[];
  onNavigateEditor: (sessionId: string, mode: 'view' | 'edit') => void;
  onResubmitNote: (id: string) => void;
  onOpenFeedback: (record: NoteRecord) => void;
}

export const DailyNotesSessionTable: React.FC<DailyNotesSessionTableProps> = React.memo(
  ({ records, onNavigateEditor, onResubmitNote, onOpenFeedback }) => {
    return (
      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.tableCardTitle}>Session Records</Text>
          <Text style={styles.resultsCount}>{records.length} results</Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thText, styles.colDate]}>DATE</Text>
          <Text style={[styles.thText, styles.colStudents]}>STUDENTS</Text>
          <Text style={[styles.thText, styles.colStation]}>STATION</Text>
          <Text style={[styles.thText, styles.colStatus]}>STATUS</Text>
          <Text style={[styles.thText, styles.colActions]}>ACTIONS</Text>
        </View>

        {records.length === 0 ? (
          <Text style={styles.noRecordsText}>No sessions match the current filters.</Text>
        ) : (
          <FlashList
            data={records}
            keyExtractor={(r) => r.id}
            renderItem={({ item: r, index: i }) => (
              <View style={[styles.tableRow, i === records.length - 1 && styles.tableRowLast]}>
                <Text style={[styles.tdText, styles.colDate]}>{r.date}</Text>

                <View style={styles.colStudents}>
                  <View style={styles.pillsRow}>
                    {r.students.map((st) => (
                      <View key={st} style={styles.studentPill}>
                        <Text style={styles.studentPillText}>{st}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.subDetailText}>
                    {r.station} · {r.room}
                  </Text>
                </View>

                <Text style={[styles.tdText, styles.colStation]}>{r.station}</Text>

                <View style={styles.colStatus}>
                  <StatusPill
                    status={
                      r.status === 'Approved'
                        ? 'approved'
                        : r.status === 'Revision Required'
                          ? 'revision'
                          : 'pending'
                    }
                    label={r.status}
                  />
                </View>

                <View style={[styles.colActions, styles.actionsRow]}>
                  <TouchableOpacity
                    style={styles.viewActionBtn}
                    onPress={() => onNavigateEditor(r.id, 'view')}
                    accessibilityRole="button"
                    accessibilityLabel="View session note"
                  >
                    <Feather name="eye" size={13} color="#0284C7" />
                    <Text style={styles.viewActionText}>View</Text>
                  </TouchableOpacity>

                  {(r.status === 'Draft' || r.status === 'Revision Required') && (
                    <>
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() => onNavigateEditor(r.id, 'edit')}
                        accessibilityRole="button"
                        accessibilityLabel="Edit session note"
                      >
                        <Text style={styles.editActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resubmitActionBtn}
                        onPress={() => onResubmitNote(r.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Resubmit session note"
                      >
                        <Text style={styles.resubmitActionText}>Resubmit</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {r.status !== 'Pending' && r.coordinatorFeedback && (
                    <TouchableOpacity
                      style={styles.feedbackActionBtn}
                      onPress={() => onOpenFeedback(r)}
                      accessibilityRole="button"
                      accessibilityLabel="View coordinator feedback"
                    >
                      <Text style={styles.feedbackActionText}>View Feedback</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748B',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.xs ?? radius.sm,
    marginBottom: 4,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  colDate: { flex: 1.2 },
  colStudents: { flex: 2.5 },
  colStation: { flex: 1.2 },
  colStatus: { flex: 1.3 },
  colActions: { flex: 1.8 },
  noRecordsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tdText: {
    fontSize: 12,
    color: '#334155',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 2,
  },
  studentPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  studentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  subDetailText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  viewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  editActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  resubmitActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resubmitActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  feedbackActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.xs ?? radius.sm,
    backgroundColor: '#F1F5F9',
  },
  feedbackActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
});
