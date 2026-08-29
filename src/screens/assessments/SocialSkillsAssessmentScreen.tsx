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
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'SocialSkillsAssessment'>;

type Score = 0 | 1 | 2 | 3;
const SCORES: Score[] = [0, 1, 2, 3];

const SCORE_LABEL: Record<Score, string> = {
  0: 'Never',
  1: 'Sometimes',
  2: 'Often',
  3: 'Always',
};

interface Question {
  id: string;
  text: string;
}

const QUESTIONS: Question[] = [
  { id: 'q1', text: 'Initiates interactions with peers without prompting' },
  { id: 'q2', text: 'Maintains eye contact during conversations' },
  { id: 'q3', text: 'Takes turns during play or group activities' },
  { id: 'q4', text: 'Responds appropriately to greetings' },
  { id: 'q5', text: 'Shares materials or toys with others' },
  { id: 'q6', text: 'Recognizes and respects personal space' },
  { id: 'q7', text: 'Uses polite language (please, thank you, sorry)' },
  { id: 'q8', text: 'Joins group activities without hesitation' },
  { id: 'q9', text: 'Identifies others’ emotions accurately' },
  { id: 'q10', text: 'Resolves minor conflicts with words' },
];

export default function SocialSkillsAssessmentScreen({ route, navigation }: Props) {
  const studentId = route.params?.studentId ?? 'student-a';
  const { showToast } = useToast();
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const answered = Object.keys(scores).length;
  const totalScore = Object.values(scores).reduce<number>((a, b) => a + b, 0);
  const maxScore = QUESTIONS.length * 3;
  const percent = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;

  const setScore = (id: string, value: Score) =>
    setScores((prev) => ({ ...prev, [id]: value }));

  const handleSave = async () => {
    if (answered < QUESTIONS.length) {
      Alert.alert(
        'Incomplete',
        `Please answer all ${QUESTIONS.length} questions (${answered} answered).`
      );
      return;
    }
    setSaving(true);
    try {
      // Demo: persist locally; wire to backend when endpoint is available.
      await new Promise((r) => setTimeout(r, 300));
      showToast(`Social Skills Questionnaire saved (${percent}%)`, 'success');
      navigation?.goBack?.();
    } catch (err) {
      showToast('Failed to save questionnaire', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Session"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color={colors.navyText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={typography.h1}>Social Skills Questionnaire</Text>
        <Text style={typography.body}>
          Student: {studentId === 'student-b' ? 'Student B' : 'Student A'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>
            Progress: {answered}/{QUESTIONS.length} · Score {percent}%
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>

        {QUESTIONS.map((q, idx) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {idx + 1}. {q.text}
            </Text>
            <View style={styles.scoreRow}>
              {SCORES.map((s) => {
                const selected = scores[q.id] === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.scoreBtn,
                      selected && styles.scoreBtnActive,
                    ]}
                    onPress={() => setScore(q.id, s)}
                  >
                    <Text
                      style={[
                        styles.scoreBtnText,
                        selected && styles.scoreBtnTextActive,
                      ]}
                    >
                      {SCORE_LABEL[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <DynamicFormFields
          formName="Social Skills Questionnaire"
          values={customValues}
          onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
          excludeStandardLabels={['Student Name']}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving…' : 'Save Questionnaire'}
          </Text>
        </TouchableOpacity>
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
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: colors.navyText, fontSize: 14, fontWeight: '500' },
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
  questionText: { fontSize: 14, fontWeight: '600', color: colors.navyText },
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
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
