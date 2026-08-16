// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
// import { Feather } from '@expo/vector-icons';
// import type { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { colors, radius, spacing } from '../../theme/colors';
// import { typography } from '../../theme/typography';
// import CoordinatorNav from './components/CoordinatorNav';
// import StatusPill from '../../components/StatusPill';
// import { getStudentProfile } from '../../api/coordinatorApi';
// import type { CoordinatorStackParamList } from '../../types';

// interface TimelineEvent {
//   date: string;
//   title: string;
//   detail: string;
// }

// export interface StudentProfileData {
//   id: string;
//   name: string;
//   age: number;
//   gender: string;
//   studentId: string;
//   diagnosis: string;
//   therapist: string;
//   teacher: string;
//   program: string;
//   status: 'Active' | 'Inactive';
//   parentName: string;
//   parentPhone: string;
//   parentEmail: string;
//   documents: string[];
//   progress: { completedSessions: number; activeGoals: number; assessmentScore: number; behaviorIncidents: number };
//   timeline: TimelineEvent[];
// }

// type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentProfile'>;

// export default function StudentProfileScreen({ navigation, route }: Props) {
//   const { studentId } = route.params;
//   const [profile, setProfile] = useState<StudentProfileData | null>(null);

//   const load = useCallback(async () => {
//     try {
//       const { data } = await getStudentProfile(studentId);
//       setProfile(data);
//     } catch (err) {
//       setProfile(DEMO_PROFILE);
//     }
//   }, [studentId]);

//   useEffect(() => { load(); }, [load]);

//   if (!profile) return null;

//   const Section = ({ icon, title, children }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; children: React.ReactNode }) => (
//     <View style={styles.card}>
//       <View style={styles.sectionHeader}>
//         <Feather name={icon} size={16} color={colors.navyText} />
//         <Text style={typography.h3}>{title}</Text>
//       </View>
//       {children}
//     </View>
//   );

//   const InfoRow = ({ label, value }: { label: string; value: string }) => (
//     <View style={styles.infoRow}>
//       <Text style={typography.label}>{label}</Text>
//       <Text style={typography.body}>{value}</Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safe}>
//       <CoordinatorNav activeTab="Enrollment" onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(navRouteForTab(t) as never)} />

//       <View style={styles.header}>
//         <View style={styles.avatar}><Text style={styles.avatarText}>{profile.name.charAt(0)}</Text></View>
//         <View style={{ flex: 1 }}>
//           <Text style={typography.h1}>{profile.name}</Text>
//           <Text style={typography.caption}>{profile.studentId} · Age {profile.age} · {profile.gender}</Text>
//         </View>
//         <StatusPill status={profile.status === 'Active' ? 'approved' : 'revision'} label={profile.status} />
//       </View>

//       <ScrollView contentContainerStyle={styles.content}>
//         <Section icon="user" title="Personal Information">
//           <InfoRow label="Name" value={profile.name} />
//           <InfoRow label="Age" value={`${profile.age}`} />
//           <InfoRow label="Gender" value={profile.gender} />
//           <InfoRow label="Student ID" value={profile.studentId} />
//         </Section>

//         <Section icon="users" title="Parent Information">
//           <InfoRow label="Parent" value={profile.parentName} />
//           <InfoRow label="Phone" value={profile.parentPhone} />
//           <InfoRow label="Email" value={profile.parentEmail} />
//         </Section>

//         <Section icon="activity" title="Clinical Information">
//           <InfoRow label="Diagnosis" value={profile.diagnosis} />
//           <InfoRow label="Assigned Therapist" value={profile.therapist} />
//           <InfoRow label="Assigned Teacher" value={profile.teacher} />
//           <InfoRow label="Program" value={profile.program} />
//         </Section>

//         <Section icon="folder" title="Documents">
//           {profile.documents.length === 0 && <Text style={typography.caption}>No documents uploaded.</Text>}
//           {profile.documents.map((d) => (
//             <View key={d} style={styles.docRow}>
//               <Feather name="file-text" size={14} color={colors.mutedText} />
//               <Text style={typography.body}>{d}</Text>
//             </View>
//           ))}
//         </Section>

//         <Section icon="bar-chart-2" title="Progress Summary">
//           <View style={styles.statsGrid}>
//             <View style={styles.statCard}><Text style={styles.statValue}>{profile.progress.completedSessions}</Text><Text style={typography.caption}>Completed Sessions</Text></View>
//             <View style={styles.statCard}><Text style={styles.statValue}>{profile.progress.activeGoals}</Text><Text style={typography.caption}>Active Goals</Text></View>
//             <View style={styles.statCard}><Text style={styles.statValue}>{profile.progress.assessmentScore}%</Text><Text style={typography.caption}>Assessment Score</Text></View>
//             <View style={styles.statCard}><Text style={styles.statValue}>{profile.progress.behaviorIncidents}</Text><Text style={typography.caption}>Behavior Incidents</Text></View>
//           </View>
//         </Section>

//         <Section icon="clock" title="Timeline">
//           {profile.timeline.map((e) => (
//             <View key={e.title} style={styles.timelineRow}>
//               <View style={styles.timelineDot} />
//               <View style={{ flex: 1 }}>
//                 <Text style={typography.bodyBold}>{e.title}</Text>
//                 <Text style={typography.caption}>{e.detail}</Text>
//               </View>
//               <Text style={typography.caption}>{e.date}</Text>
//             </View>
//           ))}
//         </Section>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
//   return ({
//     Dashboard: 'CoordinatorDashboard',
//     'Live Sessions': 'LiveSessionMonitoring',
//     Review: 'SessionSummaryReview',
//     Progress: 'CoordinatorStudentProgress',
//     Schedule: 'CoordinatorSchedule',
//     Parents: 'CoordinatorParentCommunication',
//     Enrollment: 'StudentEnrollment',
//     Workload: 'WorkloadDashboard',
//     Notifications: 'Notifications',
//     Rooms: 'RoomResourceScheduling',
//   } as Record<string, keyof CoordinatorStackParamList>)[tab];
// }

// const DEMO_PROFILE: StudentProfileData = {
//   id: 'stu-1',
//   name: 'Emily Johnson',
//   age: 6,
//   gender: 'Female',
//   studentId: 'MLU-0012',
//   diagnosis: 'Autism Spectrum',
//   therapist: 'Teacher A',
//   teacher: 'Teacher A',
//   program: 'ABA',
//   status: 'Active',
//   parentName: 'Sarah Johnson',
//   parentPhone: '(555) 010-2040',
//   parentEmail: 'sarah.johnson@example.com',
//   documents: ['Birth Certificate.pdf', 'Assessment Report — Skills.pdf'],
//   progress: { completedSessions: 42, activeGoals: 8, assessmentScore: 72, behaviorIncidents: 3 },
//   timeline: [
//     { date: 'Jan 5', title: 'Student Registered', detail: 'Enrolled via Enrollment Wizard.' },
//     { date: 'Jan 10', title: 'Assessment Completed', detail: '6-week assessment finished with 72% average.' },
//     { date: 'Jan 14', title: 'Therapy Started', detail: 'ABA program began with Teacher A.' },
//     { date: 'Jan 28', title: 'Behavior Incident', detail: 'Tantrum during cleanup — ABC logged.' },
//     { date: 'Feb 2', title: 'Goal Updated', detail: 'Eye contact goal progressed to 72%.' },
//   ],
// };

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: colors.bgApp },
//   header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
//   avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.promptG, alignItems: 'center', justifyContent: 'center' },
//   avatarText: { color: colors.white, fontWeight: '700', fontSize: 20 },
//   content: { padding: spacing.lg, gap: spacing.lg },
//   card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
//   sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
//   infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
//   docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
//   statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
//   statCard: { flexGrow: 1, minWidth: '45%', backgroundColor: colors.bgApp, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
//   statValue: { fontSize: 20, fontWeight: '700', color: colors.navyText },
//   timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
//   timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryYellow },
// });
