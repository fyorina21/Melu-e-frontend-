import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill from '../../components/StatusPill';
import StudentAvatar from '../../components/StudentAvatar';
import { registerStudentPhotos } from '../../utils/studentPhotoHelper';
import { getEnrollmentStudents } from '../../api/coordinatorApi';
import { getProgramOptions, getTherapyGroupOptions, getStatusOptions } from '../../api/optionsApi';
import {
  resolveStudentStatus,
  toggleStudentStatus,
  onStudentStatusChanged,
} from '../../utils/studentStatusHelper';
import {
  getEnrollmentDrafts,
  deleteEnrollmentDraft,
  onEnrollmentDraftsChanged,
} from '../../utils/enrollmentDraftHelper';
import { getStudentDemographic } from '../../utils/sensitiveDataSanitizer';
import { routeMapForRole, COORDINATOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { CoordinatorStackParamList } from '../../types';

export interface EnrolledStudent {
  id: string;
  name: string;
  age: number;
  gender: string;
  program: string;
  therapyGroup: string;
  therapist: string;
  diagnosis: string;
  status: 'Active' | 'Inactive' | 'Draft';
  studentId: string;
  photoUrl?: string | null;
  isDraft?: boolean;
}

interface EnrollmentStudentRow {
  id: string;
  studentId?: string;
  student_id?: string;
  fullName: string;
  age: number;
  programType: string;
  therapyGroup: string;
  therapist?: string;
  status: string;
  headshotUrl?: string | null;
  photoUrl?: string | null;
  photo?: string | null;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentEnrollment'>;

export default function StudentEnrollmentScreen({ navigation }: Props) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [therapyGroupFilter, setTherapyGroupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [programOptions, setProgramOptions] = useState<string[]>([]);
  const [therapyGroupOptions, setTherapyGroupOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  // Fetch dynamic Program, Therapy Group, and Status lists from backend API on component mount
  useEffect(() => {
    let isMounted = true;
    getProgramOptions()
      .then(({ data }) => {
        if (isMounted && Array.isArray(data)) {
          setProgramOptions(data);
        }
      })
      .catch(() => {});

    getTherapyGroupOptions()
      .then(({ data }) => {
        if (isMounted && Array.isArray(data)) {
          setTherapyGroupOptions(data);
        }
      })
      .catch(() => {});

    getStatusOptions()
      .then(({ data }) => {
        if (isMounted && Array.isArray(data)) {
          setStatusOptions(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const queryParams: Record<string, string> = {};
      if (search) queryParams.search = search;
      if (programFilter !== 'All') queryParams.program = programFilter;
      if (therapyGroupFilter !== 'All') queryParams.therapy_group = therapyGroupFilter;
      if (statusFilter !== 'All') queryParams.status = statusFilter;

      // 1. Load active enrollment drafts
      const drafts = getEnrollmentDrafts();
      const draftStudents: EnrolledStudent[] = drafts.map((d) => ({
        id: d.id,
        name: d.fullName || d.name || 'Untitled Draft',
        age: d.age || 0,
        gender: getStudentDemographic(d as any, ''),
        program: d.program || 'Regular Morning',
        therapyGroup: d.therapyGroup || 'Basic',
        therapist: d.therapist || 'Unassigned',
        diagnosis: d.diagnosis || 'Draft Enrollment',
        status: 'Draft',
        studentId: d.id,
        photoUrl: d.photoUrl || null,
        isDraft: true,
      }));

      // 2. Load backend and enrolled students
      const { data } = await getEnrollmentStudents(queryParams);
      if (Array.isArray(data)) {
        registerStudentPhotos(
          data.map((item) => ({
            id: item.id ? String(item.id) : undefined,
            name: item.fullName || item.name,
            photo: item.photo,
            photoUrl: item.photoUrl,
            headshotUrl: item.headshotUrl,
          })),
        );
      }
      const enrolledRows: EnrolledStudent[] = (data as EnrollmentStudentRow[]).map((row) => ({
        id: row.id,
        name: row.fullName,
        age: row.age,
        gender: '',
        program: row.programType,
        therapyGroup: row.therapyGroup || 'Basic',
        therapist: row.therapist || row.therapyGroup,
        diagnosis: '',
        status: resolveStudentStatus(row.id, row.fullName, row.status),
        studentId: row.studentId || row.student_id || row.id,
        photoUrl: row.photoUrl || row.headshotUrl || row.photo || null,
        isDraft: false,
      }));

      setStudents([...draftStudents, ...enrolledRows]);
    } catch (err) {
      const drafts = getEnrollmentDrafts();
      const draftStudents: EnrolledStudent[] = drafts.map((d) => ({
        id: d.id,
        name: d.fullName || d.name || 'Untitled Draft',
        age: d.age || 0,
        gender: getStudentDemographic(d as any, ''),
        program: d.program || 'Regular Morning',
        therapyGroup: d.therapyGroup || 'Basic',
        therapist: d.therapist || 'Unassigned',
        diagnosis: d.diagnosis || 'Draft Enrollment',
        status: 'Draft',
        studentId: d.id,
        photoUrl: d.photoUrl || null,
        isDraft: true,
      }));
      setStudents(draftStudents);
    }
  }, [search, programFilter, therapyGroupFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubStatus = onStudentStatusChanged(load);
    const unsubDrafts = onEnrollmentDraftsChanged(load);
    return () => {
      unsubStatus();
      unsubDrafts();
    };
  }, [load]);

  const filtered = students.filter(
    (s) =>
      (programFilter === 'All' ||
        s.program?.toLowerCase().includes(programFilter.toLowerCase()) ||
        programFilter.toLowerCase().includes(s.program?.toLowerCase())) &&
      (therapyGroupFilter === 'All' ||
        s.therapyGroup?.toLowerCase().includes(therapyGroupFilter.toLowerCase()) ||
        therapyGroupFilter.toLowerCase().includes(s.therapyGroup?.toLowerCase())) &&
      (statusFilter === 'All' || s.status?.toLowerCase() === statusFilter.toLowerCase()) &&
      (!search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase())),
  );

  const FilterChips = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={[typography.label, styles.filterLabel]}>{label}</Text>
      {['All', ...options].map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.filterChip, value === opt && styles.filterChipActive]}
          onPress={() => onChange(opt)}
        >
          <Text
            style={[
              typography.body,
              value === opt && { color: colors.navyText, fontWeight: '700' },
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const routeMap = routeMapForRole('coordinator');

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Student Register"
        onTabPress={(t) => {
          const route = routeMap[t] || COORDINATOR_ROUTE_BY_TAB[t];
          if (route && route !== 'StudentEnrollment') {
            navigation?.navigate?.(route as never);
          }
        }}
      />

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Student Register</Text>
          <Text style={typography.caption}>Register, search and filter enrolled students</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation?.navigate?.('StudentEnrollmentWizard' as never)}
        >
          <Feather name="plus" size={14} color={colors.navyText} />
          <Text style={styles.addBtnText}>Enroll Student</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or student ID..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />
        <FilterChips
          label="Program"
          options={programOptions}
          value={programFilter}
          onChange={setProgramFilter}
        />
        <FilterChips
          label="Therapy Group"
          options={therapyGroupOptions}
          value={therapyGroupFilter}
          onChange={setTherapyGroupFilter}
        />
        <FilterChips
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.caption}>{filtered.length} student(s) found</Text>
        {filtered.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.row, s.isDraft && styles.rowDraft]}
            onPress={() => {
              navigation?.navigate?.('StudentProfile', { studentId: s.id });
            }}
          >
            <StudentAvatar name={s.name} studentId={s.id} photoUrl={s.photoUrl} size={40} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={typography.bodyBold}>{s.name}</Text>
                {s.isDraft && (
                  <View style={styles.draftBadge}>
                    <Text style={styles.draftBadgeText}>Draft</Text>
                  </View>
                )}
              </View>
              <Text style={typography.caption}>
                {s.isDraft
                  ? 'In-progress Enrollment Draft'
                  : `${s.studentId} · Age ${s.age} · ${s.gender}`}
              </Text>
              <Text style={typography.caption}>
                {s.program} · {s.therapyGroup} · {s.status}
              </Text>
            </View>
            {s.isDraft ? (
              <View style={styles.draftActionGroup}>
                <TouchableOpacity
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    deleteEnrollmentDraft(s.id);
                    load();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Discard Draft"
                  style={styles.trashBtn}
                >
                  <Feather name="trash-2" size={16} color={colors.mutedText} />
                </TouchableOpacity>
                <StatusPill status="draft" label="Draft" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  toggleStudentStatus(s.id, s.name, s.status);
                }}
                activeOpacity={0.7}
              >
                <StatusPill
                  status={s.status === 'Active' ? 'approved' : 'revision'}
                  label={s.status}
                />
              </TouchableOpacity>
            )}
            <Feather name="chevron-right" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text
            style={[
              typography.body,
              { color: colors.mutedText, textAlign: 'center', padding: spacing.xl },
            ]}
          >
            No students match these filters.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return (
    {
      Dashboard: 'CoordinatorDashboard',
      'Live Sessions': 'LiveSessionMonitoring',
      Review: 'SessionSummaryReview',
      Progress: 'CoordinatorStudentProgress',
      Schedule: 'CoordinatorSchedule',
      Parents: 'CoordinatorParentCommunication',
      Enrollment: 'StudentEnrollment',
      Workload: 'WorkloadDashboard',
      Notifications: 'Notifications',
      Rooms: 'RoomResourceScheduling',
    } as Record<string, keyof CoordinatorStackParamList>
  )[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filtersRow: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
  },
  filterLabel: { marginRight: spacing.sm, paddingVertical: spacing.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.promptG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  rowDraft: {
    borderColor: '#F59E0B',
    borderLeftWidth: 4,
    backgroundColor: '#FFFDF5',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  draftBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  draftActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trashBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
});
