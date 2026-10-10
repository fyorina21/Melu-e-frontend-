import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { ProgressOverview } from '../studentProgressTypes';

interface BehaviorIncidentListProps {
  overview: ProgressOverview | null;
}

export function BehaviorIncidentList({ overview }: BehaviorIncidentListProps) {
  return (
    <View style={styles.card}>
      <View style={styles.chartHeaderRow}>
        <Feather name="alert-triangle" size={16} color="#FCD34D" />
        <Text style={styles.cardTitle}>Behavior Incidents</Text>
      </View>
      {(overview?.incidents ?? []).map((incident, i) => (
        <View
          key={`${incident.date}-${i}`}
          style={[styles.incidentTrendRow, { alignItems: 'flex-start' }]}
        >
          <Text style={styles.incidentWeekLabel}>{incident.date}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.navyText }}>
              {incident.type}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{incident.detail}</Text>
          </View>
        </View>
      ))}
      {!overview && <Text style={styles.emptyText}>Loading incident data...</Text>}
      {overview && (overview.incidents?.length ?? 0) === 0 && (
        <Text style={styles.emptyText}>{overview.incidentSummary || 'No incidents recorded.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  incidentTrendRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: spacing.md,
  },
  incidentWeekLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    width: 80,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
});
