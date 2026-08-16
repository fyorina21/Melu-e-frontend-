// screens/session/StudentProfileScreen.tsx
// SCR-006A: Student Profile (read-only, Teacher view).
// Triggered from SCR-002 by tapping a student's name on the session card.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import TopNav from '../../components/TopNav';
import StatusPill, { StatusType } from '../../components/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherStudentProfile } from '../../api/teacherExtrasApi';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'StudentProfile'>;

interface ProfileGoal {
  id: string;
  name: string;
  category: string;
  status: StatusType;
}

export interface TeacherStudentProfile {
  id: string;
  name: string;
  initial: string;
  age: number;
  gender: string;
  program: string;
  diagnosis: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  goals: ProfileGoal[];
  trialsThisBlock: number;
  independencePercent: number;
  notes: string;
}

const SECTION_ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  'Personal Info': 'user',
  'Program & Clinical': 'activity',
  'Goals': 'target',
  'Parent / Guardian': 'users',
  'Block Summary': 'bar-chart-2',
  'Notes': 'file-text',
};

export default function StudentProfileScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { logout } = useAuth();
  const [profile, setProfile] = useState<TeacherStudentProfile | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getTeacherStudentProfile(studentId);
      setProfile(data);
    } catch (err) {
      setProfile(DEMO_PROFILE(studentId));
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return null;

  const renderSection = (title: string) => (
    <View style={styles.sectionHeader}>
      <Feather name={SECTION_ICON[title] || 'info'} size={14} color={colors.navyText} />
      <Text style={typography.h3}>{title}</Text>
    </View>
  );

  const infoRow = (label: string, value: string) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <TopNav
        activeTab="Session"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
        onLogout={logout}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={18} color={colors.navyText} />
        </TouchableOpacity>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initial}</Text>
          </View>
          <View>
            <Text style={typography.h1}>{profile.name}</Text>
            <Text style={typography.caption}>
              {profile.age} yrs · {profile.gender} · {profile.program}
            </Text>
          </View>
        </View>
        <StatusPill status="inProgress" label="Active" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderSection('Personal Info')}
        {infoRow('Student ID', profile.id)}
        {infoRow('Program', profile.program)}
        {infoRow('Diagnosis', profile.diagnosis)}

        {renderSection('Program & Clinical')}
        {infoRow('Current Program', profile.program)}
        {infoRow('Diagnosis', profile.diagnosis)}

        {renderSection('Goals')}
        <View style={styles.card}>
          {profile.goals.length === 0 && (
            <Text style={[typography.body, { color: colors.mutedText }]}>No goals assigned yet.</Text>
          )}
          {profile.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={styles.goalRowText}>
                <Text style={typography.bodyBold}>{g.name}</Text>
                <Text style={typography.caption}>{g.category}</Text>
              </View>
              <StatusPill status={g.status} />
            </View>
          ))}
        </View>

        {renderSection('Parent / Guardian')}
        {infoRow('Name', profile.parentName)}
        {infoRow('Phone', profile.parentPhone)}
        {infoRow('Email', profile.parentEmail)}

        {renderSection('Block Summary')}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.trialsThisBlock}</Text>
            <Text style={styles.statLabel}>Trials this block</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.independencePercent}%</Text>
            <Text style={styles.statLabel}>Independence</Text>
          </View>
        </View>

        {renderSection('Notes')}
        <Text style={[typography.body, { color: colors.mutedText }]}>{profile.notes || 'No notes on file.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DEMO_PROFILE(studentId: string): TeacherStudentProfile {
  const seeded = studentId.endsWith('-b');
  return {
    id: studentId,
    name: seeded ? 'Student B' : 'Student A',
    initial: 'S',
    age: seeded ? 7 : 6,
    gender: 'Female',
    program: seeded ? 'Functional' : 'Basic',
    diagnosis: 'Autism Spectrum Disorder',
    parentName: 'Parent of Student',
    parentPhone: '+1 (555) 010-0199',
    parentEmail: 'parent@example.com',
    goals: seeded
      ? [{ id: 'goal-3', name: 'Request Items', category: 'Expressive Language', status: 'inProgress' }]
      : [
          { id: 'goal-1', name: 'Identify Colors', category: 'Cognitive', status: 'inProgress' },
          { id: 'goal-2', name: 'Goal 2', category: '', status: 'inProgress' },
        ],
    trialsThisBlock: 18,
    independencePercent: 67,
    notes: 'Consistent attendance. Making steady progress toward current goals.',
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 18 },
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  infoLabel: { color: colors.mutedText, fontSize: 13 },
  infoValue: { color: colors.navyText, fontWeight: '600', fontSize: 13, maxWidth: '60%', textAlign: 'right' },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  goalRowText: { flex: 1, gap: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.navyText },
  statLabel: { fontSize: 11, color: colors.mutedText },
});
