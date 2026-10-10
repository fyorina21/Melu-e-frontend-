import React from 'react';
import { ScrollView, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import AppNavbar from '../../components/AppNavbar';
import { spacing } from '../../theme/colors';
import type { DailyNotesPresenterProps } from './dailyNotesTypes';
import { DailyNotesHeader } from './components/DailyNotesHeader';
import { DailyNotesStatsCards } from './components/DailyNotesStatsCards';
import { DailyNotesFilterBar } from './components/DailyNotesFilterBar';
import { DailyNotesBehaviorCard } from './components/DailyNotesBehaviorCard';
import { DailyNotesSessionTable } from './components/DailyNotesSessionTable';
import { DailyNotesWeeklySummary } from './components/DailyNotesWeeklySummary';
import { CoordinatorFeedbackModal } from './components/CoordinatorFeedbackModal';

export type {
  NoteRecord,
  DailyNotesStats,
  WeeklySummaryData,
  BehaviorRecord,
  BehaviorAssessmentData,
  StudentOption,
  DailyNotesPresenterProps,
} from './dailyNotesTypes';

export default function DailyNotesPresenter({
  stats,
  summary,
  filteredRecords,
  search,
  dateFilter,
  statusFilter,
  studentId,
  studentOptions,
  openDropdown,
  behaviorAssessment,
  hasBehavior,
  massFunctionText,
  fastCategoryText,
  feedbackTarget,
  dateOptions,
  statusOptions,
  onSearchChange,
  onDateFilterChange,
  onStatusFilterChange,
  onStudentSelect,
  onToggleDropdown,
  onExportWeekly,
  onGoBack,
  onNavigateEditor,
  onNavigateBehaviorAssessment,
  onResubmitNote,
  onCloseFeedback,
  onOpenFeedback,
  onNavbarTabPress,
}: DailyNotesPresenterProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Daily Notes" onTabPress={onNavbarTabPress} />

      <ScrollView
        contentContainerStyle={[styles.content, isTablet && styles.contentTablet]}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <DailyNotesHeader onGoBack={onGoBack} onExportWeekly={onExportWeekly} />

        <DailyNotesStatsCards stats={stats} />

        <DailyNotesFilterBar
          search={search}
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          studentId={studentId}
          studentOptions={studentOptions}
          openDropdown={openDropdown}
          dateOptions={dateOptions}
          statusOptions={statusOptions}
          onSearchChange={onSearchChange}
          onDateFilterChange={onDateFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onStudentSelect={onStudentSelect}
          onToggleDropdown={onToggleDropdown}
        />

        <DailyNotesBehaviorCard
          studentId={studentId}
          hasBehavior={hasBehavior}
          behaviorAssessment={behaviorAssessment}
          massFunctionText={massFunctionText}
          fastCategoryText={fastCategoryText}
          onStudentSelect={onStudentSelect}
          onNavigateBehaviorAssessment={onNavigateBehaviorAssessment}
        />

        <DailyNotesSessionTable
          records={filteredRecords}
          onNavigateEditor={onNavigateEditor}
          onResubmitNote={onResubmitNote}
          onOpenFeedback={onOpenFeedback}
        />

        {summary && (
          <DailyNotesWeeklySummary
            summary={summary}
            records={filteredRecords}
            onExportWeekly={onExportWeekly}
          />
        )}
      </ScrollView>

      <CoordinatorFeedbackModal feedbackTarget={feedbackTarget} onClose={onCloseFeedback} />
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
    width: '100%',
  },
  contentTablet: {
    maxWidth: 1200,
    alignSelf: 'center',
  },
});
