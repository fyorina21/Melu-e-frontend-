// src/screens/assessments/behavior/components/AbcTrackingTab.tsx

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { BEHAVIOR_PRESETS, INTENSITIES, type BehaviorRecord } from '../behaviorTypes';

interface AbcTrackingTabProps {
  records: BehaviorRecord[];
  draft: BehaviorRecord;
  editingId: string | null;
  onDraftChange: (updated: BehaviorRecord) => void;
  onSaveRecord: () => void;
  onStartEdit: (record: BehaviorRecord) => void;
  onCancelEdit: () => void;
  onRemoveRecord: (id: string) => void;
}

export const AbcTrackingTab: React.FC<AbcTrackingTabProps> = React.memo(
  ({
    records,
    draft,
    editingId,
    onDraftChange,
    onSaveRecord,
    onStartEdit,
    onCancelEdit,
    onRemoveRecord,
  }) => {
    return (
      <View style={styles.container}>
        {/* Record Form */}
        <View style={styles.card}>
          <Text style={typography.h3}>
            {editingId ? 'Edit Behavior Record (ABC)' : 'Add Behavior Record (ABC)'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BEHAVIOR_PRESETS.map((b) => {
              const isSelected = draft.behavior === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => onDraftChange({ ...draft, behavior: b })}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{b}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.field}>
            <Text style={typography.label}>Frequency</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 3 times"
              placeholderTextColor={colors.mutedText}
              value={draft.frequency}
              onChangeText={(t) => onDraftChange({ ...draft, frequency: t })}
            />
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Duration</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 5 minutes"
              placeholderTextColor={colors.mutedText}
              value={draft.duration}
              onChangeText={(t) => onDraftChange({ ...draft, duration: t })}
            />
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Intensity</Text>
            <View style={styles.ratingRow}>
              {INTENSITIES.map((i) => {
                const isActive = draft.intensity === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.ratingBtn, isActive && styles.ratingBtnActive]}
                    onPress={() => onDraftChange({ ...draft, intensity: i })}
                  >
                    <Text style={[styles.ratingText, isActive && styles.ratingTextActive]}>
                      {i}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Trigger (Antecedent)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What happened before?"
              placeholderTextColor={colors.mutedText}
              value={draft.trigger}
              onChangeText={(t) => onDraftChange({ ...draft, trigger: t })}
            />
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Consequence</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What happened after?"
              placeholderTextColor={colors.mutedText}
              value={draft.consequence}
              onChangeText={(t) => onDraftChange({ ...draft, consequence: t })}
            />
          </View>

          <View style={styles.addRow}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={onSaveRecord}
              accessibilityRole="button"
              accessibilityLabel={editingId ? 'Update Record' : 'Add Record'}
            >
              <Feather name={editingId ? 'check' : 'plus'} size={14} color={colors.navyText} />
              <Text style={styles.addBtnText}>{editingId ? 'Update Record' : 'Add Record'}</Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity
                style={[styles.addBtn, styles.cancelBtn]}
                onPress={onCancelEdit}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing record"
              >
                <Feather name="x" size={14} color={colors.navyText} />
                <Text style={styles.addBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Existing Records */}
        <Text style={typography.h3}>Records · {records.length}</Text>
        {records.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.recordHeader}>
              <Text style={typography.bodyBold}>{r.behavior}</Text>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  onPress={() => onStartEdit(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${r.behavior} record`}
                >
                  <Feather name="edit-2" size={14} color={colors.navyText} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onRemoveRecord(r.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${r.behavior} record`}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={typography.caption}>
              {r.frequency} · {r.duration} · {r.intensity} intensity
            </Text>
            {r.trigger ? <Text style={typography.body}>Trigger: {r.trigger}</Text> : null}
            {r.consequence ? (
              <Text style={typography.body}>Consequence: {r.consequence}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.xs,
    backgroundColor: colors.bgApp,
  },
  chipSelected: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  chipTextSelected: {
    color: colors.navyText,
  },
  field: {
    gap: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    backgroundColor: colors.bgApp,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  ratingBtnActive: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellow,
  },
  ratingText: {
    fontSize: 12,
    color: colors.bodyText,
  },
  ratingTextActive: {
    color: colors.navyText,
    fontWeight: '700',
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  cancelBtn: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
});
