import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { radius, spacing } from '../../../theme/colors';

interface TeacherNotesCardProps {
  notes: string;
  onNotesChange: (val: string) => void;
  isDraft: boolean;
  onSaveDraft: () => void;
  onResubmit?: () => void;
  onSubmit: () => void;
}

export const TeacherNotesCard: React.FC<TeacherNotesCardProps> = React.memo(
  ({ notes, onNotesChange, isDraft, onSaveDraft, onResubmit, onSubmit }) => {
    const isValid = notes.trim().length > 0;

    return (
      <View style={styles.container}>
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>
            Teacher Notes <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Summarize the session, student progress, any concerns, or recommendations..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={onNotesChange}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={onSaveDraft}
            accessibilityRole="button"
            accessibilityLabel="Save draft notes"
          >
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>

          {isDraft && onResubmit && (
            <TouchableOpacity
              style={[styles.submitBtn, styles.resubmitBtn]}
              onPress={onResubmit}
              accessibilityRole="button"
              accessibilityLabel="Resubmit session note"
            >
              <Text style={styles.submitBtnText}>Resubmit</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            disabled={!isValid}
            onPress={onSubmit}
            accessibilityRole="button"
            accessibilityLabel="Submit and end session"
          >
            <Text style={styles.submitBtnText}>Submit & End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.sm,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  requiredAsterisk: {
    color: '#EF4444',
  },
  textArea: {
    minHeight: 100,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  saveDraftBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    minWidth: 180,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resubmitBtn: {
    backgroundColor: '#F59E0B',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
