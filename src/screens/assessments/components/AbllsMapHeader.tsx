// src/screens/assessments/components/AbllsMapHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../components/StudentAvatar';
import { colors, radius, spacing } from '../../../theme';
import { typography } from '../../../theme/typography';
import { Button, Tabs } from '../../../shared/components';
import type { ViewMode } from '../types';

interface AbllsMapHeaderProps {
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  onExport: () => void;
  studentName: string;
  studentId: string;
  profile: any;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const VIEW_TABS: {
  id: ViewMode;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { id: 'grid', label: 'Skill Tracking Grid', icon: 'grid' },
  { id: 'cards', label: 'Domain Cards', icon: 'layers' },
  { id: 'summary', label: 'Priority Needs & Summary', icon: 'bar-chart-2' },
];

export const AbllsMapHeader: React.FC<AbllsMapHeaderProps> = React.memo(
  ({
    onBack,
    onSave,
    saving,
    onExport,
    studentName,
    studentId,
    profile,
    viewMode,
    onViewModeChange,
  }) => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to Skills Assessment"
          >
            <Feather name="arrow-left" size={16} color={colors.navyText} />
            <Text style={styles.backBtnText}>Back to Skills Assessment</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <Button
            label={saving ? 'Saving...' : 'Save Assessment'}
            variant="primary"
            size="sm"
            loading={saving}
            disabled={saving}
            onPress={onSave}
            style={{ marginRight: spacing.sm }}
          />
          <Button
            label="Print / Export Sheet"
            variant="outline"
            size="sm"
            onPress={onExport}
            icon={<Feather name="printer" size={14} />}
          />
        </View>

        {/* Student & Tracking Information Sheet Header */}
        <View style={styles.sheetHeaderCard}>
          <View style={styles.sheetHeaderLeft}>
            <Text style={typography.h1}>
              Assessment of Basic Language and Learning Skills-Revised (ABLLS-R)
            </Text>
            <Text style={[typography.caption, { marginTop: 2 }]}>
              Skill Tracking System &middot; Color Need Analysis Grid
            </Text>

            <View style={styles.studentMetaRow}>
              <StudentAvatar
                name={studentName}
                studentId={studentId}
                photoUrl={profile?.photoUrl || profile?.headshotUrl || profile?.photo}
                size={42}
                style={{ marginRight: 10 }}
              />
              <View>
                <Text style={styles.studentNameText}>{studentName}</Text>
                <Text style={styles.studentDetailsText}>
                  Student ID: {studentId} &middot; Age {profile?.age ?? '—'} &middot; Assessment:
                  Current
                </Text>
              </View>
            </View>
          </View>

          {/* Color Code Legend Table */}
          <View style={styles.legendBox}>
            <Text style={styles.legendHeader}>COLOR CODE / MASTERY KEY</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.success }]} />
                <View style={[styles.miniCell, { backgroundColor: colors.success }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 2 &middot; (2 Cells)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.warning }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 1 &middot; (1 Cell)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: colors.error }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#FFFFFF' }]} />
              </View>
              <Text style={styles.legendLabel}>Score 0 &middot; (1 Red Cell)</Text>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendCellSample}>
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.miniCell, { backgroundColor: '#E2E8F0' }]} />
              </View>
              <Text style={styles.legendLabel}>N/A &middot; Not Assessed</Text>
            </View>
          </View>
        </View>

        {/* View Mode Switcher Tabs */}
        <View style={styles.modeTabsRow}>
          <Tabs
            tabs={VIEW_TABS}
            activeTab={viewMode}
            onChange={(m) => onViewModeChange(m as ViewMode)}
            variant="pills"
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  sheetHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sheetHeaderLeft: {
    flex: 1,
    minWidth: 320,
  },
  studentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  studentNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  studentDetailsText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  legendBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#F8FAFC',
    gap: spacing.xs,
  },
  legendHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendCellSample: {
    flexDirection: 'row',
    gap: 1.5,
  },
  miniCell: {
    width: 8,
    height: 8,
    borderWidth: 0.5,
    borderColor: '#475569',
  },
  legendLabel: {
    fontSize: 11,
    color: colors.bodyText,
    fontWeight: '600',
  },
  modeTabsRow: {
    paddingBottom: spacing.sm,
  },
});
