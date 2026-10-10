import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { IupCandidate, IupContext } from '../types';

interface AssessmentSummaryTabProps {
  context: IupContext | null;
  selectedCandidate: IupCandidate | null;
}

export function AssessmentSummaryTab({ context, selectedCandidate }: AssessmentSummaryTabProps) {
  return (
    <View style={styles.tabContentWrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Demographics & Intake Context</Text>
        <View style={styles.demoGrid}>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Student Name</Text>
            <Text style={styles.demoValue}>
              {context?.studentName || selectedCandidate?.name || '—'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Age / DOB</Text>
            <Text style={styles.demoValue}>
              Age {context?.age ?? selectedCandidate?.age ?? '—'} · {context?.dob || '—'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Program</Text>
            <Text style={styles.demoValue}>
              {context?.program || selectedCandidate?.program || 'ABA Therapy'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Enrolled Date</Text>
            <Text style={styles.demoValue}>{context?.enrollmentDate || '—'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Baseline Assessment Strengths & Needs</Text>

        <View style={styles.contextSection}>
          <View style={styles.contextHeaderRow}>
            <Feather name="award" size={15} color={colors.primaryYellowDark} />
            <Text style={styles.contextSectionTitle}>Skills & Strengths</Text>
          </View>
          <Text style={styles.contextText}>
            {context?.skillsStrengths ||
              'Demonstrates strong visual-spatial matching, basic receptive identification of familiar items, and cooperative response to high-preference items.'}
          </Text>
        </View>

        <View style={styles.contextSection}>
          <View style={styles.contextHeaderRow}>
            <Feather name="alert-triangle" size={15} color="#EF4444" />
            <Text style={styles.contextSectionTitle}>Behavioral Functions & Triggers</Text>
          </View>
          <Text style={styles.contextText}>
            {context?.behaviorFunctions ||
              'Primary function is escape/avoidance of novel non-preferred motor tasks. Exhibits mild vocal protest when demands escalate.'}
          </Text>
        </View>

        <View style={styles.contextSection}>
          <View style={styles.contextHeaderRow}>
            <Feather name="star" size={15} color="#F59E0B" />
            <Text style={styles.contextSectionTitle}>Top Reinforcement Inventory</Text>
          </View>
          <View style={styles.reinforcerChipsWrap}>
            {(
              context?.topReinforcers || [
                'Bubbles',
                'Musical Toy',
                'Token Stars',
                'Edible Treat',
                'Spinning Wheel',
              ]
            ).map((r, i) => (
              <View key={i} style={styles.reinforcerChip}>
                <Text style={styles.reinforcerRank}>#{i + 1}</Text>
                <Text style={styles.reinforcerChipText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.contextSection}>
          <View style={styles.contextHeaderRow}>
            <Feather name="feather" size={15} color="#8B5CF6" />
            <Text style={styles.contextSectionTitle}>Sensory Engagement Profile</Text>
          </View>
          <Text style={styles.contextText}>
            {context?.sensorySummary ||
              'Calmed by deep pressure stimulation. Benefits from scheduled 3-minute sensory gross motor movement between trial rounds.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentWrap: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  demoItem: {
    minWidth: 180,
    flex: 1,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
    marginTop: 2,
  },
  contextSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contextSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  contextText: {
    fontSize: 13,
    color: colors.bodyText,
    lineHeight: 20,
  },
  reinforcerChipsWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reinforcerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  reinforcerRank: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  reinforcerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
});
