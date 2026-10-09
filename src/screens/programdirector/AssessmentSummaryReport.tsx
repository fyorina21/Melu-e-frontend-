// src/screens/programdirector/AssessmentSummaryReport.tsx
// SCR-PD-006: Assessment Summary Report

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import AppNavbar from '../../components/AppNavbar';
import { resolveStudentPhotoUri } from '../../utils/studentPhotoHelper';
import { colors, spacing, radius } from '../../theme/colors';
import { getAssessmentSummaryDashboard } from '../../api/programDirectorApi';
import type { AssessmentSummaryData, StudentOption } from './summaryreport/summaryReportTypes';
import {
  SummaryReportHeader,
  StudentPickerRow,
  StudentOverviewCard,
  AbllsSummaryCard,
  BehaviorSummaryCard,
  PreferenceSummaryCard,
  SensorySummaryCard,
  SocialSkillsSummaryCard,
} from './summaryreport/components';

export default function AssessmentSummaryReport({ route }: any) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [selectedStudent, setSelectedStudent] = useState<string>(route?.params?.studentId || '');
  const [data, setData] = useState<AssessmentSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [prefTab, setPrefTab] = useState<string>('Sensory Time');
  const [reloadCount, setReloadCount] = useState<number>(0);

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

  const handleDownload = () => {
    Alert.alert('Info', 'PDF export coming soon');
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudent(studentId);
    setDropdownOpen(false);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load assessment summary</Text>
          <Text style={styles.errorMessage}>{error || 'No assessment data available.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => setReloadCount((c) => c + 1)}
            accessibilityRole="button"
            accessibilityLabel="Retry loading assessment summary"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const students: StudentOption[] = data?.students || [];
  const selectedStudentObj = students.find((s) => s.id === selectedStudent);
  const rawPhoto =
    data?.studentInfo?.photoUrl || data?.studentInfo?.headshotUrl || data?.studentInfo?.photo;
  const resolvedPhoto = resolveStudentPhotoUri(rawPhoto);

  if (data?.notSelected) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppNavbar activeTab="Assessment Summary Report" />
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            isTablet && styles.tabletContentContainer,
          ]}
        >
          <View style={[styles.contentWrapper, isTablet && styles.tabletWrapper]}>
            <SummaryReportHeader onDownload={handleDownload} />

            <StudentPickerRow
              students={students}
              selectedStudentId={selectedStudent}
              selectedStudentObj={selectedStudentObj}
              dropdownOpen={dropdownOpen}
              searchQuery={searchQuery}
              rawPhoto={rawPhoto}
              onToggleDropdown={() => setDropdownOpen(!dropdownOpen)}
              onSearchChange={setSearchQuery}
              onSelectStudent={handleSelectStudent}
            />

            <View style={styles.notSelectedBox}>
              <Text style={styles.notSelectedText}>Select a student</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppNavbar activeTab="Assessment Summary Report" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, isTablet && styles.tabletContentContainer]}
      >
        <View style={[styles.contentWrapper, isTablet && styles.tabletWrapper]}>
          <SummaryReportHeader onDownload={handleDownload} />

          <StudentPickerRow
            students={students}
            selectedStudentId={selectedStudent}
            selectedStudentObj={selectedStudentObj}
            dropdownOpen={dropdownOpen}
            searchQuery={searchQuery}
            rawPhoto={rawPhoto}
            onToggleDropdown={() => setDropdownOpen(!dropdownOpen)}
            onSearchChange={setSearchQuery}
            onSelectStudent={handleSelectStudent}
          />

          <StudentOverviewCard studentInfo={data.studentInfo} resolvedPhoto={resolvedPhoto} />

          <AbllsSummaryCard abllsScores={data.abllsScores} />

          <BehaviorSummaryCard behavior={data.behavior} />

          <PreferenceSummaryCard
            items={data.preference?.items}
            prefTab={prefTab}
            onTabChange={setPrefTab}
          />

          <SensorySummaryCard activities={data.sensory?.activities} />

          <SocialSkillsSummaryCard socialSkills={data.socialSkills} />

          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.footerBtn}
              accessibilityRole="button"
              accessibilityLabel="Download assessment summary PDF"
            >
              <Text style={styles.footerBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  tabletContentContainer: {
    padding: spacing.lg,
  },
  contentWrapper: {
    width: '100%',
    gap: spacing.md,
  },
  tabletWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: 16,
    color: colors.navyText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  notSelectedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  notSelectedText: {
    fontSize: 18,
    color: colors.mutedText,
    fontWeight: '600',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  footerBtn: {
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
});
