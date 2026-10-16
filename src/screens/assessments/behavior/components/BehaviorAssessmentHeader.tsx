// src/screens/assessments/behavior/components/BehaviorAssessmentHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { TABS, type AssessmentTab } from '../behaviorTypes';

interface BehaviorAssessmentHeaderProps {
  studentName: string;
  activeTab: AssessmentTab;
  onTabChange: (tab: AssessmentTab) => void;
  onBack: () => void;
}

export const BehaviorAssessmentHeader: React.FC<BehaviorAssessmentHeaderProps> = React.memo(
  ({ studentName, activeTab, onTabChange, onBack }) => {
    return (
      <View style={styles.container}>
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Feather name="alert-triangle" size={18} color={colors.navyText} />
            <View>
              <Text style={typography.h1}>Behavior Assessment</Text>
              <Text style={typography.caption}>
                SCR-TEA-003 — MASS / FAST / ABC · {studentName}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => onTabChange(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === t }}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'ABC' ? 'ABC Tracking' : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
  },
  backRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    marginLeft: 4,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  tabTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
