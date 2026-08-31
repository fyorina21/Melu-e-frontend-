import React, { useEffect, useState, useCallback } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StatusPill from '../../components/StatusPill';
import { getStudentProfile } from '../../api/coordinatorApi';
import type { CoordinatorStackParamList } from '../../types';

interface StudentGoal {
  id: string;
  name: string;
  status: string;
  progressPercent: number;
}

export interface StudentProfileData {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
  headshotUrl: string | null;
  currentFocusStudentGoalId: string | null;
  goals: StudentGoal[];
  customFields?: Record<string, any>;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentProfile'>;

export default function StudentProfileScreen({ navigation, route }: Props) {
  const studentId = route.params?.studentId;
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const { data } = await getStudentProfile(studentId);
      setProfile(data);
      setLoadFailed(false);
    } catch (err) {
      setProfile(null);
      setLoadFailed(true);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  if (!studentId) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar activeTab="Student Profile" onTabPress={(t) => t !== 'Student Profile' && navigation?.navigate?.(navRouteForTab(t) as never)} />
        <View style={styles.emptyState}>
          <Feather name="user" size={40} color={colors.mutedText} />
          <Text style={typography.body}>No student selected.</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('StudentEnrollment')}>
            <Text style={styles.linkText}>Pick a student from Student Registration →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile && loadFailed) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar activeTab="Student Profile" onTabPress={(t) => t !== 'Student Profile' && navigation?.navigate?.(navRouteForTab(t) as never)} />
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={colors.mutedText} />
          <Text style={typography.body}>Profile not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return <ScreenLoader />;

  const Section = ({ icon, title, children }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; children: React.ReactNode }) => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Feather name={icon} size={16} color={colors.navyText} />
        <Text style={typography.h3}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={typography.label}>{label}</Text>
      <Text style={typography.body}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Enrollment" onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(navRouteForTab(t) as never)} />

      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Feather name="arrow-left" size={16} color={colors.bodyText} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{profile.fullName.charAt(0)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>{profile.fullName}</Text>
          <Text style={typography.caption}>{profile.id} · Age {profile.age} · {profile.programType}</Text>
        </View>
        <StatusPill status={profile.status === 'active' ? 'approved' : 'revision'} label={profile.status === 'active' ? 'Active' : profile.status} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section icon="user" title="Personal Information">
          <InfoRow label="Name" value={profile.fullName} />
          <InfoRow label="Age" value={`${profile.age}`} />
          <InfoRow label="Date of Birth" value={profile.dateOfBirth} />
          <InfoRow label="Student ID" value={profile.id} />
        </Section>

        <Section icon="activity" title="Clinical Information">
          <InfoRow label="Program Type" value={profile.programType} />
          <InfoRow label="Therapy Group" value={profile.therapyGroup} />
          <InfoRow label="Status" value={profile.status === 'active' ? 'Active' : profile.status} />
        </Section>

        {profile.customFields && Object.keys(profile.customFields).length > 0 && (
          <Section icon="layers" title="Institutional & Custom Information">
            {Object.entries(profile.customFields).map(([k, v]) => (
              <InfoRow
                key={k}
                label={k}
                value={typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || '—')}
              />
            ))}
          </Section>
        )}

        <Section icon="bar-chart-2" title="Goals">
          {profile.goals.length === 0 && <Text style={typography.caption}>No goals defined yet.</Text>}
          {profile.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{g.name}</Text>
                <Text style={typography.caption}>{g.progressPercent}% progress</Text>
              </View>
              <StatusPill status={g.status === 'mastered' ? 'approved' : g.status === 'paused' ? 'revision' : 'inProgress'} label={g.status} />
            </View>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return ({
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
  } as Record<string, keyof CoordinatorStackParamList>)[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  backRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backText: { fontSize: 14, color: colors.bodyText, fontWeight: '500', marginLeft: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 20 },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  linkText: { color: colors.statusInProgressText, fontWeight: '600', fontSize: 13 },
});
