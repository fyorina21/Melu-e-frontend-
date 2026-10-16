import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';

export type SessionTab = 'Sensory Time' | 'Circle Time' | 'Play Time';

interface PreferenceAssessmentHeaderProps {
  onBack: () => void;
  studentName?: string;
  studentAge?: string | number;
  activeTab: SessionTab;
  onTabChange: (tab: SessionTab) => void;
}

const TABS: SessionTab[] = ['Sensory Time', 'Circle Time', 'Play Time'];

export const PreferenceAssessmentHeader: React.FC<PreferenceAssessmentHeaderProps> = React.memo(
  ({ onBack, studentName = 'Student', studentAge = '?', activeTab, onTabChange }) => {
    return (
      <View style={styles.container}>
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerTitle}>Preference Assessment</Text>
            <Text style={styles.headerSubtitle}>ABA Therapy Management</Text>
          </View>
          <View style={styles.studentBadge}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.studentAge}>Age {studentAge}</Text>
          </View>
        </View>

        <View style={styles.sessionTabRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.sessionTabBtn, isActive && styles.sessionTabBtnActive]}
                onPress={() => onTabChange(tab)}
                accessibilityRole="button"
                accessibilityLabel={`${tab} tab`}
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.sessionTabText, isActive && styles.sessionTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  studentBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },
  studentAge: {
    fontSize: 11,
    color: '#A16207',
  },
  sessionTabRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
  },
  sessionTabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionTabBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  sessionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  sessionTabTextActive: {
    color: '#FFFFFF',
  },
});
