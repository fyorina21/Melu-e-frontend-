// screens/session/components/PromptEntryRow.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';

const PROMPT_LEVELS: { key: string; label: string; color: string }[] = [
  { key: 'FP', label: 'FP', color: colors.promptFP },
  { key: 'PP', label: 'PP', color: colors.promptPP },
  { key: 'G', label: 'G', color: colors.promptG },
  { key: 'INDEPENDENT', label: '+', color: colors.promptIndependent },
];

interface PromptEntryRowProps {
  disabled: boolean;
  onSelect: (level: string) => void;
}

export default function PromptEntryRow({ disabled, onSelect }: PromptEntryRowProps) {
  return (
    <View style={styles.row}>
      {PROMPT_LEVELS.map((p) => (
        <TouchableOpacity
          key={p.key}
          disabled={disabled}
          onPress={() => onSelect(p.key)}
          style={[
            styles.btn,
            { backgroundColor: p.color, opacity: disabled ? 0.4 : 1 },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>{p.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
});
