import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { openPrintWindow } from '../../utils/webExport';
import { getSkillsAssessment, getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import { DEFAULT_ABLLS_DOMAINS, buildAbllsDomainsFromConfig, type AbllsDomainDef } from './abllsConfigHelper';
import type { SessionStackParamList } from '../../types';

type Score = 0 | 1 | 2 | 'NA';

const SCORE_COLOR: Record<Score, string> = {
  0: '#EF4444', // Red - Not Demonstrated
  1: '#EAB308', // Yellow - Emerging
  2: '#16A34A', // Green - Mastered
  NA: '#94A3B8', // Grey - N/A
};

const SCORE_LABEL: Record<Score, string> = {
  0: '0 — Not Demonstrated',
  1: '1 — Emerging',
  2: '2 — Mastered',
  NA: 'N/A',
};

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;
type ViewMode = 'grid' | 'cards' | 'summary';

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [domains, setDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    domain: string;
    description: string;
    score: Score;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch (err) {
      setProfile(null);
    }
    try {
      const { data: cfg } = await getFormConfig('ABLLS Assessment Form');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        setDomains(buildAbllsDomainsFromConfig(cfg.fields));
      }
    } catch (err) {
      setDomains(DEFAULT_ABLLS_DOMAINS);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      const savedData = (saved?.data ?? {}) as { scores?: Record<string, Score> };
      setScores(savedData.scores ?? {});
    } catch (err) {
      setScores({});
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoader />;

  const studentName = profile?.fullName || 'Student A';

  const summaryData = domains.map((d) => {
    const items = d.items.map((it) => ({
      id: it.id,
      description: it.description,
      options: it.options,
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

  // Compute cell fill count (out of 4 cells) based on score
  const getFilledCells = (score: Score): number => {
    if (score === 2) return 4;
    if (score === 1) return 2;
    return 0;
  };

  const handleExport = () => {
    const title = 'ABLLS-R Skill Tracking System & Color Need Map';
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const towersHtml = summaryData
      .map((domain) => {
        // Items sorted ascending bottom to top
        const reversedItems = [...domain.items].reverse();
        const rowsHtml = reversedItems
          .map((item) => {
            const filledCount = getFilledCells(item.score);
            const cellsHtml = [0, 1, 2, 3]
              .map((cIdx) => {
                const isFilled = cIdx < filledCount;
                const bg = isFilled ? (item.score === 2 ? '#16A34A' : '#EAB308') : item.score === 'NA' ? '#E2E8F0' : '#FFFFFF';
                return `<span class="cell" style="background-color: ${bg}; border: 1px solid #475569;"></span>`;
              })
              .join('');
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
            .cells-wrapper { display: flex; gap: 2px; }
            .cell { width: 18px; height: 14px; display: inline-block; box-sizing: border-box; }
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

          <div class="grid-container">
            ${towersHtml}
          </div>

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
              `
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
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      {/* Top Header Card */}
      <View style={styles.headerContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backBtnText}>Back to Skills Assessment</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.exportHeaderBtn} onPress={handleExport}>
            <Feather name="printer" size={14} color="#0F172A" />
            <Text style={styles.exportHeaderBtnText}>Print / Export Sheet</Text>
          </TouchableOpacity>
        </View>

        {/* Student & Tracking Information Sheet Header */}
        <View style={styles.sheetHeaderCard}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={styles.sheetMainTitle}>Assessment of Basic Language and Learning Skills-Revised (ABLLS-R)</Text>
            <Text style={styles.sheetSubTitle}>Skill Tracking System &middot; Color Need Analysis Grid</Text>

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
                  Student ID: {studentId} &middot; Age {profile?.age ?? '—'} &middot; Assessment: Current
                </Text>
              </View>
            </View>
          </View>

          {/* Color Code Legend Table */}
          <View style={styles.legendBox}>
            <Text style={styles.legendHeader}>COLOR CODE / MASTERY KEY</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: '#16A34A' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#16A34A' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#16A34A' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#16A34A' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 2 &middot; Mastered (4 Cells)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: '#EAB308' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#EAB308' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 1 &middot; Emerging (2 Cells)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 0 &middot; Not Demonstrated (0 Cells)</Text>
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

        {/* View Mode Switcher Chips */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'grid' && styles.modeTabActive]}
            onPress={() => setViewMode('grid')}
          >
            <Feather name="grid" size={14} color={viewMode === 'grid' ? '#0F172A' : '#64748B'} />
            <Text style={[styles.modeTabText, viewMode === 'grid' && styles.modeTabTextActive]}>
              ABLLS-R Skill Tracking Grid (Sheet View)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'cards' && styles.modeTabActive]}
            onPress={() => setViewMode('cards')}
          >
            <Feather name="layers" size={14} color={viewMode === 'cards' ? '#0F172A' : '#64748B'} />
            <Text style={[styles.modeTabText, viewMode === 'cards' && styles.modeTabTextActive]}>
              Domain Breakdown Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'summary' && styles.modeTabActive]}
            onPress={() => setViewMode('summary')}
          >
            <Feather name="bar-chart-2" size={14} color={viewMode === 'summary' ? '#0F172A' : '#64748B'} />
            <Text style={[styles.modeTabText, viewMode === 'summary' && styles.modeTabTextActive]}>
              Priority Needs & Summary Table
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* VIEW 1: AUTHENTIC ABLLS-R 4-CELL FLOOR GRID SHEET VIEW */}
        {viewMode === 'grid' && (
          <View style={styles.sheetContainer}>
            <View style={styles.sheetNoticeRow}>
              <Feather name="info" size={14} color="#0284C7" />
              <Text style={styles.sheetNoticeText}>
                Tap any skill floor/cell to inspect specific criteria, mastery level, and description.
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.gridColumnsContainer}>
              {summaryData.map((domain) => {
                // Stacked ascending from bottom (A1 at bottom floor) to top (A7 at peak)
                const ascendingItems = [...domain.items].reverse();

                return (
                  <View key={domain.code} style={styles.towerColumn}>
                    {/* Domain Header Tag */}
                    <View style={styles.towerTopTag}>
                      <Text style={styles.towerTopCode}>{domain.code}</Text>
                      <Text style={styles.towerTopCount}>{domain.items.length} items</Text>
                    </View>

                    {/* Skill Floors (Tower of 4-cell rows) */}
                    <View style={styles.towerStackBox}>
                      {ascendingItems.map((item) => {
                        const filledCount = getFilledCells(item.score);

                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.skillFloorRow}
                            onPress={() =>
                              setSelectedItem({
                                id: item.id,
                                domain: domain.name,
                                description: item.description,
                                score: item.score,
                              })
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.floorLabelBox}>
                              <View
                                style={[
                                  styles.floorIndicatorDot,
                                  {
                                    backgroundColor:
                                      item.score === 2
                                        ? '#16A34A'
                                        : item.score === 1
                                        ? '#EAB308'
                                        : item.score === 0
                                        ? '#EF4444'
                                        : '#CBD5E1',
                                  },
                                ]}
                              />
                              <Text style={styles.floorItemCode}>{item.id}</Text>
                            </View>

                            {/* 4 Cells / Floors */}
                            <View style={styles.fourCellsWrapper}>
                              {[0, 1, 2, 3].map((cellIdx) => {
                                const isFilled = cellIdx < filledCount;
                                const isNA = item.score === 'NA';
                                const cellBg = isFilled
                                  ? item.score === 2
                                    ? '#16A34A'
                                    : '#EAB308'
                                  : isNA
                                  ? '#E2E8F0'
                                  : '#FFFFFF';

                                return (
                                  <View
                                    key={cellIdx}
                                    style={[
                                      styles.cellBox,
                                      {
                                        backgroundColor: cellBg,
                                        borderColor: '#475569',
                                      },
                                    ]}
                                  />
                                );
                              })}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Bottom Domain Footer */}
                    <View style={styles.towerBottomBox}>
                      <Text style={styles.towerBottomTitle} numberOfLines={2}>
                        {domain.name}
                      </Text>
                      <View
                        style={[
                          styles.towerMasteryPill,
                          domain.masteredPct >= 70
                            ? styles.pillGreen
                            : domain.masteredPct >= 40
                            ? styles.pillYellow
                            : styles.pillRed,
                        ]}
                      >
                        <Text style={styles.towerMasteryText}>{domain.masteredPct}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* VIEW 2: DOMAIN BREAKDOWN CARDS */}
        {viewMode === 'cards' && (
          <View style={styles.cardsContainer}>
            {summaryData.map((domain) => (
              <View key={domain.name} style={styles.domainCard}>
                <View style={styles.domainCardHeader}>
                  <View style={styles.domainCardTitleRow}>
                    <Text style={styles.domainCodeBadge}>{domain.code}</Text>
                    <Text style={styles.domainCardTitle}>{domain.name}</Text>
                    {priorityNames.has(domain.name) && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityBadgeText}>High Need</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.domainCardPct}>{domain.masteredPct}% Mastered</Text>
                </View>

                {/* Grid items in this domain */}
                <View style={styles.domainItemsGrid}>
                  {domain.items.map((item) => {
                    const filled = getFilledCells(item.score);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.cardItemTile}
                        onPress={() =>
                          setSelectedItem({
                            id: item.id,
                            domain: domain.name,
                            description: item.description,
                            score: item.score,
                          })
                        }
                      >
                        <View style={styles.cardTileHeader}>
                          <Text style={styles.cardTileId}>{item.id}</Text>
                          <Text
                            style={[
                              styles.cardTileScoreBadge,
                              { color: SCORE_COLOR[item.score] },
                            ]}
                          >
                            {item.score === 'NA' ? 'N/A' : `Score: ${item.score}`}
                          </Text>
                        </View>
                        <Text style={styles.cardTileDesc} numberOfLines={2}>
                          {item.description}
                        </Text>

                        {/* 4 mini floor cells */}
                        <View style={styles.cardTileCells}>
                          {[0, 1, 2, 3].map((c) => (
                            <View
                              key={c}
                              style={[
                                styles.cardMiniCell,
                                {
                                  backgroundColor:
                                    c < filled
                                      ? item.score === 2
                                        ? '#16A34A'
                                        : '#EAB308'
                                      : item.score === 'NA'
                                      ? '#E2E8F0'
                                      : '#FFFFFF',
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* VIEW 3: PRIORITY AREAS & DOMAIN SUMMARY TABLE */}
        {(viewMode === 'summary' || viewMode === 'grid') && (
          <View style={{ gap: 16 }}>
            {/* Priority Areas of Need (Top 3) */}
            <View style={styles.summaryCard}>
              <View style={styles.sectionHeaderRow}>
                <Feather name="alert-triangle" size={16} color="#DC2626" />
                <Text style={styles.sectionHeading}>Priority Areas of Need (Top Clinical Focus)</Text>
              </View>
              <Text style={styles.sectionSub}>
                Domains with the highest count of unmastered (0s) and emerging (1s) skills recommended for IEP / IUP target goals.
              </Text>

              <View style={styles.priorityCardsGrid}>
                {priorityAreas.map((p) => (
                  <View key={p.rank} style={styles.priorityCardBox}>
                    <View style={styles.priorityHeaderRow}>
                      <View style={styles.priorityRankCircle}>
                        <Text style={styles.priorityRankNumber}>#{p.rank}</Text>
                      </View>
                      <Text style={styles.priorityDomainTitle}>{p.name}</Text>
                    </View>
                    <View style={styles.priorityCountsRow}>
                      <View style={styles.priorityCountChipRed}>
                        <Text style={styles.priorityCountTextRed}>{p.c0} not demonstrated</Text>
                      </View>
                      <View style={styles.priorityCountChipYellow}>
                        <Text style={styles.priorityCountTextYellow}>{p.c1} emerging</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Comprehensive Domain Mastery Table */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionHeading}>Comprehensive Domain Summary</Text>

              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, styles.colDomain]}>Domain Area</Text>
                <Text style={[styles.th, styles.colBadge, { color: '#EF4444' }]}>Score 0</Text>
                <Text style={[styles.th, styles.colBadge, { color: '#CA8A04' }]}>Score 1</Text>
                <Text style={[styles.th, styles.colBadge, { color: '#16A34A' }]}>Score 2</Text>
                <Text style={[styles.th, styles.colBadge, { color: '#64748B' }]}>N/A</Text>
                <Text style={[styles.th, styles.colProgress]}>% Mastered</Text>
                <Text style={[styles.th, styles.colPriority]}>Status</Text>
              </View>

              {rows.map((row, idx) => (
                <View key={row.name} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.tdDomain, styles.colDomain]}>
                    <Text style={{ fontWeight: '800', color: '#0284C7' }}>{row.code}. </Text>
                    {row.name}
                  </Text>

                  <View style={styles.colBadge}>
                    <View style={[styles.countBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.countBadgeText, { color: '#EF4444' }]}>{row.c0}</Text>
                    </View>
                  </View>

                  <View style={styles.colBadge}>
                    <View style={[styles.countBadge, { backgroundColor: '#FEF9C3' }]}>
                      <Text style={[styles.countBadgeText, { color: '#CA8A04' }]}>{row.c1}</Text>
                    </View>
                  </View>

                  <View style={styles.colBadge}>
                    <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.countBadgeText, { color: '#16A34A' }]}>{row.c2}</Text>
                    </View>
                  </View>

                  <Text style={[styles.tdNA, styles.colBadge]}>{row.cNA}</Text>

                  <View style={[styles.colProgress, styles.progressCell]}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${row.masteredPct}%` }]} />
                    </View>
                    <Text style={styles.progressPctText}>{row.masteredPct}%</Text>
                  </View>

                  <View style={styles.colPriority}>
                    {row.isPriority ? (
                      <View style={styles.priorityPill}>
                        <Text style={styles.priorityPillText}>High Need</Text>
                      </View>
                    ) : (
                      <Text style={styles.normalStatusText}>On Track</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* SKILL ITEM INSPECTOR MODAL */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          style={styles.inspectorOverlay}
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        >
          <View style={styles.inspectorContent} onStartShouldSetResponder={() => true}>
            <View style={styles.inspectorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inspectorCode}>{selectedItem?.id}</Text>
                <Text style={styles.inspectorDomain}>{selectedItem?.domain}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inspectorBody}>
              <Text style={styles.inspectorDescLabel}>Skill Description</Text>
              <Text style={styles.inspectorDescText}>{selectedItem?.description}</Text>

              <View style={styles.inspectorScoreRow}>
                <Text style={styles.inspectorScoreLabel}>Mastery Level:</Text>
                <View
                  style={[
                    styles.inspectorScorePill,
                    {
                      backgroundColor:
                        selectedItem?.score === 2
                          ? '#DCFCE7'
                          : selectedItem?.score === 1
                          ? '#FEF9C3'
                          : selectedItem?.score === 0
                          ? '#FEE2E2'
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inspectorScoreText,
                      { color: SCORE_COLOR[selectedItem?.score ?? 'NA'] },
                    ]}
                  >
                    {SCORE_LABEL[selectedItem?.score ?? 'NA']}
                  </Text>
                </View>
              </View>

              {/* 4 Cells representation */}
              <View style={styles.inspectorCellsBox}>
                <Text style={styles.inspectorCellsLabel}>4-Floor Progress Tracker:</Text>
                <View style={styles.inspectorCellsRow}>
                  {[1, 2, 3, 4].map((c) => {
                    const filled = getFilledCells(selectedItem?.score ?? 'NA');
                    const isF = c <= filled;
                    return (
                      <View key={c} style={styles.inspectorCellUnit}>
                        <View
                          style={[
                            styles.inspectorCellBlock,
                            {
                              backgroundColor: isF
                                ? selectedItem?.score === 2
                                  ? '#16A34A'
                                  : '#EAB308'
                                : '#F8FAFC',
                              borderColor: '#334155',
                            },
                          ]}
                        />
                        <Text style={styles.inspectorCellSub}>Floor {c}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.inspectorCloseBtn} onPress={() => setSelectedItem(null)}>
              <Text style={styles.inspectorCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
    flexWrap: 'wrap',
  },
  sheetHeaderLeft: {
    flex: 1,
    minWidth: 260,
  },
  sheetMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sheetSubTitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentDetailsText: {
    fontSize: 11,
    color: '#64748B',
  },
  legendBox: {
    borderWidth: 1,
    borderColor: '#94A3B8',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    gap: 4,
    minWidth: 240,
  },
  legendHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCellSample: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#475569',
  },
  miniCell: {
    width: 7,
    height: 9,
    borderRightWidth: 1,
    borderRightColor: '#94A3B8',
  },
  legendLabel: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '500',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modeTabActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  modeTabTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  sheetNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  sheetNoticeText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  gridColumnsContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
    paddingVertical: 8,
  },
  towerColumn: {
    width: 168,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    borderRadius: 8,
    padding: 8,
  },
  towerTopTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 6,
  },
  towerTopCode: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  towerTopCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  towerStackBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 4,
    padding: 4,
    gap: 4,
  },
  skillFloorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  floorLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 36,
  },
  floorIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floorItemCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  fourCellsWrapper: {
    flexDirection: 'row',
    gap: 2,
  },
  cellBox: {
    width: 25,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  towerBottomBox: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#CBD5E1',
  },
  towerBottomTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 15,
  },
  towerMasteryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillGreen: { backgroundColor: '#DCFCE7' },
  pillYellow: { backgroundColor: '#FEF9C3' },
  pillRed: { backgroundColor: '#FEE2E2' },
  towerMasteryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  cardsContainer: {
    gap: 16,
  },
  domainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    gap: 12,
  },
  domainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  domainCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainCodeBadge: {
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  domainCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  priorityBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  domainCardPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  domainItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardItemTile: {
    width: '31%',
    minWidth: 160,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  cardTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTileId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardTileScoreBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardTileDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 14,
  },
  cardTileCells: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  cardMiniCell: {
    flex: 1,
    height: 8,
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: 1,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  priorityCardsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  priorityCardBox: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityRankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityRankNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  priorityDomainTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  priorityCountsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  priorityCountChipRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityCountTextRed: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
  },
  priorityCountChipYellow: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityCountTextYellow: {
    fontSize: 11,
    color: '#CA8A04',
    fontWeight: '600',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  colDomain: { flex: 3 },
  colBadge: { flex: 1, alignItems: 'center', textAlign: 'center' },
  colProgress: { flex: 2 },
  colPriority: { flex: 1.5, alignItems: 'center' },
  tdDomain: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tdNA: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  progressCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    width: 32,
    textAlign: 'right',
  },
  priorityPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  normalStatusText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },

  inspectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inspectorContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  inspectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  inspectorCode: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  inspectorDomain: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  inspectorBody: {
    gap: 10,
  },
  inspectorDescLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  inspectorDescText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
    lineHeight: 20,
  },
  inspectorScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  inspectorScoreLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  inspectorScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  inspectorScoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inspectorCellsBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    gap: 6,
  },
  inspectorCellsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  inspectorCellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  inspectorCellUnit: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  inspectorCellBlock: {
    width: '100%',
    height: 18,
    borderWidth: 1,
    borderRadius: 2,
  },
  inspectorCellSub: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  inspectorCloseBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  inspectorCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});