import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Alert, SafeAreaView } from 'react-native';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { ProgramDirectorStackParamList } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';

const mockStudents = [
  { id: '1', name: 'Student A' },
  { id: '2', name: 'Student B' },
];

const mockData = {
  studentInfo: {
    fullName: 'Student A',
    dateOfBirth: '2018-03-12',
    age: 8,
    diagnosis: 'Autism Spectrum Disorder (Level 2)',
    parentGuardian: 'Maria Santos',
    phone: '(555) 012-3456',
    programType: 'Early Intensive Behavioral Intervention',
    therapyGroup: 'Group A',
    station: 'Station 1',
    enrollmentDate: '2024-09-01',
    assessmentStart: '2025-01-06',
    assessmentEnd: '2025-02-14',
  },
  ablls: [
    { domain: 'Language', score: 72, max: 100 },
    { domain: 'Reading', score: 45, max: 100 },
    { domain: 'Math', score: 38, max: 100 },
    { domain: 'Writing', score: 28, max: 100 },
    { domain: 'Self-Help', score: 68, max: 100 },
    { domain: 'Leisure Skills', score: 80, max: 100 },
    { domain: 'Social Interaction', score: 34, max: 100 },
    { domain: 'Gross Motor', score: 90, max: 100 },
    { domain: 'Fine Motor', score: 55, max: 100 },
    { domain: 'Vocal Imitation', score: null, max: 100 },
  ],
  behavior: {
    mass: {
      scores: [
        { function: 'Sensory', score: 3.8 },
        { function: 'Escape', score: 2.1 },
        { function: 'Attention', score: 4.5 },
        { function: 'Tangible', score: 1.9 },
      ],
      dominantFunction: 'Attention',
    },
    fast: {
      scores: [
        { function: 'Social Attention', score: 28 },
        { function: 'Escape/Avoidance', score: 14 },
        { function: 'Automatic Reinforcement', score: 9 },
        { function: 'Access to Tangibles', score: 7 },
      ],
      hypothesizedFunction: 'Social Attention',
    },
    abc: {
      totalIncidents: 23,
      topAntecedents: [
        { antecedent: 'Demand Presented', count: 11 },
        { antecedent: 'Peer Interaction', count: 7 },
        { antecedent: 'Transition Between Activities', count: 5 },
      ],
    },
  },
  preference: [
    { rank: 1, item: 'Tablet (YouTube)', duration: '18 min', frequency: 9, context: 'Free play period, individual sessions' },
    { rank: 2, item: 'Bubble Blower', duration: '14 min', frequency: 7, context: 'Outdoor play, sensory breaks' },
    { rank: 3, item: 'Toy Cars (Red Set)', duration: '11 min', frequency: 8, context: 'Table activities, parallel play' },
    { rank: 4, item: 'Playdough', duration: '9 min', frequency: 6, context: 'Fine motor station, group activities' },
    { rank: 5, item: 'Music via Speaker', duration: '7 min', frequency: 10, context: 'Transitions, calm-down corner' },
  ],
  iup: {
    status: 'Finalized',
    station1Goals: [
      { id: 'G1', description: 'Student will request preferred items using 2-word phrases in 4 out of 5 opportunities across 3 consecutive sessions.' },
      { id: 'G2', description: 'Student will maintain eye contact with communication partner for 3 seconds when name is called, in 80% of trials.' },
      { id: 'G3', description: 'Student will independently complete a 5-step hand-washing routine with visual support in 4 out of 5 trials.' },
    ],
    station2Goals: [
      { id: 'G4', description: 'Student will match uppercase letters A–M to corresponding lowercase letters with 90% accuracy across 3 sessions.' },
      { id: 'G5', description: 'Student will identify numbers 1–10 by pointing when named, in 8 out of 10 trials across 3 consecutive sessions.' },
    ],
  },
};

function getAblssColor(score: number | null): { bg: string; text: string; label: string } {
  if (score === null) return { bg: '#F3F4F6', text: '#6B7280', label: 'Not Assessed' };
  if (score <= 33) return { bg: '#FEE2E2', text: '#DC2626', label: 'Needs Support' };
  if (score <= 66) return { bg: '#FEF3C7', text: '#B45309', label: 'Developing' };
  return { bg: '#D1FAE5', text: '#059669', label: 'Proficient' };
}

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <View style={[styles.barTrack, { backgroundColor: '#E5E7EB' }]} />;
  const color = score <= 33 ? '#F87171' : score <= 66 ? '#FBBF24' : '#22C55E';
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function AssessmentSummaryReport({ navigation }: NativeStackScreenProps<ProgramDirectorStackParamList, 'AssessmentSummaryReport'> | { navigation?: any }) {
  const [selectedStudent, setSelectedStudent] = useState('1');

  const data = mockData;
  const { studentInfo, ablls, behavior, preference, iup } = data;

  function handleDownload() {
    Alert.alert('Info', 'PDF export coming soon');
  }

  const colorNeedMap = {
    red: ablls.filter(d => d.score !== null && d.score <= 33).map(d => d.domain),
    yellow: ablls.filter(d => d.score !== null && d.score > 33 && d.score <= 66).map(d => d.domain),
    green: ablls.filter(d => d.score !== null && d.score > 66).map(d => d.domain),
    gray: ablls.filter(d => d.score === null).map(d => d.domain),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppNavbar activeTab="Assessment Summary Report" onTabPress={(tab) => navigation?.navigate?.(PD_ROUTE_BY_TAB[tab] as never)} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandText}>ABA</Text>
          </View>
          <View>
            <Text style={styles.pageTitle}>Assessment Summary Report</Text>
            <Text style={styles.pageSubtitle}>6-Week Assessment Completion Report</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDownload} style={styles.downloadBtn}>
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectRow}>
        <Text style={styles.selectLabel}>Select Student</Text>
        <View style={styles.selectWrapper}>
          {mockStudents.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSelectedStudent(s.id)}
              style={[styles.selectOption, selectedStudent === s.id && styles.selectOptionActive]}
            >
              <Text style={[styles.selectOptionText, selectedStudent === s.id && styles.selectOptionTextActive]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Student Info */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Student Information</Text>
        </View>
        <View style={styles.infoGrid}>
          <InfoItem label="Full Name" value={studentInfo.fullName} />
          <InfoItem label="Date of Birth" value={studentInfo.dateOfBirth} />
          <InfoItem label="Age" value={`${studentInfo.age} years old`} />
          <InfoItem label="Diagnosis" value={studentInfo.diagnosis} />
          <InfoItem label="Parent / Guardian" value={studentInfo.parentGuardian} />
          <InfoItem label="Phone" value={studentInfo.phone} />
          <InfoItem label="Program Type" value={studentInfo.programType} />
          <InfoItem label="Therapy Group" value={studentInfo.therapyGroup} />
          <InfoItem label="Station" value={studentInfo.station} />
          <InfoItem label="Enrollment Date" value={studentInfo.enrollmentDate} />
          <InfoItem label="Assessment Start" value={studentInfo.assessmentStart} />
          <InfoItem label="Assessment End" value={studentInfo.assessmentEnd} />
        </View>
      </View>

      {/* ABLLS */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Skills Assessment — ABLLS-R</Text>
        </View>
        <View style={styles.cardBody}>
          {ablls.map(domain => {
            const c = getAblssColor(domain.score);
            return (
              <View key={domain.domain} style={styles.abllRow}>
                <Text style={styles.abllDomain}>{domain.domain}</Text>
                <View style={styles.abllBarWrap}>
                  <ScoreBar score={domain.score} />
                  <Text style={styles.abllScoreText}>{domain.score !== null ? `${domain.score}%` : '—'}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: c.bg }]}>
                  <Text style={[styles.pillText, { color: c.text }]}>{c.label}</Text>
                </View>
              </View>
            );
          })}
          <View style={styles.needMapRow}>
            <NeedMapBox title="Needs Support (0–33%)" items={colorNeedMap.red} color="#FEE2E2" textColor="#DC2626" />
            <NeedMapBox title="Developing (34–66%)" items={colorNeedMap.yellow} color="#FEF3C7" textColor="#B45309" />
            <NeedMapBox title="Proficient (67–100%)" items={colorNeedMap.green} color="#D1FAE5" textColor="#059669" />
            <NeedMapBox title="Not Assessed" items={colorNeedMap.gray} color="#F3F4F6" textColor="#6B7280" />
          </View>
        </View>
      </View>

      {/* Behavior */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Behavior Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <SectionTitle title="MASS Results" />
          <TableHeader cols={['Function', 'Score (0–6)']} />
          {behavior.mass.scores.map(item => (
            <TableRow key={item.function} values={[
              <Text key="f" style={[styles.tableCell, item.function === behavior.mass.dominantFunction && styles.tableBoldText]}>
                {item.function}{item.function === behavior.mass.dominantFunction ? '  (Dominant)' : ''}
              </Text>,
              <Text key="v" style={[styles.tableCell, styles.tableRight]}>{item.score.toFixed(1)}</Text>
            ]} />
          ))}
          <Text style={styles.subNote}>Dominant function: <Text style={styles.subNoteBold}>{behavior.mass.dominantFunction}</Text></Text>

          <View style={styles.divider} />

          <SectionTitle title="FAST Results" />
          <TableHeader cols={['Function', 'Score']} />
          {behavior.fast.scores.map(item => (
            <TableRow key={item.function} values={[
              <Text key="f" style={[styles.tableCell, item.function === behavior.fast.hypothesizedFunction && styles.tableBoldText]}>
                {item.function}{item.function === behavior.fast.hypothesizedFunction ? '  (Hypothesized)' : ''}
              </Text>,
              <Text key="v" style={[styles.tableCell, styles.tableRight]}>{item.score}</Text>
            ]} />
          ))}
          <Text style={styles.subNote}>Hypothesized function: <Text style={styles.subNoteBold}>{behavior.fast.hypothesizedFunction}</Text></Text>

          <View style={styles.divider} />

          <SectionTitle title="ABC Incident Log Summary" />
          <Text style={styles.subNote}>Total incidents: <Text style={styles.subNoteBold}>{behavior.abc.totalIncidents}</Text></Text>
          <TableHeader cols={['Top Antecedents', 'Count']} />
          {behavior.abc.topAntecedents.map(item => (
            <TableRow key={item.antecedent} values={[
              <Text key="a" style={styles.tableCell}>{item.antecedent}</Text>,
              <Text key="c" style={[styles.tableCell, styles.tableRight]}>{item.count}</Text>
            ]} />
          ))}
        </View>
      </View>

      {/* Preference */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Preference Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <TableHeader cols={['Rank', 'Preferred Item', 'Duration', 'Frequency', 'Context']} alignEnd={false} />
          {preference.map(item => (
            <TableRow key={item.rank} values={[
              <Text key="r" style={[styles.tableCell, styles.tableBoldText]}>
                <View style={styles.rankCircle}><Text style={styles.rankText}>{item.rank}</Text></View>
              </Text>,
              <Text key="i" style={[styles.tableCell, styles.tableBoldText]}>{item.item}</Text>,
              <Text key="d" style={[styles.tableCell, styles.tableRight]}>{item.duration}</Text>,
              <Text key="f" style={[styles.tableCell, styles.tableRight]}>{item.frequency}x</Text>,
              <Text key="c" style={[styles.tableCell, { fontSize: 11, color: colors.mutedText }]}>{item.context}</Text>
            ]} />
          ))}
        </View>
      </View>

      {/* IUP */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>IUP Status</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.iupRow}>
            <Text style={styles.iupLabel}>IUP Status:</Text>
            <View style={[styles.iupPill, iup.status === 'Finalized' ? styles.iupPillGreen : styles.iupPillYellow]}>
              <Text style={iup.status === 'Finalized' ? styles.iupPillGreenText : styles.iupPillYellowText}>{iup.status}</Text>
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalSectionTitle}>Station 1 Goals</Text>
            {iup.station1Goals.map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <Text style={styles.goalId}>{goal.id}</Text>
                <Text style={styles.goalDesc}>{goal.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalSectionTitle}>Station 2 Goals</Text>
            {iup.station2Goals.map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <Text style={styles.goalId}>{goal.id}</Text>
                <Text style={styles.goalDesc}>{goal.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footerActions}>
        <TouchableOpacity onPress={handleDownload} style={styles.footerBtn}>
          <Text style={styles.footerBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function NeedMapBox({ title, items, color, textColor }: { title: string; items: string[]; color: string; textColor: string }) {
  return (
    <View style={[styles.needBox, { backgroundColor: color }]}>
      <Text style={[styles.needTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.needItems, { color: textColor, opacity: 0.9 }]}>{items.join(', ') || 'None'}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function TableHeader({ cols, alignEnd = true }: { cols: string[]; alignEnd?: boolean }) {
  return (
    <View style={styles.tableHeaderRow}>
      {cols.map((c, i) => (
        <Text key={i} style={[styles.tableHeaderCell, i > 0 && alignEnd ? styles.tableRight : null]}>{c}</Text>
      ))}
    </View>
  );
}

function TableRow({ values }: { values: React.ReactNode[] }) {
  return (
    <View style={styles.tableRow}>
      {values.map((v, i) => (
        <View key={i} style={i === 0 ? styles.tableCell : styles.tableCellRight}>{v}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgApp },
  container: { flex: 1, backgroundColor: colors.bgApp },
  contentContainer: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandBadge: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  brandText: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText },
  downloadBtn: { backgroundColor: '#FCD34D', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  selectRow: { marginBottom: spacing.md },
  selectLabel: { fontSize: 12, fontWeight: '600', color: colors.mutedText, marginBottom: spacing.xs },
  selectWrapper: { flexDirection: 'row', gap: spacing.sm },
  selectOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  selectOptionActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  selectOptionText: { fontSize: 13, color: colors.bodyText },
  selectOptionTextActive: { fontWeight: '600', color: '#2563EB' },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  cardHeaderBlue: { backgroundColor: '#38BDF8', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  cardHeaderText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardBody: { padding: spacing.lg, gap: spacing.md },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  infoItem: { width: '48%' },
  infoLabel: { fontSize: 10, color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.navyText },
  abllRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  abllDomain: { width: 110, fontSize: 13, fontWeight: '500', color: colors.navyText },
  abllBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 999 },
  abllScoreText: { width: 36, textAlign: 'right', fontSize: 11, color: colors.mutedText },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '600' },
  needMapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  needBox: { flex: 1, minWidth: 140, borderRadius: radius.md, padding: spacing.sm },
  needTitle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  needItems: { fontSize: 11 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.navyText, marginBottom: spacing.xs },
  subNote: { fontSize: 12, color: colors.mutedText, marginTop: spacing.xs },
  subNoteBold: { fontWeight: '600', color: colors.navyText },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs, marginBottom: spacing.xs },
  tableHeaderCell: { flex: 1, fontSize: 11, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  tableCell: { flex: 1, fontSize: 13, color: colors.bodyText },
  tableCellRight: { flex: 1, fontSize: 13, color: colors.bodyText, textAlign: 'right' },
  tableBoldText: { fontWeight: '600', color: colors.navyText },
  tableRight: { textAlign: 'right' },
  rankCircle: { width: 24, height: 24, borderRadius: 999, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  iupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iupLabel: { fontSize: 13, fontWeight: '500', color: colors.bodyText },
  iupPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  iupPillGreen: { backgroundColor: '#D1FAE5' },
  iupPillYellow: { backgroundColor: '#FEF3C7' },
  iupPillGreenText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  iupPillYellowText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  goalSection: { marginTop: spacing.md },
  goalSectionTitle: { fontSize: 13, fontWeight: '600', color: colors.navyText, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  goalItem: { flexDirection: 'row', gap: spacing.sm, backgroundColor: '#F9FAFB', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  goalId: { fontSize: 12, fontWeight: '700', color: '#2563EB', width: 28 },
  goalDesc: { flex: 1, fontSize: 13, color: colors.bodyText },
  footerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md },
  footerBtn: { backgroundColor: '#FCD34D', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
  footerBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
});
