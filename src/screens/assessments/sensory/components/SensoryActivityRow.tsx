import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import {
  type SensoryActivityItem,
  type EngagementLevel,
  type ResponseReaction,
  ENGAGEMENT_OPTIONS,
  REACTION_OPTIONS,
} from '../types';

interface SensoryActivityRowProps {
  item: SensoryActivityItem;
  index: number;
  totalCount: number;
  activePicker: { id: string; field: 'engagement' | 'reaction' } | null;
  onTogglePicker: (id: string, field: 'engagement' | 'reaction') => void;
  onClosePicker: () => void;
  onUpdateActivity: (id: string, updates: Partial<SensoryActivityItem>) => void;
}

export const SensoryActivityRow: React.FC<SensoryActivityRowProps> = React.memo(
  ({ item, index, totalCount, activePicker, onTogglePicker, onClosePicker, onUpdateActivity }) => {
    const isEngagementOpen = activePicker?.id === item.id && activePicker.field === 'engagement';
    const isReactionOpen = activePicker?.id === item.id && activePicker.field === 'reaction';
    const isAnyOpen = isEngagementOpen || isReactionOpen;

    return (
      <View
        style={[
          styles.tableRow,
          index % 2 === 1 && styles.tableRowAlt,
          { zIndex: isAnyOpen ? 500 : totalCount - index },
        ]}
      >
        <Text style={[styles.tdText, styles.colId, styles.idHighlight]}>{item.id}</Text>
        <Text style={[styles.tdText, styles.colActivity, styles.activityName]}>{item.name}</Text>

        {/* Engagement Level Dropdown */}
        <View style={[styles.colDropdown, { zIndex: isEngagementOpen ? 1000 : 1 }]}>
          <TouchableOpacity
            style={[styles.dropdownTrigger, isEngagementOpen && styles.dropdownTriggerActive]}
            onPress={() => onTogglePicker(item.id, 'engagement')}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} engagement level`}
          >
            <Text style={styles.dropdownTriggerText}>{item.engagementLevel || '-- Select --'}</Text>
            <Feather name="chevron-down" size={14} color="#0F172A" />
          </TouchableOpacity>

          {isEngagementOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownOptionSelected}
                onPress={() => {
                  onUpdateActivity(item.id, { engagementLevel: undefined });
                  onClosePicker();
                }}
              >
                <Text style={styles.dropdownOptionTextSelected}>-- Select --</Text>
              </TouchableOpacity>
              {ENGAGEMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownOption}
                  onPress={() => {
                    onUpdateActivity(item.id, { engagementLevel: opt });
                    onClosePicker();
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Response / Reaction Dropdown */}
        <View style={[styles.colDropdown, { zIndex: isReactionOpen ? 1000 : 1 }]}>
          <TouchableOpacity
            style={[styles.dropdownTrigger, isReactionOpen && styles.dropdownTriggerActive]}
            onPress={() => onTogglePicker(item.id, 'reaction')}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} response reaction`}
          >
            <Text style={styles.dropdownTriggerText}>
              {item.responseReaction || '-- Select --'}
            </Text>
            <Feather name="chevron-down" size={14} color="#0F172A" />
          </TouchableOpacity>

          {isReactionOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownOptionSelected}
                onPress={() => {
                  onUpdateActivity(item.id, { responseReaction: undefined });
                  onClosePicker();
                }}
              >
                <Text style={styles.dropdownOptionTextSelected}>-- Select --</Text>
              </TouchableOpacity>
              {REACTION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.dropdownOption}
                  onPress={() => {
                    onUpdateActivity(item.id, { responseReaction: opt });
                    onClosePicker();
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Remark TextInput */}
        <View style={styles.colRemark}>
          <TextInput
            style={styles.remarkInput}
            placeholder="Optional note..."
            placeholderTextColor="#94A3B8"
            value={item.remark}
            onChangeText={(txt) => onUpdateActivity(item.id, { remark: txt })}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tdText: {
    fontSize: 13,
    color: '#334155',
  },
  colId: {
    width: 80,
  },
  idHighlight: {
    fontWeight: '700',
    color: '#0284C7',
  },
  colActivity: {
    flex: 2,
    minWidth: 140,
    paddingRight: 8,
  },
  activityName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  colDropdown: {
    flex: 2,
    minWidth: 150,
    paddingRight: 8,
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dropdownTriggerActive: {
    borderColor: '#0284C7',
  },
  dropdownTriggerText: {
    fontSize: 12,
    color: '#0F172A',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionSelected: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  colRemark: {
    flex: 2,
    minWidth: 140,
  },
  remarkInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
  },
});
