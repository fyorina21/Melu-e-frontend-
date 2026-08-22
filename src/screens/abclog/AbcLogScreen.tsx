import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { useAuth } from '../../context/AuthContext';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { getAbcLog, exportAbcLog } from '../../api/teacherExtrasApi';
import { getStudentOptions, type StudentOption } from '../../api/optionsApi';
import { openPrintWindow } from '../../utils/webExport';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AbcLog'>;

interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

interface AbcIncidentRow {
  [key: string]: string | undefined;
}

interface AbcLogData {
  stats: AbcStats;
  incidents: AbcIncidentRow[];
}

const COLUMNS = ['Date', 'Time', 'Location', 'Behavior', 'Frequency', 'Intensity', 'Category', 'Antecedent', 'Consequence', 'Teacher'];
const OUTCOME_OPTIONS = [
  'Independent with Novel Person',
  'Independent in Novel Environment',
  'Both',
  'Failed - Required Prompt',
];



export default function AbcLogScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [studentId, setStudentId] = useState('student-a');
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [from, setFrom] = useState('07/07/2026');
  const [to, setTo] = useState('08/22/2026');
  const [behaviorFilter, setBehaviorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [data, setData] = useState<AbcLogData | null>(null);

  useEffect(() => {
    getStudentOptions().then(({ data: opts }) => {
      setStudentOptions(opts);
      if (opts.length > 0 && !opts.some((o) => o.id === studentId)) {
        setStudentId(opts[0].id);
      }
    }).catch(() => {});
  }, []);

  // Workflow & Verification Form State
  const [status, setStatus] = useState<'draft' | 'pending_director_review'>('draft');
  const [teacherBOutcome, setTeacherBOutcome] = useState('');
  const [teacherBNotes, setTeacherBNotes] = useState('');
  const [teacherCOutcome, setTeacherCOutcome] = useState('');
  const [teacherCNotes, setTeacherCNotes] = useState('');

  const isSubmitted = status === 'pending_director_review';
  const canSubmit = teacherBOutcome !== '' && teacherCOutcome !== '' && !isSubmitted;

  const handleSubmitForReview = () => {
    if (!canSubmit) return;
    setStatus('pending_director_review');
  };

  const buildData = useCallback((_activeStudentId: string, behavior: string, category: string): AbcLogData => {
    // API is the source of truth; this fallback only computes stats from
    // whatever the API returned (data.incidents is already populated by load).
    const studentIncidents = data?.incidents ?? [];
    const filtered = studentIncidents.filter(
      (r) =>
        (behavior === 'All' || r.behavior === behavior) &&
        (category === 'All' || r.category === category)
    );
    const behaviorCounts: Record<string, number> = {};
    const antecedentCounts: Record<string, number> = {};
    filtered.forEach((r) => {
      const b = r.behavior ?? '';
      const a = r.antecedent ?? '';
      behaviorCounts[b] = (behaviorCounts[b] || 0) + 1;
      antecedentCounts[a] = (antecedentCounts[a] || 0) + 1;
    });
    const top = (counts: Record<string, number>) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';
    const thisWeek = filtered.filter((r) => (r.date ?? '').startsWith('08/')).length;
    return {
      stats: {
        totalIncidents: filtered.length,
        mostCommonBehavior: top(behaviorCounts),
        mostCommonAntecedent: top(antecedentCounts),
        thisWeek,
      },
      incidents: filtered,
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const { data: res } = await getAbcLog({ studentId, from, to, behavior: behaviorFilter, category: categoryFilter });
      setData(res);
    } catch (err) {
      setData(buildData(studentId, behaviorFilter, categoryFilter));
    }
  }, [studentId, from, to, behaviorFilter, categoryFilter, buildData]);

  useEffect(() => { load(); }, [load]);

  const cycleFilter = (current: string, options: string[]) => {
    const idx = options.indexOf(current);
    return options[(idx + 1) % options.length];
  };

  const handleExport = async () => {
    try {
      await exportAbcLog({ studentId, from, to });
    } catch (err) {}
    const rows = data?.incidents ?? [];
    const header = COLUMNS.join(',');
    const lines = rows.map((r) => COLUMNS.map((c) => `"${(r[c.toLowerCase()] || '').replace(/"/g, '""')}"`).join(','));
    const stats = data?.stats;
    const content = [
      `Melu'e Foundation — ABC Data Sheet`,
      `Student: ${currentStudent?.name}`,
      `Range: ${from} to ${to}`,
      `Filters: Behavior ${behaviorFilter} · Category ${categoryFilter}`,
      '',
      `TOTAL INCIDENTS: ${stats?.totalIncidents ?? 0}`,
      `MOST COMMON BEHAVIOR: ${stats?.mostCommonBehavior ?? 'N/A'}`,
      `MOST COMMON ANTECEDENT: ${stats?.mostCommonAntecedent ?? 'N/A'}`,
      `THIS WEEK: ${stats?.thisWeek ?? 0}`,
      '',
      header,
      ...lines,
    ].join('\n');

    const title = 'ABC Data Sheet Export';
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #1e293b; }
          </style>
        </head>
        <body>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
  };
  const currentStudent = studentOptions.find((s) => s.id === studentId);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="ABC Log" onTabPress={(tab) => handleTeacherTabPress(navigation, tab)} />

      {/* Header with Student Info and Status Badge */}
      <View style={styles.header}>
        <View style={styles.studentSelectorRow}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{currentStudent?.name?.[0]}</Text>
          </View>
          <TouchableOpacity
            style={styles.studentDropdown}
            onPress={() => setIsDropdownOpen((prev) => !prev)}
          >
            <Text style={typography.h3}>{currentStudent?.name}</Text>
            <Feather name="chevron-down" size={16} color={colors.navyText} />
          </TouchableOpacity>
          <Text style={typography.caption}>Age {currentStudent?.age}</Text>

          {/* Pending Director Review badge appears ONLY after pressing submit */}
          {isSubmitted ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending Director Review</Text>
            </View>
          ) : (
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>Draft</Text>
            </View>
          )}
        </View>          {isDropdownOpen && (
          <View style={styles.dropdownMenu}>
            {studentOptions.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.dropdownItem,
                  student.id === studentId && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setStudentId(student.id);
                  setIsDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    student.id === studentId && styles.dropdownItemTextSelected,
                  ]}
                >
                  {student.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Verification Columns Form */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.verificationGrid}>
          {/* Teacher B Column */}
          <View style={[styles.verificationCard, isSubmitted && styles.disabledCard]}>
            <Text style={typography.h3}>Teacher B Verification</Text>
            <Text style={styles.teacherSubtext}>Jared Cruz</Text>

            <Text style={styles.sectionLabel}>Outcome *</Text>
            {OUTCOME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                disabled={isSubmitted}
                style={styles.radioRow}
                onPress={() => setTeacherBOutcome(opt)}
              >
                <View style={[styles.radioCircle, teacherBOutcome === opt && styles.radioSelected]} />
                <Text style={styles.radioText}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              editable={!isSubmitted}
              value={teacherBNotes}
              onChangeText={setTeacherBNotes}
              placeholder="Enter notes..."
            />
          </View>

          {/* Teacher C Column */}
          <View style={[styles.verificationCard, isSubmitted && styles.disabledCard]}>
            <Text style={typography.h3}>Teacher C Verification</Text>
            <Text style={styles.teacherSubtext}>Jeah Torres</Text>

            <Text style={styles.sectionLabel}>Outcome *</Text>
            {OUTCOME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                disabled={isSubmitted}
                style={styles.radioRow}
                onPress={() => setTeacherCOutcome(opt)}
              >
                <View style={[styles.radioCircle, teacherCOutcome === opt && styles.radioSelected]} />
                <Text style={styles.radioText}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionLabel}>Notes</Text>
            <TextInput
              style={styles.textArea}
              multiline
              editable={!isSubmitted}
              value={teacherCNotes}
              onChangeText={setTeacherCNotes}
              placeholder="Enter notes..."
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || isSubmitted) && styles.submitBtnDisabled]}
            disabled={!canSubmit || isSubmitted}
            onPress={handleSubmitForReview}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitted ? 'Submitted for Review' : 'Submit for Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, position: 'relative', zIndex: 100 },
  studentSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgApp, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontWeight: '700', color: colors.navyText },
  studentDropdown: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  draftBadge: { marginLeft: 'auto', backgroundColor: '#E2E8F0', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.md },
  draftBadgeText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  pendingBadge: { marginLeft: 'auto', backgroundColor: '#FACC15', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.md },
  pendingBadgeText: { fontSize: 11, color: '#1E293B', fontWeight: '700' },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 56,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    width: 140,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownItemSelected: { backgroundColor: '#93C5FD' },
  dropdownItemText: { fontSize: 14, color: colors.navyText },
  dropdownItemTextSelected: { fontWeight: '600', color: colors.navyText },
  content: { padding: spacing.lg, gap: spacing.lg },
  verificationGrid: { flexDirection: 'row', gap: spacing.md },
  verificationCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  disabledCard: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  teacherSubtext: { fontSize: 12, color: colors.mutedText, marginBottom: spacing.md },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: colors.navyText, marginTop: spacing.md, marginBottom: spacing.xs },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: 4 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#94A3B8' },
  radioSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  radioText: { fontSize: 12, color: colors.navyText },
  textArea: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, height: 80, padding: spacing.sm, textAlignVertical: 'top', backgroundColor: colors.white },
  actionRow: { alignItems: 'flex-end', marginTop: spacing.md },
  submitBtn: { backgroundColor: '#2563EB', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  submitBtnDisabled: { backgroundColor: '#94A3B8' },
  submitBtnText: { color: colors.white, fontWeight: '700' },
});