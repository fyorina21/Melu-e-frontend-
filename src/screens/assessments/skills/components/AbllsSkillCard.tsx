import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { getItemScoreOptions, type Score, type AbllsItemDef } from '../../abllsConfigHelper';

interface AbllsSkillCardProps {
  item: AbllsItemDef;
  score: Score | undefined;
  onSelectScore: (score: Score) => void;
  note: string;
  onNoteChange: (text: string) => void;
}

export const AbllsSkillCard: React.FC<AbllsSkillCardProps> = React.memo(
  ({ item, score, onSelectScore, note, onNoteChange }) => {
    const scoreOptions = getItemScoreOptions(item);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemTitleRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.id}</Text>
          </View>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>

        {/* Score Selector Options */}
        <View style={styles.scoreRow}>
          {scoreOptions.map((opt) => {
            const s = opt.score;
            const selected = score === s;
            const color = opt.color;

            return (
              <TouchableOpacity
                key={`${item.id}-${opt.label}`}
                style={[
                  styles.scoreBtn,
                  { borderColor: color },
                  selected && { backgroundColor: color },
                ]}
                onPress={() => onSelectScore(s)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Score ${opt.label} for ${item.id}`}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.scoreBtnText,
                    { color: selected ? '#FFFFFF' : color },
                    selected && styles.scoreBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes Input */}
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes..."
          placeholderTextColor="#94A3B8"
          value={note}
          onChangeText={onNoteChange}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#38BDF8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  itemDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    minWidth: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  scoreBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scoreBtnTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
});
