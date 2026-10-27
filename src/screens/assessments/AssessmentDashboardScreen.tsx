import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { useToast } from '../../context/ToastContext';
import { confirmAction } from '../../utils/dialogs';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import { useTeacherAssessments } from './useTeacherAssessments';
import { AssessmentKpiStrip } from './components/AssessmentKpiStrip';
import { StudentAssessmentCard } from './components/StudentAssessmentCard';
import { AssessmentSkeleton } from './components/AssessmentSkeleton';
import { AssessmentEmptyState } from './components/AssessmentEmptyState';
import { AssessmentErrorState } from './components/AssessmentErrorState';
import type { SubModuleKey, StudentAssessmentItem } from './assessmentDashboardTypes';
import type { SessionStackParamList } from '../../types';

type Props = NativeStackScreenProps<SessionStackParamList, 'AssessmentDashboard'>;

export default function AssessmentDashboardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= 640;
  const { showToast } = useToast();

  const { data, loading, error, refetch, submittingStudentId, submitStudentAssessments } =
    useTeacherAssessments();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleNavigateModule = (key: SubModuleKey, studentId: string, isCompleted: boolean) => {
    switch (key) {
      case 'skills':
        navigation?.navigate?.('SkillsAssessment', { studentId });
        break;
      case 'behavior':
        navigation?.navigate?.('BehaviorAssessment', { studentId });
        break;
      case 'preference':
        navigation?.navigate?.('PreferenceAssessment', { studentId });
        break;
      case 'sensory':
        navigation?.navigate?.('SensoryAssessment', { studentId });
        break;
    }
  };

  const handleSubmitForReview = (student: StudentAssessmentItem) => {
    confirmAction({
      title: 'Submit Final Assessment for Clinical Review',
      message: `Are you sure you want to finalize and submit all 4 completed assessments for ${student.fullName}? The entire assessment file is complete now and will be transferred to the Program Director for clinical review (SCR-PD-002).`,
      confirmLabel: 'Submit for Review',
      onConfirm: async () => {
        const success = await submitStudentAssessments(student);
        if (success) {
          showToast(
            `${student.fullName}'s assessment file is complete now and has been submitted for Program Director review.`,
            'success',
          );
        } else {
          showToast('Failed to submit assessments for review. Please try again.', 'error');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1A: Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.documentIconBox}>
              <Feather name="file-text" size={22} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>6-Week Assessment Dashboard</Text>
              <Text style={styles.assignedClinicianSubtitle}>
                Assigned Clinician:{' '}
                <Text style={styles.clinicianHighlight}>
                  {data?.clinicianName || 'Assigned Clinician'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Assessment Cycle Tag */}
          <View style={styles.cycleBadge}>
            <Feather name="clock" size={13} color="#D97706" style={{ marginRight: 5 }} />
            <Text style={styles.cycleBadgeText}>
              Assessment Period: {data?.periodLabel || '6-Week Baseline Assessment'}
            </Text>
          </View>
        </View>

        {/* State 1: Initial Loading Skeleton */}
        {loading && !data && <AssessmentSkeleton />}

        {/* State 2: Error Boundary */}
        {!data && error && <AssessmentErrorState onRetry={refetch} />}

        {/* State 3: Active Data Content */}
        {data && (
          <>
            {/* Section 1B: Dynamic KPI Metric Strip (4-Card Grid) */}
            <AssessmentKpiStrip kpis={data.kpis} />

            {/* Section 1C: Caseload Section Header */}
            <View style={styles.caseloadHeaderRow}>
              <View style={styles.caseloadTitleGroup}>
                <Text style={typography.h3}>Student Assessments</Text>
                <View style={styles.childrenBadge}>
                  <Text style={styles.childrenBadgeText}>
                    {data.students.length} Children Assigned
                  </Text>
                </View>
              </View>
              <Text style={styles.microCopy}>
                Click any assessment card to enter or review clinician scoring
              </Text>
            </View>

            {/* Empty Caseload Check */}
            {data.students.length === 0 ? (
              <AssessmentEmptyState />
            ) : (
              /* Section 2: Dynamic Student Assessment Cards (2-Column Grid) */
              <View style={[styles.studentsGrid, isTabletOrDesktop && styles.studentsGridDesktop]}>
                {data.students.map((student) => (
                  <View
                    key={student.id}
                    style={[
                      styles.studentGridItem,
                      isTabletOrDesktop && styles.studentGridItemDesktop,
                    ]}
                  >
                    <StudentAssessmentCard
                      student={student}
                      onNavigateModule={handleNavigateModule}
                      onSubmitForReview={handleSubmitForReview}
                      isSubmitting={submittingStudentId === student.id}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
    gap: spacing.lg,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
  },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 260,
  },
  documentIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navyText,
    letterSpacing: -0.2,
  },
  assignedClinicianSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
  },
  clinicianHighlight: {
    fontWeight: '700',
    color: '#0284C7',
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  cycleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  caseloadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  caseloadTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childrenBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  childrenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  microCopy: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },

  studentsGrid: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  studentsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  studentGridItem: {
    width: '100%',
  },
  studentGridItemDesktop: {
    width: '49%',
    flexGrow: 1,
  },
});
