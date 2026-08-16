// screens/assessments/AbllsNeedAnalysisMapScreen.tsx
// SCR-TEA-002A: ABLLS Need Analysis Map - visual, color-coded map of
// ABLLS domain scores (Red = 0 Not Demonstrated, Yellow = 1 Emerging,
// Green = 2 Mastered, Grey = N/A), identical to the physical Color Need
// Analysis map. Includes summary legend with per-domain counts, top 3
// priority areas, and Export/Print actions.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import type { SessionStackParamList } from '../../types';

type Score = 0 | 1 | 2 | 'NA';

interface AbllsItem {
  id: string;
  description: string;
  score: Score;
}

interface AbllsDomain {
  name: string;
  items: AbllsItem[];
}

const SCORE_COLOR: Record<Score, string> = {
  0: '#EF4444', // Red - Not Demonstrated
  1: '#F59E0B', // Yellow - Emerging
  2: '#22C55E', // Green - Mastered
  NA: '#9CA3AF', // Grey - N/A
};

const SCORE_LABEL: Record<Score, string> = {
  0: '0',
  1: '1',
  2: '2',
  NA: 'N/A',
};

const SCORE_MEANING: Record<Score, string> = {
  0: 'Not Demonstrated',
  1: 'Emerging',
  2: 'Mastered',
  NA: 'N/A',
};

type Props = NativeStackScreenProps<SessionStackParamList, 'AbllsNeedMap'>;

function DomainSection({ domain }: { domain: AbllsDomain }) {
  const counts = domain.items.reduce<Record<string, number>>(
    (acc, item) => {
      const key = String(item.score);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {}
  );
  return (
    <View style={styles.domainCard}>
      <View style={styles.domainHeaderRow}>
        <Text style={typography.h3}>{domain.name}</Text>
        <Text style={typography.caption}>
          0×{counts['0'] || 0} · 1×{counts['1'] || 0} · 2×{counts['2'] || 0} · N/A×{counts['NA'] || 0}
        </Text>
      </View>
      <View style={styles.itemsWrap}>
        {domain.items.map((item) => (
          <View key={item.id} style={styles.itemCell}>
            <View style={[styles.scoreBox, { backgroundColor: SCORE_COLOR[item.score] }]}>
              <Text style={styles.scoreText}>{SCORE_LABEL[item.score]}</Text>
            </View>
            <Text style={styles.itemLabel}>{item.id}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AbllsNeedAnalysisMapScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const studentName = DEMO_STUDENT_NAME[studentId] || 'Student';
  const [exportContent, setExportContent] = useState<string | null>(null);

  const allDomains = DEMO_DOMAINS;
  const needScores = allDomains.map((d) => {
    const need = d.items.filter((i) => i.score === 0 || i.score === 1).length;
    return { domain: d.name, need };
  });
  const priorityAreas = [...needScores].sort((a, b) => b.need - a.need).slice(0, 3);

  const buildMapText = (): string => {
    const lines: string[] = [];
    lines.push('ABLLS NEED ANALYSIS MAP');
    lines.push(`Student: ${studentName} · Generated: ${new Date().toLocaleDateString()}`);
    lines.push('');
    lines.push('Legend: 0 = Not Demonstrated (Red), 1 = Emerging (Yellow), 2 = Mastered (Green), N/A = Not applicable (Grey)');
    lines.push('');
    allDomains.forEach((d) => {
      lines.push(`${d.name}`);
      d.items.forEach((item) => {
        lines.push(`  ${item.id} ${SCORE_LABEL[item.score]} — ${SCORE_MEANING[item.score]} — ${item.description}`);
      });
      lines.push('');
    });
    lines.push('PRIORITY AREAS (most need)');
    priorityAreas.forEach((p, idx) => {
      lines.push(`  ${idx + 1}. ${p.domain} — ${p.need} need item(s)`);
    });
    return lines.join('\n');
  };

  const handleExport = () => setExportContent(buildMapText());

  const handlePrint = () => setExportContent(buildMapText());

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="grid" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>ABLLS Need Analysis Map</Text>
            <Text style={typography.caption}>SCR-TEA-002A — {studentName} · Age 6 · ABA</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.legendRow}>
          {([0, 1, 2, 'NA'] as Score[]).map((s) => (
            <View key={String(s)} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: SCORE_COLOR[s] }]} />
              <Text style={typography.caption}>{SCORE_LABEL[s]} = {SCORE_MEANING[s]}</Text>
            </View>
          ))}
        </View>

        {allDomains.map((d) => (
          <DomainSection key={d.name} domain={d} />
        ))}

        <View style={styles.card}>
          <Text style={typography.h3}>Priority Areas</Text>
          <Text style={typography.caption}>Domains with the most 0s and 1s (top 3 areas of need)</Text>
          {priorityAreas.map((p, idx) => (
            <View key={p.domain} style={styles.priorityRow}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>{idx + 1}</Text>
              </View>
              <Text style={typography.bodyBold}>{p.domain}</Text>
              <Text style={[typography.caption, { marginLeft: 'auto' }]}>{p.need} need items</Text>
            </View>
          ))}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={handleExport}>
            <Feather name="download" size={14} color={colors.navyText} />
            <Text style={styles.actionBtnText}>Export Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePrint}>
            <Feather name="printer" size={14} color={colors.navyText} />
            <Text style={styles.actionBtnText}>Print</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExportPreviewModal
        visible={!!exportContent}
        title="ABLLS Need Analysis Map"
        filename={`AbllsNeedMap_${studentName}_${new Date().toISOString().slice(0, 10)}.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_STUDENT_NAME: Record<string, string> = {
  'student-a': 'Student A',
  'student-b': 'Student B',
  'student-c': 'Student C',
};

const DEMO_DOMAINS: AbllsDomain[] = [
  {
    name: 'Visual Performance',
    items: [
      { id: 'A1', description: 'Matching identical objects', score: 2 },
      { id: 'A2', description: 'Matching pictures', score: 2 },
      { id: 'A3', description: 'Sorting by color', score: 1 },
      { id: 'A4', description: 'Puzzle completion', score: 1 },
      { id: 'A5', description: 'Receptive identification', score: 0 },
    ],
  },
  {
    name: 'Motor Imitation',
    items: [
      { id: 'B1', description: 'Gross motor imitation', score: 2 },
      { id: 'B2', description: 'Fine motor imitation', score: 2 },
      { id: 'B3', description: 'Imitation with objects', score: 1 },
      { id: 'B4', description: 'Sequential imitation', score: 0 },
    ],
  },
  {
    name: 'Vocal Imitation',
    items: [
      { id: 'C1', description: 'Imitation of vowel sounds', score: 2 },
      { id: 'C2', description: 'Imitation of consonant sounds', score: 1 },
      { id: 'C3', description: 'Imitation of words', score: 1 },
      { id: 'C4', description: 'Imitation of phrases', score: 0 },
    ],
  },
  {
    name: 'Receptive Language',
    items: [
      { id: 'D1', description: 'Responds to own name', score: 2 },
      { id: 'D2', description: 'Follows simple commands', score: 2 },
      { id: 'D3', description: 'Identifies body parts', score: 1 },
      { id: 'D4', description: 'Answers yes/no questions', score: 0 },
    ],
  },
  {
    name: 'Requesting',
    items: [
      { id: 'E1', description: 'Requests preferred item', score: 2 },
      { id: 'E2', description: 'Requests missing item', score: 1 },
      { id: 'E3', description: 'Requests help', score: 1 },
      { id: 'E4', description: 'Requests information', score: 0 },
    ],
  },
  {
    name: 'Play and Leisure',
    items: [
      { id: 'F1', description: 'Plays independently', score: 2 },
      { id: 'F2', description: 'Engages in parallel play', score: 2 },
      { id: 'F3', description: 'Turns taking with peers', score: 1 },
      { id: 'F4', description: 'Initiates play with peers', score: 0 },
    ],
  },
  {
    name: 'Social Interaction',
    items: [
      { id: 'G1', description: 'Responds to greetings', score: 2 },
      { id: 'G2', description: 'Initiates greetings', score: 1 },
      { id: 'G3', description: 'Shares attention', score: 1 },
      { id: 'G4', description: 'Engages in group activities', score: 0 },
    ],
  },
  {
    name: 'Writing',
    items: [
      { id: 'H1', description: 'Holds writing tool', score: 1 },
      { id: 'H2', description: 'Traces lines and shapes', score: 1 },
      { id: 'H3', description: 'Writes letters', score: 0 },
      { id: 'H4', description: 'Writes name', score: 'NA' },
    ],
  },
  {
    name: 'Dressing',
    items: [
      { id: 'I1', description: 'Removes shoes and socks', score: 2 },
      { id: 'I2', description: 'Puts on shirt', score: 1 },
      { id: 'I3', description: 'Fastens buttons', score: 0 },
      { id: 'I4', description: 'Ties shoelaces', score: 'NA' },
    ],
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  domainCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  domainHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  itemsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemCell: { alignItems: 'center', gap: spacing.xs, width: 48 },
  scoreBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  itemLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedText },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priorityBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.promptFP, alignItems: 'center', justifyContent: 'center' },
  priorityBadgeText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  btnRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, backgroundColor: colors.bgCard },
  actionBtnPrimary: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  actionBtnText: { fontWeight: '700', color: colors.navyText },
});
