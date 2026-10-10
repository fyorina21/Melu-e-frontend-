// src/screens/coordinator/components/InternalNotesCard.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';

interface InternalNotesCardProps {
  notes: string;
  notesSaved: boolean;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

export default function InternalNotesCard({
  notes,
  notesSaved,
  onNotesChange,
  onSaveNotes,
}: InternalNotesCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.notesHeaderRow}>
        <Feather name="file-text" size={16} color={colors.primaryYellowDark} />
        <Text style={styles.cardTitle}>Internal Notes</Text>
        <View style={styles.grayChip}>
          <Text style={styles.grayChipText}>Coordinator only</Text>
        </View>
      </View>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Add internal coordinator notes here (not visible to teachers)..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        style={styles.notesInput}
        textAlignVertical="top"
        accessibilityLabel="Internal coordinator notes"
      />
      <View style={styles.notesFooterRow}>
        {notesSaved && (
          <View style={styles.savedRow}>
            <Feather name="check-circle" size={14} color="#16A34A" />
            <Text style={styles.savedText}>Notes saved</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSaveNotes}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save coordinator notes"
        >
          <Feather name="save" size={16} color={colors.navyText} />
          <Text style={styles.saveButtonText}>Save Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
  },
  grayChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  grayChipText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.bodyText,
    minHeight: 90,
  },
  notesFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
