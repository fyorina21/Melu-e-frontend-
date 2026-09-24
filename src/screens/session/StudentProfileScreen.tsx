
import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import ScreenError from '../../components/ScreenError';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill, { StatusType } from '../../components/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getTeacherStudentProfile, getSkillsAssessment } from '../../api/teacherExtrasApi';
import { DEFAULT_ABLLS_DOMAINS, SCORE_LABEL } from '../assessments/abllsConfigHelper';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'StudentProfile'>;

interface ProfileGoal {
  id: string;
  name: string;
  category: string;
  status: StatusType;
}

interface StudentProfileResponse {
  id: string;
  fullName: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
  goals?: Array<{ id: string; name: string; status: string; progressPercent: number }>;
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

const STATUS_FOR_GOAL: Record<string, StatusType> = {
  active: 'inProgress',
  mastered: 'completed',
  paused: 'notStarted',
};

function toProfile(row: StudentProfileResponse): TeacherStudentProfile {
  return {
    id: row.id,
    name: row.fullName,
    initial: row.fullName.charAt(0).toUpperCase(),
    age: row.age,
    gender: '',
    program: row.programType,
    diagnosis: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    goals: (row.goals ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      category: '',
      status: STATUS_FOR_GOAL[g.status] ?? 'inProgress',
    })),
    trialsThisBlock: 0,
    independencePercent: 0,
    notes: '',
  };
}

const SECTION_ICON: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  'Personal Info': 'user',
  'Program & Clinical': 'activity',
  'Goals': 'target',
  'Parent / Guardian': 'users',
  'Block Summary': 'bar-chart-2',
  'Notes': 'file-text',
};

interface SavedSkillsAssessment {
  status: string;
  scores: Record<string, any>;
  notes: Record<string, string>;
  customFields: Record<string, any>;
}

export default function StudentProfileScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { logout } = useAuth();
  const [profile, setProfile] = useState<TeacherStudentProfile | null>(null);
  const [skills, setSkills] = useState<SavedSkillsAssessment | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getTeacherStudentProfile(studentId);
      setProfile(res ? toProfile(res as StudentProfileResponse) : null);
      setLoadError(false);
    } catch (err) {
      setLoadError(true);
    }
    try {
      const { data: saved } = await getSkillsAssessment(studentId);
      const savedData = (saved?.data ?? saved ?? {}) as {
        scores?: Record<string, any>;
        notes?: Record<string, string>;
        customFields?: Record<string, any>;
      };
      const scores = (savedData.scores ?? (saved as any)?.scores ?? {}) as Record<string, any>;
      const notes = (savedData.notes ?? (saved as any)?.notes ?? {}) as Record<string, string>;
      const customFields = (savedData.customFields ?? (saved as any)?.customFields ?? {}) as Record<string, any>;
      const hasData = Object.keys(scores).length > 0 || Object.keys(notes).length > 0 || Object.keys(customFields).length > 0;
      if (hasData) {
        setSkills({ status: (saved?.status as string) || '', scores, notes, customFields });
      } else {
        setSkills(null);
      }
    } catch (err) {
      setSkills(null);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadError) return <ScreenError onRetry={load} />;
  if (!profile) return <ScreenLoader />;

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
      <AppNavbar
        activeTab="Session"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
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

        {renderSection('Skills Assessment (ABLLS)')}
        <View style={styles.card}>
          {!skills ? (
            <Text style={[typography.body, { color: colors.mutedText }]}>No skills assessment saved yet.</Text>
          ) : (
            <>
              <View style={styles.assessHeader}>
                <Text style={styles.assessStatus}>
                  {skills.status === 'completed' || skills.status === 'submitted' ? 'Completed' : 'In Progress'}
                </Text>
                <Text style={styles.assessAnswered}>
                  {Object.keys(skills.scores).length} of {DEFAULT_ABLLS_DOMAINS.reduce((sum, d) => sum + d.items.length, 0)} items scored
                </Text>
              </View>

              {Object.keys(skills.scores).length > 0 &&
                DEFAULT_ABLLS_DOMAINS.map((d) => {
                  const scored = d.items.filter((i) => skills.scores[i.id] !== undefined);
                  if (scored.length === 0) return null;
                  return (
                    <View key={d.code} style={styles.assessDomain}>
                      <Text style={typography.bodyBold}>{d.name}</Text>
                      {scored.map((i) => {
                        const raw = skills.scores[i.id];
                        const value = (SCORE_LABEL as Record<string, string>)[String(raw)] ?? String(raw);
                        return (
                          <View key={i.id} style={styles.assessRow}>
                            <Text style={styles.assessItem}>{i.id} · {i.description}</Text>
                            <Text style={styles.assessScore}>{value}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}

              {Object.entries(skills.notes).filter(([, v]) => v && String(v).trim()).length > 0 && (
                <View style={styles.assessDomain}>
                  <Text style={typography.bodyBold}>Notes</Text>
                  {Object.entries(skills.notes)
                    .filter(([, v]) => v && String(v).trim())
                    .map(([k, v]) => (
                      <Text key={k} style={styles.assessNote}>
                        <Text style={styles.assessNoteLabel}>{k}: </Text>{String(v)}
                      </Text>
                    ))}
                </View>
              )}

              {Object.entries(skills.customFields)
                .filter(([, v]) => v !== '' && v !== undefined && v !== false)
                .map(([k, v]) => (
                  <View key={k} style={styles.assessRow}>
                    <Text style={styles.assessItem}>{k}</Text>
                    <Text style={styles.assessScore}>{String(v)}</Text>
                  </View>
                ))}
            </>
          )}
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
  assessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  assessStatus: { color: colors.statusApprovedText, fontWeight: '700', fontSize: 12 },
  assessAnswered: { color: colors.mutedText, fontSize: 12 },
  assessDomain: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  assessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, paddingVertical: 2 },
  assessItem: { flex: 1, color: colors.bodyText, fontSize: 13 },
  assessScore: { color: colors.navyText, fontWeight: '700', fontSize: 13 },
  assessNote: { color: colors.bodyText, fontSize: 13 },
  assessNoteLabel: { fontWeight: '700', color: colors.navyText },
});
