import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StudentAvatar from '../../../../components/StudentAvatar';
import { type AbllsDomainDef, type StudentProfile, calculateDomainProgress } from '../types';

interface AbllsHeaderProps {
  onBack: () => void;
  profile: StudentProfile | null;
  studentId?: string;
  photoUrl?: string | null;
  domains: AbllsDomainDef[];
  activeDomain: number;
  onSelectDomain: (index: number) => void;
  domainAnswered: number;
  domainTotalItems: number;
}

export const AbllsHeader: React.FC<AbllsHeaderProps> = React.memo(
  ({
    onBack,
    profile,
    studentId,
    photoUrl,
    domains,
    activeDomain,
    onSelectDomain,
    domainAnswered,
    domainTotalItems,
  }) => {
    const studentName = profile?.fullName || 'Student A';
    const domain = domains[activeDomain] || domains[0];
    const domainProgress = calculateDomainProgress(domainAnswered, domainTotalItems);

    return (
      <View style={styles.headerContainer}>
        {/* Top Navigation Row */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABLLS-R Assessment</Text>
        </View>

        {/* Student Profile Row */}
        <View style={styles.studentRow}>
          <StudentAvatar name={studentName} studentId={studentId} photoUrl={photoUrl} size={40} />
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{studentName}</Text>
              <Text style={styles.studentAge}>Age {profile?.age ?? '—'}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>In Assessment</Text>
              </View>
            </View>
            <Text style={styles.stationText}>Station A</Text>
          </View>
        </View>

        {/* Domain Tabs Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {domains.map((d, idx) => (
            <TouchableOpacity
              key={d.name}
              style={[styles.tab, activeDomain === idx && styles.tabActive]}
              onPress={() => onSelectDomain(idx)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeDomain === idx }}
              accessibilityLabel={`Domain ${d.name}`}
            >
              <Text style={[styles.tabText, activeDomain === idx && styles.tabTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Domain Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${domainProgress}%` }]} />
          </View>
          <Text style={styles.progressPercentage}>{domainProgress}%</Text>
        </View>
        <Text style={styles.progressSubtext}>
          {domainAnswered} of {domainTotalItems} items scored in {domain?.name ?? ''}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    paddingLeft: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  studentInfo: {
    gap: 2,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentAge: {
    fontSize: 13,
    color: '#64748B',
  },
  statusPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  stationText: {
    fontSize: 12,
    color: '#64748B',
  },
  tabsScroll: {
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 20,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0EA5E9',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0EA5E9',
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#64748B',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
});
