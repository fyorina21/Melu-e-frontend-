import React, { useEffect, useState, useCallback } from 'react';
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
import ScreenLoader from '../../components/ScreenLoader';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { openPrintWindow } from '../../utils/webExport';
import { getSkillsAssessment, getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Score = 0 | 1 | 2 | 'NA';

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

const ABLLS_MAP_TEMPLATE: Array<{ name: string; items: string[] }> = [
  { name: 'Visual Performance', items: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'] },
  { name: 'Motor Imitation', items: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'] },
  { name: 'Vocal Imitation', items: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] },
  { name: 'Receptive Language', items: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'] },
  { name: 'Requesting', items: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'] },
  { name: 'Play and Leisure', items: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'] },
  { name: 'Social Interaction', items: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'] },
  { name: 'Writing', items: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'] },
  { name: 'Dressing', items: ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7'] },
];

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [scores, setScores] = useState<Record<string, Score>>({});

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch (err) {
      setProfile(null);
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

  useEffect(() => { load(); }, [load]);

  if (loading) return <ScreenLoader />;

  const studentName = profile?.fullName || 'Student A';

  const summaryData = ABLLS_MAP_TEMPLATE.map((d) => {
    const items = d.items.map((id) => ({ id, score: scores[id] ?? ('NA' as Score) }));
    const c0 = items.filter((i) => i.score === 0).length;
    const c1 = items.filter((i) => i.score === 1).length;
    const c2 = items.filter((i) => i.score === 2).length;
    const cNA = items.filter((i) => i.score === 'NA').length;
    const validTotal = items.length - cNA;
    const masteredPct = validTotal > 0 ? Math.round((c2 / validTotal) * 100) : 0;

    return {
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
              ${rows.map((d) => `
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
            <Text style={styles.avatarText}>{studentName.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentAge}>Age {profile?.age ?? '—'}</Text>
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
                {priorityNames.has(domain.name) && (
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

          {rows.map((row, idx) => (
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