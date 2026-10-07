// screens/director/DirectorSchedulingScreen.tsx
// SCR-DIR-002: Staff Scheduling (Director View)

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getDirectorSchedule, saveAssignment, removeAllAssignments } from '../../api/directorApi';
import { getStaffOptions, getStudentOptions } from '../../api/optionsApi';
import { getScheduleCapacityConfig } from '../../api/institutionalAdminApi';
import type { DirectorStackParamList } from '../../types';
import { type Option, type ScheduleBlock, filterStaffOptions } from './scheduling/types';
import {
  AssignmentEditorModal,
  StaffSelectorCard,
  ScheduleBlockCard,
} from './scheduling/components';

export default function DirectorSchedulingScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorScheduling'>) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [teachers, setTeachers] = useState<Option[]>([]);
  const [students, setStudents] = useState<Option[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [blocks, setBlocks] = useState<ScheduleBlock[] | null>(null);
  const [editorTarget, setEditorTarget] = useState<ScheduleBlock | null>(null);
  const [capacity, setCapacity] = useState<number>(2);

  // Dropdown Picker State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTeacher, setSearchTeacher] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getDirectorSchedule({ teacherId });
      setBlocks(Array.isArray(data) ? data : []);
    } catch {
      setBlocks([]);
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getScheduleCapacityConfig()
      .then(({ data }) => {
        const cap = Number(data?.staff_to_student_capacity ?? data?.capacity);
        if (cap && !isNaN(cap) && cap > 0) setCapacity(cap);
      })
      .catch(() => {});

    getStaffOptions()
      .then(({ data: opts }) => {
        const teacherRows = opts.filter((t) => t.role === 'teacher');
        setTeachers(teacherRows);
        setTeacherId((prev) => prev || teacherRows[0]?.id || '');
      })
      .catch(() => setTeachers([]));

    getStudentOptions()
      .then(({ data: opts }) => setStudents(opts))
      .catch(() => setStudents([]));
  }, []);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === teacherId) ?? null,
    [teachers, teacherId],
  );

  const filteredTeachers = useMemo(
    () => filterStaffOptions(teachers, searchTeacher),
    [teachers, searchTeacher],
  );

  const handleSaveAssignment = async (blockId: string, studentIds: string[]) => {
    try {
      await saveAssignment({ blockId, studentIds, teacherId });
      await load();
    } catch {
      // ignore
    }
    setEditorTarget(null);
  };

  const handleRemoveAll = (block: ScheduleBlock) => {
    Alert.alert('Remove All Assignments', 'Remove all students assigned to this block?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove All',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeAllAssignments(block.id);
            await load();
          } catch {
            // ignore
          }
        },
      },
    ]);
  };

  if (!blocks) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Staff Scheduling"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.badgeIcon}>
                <Feather name="calendar" size={20} color={colors.navyText} />
              </View>
              <View>
                <Text style={styles.pageTitle}>Staff Scheduling</Text>
                <Text style={styles.pageSubtitle}>
                  Manage staff station blocks, student capacity, and timetable assignments
                </Text>
              </View>
            </View>
          </View>

          {/* Staff Selector Dropdown */}
          <StaffSelectorCard
            selectedTeacher={selectedTeacher}
            teacherId={teacherId}
            dropdownOpen={dropdownOpen}
            onToggleDropdown={() => setDropdownOpen((prev) => !prev)}
            searchTeacher={searchTeacher}
            onSearchTeacherChange={setSearchTeacher}
            filteredTeachers={filteredTeachers}
            onSelectTeacher={(id) => {
              setTeacherId(id);
              setDropdownOpen(false);
              setSearchTeacher('');
            }}
          />

          {/* Schedule Blocks */}
          <View style={styles.blocksSection}>
            <View style={styles.blocksHeaderRow}>
              <Text style={styles.sectionHeading}>SESSION SCHEDULE BLOCKS</Text>
              <Text style={styles.capacityNotice}>Max Capacity: {capacity} Students / Block</Text>
            </View>

            {blocks.map((block) => (
              <ScheduleBlockCard
                key={block.id}
                block={block}
                capacity={capacity}
                students={students}
                onEdit={setEditorTarget}
                onRemoveAll={handleRemoveAll}
              />
            ))}

            {blocks.length === 0 && (
              <View style={styles.emptyBlocks}>
                <Feather name="calendar" size={32} color={colors.mutedText} />
                <Text style={styles.emptyBlocksTitle}>No Schedule Blocks Found</Text>
                <Text style={styles.emptyBlocksSub}>
                  Select another therapist or configure session rounds in Institutional Admin.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <AssignmentEditorModal
        visible={!!editorTarget}
        block={editorTarget}
        students={students}
        assignedIds={editorTarget?.studentIds}
        capacity={capacity}
        onClose={() => setEditorTarget(null)}
        onSave={handleSaveAssignment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, paddingBottom: 50 },
  mainWrapper: { width: '100%', gap: spacing.lg },
  tabletWrapper: { maxWidth: 1200, alignSelf: 'center', width: '100%' },

  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 260,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 13, color: colors.mutedText, marginTop: 2 },

  blocksSection: { gap: spacing.md },
  blocksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  capacityNotice: { fontSize: 12, fontWeight: '600', color: colors.bodyText },

  emptyBlocks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBlocksTitle: { fontSize: 15, fontWeight: '700', color: colors.navyText },
  emptyBlocksSub: { fontSize: 13, color: colors.mutedText, textAlign: 'center', maxWidth: 300 },
});
