// screens/session/components/PromptEntryRow.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../theme/colors';
import { getPromptLevels } from '../../../stores/promptLevelsStore';

interface PromptEntryRowProps {
  disabled: boolean;
  onSelect: (level: string) => void;
}

export default function PromptEntryRow({ disabled, onSelect }: PromptEntryRowProps) {
  const levels = getPromptLevels()
    .filter((lv) => lv.status === 'Active')
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <View style={styles.row}>
      {levels.map((lv) => {
        const key = lv.name === '+' ? 'INDEPENDENT' : lv.name;
        return (
          <TouchableOpacity
            key={lv.id}
            disabled={disabled}
            onPress={() => onSelect(key)}
            style={[
              styles.btn,
              { backgroundColor: lv.color, opacity: disabled ? 0.4 : 1 },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>{lv.name}</Text>
          </TouchableOpacity>
        );
      })}
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
    color: colors.white,
  },
});