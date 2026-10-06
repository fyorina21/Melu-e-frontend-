import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { IupCandidate, IupContext } from '../types';

interface StudentSelectorCardProps {
  selectedCandidate: IupCandidate | null;
  selectedStudentId: string | null;
  context: IupContext | null;
  studentDropdownOpen: boolean;
  searchStudentText: string;
  filteredCandidates: IupCandidate[];
  lastSavedTimestamp: string | null;
  onToggleDropdown: () => void;
  onSearchStudent: (text: string) => void;
  onSelectStudent: (id: string) => void;
}

export function StudentSelectorCard({
  selectedCandidate,
  selectedStudentId,
  context,
  studentDropdownOpen,
  searchStudentText,
  filteredCandidates,
  lastSavedTimestamp,
  onToggleDropdown,
  onSearchStudent,
  onSelectStudent,
}: StudentSelectorCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.selectorHeaderRow}>
        <Text style={styles.sectionLabel}>SELECT STUDENT</Text>
        {lastSavedTimestamp && (
          <Text style={styles.lastSavedText}>
            <Feather name="check" size={11} color={colors.successGreen} /> Draft saved at{' '}
            {lastSavedTimestamp}
          </Text>
        )}
      </View>

      <View style={styles.dropdownTriggerRow}>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={onToggleDropdown}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownTriggerLeft}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>
                {(selectedCandidate?.name || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.dropdownSelectedName}>
                {selectedCandidate ? selectedCandidate.name : 'Choose a student...'}
              </Text>
              <Text style={styles.dropdownSelectedMeta}>
                {selectedCandidate
                  ? `${selectedCandidate.assessmentStatus ?? selectedCandidate.status} · ${context?.program || 'Therapy'}`
                  : 'Click to select from enrollment caseload'}
              </Text>
            </View>
          </View>
          <Feather
            name={studentDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.bodyText}
          />
        </TouchableOpacity>
      </View>

      {studentDropdownOpen && (
        <View style={styles.dropdownMenu}>
          <View style={styles.dropdownSearchWrap}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.dropdownSearchInput}
              placeholder="Search students by name..."
              placeholderTextColor={colors.mutedText}
              value={searchStudentText}
              onChangeText={onSearchStudent}
            />
          </View>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
            {filteredCandidates.length === 0 ? (
              <Text style={styles.dropdownEmptyText}>No students ready for IUP</Text>
            ) : (
              filteredCandidates.map((c) => {
                const isSelected = c.id === selectedStudentId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => onSelectStudent(c.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                      <Text style={styles.dropdownItemSub}>
                        {c.assessmentStatus ?? c.status} · {c.program || 'ABA Therapy'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        c.status === 'Active' ? styles.statusActive : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          c.status === 'Active'
                            ? styles.statusActiveText
                            : styles.statusPendingText,
                        ]}
                      >
                        {c.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  selectorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  lastSavedText: {
    fontSize: 12,
    color: colors.successGreen,
    fontWeight: '600',
  },
  dropdownTriggerRow: {
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownSelectedName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  dropdownSelectedMeta: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 1,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  dropdownSearchInput: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9C3',
    borderRadius: radius.xs ?? radius.sm,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  dropdownEmptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
