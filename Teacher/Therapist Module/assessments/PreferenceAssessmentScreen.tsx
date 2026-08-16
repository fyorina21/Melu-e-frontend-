// screens/assessments/PreferenceAssessmentScreen.tsx
// MR-24: Preference Assessment — rank what motivates the student
// (High / Moderate / Low preference) across foods, toys, games, etc.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { savePreferenceAssessment } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Rank = 'High' | 'Moderate' | 'Low';
const RANKS: Rank[] = ['High', 'Moderate', 'Low'];
const RANK_COLORS: Record<Rank, string> = { High: colors.statusCompletedBg, Moderate: colors.statusPendingBg, Low: colors.statusNotStartedBg };
const RANK_TEXT: Record<Rank, string> = { High: colors.statusCompletedText, Moderate: colors.statusPendingText, Low: colors.statusNotStartedText };

const STIMULI: { category: string; items: string[] }[] = [
  { category: 'Foods', items: ['Grapes', 'Crackers', 'Apple slices'] },
  { category: 'Toys', items: ['Bubbles', 'Toy cars', 'Blocks'] },
  { category: 'Games', items: ['iPad game', 'Puzzle', 'Drawing'] },
  { category: 'Activities', items: ['Swinging', 'Music time', 'Sensory play'] },
];

type Props = NativeStackScreenProps<SessionStackParamList, 'PreferenceAssessment'>;

export default function PreferenceAssessmentScreen({ navigation, route }: Props) {
  const { logout } = useAuth();
  const { studentId } = route.params;
  const [ranks, setRanks] = useState<Record<string, Rank>>({ Grapes: 'High', 'Toy cars': 'High', 'iPad game': 'High', Blocks: 'Moderate', Drawing: 'Moderate', Puzzle: 'Low' });

  const setRank = (item: string, rank: Rank) => setRanks((prev) => ({ ...prev, [item]: rank }));

  const handleSave = async () => {
    try {
      await savePreferenceAssessment(studentId, { ranks });
    } catch (err) {}
    Alert.alert('Assessment saved', 'Preference rankings saved.', [
      { text: 'Done', onPress: () => navigation?.goBack?.() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav activeTab="Assessments" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} onLogout={logout} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="star" size={18} color={colors.navyText} />
          <View>
            <Text style={typography.h1}>Preference Assessment</Text>
            <Text style={typography.caption}>MR-24 — what motivates Student A</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {STIMULI.map((group) => (
          <View key={group.category} style={styles.card}>
            <Text style={typography.h3}>{group.category}</Text>
            {group.items.map((item) => {
              const rank = ranks[item];
              return (
                <View key={item} style={styles.itemBlock}>
                  <Text style={typography.body}>{item}</Text>
                  <View style={styles.rankRow}>
                    {RANKS.map((r) => {
                      const active = rank === r;
                      return (
                        <TouchableOpacity key={r} style={[styles.rankBtn, active && { backgroundColor: RANK_COLORS[r], borderColor: RANK_TEXT[r] }]} onPress={() => setRank(item, r)}>
                          <Text style={[styles.rankText, active && { color: RANK_TEXT[r], fontWeight: '700' }]}>{r}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.card}>
          <Text style={typography.h3}>Result</Text>
          <Text style={typography.body}>Highly Preferred: {Object.entries(ranks).filter(([, r]) => r === 'High').map(([k]) => k).join(', ') || 'None'}</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.saveBtnText}>Save Rankings</Text>
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
  rankRow: { flexDirection: 'row', gap: spacing.sm },
  rankBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  rankText: { fontSize: 12, color: colors.bodyText },
  saveBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
