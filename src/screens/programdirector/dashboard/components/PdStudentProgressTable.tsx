// src/screens/programdirector/dashboard/components/PdStudentProgressTable.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { FILTER_OPTIONS, STATUS_COLORS, type DashboardStudent } from '../dashboardTypes';

interface PdStudentProgressTableProps {
  students: DashboardStudent[];
  filter: string;
  search: string;
  onSelectFilter: (key: string) => void;
  onSearchChange: (text: string) => void;
}

export const PdStudentProgressTable: React.FC<PdStudentProgressTableProps> = React.memo(
  ({ students, filter, search, onSelectFilter, onSearchChange }) => {
    return (
      <View style={styles.container}>
        {/* Filters + Search bar */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => onSelectFilter(opt.key)}
                  accessibilityRole="button"
                  accessibilityLabel={opt.label}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.searchBox}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student..."
              placeholderTextColor={colors.mutedText}
              value={search}
              onChangeText={onSearchChange}
            />
          </View>
        </View>

        {/* Progress Table */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Student Progress</Text>
            <Text style={typography.caption}>
              {students.length} student{students.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.2 }]}>Student</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>Therapist</Text>
            <Text style={[styles.th, { flex: 1 }]}>Assessment</Text>
            <Text style={[styles.th, { flex: 1 }]}>Session</Text>
            <Text style={[styles.th, { flex: 1.3, textAlign: 'right' }]}>Status</Text>
          </View>

          {students.length === 0 ? (
            <Text style={styles.emptyText}>No students match the current filters.</Text>
          ) : (
            students.map((s) => {
              const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS['Not Started'];
              return (
                <View key={s.id} style={styles.tableRow}>
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.cellName}>{s.fullName}</Text>
                    <Text style={styles.cellSub}>
                      {s.programType} · {s.therapyGroup}
                    </Text>
                  </View>
                  <Text style={[styles.cell, { flex: 1.4 }]} numberOfLines={1}>
                    {s.therapist}
                  </Text>
                  <View style={[styles.cellIcon, { flex: 1 }]}>
                    {s.assessmentStatus === 'completed' ? (
                      <Feather name="check-circle" size={14} color="#10B981" />
                    ) : s.assessmentStatus === 'in-progress' ? (
                      <Feather name="clock" size={14} color="#F59E0B" />
                    ) : (
                      <Feather name="minus" size={14} color="#D1D5DB" />
                    )}
                  </View>
                  <View style={[styles.cellIcon, { flex: 1 }]}>
                    {s.sessionAssigned ? (
                      <Feather name="check-circle" size={14} color="#8B5CF6" />
                    ) : (
                      <Feather name="minus" size={14} color="#D1D5DB" />
                    )}
                  </View>
                  <View style={[styles.badge, { backgroundColor: sc.bg, flex: 1.3 }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]} numberOfLines={1}>
                      {s.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  chipActive: {
    backgroundColor: colors.navyText,
    borderColor: colors.navyText,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.bodyText,
  },
  chipTextActive: {
    color: '#FFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    minWidth: 160,
  },
  searchInput: {
    fontSize: 12,
    color: colors.navyText,
    flex: 1,
    padding: 0,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  cell: {
    fontSize: 12,
    color: colors.bodyText,
  },
  cellIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  cellSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
  },
  badge: {
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
