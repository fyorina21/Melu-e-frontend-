// src/screens/director/progress/components/DirectorInternalNotesCard.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface DirectorInternalNotesCardProps {
  notes: string;
  notesSaved: boolean;
  onNotesChange: (text: string) => void;
  onSaveNotes: () => void;
}

export const DirectorInternalNotesCard: React.FC<DirectorInternalNotesCardProps> = React.memo(
  ({ notes, notesSaved, onNotesChange, onSaveNotes }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Director Notes & Instructions</Text>
          {notesSaved && (
            <Text style={styles.savedNoteText}>
              <Feather name="check" size={12} color={colors.successGreen} /> Saved
            </Text>
          )}
        </View>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Add timestamped clinical supervisory notes..."
          placeholderTextColor={colors.mutedText}
          value={notes}
          onChangeText={onNotesChange}
        />
        <TouchableOpacity
          style={styles.saveNoteBtn}
          onPress={onSaveNotes}
          accessibilityRole="button"
          accessibilityLabel="Save Notes"
        >
          <Feather name="save" size={14} color={colors.navyText} />
          <Text style={styles.saveNoteBtnText}>Save Notes</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  savedNoteText: {
    fontSize: 11,
    color: colors.successGreen,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bgApp,
    textAlignVertical: 'top',
    color: colors.navyText,
    fontSize: 13,
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  saveNoteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
