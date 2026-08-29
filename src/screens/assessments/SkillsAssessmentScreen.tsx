import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getSkillsAssessment, saveSkillsAssessment, getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import DynamicFormFields from '../../components/DynamicFormFields';
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
  0: '#EF4444',
  1: '#EAB308',
  2: '#22C55E',
  NA: '#94A3B8',
};

const SCORE_LABEL: Record<Score, string> = {
  0: '0 — Not Demonstrated',
  1: '1 — Emerging',
  2: '2 — Mastered',
  NA: 'N/A',
};

const ABLLS_DOMAINS: AbllsDomain[] = [
  {
    name: 'Visual Performance',
    items: [
      { id: 'A1', description: 'Matches identical objects' },
      { id: 'A2', description: 'Matches identical pictures to objects' },
      { id: 'A3', description: 'Matches non-identical pictures' },
      { id: 'A4', description: 'Sorts by color and shape' },
      { id: 'A5', description: 'Completes simple puzzle (4 pieces)' },
      { id: 'A6', description: 'Matches shapes (circle, square, triangle)' },
      { id: 'A7', description: 'Selects named object from array of 3' },
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
];

type Props = NativeStackScreenProps<SessionStackParamList, 'SkillsAssessment'>;

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

export default function SkillsAssessmentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState(0);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch (err) {
      setProfile(null);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      const savedData = (saved?.data ?? {}) as { scores?: Record<string, Score>; notes?: Record<string, string> };
      if (savedData.scores) setScores(savedData.scores);
      if (savedData.notes) setNotes(savedData.notes);
    } catch (err) {
      setScores({});
      setNotes({});
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = ABLLS_DOMAINS.reduce((sum, d) => sum + d.items.length, 0);
  const totalAnswered = Object.keys(scores).length;

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

  if (loading) return <ScreenLoader />;

  const domain = ABLLS_DOMAINS[activeDomain];
  const studentName = profile?.fullName || 'Student A';
  const studentInitials = studentName.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase();

  const domainTotalItems = domain.items.length;
  const domainAnswered = domain.items.filter((i) => scores[i.id] !== undefined).length;
  const domainProgress = domainTotalItems === 0 ? 0 : Math.round((domainAnswered / domainTotalItems) * 100);

  const setScore = (itemId: string, score: Score) =>
    setScores((prev) => ({ ...prev, [itemId]: score }));

  const handleSaveDraft = async () => {
    try {
      await saveSkillsAssessment(studentId, { scores, notes });
      showToast(`${studentName} ABLLS assessment draft saved.`, 'success');
    } catch (err) {
      showToast('Failed to save assessment draft', 'error');
    }
  };

  const openNeedMap = () => navigation?.navigate?.('AbllsNeedMap', { studentId });

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      {/* Header Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABLLS-R Assessment</Text>
        </View>

        {/* Student Profile Row */}
        <View style={styles.studentRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{studentInitials}</Text>
          </View>
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentAge}>Age {profile?.age ?? '—'}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>In Assessment</Text>
              </View>
            </View>
            <Text style={styles.stationText}>Station A</Text>
          </View>
        </View>

        {/* Key / Legend */}
        <View style={styles.keyRow}>
          <Text style={styles.keyLabel}>KEY:</Text>
          {SCORES.map((s) => (
            <View key={String(s)} style={styles.keyItem}>
              <View style={[styles.keyDot, { backgroundColor: SCORE_COLOR[s] }]} />
              <Text style={styles.keyText}>{SCORE_LABEL[s]}</Text>
            </View>
          ))}
        </View>

        {/* Domain Tabs Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {ABLLS_DOMAINS.map((d, idx) => (
            <TouchableOpacity
              key={d.name}
              style={[styles.tab, activeDomain === idx && styles.tabActive]}
              onPress={() => setActiveDomain(idx)}
            >
              <Text style={[styles.tabText, activeDomain === idx && styles.tabTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Domain Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${domainProgress}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{domainProgress}%</Text>
        </View>
        <Text style={styles.progressSubtext}>
          {domainAnswered} of {domainTotalItems} items scored in {domain.name}
        </Text>
      </View>

      {/* Scrollable card area + pinned bottom bar in a flex column */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {domain.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTitleRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.id}</Text>
                </View>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>

              {/* Score Selector Options */}
              <View style={styles.scoreRow}>
                {SCORES.map((s) => {
                  const selected = scores[item.id] === s;
                  return (
                    <TouchableOpacity
                      key={String(s)}
                      style={[
                        styles.scoreBtn,
                        { borderColor: SCORE_COLOR[s] },
                        selected && { backgroundColor: SCORE_COLOR[s] },
                      ]}
                      onPress={() => setScore(item.id, s)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.scoreBtnText,
                          { color: SCORE_COLOR[s] },
                          selected && styles.scoreBtnTextActive,
                        ]}
                      >
                        {s === 'NA' ? 'N/A' : SCORE_LABEL[s]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes Input */}
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                placeholderTextColor="#94A3B8"
                value={notes[item.id] || ''}
                onChangeText={(t) => setNotes((prev) => ({ ...prev, [item.id]: t }))}
              />
            </View>
          ))}

          <DynamicFormFields
            formName="ABLLS Assessment Form"
            values={customFields}
            onChange={(key, val) => setCustomFields((prev) => ({ ...prev, [key]: val }))}
            excludeStandardLabels={['Assessment Date', 'Assessor Name']}
          />
        </ScrollView>

        {/* Bottom Action Bar — sits at the bottom of the flex column, always tappable */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveDraftBtn} onPress={handleSaveDraft}>
            <Feather name="file-text" size={16} color="#0F172A" />
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.needMapBtn} onPress={openNeedMap}>
            <Feather name="bar-chart-2" size={16} color="#0F172A" />
            <Text style={styles.needMapText}>View Need Analysis Map</Text>
            <Feather name="chevron-right" size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>
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
    marginTop: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  statusPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
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
    marginTop: 12,
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
  tabsScroll: {
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0EA5E9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0EA5E9',
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#38BDF8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  scoreBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreBtnTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveDraftBtn: {
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
  saveDraftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  needMapBtn: {
    flex: 2,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  needMapText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});