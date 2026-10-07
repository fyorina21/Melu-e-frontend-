import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';

export const ScheduleCapacityHeader: React.FC = React.memo(() => {
  return (
    <View style={styles.container}>
      {/* Top Header & Breadcrumb */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.breadcrumbTitle}>Session Schedule & Capacity</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SCR-ADMIN-004</Text>
          </View>
        </View>
        <View style={styles.breadcrumbRow}>
          <Feather name="settings" size={12} color="#64748B" />
          <Text style={styles.breadcrumbText}>
            {' '}
            Clinical Configuration / Session Schedule & Capacity
          </Text>
        </View>
      </View>

      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.mainTitle}>Session Schedule & Capacity</Text>
        <Text style={styles.subtitle}>
          SCR-ADMIN-004 · Define therapy session rounds, capacity, and block definitions
        </Text>
      </View>

      {/* Explanatory Guide Card */}
      <View style={styles.infoBannerCard}>
        <View style={styles.infoBannerIcon}>
          <Feather name="info" size={18} color="#1E40AF" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoBannerTitle}>How Scheduling & Capacity Configuration Works</Text>
          <Text style={styles.infoBannerText}>
            • <Text style={styles.boldText}>Session Schedule & Rounds:</Text> Defines the
            institutional timetable for morning and afternoon therapy blocks. Therapists utilize the
            Pre-Therapy Duration (in minutes) prior to direct student instruction for classroom
            setup and material preparation.
          </Text>
          <Text style={styles.infoBannerText}>
            • <Text style={styles.boldText}>Staff-to-Student Capacity:</Text> Establishes the
            maximum allowable student caseload assigned to a single therapist during any active
            session block to maintain clinical safety and quality of care.
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topHeader: {
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748B',
  },
  pageHeader: {
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  infoBannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  infoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
  },
});
