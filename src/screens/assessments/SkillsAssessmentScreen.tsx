import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  getSkillsAssessment,
  saveSkillsAssessment,
  bulkSaveAbllsResponses,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import DynamicFormFields from '../../components/DynamicFormFields';
import {
  DEFAULT_ABLLS_DOMAINS,
  buildAbllsDomainsFromConfig,
  saveStorageAssessment,
  loadStorageAssessment,
  type AbllsDomainDef,
  type Score,
} from './abllsConfigHelper';
import type { SessionStackParamList } from '../../types';
import { storage } from '../../utils/storage';
import { type StudentProfile } from './skills/types';
import { AbllsHeader, AbllsSkillCard, AbllsBottomBar } from './skills/components';

type Props = NativeStackScreenProps<SessionStackParamList, 'SkillsAssessment'>;

export default function SkillsAssessmentScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid = storage.getSync('last_assessment_student_id');
  const rawId = route?.params?.studentId || urlSid || localSid || 'student-a';
  const studentId = rawId === 'stu-1' ? 'student-a' : rawId;

  useEffect(() => {
    if (studentId) {
      storage.setSync('last_assessment_student_id', studentId);
    }
  }, [studentId]);

  const { showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentId, setAssessmentId] = useState<string>(studentId);
  const [activeDomain, setActiveDomain] = useState(0);
  const [domains, setDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res);
    } catch {
      setProfile(null);
    }
    try {
      const { data: cfg } = await getFormConfig('ABLLS Assessment Form');
      if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
        setDomains(buildAbllsDomainsFromConfig(cfg.fields));
      }
    } catch {
      setDomains(DEFAULT_ABLLS_DOMAINS);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      if (saved?.id || (saved as any)?.ablls_assessment?.id || (saved as any)?.assessment_id) {
        setAssessmentId(
          saved?.id || (saved as any)?.ablls_assessment?.id || (saved as any)?.assessment_id,
        );
      }
      const savedData = (saved?.data ?? saved ?? {}) as {
        scores?: Record<string, Score>;
        notes?: Record<string, string>;
        customFields?: Record<string, any>;
      };
      const apiScores = savedData.scores ?? (saved as any)?.scores ?? {};
      const localData = loadStorageAssessment(studentId);
      const mergedScores = { ...apiScores, ...(localData?.scores ?? {}) };
      const mergedNotes = { ...(savedData.notes ?? {}), ...(localData?.notes ?? {}) };
      const mergedCustomFields = {
        ...(savedData.customFields ?? {}),
        ...(localData?.customFields ?? {}),
      };
      setScores(mergedScores);
      if (Object.keys(mergedNotes).length > 0) setNotes(mergedNotes);
      if (Object.keys(mergedCustomFields).length > 0) setCustomFields(mergedCustomFields);
    } catch {
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
    }, [load]),
  );

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = domains.reduce((sum, d) => sum + d.items.length, 0);
  const totalAnswered = Object.keys(scores).length;

  const persistBulkResponses = useCallback(
    (
      updatedScores: Record<string, Score>,
      updatedNotes: Record<string, string>,
      status = 'in_progress',
    ) => {
      saveStorageAssessment(studentId, {
        scores: updatedScores,
        notes: updatedNotes,
        customFields,
      });
      const formattedResponses = Object.entries(updatedScores).map(([k, v]) => ({
        skill_item_id: k,
        score: String(v),
        note: updatedNotes[k] || undefined,
      }));
      const targetId = assessmentId || studentId;
      bulkSaveAbllsResponses(targetId, {
        responses: formattedResponses,
        scores: updatedScores,
        notes: updatedNotes,
      }).catch((err) => {
        console.warn('Failed to auto-save ABLLS responses:', err);
      });
      saveSkillsAssessment(studentId, {
        scores: updatedScores,
        notes: updatedNotes,
        customFields,
        status,
      }).catch((err) => {
        console.warn('Failed to auto-save skills assessment:', err);
      });
    },
    [assessmentId, studentId, customFields],
  );

  useEffect(() => {
    if (totalAnswered === 0 && Object.keys(notes).length === 0) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const allAnswered = totalItems > 0 && totalAnswered >= totalItems;
      const status = allAnswered ? 'completed' : 'in_progress';
      persistBulkResponses(scores, notes, status);
    }, 400);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [scores, notes, customFields, studentId, totalAnswered, totalItems, persistBulkResponses]);

  if (loading) return <ScreenLoader />;

  const domain = domains[activeDomain] || domains[0];
  const studentName = profile?.fullName || 'Student A';

  const domainTotalItems = domain?.items?.length ?? 0;
  const domainAnswered = (domain?.items ?? []).filter((i) => scores[i.id] !== undefined).length;

  const setScore = (itemId: string, score: Score) => {
    const updated = { ...scores, [itemId]: score };
    setScores(updated);
    const allAnswered = totalItems > 0 && Object.keys(updated).length >= totalItems;
    const status = allAnswered ? 'completed' : 'in_progress';
    persistBulkResponses(updated, notes, status);
  };

  const handleNotesChange = (itemId: string, text: string) => {
    const updatedNotes = { ...notes, [itemId]: text };
    setNotes(updatedNotes);
    saveStorageAssessment(studentId, { scores, notes: updatedNotes, customFields });
  };

  const handleSaveDraft = async () => {
    try {
      const allAnswered = totalItems > 0 && totalAnswered >= totalItems;
      const status = allAnswered ? 'completed' : 'in_progress';
      saveStorageAssessment(studentId, { scores, notes, customFields });
      const formattedResponses = Object.entries(scores).map(([k, v]) => ({
        skill_item_id: k,
        score: String(v),
        note: notes[k] || undefined,
      }));
      const targetId = assessmentId || studentId;
      await bulkSaveAbllsResponses(targetId, {
        responses: formattedResponses,
        scores,
        notes,
      });
      await saveSkillsAssessment(studentId, { scores, notes, customFields, status });
      showToast(
        allAnswered
          ? `${studentName} ABLLS assessment completed!`
          : `${studentName} ABLLS assessment draft saved.`,
        'success',
      );
    } catch {
      showToast('Failed to save assessment draft', 'error');
    }
  };

  const openNeedMap = async () => {
    saveStorageAssessment(studentId, { scores, notes, customFields });
    try {
      await saveSkillsAssessment(studentId, { scores, notes, customFields });
    } catch (err) {
      console.warn('Failed to save assessment before navigating to Need Map:', err);
    }
    navigation?.navigate?.('AbllsNeedMap', { studentId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
        <AbllsHeader
          onBack={() => navigation?.goBack?.()}
          profile={profile}
          domains={domains}
          activeDomain={activeDomain}
          onSelectDomain={setActiveDomain}
          domainAnswered={domainAnswered}
          domainTotalItems={domainTotalItems}
        />

        <View style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.content}>
            {(domain?.items ?? []).map((item) => (
              <AbllsSkillCard
                key={item.id}
                item={item}
                score={scores[item.id]}
                onSelectScore={(score) => setScore(item.id, score)}
                note={notes[item.id] || ''}
                onNoteChange={(t) => handleNotesChange(item.id, t)}
              />
            ))}

            <DynamicFormFields
              formName="ABLLS Assessment Form"
              values={customFields}
              onChange={(key, val) => setCustomFields((prev) => ({ ...prev, [key]: val }))}
              excludeStandardLabels={['Assessment Date', 'Assessor Name']}
              section="General"
            />
          </ScrollView>

          <AbllsBottomBar onSaveDraft={handleSaveDraft} onOpenNeedMap={openNeedMap} />
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
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  tabletWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
});
