import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
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
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getProgramDirectorDashboard } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

/* ------------------------------------------------------------------ */
/*  Data shapes                                                       */
/* ------------------------------------------------------------------ */

interface DashboardStudent {
  id: string;
  fullName: string;
  programType: string;
  therapyGroup: string;
  therapist: string;
  assessmentStatus: 'not-started' | 'in-progress' | 'completed';
  sessionAssigned: boolean;
  currentStage: string;
  status: string;
}

interface WorkflowStage {
  key: string;
  name: string;
  count: number;
}

interface NotificationItem {
  id: string | number;
  text: string;
  urgent: boolean;
}

interface ClinicalOverviewData {
  activeStudents: number;
  assessmentsPending: number;
  sessionsAssigned: number;
  completedSessions: number;
  goalsInProgress: number;
}

interface DashboardData {
  notifications?: NotificationItem[];
  unreadCount?: number;
  totalStudents: number;
  inAssessment: number;
  assessmentCompleted: number;
  readyForSessions: number;
  workflowStages: WorkflowStage[];
  students: DashboardStudent[];
  clinicalOverview: ClinicalOverviewData;
  recentActivity: Array<{ text: string; type: string; time: string }>;
}

/* ------------------------------------------------------------------ */
/*  Colour maps                                                       */
/* ------------------------------------------------------------------ */

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  enrolled: { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151', dot: '#9CA3AF' },
  'not-started': { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151', dot: '#9CA3AF' },
  'in-assessment': { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', dot: '#F59E0B' },
  'assessment-complete': { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', dot: '#3B82F6' },
  'session-assigned': { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6', dot: '#8B5CF6' },
  'in-session': { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', dot: '#10B981' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  'Not Started': { bg: '#F3F4F6', text: '#6B7280' },
  'In Assessment': { bg: '#FEF3C7', text: '#B45309' },
  'In Progress': { bg: '#FEF3C7', text: '#B45309' },
  'Assessment Completed': { bg: '#DBEAFE', text: '#2563EB' },
  'Assessment Complete': { bg: '#DBEAFE', text: '#2563EB' },
  Complete: { bg: '#DBEAFE', text: '#2563EB' },
  Reviewed: { bg: '#D1FAE5', text: '#059669' },
  'Ready for IUP': { bg: '#DBEAFE', text: '#1E40AF' },
  'Session Assigned': { bg: '#EDE9FE', text: '#7C3AED' },
  'In Session': { bg: '#D1FAE5', text: '#059669' },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Students' },
  { key: 'enrolled', label: 'Not Started' },
  { key: 'in-assessment', label: 'In Assessment' },
  { key: 'assessment-complete', label: 'Assessment Complete' },
  { key: 'session-assigned', label: 'Session Assigned' },
  { key: 'in-session', label: 'In Session' },
];

/* ------------------------------------------------------------------ */
/*  Stage matching helper                                             */
/* ------------------------------------------------------------------ */

function matchesStage(student: DashboardStudent, filterKey: string): boolean {
  if (filterKey === 'all') return true;

  const currentStage = (student.currentStage || '').toLowerCase().trim();
  const status = (student.status || '').toLowerCase().trim();

  switch (filterKey) {
    case 'enrolled':
    case 'not-started':
      return (
        currentStage === 'enrolled' ||
        currentStage === 'not-started' ||
        status === 'not started' ||
        status === 'enrolled'
      );
    case 'in-assessment':
      return (
        currentStage === 'in-assessment' || status === 'in assessment' || status === 'in progress'
      );
    case 'assessment-complete':
      return (
        currentStage === 'assessment-complete' ||
        status === 'assessment completed' ||
        status === 'assessment complete' ||
        status === 'ready for iup' ||
        status === 'complete' ||
        status === 'reviewed'
      );
    case 'session-assigned':
      return currentStage === 'session-assigned' || status === 'session assigned';
    case 'in-session':
      return currentStage === 'in-session' || status === 'in session';
    default:
      return currentStage === filterKey;
  }
}

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'ProgramDirectorDashboard'>;

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

export default function ProgramDirectorDashboardScreen({ navigation }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showNotif, setShowNotif] = useState(false);

  // Guards against duplicate concurrent calls, stale responses, and unmounted state updates
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const lastFetchTimeRef = useRef(0);

  const load = useCallback(async (force = false) => {
    const now = Date.now();
    // Debounce duplicate calls within 400ms unless forced
    if (!force && now - lastFetchTimeRef.current < 400) {
      return;
    }
    lastFetchTimeRef.current = now;

    const currentReqId = ++requestIdRef.current;
    inFlightRef.current = true;

    try {
      const { data: res } = await getProgramDirectorDashboard();
      if (!isMountedRef.current || currentReqId !== requestIdRef.current) return;
      setData(res);
      setLoadError(false);
    } catch {
      if (!isMountedRef.current || currentReqId !== requestIdRef.current) return;
      setLoadError(true);
    } finally {
      if (currentReqId === requestIdRef.current) {
        inFlightRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdate = () => {
      load(true);
    };
    window.addEventListener('melue_student_enrolled_updated', handleUpdate);
    window.addEventListener('melue_assessment_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('melue_student_enrolled_updated', handleUpdate);
      window.removeEventListener('melue_assessment_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [load]);

  const goto = useCallback(
    (tabOrRoute: string) => {
      if (!navigation?.navigate) return;

      const mapped = PD_ROUTE_BY_TAB[tabOrRoute];
      if (mapped) {
        navigation.navigate(mapped as any);
        return;
      }
      navigation.navigate(tabOrRoute as any);
    },
    [navigation],
  );

  if (loadError) return <ScreenError onRetry={() => load(true)} />;
  if (!data) return <ScreenLoader />;

  /* ---- derived data ---- */

  const stages = data.workflowStages ?? [];
  const allStudents = data.students ?? [];

  const filteredStudents = allStudents.filter((s) => {
    if (!matchesStage(s, filter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.therapist.toLowerCase().includes(q) ||
        s.programType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const notifications = data.notifications ?? [];
  const urgentCount = notifications.filter((n) => n.urgent).length;
  const unreadCount = data.unreadCount ?? (urgentCount > 0 ? urgentCount : notifications.length);
  const badgeCount = unreadCount > 0 ? unreadCount : urgentCount;

  /* ---- render ---- */

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Dashboard" onTabPress={goto} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h1}>Program Director Dashboard</Text>
            <Text style={typography.caption}>
              Student workflow · Assessments · Sessions · Clinical oversight
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBell}
            onPress={() => setShowNotif((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${badgeCount} unread`}
            accessibilityHint="Toggles the notifications panel"
          >
            <Feather name="bell" size={20} color={colors.navyText} />
            {badgeCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showNotif && (
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderText}>
                Notifications {badgeCount > 0 ? `(${badgeCount})` : ''}
              </Text>
              <TouchableOpacity
                onPress={() => setShowNotif(false)}
                accessibilityRole="button"
                accessibilityLabel="Close notifications panel"
              >
                <Text style={styles.notifClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Text style={styles.emptyText}>No notifications at this time.</Text>
              </View>
            ) : (
              notifications.map((n) => (
                <View
                  key={n.id}
                  style={[styles.notifRow, n.urgent && styles.notifRowUrgent]}
                  accessibilityLabel={`${n.urgent ? 'Urgent notification: ' : 'Notification: '}${n.text}`}
                >
                  <View
                    style={[
                      styles.notifDot,
                      n.urgent ? styles.notifDotUrgent : styles.notifDotNormal,
                    ]}
                  />
                  <Text style={styles.notifText}>{n.text}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Stat Cards ────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {[
            {
              label: 'Total Students',
              value: data.totalStudents,
              icon: 'users' as const,
              bg: '#EFF6FF',
              ic: '#3B82F6',
              tab: 'Student Caseload Management',
            },
            {
              label: 'In Assessment',
              value: data.inAssessment,
              icon: 'clipboard' as const,
              bg: '#FEF3C7',
              ic: '#F59E0B',
              tab: 'Assessment Review',
            },
            {
              label: 'Assessment Completed',
              value: data.assessmentCompleted,
              icon: 'check-circle' as const,
              bg: '#D1FAE5',
              ic: '#10B981',
              tab: 'Assessment Review',
            },
            {
              label: 'Ready for Sessions',
              value: data.readyForSessions,
              icon: 'play-circle' as const,
              bg: '#EDE9FE',
              ic: '#8B5CF6',
              tab: 'IUP Library Management',
            },
          ].map((c) => (
            <TouchableOpacity
              key={c.label}
              style={styles.statCard}
              onPress={() => goto(c.tab)}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}: ${c.value}`}
              accessibilityHint={`Navigate to ${c.tab}`}
            >
              <View style={[styles.statIconBg, { backgroundColor: c.bg }]}>
                <Feather name={c.icon} size={18} color={c.ic} />
              </View>
              <Text style={styles.statValue}>{c.value}</Text>
              <Text style={styles.statLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Workflow Pipeline ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={[typography.h3, { marginBottom: spacing.md }]}>Student Workflow</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pipelineScroll}
          >
            {stages.map((stage, i) => {
              const c = STAGE_COLORS[stage.key] ?? STAGE_COLORS.enrolled;
              const displayName =
                stage.key === 'enrolled' ||
                stage.key === 'not-started' ||
                stage.name?.toLowerCase() === 'enrolled'
                  ? 'Not Started'
                  : stage.name;
              const isSelected = filter === stage.key;

              return (
                <View key={stage.key} style={styles.pipelineItem}>
                  <TouchableOpacity
                    style={[
                      styles.pipelineStage,
                      {
                        backgroundColor: c.bg,
                        borderColor: isSelected ? colors.primaryBlue : c.border,
                      },
                      isSelected && styles.pipelineStageSelected,
                    ]}
                    onPress={() => setFilter(filter === stage.key ? 'all' : stage.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${displayName} stage, ${stage.count} students`}
                    accessibilityState={{ selected: isSelected }}
                    accessibilityHint={`Filter student list by ${displayName}`}
                  >
                    <View style={[styles.pipelineDot, { backgroundColor: c.dot }]} />
                    <Text style={[styles.pipelineStageName, { color: c.text }]}>{displayName}</Text>
                    <Text style={[styles.pipelineStageCount, { color: c.text }]}>
                      {stage.count}
                    </Text>
                    <Text style={styles.pipelineStageSub}>
                      student{stage.count !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                  {i < stages.length - 1 && (
                    <View style={styles.pipelineArrow}>
                      <Feather name="chevron-right" size={20} color="#CBD5E1" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Filters + Search ──────────────────────────────────── */}
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChips}
            style={styles.filterChipsScroll}
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(opt.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${opt.label}`}
                  accessibilityState={{ selected: active }}
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
              onChangeText={setSearch}
              accessibilityLabel="Search students by name, therapist, or program"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* ── Student Progress Table ────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Student Progress</Text>
            <Text style={typography.caption}>
              {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tableResponsiveContainer}>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2.2 }]}>Student</Text>
                <Text style={[styles.th, { flex: 1.4 }]}>Therapist</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Assessment</Text>
                <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Session</Text>
                <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Status</Text>
              </View>

              {filteredStudents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather
                    name="users"
                    size={28}
                    color={colors.mutedText}
                    style={{ marginBottom: spacing.xs }}
                  />
                  <Text style={styles.emptyText}>No students match the current filters.</Text>
                  {(filter !== 'all' || search.trim() !== '') && (
                    <TouchableOpacity
                      onPress={() => {
                        setFilter('all');
                        setSearch('');
                      }}
                      style={styles.clearFilterBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Clear filters and search"
                    >
                      <Text style={styles.clearFilterText}>Reset Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                filteredStudents.map((s) => {
                  const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS['Not Started'];
                  return (
                    <View
                      key={s.id}
                      style={styles.tableRow}
                      accessibilityRole="none"
                      accessibilityLabel={`Student: ${s.fullName}, Therapist: ${s.therapist}, Status: ${s.status}`}
                    >
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
                          <Feather name="check-circle" size={15} color="#10B981" />
                        ) : s.assessmentStatus === 'in-progress' ? (
                          <Feather name="clock" size={15} color="#F59E0B" />
                        ) : (
                          <Feather name="minus" size={15} color="#D1D5DB" />
                        )}
                      </View>
                      <View style={[styles.cellIcon, { flex: 1 }]}>
                        {s.sessionAssigned ? (
                          <Feather name="check-circle" size={15} color="#8B5CF6" />
                        ) : (
                          <Feather name="minus" size={15} color="#D1D5DB" />
                        )}
                      </View>
                      <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
                        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.badgeText, { color: sc.text }]} numberOfLines={1}>
                            {s.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>

        {/* ── Actions + Clinical Overview ───────────────────────── */}
        <View style={styles.bottomRow}>
          {/* Actions */}
          <View style={[styles.card, styles.bottomCard]}>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>Actions</Text>
            {[
              { label: 'Review Assessments', icon: 'clipboard' as const, tab: 'Assessment Review' },
              { label: 'Review IUPs', icon: 'file-text' as const, tab: 'IUP Library Management' },
              {
                label: 'View Students',
                icon: 'users' as const,
                tab: 'Student Caseload Management',
              },
              { label: 'View Reports', icon: 'bar-chart-2' as const, tab: 'Reports' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionBtn}
                onPress={() => goto(a.tab)}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                accessibilityHint={`Navigate to ${a.tab}`}
              >
                <Feather name={a.icon} size={14} color={colors.primaryBlue} />
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Feather name="chevron-right" size={14} color={colors.mutedText} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Clinical Overview */}
          <View style={[styles.card, styles.bottomCard]}>
            <View style={styles.sectionIconHeader}>
              <Feather name="activity" size={16} color={colors.purple} />
              <Text style={[typography.h3, { marginLeft: spacing.xs }]}>Clinical Overview</Text>
            </View>
            {[
              {
                label: 'Active Students',
                value: data.clinicalOverview?.activeStudents ?? 0,
                icon: 'users' as const,
              },
              {
                label: 'Assessments Pending',
                value: data.clinicalOverview?.assessmentsPending ?? 0,
                icon: 'clipboard' as const,
              },
              {
                label: 'Sessions Assigned',
                value: data.clinicalOverview?.sessionsAssigned ?? 0,
                icon: 'calendar' as const,
              },
              {
                label: 'Completed Sessions',
                value: data.clinicalOverview?.completedSessions ?? 0,
                icon: 'check-circle' as const,
              },
              {
                label: 'Goals in Progress',
                value: data.clinicalOverview?.goalsInProgress ?? 0,
                icon: 'target' as const,
              },
            ].map((m) => (
              <View
                key={m.label}
                style={styles.clinicalRow}
                accessibilityLabel={`${m.label}: ${m.value}`}
              >
                <View style={styles.clinicalLeft}>
                  <Feather name={m.icon} size={12} color={colors.mutedText} />
                  <Text style={styles.clinicalLabel}>{m.label}</Text>
                </View>
                <Text style={styles.clinicalValue}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Recent Activity ───────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={typography.h3}>Recent Activity</Text>
            <Text style={typography.caption}>
              {data.recentActivity?.length ?? 0} event
              {(data.recentActivity?.length ?? 0) !== 1 ? 's' : ''}
            </Text>
          </View>

          {!data.recentActivity || data.recentActivity.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather
                name="clock"
                size={24}
                color={colors.mutedText}
                style={{ marginBottom: spacing.xs }}
              />
              <Text style={styles.emptyText}>No recent activity recorded.</Text>
            </View>
          ) : (
            data.recentActivity.map((a, i) => {
              const iconColor =
                a.type === 'session' ? '#10B981' : a.type === 'incident' ? '#EF4444' : '#F59E0B';
              const iconName =
                a.type === 'session'
                  ? 'check-circle'
                  : a.type === 'incident'
                    ? 'alert-circle'
                    : 'clipboard';
              return (
                <View
                  key={i}
                  style={styles.activityRow}
                  accessibilityLabel={`Activity: ${a.text}, Time: ${a.time}`}
                >
                  <View style={[styles.activityIcon, { backgroundColor: iconColor + '18' }]}>
                    <Feather name={iconName as any} size={12} color={iconColor} />
                  </View>
                  <Text style={styles.activityText} numberOfLines={1}>
                    {a.text}
                  </Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

  /* Header */
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifBell: { position: 'relative', padding: spacing.sm },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },

  /* Notifications */
  notifPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifHeaderText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  notifClose: { fontSize: 12, color: colors.mutedText },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  notifRowUrgent: { backgroundColor: '#FEF2F2' },
  notifDot: { width: 6, height: 6, borderRadius: 3 },
  notifDotUrgent: { backgroundColor: '#EF4444' },
  notifDotNormal: { backgroundColor: '#D1D5DB' },
  notifText: { fontSize: 12, color: colors.bodyText, flex: 1 },
  notifEmpty: { padding: spacing.lg, alignItems: 'center' },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 140,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.navyText },
  statLabel: { fontSize: 12, color: colors.mutedText, marginTop: 2 },

  /* Card */
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },

  /* Pipeline */
  pipelineScroll: { paddingVertical: spacing.xs, alignItems: 'center' },
  pipelineItem: { flexDirection: 'row', alignItems: 'center' },
  pipelineStage: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 96,
    borderWidth: 1,
  },
  pipelineStageSelected: {
    borderWidth: 2,
    ...makeShadow(2, 6, 0.08, '0, 0, 0', 2),
  },
  pipelineDot: { width: 8, height: 8, borderRadius: 4, marginBottom: spacing.xs },
  pipelineStageName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  pipelineStageCount: { fontSize: 22, fontWeight: '700', marginTop: 2 },
  pipelineStageSub: { fontSize: 10, color: colors.mutedText, marginTop: 1 },
  pipelineArrow: { paddingHorizontal: spacing.xs },

  /* Filters */
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  filterChipsScroll: { flexGrow: 0 },
  filterChips: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  chipActive: { backgroundColor: colors.navyText, borderColor: colors.navyText },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.bodyText },
  chipTextActive: { color: '#FFF' },
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
    flexGrow: 1,
  },
  searchInput: { fontSize: 12, color: colors.navyText, flex: 1, padding: 0 },

  /* Table */
  tableResponsiveContainer: { minWidth: 540, width: '100%' },
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
  cell: { fontSize: 12, color: colors.bodyText },
  cellIcon: { alignItems: 'center', justifyContent: 'center' },
  cellName: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  cellSub: { fontSize: 11, color: colors.mutedText, marginTop: 1 },
  badge: {
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.pill,
  },
  clearFilterText: { fontSize: 12, fontWeight: '600', color: colors.primaryBlue },

  /* Bottom row (Actions + Clinical) */
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  bottomCard: { flex: 1, minWidth: 280 },

  /* Actions */
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  actionLabel: { fontSize: 13, fontWeight: '500', color: colors.primaryBlue, flex: 1 },

  /* Clinical */
  sectionIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clinicalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  clinicalLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clinicalLabel: { fontSize: 12, color: colors.bodyText },
  clinicalValue: { fontSize: 14, fontWeight: '700', color: colors.navyText },

  /* Activity */
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  activityIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: { fontSize: 12, color: colors.bodyText, flex: 1 },
  activityTime: { fontSize: 11, color: colors.mutedText },
});
