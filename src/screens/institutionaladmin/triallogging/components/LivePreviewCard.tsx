import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { type LevelItem, sortPromptLevels } from '../types';

interface LivePreviewCardProps {
  levels: LevelItem[];
}

export const LivePreviewCard: React.FC<LivePreviewCardProps> = React.memo(({ levels }) => {
  const sorted = sortPromptLevels(levels);

  return (
    <View style={styles.previewContainer}>
      <Text style={styles.previewLabel}>Live Preview</Text>
      <View style={styles.previewButtons}>
        {sorted.map((lv) => (
          <TouchableOpacity
            key={lv.id}
            style={[styles.previewBtn, { backgroundColor: lv.color }]}
            accessibilityRole="button"
            accessibilityLabel={`Preview prompt level ${lv.name}`}
          >
            <Text style={styles.previewBtnText}>{lv.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  previewContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  previewButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
