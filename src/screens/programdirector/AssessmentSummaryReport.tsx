import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { resolveStudentPhotoUri } from '../../utils/studentPhotoHelper';
import type { ProgramDirectorStackParamList } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getAssessmentSummaryDashboard } from '../../api/programDirectorApi';
import AbllsGridView from '../../components/AbllsGridView';
import ExportPreviewModal from '../../components/ExportPreviewModal';
const MASS_ITEMS = [
  {
    id: 'M1',
    text: 'Would the behavior occur continuously if left alone for long periods of time?',
  },
  { id: 'M2', text: 'Does the behavior occur when the person is asked to do a difficult task?' },
  { id: 'M3', text: 'Does the behavior seem to occur when the person is ignored?' },
  { id: 'M4', text: 'Does the behavior occur when a preferred item is taken away?' },
  { id: 'M5', text: 'Does the behavior occur when the person is left alone, with no one around?' },
  { id: 'M6', text: 'Does the behavior occur following a request to perform an undesirable task?' },
  { id: 'M7', text: 'Does the behavior occur when attention is diverted from the person?' },
  {
    id: 'M8',
    text: 'Does the behavior occur when the person is denied access to a desired item or activity?',
  },
  { id: 'M9', text: 'Does the behavior occur during a task that the person does not enjoy?' },
  { id: 'M10', text: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?' },
  { id: 'M11', text: 'Does the behavior occur to get a reaction from others?' },
  { id: 'M12', text: 'Does the behavior occur to obtain food, toys, or a specific activity?' },
];

const FAST_ITEMS = [
  { id: 'F1', text: 'Does the behavior occur when others are present, and does attention follow?' },
  { id: 'F2', text: 'Does the behavior occur to avoid or escape a task, demand, or request?' },
  { id: 'F3', text: 'Does the behavior produce a rewarding sensory effect without others?' },
  { id: 'F4', text: 'Does the behavior remove an unpleasant sensation or reduce pain?' },
  { id: 'F5', text: 'Does the behavior typically happen when the person is alone or unoccupied?' },
  { id: 'F6', text: 'Does the behavior occur during transitions or when demands increase?' },
  { id: 'F7', text: 'Does an adult typically react by giving attention or talking to the person?' },
  {
    id: 'F8',
    text: 'Is the behavior reduced when a preferred item or activity is provided freely?',
  },
];

export default function AssessmentSummaryReport({ route, navigation }: any) {
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const initialStudentId = route?.params?.studentId || urlSid || localSid || '';
  const [selectedStudent, setSelectedStudent] = useState(initialStudentId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prefTab, setPrefTab] = useState('Sensory Time');
  const [showExportModal, setShowExportModal] = useState(false);

  const [reloadCount, setReloadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setReloadCount((c) => c + 1);
    }, []),
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRefresh = () => setReloadCount((c) => c + 1);
      window.addEventListener('focus', handleRefresh);
      window.addEventListener('storage', handleRefresh);
      return () => {
        window.removeEventListener('focus', handleRefresh);
        window.removeEventListener('storage', handleRefresh);
      };
    }
  }, []);

  useEffect(() => {
    if (route?.params?.studentId && route.params.studentId !== selectedStudent) {
      setSelectedStudent(route.params.studentId);
    }
  }, [route?.params?.studentId]);

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAssessmentSummaryDashboard(selectedStudent);
        if (active) {
          setData(response.data);
          if (!selectedStudent && response.data?.selectedStudentId) {
            setSelectedStudent(response.data.selectedStudentId);
          }
        }
      } catch (err: any) {
        console.error('Failed to load assessment summary dashboard', err);
        if (active) {
          setError(err?.message || 'Failed to load assessment summary dashboard');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      active = false;
    };
  }, [selectedStudent, reloadCount]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text
            style={{ fontSize: 16, color: colors.navyText, fontWeight: '600', marginBottom: 8 }}
          >
            Unable to load assessment summary
          </Text>
          <Text
            style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center', marginBottom: 16 }}
          >
            {error || 'No assessment data available.'}
          </Text>
          <TouchableOpacity style={styles.downloadBtn} onPress={() => setReloadCount((c) => c + 1)}>
            <Text style={styles.downloadBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const students = data?.students || [];
  const selectedStudentObj = students.find((s: any) => s.id === selectedStudent);

  function handleDownload() {
    setShowExportModal(true);
  }

  if (data?.notSelected || !selectedStudentObj) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation?.canGoBack?.()) {
                navigation.goBack();
              } else {
                navigation?.navigate?.('AssessmentDashboard' as any);
              }
            }}
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backBtnText}>← Back to Assessments</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandText}>ABA</Text>
              </View>
              <View>
                <Text style={styles.pageTitle}>Assessment Summary Report</Text>
                <Text style={styles.pageSubtitle}>
                  6-Week Assessment Completion Report (SCR-015)
                </Text>
              </View>
            </View>
          </View>

          {students.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 80,
                gap: 12,
              }}
            >
              <Feather name="users" size={40} color={colors.mutedText} />
              <Text style={{ fontSize: 16, color: colors.navyText, fontWeight: '700' }}>
                No students currently in assessment
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.mutedText,
                  textAlign: 'center',
                  maxWidth: 400,
                }}
              >
                Students assigned to your caseload in "In Assessment" status will appear here once
                their 6-week assessment cycle begins.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.selectRow, { zIndex: 10 }]}>
                <Text style={styles.selectLabel}>Select Student</Text>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    style={styles.dropdownToggle}
                    onPress={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <Text style={styles.dropdownToggleText}>
                      {students.find((s: any) => s.id === selectedStudent)?.name ||
                        'Select a Student'}
                    </Text>
                  </TouchableOpacity>
                  {dropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search students..."
                        placeholderTextColor={colors.mutedText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                        {students
                          .filter((s: any) =>
                            s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                          )
                          .map((s: any) => (
                            <TouchableOpacity
                              key={s.id}
                              onPress={() => {
                                setSelectedStudent(s.id);
                                setDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              style={[
                                styles.dropdownItem,
                                selectedStudent === s.id && styles.dropdownItemActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  selectedStudent === s.id && styles.dropdownItemTextActive,
                                ]}
                              >
                                {s.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        {students.filter((s: any) =>
                          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                        ).length === 0 && (
                          <Text
                            style={{ padding: 12, color: colors.mutedText, textAlign: 'center' }}
                          >
                            No students found.
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: 100,
                }}
              >
                <Text style={{ fontSize: 18, color: colors.mutedText, fontWeight: '600' }}>
                  Please select a student from the dropdown above
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { studentInfo, abllsScores, behavior, preference, sensory, socialSkills } = data;
  const rawPhoto = studentInfo?.photoUrl || studentInfo?.headshotUrl || studentInfo?.photo;
  const resolvedPhoto = resolveStudentPhotoUri(rawPhoto);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppNavbar activeTab="Assessment Summary Report" />
      <View style={styles.backRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation?.canGoBack?.()) {
              navigation.goBack();
            } else {
              navigation?.navigate?.('AssessmentDashboard' as any);
            }
          }}
        >
          <Feather name="arrow-left" size={16} color="#334155" />
          <Text style={styles.backBtnText}>← Back to Assessments</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>ABA</Text>
            </View>
            <View>
              <Text style={styles.pageTitle}>Assessment Summary Report</Text>
              <Text style={styles.pageSubtitle}>6-Week Assessment Completion Report (SCR-015)</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDownload} style={styles.downloadBtn}>
            <Feather name="file-text" size={14} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.downloadBtnText}>Preview / Download Report</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.selectRow, { zIndex: 10 }]}>
          <Text style={styles.selectLabel}>Select Student</Text>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.dropdownToggle}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {selectedStudentObj ? (
                    <StudentAvatar
                      name={selectedStudentObj.name}
                      studentId={selectedStudentObj.id}
                      photoUrl={
                        selectedStudentObj.photoUrl ||
                        selectedStudentObj.headshotUrl ||
                        selectedStudentObj.photo ||
                        rawPhoto
                      }
                      size={28}
                    />
                  ) : null}
                  <Text style={styles.dropdownToggleText}>
                    {selectedStudentObj?.name || 'Select a Student'}
                  </Text>
                </View>
                <Feather
                  name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.mutedText}
                />
              </View>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search students..."
                  placeholderTextColor={colors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled={true}>
                  {students
                    .filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s: any) => (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => {
                          setSelectedStudent(s.id);
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        style={[
                          styles.dropdownItem,
                          selectedStudent === s.id && styles.dropdownItemActive,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <StudentAvatar
                            name={s.name}
                            studentId={s.id}
                            photoUrl={s.photoUrl || s.headshotUrl || s.photo}
                            size={32}
                          />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedStudent === s.id && styles.dropdownItemTextActive,
                            ]}
                          >
                            {s.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  {students.filter((s: any) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                  ).length === 0 && (
                    <Text style={{ padding: 12, color: colors.mutedText, textAlign: 'center' }}>
                      No students found.
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Student Info */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBlue}>
            <Text style={styles.cardHeaderText}>Student Information</Text>
          </View>
          <View style={styles.studentInfoCardBody}>
            <View style={styles.photoContainer}>
              {resolvedPhoto ? (
                <Image
                  source={{ uri: resolvedPhoto }}
                  style={styles.studentPhoto}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noPhotoBox}>
                  <Feather name="camera-off" size={24} color={colors.mutedText} />
                  <Text style={styles.noPhotoText}>no photo inserted</Text>
                </View>
              )}
            </View>

            <View style={styles.studentDetailsGrid}>
              <InfoItem label="Full Name" value={studentInfo?.fullName || '—'} />
              <InfoItem label="Date of Birth" value={studentInfo?.dateOfBirth || '—'} />
              <InfoItem
                label="Age"
                value={studentInfo?.age ? `${studentInfo.age} years old` : '—'}
              />
              <InfoItem label="Parent / Guardian" value={studentInfo?.parentGuardian || '—'} />
              <InfoItem label="Station" value={studentInfo?.station || 'Station 1'} />
              <InfoItem
                label="Photo Status"
                value={resolvedPhoto ? 'Photo Uploaded' : 'no photo inserted'}
              />
            </View>
          </View>
        </View>

        {/* ABLLS */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBlue}>
            <Text style={styles.cardHeaderText}>Skills Assessment — ABLLS-R</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardHeaderText, { marginBottom: 12, color: '#0F172A' }]}>
              ABLLS-R Skill Tracking Grid
            </Text>
            {(() => {
              let sc = abllsScores || {};
              if (
                Object.keys(sc).length === 0 &&
                typeof localStorage !== 'undefined' &&
                selectedStudent
              ) {
                try {
                  const alias =
                    selectedStudent === 'stu-1'
                      ? 'student-a'
                      : selectedStudent === 'student-a'
                        ? 'stu-1'
                        : null;
                  const raw =
                    localStorage.getItem(`melue_skills_assessment_${selectedStudent}`) ||
                    (alias ? localStorage.getItem(`melue_skills_assessment_${alias}`) : null) ||
                    localStorage.getItem(`skills_assessment_${selectedStudent}`) ||
                    (alias ? localStorage.getItem(`skills_assessment_${alias}`) : null);
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed?.scores) sc = parsed.scores;
                  }
                } catch {}
              }
              if (Object.keys(sc).length === 0) {
                return (
                  <View style={styles.emptyStateBox}>
                    <Feather name="bar-chart-2" size={28} color={colors.mutedText} />
                    <Text style={styles.emptyStateTitle}>No assessment data recorded yet</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Scores will display once the therapist records ABLLS-R skill evaluation items.
                    </Text>
                  </View>
                );
              }
              return <AbllsGridView scores={sc} />;
            })()}
          </View>
        </View>

        {/* Behavior */}
        {(() => {
          let activeBehavior = behavior;
          if (
            (!activeBehavior?.massAnswers ||
              Object.keys(activeBehavior.massAnswers).length === 0) &&
            typeof localStorage !== 'undefined' &&
            selectedStudent
          ) {
            try {
              const alias =
                selectedStudent === 'stu-1'
                  ? 'student-a'
                  : selectedStudent === 'student-a'
                    ? 'stu-1'
                    : null;
              const raw =
                localStorage.getItem(`melue_behavior_assessment_${selectedStudent}`) ||
                (alias ? localStorage.getItem(`melue_behavior_assessment_${alias}`) : null);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                  const rawRecs = Array.isArray(parsed.records)
                    ? parsed.records
                    : Array.isArray(parsed.incidents)
                      ? parsed.incidents
                      : [];
                  const antecedentCounts: Record<string, number> = {};
                  rawRecs.forEach((r: any) => {
                    const ante = (r.trigger || r.antecedent || r.description || '').trim();
                    if (ante) antecedentCounts[ante] = (antecedentCounts[ante] || 0) + 1;
                  });
                  const computedAntecedents = Object.entries(antecedentCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([antecedent, count]) => ({ antecedent, count }));

                  activeBehavior = {
                    ...activeBehavior,
                    massAnswers: {
                      ...(activeBehavior?.massAnswers || {}),
                      ...(parsed.massAnswers || {}),
                    },
                    fastAnswers: {
                      ...(activeBehavior?.fastAnswers || {}),
                      ...(parsed.fastAnswers || {}),
                    },
                    abc: {
                      totalIncidents: rawRecs.length || activeBehavior?.abc?.totalIncidents || 0,
                      topAntecedents:
                        computedAntecedents.length > 0
                          ? computedAntecedents
                          : activeBehavior?.abc?.topAntecedents || [],
                    },
                  };
                }
              }
            } catch {}
          }

          return (
            <View style={styles.card}>
              <View style={styles.cardHeaderBlue}>
                <Text style={styles.cardHeaderText}>Behavior Assessment</Text>
              </View>
              <View style={styles.cardBody}>
                <SectionTitle title="Motivation Assessment Scale (MASS) - Q&A" />
                {MASS_ITEMS.map((item) => (
                  <View key={item.id} style={{ marginBottom: 12 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 }}
                    >
                      {item.id}. {item.text}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#475569' }}>
                      Answer:{' '}
                      <Text
                        style={{
                          fontWeight: '500',
                          color: activeBehavior?.massAnswers?.[item.id] ? '#0284C7' : '#94A3B8',
                        }}
                      >
                        {activeBehavior?.massAnswers?.[item.id] || 'Not answered'}
                      </Text>
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <SectionTitle title="Functional Analysis Screening Tool (FAST) - Q&A" />
                {FAST_ITEMS.map((item) => {
                  const rawVal = activeBehavior?.fastAnswers?.[item.id];
                  const isAnswered = rawVal !== undefined && rawVal !== null && rawVal !== '';
                  const answerText =
                    rawVal === true || rawVal === 'Yes' || rawVal === 'true'
                      ? 'Yes'
                      : rawVal === false || rawVal === 'No' || rawVal === 'false'
                        ? 'No'
                        : isAnswered
                          ? String(rawVal)
                          : 'Not answered';

                  return (
                    <View key={item.id} style={{ marginBottom: 12 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#0F172A',
                          marginBottom: 4,
                        }}
                      >
                        {item.id}. {item.text}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#475569' }}>
                        Answer:{' '}
                        <Text
                          style={{ fontWeight: '500', color: isAnswered ? '#0284C7' : '#94A3B8' }}
                        >
                          {answerText}
                        </Text>
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.divider} />

                <SectionTitle title="ABC Incident Log Summary" />
                <Text style={styles.subNote}>
                  Total incidents:{' '}
                  <Text style={styles.subNoteBold}>{activeBehavior?.abc?.totalIncidents ?? 0}</Text>
                </Text>
                {(activeBehavior?.abc?.topAntecedents || []).length > 0 ? (
                  <>
                    <TableHeader cols={['Top Antecedents', 'Count']} />
                    {activeBehavior.abc.topAntecedents.map((item: any, idx: number) => (
                      <TableRow
                        key={item.antecedent ? `ante-${item.antecedent}` : `ante-idx-${idx}`}
                        values={[
                          <Text key="a" style={styles.tableCell}>
                            {item.antecedent || item.name}
                          </Text>,
                          <Text key="c" style={[styles.tableCell, styles.tableRight]}>
                            {item.count}
                          </Text>,
                        ]}
                      />
                    ))}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedText,
                      fontStyle: 'italic',
                      marginVertical: 8,
                    }}
                  >
                    No behavior incidents logged for this student.
                  </Text>
                )}
              </View>
            </View>
          );
        })()}

        {/* Preference */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBlue}>
            <Text style={styles.cardHeaderText}>Preference Assessment (MCTC-TRP-013)</Text>
          </View>
          <View style={styles.cardBody}>
            <View style={radioStyles.row}>
              {['Unified Inventory', 'Sensory Time', 'Circle Time', 'Play Time'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={radioStyles.radioBtn}
                  onPress={() => setPrefTab(tab)}
                >
                  <View
                    style={[
                      radioStyles.radioCircle,
                      prefTab === tab && radioStyles.radioCircleSelected,
                    ]}
                  >
                    {prefTab === tab && <View style={radioStyles.radioDot} />}
                  </View>
                  <Text style={radioStyles.radioText}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {(() => {
              let allItems = preference?.items || [];
              let savedTiers = preference?.tiers;
              if (allItems.length === 0 && typeof localStorage !== 'undefined' && selectedStudent) {
                try {
                  const alias =
                    selectedStudent === 'stu-1'
                      ? 'student-a'
                      : selectedStudent === 'student-a'
                        ? 'stu-1'
                        : null;
                  const raw =
                    localStorage.getItem(`melue_preference_assessment_${selectedStudent}`) ||
                    (alias ? localStorage.getItem(`melue_preference_assessment_${alias}`) : null);
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (
                      Array.isArray(parsed?.allObservations) &&
                      parsed.allObservations.length > 0
                    ) {
                      allItems = parsed.allObservations;
                    } else if (
                      Array.isArray(parsed?.ranked_observations) &&
                      parsed.ranked_observations.length > 0
                    ) {
                      allItems = parsed.ranked_observations;
                    } else if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
                      allItems = parsed.items;
                    }
                    if (parsed?.tiers) savedTiers = parsed.tiers;
                  }
                } catch {}
              }

              const filteredItems = allItems.filter((item: any) => {
                if (prefTab === 'Unified Inventory') return true;
                if (!item.context) return true;
                const cleanCtx = item.context.toLowerCase().replace(/_/g, ' ');
                const cleanTab = prefTab.toLowerCase().replace(' time', '');
                return cleanCtx.includes(cleanTab) || cleanCtx === prefTab.toLowerCase();
              });

              if (filteredItems.length === 0) {
                return (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedText,
                      fontStyle: 'italic',
                      marginVertical: 8,
                    }}
                  >
                    No preference observations recorded for {prefTab}.
                  </Text>
                );
              }

              // Compute 3 tiers dynamically if not present
              const lowTier: any[] = [];
              const engagedTier: any[] = [];
              allItems.forEach((i: any) => {
                const isDidNot =
                  i.approached === 'Did Not Approach' ||
                  i.engaged === 'No' ||
                  (Number(i.durationSeconds ?? i.duration_seconds ?? 0) === 0 &&
                    Number(i.frequency ?? i.frequency_count ?? 0) === 0);
                if (isDidNot) {
                  lowTier.push(i);
                } else {
                  engagedTier.push(i);
                }
              });

              engagedTier.sort((a: any, b: any) => {
                const durA = Number(a.durationSeconds ?? a.duration_seconds ?? 0);
                const durB = Number(b.durationSeconds ?? b.duration_seconds ?? 0);
                if (durB !== durA) return durB - durA;
                return Number(b.frequency || 0) - Number(a.frequency || 0);
              });

              const mid = Math.max(1, Math.ceil(engagedTier.length / 2));
              const highestTier = savedTiers?.highest || engagedTier.slice(0, mid);
              const moderateTier = savedTiers?.moderate || engagedTier.slice(mid);
              const finalLowTier = savedTiers?.low || lowTier;

              return (
                <>
                  <TableHeader
                    cols={[
                      'Rank',
                      'Preferred Item',
                      'Duration',
                      'Freq',
                      'Context',
                      'Engagement',
                      'Approach Status',
                    ]}
                    alignEnd={false}
                  />
                  {filteredItems.map((item: any, idx: number) => {
                    const isApproached =
                      item.approached === 'Approached' || item.approached === 'Initiated';
                    const isDidNot = item.approached === 'Did Not Approach';
                    const approachedLabel = isApproached
                      ? '✓ Approached'
                      : isDidNot
                        ? '✗ Did Not'
                        : item.approached || '—';

                    return (
                      <TableRow
                        key={
                          item.id
                            ? `pref-${item.id}`
                            : item.rank !== undefined
                              ? `pref-rank-${item.rank}-${idx}`
                              : `pref-idx-${idx}`
                        }
                        values={[
                          <Text key="r" style={[styles.tableCell, styles.tableBoldText]}>
                            <View style={styles.rankCircle}>
                              <Text style={styles.rankText}>{item.rank || idx + 1}</Text>
                            </View>
                          </Text>,
                          <Text key="i" style={[styles.tableCell, styles.tableBoldText]}>
                            {item.name || item.item}
                          </Text>,
                          <Text key="d" style={[styles.tableCell, styles.tableRight]}>
                            {item.duration ||
                              (item.durationSeconds ? `${item.durationSeconds}s` : '0s')}
                          </Text>,
                          <Text key="f" style={[styles.tableCell, styles.tableRight]}>
                            {item.frequency || item.frequency_count || 0}x
                          </Text>,
                          <Text
                            key="c"
                            style={[styles.tableCell, { fontSize: 11, color: colors.mutedText }]}
                          >
                            {item.context || 'Unified'}
                          </Text>,
                          <Text key="e" style={[styles.tableCell, { fontSize: 11 }]}>
                            {item.engaged || (isDidNot ? 'No' : '—')}
                          </Text>,
                          <Text
                            key="a"
                            style={[
                              styles.tableCell,
                              {
                                fontSize: 11,
                                fontWeight: '700',
                                color: isApproached
                                  ? '#16A34A'
                                  : isDidNot
                                    ? '#DC2626'
                                    : colors.mutedText,
                              },
                            ]}
                          >
                            {approachedLabel}
                          </Text>,
                        ]}
                      />
                    );
                  })}

                  {/* 3-Tier Dynamic Preference Hierarchy Block */}
                  <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.navyText,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      3-Tier Preference Hierarchy Summary (MCTC-TRP-013)
                    </Text>
                    <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
                      {/* Tier 1: Highest */}
                      <View
                        style={{
                          flex: 1,
                          minWidth: 200,
                          backgroundColor: '#F0FDF4',
                          borderTopWidth: 3,
                          borderTopColor: '#16A34A',
                          borderRadius: radius.md,
                          padding: spacing.md,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>
                          Highest Preferred ({highestTier.length})
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.mutedText }}>
                          Longest total duration & frequent approach
                        </Text>
                        {highestTier.length > 0 ? (
                          highestTier.map((t: any, i: number) => (
                            <Text
                              key={i}
                              style={{ fontSize: 11, color: colors.navyText, fontWeight: '600' }}
                            >
                              • {t.name || t.item}
                            </Text>
                          ))
                        ) : (
                          <Text
                            style={{ fontSize: 10, fontStyle: 'italic', color: colors.mutedText }}
                          >
                            None recorded
                          </Text>
                        )}
                      </View>

                      {/* Tier 2: Moderate */}
                      <View
                        style={{
                          flex: 1,
                          minWidth: 200,
                          backgroundColor: '#FFFBEB',
                          borderTopWidth: 3,
                          borderTopColor: '#D97706',
                          borderRadius: radius.md,
                          padding: spacing.md,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#D97706' }}>
                          Moderately Preferred ({moderateTier.length})
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.mutedText }}>
                          Moderate duration or inconsistent engagement
                        </Text>
                        {moderateTier.length > 0 ? (
                          moderateTier.map((t: any, i: number) => (
                            <Text
                              key={i}
                              style={{ fontSize: 11, color: colors.navyText, fontWeight: '600' }}
                            >
                              • {t.name || t.item}
                            </Text>
                          ))
                        ) : (
                          <Text
                            style={{ fontSize: 10, fontStyle: 'italic', color: colors.mutedText }}
                          >
                            None recorded
                          </Text>
                        )}
                      </View>

                      {/* Tier 3: Low */}
                      <View
                        style={{
                          flex: 1,
                          minWidth: 200,
                          backgroundColor: '#FEF2F2',
                          borderTopWidth: 3,
                          borderTopColor: '#DC2626',
                          borderRadius: radius.md,
                          padding: spacing.md,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                          Low Preferred ({finalLowTier.length})
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.mutedText }}>
                          Did not approach or zero engagement
                        </Text>
                        {finalLowTier.length > 0 ? (
                          finalLowTier.map((t: any, i: number) => (
                            <Text
                              key={i}
                              style={{ fontSize: 11, color: colors.navyText, fontWeight: '600' }}
                            >
                              • {t.name || t.item}
                            </Text>
                          ))
                        ) : (
                          <Text
                            style={{ fontSize: 10, fontStyle: 'italic', color: colors.mutedText }}
                          >
                            None recorded
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </>
              );
            })()}
          </View>
        </View>

        {/* Sensory */}
        {(() => {
          let activities = sensory?.activities || [];
          if (activities.length === 0 && typeof localStorage !== 'undefined' && selectedStudent) {
            try {
              const alias =
                selectedStudent === 'stu-1'
                  ? 'student-a'
                  : selectedStudent === 'student-a'
                    ? 'stu-1'
                    : null;
              const raw =
                localStorage.getItem(`melue_sensory_assessment_${selectedStudent}`) ||
                (alias ? localStorage.getItem(`melue_sensory_assessment_${alias}`) : null);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed?.activities)) activities = parsed.activities;
              }
            } catch {}
          }
          if (!activities || activities.length === 0) return null;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeaderBlue}>
                <Text style={styles.cardHeaderText}>Sensory Assessment</Text>
              </View>
              <View style={styles.cardBody}>
                <TableHeader
                  cols={['Activity', 'Engagement', 'Reaction', 'Notes']}
                  alignEnd={false}
                />
                {activities.map((item: any, idx: number) => (
                  <TableRow
                    key={idx}
                    values={[
                      <Text key="n" style={styles.tableCell}>
                        {item.name}
                      </Text>,
                      <Text key="e" style={styles.tableCell}>
                        {item.engagementLevel || 'N/A'}
                      </Text>,
                      <Text key="r" style={styles.tableCell}>
                        {item.responseReaction || 'N/A'}
                      </Text>,
                      <Text key="m" style={styles.tableCell}>
                        {item.remark || 'N/A'}
                      </Text>,
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })()}

        {/* Social Skills */}
        {(() => {
          let scores = socialSkills?.scores || {};
          let percent = socialSkills?.percent ?? 0;
          if (
            Object.keys(scores).length === 0 &&
            typeof localStorage !== 'undefined' &&
            selectedStudent
          ) {
            try {
              const alias =
                selectedStudent === 'stu-1'
                  ? 'student-a'
                  : selectedStudent === 'student-a'
                    ? 'stu-1'
                    : null;
              const raw =
                localStorage.getItem(`melue_social_skills_assessment_${selectedStudent}`) ||
                (alias ? localStorage.getItem(`melue_social_skills_assessment_${alias}`) : null);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.scores) {
                  scores = parsed.scores;
                  percent = parsed.percent ?? 0;
                }
              }
            } catch {}
          }
          if (Object.keys(scores).length === 0) return null;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeaderBlue}>
                <Text style={styles.cardHeaderText}>Social Skills Questionnaire</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.subNote}>
                  Completed: <Text style={styles.subNoteBold}>{percent}%</Text>
                </Text>
                <TableHeader cols={['Question ID', 'Score']} alignEnd={false} />
                {Object.keys(scores).map((key: string) => (
                  <TableRow
                    key={key}
                    values={[
                      <Text key="k" style={styles.tableCell}>
                        {key}
                      </Text>,
                      <Text key="v" style={styles.tableCell}>
                        {scores[key]}
                      </Text>,
                    ]}
                  />
                ))}
              </View>
            </View>
          );
        })()}

        <View style={styles.footerActions}>
          <TouchableOpacity onPress={handleDownload} style={styles.footerBtn}>
            <Feather name="file-text" size={14} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.footerBtnText}>Preview / Download Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExportPreviewModal
        visible={showExportModal}
        title={`Assessment Summary Report — ${selectedStudentObj?.name || studentInfo?.fullName || 'Student'}`}
        filename={`Assessment_Summary_${(selectedStudentObj?.name || 'student').replace(/\s+/g, '_')}.txt`}
        content={(() => {
          const sName = selectedStudentObj?.name || studentInfo?.fullName || 'Student';
          const sAge = studentInfo?.age ? `${studentInfo.age} yrs` : '—';
          const sStation = studentInfo?.station || 'Station 1';
          const lines = [
            '========================================================================',
            `6-WEEK ASSESSMENT SUMMARY REPORT: ${sName.toUpperCase()}`,
            '========================================================================',
            `Student Name: ${sName}`,
            `Age: ${sAge} | Station: ${sStation}`,
            `Date of Report: ${new Date().toLocaleDateString()}`,
            '',
            '1. SKILLS ASSESSMENT (ABLLS-R)',
            '------------------------------------------------------------------------',
            `Items Evaluated: ${Object.keys(abllsScores || {}).length}`,
            ...(Object.keys(abllsScores || {}).length > 0
              ? Object.entries(abllsScores || {}).map(([k, v]) => `  • ${k}: Score ${v}`)
              : ['  • No assessment data recorded yet']),
            '',
            '2. BEHAVIOR ASSESSMENT (MASS / FAST / ABC)',
            '------------------------------------------------------------------------',
            `Total ABC Incidents Logged: ${behavior?.abc?.totalIncidents || 0}`,
            `Top Antecedents: ${(behavior?.abc?.topAntecedents || []).map((a: any) => `${a.antecedent} (${a.count})`).join(', ') || 'None'}`,
            '',
            '3. PREFERENCE ASSESSMENT (FORM MCTC-TRP-013)',
            '------------------------------------------------------------------------',
            (() => {
              let allPref = preference?.items || [];
              let savedTiers = preference?.tiers;
              if (allPref.length === 0 && typeof localStorage !== 'undefined' && selectedStudent) {
                try {
                  const alias =
                    selectedStudent === 'stu-1'
                      ? 'student-a'
                      : selectedStudent === 'student-a'
                        ? 'stu-1'
                        : null;
                  const raw =
                    localStorage.getItem(`melue_preference_assessment_${selectedStudent}`) ||
                    (alias ? localStorage.getItem(`melue_preference_assessment_${alias}`) : null);
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed?.allObservations)) allPref = parsed.allObservations;
                    else if (Array.isArray(parsed?.ranked_observations))
                      allPref = parsed.ranked_observations;
                    else if (Array.isArray(parsed?.items)) allPref = parsed.items;
                    if (parsed?.tiers) savedTiers = parsed.tiers;
                  }
                } catch {}
              }

              const lowTier: any[] = [];
              const engagedTier: any[] = [];
              allPref.forEach((i: any) => {
                const isDidNot =
                  i.approached === 'Did Not Approach' ||
                  i.engaged === 'No' ||
                  (Number(i.durationSeconds ?? i.duration_seconds ?? 0) === 0 &&
                    Number(i.frequency ?? i.frequency_count ?? 0) === 0);
                if (isDidNot) lowTier.push(i);
                else engagedTier.push(i);
              });

              engagedTier.sort((a: any, b: any) => {
                const durA = Number(a.durationSeconds ?? a.duration_seconds ?? 0);
                const durB = Number(b.durationSeconds ?? b.duration_seconds ?? 0);
                if (durB !== durA) return durB - durA;
                return Number(b.frequency || 0) - Number(a.frequency || 0);
              });

              const mid = Math.max(1, Math.ceil(engagedTier.length / 2));
              const highest = savedTiers?.highest || engagedTier.slice(0, mid);
              const moderate = savedTiers?.moderate || engagedTier.slice(mid);
              const low = savedTiers?.low || lowTier;

              const secLines = [
                `Evaluated Items: ${allPref.length} Canonical Inventory Items`,
                '',
                '[HIGHEST PREFERRED ITEMS]',
                ...(highest.length > 0
                  ? highest.map(
                      (i: any) =>
                        `  • ${i.name || i.item}: ${i.duration || (i.durationSeconds ? i.durationSeconds + 's' : '—')} (${i.frequency || i.frequency_count || 0} approaches)`,
                    )
                  : ['  • None recorded']),
                '',
                '[MODERATELY PREFERRED ITEMS]',
                ...(moderate.length > 0
                  ? moderate.map(
                      (i: any) =>
                        `  • ${i.name || i.item}: ${i.duration || (i.durationSeconds ? i.durationSeconds + 's' : '—')} (${i.frequency || i.frequency_count || 0} approaches)`,
                    )
                  : ['  • None recorded']),
                '',
                '[LOW PREFERRED ITEMS]',
                ...(low.length > 0
                  ? low.map(
                      (i: any) =>
                        `  • ${i.name || i.item}: ${i.approached === 'Did Not Approach' ? 'Did Not Approach' : 'Zero Engagement'}`,
                    )
                  : ['  • None recorded']),
              ];
              return secLines.join('\n');
            })(),
            '',
            '4. SENSORY TIME ENGAGEMENT ASSESSMENT',
            '------------------------------------------------------------------------',
            `Activities Tracked: ${(sensory?.activities || []).map((a: any) => `${a.name} [${a.engagementLevel}]`).join(', ') || 'None recorded'}`,
            '',
            '========================================================================',
            'END OF ASSESSMENT SUMMARY REPORT',
            '========================================================================',
          ];
          return lines.join('\n');
        })()}
        onClose={() => setShowExportModal(false)}
      />
    </SafeAreaView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function TableHeader({ cols, alignEnd = true }: { cols: string[]; alignEnd?: boolean }) {
  return (
    <View style={styles.tableHeaderRow}>
      {cols.map((c, i) => (
        <Text
          key={i}
          style={[styles.tableHeaderCell, i > 0 && alignEnd ? styles.tableRight : null]}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

function TableRow({ values }: { values: React.ReactNode[] }) {
  return (
    <View style={styles.tableRow}>
      {values.map((v, i) => (
        <View key={i} style={i === 0 ? styles.tableCell : styles.tableCellRight}>
          {v}
        </View>
      ))}
    </View>
  );
}

const radioStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  radioBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: { borderColor: '#0284C7' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284C7' },
  radioText: { fontSize: 13, color: '#334155' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgApp },
  container: { flex: 1, backgroundColor: colors.bgApp },
  contentContainer: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.navyText },
  pageSubtitle: { fontSize: 12, color: colors.mutedText },
  downloadBtn: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  selectRow: { marginBottom: spacing.md },
  selectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  selectWrapper: { flexDirection: 'row', gap: spacing.sm },

  dropdownToggle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dropdownToggleText: {
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }),
    zIndex: 1000,
  },
  searchInput: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    fontWeight: '600',
    color: '#2563eb',
  },

  selectOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  selectOptionActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  selectOptionText: { fontSize: 13, color: colors.bodyText },
  selectOptionTextActive: { fontWeight: '600', color: '#2563EB' },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeaderBlue: {
    backgroundColor: '#38BDF8',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardHeaderText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardBody: { padding: spacing.lg, gap: spacing.md },
  studentInfoCardBody: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentPhoto: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#38BDF8',
    backgroundColor: '#F1F5F9',
  },
  noPhotoBox: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  noPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.mutedText,
    textAlign: 'center',
  },
  studentDetailsGrid: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  infoItem: { width: '48%', minWidth: 120 },
  infoLabel: {
    fontSize: 10,
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.navyText },
  abllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  abllDomain: { width: 110, fontSize: 13, fontWeight: '500', color: colors.navyText },
  abllBarWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  barFill: { height: 10, borderRadius: 999 },
  abllScoreText: { width: 36, textAlign: 'right', fontSize: 11, color: colors.mutedText },
  pill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '600' },
  needMapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  needBox: { flex: 1, minWidth: 140, borderRadius: radius.md, padding: spacing.sm },
  needTitle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  needItems: { fontSize: 11 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    marginBottom: spacing.xs,
  },
  subNote: { fontSize: 12, color: colors.mutedText, marginTop: spacing.xs },
  subNoteBold: { fontWeight: '600', color: colors.navyText },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  tableCell: { flex: 1, fontSize: 13, color: colors.bodyText },
  tableCellRight: { flex: 1, fontSize: 13, color: colors.bodyText, textAlign: 'right' },
  tableBoldText: { fontWeight: '600', color: colors.navyText },
  tableRight: { textAlign: 'right' },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  iupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  iupLabel: { fontSize: 13, fontWeight: '500', color: colors.bodyText },
  iupPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
  iupPillGreen: { backgroundColor: '#D1FAE5' },
  iupPillYellow: { backgroundColor: '#FEF3C7' },
  iupPillGreenText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  iupPillYellowText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  goalSection: { marginTop: spacing.md },
  goalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  goalId: { fontSize: 12, fontWeight: '700', color: '#2563EB', width: 28 },
  goalDesc: { flex: 1, fontSize: 13, color: colors.bodyText },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  footerBtn: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBtnText: { fontSize: 13, fontWeight: '700', color: colors.navyText },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  backBtnText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  emptyStateBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
  },
});
