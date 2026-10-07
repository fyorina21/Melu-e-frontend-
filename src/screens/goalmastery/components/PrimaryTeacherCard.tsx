import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { PrimaryTeacherData } from '../types';

interface PrimaryTeacherCardProps {
  teacherName: string;
  primaryData: PrimaryTeacherData;
}

export const PrimaryTeacherCard: React.FC<PrimaryTeacherCardProps> = React.memo(
  ({ teacherName, primaryData }) => {
    return (
      <View style={[styles.columnCard, styles.primaryTeacherCard]}>
        <View style={styles.primaryCardHeader}>
          <Text style={styles.primaryCardTitle}>{teacherName} (Primary)</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.teacherNameRow}>
            <Feather name="user" size={16} color="#64748B" />
            <Text style={styles.teacherNameText}>{teacherName}</Text>
          </View>

          <View style={styles.badge100}>
            <Text style={styles.badge100Text}>
              {primaryData.independenceRate || '100%'} Independence Achieved
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Criteria Met:</Text>
            <Text style={styles.detailValue}>{primaryData.criteriaMet}</Text>
          </View>

          <Text style={styles.detailLine}>
            <Text style={styles.boldLabel}>Date Achieved:</Text> {primaryData.dateAchieved}
          </Text>
          <Text style={styles.detailLine}>
            <Text style={styles.boldLabel}>Total Trials:</Text> {primaryData.totalTrials}
          </Text>
          <Text style={styles.detailLine}>
            <Text style={styles.boldLabel}>Independence:</Text> {primaryData.independenceRate}
          </Text>

          <Text style={styles.notesLabel}>Notes</Text>
          <View style={styles.readOnlyNotes}>
            <Text style={styles.notesText}>
              {primaryData.notes || 'No session notes recorded.'}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  columnCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  primaryTeacherCard: {
    borderColor: '#BAE6FD',
  },
  primaryCardHeader: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  primaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardBody: {
    padding: spacing.md,
    gap: 8,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  teacherNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge100: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  badge100Text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  detailSection: {
    marginTop: 4,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  detailValue: {
    fontSize: 12,
    color: '#1E293B',
    marginTop: 2,
  },
  detailLine: {
    fontSize: 12,
    color: '#334155',
  },
  boldLabel: {
    fontWeight: '700',
    color: '#64748B',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  readOnlyNotes: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 60,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
