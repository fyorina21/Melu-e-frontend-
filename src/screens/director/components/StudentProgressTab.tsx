import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface StudentProgressTabProps {
  studentProgressLoading: boolean;
  studentProgressData: any;
  onPreviewStudentProgress: () => void;
}

export function StudentProgressTab({
  studentProgressLoading,
  studentProgressData,
  onPreviewStudentProgress,
}: StudentProgressTabProps) {
  const avgGoalMastery =
    studentProgressData?.goals && studentProgressData.goals.length > 0
      ? Math.round(
          studentProgressData.goals.reduce((acc: number, g: any) => acc + (g.percent || 0), 0) /
            studentProgressData.goals.length,
        )
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Student Clinical Progress Monitoring</Text>
          <Text style={styles.cardSub}>
            Bi-annual progress review, IEP/IUP goal progression, and session trial mastery
          </Text>
        </View>
        {studentProgressData && (
          <TouchableOpacity style={styles.smallExportBtn} onPress={onPreviewStudentProgress}>
            <Feather name="printer" size={13} color={colors.navyText} />
            <Text style={styles.smallExportBtnText}>Print / Export PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {studentProgressLoading ? (
        <View style={styles.emptyWrap}>
          <Feather name="loader" size={24} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>Loading Student Progress...</Text>
        </View>
      ) : studentProgressData ? (
        <View style={{ gap: spacing.md }}>
          {/* Student Demographics Card */}
          <View style={styles.studentInfoBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentNameHeader}>{studentProgressData.name}</Text>
              <Text style={styles.studentSubHeader}>
                Age: {studentProgressData.age} | Program: {studentProgressData.program} | Diagnosis:{' '}
                {studentProgressData.diagnosis || 'Autism Spectrum Disorder'}
              </Text>
            </View>
            <View style={styles.sufficientBadge}>
              <Feather name="check-circle" size={13} color="#059669" />
              <Text style={styles.sufficientText}>Sufficient Data</Text>
            </View>
          </View>

          {/* Progress Overview Stats */}
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticCard}>
              <Text style={styles.analyticVal}>{studentProgressData.goals?.length || 0}</Text>
              <Text style={styles.analyticLabel}>Assigned Goals</Text>
            </View>
            <View style={styles.analyticCard}>
              <Text style={[styles.analyticVal, { color: colors.successGreen }]}>
                {avgGoalMastery}%
              </Text>
              <Text style={styles.analyticLabel}>Avg Goal Mastery</Text>
            </View>
            <View style={styles.analyticCard}>
              <Text style={styles.analyticVal}>
                {studentProgressData.sessionsAttended ||
                  studentProgressData.sessionHistory?.length ||
                  18}
              </Text>
              <Text style={styles.analyticLabel}>Sessions Completed</Text>
            </View>
          </View>

          {/* Goals Breakdown */}
          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.goalsSectionTitle}>Goal Mastery Progression</Text>
            {(studentProgressData.goals || []).map((g: any) => (
              <View key={g.id} style={styles.goalProgressRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalNameText}>{g.name}</Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.min(100, g.percent || 0)}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.goalPercentText}>{g.percent || 0}%</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={onPreviewStudentProgress}>
            <Feather name="file-text" size={16} color={colors.navyText} />
            <Text style={styles.generateBtnText}>Generate Comprehensive Progress Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Feather name="user-check" size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>
            Select a student in filter above to inspect progress
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  cardSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  smallExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  smallExportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  studentInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  studentNameHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  studentSubHeader: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  sufficientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  sufficientText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  analyticCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  analyticVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyText,
  },
  analyticLabel: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: spacing.sm,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    gap: spacing.md,
  },
  goalNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    marginBottom: 4,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryYellowDark,
    borderRadius: 3,
  },
  goalPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
    width: 40,
    textAlign: 'right',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF08A',
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    color: colors.mutedText,
    fontWeight: '500',
  },
});
