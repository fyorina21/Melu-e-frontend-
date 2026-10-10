import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { handleTeacherTabPress } from '../../navigation/teacherTabNavigation';
import {
  saveSensoryAssessment,
  getSensoryAssessment,
  getTeacherStudentProfile,
} from '../../api/teacherExtrasApi';
import { useToast } from '../../context/ToastContext';
import type { SessionStackParamList } from '../../types';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { radius, spacing } from '../../theme/colors';

import {
  type SensoryActivityItem,
  INITIAL_ACTIVITIES,
  calculateSensoryMetrics,
} from './sensory/types';
import { SensoryHeaderCard } from './sensory/components/SensoryHeaderCard';
import { SensoryActivityRow } from './sensory/components/SensoryActivityRow';
import { SensorySummaryCard } from './sensory/components/SensorySummaryCard';
import { AddCustomActivityModal } from './sensory/components/AddCustomActivityModal';
import { SensoryFooterBar } from './sensory/components/SensoryFooterBar';

type Props = NativeStackScreenProps<SessionStackParamList, 'SensoryAssessment'>;

interface StudentProfile {
  fullName?: string;
  age?: number | string;
  [key: string]: unknown;
}

export default function SensoryAssessmentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { showToast } = useToast();
  const [assessmentDate, setAssessmentDate] = useState('08/21/2026');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activities, setActivities] = useState<SensoryActivityItem[]>(INITIAL_ACTIVITIES);
  const [showExport, setShowExport] = useState(false);

  // Custom Activity Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');

  // Dropdown Picker state
  const [activePicker, setActivePicker] = useState<{
    id: string;
    field: 'engagement' | 'reaction';
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getTeacherStudentProfile(studentId)
      .then((res) => {
        if (isMounted && res?.data) setProfile(res.data);
      })
      .catch(() => {});

    getSensoryAssessment(studentId)
      .then((res) => {
        if (!isMounted) return;
        const savedData = res?.data?.data || res?.data;
        if (
          savedData?.activities &&
          Array.isArray(savedData.activities) &&
          savedData.activities.length > 0
        ) {
          setActivities(savedData.activities);
        }
        if (savedData?.assessmentDate) {
          setAssessmentDate(savedData.assessmentDate);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const metrics = useMemo(() => calculateSensoryMetrics(activities), [activities]);

  const updateActivity = useCallback((id: string, updates: Partial<SensoryActivityItem>) => {
    setActivities((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const handleTogglePicker = useCallback((id: string, field: 'engagement' | 'reaction') => {
    setActivePicker((prev) => (prev?.id === id && prev.field === field ? null : { id, field }));
  }, []);

  const handleClosePicker = useCallback(() => {
    setActivePicker(null);
  }, []);

  const handleAddCustomActivity = useCallback(() => {
    if (!newActivityName.trim()) {
      Alert.alert('Required', 'Please enter an activity name.');
      return;
    }
    const nextIdNumber = activities.length + 1;
    const newId = `SEN-${String(nextIdNumber).padStart(3, '0')}`;

    setActivities((prev) => [...prev, { id: newId, name: newActivityName.trim(), remark: '' }]);
    setNewActivityName('');
    setIsModalVisible(false);
  }, [activities.length, newActivityName]);

  const handleSave = useCallback(
    async (status: 'draft' | 'submitted') => {
      try {
        await saveSensoryAssessment(studentId, { assessmentDate, activities, status });
        showToast(
          status === 'submitted'
            ? 'Sensory assessment submitted successfully.'
            : `Sensory assessment draft saved (${metrics.progressPercent}% complete).`,
          'success',
        );
        if (status === 'submitted') {
          navigation?.navigate?.('AssessmentSummaryReport' as any, { studentId } as any);
        }
      } catch {
        showToast('Failed to save sensory assessment draft', 'error');
      }
    },
    [studentId, assessmentDate, activities, metrics.progressPercent, showToast, navigation],
  );

  const exportReportContent = useMemo(
    () =>
      [
        "MELU'E FOUNDATION FOR AUTISM & SPECIAL NEEDS",
        'SENSORY ENGAGEMENT & REACTION ASSESSMENT REPORT',
        '================================================================',
        `STUDENT ID: ${studentId}`,
        `STUDENT NAME: ${profile?.fullName || 'Student'}`,
        `ASSESSMENT DATE: ${assessmentDate}`,
        `SCORED ACTIVITIES: ${metrics.scoredCount} / ${metrics.totalActivities} (${metrics.progressPercent}%)`,
        '----------------------------------------------------------------',
        '',
        ...activities.map(
          (a, idx) =>
            `${idx + 1}. ${a.name}\n   Engagement: ${a.engagementLevel || 'Not Specified'}\n   Reaction: ${a.responseReaction || 'Not Observed'}\n   Remarks: ${a.remark || 'None'}\n`,
        ),
        '----------------------------------------------------------------',
        'SUMMARY METRICS:',
        `Independent: ${metrics.engagementCounts['Independent']}`,
        `Partial Physical: ${metrics.engagementCounts['Partial Physical Prompt']}`,
        `Full Physical: ${metrics.engagementCounts['Full Physical Prompt']}`,
        `Enjoyed: ${metrics.reactionCounts['Enjoyed']}`,
        `Neutral: ${metrics.reactionCounts['Neutral']}`,
        `Refused: ${metrics.reactionCounts['Refused']}`,
      ].join('\n'),
    [studentId, profile?.fullName, assessmentDate, metrics, activities],
  );

  const contentStyle = useMemo(
    () => [styles.content, isTablet && styles.tabletContent],
    [isTablet],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Assessments"
        onTabPress={(tab) => handleTeacherTabPress(navigation, tab)}
      />

      <ScrollView contentContainerStyle={contentStyle} nestedScrollEnabled>
        <SensoryHeaderCard
          onBack={() => navigation?.goBack?.()}
          studentName={profile?.fullName || 'Student'}
          studentAge={profile?.age || '?'}
          studentId={studentId}
          photoUrl={
            (profile as any)?.photoUrl || (profile as any)?.headshotUrl || (profile as any)?.photo
          }
          assessmentDate={assessmentDate}
          onAssessmentDateChange={setAssessmentDate}
          scoredCount={metrics.scoredCount}
          totalActivities={metrics.totalActivities}
          progressPercent={metrics.progressPercent}
        />

        {/* Activities Table */}
        <View style={[styles.tableCard, { zIndex: activePicker ? 100 : 1 }]}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.colId]}>ID</Text>
            <Text style={[styles.thText, styles.colActivity]}>Activity</Text>
            <Text style={[styles.thText, styles.colDropdown]}>Engagement Level</Text>
            <Text style={[styles.thText, styles.colDropdown]}>Response / Reaction</Text>
            <Text style={[styles.thText, styles.colRemark]}>Remark</Text>
          </View>

          {activities.map((item, index) => (
            <SensoryActivityRow
              key={item.id}
              item={item}
              index={index}
              totalCount={activities.length}
              activePicker={activePicker}
              onTogglePicker={handleTogglePicker}
              onClosePicker={handleClosePicker}
              onUpdateActivity={updateActivity}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.addCustomBtn}
          onPress={() => setIsModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add custom sensory activity"
        >
          <Feather name="plus" size={16} color="#0284C7" />
          <Text style={styles.addCustomText}>Add Custom Activity</Text>
        </TouchableOpacity>

        <SensorySummaryCard metrics={metrics} />

        <SensoryFooterBar
          onPrint={() => setShowExport(true)}
          onSaveDraft={() => handleSave('draft')}
          onSubmit={() => handleSave('submitted')}
        />
      </ScrollView>

      <ExportPreviewModal
        visible={showExport}
        filename="sensory_assessment_report.txt"
        title={`Sensory Assessment — ${profile?.fullName || studentId}`}
        content={exportReportContent}
        onClose={() => setShowExport(false)}
      />

      <AddCustomActivityModal
        visible={isModalVisible}
        activityName={newActivityName}
        onActivityNameChange={setNewActivityName}
        onConfirm={handleAddCustomActivity}
        onClose={() => setIsModalVisible(false)}
      />
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
    gap: spacing.md,
    paddingBottom: 60,
  },
  tabletContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  colId: {
    width: 80,
  },
  colActivity: {
    flex: 2,
    minWidth: 140,
    paddingRight: 8,
  },
  colDropdown: {
    flex: 2,
    minWidth: 150,
    paddingRight: 8,
  },
  colRemark: {
    flex: 2,
    minWidth: 140,
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
});
