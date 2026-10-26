// screens/programdirector/AssessmentSummaryReport.tsx
// SCR-PD-002 / SCR-015: Consolidated Clinical Assessment Summary Report & Pure PDF Viewer

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../../components/AppNavbar';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  getAssessmentReport,
  markAssessmentReviewed,
  addAssessmentNote,
} from '../../api/programDirectorApi';
import {
  generateClinicalAssessmentHtml,
  type ClinicalReportPayload,
} from '../../utils/clinicalAssessmentPdfGenerator';
import { openPrintWindow, downloadTextFile, isWeb } from '../../utils/webExport';

export default function AssessmentSummaryReport({ route, navigation }: any) {
  const urlSid =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('studentId')
      : null;
  const localSid =
    typeof localStorage !== 'undefined' ? localStorage.getItem('last_assessment_student_id') : null;
  const initialStudentId = route?.params?.studentId || urlSid || localSid || 'stu-1';

  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId);
  const [reportData, setReportData] = useState<ClinicalReportPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('complete');

  // Approve & Sign-Off state
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [submittingApproval, setSubmittingApproval] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (route?.params?.studentId && route.params.studentId !== selectedStudent) {
      setSelectedStudent(route.params.studentId);
    }
  }, [route?.params?.studentId]);

  const loadReport = useCallback(async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAssessmentReport(selectedStudent);
      const data = res?.data || {};
      setReportData(data);
      const currentStatus = data.assessment?.status || data.student?.status || 'complete';
      setStatus(currentStatus);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('last_assessment_student_id', selectedStudent);
      }
    } catch (err: any) {
      console.error('Failed to load clinical assessment report', err);
      setError(err?.message || 'Failed to load clinical intake report');
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport]),
  );

  const student = reportData?.student || {};
  const studentName = student.full_name || student.name || 'Assessment Student';
  const age = student.age ?? 6;
  const programType = student.program_type || 'Comprehensive ABA Therapy';
  const isReviewed =
    status.toLowerCase() === 'reviewed' || status.toLowerCase() === 'ready_for_iup';

  // Generated institutional clinical document markup
  const htmlContent = React.useMemo(() => {
    if (!reportData) return '';
    return generateClinicalAssessmentHtml({
      ...reportData,
      assessment: {
        ...(reportData.assessment || {}),
        status: isReviewed ? 'reviewed' : reportData.assessment?.status || 'complete',
      },
    });
  }, [reportData, isReviewed]);

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

      {/* Sleek, Sticky Top Action Bar */}
      <View style={styles.topToolbar}>
        {/* Left: Back Return */}
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
          <Text style={styles.backBtnText}>Back to Assessment Pipeline</Text>
        </TouchableOpacity>

        {/* Center: Student Details Snippet & Clinical Status */}
        <View style={styles.studentInfoCenter}>
          <Text style={styles.studentSnippet} numberOfLines={1}>
            <Text style={styles.studentNameHighlight}>{studentName}</Text>
            {` • Age ${age} • Program: ${programType}`}
          </Text>
          <View
            style={[styles.statusBadge, isReviewed ? styles.statusReviewed : styles.statusComplete]}
          >
            <View
              style={[styles.statusDot, isReviewed ? styles.dotReviewed : styles.dotComplete]}
            />
            <Text
              style={[styles.statusText, isReviewed ? styles.textReviewed : styles.textComplete]}
            >
              Status:{' '}
              {isReviewed ? 'Reviewed / Ready for IUP' : 'Assessment Complete / Pending Review'}
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.actionsRight}>
          <TouchableOpacity style={styles.exportBtn} onPress={handlePrint} activeOpacity={0.75}>
            <Feather name="printer" size={15} color="#1E293B" />
            <Text style={styles.exportBtnText}>Print / Export PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={handleDownload} activeOpacity={0.75}>
            <Feather name="download" size={15} color="#1E293B" />
            <Text style={styles.exportBtnText}>Download</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOffBtn, isReviewed && styles.signOffBtnDisabled]}
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
            <Feather name={isReviewed ? 'check' : 'check-circle'} size={15} color="#FFFFFF" />
            <Text style={styles.signOffBtnText}>
              {isReviewed ? 'Approved (Ready for IUP)' : 'Approve & Sign-Off (Ready for IUP)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Dedicated PDF-Only Viewport */}
      <View style={styles.documentViewport}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading consolidated clinical assessment...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Feather name="alert-triangle" size={36} color={colors.error} />
            <Text style={styles.errorTitle}>Failed to Load Report</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadReport}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
        )}
      </View>

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
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{studentName}</Text>. This
                action attaches your digital signature to Form{' '}
                <Text style={{ fontWeight: '700' }}>MCTC-TRP-015</Text> and updates the clinical
                status to <Text style={{ fontWeight: '700', color: '#166534' }}>Ready for IUP</Text>
                .
              </Text>

              <Text style={styles.fieldLabel}>Program Director Approval Notes (Optional):</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                placeholder="Enter clinical notes, baseline approvals, or priority IUP focus areas..."
                placeholderTextColor="#94A3B8"
                value={approvalNotes}
                onChangeText={setApprovalNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowApproveModal(false)}
                disabled={submittingApproval}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmApproval}
                disabled={submittingApproval}
              >
                {submittingApproval ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Confirm Sign-Off & Authorize IUP</Text>
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
    height: 58,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        } as any)
      : {}),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: '#EFF6FF',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryBlue,
  },
  studentInfoCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  studentSnippet: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  studentNameHighlight: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusComplete: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusReviewed: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotComplete: {
    backgroundColor: '#D97706',
  },
  dotReviewed: {
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  textComplete: {
    color: '#92400E',
  },
  textReviewed: {
    color: '#166534',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  signOffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: '#16A34A',
  },
  signOffBtnDisabled: {
    backgroundColor: '#059669',
    opacity: 0.85,
  },
  signOffBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  documentViewport: {
    flex: 1,
    backgroundColor: '#525659',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  errorSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
        } as any)
      : {}),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalNotice: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 1.5,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: '#16A34A',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
