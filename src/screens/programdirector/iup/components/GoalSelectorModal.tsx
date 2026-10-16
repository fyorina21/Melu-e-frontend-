import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { GoalBankItem, StationKey } from '../types';

interface GoalSelectorModalProps {
  selectorTarget: { station: StationKey; slotIndex: number } | null;
  goalSearch: string;
  domainFilter: string;
  filteredGoals: GoalBankItem[];
  onCloseGoalSelector: () => void;
  onGoalSearchChange: (text: string) => void;
  onDomainFilterChange: (domain: string) => void;
  onSelectGoal: (goal: GoalBankItem) => void;
}

const DOMAINS = ['All', 'Communication', 'Motor', 'Social', 'Self-Help', 'Cognition'];

export function GoalSelectorModal({
  selectorTarget,
  goalSearch,
  domainFilter,
  filteredGoals,
  onCloseGoalSelector,
  onGoalSearchChange,
  onDomainFilterChange,
  onSelectGoal,
}: GoalSelectorModalProps) {
  return (
    <Modal
      visible={!!selectorTarget}
      animationType="slide"
      transparent
      onRequestClose={onCloseGoalSelector}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Goal Bank Selection</Text>
              <Text style={styles.modalSub}>
                Assigning to{' '}
                {selectorTarget?.station === 'station1'
                  ? 'Station 1 (Basic)'
                  : 'Station 2 (Advanced)'}{' '}
                · Slot {(selectorTarget?.slotIndex ?? 0) + 1}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCloseGoalSelector}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close goal selector"
            >
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {/* Search and Domain Filters */}
          <View style={styles.modalSearchRow}>
            <Feather name="search" size={14} color={colors.mutedText} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search goals by name or skill area..."
              placeholderTextColor={colors.mutedText}
              value={goalSearch}
              onChangeText={onGoalSearchChange}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {DOMAINS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.domainFilterChip,
                  domainFilter === d && styles.domainFilterChipActive,
                ]}
                onPress={() => onDomainFilterChange(d)}
                accessibilityRole="radio"
                accessibilityState={{ selected: domainFilter === d }}
              >
                <Text
                  style={[
                    styles.domainFilterText,
                    domainFilter === d && styles.domainFilterTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Goal Bank List */}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {filteredGoals.length === 0 ? (
              <View style={styles.modalEmptyWrap}>
                <Text style={styles.modalEmptyText}>No active goals match the search</Text>
              </View>
            ) : (
              filteredGoals.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={styles.modalGoalItem}
                  onPress={() => onSelectGoal(g)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select goal ${g.name}`}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalNameRow}>
                      <Text style={styles.modalGoalName}>{g.name}</Text>
                      <View style={styles.domainChip}>
                        <Text style={styles.domainChipText}>{g.domain}</Text>
                      </View>
                    </View>
                    <Text style={styles.modalGoalDesc} numberOfLines={2}>
                      {g.description}
                    </Text>
                    <Text style={styles.modalGoalMastery}>Target Mastery: {g.masteryCriteria}</Text>
                  </View>
                  <Feather name="plus-circle" size={18} color={colors.navyText} />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navyText,
  },
  modalSub: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  modalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    fontSize: 13,
    color: colors.navyText,
    flex: 1,
  },
  chipScroll: {
    maxHeight: 36,
    marginBottom: 12,
  },
  domainFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  domainFilterChipActive: {
    backgroundColor: '#FEF08A',
  },
  domainFilterText: {
    fontSize: 12,
    color: colors.bodyText,
    fontWeight: '600',
  },
  domainFilterTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  modalGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  goalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalGoalName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  domainChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  domainChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  modalGoalDesc: {
    fontSize: 12,
    color: colors.bodyText,
    marginTop: 2,
  },
  modalGoalMastery: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  modalEmptyWrap: {
    padding: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
});
