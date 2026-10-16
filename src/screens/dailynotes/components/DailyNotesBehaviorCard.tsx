import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { BehaviorAssessmentData } from '../dailyNotesTypes';

interface DailyNotesBehaviorCardProps {
  studentId?: string;
  hasBehavior: boolean;
  behaviorAssessment: BehaviorAssessmentData | null;
  massFunctionText?: string;
  fastCategoryText?: string;
  onStudentSelect: (id?: string) => void;
  onNavigateBehaviorAssessment: (studentId: string) => void;
}

export const DailyNotesBehaviorCard: React.FC<DailyNotesBehaviorCardProps> = React.memo(
  ({
    studentId,
    hasBehavior,
    behaviorAssessment,
    massFunctionText,
    fastCategoryText,
    onStudentSelect,
    onNavigateBehaviorAssessment,
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Behavior Assessment</Text>
          {studentId && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => onStudentSelect(undefined)}
              accessibilityRole="button"
              accessibilityLabel="Deselect student"
            >
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {!studentId ? (
            <Text style={styles.emptyText}>
              Select a student to view their behavior assessment.
            </Text>
          ) : !hasBehavior ? (
            <Text style={styles.emptyText}>No behavior assessment recorded yet.</Text>
          ) : (
            <>
              <View style={styles.statsRow}>
                <Text style={styles.subtypeText}>
                  {Object.keys(behaviorAssessment?.massAnswers ?? {}).length} MASS answered
                </Text>
                <Text style={styles.subtypeText}>
                  {Object.values(behaviorAssessment?.fastAnswers ?? {}).filter(Boolean).length} FAST
                  yes
                </Text>
                <Text style={styles.subtypeText}>
                  {behaviorAssessment?.records?.length ?? 0} ABC incidents
                </Text>
                {behaviorAssessment?.status === 'submitted' ? (
                  <Text style={[styles.subtypeText, { color: '#0284C7', fontWeight: '600' }]}>
                    Submitted for review
                  </Text>
                ) : (
                  <Text style={[styles.subtypeText, { color: '#D97706', fontWeight: '600' }]}>
                    Draft
                  </Text>
                )}
              </View>

              {Object.keys(behaviorAssessment?.massAnswers ?? {}).length > 0 &&
                massFunctionText && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>MASS identified function</Text>
                    <Text style={styles.noteText}>{massFunctionText}</Text>
                  </View>
                )}

              {Object.keys(behaviorAssessment?.fastAnswers ?? {}).length > 0 &&
                fastCategoryText && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>FAST identified category</Text>
                    <Text style={styles.noteText}>{fastCategoryText}</Text>
                  </View>
                )}

              {(behaviorAssessment?.records?.length ?? 0) > 0 && (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>ABC records</Text>
                  {behaviorAssessment?.records?.map((r, idx) => (
                    <Text key={r.id || idx} style={styles.noteText}>
                      {idx + 1}. {r.behavior} · {r.frequency}
                      {r.duration ? ` · ${r.duration}` : ''} · {r.intensity} intensity
                      {r.trigger ? ` · Trigger: ${r.trigger}` : ''}
                      {r.consequence ? ` · Consequence: ${r.consequence}` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {behaviorAssessment?.draftRecord &&
                (behaviorAssessment.draftRecord.frequency?.trim() ||
                  behaviorAssessment.draftRecord.trigger?.trim() ||
                  behaviorAssessment.draftRecord.duration?.trim()) && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>In-Progress Draft Incident</Text>
                    <Text style={styles.noteText}>
                      {behaviorAssessment.draftRecord.behavior} ·{' '}
                      {behaviorAssessment.draftRecord.frequency || 'No frequency'}
                      {behaviorAssessment.draftRecord.duration
                        ? ` · ${behaviorAssessment.draftRecord.duration}`
                        : ''}
                      {behaviorAssessment.draftRecord.intensity
                        ? ` · ${behaviorAssessment.draftRecord.intensity} intensity`
                        : ''}
                      {behaviorAssessment.draftRecord.trigger
                        ? ` · Trigger: ${behaviorAssessment.draftRecord.trigger}`
                        : ''}
                    </Text>
                  </View>
                )}

              <TouchableOpacity
                style={styles.openBehaviorBtn}
                onPress={() => onNavigateBehaviorAssessment(studentId ?? 'student-a')}
                accessibilityRole="button"
                accessibilityLabel="Open behavior assessment editor"
              >
                <Feather name="edit-3" size={13} color="#0284C7" />
                <Text style={styles.openBehaviorBtnText}>
                  {behaviorAssessment?.status === 'submitted'
                    ? 'View / Edit Assessment →'
                    : 'Continue Editing Draft →'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  subtypeText: {
    fontSize: 12,
    color: '#475569',
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: 8,
    gap: 2,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  noteText: {
    fontSize: 12,
    color: '#1E293B',
  },
  openBehaviorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  openBehaviorBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
});
