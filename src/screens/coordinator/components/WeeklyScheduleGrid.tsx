import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { type Teacher, type Cell, DAYS } from '../scheduleTypes';

export function StationChip({ station }: { station: string }) {
  const isStation1 = station === 'Station 1';
  return (
    <View style={[styles.stationChip, { backgroundColor: isStation1 ? colors.bgApp : '#FEF9C3' }]}>
      <Text style={[styles.stationChipText, { color: isStation1 ? colors.navyText : '#A16207' }]}>
        {station}
      </Text>
    </View>
  );
}

interface WeeklyScheduleGridProps {
  filteredTeachers: Teacher[];
  scheduleData: Record<string, Record<string, Cell>>;
  onCellPress: (teacher: Teacher, day: string, cell: { station: string; room: string }) => void;
}

export function WeeklyScheduleGrid({
  filteredTeachers,
  scheduleData,
  onCellPress,
}: WeeklyScheduleGridProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Feather name="calendar" size={16} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Weekly Schedule Grid</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.gridHeaderRow}>
            <Text style={[styles.gridCellHeader, styles.gridFirstCol]}>TEACHER</Text>
            {DAYS.map((day) => (
              <Text key={day} style={[styles.gridCellHeader, styles.gridDayCol]}>
                {day.toUpperCase()}
              </Text>
            ))}
          </View>
          {filteredTeachers.map((teacher) => (
            <View key={teacher.id} style={styles.gridRow}>
              <View style={[styles.teacherCell, styles.gridFirstCol]}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {(teacher?.name || 'Teacher').trim().slice(-1).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.gridTeacherName}>{teacher?.name || 'Teacher'}</Text>
                  {!teacher.available && (
                    <View style={styles.unavailableInline}>
                      <Feather name="clock" size={12} color="#EF4444" />
                      <Text style={styles.unavailableInlineText}>Unavailable</Text>
                    </View>
                  )}
                </View>
              </View>
              {DAYS.map((day) => {
                const cell = scheduleData[teacher.id]?.[day];
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, styles.gridDayCol]}
                    onPress={() => cell && onCellPress(teacher, day, cell)}
                    disabled={!cell}
                    activeOpacity={cell ? 0.7 : 1}
                    accessibilityRole={cell ? 'button' : undefined}
                    accessibilityLabel={
                      cell
                        ? `${teacher?.name || 'Teacher'} on ${day}: ${cell.station}, ${cell.room}`
                        : `${teacher?.name || 'Teacher'} on ${day}: No assignment`
                    }
                  >
                    {cell ? (
                      <>
                        <StationChip station={cell.station} />
                        <Text style={styles.roomText}>{cell.room}</Text>
                      </>
                    ) : (
                      <Text style={styles.emptyCellText}>—</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  gridCellHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  gridFirstCol: { width: 140 },
  gridDayCol: { width: 110, textAlign: 'center' },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  teacherCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  gridTeacherName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  unavailableInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  unavailableInlineText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  roomText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyCellText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  stationChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  stationChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
