// screens/assessments/SensoryAssessmentScreen.tsx
// MR-25: Sensory Time Engagement Assessment — rates responses to
// visual, auditory, touch, movement and balance stimuli (Enjoys /
// Neutral / Avoids).

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { saveSensoryAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Response = 'Enjoys' | 'Neutral' | 'Avoids';
const RESPONSES: Response[] = ['Enjoys', 'Neutral', 'Avoids'];

const AREAS: { title: string; items: string[] }[] = [
  { title: 'Visual', items: ['Bright lights', 'Flashing toys', 'Preferred colors'] },
  { title: 'Auditory', items: ['Loud noise', 'Music', 'Verbal instructions'] },
  { title: 'Touch', items: ['Textures', 'Temperature', 'Firm pressure'] },
  { title: 'Movement (Vestibular)', items: ['Swinging', 'Rocking', 'Spinning'] },
  { title: 'Balance', items: ['Balance beam', 'Standing on one foot', 'Riding toys'] },
  { title: 'Textures', items: ['Sensory bins', 'Play-doh', 'Sand play'] },
  { title: 'Temperature', items: ['Warm water', 'Cold water', 'Heated blanket'] },
  { title: 'Noise', items: ['Sudden sounds', 'Crowd noise', 'Vacuum cleaner'] },
  { title: 'Lights', items: ['Overhead lights', 'Sunlight', 'Flashlights'] },
];

type Props = NativeStackScreenProps<SessionStackParamList, 'SensoryAssessment'>;

export default function SensoryAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const [responses, setResponses] = useState<Record<string, Response>>({ Swinging: 'Enjoys' });
  const [notes, setNotes] = useState('');

  const setResponse = (item: string, response: Response) => setResponses((prev) => ({ ...prev, [item]: response }));

  const answeredCount = Object.keys(responses).length;
  const totalItems = AREAS.reduce((sum, a) => sum + a.items.length, 0);
  const progress = totalItems === 0 ? 0 : Math.round((answeredCount / totalItems) * 100);
  const avoidsCount = Object.values(responses).filter((r) => r === 'Avoids').length;

  const handleSave = async () => {
    try {
      await saveSensoryAssessment(studentId, { responses, notes });
    } catch (err) {}
    Alert.alert('Assessment saved', `Sensory assessment saved (${progress}% complete).`, [
      { text: 'Done', onPress: () => navigation?.goBack?.() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="eye" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Sensory Time Engagement</Text>
            <Text style={typography.caption}>MR-25 — Student A · {progress}% complete</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {AREAS.map((area) => (
          <View key={area.title} style={styles.card}>
            <Text style={typography.h3}>{area.title}</Text>
            {area.items.map((item) => (
              <View key={item} style={styles.itemBlock}>
                <Text style={typography.body}>{item}</Text>
                <View style={styles.responseRow}>
                  {RESPONSES.map((r) => (
                    <TouchableOpacity key={r} style={[styles.responseBtn, responses[item] === r && styles.responseBtnActive]} onPress={() => setResponse(item, r)}>
                      <View style={[styles.radio, responses[item] === r && styles.radioActive]} />
                      <Text style={[styles.responseText, responses[item] === r && styles.responseTextActive]}>{r}</Text>
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
            placeholder="Sensory observations, triggers, or accommodations to note..."
            placeholderTextColor={colors.mutedText}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Summary</Text>
          <Text style={typography.body}>{answeredCount}/{totalItems} rated · {avoidsCount} avoided</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  itemBlock: { gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  responseRow: { flexDirection: 'row', gap: spacing.sm },
  responseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  responseBtnActive: { borderColor: colors.primaryYellow, backgroundColor: '#FEF9EC' },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.mutedText },
  radioActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  responseText: { fontSize: 12, color: colors.bodyText },
  responseTextActive: { color: colors.navyText, fontWeight: '700' },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp, minHeight: 100, textAlignVertical: 'top' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bgApp, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primaryYellow, borderRadius: radius.pill },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
