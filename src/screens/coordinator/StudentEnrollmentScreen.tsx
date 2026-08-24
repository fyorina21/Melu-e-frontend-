import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill from '../../components/StatusPill';
import { getEnrollmentStudents } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

const PROGRAMS = ['ABA', 'Speech Therapy', 'Occupational Therapy'];
const THERAPISTS = ['Teacher A', 'Teacher B', 'Teacher C'];
const DIAGNOSES = ['Autism Spectrum', 'Speech Delay', 'Motor Delay', 'Global Delay'];
const AGE_RANGES = ['3-5', '6-8', '9-11', '12+'];

export interface EnrolledStudent {
  id: string;
  name: string;
  age: number;
  gender: string;
  program: string;
  therapist: string;
  diagnosis: string;
  status: 'Active' | 'Inactive';
  studentId: string;
}

interface EnrollmentStudentRow {
  id: string;
  fullName: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentEnrollment'>;

export default function StudentEnrollmentScreen({ navigation }: Props) {
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [therapistFilter, setTherapistFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [diagnosisFilter, setDiagnosisFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');

  const load = useCallback(async () => {
    try {
      const { data } = await getEnrollmentStudents({
        search,
        program: programFilter,
        therapist: therapistFilter,
        status: statusFilter,
        diagnosis: diagnosisFilter,
        age: ageFilter,
      });
      setStudents((data as EnrollmentStudentRow[]).map((row) => ({
        id: row.id,
        name: row.fullName,
        age: row.age,
        gender: '',
        program: row.programType,
        therapist: row.therapyGroup,
        diagnosis: '',
        status: row.status === 'active' ? 'Active' : 'Inactive',
        studentId: row.id,
      })));
    } catch (err) {
      setStudents([]);
    }
  }, [search, programFilter, therapistFilter, statusFilter, diagnosisFilter, ageFilter]);

  useEffect(() => { load(); }, [load]);

  const matchesAge = (age: number, range: string) => {
    if (range === 'All') return true;
    const [min, max] = range.split('-').map(Number);
    if (range === '12+') return age >= 12;
    return age >= min && age <= max;
  };

  const filtered = students.filter(
    (s) =>
      (programFilter === 'All' || s.program === programFilter) &&
      (therapistFilter === 'All' || s.therapist === therapistFilter) &&
      (statusFilter === 'All' || s.status === statusFilter) &&
      (diagnosisFilter === 'All' || s.diagnosis === diagnosisFilter) &&
      matchesAge(s.age, ageFilter) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase()))
  );

  const FilterChips = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={[typography.label, styles.filterLabel]}>{label}</Text>
      {['All', ...options].map((opt) => (
        <TouchableOpacity key={opt} style={[styles.filterChip, value === opt && styles.filterChipActive]} onPress={() => onChange(opt)}>
          <Text style={[typography.body, value === opt && { color: colors.navyText, fontWeight: '700' }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Enrollment" onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>Student Register</Text>
          <Text style={typography.caption}>MR-16 — register, search and filter enrolled students</Text>
        </View>
      </View>

      <View style={styles.filtersRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or student ID..."
          placeholderTextColor={colors.mutedText}
          value={search}
          onChangeText={setSearch}
        />
        <FilterChips label="Program" options={PROGRAMS} value={programFilter} onChange={setProgramFilter} />
        <FilterChips label="Therapist" options={THERAPISTS} value={therapistFilter} onChange={setTherapistFilter} />
        <FilterChips label="Status" options={['Active', 'Inactive']} value={statusFilter} onChange={setStatusFilter} />
        <FilterChips label="Age" options={AGE_RANGES} value={ageFilter} onChange={setAgeFilter} />
        <FilterChips label="Diagnosis" options={DIAGNOSES} value={diagnosisFilter} onChange={setDiagnosisFilter} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.caption}>{filtered.length} student(s) found</Text>
        {filtered.map((s) => (
          <TouchableOpacity key={s.id} style={styles.row} onPress={() => navigation?.navigate?.('StudentProfile', { studentId: s.id })}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{s.name.charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.name}</Text>
              <Text style={typography.caption}>{s.studentId} · Age {s.age} · {s.gender}</Text>
              <Text style={typography.caption}>{s.program} · {s.therapist} · {s.diagnosis}</Text>
            </View>
            <StatusPill status={s.status === 'Active' ? 'approved' : 'revision'} label={s.status} />
            <Feather name="chevron-right" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text style={[typography.body, { color: colors.mutedText, textAlign: 'center', padding: spacing.xl }]}>No students match these filters.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
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
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap', gap: spacing.sm },
  addBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  filtersRow: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.bgApp },
  filterLabel: { marginRight: spacing.sm, paddingVertical: spacing.sm },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs, backgroundColor: colors.bgApp },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
