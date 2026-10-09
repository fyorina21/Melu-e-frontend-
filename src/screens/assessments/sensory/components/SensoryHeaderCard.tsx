import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../../components/StudentAvatar';
import { radius, spacing } from '../../../../theme/colors';

interface SensoryHeaderCardProps {
  onBack: () => void;
  studentName?: string;
  studentAge?: string | number;
  studentId?: string;
  photoUrl?: string | null;
  assessmentDate: string;
  onAssessmentDateChange: (date: string) => void;
  scoredCount: number;
  totalActivities: number;
  progressPercent: number;
}

export const SensoryHeaderCard: React.FC<SensoryHeaderCardProps> = React.memo(
  ({
    onBack,
    studentName = 'Student',
    studentAge = '?',
    studentId,
    photoUrl,
    assessmentDate,
    onAssessmentDateChange,
    scoredCount,
    totalActivities,
    progressPercent,
  }) => {
    return (
      <View style={styles.container}>
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Top Header Card */}
        <View style={styles.topCard}>
          <View style={styles.studentInfoRow}>
            <StudentAvatar name={studentName} studentId={studentId} photoUrl={photoUrl} size={44} />
            <View>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentAge}>Age {studentAge}</Text>
            </View>
          </View>
          <View style={styles.topCardRight}>
            <Text style={styles.codeText}>SCR-012A</Text>
            <Text style={styles.titleText}>Sensory Time Engagement</Text>
          </View>
        </View>

        {/* Date and Progress Bar Card */}
        <View style={styles.dateProgressCard}>
          <View style={styles.dateRow}>
            <Text style={styles.fieldLabel}>Assessment Date</Text>
            <TextInput
              style={styles.dateInput}
              value={assessmentDate}
              onChangeText={onAssessmentDateChange}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTextLabel}>
                {scoredCount} / {totalActivities} activities scored
              </Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  backRow: {
    paddingVertical: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  topCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentAge: {
    fontSize: 12,
    color: '#64748B',
  },
  topCardRight: {
    alignItems: 'flex-end',
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateProgressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    minWidth: 110,
  },
  progressContainer: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTextLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
});
