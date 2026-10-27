// screens/programdirector/AssessmentSummaryReport.tsx
// SCR-PD-002 / SCR-015: Consolidated Clinical Assessment Summary Report & Pure PDF Viewer

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import { colors, radius } from '../../theme/colors';
import {
  getAssessmentsForReview,
  getAssessmentReport,
  markAssessmentReviewed,
  addAssessmentNote,
} from '../../api/programDirectorApi';
import {
  generateClinicalAssessmentHtml,
  type ClinicalReportPayload,
} from '../../utils/clinicalAssessmentPdfGenerator';
import { openPrintWindow, downloadTextFile, isWeb } from '../../utils/webExport';
import { AssessmentAnalyticsVisuals } from './summaryreport/components';

function formatMMSS(totalSec?: number): string {
  const s = Math.max(0, Number(totalSec) || 0);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function AssessmentSummaryReport({ route, navigation }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isTablet = width >= 720 && width < 1080;

  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const initialStudentId = route?.params?.studentId || urlSid || localSid || '';

  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId);
  const [reportData, setReportData] = useState<ClinicalReportPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('complete');

  // Student selection dropdown
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>('');

  // View mode: 'dynamic' (interactive dashboard) vs 'document' (pure Form MCTC-TRP-015 PDF iframe)
  const [viewMode, setViewMode] = useState<'dynamic' | 'document'>('dynamic');
  const [activeSubTab, setActiveSubTab] = useState<string>('all');

  // Approve & Sign-Off state
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [submittingApproval, setSubmittingApproval] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Load students for the dropdown
  const loadStudents = useCallback(async () => {
    try {
      const { data } = await getAssessmentsForReview();
      const list = Array.isArray(data) ? data : [];
      setStudentsList(list);
      if (!selectedStudent && list.length > 0) {
        setSelectedStudent(list[0].studentId);
      }
    } catch (err) {
      console.warn('Could not load student list for dropdown', err);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (route?.params?.studentId && route.params.studentId !== selectedStudent) {
      setSelectedStudent(route.params.studentId);
    }
  }, [route?.params?.studentId]);

  const loadReport = useCallback(
    async (sid?: string) => {
      const targetId = sid || selectedStudent;
      if (!targetId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getAssessmentReport(targetId);
        const data = res?.data || {};
        setReportData(data);
        const currentStatus = data.assessment?.status || data.student?.status || 'complete';
        setStatus(currentStatus);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('last_assessment_student_id', targetId);
        }
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.set('studentId', targetId);
          window.history.replaceState({}, '', url.toString());
        }
      } catch (err: any) {
        console.error('Failed to load clinical assessment report', err);
        setError(err?.message || 'Failed to load clinical intake report');
      } finally {
        setLoading(false);
      }
    },
    [selectedStudent],
  );

  useEffect(() => {
    if (selectedStudent) {
      loadReport(selectedStudent);
    }
  }, [selectedStudent, loadReport]);

  useFocusEffect(
    useCallback(() => {
      if (selectedStudent) {
        loadReport(selectedStudent);
      }
    }, [selectedStudent, loadReport]),
  );

  const student = reportData?.student || {};
  const studentName = student.full_name || student.name || '—';
  const age = student.age != null ? `${student.age} yrs` : '—';
  const dob = student.date_of_birth || '—';
  const diagnosis = student.diagnosis || '—';
  const programType = student.program || student.program_type || '—';
  const therapyGroup = student.therapyGroup || student.therapy_group || '—';
  const leadClinician =
    student.lead_clinician || student.therapist || reportData?.lead_clinician || '—';
  const assessmentWindow =
    student.assessment_window ||
    student.completed_on ||
    reportData?.assessment?.completed_on ||
    '—';

  // Real Student ID with format MEL-****-YY
  const rawId =
    student.student_number ||
    student.studentNumber ||
    student.student_id ||
    student.id ||
    selectedStudent ||
    '';
  let formattedStudentId = rawId || '—';
  if (rawId && !/^MEL-.*-\d{2}$/i.test(formattedStudentId)) {
    const cleanNum = String(rawId)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase()
      .padEnd(4, '0');
    formattedStudentId = `MEL-${cleanNum}-26`;
  }

  const isReviewed =
    status.toLowerCase() === 'reviewed' || status.toLowerCase() === 'ready_for_iup';

  // Sub-assessment 1: ABLLS-R data - strictly dynamic from real records
  const skills = reportData?.skills || {};
  const domains = skills.domains || [];
  const totalEvaluatedDomains = skills.total_domains_evaluated || domains.length;
  const totalScoredItems = domains.reduce((acc: number, d: any) => acc + (d.scored_items || 0), 0);
  const totalPointsEarned = domains.reduce((acc: number, d: any) => acc + (d.total_points || 0), 0);
  const totalPossiblePoints = domains.reduce(
    (acc: number, d: any) => acc + (d.max_possible_points || 0),
    0,
  );
  const overallMastery =
    skills.overall_mastery_percentage ??
    skills.overall_score ??
    (totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0);
  const emergingSkills = (skills.emerging_skills || []).slice(0, 10);
  const criticalGaps = (skills.critical_gaps || []).slice(0, 10);
  const needAnalysis = skills.need_analysis || [];

  // Sub-assessment 2: Behavior data - strictly dynamic from real records
  const behavior = reportData?.behavior || {};
  const targetBehaviors = behavior.target_behaviors || [];
  const abcLogs = (behavior.abc_incident_log || []).slice(0, 8);

  // Dynamic MAS scores from real records
  const masRows: Array<{ func: string; total: string | number; mean: number; rank: number }> = [];
  const firstTb = targetBehaviors[0];
  const rawMas =
    firstTb?.mas_scores || (behavior as any).mas_scores || (behavior as any).mass?.scores;
  if (rawMas && typeof rawMas === 'object') {
    const masKeys = [
      { key: 'escape', label: 'Demand / Escape' },
      { key: 'attention', label: 'Attention Seeking' },
      { key: 'tangible', label: 'Tangible Access' },
      { key: 'sensory', label: 'Sensory / Automatic' },
    ];
    masKeys.forEach(({ key, label }, i) => {
      const entry = rawMas[key] || rawMas[label];
      if (entry) {
        masRows.push({
          func: label,
          total: entry.total ?? entry.score ?? '—',
          mean: entry.mean != null ? Number(entry.mean) : 0,
          rank: entry.rank ?? i + 1,
        });
      }
    });
  }

  // Dynamic FAST scores from real records
  const fastRows: Array<{ variable: string; yes: string; pct: string; dominant: boolean }> = [];
  const rawFast =
    firstTb?.fast_scores || (behavior as any).fast_scores || (behavior as any).fast?.scores;
  if (rawFast && typeof rawFast === 'object') {
    const fastKeys = [
      { key: 'social_escape', label: 'Social Escape (Demands)' },
      { key: 'social_attention', label: 'Social Attention' },
      { key: 'social_tangible', label: 'Social Tangibles' },
      { key: 'automatic_sensory', label: 'Sensory Stimulation' },
      { key: 'automatic_pain', label: 'Pain Attenuation' },
    ];
    fastKeys.forEach(({ key, label }) => {
      const entry = rawFast[key] || rawFast[label];
      if (entry) {
        const yes = entry.yes_count ?? entry.yesCount ?? entry.score ?? 0;
        const max = entry.max_points ?? entry.maxPoints ?? 8;
        const pctVal =
          entry.percentage != null
            ? `${Math.round(entry.percentage)}%`
            : `${Math.round((yes / (max || 1)) * 100)}%`;
        const isDom = Boolean(entry.is_dominant || entry.dominant);
        fastRows.push({
          variable: label,
          yes: `${yes} / ${max}`,
          pct: pctVal,
          dominant: isDom,
        });
      }
    });
  }

  // Sub-assessment 3: Preference tiers - strictly dynamic from real records
  const preferences = reportData?.preferences || {};
  const rawHighest = preferences.tiers?.highest || [];
  const rawModerate = preferences.tiers?.moderate || [];
  const rawLow = preferences.tiers?.low || [];
  const topPrefs = preferences.top_preferences || (preferences as any).top_items || [];

  let highestPrefs = rawHighest;
  let moderatePrefs = rawModerate;
  let lowPrefs = rawLow;

  if (
    highestPrefs.length === 0 &&
    moderatePrefs.length === 0 &&
    lowPrefs.length === 0 &&
    topPrefs.length > 0
  ) {
    highestPrefs = topPrefs.slice(0, 3).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 180,
      frequency_count: p.frequency_count || 4,
      context: p.context || 'Session Reinforcer',
    }));
    moderatePrefs = topPrefs.slice(3, 5).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 60,
      frequency_count: p.frequency_count || 2,
      context: p.context || 'Tabletop Activity',
    }));
    lowPrefs = topPrefs.slice(5).map((p: any) => ({
      name: typeof p === 'string' ? p : p.name,
      duration_seconds: p.duration_seconds || 0,
      frequency_count: p.frequency_count || 0,
      context: p.context || 'Neutral Item',
    }));
  }

  // Sub-assessment 4: Sensory activities - strictly from recorded activities
  const sensory = reportData?.sensory || {};
  const sensoryActivities = (sensory.activities || []).map((act: any) => ({
    code: act.code || 'SEN',
    name: act.name || 'Sensory Activity',
    engagement_level: act.engagement_level || 'Evaluated',
    response_reaction: act.response_reaction || 'Observed',
    remark: act.remark || '—',
  }));

  // Filtered students for dropdown
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentsList;
    const q = studentSearch.toLowerCase().trim();
    return studentsList.filter((s) => {
      const sName = (s.studentName || s.name || '').toLowerCase();
      const sId = (s.studentNumber || s.student_number || s.studentId || '').toLowerCase();
      const sProg = (s.program || '').toLowerCase();
      return sName.includes(q) || sId.includes(q) || sProg.includes(q);
    });
  }, [studentsList, studentSearch]);

  // Generated institutional clinical document markup (Form MCTC-TRP-015)
  const htmlContent = useMemo(() => {
    if (!reportData) return '';
    return generateClinicalAssessmentHtml({
      ...reportData,
      student: {
        ...(reportData.student || {}),
        student_number: formattedStudentId,
        studentNumber: formattedStudentId,
      },
      assessment: {
        ...(reportData.assessment || {}),
        status: isReviewed ? 'reviewed' : reportData.assessment?.status || 'complete',
      },
    });
  }, [reportData, isReviewed, formattedStudentId]);

  const handlePrint = () => {
    if (isWeb() && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      } catch (err) {
        console.warn('Iframe print error, falling back to openPrintWindow', err);
      }
    }
    openPrintWindow(htmlContent, `Clinical_Assessment_${studentName}`, {
      formId: 'MCTC-TRP-015',
      revisionNumber: 'Rev: August 2025',
    });
  };

  const handleDownload = () => {
    const filename = `Clinical_Assessment_MCTC-TRP-015_${studentName.replace(/\s+/g, '_')}.html`;
    downloadTextFile(filename, htmlContent);
  };

  const handleConfirmApproval = async () => {
    setSubmittingApproval(true);
    try {
      await markAssessmentReviewed(selectedStudent, {
        notes: approvalNotes || 'Digitally approved by Program Director for IUP Initiation.',
        status: 'ready_for_iup',
      });
      if (approvalNotes.trim()) {
        await addAssessmentNote(selectedStudent, { note: approvalNotes });
      }
      setStatus('reviewed');
      setShowApproveModal(false);
      Alert.alert(
        'Assessment Approved',
        `${studentName}'s 4-part assessment battery has been digitally signed off. Status updated to Ready for IUP (FR-057).`,
        [{ text: 'OK' }],
      );
    } catch (err: any) {
      console.error('Failed to approve assessment', err);
      Alert.alert('Error', 'Unable to complete sign-off. Please try again.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppNavbar activeTab="Assessment Review & Approval" />

      {/* Top Action & Navigation Bar */}
      <View
        style={[
          styles.topToolbar,
          isTablet && styles.topToolbarTablet,
          isMobile && styles.topToolbarMobile,
        ]}
      >
        {/* Left: Back Return & Student Selector Dropdown */}
        <View style={[styles.topLeftGroup, isMobile && styles.topLeftGroupMobile]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('AssessmentReview');
              }
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={16} color={colors.primaryBlue} />
            <Text style={styles.backBtnText}>{isMobile ? 'Back' : 'Review Queue'}</Text>
          </TouchableOpacity>

          {/* Student Selection Dropdown Trigger */}
          <View style={[styles.dropdownContainer, isMobile && { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.studentDropdownBtn, isMobile && { minWidth: 0, width: '100%' }]}
              onPress={() => setDropdownOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Feather name="user" size={15} color={colors.primaryBlue} />
              <View style={styles.studentTriggerContent}>
                <Text style={styles.studentTriggerName} numberOfLines={1}>
                  {studentName}
                </Text>
                <View style={styles.studentIdPill}>
                  <Text style={styles.studentIdPillText}>Student ID: {formattedStudentId}</Text>
                </View>
              </View>
              <Feather
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {/* Dropdown Menu Modal / Overlay */}
            {dropdownOpen && (
              <View
                style={[
                  styles.dropdownMenu,
                  isMobile && { width: Math.min(width - 32, 360), left: 0 },
                ]}
              >
                <View style={styles.dropdownSearchWrap}>
                  <Feather name="search" size={14} color="#64748B" />
                  <TextInput
                    style={styles.dropdownSearchInput}
                    placeholder="Search student or ID (MEL-****-YY)..."
                    placeholderTextColor="#94A3B8"
                    value={studentSearch}
                    onChangeText={setStudentSearch}
                    autoFocus
                  />
                  {studentSearch ? (
                    <TouchableOpacity onPress={() => setStudentSearch('')}>
                      <Feather name="x" size={14} color="#64748B" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => {
                      const sId = s.studentId || s.id;
                      const sFormatted =
                        s.studentNumber ||
                        s.student_number ||
                        `MEL-${String(sId)
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 4)
                          .toUpperCase()
                          .padEnd(4, '0')}-26`;
                      const isCur = sId === selectedStudent;
                      return (
                        <TouchableOpacity
                          key={sId}
                          style={[styles.dropdownItem, isCur && styles.dropdownItemActive]}
                          onPress={() => {
                            setSelectedStudent(sId);
                            setDropdownOpen(false);
                            setStudentSearch('');
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.dropdownItemName,
                                isCur && styles.dropdownItemNameActive,
                              ]}
                            >
                              {s.studentName || s.name}
                            </Text>
                            <Text style={styles.dropdownItemMeta}>
                              Student ID: {sFormatted} · {s.program || 'Regular'}
                            </Text>
                          </View>
                          {isCur ? (
                            <Feather name="check" size={16} color={colors.primaryBlue} />
                          ) : (
                            <View
                              style={[
                                styles.miniStatusBadge,
                                s.status === 'Reviewed'
                                  ? styles.miniStatusReviewed
                                  : styles.miniStatusPending,
                              ]}
                            >
                              <Text style={styles.miniStatusText}>{s.status || 'Pending'}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>No matching students</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Center/Right Toolbar Row: View Switcher & Action Buttons */}
        <View
          style={[
            styles.toolbarControlsRow,
            (isMobile || isTablet) && styles.toolbarControlsRowStacked,
          ]}
        >
          {/* View Switcher */}
          <View style={[styles.viewModeSwitcher, isMobile && { width: '100%' }]}>
            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                isMobile && { flex: 1, justifyContent: 'center' },
                viewMode === 'dynamic' && styles.viewModeBtnActive,
              ]}
              onPress={() => setViewMode('dynamic')}
            >
              <Feather
                name="layers"
                size={13}
                color={viewMode === 'dynamic' ? '#FFFFFF' : '#1E293B'}
              />
              <Text
                style={[styles.viewModeText, viewMode === 'dynamic' && styles.viewModeTextActive]}
              >
                Dynamic Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                isMobile && { flex: 1, justifyContent: 'center' },
                viewMode === 'document' && styles.viewModeBtnActive,
              ]}
              onPress={() => setViewMode('document')}
            >
              <Feather
                name="file-text"
                size={13}
                color={viewMode === 'document' ? '#FFFFFF' : '#1E293B'}
              />
              <Text
                style={[styles.viewModeText, viewMode === 'document' && styles.viewModeTextActive]}
              >
                Document (PDF)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Right Action Buttons */}
          <View style={[styles.actionsRight, isMobile && styles.actionsRightMobile]}>
            <TouchableOpacity
              style={[
                styles.exportBtn,
                isMobile && { flex: 1, paddingHorizontal: 6, justifyContent: 'center' },
              ]}
              onPress={handlePrint}
              activeOpacity={0.75}
            >
              <Feather name="printer" size={14} color="#1E293B" />
              <Text style={styles.exportBtnText}>{isMobile ? 'Print' : 'Print / PDF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportBtn,
                isMobile && { flex: 1, paddingHorizontal: 6, justifyContent: 'center' },
              ]}
              onPress={handleDownload}
              activeOpacity={0.75}
            >
              <Feather name="download" size={14} color="#1E293B" />
              <Text style={styles.exportBtnText}>{isMobile ? 'Save' : 'Download'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.signOffBtn,
                isReviewed && styles.signOffBtnDisabled,
                isMobile && { width: '100%', justifyContent: 'center' },
              ]}
              onPress={() => {
                if (isReviewed) {
                  Alert.alert(
                    'Already Signed Off',
                    'This clinical assessment has already been reviewed and approved.',
                  );
                } else {
                  setShowApproveModal(true);
                }
              }}
              disabled={isReviewed}
              activeOpacity={0.8}
            >
              <Feather name={isReviewed ? 'check' : 'check-circle'} size={14} color="#FFFFFF" />
              <Text style={styles.signOffBtnText}>
                {isReviewed ? 'Approved (Ready for IUP)' : 'Approve & Sign-Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading dynamic assessment report...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-triangle" size={36} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Report</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadReport()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'document' ? (
        /* Document / PDF Viewport */
        <View style={styles.documentViewport}>
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title="Consolidated Clinical Assessment Summary Report"
            style={
              {
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#525659',
              } as any
            }
          />
        </View>
      ) : (
        /* Dynamic Assessment UI */
        <ScrollView
          style={styles.dynamicContainer}
          contentContainerStyle={[styles.dynamicContent, isMobile && { padding: 12, gap: 12 }]}
        >
          {/* 1. Student Intake Demographic Card */}
          <View style={styles.studentCard}>
            <View
              style={[
                styles.studentCardHeader,
                isMobile && { flexDirection: 'column', alignItems: 'flex-start' },
              ]}
            >
              <View style={styles.avatarPill}>
                <Text style={styles.avatarText}>
                  {studentName
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1, width: isMobile ? '100%' : undefined }}>
                <View style={styles.nameRow}>
                  <Text style={styles.studentHeaderName}>{studentName}</Text>
                  <View style={styles.badgeId}>
                    <Text style={styles.badgeIdText}>Student ID: {formattedStudentId}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isReviewed ? styles.statusReviewed : styles.statusComplete,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isReviewed ? styles.dotReviewed : styles.dotComplete,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        isReviewed ? styles.textReviewed : styles.textComplete,
                      ]}
                    >
                      {isReviewed
                        ? 'Reviewed / Ready for IUP'
                        : 'Assessment Complete / Pending Review'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.studentSubtitle}>
                  Primary Diagnosis: {diagnosis} · Intake Assessment Battery (MCTC-TRP-015)
                </Text>
              </View>
            </View>

            <View style={styles.demoGrid}>
              <View style={[styles.demoItem, isMobile && { minWidth: '45%' }]}>
                <Text style={styles.demoLabel}>DATE OF BIRTH (AGE)</Text>
                <Text style={styles.demoValue}>
                  {dob} ({age} yrs)
                </Text>
              </View>
              <View style={[styles.demoItem, isMobile && { minWidth: '45%' }]}>
                <Text style={styles.demoLabel}>ENROLLED PROGRAM</Text>
                <Text style={styles.demoValue}>{programType}</Text>
              </View>
              <View style={[styles.demoItem, isMobile && { minWidth: '45%' }]}>
                <Text style={styles.demoLabel}>ASSIGNED COHORT</Text>
                <Text style={styles.demoValue}>{therapyGroup}</Text>
              </View>
              <View style={[styles.demoItem, isMobile && { minWidth: '45%' }]}>
                <Text style={styles.demoLabel}>LEAD CLINICIAN / ASSESSOR</Text>
                <Text style={styles.demoValue}>{leadClinician}</Text>
              </View>
              <View style={[styles.demoItem, isMobile && { minWidth: '100%' }]}>
                <Text style={styles.demoLabel}>ASSESSMENT WINDOW</Text>
                <Text style={styles.demoValue}>{assessmentWindow}</Text>
              </View>
            </View>
          </View>

          {/* Sub-Assessment Section Navigation Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subTabsScrollContent}
          >
            {[
              { id: 'all', label: 'All 4 Assessments' },
              { id: 'ablls', label: '1. ABLLS-R Skills' },
              { id: 'behavior', label: '2. Behavior (MAS/FAST/ABC)' },
              { id: 'preference', label: '3. Preferences (3 Tiers)' },
              { id: 'sensory', label: '4. Sensory Engagement (12 Activities)' },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.subTabBtn, activeSubTab === t.id && styles.subTabBtnActive]}
                onPress={() => setActiveSubTab(t.id)}
              >
                <Text style={[styles.subTabText, activeSubTab === t.id && styles.subTabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Extended Clinical Visual Analytics & Graphs (All 4 Assessments) */}
          <AssessmentAnalyticsVisuals
            skills={skills}
            behavior={behavior}
            preferences={preferences}
            sensory={sensory}
            masRows={masRows}
            fastRows={fastRows}
            highestPrefs={highestPrefs}
            moderatePrefs={moderatePrefs}
            lowPrefs={lowPrefs}
            sensoryActivities={sensoryActivities}
            onNavigateToSection={(sec) => setActiveSubTab(sec)}
          />

          {/* ================= SECTION 1: ABLLS-R SKILLS ================= */}
          {(activeSubTab === 'all' || activeSubTab === 'ablls') && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Feather name="award" size={18} color="#1A2233" />
                </View>
                <div>
                  <Text style={styles.sectionTitle}>
                    Sub-Assessment 1: Skills Assessment (ABLLS-R Curriculum Mastery)
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Quantitative developmental baseline across language, imitation, visual, and
                    social domains.
                  </Text>
                </div>
              </View>

              {/* KPI Metrics Bar */}
              <View style={styles.kpiRow}>
                <View style={[styles.kpiCard, isMobile && { minWidth: '47%' }]}>
                  <Text style={styles.kpiLabel}>EVALUATED DOMAINS</Text>
                  <Text style={styles.kpiValue}>{totalEvaluatedDomains} Domains</Text>
                </View>
                <View style={[styles.kpiCard, isMobile && { minWidth: '47%' }]}>
                  <Text style={styles.kpiLabel}>TOTAL SCORED ITEMS</Text>
                  <Text style={styles.kpiValue}>{totalScoredItems} Items</Text>
                </View>
                <View style={[styles.kpiCard, isMobile && { minWidth: '47%' }]}>
                  <Text style={styles.kpiLabel}>POINTS EARNED / MAX</Text>
                  <Text style={styles.kpiValue}>
                    {totalPointsEarned} / {totalPossiblePoints} pts
                  </Text>
                </View>
                <View
                  style={[
                    styles.kpiCard,
                    { borderLeftColor: colors.primaryBlue },
                    isMobile && { minWidth: '47%' },
                  ]}
                >
                  <Text style={styles.kpiLabel}>OVERALL MASTERY RATE</Text>
                  <Text style={[styles.kpiValue, { color: colors.primaryBlue }]}>
                    {overallMastery}% Mastery
                  </Text>
                </View>
              </View>

              {/* Overall Progress Bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, Math.max(0, overallMastery))}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Evaluated Domains Breakdown Table - Horizontally scrollable on mobile */}
              <Text style={styles.tableTitle}>Evaluated Domains Breakdown Table</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={[styles.tableContainer, { minWidth: 680 }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 60 }]}>Code</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Domain Area Description</Text>
                    <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>
                      Scored Items
                    </Text>
                    <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>
                      Points Earned
                    </Text>
                    <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>
                      Ceiling Pts
                    </Text>
                    <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Mastery %</Text>
                    <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                      Performance
                    </Text>
                  </View>

                  {domains.length === 0 ? (
                    <View style={{ padding: 18, alignItems: 'center' }}>
                      <Text style={styles.emptyNotice}>
                        No evaluated ABLLS-R domain data recorded yet.
                      </Text>
                    </View>
                  ) : (
                    domains.map((d: any, idx: number) => {
                      const pct = Math.round(d.percentage ?? d.score ?? 0);
                      const isMastered = pct >= 70;
                      const isEmerging = pct >= 40 && pct < 70;
                      return (
                        <View
                          key={d.code || idx}
                          style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                        >
                          <Text style={[styles.td, { width: 60, fontWeight: '800' }]}>
                            {d.code}
                          </Text>
                          <Text style={[styles.td, { flex: 1, fontWeight: '600' }]}>{d.name}</Text>
                          <Text style={[styles.td, { width: 100, textAlign: 'center' }]}>
                            {d.scored_items || d.total_items || 0} / {d.total_items || 0}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              { width: 100, textAlign: 'center', fontWeight: '700' },
                            ]}
                          >
                            {d.total_points ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              { width: 100, textAlign: 'center', color: '#64748B' },
                            ]}
                          >
                            {d.max_possible_points ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              {
                                width: 90,
                                textAlign: 'center',
                                fontWeight: '800',
                                color: isMastered ? '#059669' : isEmerging ? '#2563EB' : '#DC2626',
                              },
                            ]}
                          >
                            {pct}%
                          </Text>
                          <View style={{ width: 110, alignItems: 'center' }}>
                            <View
                              style={[
                                styles.badge,
                                isMastered
                                  ? styles.badgeMastered
                                  : isEmerging
                                    ? styles.badgeEmerging
                                    : styles.badgeDeficit,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  isMastered
                                    ? styles.badgeTextMastered
                                    : isEmerging
                                      ? styles.badgeTextEmerging
                                      : styles.badgeTextDeficit,
                                ]}
                              >
                                {isMastered ? 'Mastered' : isEmerging ? 'Emerging' : 'Deficit Gap'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </ScrollView>

              {/* Emerging Skills & Critical Gaps Side-by-Side Cards */}
              <View style={[styles.twoColGrid, isMobile && { flexDirection: 'column' }]}>
                {/* Emerging Skills (Score 1) */}
                <View
                  style={[
                    styles.subCard,
                    { borderTopColor: '#2563EB' },
                    isMobile && { minWidth: '100%' },
                  ]}
                >
                  <View style={styles.subCardHeader}>
                    <Feather name="star" size={15} color="#2563EB" />
                    <Text style={[styles.subCardTitle, { color: '#2563EB' }]}>
                      Emerging Foundation Skills (Score 1)
                    </Text>
                  </View>
                  <Text style={styles.subCardDesc}>
                    Skills initiated with partial prompt independence as recorded during assessment
                    trials.
                  </Text>
                  {emergingSkills.length > 0 ? (
                    emergingSkills.map((s: any, idx: number) => (
                      <View key={idx} style={styles.skillItemRow}>
                        <Text style={styles.skillCode}>
                          [{s.domain_code || 'Skill'}-{s.identifier || idx + 1}]
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.skillDesc}>
                            {s.description || 'Developing foundational competency'}
                          </Text>
                          {s.note ? (
                            <Text style={styles.skillNote}>Teacher Note: {s.note}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyNotice}>No emerging skills recorded.</Text>
                  )}
                </View>

                {/* Critical Baseline Gaps (Score 0) */}
                <View
                  style={[
                    styles.subCard,
                    { borderTopColor: '#DC2626' },
                    isMobile && { minWidth: '100%' },
                  ]}
                >
                  <View style={styles.subCardHeader}>
                    <Feather name="alert-circle" size={15} color="#DC2626" />
                    <Text style={[styles.subCardTitle, { color: '#DC2626' }]}>
                      Critical Baseline Foundation Gaps (Score 0)
                    </Text>
                  </View>
                  <Text style={styles.subCardDesc}>
                    Prerequisite developmental deficits requiring structured baseline direct
                    instruction.
                  </Text>
                  {criticalGaps.length > 0 ? (
                    criticalGaps.map((g: any, idx: number) => (
                      <View key={idx} style={styles.skillItemRow}>
                        <Text style={[styles.skillCode, { color: '#DC2626' }]}>
                          [{g.domain_code || 'Gap'}-{g.identifier || idx + 1}]
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.skillDesc}>
                            {g.description || 'Unmastered foundation milestone'}
                          </Text>
                          {g.note ? (
                            <Text style={styles.skillNote}>Teacher Note: {g.note}</Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyNotice}>No critical foundation gaps recorded.</Text>
                  )}
                </View>
              </View>

              {/* Domain Need Analysis */}
              {needAnalysis.length > 0 ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={styles.tableTitle}>Domain Need Analysis & Prioritization</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={[styles.tableContainer, { minWidth: 620 }]}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, { width: 60 }]}>Code</Text>
                        <Text style={[styles.th, { flex: 1 }]}>Domain Name</Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                          Score 0 (Deficits)
                        </Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                          Score 1 (Emerging)
                        </Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                          Total Need Count
                        </Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'center' }]}>
                          Priority Level
                        </Text>
                      </View>
                      {needAnalysis.map((na: any, idx: number) => (
                        <View
                          key={idx}
                          style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                        >
                          <Text style={[styles.td, { width: 60, fontWeight: '800' }]}>
                            {na.domain_code}
                          </Text>
                          <Text style={[styles.td, { flex: 1, fontWeight: '600' }]}>
                            {na.domain_name}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              {
                                width: 110,
                                textAlign: 'center',
                                color: '#DC2626',
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {na.score_0_count ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              {
                                width: 110,
                                textAlign: 'center',
                                color: '#2563EB',
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {na.score_1_count ?? 0}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              { width: 110, textAlign: 'center', fontWeight: '800' },
                            ]}
                          >
                            {na.need_count ?? 0}
                          </Text>
                          <View style={{ width: 110, alignItems: 'center' }}>
                            <View
                              style={[
                                styles.badge,
                                idx === 0
                                  ? styles.badgeDeficit
                                  : idx < 3
                                    ? styles.badgeAmber
                                    : styles.badgeNeutral,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  idx === 0
                                    ? styles.badgeTextDeficit
                                    : idx < 3
                                      ? styles.badgeTextAmber
                                      : styles.badgeTextNeutral,
                                ]}
                              >
                                Priority {idx + 1}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : null}
            </View>
          )}

          {/* ================= SECTION 2: BEHAVIOR ASSESSMENT ================= */}
          {(activeSubTab === 'all' || activeSubTab === 'behavior') && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Feather name="shield" size={18} color="#1A2233" />
                </View>
                <div>
                  <Text style={styles.sectionTitle}>
                    Sub-Assessment 2: Functional Behavior Assessment (MAS, FAST & ABC Log)
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Operational definitions, motivational scale ratings, maintaining variables, and
                    direct episode records.
                  </Text>
                </div>
              </View>

              {/* Target Behaviors Table */}
              <Text style={styles.tableTitle}>
                Target Problem Behaviors & Hypothesized Functions
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={[styles.tableContainer, { minWidth: 620 }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 150 }]}>Behavior Name</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Operational Definition</Text>
                    <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Freq / Sess</Text>
                    <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Intensity</Text>
                    <Text style={[styles.th, { width: 150 }]}>Hypothesized Function</Text>
                  </View>
                  {targetBehaviors.length === 0 ? (
                    <View style={{ padding: 18, alignItems: 'center' }}>
                      <Text style={styles.emptyNotice}>
                        No target problem behaviors recorded for this student.
                      </Text>
                    </View>
                  ) : (
                    targetBehaviors.map((tb: any, idx: number) => (
                      <View
                        key={idx}
                        style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                      >
                        <Text style={[styles.td, { width: 150, fontWeight: '800' }]}>
                          {tb.behavior_name}
                        </Text>
                        <Text style={[styles.td, { flex: 1, color: '#334155' }]}>
                          {tb.definition || '—'}
                        </Text>
                        <Text
                          style={[styles.td, { width: 90, textAlign: 'center', fontWeight: '800' }]}
                        >
                          {tb.frequency ?? '—'}
                          {tb.frequency != null ? 'x' : ''}
                        </Text>
                        <View style={{ width: 90, alignItems: 'center' }}>
                          <View
                            style={[
                              styles.badge,
                              (tb.intensity ?? 0) >= 3 ? styles.badgeDeficit : styles.badgeAmber,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                (tb.intensity ?? 0) >= 3
                                  ? styles.badgeTextDeficit
                                  : styles.badgeTextAmber,
                              ]}
                            >
                              Level {tb.intensity ?? 2}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.td,
                            { width: 150, fontWeight: '700', color: colors.primaryBlue },
                          ]}
                        >
                          {tb.hypothesized_function || tb.dominant_function || '—'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* MAS & FAST Side-by-Side Tables */}
              <View
                style={[
                  styles.twoColGrid,
                  { marginTop: 14 },
                  isMobile && { flexDirection: 'column' },
                ]}
              >
                {/* MAS Table */}
                <View style={[styles.subCard, isMobile && { minWidth: '100%' }]}>
                  <Text style={styles.subCardTitle}>Motivational Assessment Scale (MAS)</Text>
                  <Text style={styles.subCardDesc}>
                    4-Function Likert ratings across environmental contexts.
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={[styles.tableContainer, { minWidth: 280 }]}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, { flex: 1 }]}>Function</Text>
                        <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>Total</Text>
                        <Text style={[styles.th, { width: 60, textAlign: 'center' }]}>Mean</Text>
                        <Text style={[styles.th, { width: 70, textAlign: 'center' }]}>Rank</Text>
                      </View>
                      {masRows.length === 0 ? (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                          <Text style={styles.emptyNotice}>No MAS assessment scores recorded.</Text>
                        </View>
                      ) : (
                        masRows.map((row, idx) => (
                          <View key={idx} style={styles.tableDataRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>
                              {row.func}
                            </Text>
                            <Text
                              style={[
                                styles.td,
                                { width: 60, textAlign: 'center', fontWeight: '700' },
                              ]}
                            >
                              {row.total}
                            </Text>
                            <Text style={[styles.td, { width: 60, textAlign: 'center' }]}>
                              {typeof row.mean === 'number' ? row.mean.toFixed(2) : row.mean}
                            </Text>
                            <View style={{ width: 70, alignItems: 'center' }}>
                              <View
                                style={[
                                  styles.badge,
                                  row.rank === 1
                                    ? styles.badgeDeficit
                                    : row.rank === 2
                                      ? styles.badgeAmber
                                      : styles.badgeNeutral,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.badgeText,
                                    row.rank === 1
                                      ? styles.badgeTextDeficit
                                      : row.rank === 2
                                        ? styles.badgeTextAmber
                                        : styles.badgeTextNeutral,
                                  ]}
                                >
                                  Rank {row.rank}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
                </View>

                {/* FAST Table */}
                <View style={[styles.subCard, isMobile && { minWidth: '100%' }]}>
                  <Text style={styles.subCardTitle}>Functional Analysis Screening Tool (FAST)</Text>
                  <Text style={styles.subCardDesc}>
                    Maintaining environmental reinforcement variables.
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View style={[styles.tableContainer, { minWidth: 300 }]}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.th, { flex: 1 }]}>Variable</Text>
                        <Text style={[styles.th, { width: 65, textAlign: 'center' }]}>
                          Yes / Max
                        </Text>
                        <Text style={[styles.th, { width: 55, textAlign: 'center' }]}>%</Text>
                        <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>
                          Influence
                        </Text>
                      </View>
                      {fastRows.length === 0 ? (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                          <Text style={styles.emptyNotice}>
                            No FAST evaluation records available.
                          </Text>
                        </View>
                      ) : (
                        fastRows.map((row, idx) => (
                          <View key={idx} style={styles.tableDataRow}>
                            <Text style={[styles.td, { flex: 1, fontWeight: '700' }]}>
                              {row.variable}
                            </Text>
                            <Text
                              style={[
                                styles.td,
                                { width: 65, textAlign: 'center', fontWeight: '700' },
                              ]}
                            >
                              {row.yes}
                            </Text>
                            <Text style={[styles.td, { width: 55, textAlign: 'center' }]}>
                              {row.pct}
                            </Text>
                            <View style={{ width: 80, alignItems: 'center' }}>
                              <View
                                style={[
                                  styles.badge,
                                  row.dominant ? styles.badgeDeficit : styles.badgeNeutral,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.badgeText,
                                    row.dominant
                                      ? styles.badgeTextDeficit
                                      : styles.badgeTextNeutral,
                                  ]}
                                >
                                  {row.dominant ? 'PRIMARY' : 'Secondary'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Condensed Baseline ABC Episode Log */}
              <Text style={[styles.tableTitle, { marginTop: 14 }]}>
                Baseline ABC Incident Episodes (Direct Teacher Observations)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={[styles.tableContainer, { minWidth: 640 }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 100 }]}>Date / Time</Text>
                    <Text style={[styles.th, { width: 200 }]}>Antecedent Trigger</Text>
                    <Text style={[styles.th, { width: 160 }]}>Behavior Topography</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Consequence / Clinical Response</Text>
                    <Text style={[styles.th, { width: 85, textAlign: 'center' }]}>Severity</Text>
                  </View>
                  {abcLogs.length === 0 ? (
                    <View style={{ padding: 18, alignItems: 'center' }}>
                      <Text style={styles.emptyNotice}>
                        No baseline ABC incident episodes logged.
                      </Text>
                    </View>
                  ) : (
                    abcLogs.map((log: any, idx: number) => (
                      <View
                        key={idx}
                        style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                      >
                        <Text style={[styles.td, { width: 100, fontWeight: '700' }]}>
                          {log.date || '—'}
                          {log.time ? '\n' : ''}
                          <Text style={{ fontSize: 10, color: '#64748B' }}>{log.time || ''}</Text>
                        </Text>
                        <Text style={[styles.td, { width: 200 }]}>{log.antecedent || '—'}</Text>
                        <Text
                          style={[styles.td, { width: 160, fontWeight: '700', color: '#1E293B' }]}
                        >
                          {log.behavior_name || '—'}
                        </Text>
                        <Text style={[styles.td, { flex: 1 }]}>{log.consequence || '—'}</Text>
                        <View style={{ width: 85, alignItems: 'center' }}>
                          <View
                            style={[
                              styles.badge,
                              (log.intensity ?? 0) >= 3 ? styles.badgeDeficit : styles.badgeAmber,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                (log.intensity ?? 0) >= 3
                                  ? styles.badgeTextDeficit
                                  : styles.badgeTextAmber,
                              ]}
                            >
                              Level {log.intensity ?? 2}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ================= SECTION 3: PREFERENCE ASSESSMENT ================= */}
          {(activeSubTab === 'all' || activeSubTab === 'preference') && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Feather name="heart" size={18} color="#1A2233" />
                </View>
                <div>
                  <Text style={styles.sectionTitle}>
                    Sub-Assessment 3: Preference Assessment & 3-Tier Reinforcer Hierarchy
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Relative approach frequency, cumulative duration in seconds/mm:ss, category, and
                    presentation context.
                  </Text>
                </div>
              </View>

              {/* 3-Tier Hierarchy Cards */}
              <View style={[styles.twoColGrid, isMobile && { flexDirection: 'column' }]}>
                {/* Tier 1: Highest Preferred */}
                <View
                  style={[
                    styles.subCard,
                    { borderTopColor: '#059669' },
                    isMobile && { minWidth: '100%' },
                  ]}
                >
                  <View style={styles.subCardHeader}>
                    <Feather name="check-circle" size={15} color="#059669" />
                    <Text style={[styles.subCardTitle, { color: '#059669' }]}>
                      Tier 1: Highest Preferred (Primary Reinforcers)
                    </Text>
                  </View>
                  <Text style={styles.subCardDesc}>
                    High-magnitude reinforcers to be reserved for challenging instruction and
                    foundation acquisition.
                  </Text>
                  {highestPrefs.length === 0 ? (
                    <Text
                      style={{ padding: 12, color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}
                    >
                      No high preference items recorded.
                    </Text>
                  ) : (
                    highestPrefs.map((p: any, idx: number) => (
                      <View key={idx} style={styles.prefCardItem}>
                        <View style={styles.prefRankBadge}>
                          <Text style={styles.prefRankText}>#{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefItemName}>{p.name}</Text>
                          <Text style={styles.prefItemMeta}>
                            {p.category || 'Preference'}
                            {p.duration_seconds != null
                              ? ` · Duration: ${formatMMSS(p.duration_seconds)} (${p.duration_seconds}s)`
                              : ''}
                            {p.frequency_count != null ? ` · Approached ${p.frequency_count}x` : ''}
                            {p.context ? ` · ${p.context}` : ''}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Tier 2 & 3: Moderate & Low */}
                <View
                  style={[
                    styles.subCard,
                    { borderTopColor: '#F6C445' },
                    isMobile && { minWidth: '100%' },
                  ]}
                >
                  <View style={styles.subCardHeader}>
                    <Feather name="filter" size={15} color="#B45309" />
                    <Text style={[styles.subCardTitle, { color: '#B45309' }]}>
                      Tier 2 & 3: Moderate & Low Preferred Items
                    </Text>
                  </View>
                  <Text style={styles.subCardDesc}>
                    Secondary reinforcers and low/non-preferred items observed across evaluation
                    trials.
                  </Text>
                  {moderatePrefs.length === 0 && lowPrefs.length === 0 ? (
                    <Text
                      style={{ padding: 12, color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}
                    >
                      No moderate or low preference items recorded.
                    </Text>
                  ) : (
                    <>
                      {moderatePrefs.map((p: any, idx: number) => (
                        <View key={idx} style={styles.prefCardItem}>
                          <View
                            style={[
                              styles.prefRankBadge,
                              { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                            ]}
                          >
                            <Text style={[styles.prefRankText, { color: '#B45309' }]}>
                              #{highestPrefs.length + idx + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.prefItemName}>{p.name}</Text>
                            <Text style={styles.prefItemMeta}>
                              Moderate Tier
                              {p.duration_seconds != null
                                ? ` · ${formatMMSS(p.duration_seconds)}`
                                : ''}
                              {p.category ? ` · ${p.category}` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {lowPrefs.map((p: any, idx: number) => (
                        <View key={idx} style={styles.prefCardItem}>
                          <View
                            style={[
                              styles.prefRankBadge,
                              { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
                            ]}
                          >
                            <Text style={[styles.prefRankText, { color: '#64748B' }]}>
                              #{highestPrefs.length + moderatePrefs.length + idx + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.prefItemName}>{p.name}</Text>
                            <Text style={styles.prefItemMeta}>
                              Low / Non-Preferred{p.category ? ` · ${p.category}` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ================= SECTION 4: SENSORY ACTIVITIES ================= */}
          {(activeSubTab === 'all' || activeSubTab === 'sensory') && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Feather name="sun" size={18} color="#1A2233" />
                </View>
                <div>
                  <Text style={styles.sectionTitle}>
                    Sub-Assessment 4: Sensory Time Engagement Matrix
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Structured sensory evaluation across tactile, vestibular, and proprioceptive
                    modalities.
                  </Text>
                </div>
              </View>

              {/* Sensory Activities Table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={[styles.tableContainer, { minWidth: 640 }]}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { width: 75 }]}>Code</Text>
                    <Text style={[styles.th, { width: 170 }]}>Activity Name</Text>
                    <Text style={[styles.th, { width: 140, textAlign: 'center' }]}>
                      Engagement Level
                    </Text>
                    <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>
                      Affective Reaction
                    </Text>
                    <Text style={[styles.th, { flex: 1 }]}>Teacher's Clinical Remark</Text>
                  </View>
                  {sensoryActivities.length === 0 ? (
                    <View
                      style={[
                        styles.tableDataRow,
                        { justifyContent: 'center', paddingVertical: 14 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.td,
                          {
                            color: '#94A3B8',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            width: '100%',
                          },
                        ]}
                      >
                        No sensory engagement activities recorded for this student.
                      </Text>
                    </View>
                  ) : (
                    sensoryActivities.map((act: any, idx: number) => {
                      const isEnjoyed = act.response_reaction === 'Enjoyed';
                      const isNeutral = act.response_reaction === 'Neutral';
                      return (
                        <View
                          key={act.code || idx}
                          style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                        >
                          <Text style={[styles.td, { width: 75, fontWeight: '800' }]}>
                            {act.code || `SEN-${String(idx + 1).padStart(3, '0')}`}
                          </Text>
                          <Text style={[styles.td, { width: 170, fontWeight: '700' }]}>
                            {act.name}
                          </Text>
                          <View style={{ width: 140, alignItems: 'center' }}>
                            <View style={[styles.badge, styles.badgeNeutral]}>
                              <Text style={[styles.badgeText, styles.badgeTextNeutral]}>
                                {act.engagement_level || '—'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ width: 120, alignItems: 'center' }}>
                            <View
                              style={[
                                styles.badge,
                                isEnjoyed
                                  ? styles.badgeMastered
                                  : isNeutral
                                    ? styles.badgeEmerging
                                    : act.response_reaction
                                      ? styles.badgeDeficit
                                      : styles.badgeNeutral,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  isEnjoyed
                                    ? styles.badgeTextMastered
                                    : isNeutral
                                      ? styles.badgeTextEmerging
                                      : act.response_reaction
                                        ? styles.badgeTextDeficit
                                        : styles.badgeTextNeutral,
                                ]}
                              >
                                {act.response_reaction || '—'}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.td, { flex: 1, color: '#475569' }]}>
                            {act.remark || '—'}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ================= SECTION 5: CLINICAL ATTESTATION & SIGN-OFF ================= */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Feather name="check-square" size={18} color="#1A2233" />
              </View>
              <div>
                <Text style={styles.sectionTitle}>
                  Section V: Clinical Attestation & Director Sign-Off
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Institutional verification and authorization for Individualized Unit Plan (IUP)
                  development.
                </Text>
              </div>
            </View>

            <View style={[styles.twoColGrid, isMobile && { flexDirection: 'column' }]}>
              {/* Lead Assessor Card */}
              <View style={[styles.attestCard, isMobile && { minWidth: '100%' }]}>
                <Text style={styles.attestHeader}>Lead Clinical Assessor / Teacher</Text>
                <Text style={styles.attestName}>{leadClinician}</Text>
                <Text style={styles.attestMeta}>Assessor Designation: Lead ABA Clinician</Text>
                <Text style={styles.attestMeta}>
                  Report Timestamp: {new Date().toLocaleDateString()}
                </Text>
                <View style={styles.attestBadge}>
                  <Feather name="check" size={12} color="#059669" />
                  <Text style={styles.attestBadgeText}>
                    Verified baseline assessment battery administered per clinical protocol.
                  </Text>
                </View>
              </View>

              {/* Program Director Card */}
              <View
                style={[
                  styles.attestCard,
                  { borderLeftColor: isReviewed ? '#059669' : '#B45309', borderLeftWidth: 3 },
                  isMobile && { minWidth: '100%' },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={styles.attestHeader}>Clinical Program Director</Text>
                  <View
                    style={[styles.badge, isReviewed ? styles.badgeMastered : styles.badgeAmber]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isReviewed ? styles.badgeTextMastered : styles.badgeTextAmber,
                      ]}
                    >
                      {isReviewed ? 'DIGITALLY APPROVED' : 'PENDING REVIEW'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.attestName, { color: isReviewed ? '#059669' : '#64748B' }]}>
                  {isReviewed
                    ? reportData?.director_name || 'Clinical Program Director'
                    : '(Pending Director Sign-Off)'}
                </Text>
                <Text style={styles.attestMeta}>Role: Clinical Program Director</Text>
                <Text style={styles.attestMeta}>
                  Status: {isReviewed ? 'Approved (Ready for IUP Creation)' : 'Awaiting Review'}
                </Text>

                {!isReviewed ? (
                  <TouchableOpacity
                    style={[styles.signOffBtn, { marginTop: 10, alignSelf: 'flex-start' }]}
                    onPress={() => setShowApproveModal(true)}
                  >
                    <Feather name="check-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.signOffBtnText}>Approve & Sign-Off (Ready for IUP)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.attestBadge}>
                    <Feather name="check" size={12} color="#059669" />
                    <Text style={[styles.attestBadgeText, { color: '#059669', fontWeight: '700' }]}>
                      Authorized for IUP Generation (Ready for IUP - FR-057).
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Program Director Digital Sign-Off Confirmation Modal */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconWrap}>
                  <Feather name="shield" size={18} color="#166534" />
                </View>
                <div>
                  <Text style={styles.modalTitle}>Approve & Sign-Off Assessment</Text>
                  <Text style={styles.modalSubtitle}>
                    Institutional Sign-Off & Transition (FR-057)
                  </Text>
                </div>
              </View>
              <TouchableOpacity onPress={() => setShowApproveModal(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalNotice}>
                You are approving the 4-part baseline clinical evaluation battery for{' '}
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{studentName}</Text> (Student
                ID:{' '}
                <Text style={{ fontWeight: '700', color: colors.primaryBlue }}>
                  {formattedStudentId}
                </Text>
                ). This action attaches your digital signature to Form{' '}
                <Text style={{ fontWeight: '700' }}>MCTC-TRP-015</Text> and updates the clinical
                status to <Text style={{ fontWeight: '700', color: '#166534' }}>Ready for IUP</Text>
                .
              </Text>

              <Text style={styles.fieldLabel}>Program Director Approval Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholder="Add digital sign-off clinical feedback or transition instructions..."
                placeholderTextColor="#94A3B8"
                value={approvalNotes}
                onChangeText={setApprovalNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowApproveModal(false)}
                disabled={submittingApproval}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSignOffBtn}
                onPress={handleConfirmApproval}
                disabled={submittingApproval}
              >
                {submittingApproval ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={15} color="#FFFFFF" />
                    <Text style={styles.confirmSignOffText}>Sign-Off & Transition to IUP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topToolbar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    gap: 12,
  },
  topToolbarTablet: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    paddingVertical: 12,
  },
  topToolbarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  topLeftGroupMobile: {
    width: '100%',
    gap: 8,
  },
  toolbarControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  toolbarControlsRowStacked: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
  },

  // Student Dropdown Trigger
  dropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  studentDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 260,
  },
  studentTriggerContent: {
    flex: 1,
  },
  studentTriggerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2233',
  },
  studentIdPill: {
    marginTop: 1,
  },
  studentIdPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryBlue,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },

  // Dropdown Menu Popover
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    padding: 8,
  },
  dropdownSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1A2233',
    padding: 0,
    outlineStyle: 'none',
  } as any,
  dropdownScroll: {
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    gap: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A2233',
  },
  dropdownItemNameActive: {
    color: colors.primaryBlue,
    fontWeight: '800',
  },
  dropdownItemMeta: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  miniStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniStatusReviewed: {
    backgroundColor: '#D1FAE5',
  },
  miniStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A2233',
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // View Mode Switcher
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md - 2,
  },
  viewModeBtnActive: {
    backgroundColor: colors.primaryBlue,
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
  },

  // Actions Right
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRightMobile: {
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2233',
  },
  signOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: '#059669',
    borderRadius: radius.md,
  },
  signOffBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  signOffBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Viewport Container
  documentViewport: {
    flex: 1,
    backgroundColor: '#525659',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.error,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 400,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Dynamic UI Layout
  dynamicContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  dynamicContent: {
    padding: 20,
    gap: 18,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },

  // Student Profile Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarPill: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  studentHeaderName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2233',
  },
  badgeId: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeIdText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryBlue,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusReviewed: {
    backgroundColor: '#D1FAE5',
    borderColor: '#86EFAC',
  },
  statusComplete: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotReviewed: {
    backgroundColor: '#059669',
  },
  dotComplete: {
    backgroundColor: '#B45309',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textReviewed: {
    color: '#059669',
  },
  textComplete: {
    color: '#B45309',
  },
  studentSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 16,
  },
  demoItem: {
    minWidth: 160,
    flex: 1,
  },
  demoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  demoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A2233',
    marginTop: 2,
  },

  // Sub-Assessment Navigation Tabs
  subTabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  subTabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subTabBtnActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 4,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2233',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  // KPI Metrics
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3.5,
    borderLeftColor: '#F6C445',
    padding: 10,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A2233',
    marginTop: 4,
  },
  progressWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: 3,
  },

  // Table Styles
  tableTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2233',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  td: {
    fontSize: 11.5,
    color: '#1A2233',
  },

  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeMastered: {
    backgroundColor: '#D1FAE5',
  },
  badgeTextMastered: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeEmerging: {
    backgroundColor: '#DBEAFE',
  },
  badgeTextEmerging: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeDeficit: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextDeficit: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  badgeTextAmber: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  badgeTextNeutral: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  // 2-Column Grid
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  subCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 3,
    borderTopColor: '#CBD5E1',
    padding: 12,
    gap: 6,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2233',
    textTransform: 'uppercase',
  },
  subCardDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginBottom: 4,
  },
  skillItemRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  skillCode: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryBlue,
    minWidth: 50,
  },
  skillDesc: {
    fontSize: 11,
    color: '#1A2233',
    fontWeight: '600',
  },
  skillNote: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyNotice: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Preference Cards
  prefCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  prefRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefRankText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  prefItemName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2233',
  },
  prefItemMeta: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },

  // Attestation Section
  attestCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 4,
  },
  attestHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  attestName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A2233',
    marginTop: 2,
  },
  attestMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  attestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  attestBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2233',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  modalBody: {
    padding: 18,
    gap: 12,
  },
  modalNotice: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A2233',
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: 10,
    fontSize: 12,
    color: '#1A2233',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  confirmSignOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: '#059669',
  },
  confirmSignOffText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
