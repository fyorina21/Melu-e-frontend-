import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';
import { type StimulusItem, CATEGORY_COLORS, formatMMSS } from '../types';

interface StimulusItemCardProps {
  item: StimulusItem;
  onToggleTimer: (id: string) => void;
  onResetTimer: (id: string) => void;
  onUpdateFrequency: (id: string, delta: number) => void;
  onUpdateEngaged: (id: string, val: 'Engaged' | 'Did Not Engage') => void;
  onUpdateApproached: (id: string, val: 'Approached' | 'Did Not Approach') => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export const StimulusItemCard: React.FC<StimulusItemCardProps> = React.memo(
  ({
    item,
    onToggleTimer,
    onResetTimer,
    onUpdateFrequency,
    onUpdateEngaged,
    onUpdateApproached,
    onUpdateNotes,
  }) => {
    const categoryStyle = CATEGORY_COLORS[item.category] || {
      bg: '#F1F5F9',
      text: '#475569',
    };

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfoCol}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.categoryPill, { backgroundColor: categoryStyle.bg }]}>
            <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
              {item.category}
            </Text>
          </View>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>TIMER</Text>
          <Text style={styles.timerVal}>{formatMMSS(item.timerSeconds)}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.smallBtn, styles.startBtn, item.isRunning && styles.pauseBtn]}
              onPress={() => onToggleTimer(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.isRunning ? 'Pause timer' : 'Start timer'}
            >
              <Text style={styles.startBtnText}>{item.isRunning ? 'Pause' : 'Start'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, styles.resetBtn]}
              onPress={() => onResetTimer(item.id)}
              accessibilityRole="button"
              accessibilityLabel="Reset timer"
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>FREQUENCY</Text>
          <Text style={styles.freqVal}>{item.frequency}</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnMinus]}
              onPress={() => onUpdateFrequency(item.id, -1)}
              accessibilityRole="button"
              accessibilityLabel="Decrease frequency"
            >
              <Text style={styles.stepBtnText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, styles.stepBtnPlus]}
              onPress={() => onUpdateFrequency(item.id, 1)}
              accessibilityRole="button"
              accessibilityLabel="Increase frequency"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricColCompact}>
          <Text style={styles.metricLabel}>DURATION</Text>
          <Text style={styles.displayVal}>{formatMMSS(item.durationSeconds)}</Text>
        </View>

        <View style={styles.metricColCompact}>
          <Text style={styles.metricLabel}>COUNT</Text>
          <Text style={styles.displayVal}>{item.frequency}</Text>
        </View>

        <View style={styles.radioCol}>
          <Text style={styles.metricLabel}>ENGAGEMENT</Text>
          <TouchableOpacity
            style={styles.radioBtn}
            onPress={() => onUpdateEngaged(item.id, 'Engaged')}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.engaged === 'Engaged' }}
          >
            <View
              style={[styles.radioCircle, item.engaged === 'Engaged' && styles.radioCircleSelected]}
            >
              {item.engaged === 'Engaged' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>Engaged</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioBtn}
            onPress={() => onUpdateEngaged(item.id, 'Did Not Engage')}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.engaged === 'Did Not Engage' }}
          >
            <View
              style={[
                styles.radioCircle,
                item.engaged === 'Did Not Engage' && styles.radioCircleSelected,
              ]}
            >
              {item.engaged === 'Did Not Engage' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>Did Not Engage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.radioCol}>
          <Text style={styles.metricLabel}>APPROACH</Text>
          <TouchableOpacity
            style={styles.radioBtn}
            onPress={() => onUpdateApproached(item.id, 'Approached')}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.approached === 'Approached' }}
          >
            <View
              style={[
                styles.radioCircle,
                item.approached === 'Approached' && styles.radioCircleSelected,
              ]}
            >
              {item.approached === 'Approached' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>Approached</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioBtn}
            onPress={() => onUpdateApproached(item.id, 'Did Not Approach')}
            accessibilityRole="radio"
            accessibilityState={{ selected: item.approached === 'Did Not Approach' }}
          >
            <View
              style={[
                styles.radioCircle,
                item.approached === 'Did Not Approach' && styles.radioCircleSelected,
              ]}
            >
              {item.approached === 'Did Not Approach' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.radioText}>Did Not Approach</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notesCol}>
          <Text style={styles.metricLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Optional notes..."
            placeholderTextColor="#94A3B8"
            value={item.notes}
            onChangeText={(txt) => onUpdateNotes(item.id, txt)}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  itemInfoCol: {
    minWidth: 140,
    gap: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricCol: {
    alignItems: 'center',
    gap: 4,
    minWidth: 110,
  },
  metricColCompact: {
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  timerVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  freqVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  displayVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    fontVariant: ['tabular-nums'],
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  startBtn: {
    backgroundColor: '#0284C7',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  startBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: '#F1F5F9',
  },
  resetBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnMinus: {},
  stepBtnPlus: {
    backgroundColor: '#E0F2FE',
  },
  stepBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
  },
  radioCol: {
    gap: 4,
    minWidth: 120,
  },
  radioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0284C7',
  },
  radioText: {
    fontSize: 12,
    color: '#334155',
  },
  notesCol: {
    flex: 1,
    minWidth: 150,
    gap: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
});
