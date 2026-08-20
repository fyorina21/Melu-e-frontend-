import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { downloadBlob, openPrintWindow } from '../../utils/webExport';
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

  const buildMapHtml = (): string => {
    const cells = (items: AbllsItem[]) =>
      items
        .map(
          (i) =>
            `<div style="display:inline-flex;flex-direction:column;align-items:center;margin:4px;"><div style="width:44px;height:44px;border-radius:6px;background:${SCORE_COLOR[i.score]};color:white;font-weight:700;display:flex;align-items:center;justify-content:center;">${SCORE_LABEL[i.score]}</div><div style="font-size:10px;color:#555;margin-top:2px;">${i.id}</div></div>`
        )
        .join('');
    const domains = allDomains
      .map(
        (d) =>
          `<div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px;margin-bottom:10px;"><div style="font-weight:700;font-size:14px;margin-bottom:4px;">${d.name}</div><div>${cells(d.items)}</div></div>`
      )
      .join('');
    const priority = priorityAreas
      .map((p, idx) => `<li><b>${idx + 1}. ${p.domain}</b> — ${p.need} need item(s)</li>`)
      .join('');
    return `
<html><head><meta charset="utf-8"><title>ABLLS Need Analysis Map</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;padding:24px;">
<h1 style="font-size:20px;">ABLLS Need Analysis Map</h1>
<p style="color:#555;">Student: <b>${studentName}</b> · Generated: ${new Date().toLocaleDateString()}</p>
<div style="padding:8px 0;margin-bottom:14px;">
<span style="margin-right:12px;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#EF4444;"></span> 0 = Not Demonstrated</span>
<span style="margin-right:12px;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#F59E0B;"></span> 1 = Emerging</span>
<span style="margin-right:12px;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#22C55E;"></span> 2 = Mastered</span>
<span style="margin-right:12px;"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#9CA3AF;"></span> N/A</span>
</div>
${domains}
<h2 style="font-size:16px;">Priority Areas</h2>
<div style="border:1px solid #E5E7EB;border-radius:10px;padding:12px;"><ol>${priority}</ol></div>
</body></html>`;
  };

  const exportPng = (): void => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      setExportContent(buildMapText());
      return;
    }
    const itemW = 64;
    const itemH = 58;
    const matchW = 48;
    const width = Math.max(640, allDomains.reduce((max, d) => Math.max(max, d.items.length * itemW), 0) + 24);
    const legendH = 40;
    const headerH = 40;
    const domainGap = 14;
    const pad = 16;
    const height = pad * 2 + headerH + legendH + allDomains.length * (itemH * 2 + 18) + (allDomains.length - 1) * domainGap + 80;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setExportContent(buildMapText());
      return;
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1A2233';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('ABLLS Need Analysis Map', pad, 28);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Student: ${studentName} · ${new Date().toLocaleDateString()}`, pad, 44);

    const legend = [
      { label: '0 = Not Demonstrated', color: '#EF4444' },
      { label: '1 = Emerging', color: '#F59E0B' },
      { label: '2 = Mastered', color: '#22C55E' },
      { label: 'N/A', color: '#9CA3AF' },
    ];
    let legendX = pad;
    ctx.font = '11px sans-serif';
    legend.forEach((l) => {
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(legendX + 6, 62, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4B5563';
      ctx.fillText(l.label, legendX + 16, 66);
      legendX += ctx.measureText(l.label).width + 40;
    });

    let y = 92;
    allDomains.forEach((d) => {
      ctx.fillStyle = '#1A2233';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(d.name, pad + 8, y + 14);
      let x = pad + 8;
      d.items.forEach((item) => {
        ctx.fillStyle = SCORE_COLOR[item.score];
        ctx.fillRect(x, y + 22, matchW, matchW);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        const label = SCORE_LABEL[item.score];
        const tw = ctx.measureText(label).width;
        ctx.fillText(label, x + (matchW - tw) / 2, y + 22 + matchW / 2 + 5);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.fillText(item.id, x + 2, y + 22 + matchW + 12);
        x += itemW;
      });
      y += itemH * 2 + 18 + domainGap;
    });

    y += 10;
    ctx.fillStyle = '#1A2233';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Priority Areas', pad, y);
    ctx.fillStyle = '#4B5563';
    ctx.font = '12px sans-serif';
    priorityAreas.forEach((p, idx) => {
      y += 18;
      ctx.fillText(`${idx + 1}. ${p.domain} — ${p.need} need item(s)`, pad + 8, y);
    });

    const url = canvas.toDataURL('image/png');
    const filename = `AbllsNeedMap_${studentName}_${new Date().toISOString().slice(0, 10)}.png`;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => downloadBlob(filename, blob, 'image/png'))
      .catch(() => downloadBlob(filename, url, 'image/png'));
  };

  const handleExport = () => {
    if (Platform.OS === 'web') exportPng();
    else setExportContent(buildMapText());
  };

  const handlePrint = () => {
    const ok = openPrintWindow(buildMapHtml(), 'ABLLS Need Analysis Map');
    if (!ok) setExportContent(buildMapText());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

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
