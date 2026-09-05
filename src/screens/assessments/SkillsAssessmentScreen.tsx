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
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getSkillsAssessment, saveSkillsAssessment, getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import DynamicFormFields from '../../components/DynamicFormFields';
import {
  DEFAULT_ABLLS_DOMAINS,
  buildAbllsDomainsFromConfig,
  getItemScoreOptions,
  saveStorageAssessment,
  loadStorageAssessment,
  SCORE_COLOR,
  SCORE_LABEL,
  type AbllsDomainDef,
  type Score,
} from './abllsConfigHelper';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SkillsAssessment'>;

interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

export default function SkillsAssessmentScreen({ navigation, route }: Props) {
  const urlSid = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('studentId') : null;
  const localSid = typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  useEffect(() => {
    if (typeof localStorage !== 'undefined' && studentId) {
      try {
        localStorage.setItem('last_assessment_student_id', studentId);
      } catch {}
    }
  }, [studentId]);

  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState(0);
  const [domains, setDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
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
      const { data: cfg } = await getFormConfig('ABLLS Assessment Form');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        setDomains(buildAbllsDomainsFromConfig(cfg.fields));
      }
    } catch (err) {
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
      const mergedScores = { ...apiScores, ...(localData?.scores ?? {}) };
      const mergedNotes = { ...(savedData.notes ?? {}), ...(localData?.notes ?? {}) };
      const mergedCustomFields = { ...(savedData.customFields ?? {}), ...(localData?.customFields ?? {}) };
      setScores(mergedScores);
      if (Object.keys(mergedNotes).length > 0) setNotes(mergedNotes);
      if (Object.keys(mergedCustomFields).length > 0) setCustomFields(mergedCustomFields);
    } catch (err) {
      const localData = loadStorageAssessment(studentId);
      if (localData?.scores) setScores(localData.scores);
      else setScores({});
      if (localData?.notes) setNotes(localData.notes);
      else setNotes({});
    }
    setLoading(false);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = domains.reduce((sum, d) => sum + d.items.length, 0);
  const totalAnswered = Object.keys(scores).length;

  useEffect(() => {
    if (totalAnswered === 0 && Object.keys(notes).length === 0) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveStorageAssessment(studentId, { scores, notes, customFields });
      saveSkillsAssessment(studentId, { scores, notes, customFields }).catch(() => {});
    }, 400);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [scores, notes, customFields, studentId, totalAnswered]);

  if (loading) return <ScreenLoader />;

  const domain = domains[activeDomain] || domains[0];
  const studentName = profile?.fullName || 'Student A';
  const studentInitials = studentName.split(' ').map((p) => p.charAt(0)).join('').slice(0, 2).toUpperCase();

  const domainTotalItems = domain?.items?.length ?? 0;
  const domainAnswered = (domain?.items ?? []).filter((i) => scores[i.id] !== undefined).length;
  const domainProgress = domainTotalItems === 0 ? 0 : Math.round((domainAnswered / domainTotalItems) * 100);

  const setScore = (itemId: string, score: Score) => {
    const updated = { ...scores, [itemId]: score };
    setScores(updated);
    saveStorageAssessment(studentId, { scores: updated, notes, customFields });
    saveSkillsAssessment(studentId, { scores: updated, notes, customFields }).catch(() => {});
  };

  const handleNotesChange = (itemId: string, text: string) => {
    const updatedNotes = { ...notes, [itemId]: text };
    setNotes(updatedNotes);
    saveStorageAssessment(studentId, { scores, notes: updatedNotes, customFields });
  };

  const handleSaveDraft = async () => {
    try {
      saveStorageAssessment(studentId, { scores, notes, customFields });
      await saveSkillsAssessment(studentId, { scores, notes, customFields });
      showToast(`${studentName} ABLLS assessment saved successfully.`, 'success');
    } catch (err) {
      showToast('Failed to save assessment draft', 'error');
    }
  };

  const openNeedMap = async () => {
    saveStorageAssessment(studentId, { scores, notes, customFields });
    try {
      await saveSkillsAssessment(studentId, { scores, notes, customFields });
    } catch (err) {}
    navigation?.navigate?.('AbllsNeedMap', { studentId });
  };

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


        {/* Domain Tabs Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {domains.map((d, idx) => (
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

              {/* Score Selector Options — Numbers only; N/A omitted if only 2 options */}
              <View style={styles.scoreRow}>
                {getItemScoreOptions(item).map((opt) => {
                  const s = opt.score;
                  const selected = scores[item.id] === s;
                  const color = opt.color;

                  return (
                    <TouchableOpacity
                      key={`${item.id}-${opt.label}`}
                      style={[
                        styles.scoreBtn,
                        { borderColor: color },
                        selected && { backgroundColor: color },
                      ]}
                      onPress={() => setScore(item.id, s)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.scoreBtnText,
                          { color: selected ? '#FFFFFF' : color },
                          selected && styles.scoreBtnTextActive,
                        ]}
                      >
                        {opt.label}
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
                onChangeText={(t) => handleNotesChange(item.id, t)}
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
    borderWidth: 1.5,
    borderRadius: 8,
    minWidth: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  scoreBtnText: {
    fontSize: 14,
    fontWeight: '700',
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