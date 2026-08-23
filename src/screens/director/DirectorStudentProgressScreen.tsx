// screens/director/DirectorStudentProgressScreen.tsx
// SCR-DIR-006: Student Progress Monitoring (Director View)

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { DIRECTOR_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getDirectorStudentProgress } from '../../api/directorApi';
import type { DirectorStackParamList } from '../../types';

interface StudentOption {
  id: string;
  name: string;
  initial: string;
}

const STUDENT_OPTIONS: StudentOption[] = [
  { id: 's1', name: 'Student A', initial: 'A' },
  { id: 's2', name: 'Student B', initial: 'B' },
  { id: 's3', name: 'Student C', initial: 'C' },
  { id: 's4', name: 'Student D', initial: 'D' },
];

interface DirectorGoal {
  id: string;
  name: string;
  domain: string;
  progress: number;
  status: 'Active' | 'Mastered';
}

interface SessionHistoryEntry {
  date: string;
  teacher: string;
  duration: string;
  trials: number;
  independence: number;
  incidents: number;
}

interface DirectorStudentData {
  name: string;
  age: number;
  dob: string;
  diagnosis: string;
  program: string;
  group: string;
  station: string;
  skillsProgress: number;
  goals: DirectorGoal[];
  sessionHistory: SessionHistoryEntry[];
  behaviorData: { month: string; incidents: number }[];
  goalProgressData: { week: string; colors: number; commands: number; counting: number }[];
}

const DEMO_DATA: Record<string, DirectorStudentData> = {
  s1: {
    name: 'Student A',
    age: 6,
    dob: '2020-03-15',
    diagnosis: 'Autism Spectrum Disorder',
    program: 'Regular',
    group: 'Basic Therapy',
    station: 'Station A',
    skillsProgress: 65,
    goals: [
      { id: 'g1', name: 'Identify Colors', domain: 'Cognitive', progress: 85, status: 'Active' },
      { id: 'g2', name: 'Follow 2-Step Commands', domain: 'Receptive Language', progress: 60, status: 'Active' },
      { id: 'g3', name: 'Count to 10', domain: 'Cognitive', progress: 40, status: 'Active' },
      { id: 'g4', name: 'Match Shapes', domain: 'Cognitive', progress: 100, status: 'Mastered' },
    ],
    sessionHistory: [
      { date: 'Aug 15, 2026', teacher: 'Ms. Reyes', duration: '45 min', trials: 30, independence: 78, incidents: 0 },
      { date: 'Aug 13, 2026', teacher: 'Ms. Santos', duration: '50 min', trials: 25, independence: 72, incidents: 1 },
      { date: 'Aug 11, 2026', teacher: 'Ms. Reyes', duration: '45 min', trials: 28, independence: 68, incidents: 0 },
      { date: 'Aug 8, 2026', teacher: 'Mr. Cruz', duration: '40 min', trials: 22, independence: 65, incidents: 1 },
    ],
    behaviorData: [
      { month: 'March', incidents: 10 },
      { month: 'April', incidents: 8 },
      { month: 'May', incidents: 6 },
      { month: 'June', incidents: 4 },
      { month: 'July', incidents: 3 },
      { month: 'August', incidents: 2 },
    ],
    goalProgressData: [
      { week: 'Wk 1', colors: 50, commands: 30, counting: 20 },
      { week: 'Wk 4', colors: 65, commands: 44, counting: 32 },
      { week: 'Wk 8', colors: 85, commands: 60, counting: 40 },
    ],
  },
};

function getProgressBarColor(pct: number) {
  if (pct >= 80) return '#22C55E';
  if (pct >= 50) return '#FACC15';
  return '#F87171';
}

export default function DirectorStudentProgressScreen({
  navigation,
}: NativeStackScreenProps<DirectorStackParamList, 'DirectorStudentProgress'>) {
  const [selectedStudentId, setSelectedStudentId] = useState('s1');
  const [data, setData] = useState<DirectorStudentData>(DEMO_DATA['s1']);
  const [notes, setNotes] = useState<Array<{ id: string; text: string; timestamp: string }>>([
    {
      id: 'n1',
      text: 'Student A showing excellent generalization across environments. Continue current program. — Director A, Aug 1',
      timestamp: 'Aug 1, 2026 at 10:32 AM',
    },
  ]);
  const [noteText, setNoteText] = useState('');
  const [modalSession, setModalSession] = useState<SessionHistoryEntry | null>(null);
  const [exportContent, setExportContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getDirectorStudentProgress(selectedStudentId);
      if (res?.data) setData(res.data);
    } catch (err) {
      setData(DEMO_DATA[selectedStudentId] ?? DEMO_DATA['s1']);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    load();
  }, [load]);

  const currentStudent = STUDENT_OPTIONS.find((s) => s.id === selectedStudentId) || STUDENT_OPTIONS[0];

  const handlePrint = () => {
    setExportContent(
      [
        `Melu'e Foundation — Student Progress Report (Director)`,
        `Student: ${data.name} · Age ${data.age} · DOB: ${data.dob}`,
        `Diagnosis: ${data.diagnosis}`,
        '',
        'CURRENT GOALS',
        ...data.goals.map((g) => `• ${g.name} (${g.domain}): ${g.progress}% — [${g.status}]`),
        '',
        'SESSION HISTORY SUMMARY',
        ...data.sessionHistory.map((s) => `• ${s.date} — ${s.teacher} (${s.duration}, ${s.independence}% independent)`),
        '',
        'DIRECTOR NOTES',
        notes.map((n) => `[${n.timestamp}] ${n.text}`).join('\n\n') || '(none)',
      ].join('\n')
    );
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const newNote = {
      id: `n${Date.now()}`,
      text: `${noteText.trim()} — Director A, ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      timestamp: now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    setNotes([newNote, ...notes]);
    setNoteText('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Progress"
        onTabPress={(t) => navigation?.navigate?.(DIRECTOR_ROUTE_BY_TAB[t] as any)}
      />

      <View style={styles.header}>
        <Text style={typography.h1}>Student Progress Monitoring</Text>
        <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
          <Ionicons name="print-outline" size={14} color={colors.navyText} />
          <Text style={styles.printBtnText}>Print Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectorRow}>
        {STUDENT_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.studentChip, selectedStudentId === s.id && styles.studentChipActive]}
            onPress={() => setSelectedStudentId(s.id)}
          >
            <Text style={[typography.bodyBold, selectedStudentId === s.id && { color: colors.navyText }]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Student Bio Card */}
        <View style={styles.card}>
          <View style={styles.bioRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{currentStudent.initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{data.name}</Text>
              <Text style={typography.caption}>Age {data.age} · DOB: {data.dob}</Text>
              <Text style={[typography.bodyBold, { marginTop: 2 }]}>Diagnosis: {data.diagnosis}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentDetail', { studentId: selectedStudentId } as any)}>
                <Text style={styles.linkText}>View Full Profile →</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={typography.caption}>Program: <Text style={{ fontWeight: '600', color: colors.navyText }}>{data.program}</Text></Text>
            <Text style={typography.caption}>Group: <Text style={{ fontWeight: '600', color: colors.navyText }}>{data.group}</Text></Text>
            <Text style={typography.caption}>Station: <Text style={{ fontWeight: '600', color: colors.navyText }}>{data.station}</Text></Text>
          </View>
        </View>

        {/* Quick Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={typography.bodyBold}>Skills (ABLLS-R)</Text>
              <View style={styles.badgeAmber}><Text style={styles.badgeAmberText}>In Progress</Text></View>
            </View>
            <Text style={typography.h2}>{data.skillsProgress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${data.skillsProgress}%`, backgroundColor: '#FACC15' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={typography.bodyBold}>Behavior</Text>
              <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Complete</Text></View>
            </View>
            <Text style={[typography.bodyBold, { marginTop: 4 }]}>MASS + FAST</Text>
            <Text style={typography.caption}>Assessments completed</Text>
          </View>
        </View>

        {/* Current Goals Card */}
        <View style={styles.card}>
          <Text style={typography.h3}>Current Goals</Text>
          {data.goals.map((g) => (
            <View key={g.id} style={styles.goalRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{g.name}</Text>
                <Text style={typography.caption}>{g.domain}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', width: 120 }}>
                <Text style={typography.bodyBold}>{g.progress}%</Text>
                <View style={[styles.progressBarBg, { width: '100%', marginTop: 4 }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${g.progress}%`, backgroundColor: getProgressBarColor(g.progress) },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Session History Card */}
        <View style={styles.card}>
          <Text style={typography.h3}>Session History (Last Sessions)</Text>
          {data.sessionHistory.map((s, idx) => (
            <TouchableOpacity key={idx} style={styles.sessionRow} onPress={() => setModalSession(s)}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{s.date}</Text>
                <Text style={typography.caption}>{s.teacher} · {s.duration}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={typography.bodyBold}>{s.independence}% Ind.</Text>
                <Text style={[typography.caption, s.incidents > 0 ? { color: '#EF4444' } : { color: '#22C55E' }]}>
                  {s.incidents} incident(s)
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Behavior Trends Simple Visual View */}
        <View style={styles.card}>
          <View style={styles.metricHeader}>
            <Text style={typography.h3}>Behavior Incidents Over Time</Text>
            <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Trending down ↓</Text></View>
          </View>
          <View style={styles.chartRow}>
            {data.behaviorData.map((b, i) => (
              <View key={i} style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height: Math.max(12, b.incidents * 12) }]} />
                <Text style={[typography.caption, { fontSize: 10, textAlign: 'center', marginTop: 4 }]}>
                  {b.month.slice(0, 3)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Director Notes Card */}
        <View style={styles.card}>
          <Text style={typography.h3}>Director Notes</Text>
          <Text style={typography.caption}>Internal only — not visible to parents or teachers.</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Add an internal note..."
            placeholderTextColor={colors.mutedText}
            value={noteText}
            onChangeText={setNoteText}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
            <Text style={styles.saveBtnText}>Save Note</Text>
          </TouchableOpacity>

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {notes.map((n) => (
              <View key={n.id} style={styles.noteItem}>
                <Text style={typography.body}>{n.text}</Text>
                <Text style={[typography.caption, { marginTop: 4 }]}>{n.timestamp}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Session Detail Modal */}
      <Modal visible={!!modalSession} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.metricHeader}>
              <Text style={typography.h3}>Session Summary</Text>
              <TouchableOpacity onPress={() => setModalSession(null)}>
                <Ionicons name="close" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            {modalSession && (
              <View style={{ gap: spacing.sm, marginVertical: spacing.md }}>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Date</Text>
                  <Text style={typography.bodyBold}>{modalSession.date}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Teacher</Text>
                  <Text style={typography.bodyBold}>{modalSession.teacher}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Duration</Text>
                  <Text style={typography.bodyBold}>{modalSession.duration}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Trials Count</Text>
                  <Text style={typography.bodyBold}>{modalSession.trials}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Independence</Text>
                  <Text style={typography.bodyBold}>{modalSession.independence}%</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={typography.caption}>Incidents</Text>
                  <Text style={[typography.bodyBold, modalSession.incidents > 0 ? { color: '#EF4444' } : { color: '#22C55E' }]}>
                    {modalSession.incidents}
                  </Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setModalSession(null)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ExportPreviewModal
        visible={!!exportContent}
        title="Student Progress Report"
        filename={`${data.name.replace(/\s+/g, '_')}_ProgressReport.txt`}
        content={exportContent ?? ''}
        onClose={() => setExportContent(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  printBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  printBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  studentChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  studentChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  bioRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  linkText: { color: '#0284C7', fontWeight: '600', fontSize: 12, marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metricsGrid: { flexDirection: 'row', gap: spacing.md },
  metricCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeAmber: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.md },
  badgeAmberText: { color: '#B45309', fontSize: 10, fontWeight: '600' },
  badgeGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.md },
  badgeGreenText: { color: '#15803D', fontSize: 10, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 90,
    marginTop: spacing.sm,
  },
  chartBarWrap: { alignItems: 'center', flex: 1 },
  chartBar: { width: 16, backgroundColor: '#F97316', borderRadius: 4 },
  textArea: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    color: colors.navyText,
    backgroundColor: colors.bgApp,
  },
  saveBtn: {
    backgroundColor: colors.primaryYellow,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  saveBtnText: { fontWeight: '700', fontSize: 12, color: colors.navyText },
  noteItem: {
    backgroundColor: colors.bgApp,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeModalBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeModalBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 13 },
});