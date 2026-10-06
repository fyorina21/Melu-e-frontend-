import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { Teacher } from '../scheduleTypes';

function KpiCard({
  label,
  value,
  unit = '',
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>
        {value}
        <Text style={styles.kpiUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

interface TeacherMetricsCardProps {
  teacher: Teacher;
  onViewSummary: (teacher: Teacher) => void;
  onMarkUnavailable: (teacher: Teacher) => void;
  onReassign: (teacher: Teacher) => void;
}

export function TeacherMetricsCard({
  teacher,
  onViewSummary,
  onMarkUnavailable,
  onReassign,
}: TeacherMetricsCardProps) {
  return (
    <View
      style={[
        styles.card,
        styles.metricCard,
        !teacher.available && { borderColor: '#FECACA', backgroundColor: '#FFFBFA' },
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricHeaderLeft}>
          <View style={styles.avatarMedium}>
            <Text style={styles.avatarMediumText}>
              {teacher.name.charAt(teacher.name.length - 1)}
            </Text>
          </View>
          <View>
            <Text style={styles.metricTeacherName}>{teacher.name}</Text>
            <Text style={styles.metricTeacherMeta}>
              {teacher.station} · {teacher.room}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.availabilityBadge,
            { backgroundColor: !teacher.available ? '#FEE2E2' : '#DCFCE7' },
          ]}
        >
          <Text
            style={[
              styles.availabilityBadgeText,
              { color: !teacher.available ? '#DC2626' : '#16A34A' },
            ]}
          >
            {!teacher.available ? 'Unavailable' : 'Available'}
          </Text>
        </View>
      </View>

      <View>
        <Text style={styles.assignedLabel}>Assigned Students</Text>
        {teacher.students.length === 0 ? (
          <View style={styles.noStudentsBox}>
            <Text style={styles.noStudentsText}>No students assigned</Text>
          </View>
        ) : (
          <View style={styles.chipWrap}>
            {teacher.students.map((s) => (
              <View key={s} style={styles.grayChip}>
                <Text style={styles.grayChipText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard label="Sessions" value={teacher.sessions} />
        <KpiCard label="Trials" value={teacher.trials} />
        <KpiCard label="Indep." value={teacher.independence} unit="%" />
        <KpiCard label="Incidents" value={teacher.incidents} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <TouchableOpacity
          style={styles.summaryButton}
          onPress={() => onViewSummary(teacher)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View summary for ${teacher.name}`}
        >
          <Feather name="eye" size={14} color="#4B5563" />
          <Text style={styles.summaryButtonText}>View Teacher Summary</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={styles.unavailableButton}
            onPress={() => onMarkUnavailable(teacher)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${teacher.name} unavailable`}
          >
            <Feather name="user-minus" size={14} color="#EA580C" />
            <Text style={styles.unavailableButtonText}>Mark Unavailable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reassignButton, teacher.students.length === 0 && { opacity: 0.4 }]}
            onPress={() => onReassign(teacher)}
            disabled={teacher.students.length === 0}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Reassign students from ${teacher.name}`}
          >
            <Feather name="repeat" size={14} color={colors.primaryYellowDark} />
            <Text style={styles.reassignButtonText}>Reassign Students</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  metricCard: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarMedium: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMediumText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  metricTeacherName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  metricTeacherMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  availabilityBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  availabilityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  assignedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  grayChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  grayChipText: {
    fontSize: 12,
    color: colors.navyText,
    fontWeight: '500',
  },
  noStudentsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noStudentsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navyText,
    marginTop: 2,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  summaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  unavailableButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  unavailableButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  reassignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
  },
  reassignButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryYellowDark,
  },
});
