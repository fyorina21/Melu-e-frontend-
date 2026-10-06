import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { openPrintWindow } from '../../utils/webExport';
import { storage } from '../../utils/storage';
import { colors, radius, spacing, shadows } from '../../theme';
import { typography } from '../../theme/typography';
import { Button, Tabs } from '../../shared/components';
import {
  getSkillsAssessment,
  saveSkillsAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import {
  DEFAULT_ABLLS_DOMAINS,
  buildAbllsDomainsFromConfig,
  saveStorageAssessment,
  loadStorageAssessment,
  SCORE_LABEL,
  type AbllsDomainDef,
  type Score,
} from './abllsConfigHelper';
import type { SessionStackParamList } from '../../types';
import {
  type ViewMode,
  type SelectedItemState,
  type AbllsSummaryDomain,
  getMaxCellsForItem,
  getFilledCells,
} from './types';
import {
  AbllsGridSheet,
  AbllsDomainCards,
  AbllsPrioritySummary,
  AbllsItemInspectorModal,
} from './components';

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;

const VIEW_TABS: { id: ViewMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'grid', label: 'Skill Tracking Grid', icon: 'grid' },
  { id: 'cards', label: 'Domain Cards', icon: 'layers' },
  { id: 'summary', label: 'Priority Needs & Summary', icon: 'bar-chart-2' },
];

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid = storage.getSync('last_assessment_student_id');
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  useEffect(() => {
    if (studentId) {
      storage.setSync('last_assessment_student_id', studentId);
    }
  }, [studentId]);

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [domains, setDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [savedCustomFields, setSavedCustomFields] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<SelectedItemState | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch {
      setProfile(null);
    }
    try {
      const { data: cfg } = await getFormConfig('ABLLS Assessment Form');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        setDomains(buildAbllsDomainsFromConfig(cfg.fields));
      }
    } catch {
      setDomains(DEFAULT_ABLLS_DOMAINS);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      const savedData = (saved?.data ?? saved ?? {}) as {
        scores?: Record<string, Score>;
        notes?: Record<string, string>;
        customFields?: Record<string, any>;
      };
      const apiScores = savedData.scores ?? (saved as any)?.scores ?? {};
      const localData = loadStorageAssessment(studentId);
      const mergedScores: Record<string, Score> = { ...apiScores, ...(localData?.scores ?? {}) };
      const mergedNotes = { ...(savedData.notes ?? {}), ...(localData?.notes ?? {}) };
      const mergedCustomFields = {
        ...(savedData.customFields ?? {}),
        ...(localData?.customFields ?? {}),
      };
      setScores(mergedScores);
      if (Object.keys(mergedNotes).length > 0) setSavedNotes(mergedNotes);
      if (Object.keys(mergedCustomFields).length > 0) setSavedCustomFields(mergedCustomFields);
    } catch {
      const localData = loadStorageAssessment(studentId);
      if (localData?.scores) setScores(localData.scores);
      else setScores({});
    }
    setLoading(false);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUpdateItemScore = async (itemId: string, newScore: Score) => {
    const updatedScores: Record<string, Score> = { ...scores, [itemId]: newScore };
    setScores(updatedScores);
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem((prev) => (prev ? { ...prev, score: newScore } : null));
    }
    saveStorageAssessment(studentId, {
      scores: updatedScores,
      notes: savedNotes,
      customFields: savedCustomFields,
    });
    try {
      await saveSkillsAssessment(studentId, {
        scores: updatedScores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      showToast(`${itemId} score updated to ${SCORE_LABEL[newScore]}`, 'success');
    } catch {
      showToast('Failed to save updated score', 'error');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      saveStorageAssessment(studentId, {
        scores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      await saveSkillsAssessment(studentId, {
        scores,
        notes: savedNotes,
        customFields: savedCustomFields,
      });
      showToast('ABLLS assessment map saved successfully.', 'success');
      navigation?.navigate?.('AssessmentSummaryReport' as never);
    } catch {
      showToast('Failed to save assessment', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ScreenLoader />;

  const studentName = profile?.fullName || 'Student A';

  const summaryData: AbllsSummaryDomain[] = domains.map((d) => {
    const items = d.items.map((it) => ({
      id: it.id,
      description: it.description,
      options: it.options,
      maxCells: it.maxCells,
      score: scores[it.id] ?? ('NA' as Score),
    }));
    const c0 = items.filter((i) => i.score === 0).length;
    const c1 = items.filter((i) => i.score === 1).length;
    const c2 = items.filter((i) => i.score === 2).length;
    const cNA = items.filter((i) => i.score === 'NA').length;
    const validTotal = items.length - cNA;
    const masteredPct = validTotal > 0 ? Math.round((c2 / validTotal) * 100) : 0;

    return {
      code: d.code,
      name: d.name,
      c0,
      c1,
      c2,
      cNA,
      masteredPct,
      items,
    };
  });

  const priorityAreas = [...summaryData]
    .sort((a, b) => b.c0 - a.c0 || b.c1 - a.c1)
    .slice(0, 3)
    .map((d, idx) => ({ rank: idx + 1, name: d.name, c0: d.c0, c1: d.c1 }));

  const priorityNames = new Set(priorityAreas.map((p) => p.name));
  const rows = summaryData.map((d) => ({ ...d, isPriority: priorityNames.has(d.name) }));

  const handleExport = () => {
    const title = 'ABLLS-R Skill Tracking System & Color Need Map';
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const towersHtml = summaryData
      .map((domain) => {
        const reversedItems = [...domain.items].reverse();
        const rowsHtml = reversedItems
          .map((item) => {
            const maxCells = getMaxCellsForItem(item);
            const filledCount = getFilledCells(item);
            const scoreNum =
              typeof item.score === 'number' ? item.score : parseInt(String(item.score), 10);
            const cellColor = item.score === 0 ? '#EF4444' : scoreNum >= 2 ? '#16A34A' : '#EAB308';
            const cellsHtml = Array.from({ length: maxCells }, (_, cIdx) => {
              const isFilled = cIdx < filledCount;
              const bg = isFilled ? cellColor : item.score === 'NA' ? '#E2E8F0' : '#FFFFFF';
              return `<span class="cell" style="background-color: ${bg}; border: 1.5px solid #475569;"></span>`;
            }).join('');
            return `
              <div class="tower-row">
                <span class="item-label">${item.id}</span>
                <span class="cells-wrapper">${cellsHtml}</span>
              </div>
            `;
          })
          .join('');

        return `
          <div class="tower-col">
            <div class="tower-body">${rowsHtml}</div>
            <div class="tower-footer">
              <div class="domain-code">${domain.code}</div>
              <div class="domain-title">${domain.name}</div>
              <div class="domain-pct">${domain.masteredPct}%</div>
            </div>
          </div>
        `;
      })
      .join('');

    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: landscape; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; }
            .sheet-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
            .sheet-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
            .sheet-sub { font-size: 12px; color: #475569; margin-top: 2px; }
            .legend-box { border: 1px solid #0f172a; padding: 8px 12px; font-size: 11px; display: inline-flex; flex-direction: column; gap: 4px; background: #f8fafc; }
            .legend-row { display: flex; align-items: center; gap: 8px; }
            .sample-box { width: 14px; height: 14px; border: 1px solid #0f172a; display: inline-block; }
            .grid-container { display: flex; gap: 16px; overflow-x: auto; align-items: flex-end; padding: 20px; border: 1.5px solid #cbd5e1; background: #f8fafc; }
            .tower-col { display: flex; flex-direction: column; align-items: center; min-width: 140px; }
            .tower-body { display: flex; flex-direction: column; gap: 4px; border: 1.5px solid #0f172a; padding: 6px; background: #fff; width: 100%; box-sizing: border-box; }
            .tower-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
            .item-label { font-size: 11px; font-weight: 800; color: #0f172a; width: 30px; }
            .cells-wrapper { display: flex; gap: 2px; flex: 1; margin-left: 4px; }
            .cell { flex: 1; height: 14px; display: inline-block; box-sizing: border-box; }
            .tower-footer { text-align: center; margin-top: 8px; font-size: 11px; font-weight: 700; width: 100%; word-break: break-word; }
            .domain-code { font-size: 15px; font-weight: 900; }
            .domain-title { font-size: 11px; color: #334155; line-height: 1.2; margin: 3px 0; }
            .domain-pct { font-size: 11px; color: #16a34a; font-weight: 800; }
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            .summary-table th, .summary-table td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
            .summary-table th { background: #f1f5f9; font-weight: 700; }
            .priority-tag { background: #fee2e2; color: #b91c1c; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 9px; }
          </style>
        </head>
        <body>
          <div class="sheet-header">
            <div>
              <div class="sheet-title">Assessment of Basic Language and Learning Skills-Revised (ABLLS-R)</div>
              <div class="sheet-sub">Skill Tracking System &middot; Color Need Analysis Map</div>
              <div style="font-size: 12px; margin-top: 8px;">
                <strong>Student:</strong> ${studentName} &nbsp;|&nbsp; <strong>Age:</strong> ${profile?.age ?? '—'} &nbsp;|&nbsp; <strong>Date:</strong> ${dateStr}
              </div>
            </div>
            <div class="legend-box">
              <div class="legend-row">
                <span class="sample-box" style="background: #16A34A;"></span>
                <span>Level 2 — Mastered (All 4 Cells Filled)</span>
              </div>
              <div class="legend-row">
                <span class="sample-box" style="background: #EAB308;"></span>
                <span>Level 1 — Emerging (2 Cells Filled)</span>
              </div>
              <div class="legend-row">
                <span class="sample-box" style="background: #FFFFFF;"></span>
                <span>Level 0 — Not Demonstrated (0 Cells Filled)</span>
              </div>
            </div>
          </div>
          <div class="grid-container">${towersHtml}</div>
          <table class="summary-table">
            <thead>
              <tr>
                <th>Domain Area</th>
                <th>Score 0 (Not Demonstrated)</th>
                <th>Score 1 (Emerging)</th>
                <th>Score 2 (Mastered)</th>
                <th>% Mastered</th>
                <th>Priority Needs Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (d) => `
                <tr>
                  <td><strong>${d.code}. ${d.name}</strong></td>
                  <td>${d.c0} skills</td>
                  <td>${d.c1} skills</td>
                  <td>${d.c2} skills</td>
                  <td><strong>${d.masteredPct}%</strong></td>
                  <td>${d.isPriority ? '<span class="priority-tag">HIGH PRIORITY</span>' : 'Normal'}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      {/* Top Header Card */}
      <View style={styles.headerContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color={colors.navyText} />
            <Text style={styles.backBtnText}>Back to Skills Assessment</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Button
            label={saving ? 'Saving...' : 'Save Assessment'}
            variant="primary"
            size="sm"
            loading={saving}
            disabled={saving}
            onPress={handleSaveAll}
            style={{ marginRight: spacing.sm }}
          />
          <Button
            label="Print / Export Sheet"
            variant="outline"
            size="sm"
            onPress={handleExport}
            icon={<Feather name="printer" size={14} />}
          />
        </View>

        {/* Student & Tracking Information Sheet Header */}
        <View style={styles.sheetHeaderCard}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={typography.h1}>
              Assessment of Basic Language and Learning Skills-Revised (ABLLS-R)
            </Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>
              Skill Tracking System &middot; Color Need Analysis Grid
            </Text>

            <View style={styles.studentMetaRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {studentName
                    .split(' ')
                    .map((p) => p.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.studentNameText}>{studentName}</Text>
                <Text style={styles.studentDetailsText}>
                  Student ID: {studentId} &middot; Age {profile?.age ?? '—'} &middot; Assessment:
                  Current
                </Text>
              </View>
            </View>
          </View>

          {/* Color Code Legend Table */}
          <View style={styles.legendBox}>
            <Text style={styles.legendHeader}>COLOR CODE / MASTERY KEY</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.success }]} />
                <View style={[styles.miniCell, { backgroundColor: colors.success }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 2 &middot; (2 Cells)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.warning }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 1 &middot; (1 Cell)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.error }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 0 &middot; (1 Red Cell)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
              </View>
              <Text style={styles.legendLabel}>N/A &middot; Not Assessed</Text>
            </View>
          </View>
        </View>

        {/* View Mode Switcher Tabs */}
        <View style={styles.modeTabsRow}>
          <Tabs
            tabs={VIEW_TABS}
            activeTab={viewMode}
            onChange={(m) => setViewMode(m)}
            variant="pills"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {viewMode === 'grid' && (
          <AbllsGridSheet summaryData={summaryData} onSelectItem={setSelectedItem} />
        )}

        {viewMode === 'cards' && (
          <AbllsDomainCards
            summaryData={summaryData}
            priorityNames={priorityNames}
            onSelectItem={setSelectedItem}
          />
        )}

        {(viewMode === 'summary' || viewMode === 'grid') && (
          <AbllsPrioritySummary priorityAreas={priorityAreas} rows={rows} />
        )}
      </ScrollView>

      {/* SKILL ITEM INSPECTOR MODAL */}
      <AbllsItemInspectorModal
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateScore={handleUpdateItemScore}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  headerContainer: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  sheetHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sheetHeaderLeft: {
    flex: 1,
    minWidth: 320,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navyText,
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  studentDetailsText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  legendBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    gap: spacing.xs,
  },
  legendHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendCellSample: {
    flexDirection: 'row',
    gap: 1.5,
  },
  miniCell: {
    width: 8,
    height: 8,
    borderWidth: 0.5,
    borderColor: '#475569',
  },
  legendLabel: {
    fontSize: 11,
    color: colors.bodyText,
    fontWeight: '600',
  },
  modeTabsRow: {
    paddingBottom: spacing.sm,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
});
