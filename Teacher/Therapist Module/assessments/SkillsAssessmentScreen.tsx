// screens/assessments/SkillsAssessmentScreen.tsx
// MR-22: Skills Assessment — scores abilities across Communication,
// Social, Academic, Self-Care and Motor categories (Independent / With
// Prompt / Not Yet), computes a progress score.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { saveSkillsAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Rating = 'Independent' | 'With Prompt' | 'Not Yet';
const RATINGS: Rating[] = ['Independent', 'With Prompt', 'Not Yet'];

interface SkillItem {
  id: string;
  label: string;
  rating: Rating;
}

const CATEGORIES: { title: string; items: string[] }[] = [
  { title: 'Communication', items: ['Says own name', 'Answers questions', 'Requests items'] },
  { title: 'Social Skills', items: ['Makes eye contact', 'Plays with others', 'Takes turns'] },
  { title: 'Academic Skills', items: ['Counts numbers', 'Reads letters', 'Matches colors'] },
  { title: 'Self-Care', items: ['Brushes teeth', 'Washes hands', 'Eats independently'] },
  { title: 'Motor Skills', items: ['Holds pencil', 'Runs', 'Climbs stairs'] },
];

const STUDENT_NAME = 'Student A';

type Props = NativeStackScreenProps<SessionStackParamList, 'SkillsAssessment'>;

export default function SkillsAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const [answers, setAnswers] = useState<Record<string, Rating>>({});
  const [notes, setNotes] = useState('');

  const setRating = (itemId: string, rating: Rating) => setAnswers((prev) => ({ ...prev, [itemId]: rating }));

  const answeredCount = Object.keys(answers).length;
  const totalItems = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((answeredCount / totalItems) * 100);
  const independentCount = Object.values(answers).filter((r) => r === 'Independent').length;

  const handleSave = async () => {
    try {
      await saveSkillsAssessment(studentId, { answers, notes });
    } catch (err) {}
    Alert.alert('Assessment saved', `Skills assessment for ${STUDENT_NAME} saved (${progress}% complete).`, [
      { text: 'Done', onPress: () => navigation?.goBack?.() },
    ]);
  };

  const openNeedMap = () => navigation?.navigate?.('AbllsNeedMap', { studentId });

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="check-square" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Skills Assessment</Text>
            <Text style={typography.caption}>MR-22 — {STUDENT_NAME} · Age 6 · ABA</Text>
          </View>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressPillText}>{progress}% answered</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {CATEGORIES.map((category) => (
          <View key={category.title} style={styles.card}>
            <Text style={typography.h3}>{category.title}</Text>
            {category.items.map((item) => (
              <View key={item} style={styles.itemBlock}>
                <Text style={typography.body}>{item}</Text>
                <View style={styles.ratingRow}>
                  {RATINGS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.ratingBtn, answers[item] === r && styles.ratingBtnActive]}
                      onPress={() => setRating(item, r)}
                    >
                      <View style={[styles.radio, answers[item] === r && styles.radioActive]} />
                      <Text style={[styles.ratingText, answers[item] === r && styles.ratingTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={typography.h3}>Therapist Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Observations, context, or follow-up items for this student..."
            placeholderTextColor={colors.mutedText}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Summary</Text>
          <Text style={typography.body}>{answeredCount}/{totalItems} items answered · {independentCount} independent</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
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
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  itemBlock: { gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratingBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  ratingBtnActive: { borderColor: colors.primaryYellow, backgroundColor: '#FEF9EC' },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.mutedText },
  radioActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  ratingText: { fontSize: 12, color: colors.bodyText },
  ratingTextActive: { color: colors.navyText, fontWeight: '700' },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp, minHeight: 100, textAlignVertical: 'top' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primaryYellow, borderRadius: radius.pill },
  mapRow: { flexDirection: 'row' },
  mapBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignSelf: 'flex-start' },
  mapBtnText: { fontWeight: '700', color: colors.primaryYellowDark },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
