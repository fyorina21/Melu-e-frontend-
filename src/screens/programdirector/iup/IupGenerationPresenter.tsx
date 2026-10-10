import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import ExportPreviewModal from '../../../components/ExportPreviewModal';
import AppNavbar from '../../../components/AppNavbar';

import type {
  GoalBankItem,
  IupCandidate,
  IupContext,
  StationKey,
  Slots,
  IupGenerationPresenterProps,
} from './types';
import { StudentSelectorCard } from './components/StudentSelectorCard';
import { GoalAssignmentTab } from './components/GoalAssignmentTab';
import { AssessmentSummaryTab } from './components/AssessmentSummaryTab';
import { StrategiesProtocolsTab } from './components/StrategiesProtocolsTab';
import { GoalSelectorModal } from './components/GoalSelectorModal';

export type {
  GoalBankItem,
  IupCandidate,
  IupContext,
  StationKey,
  Slots,
  IupGenerationPresenterProps,
};

export default function IupGenerationPresenter({
  filteredCandidates,
  selectedCandidate,
  selectedStudentId,
  context,
  slots,
  activeWorkbenchTab,
  reinforcementSchedule,
  crisisProtocol,
  accommodations,
  reviewCycle,
  customIupValues,
  studentDropdownOpen,
  searchStudentText,
  selectorTarget,
  goalSearch,
  domainFilter,
  filteredGoals,
  previewOpen,
  exportContent,
  lastSavedTimestamp,
  onSelectStudent,
  onToggleDropdown,
  onSearchStudent,
  onTabChange,
  onOpenGoalSelector,
  onCloseGoalSelector,
  onSelectGoal,
  onRemoveGoal,
  onDraftSave,
  onFinalize,
  onOpenPreview,
  onClosePreview,
  onExport,
  onCloseExport,
  onReinforcementScheduleChange,
  onCrisisProtocolChange,
  onAccommodationsChange,
  onReviewCycleChange,
  onCustomIupValuesChange,
  onGoalSearchChange,
  onDomainFilterChange,
  onNavbarTabPress,
}: IupGenerationPresenterProps) {
  const assignedGoalCount = [...slots.station1, ...slots.station2].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="IUP Creation & Goal Assignment" onTabPress={onNavbarTabPress} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.badgeIcon}>
                <Feather name="file-text" size={20} color={colors.navyText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>IUP Generation & Management</Text>
                <Text style={styles.pageSubtitle}>
                  Design, customize, and finalize Individualized Behavior Intervention Plans
                </Text>
              </View>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.headerOutlineBtn}
                onPress={onOpenPreview}
                accessibilityRole="button"
                accessibilityLabel="Preview IUP"
              >
                <Feather name="eye" size={14} color={colors.navyText} />
                <Text style={styles.headerOutlineBtnText}>Preview IUP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerOutlineBtn}
                onPress={onExport}
                accessibilityRole="button"
                accessibilityLabel="Export or print IUP"
              >
                <Feather name="printer" size={14} color={colors.navyText} />
                <Text style={styles.headerOutlineBtnText}>Export / Print</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Student Selector Card */}
          <StudentSelectorCard
            selectedCandidate={selectedCandidate}
            selectedStudentId={selectedStudentId}
            context={context}
            studentDropdownOpen={studentDropdownOpen}
            searchStudentText={searchStudentText}
            filteredCandidates={filteredCandidates}
            lastSavedTimestamp={lastSavedTimestamp}
            onToggleDropdown={onToggleDropdown}
            onSearchStudent={onSearchStudent}
            onSelectStudent={onSelectStudent}
          />

          {/* Workbench Tab Navigation */}
          <View style={styles.tabContainer} accessibilityRole="tablist">
            <TouchableOpacity
              style={[styles.tabBtn, activeWorkbenchTab === 'goals' && styles.tabBtnActive]}
              onPress={() => onTabChange('goals')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeWorkbenchTab === 'goals' }}
            >
              <Feather
                name="target"
                size={15}
                color={activeWorkbenchTab === 'goals' ? colors.navyText : colors.bodyText}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeWorkbenchTab === 'goals' && styles.tabBtnTextActive,
                ]}
              >
                Goal Assignment ({assignedGoalCount}/4)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeWorkbenchTab === 'assessment' && styles.tabBtnActive]}
              onPress={() => onTabChange('assessment')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeWorkbenchTab === 'assessment' }}
            >
              <Feather
                name="activity"
                size={15}
                color={activeWorkbenchTab === 'assessment' ? colors.navyText : colors.bodyText}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeWorkbenchTab === 'assessment' && styles.tabBtnTextActive,
                ]}
              >
                Assessment Summary
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeWorkbenchTab === 'strategies' && styles.tabBtnActive]}
              onPress={() => onTabChange('strategies')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeWorkbenchTab === 'strategies' }}
            >
              <Feather
                name="sliders"
                size={15}
                color={activeWorkbenchTab === 'strategies' ? colors.navyText : colors.bodyText}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeWorkbenchTab === 'strategies' && styles.tabBtnTextActive,
                ]}
              >
                Implementation & Protocols
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Contents */}
          {activeWorkbenchTab === 'goals' && (
            <GoalAssignmentTab
              slots={slots}
              onOpenGoalSelector={onOpenGoalSelector}
              onRemoveGoal={onRemoveGoal}
            />
          )}

          {activeWorkbenchTab === 'assessment' && (
            <AssessmentSummaryTab context={context} selectedCandidate={selectedCandidate} />
          )}

          {activeWorkbenchTab === 'strategies' && (
            <StrategiesProtocolsTab
              reinforcementSchedule={reinforcementSchedule}
              accommodations={accommodations}
              crisisProtocol={crisisProtocol}
              reviewCycle={reviewCycle}
              customIupValues={customIupValues}
              onReinforcementScheduleChange={onReinforcementScheduleChange}
              onAccommodationsChange={onAccommodationsChange}
              onCrisisProtocolChange={onCrisisProtocolChange}
              onReviewCycleChange={onReviewCycleChange}
              onCustomIupValuesChange={onCustomIupValuesChange}
            />
          )}

          {/* Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={onDraftSave}
              accessibilityRole="button"
              accessibilityLabel="Save draft"
            >
              <Feather name="save" size={15} color={colors.navyText} />
              <Text style={styles.saveDraftBtnText}>Save Draft</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewBtn}
              onPress={onOpenPreview}
              accessibilityRole="button"
              accessibilityLabel="Full preview"
            >
              <Feather name="eye" size={15} color={colors.navyText} />
              <Text style={styles.previewBtnText}>Full Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.finalizeBtn}
              onPress={onFinalize}
              accessibilityRole="button"
              accessibilityLabel="Finalize and activate IUP"
            >
              <Feather name="check-circle" size={16} color={colors.navyText} />
              <Text style={styles.finalizeBtnText}>Finalize & Activate IUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Goal Selector Modal */}
      <GoalSelectorModal
        selectorTarget={selectorTarget}
        goalSearch={goalSearch}
        domainFilter={domainFilter}
        filteredGoals={filteredGoals}
        onCloseGoalSelector={onCloseGoalSelector}
        onGoalSearchChange={onGoalSearchChange}
        onDomainFilterChange={onDomainFilterChange}
        onSelectGoal={onSelectGoal}
      />

      {/* Export / Print Preview Modal */}
      <ExportPreviewModal
        visible={previewOpen || !!exportContent}
        title={`Individualized Unit Plan — ${context?.studentName || selectedCandidate?.name || 'Student'}`}
        filename={`IUP_${(context?.studentName || selectedCandidate?.name || 'Student').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`}
        content={exportContent || ''}
        formId="FRM-IUP-001"
        revisionNumber="Rev 1.8 · 2026-09-19"
        pageNumber={1}
        totalPages={2}
        onClose={() => {
          onClosePreview();
          onCloseExport();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  responsiveContainer: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyText,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.bodyText,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerOutlineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#FACC15',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  tabBtnTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  finalizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    borderWidth: 1,
    borderColor: '#FACC15',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  finalizeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navyText,
  },
});
