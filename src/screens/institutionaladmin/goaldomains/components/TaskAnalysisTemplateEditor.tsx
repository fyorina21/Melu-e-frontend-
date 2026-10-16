import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { TaskAnalysisStep } from '../types';

interface TaskAnalysisTemplateEditorProps {
  isEditing: boolean;
  formName: string;
  formDesc: string;
  formSteps: TaskAnalysisStep[];
  perStepMastery: string;
  overallMastery: string;
  onFormNameChange: (val: string) => void;
  onFormDescChange: (val: string) => void;
  onPerStepMasteryChange: (val: string) => void;
  onOverallMasteryChange: (val: string) => void;
  onAddStep: () => void;
  onUpdateStepDesc: (id: string, desc: string) => void;
  onDeleteStep: (id: string) => void;
  onMoveStep: (index: number, direction: 'up' | 'down') => void;
  onSave: () => void;
  onCancel: () => void;
}

export const TaskAnalysisTemplateEditor: React.FC<TaskAnalysisTemplateEditorProps> = React.memo(
  ({
    isEditing,
    formName,
    formDesc,
    formSteps,
    perStepMastery,
    overallMastery,
    onFormNameChange,
    onFormDescChange,
    onPerStepMasteryChange,
    onOverallMasteryChange,
    onAddStep,
    onUpdateStepDesc,
    onDeleteStep,
    onMoveStep,
    onSave,
    onCancel,
  }) => {
    return (
      <View style={styles.editorCard}>
        <Text style={styles.editorTitle}>
          {isEditing ? 'Edit Task Analysis Template' : 'New Task Analysis Template'}
        </Text>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.inputLabel}>Template Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Hand Washing Routine"
              placeholderTextColor={colors.mutedText}
              value={formName}
              onChangeText={onFormNameChange}
            />
          </View>
          <View style={[styles.formCol, { flex: 1.5 }]}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Clinical description or protocol notes..."
              placeholderTextColor={colors.mutedText}
              value={formDesc}
              onChangeText={onFormDescChange}
            />
          </View>
        </View>

        {/* Steps Section */}
        <View style={styles.stepsSection}>
          <Text style={styles.inputLabel}>Sequential Steps</Text>
          {formSteps.map((step, index) => (
            <View key={step.id} style={styles.stepInputRow}>
              <Text style={styles.stepNumberPrefix}>{index + 1}.</Text>
              <TextInput
                style={styles.stepTextInput}
                placeholder={`Step ${index + 1} description...`}
                placeholderTextColor={colors.mutedText}
                value={step.description}
                onChangeText={(v) => onUpdateStepDesc(step.id, v)}
              />
              <View style={styles.stepActionsRow}>
                <TouchableOpacity
                  onPress={() => onMoveStep(index, 'up')}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Move step ${index + 1} up`}
                >
                  <Feather
                    name="arrow-up"
                    size={14}
                    color={index === 0 ? '#CBD5E1' : colors.navyText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onMoveStep(index, 'down')}
                  disabled={index === formSteps.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel={`Move step ${index + 1} down`}
                >
                  <Feather
                    name="arrow-down"
                    size={14}
                    color={index === formSteps.length - 1 ? '#CBD5E1' : colors.navyText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onDeleteStep(step.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete step ${index + 1}`}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addStepBtn}
            onPress={onAddStep}
            accessibilityRole="button"
            accessibilityLabel="Add Step"
          >
            <Feather name="plus" size={14} color={colors.navyText} />
            <Text style={styles.addStepBtnText}>Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* Mastery Criteria */}
        <View style={styles.formRow}>
          <View style={{ width: 150 }}>
            <Text style={styles.inputLabel}>Per-Step Mastery %</Text>
            <TextInput
              style={styles.textInput}
              value={perStepMastery}
              onChangeText={onPerStepMasteryChange}
              keyboardType="number-pad"
            />
          </View>
          <View style={{ width: 150 }}>
            <Text style={styles.inputLabel}>Overall Mastery %</Text>
            <TextInput
              style={styles.textInput}
              value={overallMastery}
              onChangeText={onOverallMasteryChange}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Editor Action Buttons */}
        <View style={styles.editorActionsRow}>
          <TouchableOpacity
            style={styles.saveTemplateBtn}
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save Template"
          >
            <Feather name="save" size={14} color={colors.navyText} />
            <Text style={styles.saveTemplateBtnText}>Save Template</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing template"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  editorCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  formCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  textInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  stepsSection: {
    gap: spacing.sm,
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepNumberPrefix: {
    fontSize: 13,
    color: colors.bodyText,
    width: 20,
    fontWeight: '700',
  },
  stepTextInput: {
    flex: 1,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  stepActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 4,
  },
  addStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: 4,
  },
  addStepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  editorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  saveTemplateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
});
