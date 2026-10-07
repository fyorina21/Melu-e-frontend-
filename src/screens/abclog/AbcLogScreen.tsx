import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ScreenLoader from '../../components/ScreenLoader';
import AppNavbar from '../../components/AppNavbar';
import { colors, spacing } from '../../theme/colors';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAbcLog, exportAbcLog, deleteAbcIncident } from '../../api/teacherExtrasApi';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import { openPrintWindow } from '../../utils/webExport';
import { useAuth, ROLES } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { SessionStackParamList } from '../../types';

import {
  type AbcIncident,
  type AbcStats,
  PAGE_SIZE,
  TABLE_COLUMNS,
  getDefaultDateRange,
} from './types';
import { AbcLogHeader } from './components/AbcLogHeader';
import { AbcLogFilterBar } from './components/AbcLogFilterBar';
import { AbcLogStatsGrid } from './components/AbcLogStatsGrid';
import { AbcLogTable } from './components/AbcLogTable';
import { AbcIncidentDetailModal } from './components/AbcIncidentDetailModal';

type Props = NativeStackScreenProps<SessionStackParamList, 'AbcLog'>;

export default function AbcLogScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const defaultRange = useMemo(getDefaultDateRange, []);

  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [behaviorFilter, setBehaviorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [behaviorMenuOpen, setBehaviorMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [behaviorOptions, setBehaviorOptions] = useState<string[]>(['All']);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(['All']);
  const [incidents, setIncidents] = useState<AbcIncident[]>([]);
  const [stats, setStats] = useState<AbcStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<AbcIncident | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const isSysadmin = session?.role === ROLES.SYSTEM_ADMIN;
  const currentStudent = studentOptions.find((s) => s.id === studentId);

  useEffect(() => {
    let active = true;
    getStudentOptions()
      .then(({ data: opts }) => {
        if (!active) return;
        const list = Array.isArray(opts) ? opts : [];
        const activeStudents = list.filter(
          (s: StudentOption) => !s.phase || s.phase.toLowerCase() === 'active',
        );
        const finalList = activeStudents.length > 0 ? activeStudents : list;
        setStudentOptions(finalList);
        if (finalList.length > 0) {
          setStudentId((prev) => prev || finalList[0].id);
        }
      })
      .catch(() => {
        if (active) {
          setStudentOptions([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await getAbcLog({
        studentId,
        from,
        to,
        behavior: behaviorFilter,
        category: categoryFilter,
      });
      const rows: AbcIncident[] = res?.incidents ?? res?.rows ?? [];
      setIncidents(rows);
      setStats(res?.stats ?? null);
    } catch {
      setIncidents([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [studentId, from, to, behaviorFilter, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Load full option lists once so filters don't shrink as they are applied.
  useEffect(() => {
    if (!studentId) return;
    getAbcLog({ studentId })
      .then(({ data: res }) => {
        const rows: AbcIncident[] = res?.incidents ?? res?.rows ?? [];
        setBehaviorOptions([
          'All',
          ...Array.from(new Set(rows.map((r) => r.behavior).filter(Boolean) as string[])).sort(),
        ]);
        setCategoryOptions([
          'All',
          ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort(),
        ]);
      })
      .catch(() => {});
  }, [studentId]);

  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    return incidents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [incidents, safePage]);

  const handleDeleteIncident = useCallback(async () => {
    if (!selectedIncident) return;
    try {
      await deleteAbcIncident(selectedIncident.id);
      showToast('Incident deleted');
    } catch {
      showToast('Failed to delete incident', 'error');
    }
    setSelectedIncident(null);
    setDeleteConfirm(false);
    load();
  }, [selectedIncident, showToast, load]);

  const handleExport = useCallback(
    async (type: 'csv' | 'pdf') => {
      setExportMenuOpen(false);
      try {
        await exportAbcLog({ studentId, from, to });
      } catch {
        // Continue with client-side export
      }
      const header = TABLE_COLUMNS.map((c) => c.label).join(',');
      const lines = incidents.map((r) =>
        TABLE_COLUMNS.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','),
      );
      const content = [
        `Melu'e Foundation — ABC Data Sheet`,
        `Student: ${currentStudent?.name ?? ''}`,
        `Range: ${from} to ${to}`,
        `Filters: Behavior ${behaviorFilter} · Category ${categoryFilter}`,
        '',
        `TOTAL INCIDENTS: ${stats?.totalIncidents ?? 0}`,
        `MOST COMMON BEHAVIOR: ${stats?.mostCommonBehavior ?? 'N/A'}`,
        `MOST COMMON ANTECEDENT: ${stats?.mostCommonAntecedent ?? 'N/A'}`,
        `THIS WEEK: ${stats?.thisWeek ?? 0}`,
        '',
        header,
        ...lines,
      ].join('\n');

      const title = type === 'pdf' ? 'ABC Data Sheet Export (PDF)' : 'ABC Data Sheet Export (CSV)';
      const formattedHtml = `
        <html>
          <head><title>${title}</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #1e293b; }
          </style></head>
          <body>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
        </html>
      `;
      openPrintWindow(formattedHtml, title);
      showToast(`${type.toUpperCase()} export opened`);
    },
    [
      studentId,
      from,
      to,
      incidents,
      currentStudent,
      behaviorFilter,
      categoryFilter,
      stats,
      showToast,
    ],
  );

  if (loading && incidents.length === 0 && !stats) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="ABC Log" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveContainer}>
          {/* Header card with student picker */}
          <AbcLogHeader
            currentStudent={currentStudent}
            studentOptions={studentOptions}
            studentId={studentId}
            studentMenuOpen={studentMenuOpen}
            onToggleStudentMenu={() => setStudentMenuOpen((prev) => !prev)}
            onSelectStudent={(id) => {
              setStudentId(id);
              setPage(1);
              setStudentMenuOpen(false);
            }}
          />

          {/* Filter bar */}
          <AbcLogFilterBar
            from={from}
            to={to}
            behaviorFilter={behaviorFilter}
            categoryFilter={categoryFilter}
            behaviorOptions={behaviorOptions}
            categoryOptions={categoryOptions}
            behaviorMenuOpen={behaviorMenuOpen}
            categoryMenuOpen={categoryMenuOpen}
            exportMenuOpen={exportMenuOpen}
            onFromChange={(v) => {
              setFrom(v);
              setPage(1);
            }}
            onToChange={(v) => {
              setTo(v);
              setPage(1);
            }}
            onToggleBehaviorMenu={() => {
              setBehaviorMenuOpen((prev) => !prev);
              setCategoryMenuOpen(false);
            }}
            onToggleCategoryMenu={() => {
              setCategoryMenuOpen((prev) => !prev);
              setBehaviorMenuOpen(false);
            }}
            onToggleExportMenu={() => setExportMenuOpen((prev) => !prev)}
            onSelectBehavior={(b) => {
              setBehaviorFilter(b);
              setPage(1);
              setBehaviorMenuOpen(false);
            }}
            onSelectCategory={(c) => {
              setCategoryFilter(c);
              setPage(1);
              setCategoryMenuOpen(false);
            }}
            onExport={handleExport}
          />

          {/* Stats Cards Grid */}
          <AbcLogStatsGrid stats={stats} />

          {/* Incidents Table */}
          <AbcLogTable
            incidents={incidents}
            paginated={paginated}
            safePage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setDeleteConfirm(false);
            }}
          />
        </View>
      </ScrollView>

      {/* Incident Detail Modal */}
      <AbcIncidentDetailModal
        incident={selectedIncident}
        isSysadmin={isSysadmin}
        deleteConfirm={deleteConfirm}
        onSetDeleteConfirm={setDeleteConfirm}
        onDeleteIncident={handleDeleteIncident}
        onClose={() => {
          setSelectedIncident(null);
          setDeleteConfirm(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1200,
    gap: spacing.md,
  },
});
