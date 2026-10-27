import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill from '../../components/StatusPill';
import StudentAvatar from '../../components/StudentAvatar';
import { registerStudentPhotos } from '../../utils/studentPhotoHelper';
import {
  getEnrollmentStudents,
  getStoredEnrolledStudents,
  deleteStudentEnrollment,
} from '../../api/coordinatorApi';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/dialogs';
import { getStaffOptions } from '../../api/optionsApi';
import { filterOutDeletedStaff, onDeletedStaffChanged } from '../../utils/deletedStaffHelper';
import {
  resolveStudentStatus,
  toggleStudentStatus,
  onStudentStatusChanged,
} from '../../utils/studentStatusHelper';
import { routeMapForRole, COORDINATOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { CoordinatorStackParamList } from '../../types';

const DEFAULT_PROGRAM_TYPES = ['Regular', 'Pulled Out'];
const AGE_RANGES = ['3-5', '6-8', '9-11', '12+'];

export interface EnrolledStudent {
  id: string;
  name: string;
  age: number;
  gender: string;
  program: string;
  therapist: string;
  diagnosis?: string;
  status: 'Active' | 'Inactive';
  studentId: string;
  photoUrl?: string | null;
}

interface EnrollmentStudentRow {
  id: string;
  fullName: string;
  name?: string;
  studentId?: string;
  age: number;
  programType?: string;
  program?: string;
  therapyGroup?: string;
  therapist?: string;
  status: string;
  headshotUrl?: string | null;
  photoUrl?: string | null;
  photo?: string | null;
  gender?: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
  allLabel?: string;
}

function FilterDropdown({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  allLabel = 'All',
}: FilterDropdownProps) {
  const isFiltered = value !== 'All';
  const displayValue = isFiltered ? value : allLabel;

  return (
    <View style={[styles.dropdownContainer, isOpen && styles.dropdownContainerOpen]}>
      <Text style={styles.filterLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          isOpen && styles.dropdownTriggerOpen,
          isFiltered && styles.dropdownTriggerActive,
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}`}
      >
        <Text
          style={[styles.dropdownValueText, isFiltered && styles.dropdownValueTextActive]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={isFiltered ? colors.navyText : colors.mutedText}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
          >
            <TouchableOpacity
              style={[styles.dropdownItem, value === 'All' && styles.dropdownItemSelected]}
              onPress={() => onSelect('All')}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  value === 'All' && styles.dropdownItemTextSelected,
                ]}
              >
                {allLabel}
              </Text>
              {value === 'All' && <Feather name="check" size={14} color={colors.navyText} />}
            </TouchableOpacity>
            {options.map((opt) => {
              const isSelected = value.toLowerCase().trim() === opt.toLowerCase().trim();
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                  onPress={() => onSelect(opt)}
                >
                  <Text
                    style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}
                  >
                    {opt}
                  </Text>
                  {isSelected && <Feather name="check" size={14} color={colors.navyText} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentEnrollment'>;

export default function StudentEnrollmentScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [students, setStudents] = useState<EnrolledStudent[]>([]);

  const handleDeleteStudent = (student: EnrolledStudent) => {
    confirmAction({
      title: 'Delete Student',
      message: `Are you sure you want to delete ${student.name}? This will remove the student from the roster list.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteStudentEnrollment(student.id, student.name);
          showToast(`${student.name} deleted successfully`, 'success');
          load();
        } catch {
          showToast('Failed to delete student', 'error');
        }
      },
    });
  };
  const [therapistOptions, setTherapistOptions] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('All');
  const [therapistFilter, setTherapistFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchTherapists = useCallback(() => {
    getStaffOptions()
      .then(({ data }) => {
        const clean = filterOutDeletedStaff(data);
        const therapists = clean.filter((s) => s.role === 'teacher').map((t) => t.name);
        setTherapistOptions(therapists);
      })
      .catch(() => setTherapistOptions([]));
  }, []);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  useEffect(() => {
    return onDeletedStaffChanged(fetchTherapists);
  }, [fetchTherapists]);

  const load = useCallback(async () => {
    try {
      const { data } = await getEnrollmentStudents({});
      if (Array.isArray(data)) {
        registerStudentPhotos(data);
      }
      const stored = getStoredEnrolledStudents();
      const existingIds = new Set(
        (Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
          .map((d: Record<string, unknown>) => String(d.id || d.studentId || '').toLowerCase())
          .filter(Boolean),
      );
      const existingNames = new Set(
        (Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
          .map((d: Record<string, unknown>) =>
            String(d.fullName || d.name || '')
              .toLowerCase()
              .trim(),
          )
          .filter(Boolean),
      );
      const missingStored = stored.filter((s: Record<string, unknown>) => {
        const sid = String(s.id || s.studentId || '').toLowerCase();
        const sname = String(s.fullName || s.name || '')
          .toLowerCase()
          .trim();
        return (!sid || !existingIds.has(sid)) && (!sname || !existingNames.has(sname));
      });
      const rawList = [
        ...missingStored,
        ...(Array.isArray(data) && data.length > 0 ? data : stored),
      ];
      setStudents(
        (rawList as unknown as EnrollmentStudentRow[]).map((row) => ({
          id: row.id,
          name: row.fullName || row.name || '',
          age: Number(row.age) || 6,
          gender: row.gender || '',
          program: row.programType || row.program || 'Regular',
          therapist: row.therapist || row.therapyGroup || '',
          status: resolveStudentStatus(row.id, row.fullName || row.name, row.status),
          studentId: row.studentId || row.id,
          photoUrl: row.photoUrl || row.headshotUrl || row.photo || null,
        })),
      );
    } catch {
      const stored = getStoredEnrolledStudents();
      setStudents(
        (stored as unknown as EnrollmentStudentRow[]).map((row) => ({
          id: row.id,
          name: row.fullName || row.name || '',
          age: Number(row.age) || 6,
          gender: row.gender || '',
          program: row.programType || row.program || 'Regular',
          therapist: row.therapist || row.therapyGroup || '',
          status: resolveStudentStatus(row.id, row.fullName || row.name, row.status),
          studentId: row.studentId || row.id,
          photoUrl: row.photoUrl || row.headshotUrl || row.photo || null,
        })),
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return onStudentStatusChanged(load);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      fetchTherapists();
    }, [load, fetchTherapists]),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleRefresh = () => {
      load();
    };
    window.addEventListener('melue_student_enrolled_updated', handleRefresh);
    window.addEventListener('melue_student_deleted', handleRefresh);
    window.addEventListener('melue_student_status_changed', handleRefresh);
    window.addEventListener('melue_therapist_assignment_updated', handleRefresh);
    return () => {
      window.removeEventListener('melue_student_enrolled_updated', handleRefresh);
      window.removeEventListener('melue_student_deleted', handleRefresh);
      window.removeEventListener('melue_student_status_changed', handleRefresh);
      window.removeEventListener('melue_therapist_assignment_updated', handleRefresh);
    };
  }, [load]);

  // Dynamic program options derived from real enrolled students data and system options
  const realProgramOptions = useMemo(() => {
    const fromStudents = students.map((s) => s.program).filter(Boolean);
    const map = new Map<string, string>();
    [...DEFAULT_PROGRAM_TYPES, ...fromStudents].forEach((p) => {
      const trimmed = p.trim();
      const key = trimmed.toLowerCase();
      if (!map.has(key)) {
        map.set(key, trimmed);
      }
    });
    return Array.from(map.values()).sort();
  }, [students]);

  // Dynamic therapist options derived from staff API and real enrolled students data
  const realTherapistOptions = useMemo(() => {
    const fromStudents = students.map((s) => s.therapist).filter(Boolean);
    const map = new Map<string, string>();
    [...therapistOptions, ...fromStudents].forEach((t) => {
      const trimmed = t.trim();
      const key = trimmed.toLowerCase();
      if (!map.has(key)) {
        map.set(key, trimmed);
      }
    });
    return Array.from(map.values()).sort();
  }, [students, therapistOptions]);

  const matchesAge = (age: number, range: string) => {
    if (range === 'All') return true;
    if (range === '12+') return age >= 12;
    const parts = range.split('-').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return age >= parts[0] && age <= parts[1];
    }
    return age === Number(range);
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchProgram =
        programFilter === 'All' ||
        s.program.toLowerCase().trim() === programFilter.toLowerCase().trim();
      const matchTherapist =
        therapistFilter === 'All' ||
        s.therapist.toLowerCase().trim() === therapistFilter.toLowerCase().trim();
      const matchStatus =
        statusFilter === 'All' || s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchAge = matchesAge(s.age, ageFilter);
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId.toLowerCase().includes(search.toLowerCase());

      return matchProgram && matchTherapist && matchStatus && matchAge && matchSearch;
    });
  }, [students, programFilter, therapistFilter, statusFilter, ageFilter, search]);

  const hasActiveFilters =
    programFilter !== 'All' ||
    therapistFilter !== 'All' ||
    statusFilter !== 'All' ||
    ageFilter !== 'All' ||
    search.trim() !== '';

  const clearAllFilters = () => {
    setProgramFilter('All');
    setTherapistFilter('All');
    setStatusFilter('All');
    setAgeFilter('All');
    setSearch('');
    setOpenDropdown(null);
  };

  const routeMap = routeMapForRole('coordinator');

  return (
    <SafeAreaView style={styles.safe}>
      {openDropdown && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpenDropdown(null)}
        />
      )}

      <AppNavbar
        activeTab="Student Register & Roster List"
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
          <Text style={typography.caption}>
            MR-16 — register, search and filter enrolled students
          </Text>
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

        <View style={styles.dropdownsRow}>
          <FilterDropdown
            label="Program"
            value={programFilter}
            options={realProgramOptions}
            isOpen={openDropdown === 'program'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'program' ? null : 'program'))}
            onSelect={(val) => {
              setProgramFilter(val);
              setOpenDropdown(null);
            }}
            allLabel="All Programs"
          />

          <FilterDropdown
            label="Therapist"
            value={therapistFilter}
            options={realTherapistOptions}
            isOpen={openDropdown === 'therapist'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'therapist' ? null : 'therapist'))}
            onSelect={(val) => {
              setTherapistFilter(val);
              setOpenDropdown(null);
            }}
            allLabel="All Therapists"
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={['Active', 'Inactive']}
            isOpen={openDropdown === 'status'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'status' ? null : 'status'))}
            onSelect={(val) => {
              setStatusFilter(val);
              setOpenDropdown(null);
            }}
            allLabel="All Statuses"
          />

          <FilterDropdown
            label="Age"
            value={ageFilter}
            options={AGE_RANGES}
            isOpen={openDropdown === 'age'}
            onToggle={() => setOpenDropdown((prev) => (prev === 'age' ? null : 'age'))}
            onSelect={(val) => {
              setAgeFilter(val);
              setOpenDropdown(null);
            }}
            allLabel="All Ages"
          />

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={clearAllFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Feather name="x" size={14} color={colors.navyText} />
              <Text style={styles.resetBtnText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.caption}>{filtered.length} student(s) found</Text>
        {filtered.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.row}
            onPress={() => navigation?.navigate?.('StudentProfile', { studentId: s.id })}
          >
            <StudentAvatar name={s.name} studentId={s.id} photoUrl={s.photoUrl} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{s.name}</Text>
              <Text style={typography.caption}>
                {s.studentId} · Age {s.age}
                {s.gender ? ` · ${s.gender}` : ''}
              </Text>
              <Text style={typography.caption}>
                {[s.program, s.therapist].filter(Boolean).join(' · ')}
              </Text>
            </View>
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
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                handleDeleteStudent(s);
              }}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${s.name}`}
            >
              <Feather name="trash-2" size={16} color="#DC2626" />
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  backdrop: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as unknown as 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
      : StyleSheet.absoluteFillObject),
    zIndex: 90,
    backgroundColor: 'transparent',
  },
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
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 100,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  dropdownContainer: {
    position: 'relative',
    minWidth: 140,
    flexGrow: 1,
    flexBasis: 140,
    maxWidth: 220,
    zIndex: 1,
  },
  dropdownContainerOpen: {
    zIndex: 1000,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.xs,
  },
  dropdownTriggerOpen: {
    borderColor: colors.navyText,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderColor: colors.primaryYellow,
    backgroundColor: '#FEF9C3',
  },
  dropdownValueText: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  dropdownValueTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    maxHeight: 220,
    zIndex: 1001,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#FEF9C3',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: colors.navyText,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-end',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navyText,
  },
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
  deleteBtn: {
    padding: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
});
