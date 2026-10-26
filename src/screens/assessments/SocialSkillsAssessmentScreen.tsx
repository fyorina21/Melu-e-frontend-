import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { useToast } from '../../context/ToastContext';
import {
  getTeacherStudentProfile,
  saveSocialSkillsAssessment,
  getSocialSkillsAssessment,
} from '../../api/teacherExtrasApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import { useEffect } from 'react';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SocialSkillsAssessment'>;

type Score = number;
const SCORES: Score[] = [0, 1, 2, 3];

const SCORE_LABEL: Record<number, string> = {
  0: 'Never',
  1: 'Sometimes',
  2: 'Often',
  3: 'Always',
};

interface Question {
  id: string;
  text: string;
  section?: string;
  options?: string[];
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Initiates interactions with peers without prompting',
    section: 'Social Interaction',
  },
  { id: 'q2', text: 'Maintains eye contact during conversations', section: 'Communication' },
  { id: 'q3', text: 'Takes turns during play or group activities', section: 'Social Interaction' },
  { id: 'q4', text: 'Responds appropriately to greetings', section: 'Communication' },
  { id: 'q5', text: 'Shares materials or toys with others', section: 'Social Interaction' },
  { id: 'q6', text: 'Recognizes and respects personal space', section: 'Social Interaction' },
  { id: 'q7', text: 'Uses polite language (please, thank you, sorry)', section: 'Communication' },
  { id: 'q8', text: 'Joins group activities without hesitation', section: 'Social Interaction' },
  { id: 'q9', text: 'Identifies others’ emotions accurately', section: 'Social Interaction' },
  { id: 'q10', text: 'Resolves minor conflicts with words', section: 'Communication' },
];

export default function SocialSkillsAssessmentScreen({ route, navigation }: Props) {
  const studentId = route.params?.studentId ?? 'student-a';
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const loadQuestions = React.useCallback(async () => {
    try {
      const { data } = await getFormConfig('Social Skills Questionnaire');
      if (data && Array.isArray(data.fields) && data.fields.length > 0) {
        const visibleFields = data.fields.filter((f: any) => f.visible !== false);
        setQuestions(
          visibleFields.map((f: any) => ({
            id: String(f.id),
            text: String(f.label || f.text || 'Question'),
            section: f.section,
            options: Array.isArray(f.options) && f.options.length > 0 ? f.options : undefined,
          })),
        );
        return;
      }
    } catch {}
    setQuestions(DEFAULT_QUESTIONS);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    const handler = (e: any) => {
      const name = (e?.detail?.formName || '').toLowerCase();
      if (name.includes('social')) {
        const cfg = e.detail?.config;
        if (cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
          const visibleFields = cfg.fields.filter((f: any) => f.visible !== false);
          setQuestions(
            visibleFields.map((f: any) => ({
              id: String(f.id),
              text: String(f.label || f.text || 'Question'),
              section: f.section,
              options: Array.isArray(f.options) && f.options.length > 0 ? f.options : undefined,
            })),
          );
        } else {
          loadQuestions();
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', handler);
      return () => window.removeEventListener('melue_form_config_changed', handler);
    }
  }, [loadQuestions]);

  const answered = Object.keys(scores).length;
  useEffect(() => {
    getTeacherStudentProfile(studentId)
      .then((res) => {
        if (res?.data) setProfile(res.data);
      })
      .catch(() => {});
    getSocialSkillsAssessment(studentId)
      .then((res) => {
        if (res?.data?.data) {
          if (res.data.data.scores) setScores(res.data.data.scores);
          if (res.data.data.customValues) setCustomValues(res.data.data.customValues);
        }
      })
      .catch(() => {});
  }, [studentId]);
  const totalScore = Object.values(scores).reduce<number>((a, b) => a + b, 0);
  const maxScore = questions.reduce<number>((sum, q) => sum + ((q.options?.length || 4) - 1), 0);
  const percent = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;

  const setScore = (id: string, value: Score) => setScores((prev) => ({ ...prev, [id]: value }));

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveSocialSkillsAssessment(studentId, {
        scores,
        customValues,
        percent,
        status: 'draft',
      });
      showToast('Social Skills Questionnaire draft saved', 'success');
    } catch (err) {
      showToast('Failed to save questionnaire draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSocialSkillsAssessment(studentId, {
        scores,
        customValues,
        percent,
        status: 'submitted',
      });
      showToast(`Social Skills Questionnaire submitted (${percent}%)`, 'success');
      navigation?.goBack?.();
    } catch (err) {
      showToast('Failed to save questionnaire', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Session" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color={colors.navyText} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editFormBtn}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/FormBuilder?form=Social+Skills+Questionnaire';
              } else if (navigation?.navigate) {
                (navigation.navigate as any)('FormBuilder', {
                  form: 'Social Skills Questionnaire',
                });
              }
            }}
          >
            <Feather name="edit-3" size={13} color="#2563EB" />
            <Text style={styles.editFormBtnText}>Edit in Form Builder</Text>
          </TouchableOpacity>
        </View>
        <Text style={typography.h1}>Social Skills Questionnaire</Text>
        <Text style={typography.body}>Student: {profile?.fullName || 'Student'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>
            Progress: {answered}/{questions.length} · Score {percent}%
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        {questions.map((q, idx) => {
          const itemOptions =
            q.options && q.options.length > 0
              ? q.options
              : ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'];

          return (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.questionHeaderRow}>
                <Text style={styles.questionText}>
                  {idx + 1}. {q.text}
                </Text>
                {q.section && (
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{q.section}</Text>
                  </View>
                )}
              </View>
              <View style={styles.scoreRow}>
                {itemOptions.map((opt, sIdx) => {
                  const selected = scores[q.id] === sIdx;
                  const displayLabel = opt.includes('—') ? opt.split('—')[1].trim() : opt;
                  return (
                    <TouchableOpacity
                      key={sIdx}
                      style={[styles.scoreBtn, selected && styles.scoreBtnActive]}
                      onPress={() => setScore(q.id, sIdx)}
                    >
                      <Text style={[styles.scoreBtnText, selected && styles.scoreBtnTextActive]}>
                        {displayLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <DynamicFormFields
          formName="Social Skills Questionnaire"
          values={customValues}
          onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
          excludeStandardLabels={[
            'Student Name',
            ...questions.map((q) => q.text),
            ...questions.map((q) => q.id),
          ]}
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.draftBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            <Text style={styles.draftBtnText}>{saving ? 'Saving…' : 'Save Draft'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Submit Questionnaire'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: colors.navyText, fontSize: 14, fontWeight: '500' },
  editFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editFormBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  content: { padding: spacing.lg, gap: spacing.md },
  progressBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressLabel: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.bgApp,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: colors.primaryYellowDark },
  questionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  questionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  questionText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.navyText },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  scoreRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  scoreBtn: {
    flex: 1,
    minWidth: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  scoreBtnActive: {
    borderColor: colors.primaryYellowDark,
    backgroundColor: colors.primaryYellow,
  },
  scoreBtnText: { fontSize: 12, fontWeight: '600', color: colors.mutedText },
  scoreBtnTextActive: { color: colors.navyText },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  draftBtnText: {
    fontWeight: '600',
    color: colors.navyText,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
