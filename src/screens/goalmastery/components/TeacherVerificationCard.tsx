import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import {
  type OutcomeOption,
  type PromptType,
  type VerificationTeacher,
  OUTCOME_OPTIONS,
  PROMPT_OPTIONS,
} from '../types';

interface TeacherVerificationCardProps {
  teacher: VerificationTeacher;
  outcome: OutcomeOption | null;
  prompt: PromptType;
  notes: string;
  showPromptDropdown: boolean;
  isSubmitted: boolean;
  isLocked?: boolean;
  onOutcomeChange: (outcome: OutcomeOption) => void;
  onPromptChange: (prompt: PromptType) => void;
  onNotesChange: (notes: string) => void;
  onTogglePromptDropdown: () => void;
}

export const TeacherVerificationCard: React.FC<TeacherVerificationCardProps> = React.memo(
  ({
    teacher,
    outcome,
    prompt,
    notes,
    showPromptDropdown,
    isSubmitted,
    isLocked = false,
    onOutcomeChange,
    onPromptChange,
    onNotesChange,
    onTogglePromptDropdown,
  }) => {
    const isCardDisabled = isSubmitted || isLocked;
    return (
      <View style={styles.columnCard}>
        <View style={styles.standardCardHeader}>
          <Text style={styles.standardCardTitle}>{teacher.name} Verification</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.teacherNameRow}>
            <Feather name="user" size={16} color="#64748B" />
            <Text style={styles.teacherNameText}>{teacher.name}</Text>
          </View>

          <Text style={styles.fieldLabel}>
            Outcome <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.radioGroup}>
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  disabled={isCardDisabled}
                  style={styles.radioOption}
                  onPress={() => onOutcomeChange(opt.id)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text style={styles.radioLabel}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {outcome === 'failed' && (
            <View style={styles.dropdownContainer}>
              <Text style={styles.fieldLabel}>
                Prompt Used <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                disabled={isCardDisabled}
                style={styles.selectBox}
                onPress={onTogglePromptDropdown}
                accessibilityRole="button"
                accessibilityLabel="Select prompt used"
              >
                <Text style={[styles.selectText, !prompt && styles.placeholderText]}>
                  {prompt || 'Select prompt'}
                </Text>
                <Feather name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              {showPromptDropdown && !isCardDisabled && (
                <View style={styles.dropdownMenu}>
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => onPromptChange('')}>
                    <Text style={styles.dropdownItemTextPlaceholder}>Select prompt</Text>
                  </TouchableOpacity>
                  {PROMPT_OPTIONS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.dropdownItem, prompt === p && styles.dropdownItemSelected]}
                      onPress={() => onPromptChange(p)}
                    >
                      <Text style={styles.dropdownItemText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={styles.textInput}
            multiline
            editable={!isCardDisabled}
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Enter verification notes..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.cardFooterDate}>Date: {teacher.date}</Text>
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
  standardCardHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  standardCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 4,
  },
  required: {
    color: '#EF4444',
  },
  radioGroup: {
    gap: 8,
    marginVertical: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  radioLabel: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  selectText: {
    fontSize: 12,
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
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
    zIndex: 20,
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#0F172A',
  },
  dropdownItemTextPlaceholder: {
    fontSize: 12,
    color: '#94A3B8',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  cardFooterDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
});
