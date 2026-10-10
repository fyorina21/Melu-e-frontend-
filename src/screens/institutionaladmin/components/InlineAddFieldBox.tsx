import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';
import {
  FIELD_TYPES,
  SCORE_SCALE_PRESETS,
  getPresetsForForm,
  type FieldType,
} from '../formBuilderConfig';

interface InlineAddFieldBoxProps {
  section: string;
  nextId: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldOptions: string;
  fieldRequired: boolean;
  selectedForm?: string;
  onTypeChange: (type: FieldType) => void;
  onLabelChange: (label: string) => void;
  onOptionsChange: (options: string) => void;
  onRequiredChange: (required: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const InlineAddFieldBox: React.FC<InlineAddFieldBoxProps> = React.memo(
  ({
    section,
    nextId,
    fieldType,
    fieldLabel,
    fieldOptions,
    fieldRequired,
    selectedForm,
    onTypeChange,
    onLabelChange,
    onOptionsChange,
    onRequiredChange,
    onConfirm,
    onCancel,
  }) => {
    return (
      <View style={styles.inlineAddContainer}>
        <View style={styles.inlineAddHeader}>
          <Text style={styles.inlineAddTitle}>Add Item to "{section}"</Text>
          <View style={styles.nextIdBadge}>
            <Text style={styles.nextIdBadgeText}>Next ID: {nextId}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.inlineFieldLabel}>Field Type</Text>
          <View style={styles.typeSelectorRow}>
            {FIELD_TYPES.map((type) => {
              const isSelected = fieldType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeSelectPill, isSelected && styles.typeSelectPillActive]}
                  onPress={() => onTypeChange(type)}
                >
                  <Text
                    style={[
                      styles.typeSelectPillText,
                      isSelected && styles.typeSelectPillTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inlineAddRow}>
          <View style={[styles.inlineFieldCol, { flex: 2 }]}>
            <Text style={styles.inlineFieldLabel}>Label</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder={`e.g. ${nextId}: description`}
              placeholderTextColor="#94A3B8"
              value={fieldLabel}
              onChangeText={onLabelChange}
            />
          </View>
          <View style={styles.inlineToggleCol}>
            <Text style={styles.inlineFieldLabel}>Required</Text>
            <Switch
              value={fieldRequired}
              onValueChange={onRequiredChange}
              trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {(fieldType === 'Dropdown' || fieldType === 'Radio') && (
          <View style={styles.inlineOptionsRow}>
            <View style={styles.optionsHeaderRow}>
              <Text style={styles.inlineFieldLabel}>Options (comma separated)</Text>
              <View style={styles.presetScalesRow}>
                <Text style={styles.presetScaleHelper}>Presets:</Text>
                {(selectedForm ? getPresetsForForm(selectedForm) : SCORE_SCALE_PRESETS).map(
                  (preset) => (
                    <TouchableOpacity
                      key={preset.short || preset.label}
                      style={styles.presetScalePill}
                      onPress={() => onOptionsChange(preset.options.join(', '))}
                    >
                      <Text style={styles.presetScalePillText}>{preset.short || preset.label}</Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 0 — Not Demonstrated, 1 — Emerging, 2 — Mastered"
              placeholderTextColor="#94A3B8"
              value={fieldOptions}
              onChangeText={onOptionsChange}
            />
          </View>
        )}

        <View style={styles.inlineButtonRow}>
          <TouchableOpacity
            style={[styles.confirmAddBtn, !fieldLabel.trim() && styles.confirmAddBtnDisabled]}
            disabled={!fieldLabel.trim()}
            onPress={onConfirm}
          >
            <Text style={styles.confirmAddBtnText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelAddBtn} onPress={onCancel}>
            <Text style={styles.cancelAddBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  inlineAddContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: 10,
    marginHorizontal: 12,
  },
  inlineAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineAddTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextIdBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  nextIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  inlineAddRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  inlineFieldCol: {
    gap: 4,
  },
  inlineToggleCol: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  inlineFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeSelectPillActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  typeSelectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeSelectPillTextActive: {
    color: '#FFFFFF',
  },
  inlineTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  inlineOptionsRow: {
    marginBottom: 10,
    gap: 4,
  },
  optionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetScalesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetScaleHelper: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  presetScalePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetScalePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  confirmAddBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  confirmAddBtnDisabled: {
    opacity: 0.5,
  },
  confirmAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
