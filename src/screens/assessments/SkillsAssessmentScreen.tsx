import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { saveSkillsAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Score = 0 | 1 | 2 | 'NA';
const SCORES: Score[] = [0, 1, 2, 'NA'];

interface AbllsItem {
  id: string;
  description: string;
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

const ABLLS_DOMAINS: AbllsDomain[] = [
  {
    name: 'Visual Performance',
    items: [
      { id: 'A1', description: 'Matching identical objects' },
      { id: 'A2', description: 'Matching pictures' },
      { id: 'A3', description: 'Sorting by color' },
      { id: 'A4', description: 'Puzzle completion' },
      { id: 'A5', description: 'Receptive identification' },
    ],
  },
  {
    name: 'Motor Imitation',
    items: [
      { id: 'B1', description: 'Gross motor imitation' },
      { id: 'B2', description: 'Fine motor imitation' },
      { id: 'B3', description: 'Imitation with objects' },
      { id: 'B4', description: 'Sequential imitation' },
    ],
  },
  {
    name: 'Vocal Imitation',
    items: [
      { id: 'C1', description: 'Imitation of vowel sounds' },
      { id: 'C2', description: 'Imitation of consonant sounds' },
      { id: 'C3', description: 'Imitation of words' },
      { id: 'C4', description: 'Imitation of phrases' },
    ],
  },
  {
    name: 'Receptive Language',
    items: [
      { id: 'D1', description: 'Responds to own name' },
      { id: 'D2', description: 'Follows simple commands' },
      { id: 'D3', description: 'Identifies body parts' },
      { id: 'D4', description: 'Answers yes/no questions' },
    ],
  },
  {
    name: 'Requesting',
    items: [
      { id: 'E1', description: 'Requests preferred item' },
      { id: 'E2', description: 'Requests missing item' },
      { id: 'E3', description: 'Requests help' },
      { id: 'E4', description: 'Requests information' },
    ],
  },
  {
    name: 'Play and Leisure',
    items: [
      { id: 'F1', description: 'Plays independently' },
      { id: 'F2', description: 'Engages in parallel play' },
      { id: 'F3', description: 'Turns taking with peers' },
      { id: 'F4', description: 'Initiates play with peers' },
    ],
  },
  {
    name: 'Social Interaction',
    items: [
      { id: 'G1', description: 'Responds to greetings' },
      { id: 'G2', description: 'Initiates greetings' },
      { id: 'G3', description: 'Shares attention' },
      { id: 'G4', description: 'Engages in group activities' },
    ],
  },
  {
    name: 'Writing',
    items: [
      { id: 'H1', description: 'Holds writing tool' },
      { id: 'H2', description: 'Traces lines and shapes' },
      { id: 'H3', description: 'Writes letters' },
      { id: 'H4', description: 'Writes name' },
    ],
  },
  {
    name: 'Dressing',
    items: [
      { id: 'I1', description: 'Removes shoes and socks' },
      { id: 'I2', description: 'Puts on shirt' },
      { id: 'I3', description: 'Fastens buttons' },
      { id: 'I4', description: 'Ties shoelaces' },
    ],
  },
];

const DEMO_STUDENT_NAME: Record<string, string> = {
  'student-a': 'Student A',
  'student-b': 'Student B',
  'student-c': 'Student C',
};

type Props = NativeStackScreenProps<SessionStackParamList, 'SkillsAssessment'>;

export default function SkillsAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const [activeDomain, setActiveDomain] = useState(0);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const domain = ABLLS_DOMAINS[activeDomain];
  const studentName = DEMO_STUDENT_NAME[studentId] || 'Student';

  const domainTotalItems = domain.items.length;
  const domainAnswered = domain.items.filter((i) => scores[i.id] !== undefined).length;
  const domainProgress = domainTotalItems === 0 ? 0 : Math.round((domainAnswered / domainTotalItems) * 100);

  const totalItems = ABLLS_DOMAINS.reduce((sum, d) => sum + d.items.length, 0);
  const totalAnswered = Object.keys(scores).length;
  const overallProgress = totalItems === 0 ? 0 : Math.round((totalAnswered / totalItems) * 100);

  const setScore = (itemId: string, score: Score) => setScores((prev) => ({ ...prev, [itemId]: score }));

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (totalAnswered === 0 && Object.keys(notes).length === 0) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveSkillsAssessment(studentId, { scores, notes }).catch(() => {});
    }, 900);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [scores, notes, studentId, totalAnswered]);

  const handleSave = async () => {
    try {
      await saveSkillsAssessment(studentId, { scores, notes });
    } catch (err) {}
    Alert.alert('Assessment saved', `${studentName} ABLLS assessment saved (${overallProgress}% complete).`, [
      { text: 'Done', onPress: () => navigation?.goBack?.() },
    ]);
  };

  const openNeedMap = () => navigation?.navigate?.('AbllsNeedMap', { studentId });

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="check-square" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Skills Assessment</Text>
            <Text style={typography.caption}>SCR-TEA-002 — ABLLS · {studentName} · Age 6 · In Assessment</Text>
          </View>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{overallProgress}% scored</Text>
        </View>
      </View>

      <View style={styles.legendRow}>
        {SCORES.map((s) => (
          <View key={String(s)} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SCORE_COLOR[s] }]} />
            <Text style={typography.caption}>{SCORE_LABEL[s]} = {SCORE_MEANING[s]}</Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {ABLLS_DOMAINS.map((d, idx) => (
          <TouchableOpacity key={d.name} style={[styles.tab, activeDomain === idx && styles.tabActive]} onPress={() => setActiveDomain(idx)}>
            <Text style={[styles.tabText, activeDomain === idx && styles.tabTextActive]}>{d.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressBlock}>
          <View style={styles.progressHeaderRow}>
            <Text style={typography.bodyBold}>{domain.name}</Text>
            <Text style={typography.caption}>{domainAnswered}/{domainTotalItems} scored</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${domainProgress}%` }]} />
          </View>
        </View>

        <View style={styles.card}>
          {domain.items.map((item) => (
            <View key={item.id} style={styles.itemBlock}>
              <View style={styles.itemIdRow}>
                <View style={styles.itemIdBadge}>
                  <Text style={styles.itemIdText}>{item.id}</Text>
                </View>
                <Text style={[typography.body, { flex: 1 }]}>{item.description}</Text>
              </View>

              <View style={styles.scoreRow}>
                {SCORES.map((s) => {
                  const selected = scores[item.id] === s;
                  return (
                    <TouchableOpacity
                      key={String(s)}
                      style={[styles.scoreBtn, selected && { backgroundColor: SCORE_COLOR[s], borderColor: SCORE_COLOR[s] }]}
                      onPress={() => setScore(item.id, s)}
                    >
                      <Text style={[styles.scoreBtnText, { color: SCORE_COLOR[s] }, selected && styles.scoreBtnTextActive]}>{SCORE_LABEL[s]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Notes for this skill..."
                placeholderTextColor={colors.mutedText}
                value={notes[item.id] || ''}
                onChangeText={(t) => setNotes((prev) => ({ ...prev, [item.id]: t }))}
              />
            </View>
          ))}
        </View>

        <View style={styles.mapRow}>
          <TouchableOpacity style={styles.mapBtn} onPress={openNeedMap}>
            <Feather name="grid" size={14} color={colors.navyText} />
            <Text style={styles.mapBtnText}>View Need Analysis Map</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.saveBtnText}>Save Assessment</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, flexWrap: 'wrap', gap: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressPill: { backgroundColor: colors.statusInProgressBg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  progressPillText: { fontSize: 12, fontWeight: '700', color: colors.statusInProgressText },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, backgroundColor: colors.bgCard, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  tabsScroll: { flexGrow: 0, backgroundColor: colors.bgCard },
  tabsRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgApp },
  tabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  tabTextActive: { fontWeight: '700', color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.lg },
  progressBlock: { gap: spacing.sm },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgCard, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.primaryYellow, borderRadius: radius.pill },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  itemBlock: { gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  itemIdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIdBadge: { backgroundColor: colors.navyText, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, minWidth: 34, alignItems: 'center' },
  itemIdText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  scoreRow: { flexDirection: 'row', gap: spacing.sm },
  scoreBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.bgApp, maxWidth: 64 },
  scoreBtnText: { fontSize: 12, fontWeight: '700' },
  scoreBtnTextActive: { color: colors.white },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, color: colors.navyText, backgroundColor: colors.bgApp, fontSize: 12 },
  mapRow: { flexDirection: 'row' },
  mapBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignSelf: 'flex-start' },
  mapBtnText: { fontWeight: '700', color: colors.primaryYellowDark },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});