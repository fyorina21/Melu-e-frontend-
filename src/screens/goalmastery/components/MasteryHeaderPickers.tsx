import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../../theme/colors';
import type { StudentOption } from '../../../api/optionsApi';
import type { GoalOption } from '../types';

interface MasteryHeaderPickersProps {
  studentOptions: StudentOption[];
  goalOptions: GoalOption[];
  activeStudentId: string;
  activeGoalId: string;
  defaultStudentName: string;
  defaultGoalName: string;
  studentDropdownOpen: boolean;
  goalDropdownOpen: boolean;
  onToggleStudentDropdown: () => void;
  onToggleGoalDropdown: () => void;
  onSelectStudent: (id: string) => void;
  onSelectGoal: (id: string) => void;
}

export const MasteryHeaderPickers: React.FC<MasteryHeaderPickersProps> = React.memo(
  ({
    studentOptions,
    goalOptions,
    activeStudentId,
    activeGoalId,
    defaultStudentName,
    defaultGoalName,
    studentDropdownOpen,
    goalDropdownOpen,
    onToggleStudentDropdown,
    onToggleGoalDropdown,
    onSelectStudent,
    onSelectGoal,
  }) => {
    return (
      <View style={styles.headerPickersRow}>
        {/* Student Selector */}
        {studentOptions.length > 1 && (
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={onToggleStudentDropdown}
              accessibilityRole="button"
              accessibilityLabel="Select student"
            >
              <Feather name="user" size={14} color="#0284C7" />
              <Text style={styles.pickerBtnText} numberOfLines={1}>
                {studentOptions.find((s) => s.id === activeStudentId)?.name || defaultStudentName}
              </Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
            {studentDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {studentOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.dropdownItem,
                      opt.id === activeStudentId && styles.dropdownItemSelected,
                    ]}
                    onPress={() => onSelectStudent(opt.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        opt.id === activeStudentId && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Goal Selector */}
        {goalOptions.length > 1 && (
          <View style={styles.pickerContainer}>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={onToggleGoalDropdown}
              accessibilityRole="button"
              accessibilityLabel="Select goal"
            >
              <Feather name="target" size={14} color="#0284C7" />
              <Text style={styles.pickerBtnText} numberOfLines={1}>
                {goalOptions.find((g) => g.id === activeGoalId)?.name || defaultGoalName}
              </Text>
              <Feather name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
            {goalDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {goalOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.dropdownItem,
                      opt.id === activeGoalId && styles.dropdownItemSelected,
                    ]}
                    onPress={() => onSelectGoal(opt.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        opt.id === activeGoalId && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerPickersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pickerContainer: {
    position: 'relative',
    zIndex: 100,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 180,
  },
  pickerBtnText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    flexShrink: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    marginTop: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 200,
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
  dropdownItemTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
