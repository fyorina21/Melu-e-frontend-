import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import { type DisplayIncident } from '../types';

interface BehaviorIncidentsCardProps {
  incidents: DisplayIncident[];
}

export const BehaviorIncidentsCard: React.FC<BehaviorIncidentsCardProps> = React.memo(
  ({ incidents }) => {
    const [expandedIncidentIndex, setExpandedIncidentIndex] = useState<number | null>(null);

    if (incidents.length === 0) return null;

    return (
      <View style={styles.incidentCard}>
        <View style={styles.incidentHeader}>
          <Feather name="alert-triangle" size={18} color="#EA580C" />
          <Text style={styles.incidentTitle}>Behavior Incidents ({incidents.length})</Text>
        </View>
        {incidents.map((inc, i) => (
          <View key={i} style={styles.incidentBody}>
            <View style={styles.incidentRowTop}>
              <Text style={styles.incidentTime}>
                {inc.date ? `${inc.date} ` : ''}
                {inc.time}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setExpandedIncidentIndex(expandedIncidentIndex === i ? null : i);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  expandedIncidentIndex === i ? 'Hide incident details' : 'View incident details'
                }
              >
                <Text style={styles.linkText}>
                  {expandedIncidentIndex === i ? 'Hide Details' : 'View Details'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.incidentABC}>
              <Text style={styles.boldText}>A:</Text> {inc.antecedent || 'Not recorded'} •{' '}
              <Text style={styles.boldText}>B:</Text> {inc.behavior || 'Not recorded'} •{' '}
              <Text style={styles.boldText}>C:</Text> {inc.consequence || 'Not recorded'}
            </Text>

            {expandedIncidentIndex === i && (
              <View style={styles.incidentExpandedBox}>
                <Text style={styles.boldText}>
                  Student: <Text style={styles.normalText}>{inc.studentName || 'Student'}</Text>
                </Text>
                <Text style={[styles.boldText, styles.notesLabel]}>Additional Notes:</Text>
                <Text style={styles.notesText}>{inc.additionalNotes || 'None'}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.md,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  incidentBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.sm,
    gap: 4,
  },
  incidentRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  incidentABC: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  normalText: {
    fontWeight: 'normal',
    color: '#334155',
  },
  incidentExpandedBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    gap: 2,
  },
  notesLabel: {
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#334155',
  },
});
