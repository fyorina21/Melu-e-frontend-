import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';
import StudentAvatar from '../../../components/StudentAvatar';
import type { MasteryCheckData } from '../types';

interface MasteryStudentCardProps {
  data: MasteryCheckData;
  currentStatus: string;
  isSubmitted: boolean;
}

export const MasteryStudentCard: React.FC<MasteryStudentCardProps> = React.memo(
  ({ data, currentStatus, isSubmitted }) => {
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfoLeft}>
          <StudentAvatar
            name={data.studentName}
            studentId={data.studentId}
            size={52}
            style={{ marginRight: 4 }}
          />
          <View>
            <Text style={styles.studentName}>{data.studentName}</Text>
            <Text style={styles.metaDetail}>
              Goal: <Text style={styles.metaValue}>{data.goalName}</Text>
            </Text>
            <Text style={styles.metaDetail}>
              Station: <Text style={styles.metaValue}>{data.station}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.studentInfoRight}>
          <View style={styles.initMetaRow}>
            <View>
              <Text style={styles.metaLabel}>Date Initiated</Text>
              <Text style={styles.metaValueText}>{data.dateInitiated}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Initiated By</Text>
              <Text style={styles.metaValueText}>{data.initiatedBy}</Text>
              <Text style={styles.metaSubText}>({data.initiatedByRole})</Text>
            </View>
          </View>
          <View style={[styles.statusPill, isSubmitted && styles.pendingPill]}>
            <Text style={styles.statusPillText}>{currentStatus}</Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  studentInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaDetail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaValue: {
    color: '#0F172A',
    fontWeight: '600',
  },
  studentInfoRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  initMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metaValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metaSubText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pendingPill: {
    backgroundColor: '#E0F2FE',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
});
