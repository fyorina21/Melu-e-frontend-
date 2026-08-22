import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { openPrintWindow } from '../../utils/webExport';
import type { SessionStackParamList } from '../../types';

type Score = 0 | 1 | 2 | 'NA';

interface AbllsItem {
  id: string;
  score: Score;
}

interface AbllsDomain {
  name: string;
  items: AbllsItem[];
  isPriority?: boolean;
}

const SCORE_COLOR: Record<Score, string> = {
  0: '#FF5252', // Red
  1: '#FFD600', // Yellow
  2: '#00E676', // Green
  NA: '#CFD8DC', // Grey
};

const SCORE_LABEL: Record<Score, string> = {
  0: '0',
  1: '1',
  2: '2',
  NA: 'N/A',
};

const DEMO_STUDENT_NAME: Record<string, string> = {
  'student-a': 'Student A',
  'student-b': 'Student B',
  'student-c': 'Student C',
};

const DEMO_DOMAINS: AbllsDomain[] = [
  {
    name: 'Visual Performance',
    items: [
      { id: 'A1', score: 2 },
      { id: 'A2', score: 2 },
      { id: 'A3', score: 1 },
      { id: 'A4', score: 1 },
      { id: 'A5', score: 0 },
      { id: 'A6', score: 2 },
      { id: 'A7', score: 1 },
    ],
  },
  {
    name: 'Motor Imitation',
    items: [
      { id: 'B1', score: 2 },
      { id: 'B2', score: 1 },
      { id: 'B3', score: 1 },
      { id: 'B4', score: 0 },
      { id: 'B5', score: 0 },
      { id: 'B6', score: 'NA' },
    ],
  },
  {
    name: 'Vocal Imitation',
    isPriority: true,
    items: [
      { id: 'C1', score: 2 },
      { id: 'C2', score: 2 },
      { id: 'C3', score: 1 },
      { id: 'C4', score: 1 },
      { id: 'C5', score: 0 },
      { id: 'C6', score: 0 },
      { id: 'C7', score: 0 },
    ],
  },
  {
    name: 'Receptive Language',
    items: [
      { id: 'D1', score: 2 },
      { id: 'D2', score: 2 },
      { id: 'D3', score: 1 },
      { id: 'D4', score: 2 },
      { id: 'D5', score: 1 },
      { id: 'D6', score: 2 },
      { id: 'D7', score: 1 },
      { id: 'D8', score: 0 },
    ],
  },
  {
    name: 'Requesting',
    isPriority: true,
    items: [
      { id: 'E1', score: 2 },
      { id: 'E2', score: 1 },
      { id: 'E3', score: 1 },
      { id: 'E4', score: 0 },
      { id: 'E5', score: 0 },
      { id: 'E6', score: 0 },
    ],
  },
  {
    name: 'Play and Leisure',
    items: [
      { id: 'F1', score: 2 },
      { id: 'F2', score: 2 },
      { id: 'F3', score: 1 },
      { id: 'F4', score: 0 },
      { id: 'F5', score: 0 },
      { id: 'F6', score: 1 },
    ],
  },
  {
    name: 'Social Interaction',
    isPriority: true,
    items: [
      { id: 'G1', score: 2 },
      { id: 'G2', score: 1 },
      { id: 'G3', score: 1 },
      { id: 'G4', score: 0 },
      { id: 'G5', score: 0 },
      { id: 'G6', score: 0 },
      { id: 'G7', score: 0 },
    ],
  },
  {
    name: 'Writing',
    items: [
      { id: 'H1', score: 1 },
      { id: 'H2', score: 1 },
      { id: 'H3', score: 0 },
      { id: 'H4', score: 0 },
      { id: 'H5', score: 0 },
      { id: 'H6', score: 'NA' },
    ],
  },
  {
    name: 'Dressing',
    items: [
      { id: 'I1', score: 2 },
      { id: 'I2', score: 1 },
      { id: 'I3', score: 1 },
      { id: 'I4', score: 0 },
      { id: 'I5', score: 0 },
      { id: 'I6', score: 'NA' },
      { id: 'I7', score: 1 },
    ],
  },
];

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const studentName = DEMO_STUDENT_NAME[studentId] || 'Student A';

  const summaryData = DEMO_DOMAINS.map((d) => {
    const c0 = d.items.filter((i) => i.score === 0).length;
    const c1 = d.items.filter((i) => i.score === 1).length;
    const c2 = d.items.filter((i) => i.score === 2).length;
    const cNA = d.items.filter((i) => i.score === 'NA').length;
    const validTotal = d.items.length - cNA;
    const masteredPct = validTotal > 0 ? Math.round((c2 / validTotal) * 100) : 0;

    return {
      name: d.name,
      c0,
      c1,
      c2,
      cNA,
      masteredPct,
      isPriority: !!d.isPriority,
      items: d.items,
    };
  });

  const priorityAreas = [
    { rank: 1, name: 'Social Interaction', c0: 4, c1: 2 },
    { rank: 2, name: 'Vocal Imitation', c0: 3, c1: 2 },
    { rank: 3, name: 'Requesting', c0: 3, c1: 2 },
  ];

  const handleExport = () => {
    const title = 'ABLLS Need Analysis Map';
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            .meta { margin-bottom: 30px; font-size: 14px; color: #64748b; }
            .section-title { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #0f172a; border-left: 4px solid #facc15; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f8fafc; font-weight: bold; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .badge-priority { background-color: #fca5a5; color: #7f1d1d; }
          </style>
        </head>
        <body>
          <h1>ABLLS Need Analysis Map</h1>
          <div class="meta">
            <strong>Student:</strong> ${studentName} &middot; 
            <strong>Date Generated:</strong> ${new Date().toLocaleDateString()}
          </div>

          <div class="section-title">Priority Areas (Needs Assessment)</div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Domain Area</th>
                <th>Incorrect (Score 0)</th>
                <th>Inconsistent (Score 1)</th>
              </tr>
            </thead>
            <tbody>
              ${priorityAreas.map((a) => `
                <tr>
                  <td><strong>#${a.rank}</strong></td>
                  <td>${a.name}</td>
                  <td>${a.c0} skills</td>
                  <td>${a.c1} skills</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">Detailed Domain Analysis</div>
          <table>
            <thead>
              <tr>
                <th>Domain Area</th>
                <th>Score 0 (Incorrect)</th>
                <th>Score 1 (Inconsistent)</th>
                <th>Score 2 (Mastered)</th>
                <th>Mastered %</th>
                <th>Priority Status</th>
              </tr>
            </thead>
            <tbody>
              ${summaryData.map((d) => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td>${d.c0} items</td>
                  <td>${d.c1} items</td>
                  <td>${d.c2} items</td>
                  <td>${d.masteredPct}%</td>
                  <td>${d.isPriority ? '<span class="badge badge-priority">HIGH</span>' : 'Normal'}</td>
                </tr>
              `).join('')}
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

      {/* Header Container */}
      <View style={styles.headerContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABLLS-R Need Analysis Map</Text>
        </View>

        <View style={styles.studentRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SA</Text>
          </View>
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentAge}>Age 6</Text>
            </View>
            <Text style={styles.stationText}>Station A</Text>
          </View>
        </View>

        {/* Legend / Key Row */}
        <View style={styles.keyRow}>
          <Text style={styles.keyLabel}>KEY:</Text>
          <View style={styles.keyItem}>
            <View style={[styles.keyDot, { backgroundColor: SCORE_COLOR[0] }]} />
            <Text style={styles.keyText}>0 — Not Demonstrated</Text>
          </View>
          <View style={styles.keyItem}>
            <View style={[styles.keyDot, { backgroundColor: SCORE_COLOR[1] }]} />
            <Text style={styles.keyText}>1 — Emerging</Text>
          </View>
          <View style={styles.keyItem}>
            <View style={[styles.keyDot, { backgroundColor: SCORE_COLOR[2] }]} />
            <Text style={styles.keyText}>2 — Mastered</Text>
          </View>
          <View style={styles.keyItem}>
            <View style={[styles.keyDot, { backgroundColor: SCORE_COLOR['NA'] }]} />
            <Text style={styles.keyText}>N/A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* All Domain Tile Cards */}
        {summaryData.map((domain) => (
          <View key={domain.name} style={styles.domainCard}>
            <View style={styles.domainHeader}>
              <View style={styles.domainTitleRow}>
                <Text style={styles.domainTitle}>{domain.name}</Text>
                {domain.isPriority && (
                  <View style={styles.priorityPill}>
                    <Text style={styles.priorityPillText}>Priority</Text>
                  </View>
                )}
              </View>
              <Text style={styles.domainPct}>{domain.masteredPct}% Mastered</Text>
            </View>

            <View style={styles.gridRow}>
              {domain.items.map((item) => (
                <View key={item.id} style={[styles.gridTile, { backgroundColor: SCORE_COLOR[item.score] }]}>
                  <Text style={styles.gridTileId}>{item.id}</Text>
                  <Text style={styles.gridTileScore}>{SCORE_LABEL[item.score]}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Domain Summary Table */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Domain Summary</Text>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDomain]}>Domain</Text>
            <Text style={[styles.th, styles.colBadge, { color: '#EF4444' }]}>0s</Text>
            <Text style={[styles.th, styles.colBadge, { color: '#EAB308' }]}>1s</Text>
            <Text style={[styles.th, styles.colBadge, { color: '#22C55E' }]}>2s</Text>
            <Text style={[styles.th, styles.colBadge, { color: '#64748B' }]}>N/A</Text>
            <Text style={[styles.th, styles.colProgress]}>% Mastered</Text>
            <Text style={[styles.th, styles.colPriority]}>Priority</Text>
          </View>

          {summaryData.map((row, idx) => (
            <View key={row.name} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.tdDomain, styles.colDomain]}>{row.name}</Text>

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
                {row.isPriority && (
                  <View style={styles.priorityPill}>
                    <Text style={styles.priorityPillText}>Priority</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Priority Areas Section */}
        <View style={styles.priorityCard}>
          <Text style={styles.priorityTitle}>Priority Areas</Text>
          <Text style={styles.prioritySubtext}>Top 3 domains with the most skills not yet mastered</Text>

          <View style={styles.priorityCardsRow}>
            {priorityAreas.map((p) => (
              <View key={p.rank} style={styles.pCard}>
                <View style={styles.pCardHeader}>
                  <View style={styles.pRankBadge}>
                    <Text style={styles.pRankText}>{p.rank}</Text>
                  </View>
                  <Text style={styles.pNameText}>{p.name}</Text>
                </View>
                <View style={styles.pStatsRow}>
                  <Text style={styles.pStatRed}>{p.c0} not demonstrated</Text>
                  <Text style={styles.pStatYellow}>{p.c1} emerging</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, { flex: 1, justifyContent: 'center' }]} onPress={handleExport}>
          <Feather name="file-text" size={16} color="#0F172A" />
          <Text style={styles.bottomBtnText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 12,
    paddingBottom: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    paddingLeft: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  studentInfo: {
    gap: 2,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentAge: {
    fontSize: 13,
    color: '#64748B',
  },
  stationText: {
    fontSize: 12,
    color: '#64748B',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  keyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  keyDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  keyText: {
    fontSize: 11,
    color: '#475569',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 90,
  },
  domainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  domainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  domainPct: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridTile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  gridTileId: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  gridTileScore: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  colDomain: {
    flex: 2,
  },
  colBadge: {
    width: 36,
    alignItems: 'center',
  },
  colProgress: {
    flex: 2,
    paddingHorizontal: 8,
  },
  colPriority: {
    width: 68,
    alignItems: 'flex-end',
  },
  tdDomain: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  tdNA: {
    fontSize: 12,
    color: '#64748B',
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressPctText: {
    fontSize: 11,
    color: '#475569',
    width: 28,
  },
  priorityPill: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priorityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  prioritySubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  priorityCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  pCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pRankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pRankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  pNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  pStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pStatRed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  pStatYellow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CA8A04',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bottomBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  bottomBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
});