// src/screens/institutionaladmin/components/AbllsPresetBar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../../theme/colors';
import { SCORE_SCALE_PRESETS } from '../formBuilderConfig';

interface AbllsPresetBarProps {
  onApplyPreset: (options: string[]) => void;
}

export default function AbllsPresetBar({ onApplyPreset }: AbllsPresetBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="sliders" size={14} color="#0369A1" />
        <Text style={styles.title}>Apply Scoring Scale Preset to All ABLLS Skill Items:</Text>
      </View>
      <View style={styles.buttonsRow}>
        {SCORE_SCALE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={styles.presetBtn}
            onPress={() => onApplyPreset(preset.options)}
            accessibilityRole="button"
            accessibilityLabel={`Apply preset ${preset.short}`}
          >
            <Text style={styles.presetBtnText}>{preset.short}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
});
