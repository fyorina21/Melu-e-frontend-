import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';
import StudentAvatar from '../../../components/StudentAvatar';
import type { SessionSummaryStudent, Goal } from '../../../types';
import { GoalSummaryRow } from './GoalSummaryRow';

interface StudentSummarySectionProps {
  student: SessionSummaryStudent;
  onViewTrialLog: (student: SessionSummaryStudent, goal: Goal) => void;
}

export const StudentSummarySection: React.FC<StudentSummarySectionProps> = React.memo(
  ({ student, onViewTrialLog }) => {
    const goals = Array.isArray(student?.goals) ? student.goals : [];
    return (
      <View style={styles.studentSection}>
        <View style={styles.studentHeaderRow}>
          <StudentAvatar name={student?.name} studentId={student?.id} size={28} />
          <Text style={styles.studentSectionTitle}>{student?.name || 'Student'}</Text>
        </View>
        {goals.map((goal) => (
          <GoalSummaryRow
            key={goal.id}
            goal={goal}
            onViewTrialLog={(g) => onViewTrialLog(student, g)}
          />
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  studentSection: {
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  studentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
