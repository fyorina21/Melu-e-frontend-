import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface GoalDomainsSectionSwitcherProps {
  activeSection: 'domains' | 'goals' | 'templates';
  domainsCount: number;
  goalsCount?: number;
  templatesCount?: number;
  onSelectSection: (section: 'domains' | 'goals') => void;
}

export function GoalDomainsSectionSwitcher({
  activeSection,
  domainsCount,
  goalsCount = 0,
  onSelectSection,
}: GoalDomainsSectionSwitcherProps) {
  return (
    <View style={styles.switcherContainer}>
      <TouchableOpacity
        style={[styles.switcherBtn, activeSection === 'domains' && styles.switcherBtnActive]}
        onPress={() => onSelectSection('domains')}
        accessibilityRole="button"
        accessibilityState={{ selected: activeSection === 'domains' }}
      >
        <Feather
          name="target"
          size={15}
          color={activeSection === 'domains' ? colors.navyText : colors.bodyText}
        />
        <Text
          style={[
            styles.switcherBtnText,
            activeSection === 'domains' && styles.switcherBtnTextActive,
          ]}
        >
          Goal Domains ({domainsCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.switcherBtn, activeSection === 'goals' && styles.switcherBtnActive]}
        onPress={() => onSelectSection('goals')}
        accessibilityRole="button"
        accessibilityState={{ selected: activeSection === 'goals' }}
      >
        <Feather
          name="flag"
          size={15}
          color={activeSection === 'goals' ? colors.navyText : colors.bodyText}
        />
        <Text
          style={[
            styles.switcherBtnText,
            activeSection === 'goals' && styles.switcherBtnTextActive,
          ]}
        >
          Target Goals ({goalsCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  switcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  switcherBtnActive: {
    backgroundColor: colors.primaryYellow,
  },
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.bodyText,
  },
  switcherBtnTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
