import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput } from 'react-native';
import { Alert, SafeAreaView } from 'react-native';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import type { ProgramDirectorStackParamList } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getAssessmentSummaryDashboard } from '../../api/programDirectorApi';
import AbllsGridView from '../../components/AbllsGridView';

function getAblssColor(score: number | null): { bg: string; text: string; label: string } {
  if (score === null) return { bg: '#F3F4F6', text: '#6B7280', label: 'Not Assessed' };
  if (score <= 33) return { bg: '#FEE2E2', text: '#DC2626', label: 'Needs Support' };
  if (score <= 66) return { bg: '#FEF3C7', text: '#B45309', label: 'Developing' };
  return { bg: '#D1FAE5', text: '#059669', label: 'Proficient' };
}

const MASS_ITEMS = [
  { id: 'M1', text: 'Would the behavior occur continuously if left alone for long periods of time?' },
  { id: 'M2', text: 'Does the behavior occur when the person is asked to do a difficult task?' },
  { id: 'M3', text: 'Does the behavior seem to occur when the person is ignored?' },
  { id: 'M4', text: 'Does the behavior occur when a preferred item is taken away?' },
  { id: 'M5', text: 'Does the behavior occur when the person is left alone, with no one around?' },
  { id: 'M6', text: 'Does the behavior occur following a request to perform an undesirable task?' },
  { id: 'M7', text: 'Does the behavior occur when attention is diverted from the person?' },
  { id: 'M8', text: 'Does the behavior occur when the person is denied access to a desired item or activity?' },
  { id: 'M9', text: 'Does the behavior occur during a task that the person does not enjoy?' },
  { id: 'M10', text: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?' },
  { id: 'M11', text: 'Does the behavior occur to get a reaction from others?' },
  { id: 'M12', text: 'Does the behavior occur to obtain food, toys, or a specific activity?' },
];

const FAST_ITEMS = [
  { id: 'F1', text: 'Does the behavior occur when others are present, and does attention follow?' },
  { id: 'F2', text: 'Does the behavior occur to avoid or escape a task, demand, or request?' },
  { id: 'F3', text: 'Does the behavior produce a rewarding sensory effect without others?' },
  { id: 'F4', text: 'Does the behavior remove an unpleasant sensation or reduce pain?' },
  { id: 'F5', text: 'Does the behavior typically happen when the person is alone or unoccupied?' },
  { id: 'F6', text: 'Does the behavior occur during transitions or when demands increase?' },
  { id: 'F7', text: 'Does an adult typically react by giving attention or talking to the person?' },
  { id: 'F8', text: 'Is the behavior reduced when a preferred item or activity is provided freely?' },
];

function ScoreBar({ score }: { score: number | null }) {
  if (score === null) return <View style={[styles.barTrack, { backgroundColor: '#E5E7EB' }]} />;
  const color = score <= 33 ? '#F87171' : score <= 66 ? '#FBBF24' : '#22C55E';
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function AssessmentSummaryReport({ route, navigation }: any) {
  const [selectedStudent, setSelectedStudent] = useState(route?.params?.studentId || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prefTab, setPrefTab] = useState('Sensory Time');


  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await getAssessmentSummaryDashboard(selectedStudent);
        if (active) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Failed to load assessment summary dashboard', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { active = false; };
  }, [selectedStudent]);

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" onTabPress={(tab) => navigation?.navigate?.(PD_ROUTE_BY_TAB[tab] as never)} />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

    const mockStudents = data?.students || [];

  function handleDownload() {
    Alert.alert('Info', 'PDF export coming soon');
  }

  if (data?.notSelected) {
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
          <View style={[styles.selectRow, { zIndex: 10 }]}>
            <Text style={styles.selectLabel}>Select Student</Text>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity style={styles.dropdownToggle} onPress={() => setDropdownOpen(!dropdownOpen)}>
                <Text style={styles.dropdownToggleText}>
                  {mockStudents.find((s: any) => s.id === selectedStudent)?.name || 'Select a Student'}
                </Text>
              </TouchableOpacity>
              {dropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <TextInput style={styles.searchInput} placeholder="Search students..." placeholderTextColor={colors.mutedText} value={searchQuery} onChangeText={setSearchQuery} />
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                    {mockStudents.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((s: any) => (
                        <TouchableOpacity key={s.id} onPress={() => { setSelectedStudent(s.id); setDropdownOpen(false); setSearchQuery(''); }} style={[styles.dropdownItem, selectedStudent === s.id && styles.dropdownItemActive]}>
                          <Text style={[styles.dropdownItemText, selectedStudent === s.id && styles.dropdownItemTextActive]}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    {mockStudents.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <Text style={{ padding: 12, color: colors.mutedText, textAlign: 'center' }}>No students found.</Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 }}>
            <Text style={{ fontSize: 18, color: colors.mutedText, fontWeight: '600' }}>Select a student</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { studentInfo, ablls, abllsScores, behavior, preference, sensory, socialSkills } = data;

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

      <View style={[styles.selectRow, { zIndex: 10 }]}>
          <Text style={styles.selectLabel}>Select Student</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity 
              style={styles.dropdownToggle} 
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={styles.dropdownToggleText}>
                {mockStudents.find(s => s.id === selectedStudent)?.name || 'Select a Student'}
              </Text>
            </TouchableOpacity>
            
            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  placeholderTextColor={colors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                  {mockStudents
                    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(s => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => {
                          setSelectedStudent(s.id);
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        style={[styles.dropdownItem, selectedStudent === s.id && styles.dropdownItemActive]}
                      >
                        <Text style={[styles.dropdownItemText, selectedStudent === s.id && styles.dropdownItemTextActive]}>{s.name}</Text>
                      </TouchableOpacity>
                    ))}
                  {mockStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <Text style={{ padding: 12, color: colors.mutedText, textAlign: 'center' }}>No students found.</Text>
                  )}
                </ScrollView>
              </View>
            )}
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
          <InfoItem label="Parent / Guardian" value={studentInfo.parentGuardian} />
          <InfoItem label="Station" value={studentInfo.station} />
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
          
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.cardHeaderText, { marginBottom: 12, color: '#0F172A' }]}>ABLLS-R Skill Tracking Grid</Text>
            <AbllsGridView scores={abllsScores} />
          </View>
        </View>
      </View>

      {/* Behavior */}
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Behavior Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <SectionTitle title="Motivation Assessment Scale (MASS) - Q&A" />
          {MASS_ITEMS.map(item => (
            <View key={item.id} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                {item.id}. {item.text}
              </Text>
              <Text style={{ fontSize: 13, color: '#475569' }}>
                Answer: <Text style={{ fontWeight: '500', color: behavior.massAnswers?.[item.id] ? '#0284C7' : '#94A3B8' }}>{behavior.massAnswers?.[item.id] || 'Not answered'}</Text>
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <SectionTitle title="Functional Analysis Screening Tool (FAST) - Q&A" />
          {FAST_ITEMS.map(item => (
            <View key={item.id} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}>
                {item.id}. {item.text}
              </Text>
              <Text style={{ fontSize: 13, color: '#475569' }}>
                Answer: <Text style={{ fontWeight: '500', color: behavior.fastAnswers?.[item.id] ? '#0284C7' : '#94A3B8' }}>{behavior.fastAnswers?.[item.id] || 'Not answered'}</Text>
              </Text>
            </View>
          ))}

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
          <View style={radioStyles.row}>
            {['Sensory Time', 'Circle Time', 'Play Time'].map(tab => (
              <TouchableOpacity key={tab} style={radioStyles.radioBtn} onPress={() => setPrefTab(tab)}>
                <View style={[radioStyles.radioCircle, prefTab === tab && radioStyles.radioCircleSelected]}>
                  {prefTab === tab && <View style={radioStyles.radioDot} />}
                </View>
                <Text style={radioStyles.radioText}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TableHeader cols={['Rank', 'Preferred Item', 'Duration', 'Freq', 'Context', 'Engagement', 'Approach']} alignEnd={false} />
          {(preference?.items || []).map((item: any) => (
            <TableRow key={item.rank} values={[
              <Text key="r" style={[styles.tableCell, styles.tableBoldText]}>
                <View style={styles.rankCircle}><Text style={styles.rankText}>{item.rank}</Text></View>
              </Text>,
              <Text key="i" style={[styles.tableCell, styles.tableBoldText]}>{item.item}</Text>,
              <Text key="d" style={[styles.tableCell, styles.tableRight]}>{item.duration}</Text>,
              <Text key="f" style={[styles.tableCell, styles.tableRight]}>{item.frequency}x</Text>,
              <Text key="c" style={[styles.tableCell, { fontSize: 11, color: colors.mutedText }]}>{item.context}</Text>,
              <Text key="e" style={[styles.tableCell, { fontSize: 11 }]}>{item.engaged || 'N/A'}</Text>,
              <Text key="a" style={[styles.tableCell, { fontSize: 11 }]}>{item.approached || 'N/A'}</Text>
            ]} />
          ))}
        </View>
      </View>

            {/* Sensory */}
      {sensory && sensory.activities && sensory.activities.length > 0 && (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Sensory Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <TableHeader cols={['Activity', 'Engagement', 'Reaction', 'Notes']} alignEnd={false} />
           {sensory.activities.map((item: any, idx: number) => (
            <TableRow key={idx} values={[
              <Text key="n" style={styles.tableCell}>{item.name}</Text>,
              <Text key="e" style={styles.tableCell}>{item.engagementLevel || 'N/A'}</Text>,
              <Text key="r" style={styles.tableCell}>{item.responseReaction || 'N/A'}</Text>,
              <Text key="m" style={styles.tableCell}>{item.remark || 'N/A'}</Text>
            ]} />
          ))}
        </View>
      </View>
      )}

      {/* Social Skills */}
      {socialSkills && socialSkills.scores && Object.keys(socialSkills.scores).length > 0 && (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Social Skills Questionnaire</Text>
        </View>
        <View style={styles.cardBody}>
           <Text style={styles.subNote}>Completed: <Text style={styles.subNoteBold}>{socialSkills.percent}%</Text></Text>
           <TableHeader cols={['Question ID', 'Score']} alignEnd={false} />
           {Object.keys(socialSkills.scores).map((key: string) => (
             <TableRow key={key} values={[
               <Text key="k" style={styles.tableCell}>{key}</Text>,
               <Text key="v" style={styles.tableCell}>{socialSkills.scores[key]}</Text>
             ]} />
           ))}
        </View>
      </View>
      )}

      

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

const radioStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  radioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#0284C7' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284C7' },
  radioText: { fontSize: 13, color: '#334155' }
});

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

  dropdownToggle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dropdownToggleText: {
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1000,
  },
  searchInput: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#2563eb',
  },

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
