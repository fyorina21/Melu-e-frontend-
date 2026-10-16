import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface GoalDomainsSectionSwitcherProps {
  activeSection: 'domains' | 'templates';
  domainsCount: number;
  templatesCount: number;
  onSelectSection: (section: 'domains' | 'templates') => void;
}

export function GoalDomainsSectionSwitcher({
  activeSection,
  domainsCount,
  templatesCount,
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
        style={[styles.switcherBtn, activeSection === 'templates' && styles.switcherBtnActive]}
        onPress={() => onSelectSection('templates')}
        accessibilityRole="button"
        accessibilityState={{ selected: activeSection === 'templates' }}
      >
        <Feather
          name="list"
          size={15}
          color={activeSection === 'templates' ? colors.navyText : colors.bodyText}
        />
        <Text
          style={[
            styles.switcherBtnText,
            activeSection === 'templates' && styles.switcherBtnTextActive,
          ]}
        >
          Task Analysis Templates ({templatesCount})
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
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
  },
  switcherBtnActive: {
    backgroundColor: colors.primaryYellow,
  },
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  switcherBtnTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
});
