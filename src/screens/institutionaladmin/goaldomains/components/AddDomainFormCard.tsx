import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface AddDomainFormCardProps {
  visible: boolean;
  name: string;
  description: string;
  onNameChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onOpen: () => void;
}

export const AddDomainFormCard: React.FC<AddDomainFormCardProps> = React.memo(
  ({
    visible,
    name,
    description,
    onNameChange,
    onDescriptionChange,
    onConfirm,
    onCancel,
    onOpen,
  }) => {
    if (!visible) {
      return (
        <TouchableOpacity
          style={styles.addDomainLinkBtn}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Add Goal Domain"
        >
          <Feather name="plus" size={16} color={colors.navyText} />
          <Text style={styles.addDomainLinkText}>Add Goal Domain</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.addFormCard}>
        <Text style={styles.addFormTitle}>Add New Goal Domain</Text>
        <View style={styles.addFormFieldsRow}>
          <View style={styles.addFormFieldCol}>
            <Text style={styles.addFormLabel}>Domain Name</Text>
            <TextInput
              style={styles.addFormInput}
              placeholder="e.g. Self-Help Skills"
              placeholderTextColor={colors.mutedText}
              value={name}
              onChangeText={onNameChange}
            />
          </View>
          <View style={[styles.addFormFieldCol, { flex: 2 }]}>
            <Text style={styles.addFormLabel}>Description</Text>
            <TextInput
              style={styles.addFormInput}
              placeholder="Brief clinical description..."
              placeholderTextColor={colors.mutedText}
              value={description}
              onChangeText={onDescriptionChange}
            />
          </View>
        </View>
        <View style={styles.addFormBtnRow}>
          <TouchableOpacity
            style={[styles.confirmAddBtn, !name.trim() && styles.confirmAddBtnDisabled]}
            disabled={!name.trim()}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm add domain"
          >
            <Text style={styles.confirmAddBtnText}>Add Domain</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelAddBtn}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelAddBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  addDomainLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  addDomainLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  addFormCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  addFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  addFormFieldsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  addFormFieldCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  addFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  addFormInput: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.navyText,
  },
  addFormBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmAddBtn: {
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  confirmAddBtnDisabled: {
    opacity: 0.5,
  },
  confirmAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  cancelAddBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  cancelAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
});
