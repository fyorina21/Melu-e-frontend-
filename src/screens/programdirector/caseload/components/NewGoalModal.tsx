import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface NewGoalModalProps {
  visible: boolean;
  onSaveGoal: (data: { name: string; domain: string; description: string }) => void;
  onClose: () => void;
}

const DOMAIN_OPTIONS = [
  'Cognitive',
  'Receptive Language',
  'Expressive Language',
  'Social Skills',
  'Motor Skills',
  'Adaptive',
  'Play Skills',
  'Academic',
];

export const NewGoalModal: React.FC<NewGoalModalProps> = React.memo(
  ({ visible, onSaveGoal, onClose }) => {
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('Cognitive');
    const [description, setDescription] = useState('');

    const handleSave = () => {
      if (!name.trim()) return;
      onSaveGoal({
        name: name.trim(),
        domain,
        description: description.trim(),
      });
      setName('');
      setDomain('Cognitive');
      setDescription('');
    };

    const handleClose = () => {
      setName('');
      setDomain('Cognitive');
      setDescription('');
      onClose();
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Add New Goal to Bank</Text>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close add goal modal"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formFields}>
              <View style={styles.field}>
                <Text style={typography.label}>Goal Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Identify Body Parts"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Domain</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {DOMAIN_OPTIONS.map((d) => {
                    const isSelected = domain === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.filterChip, isSelected && styles.filterChipActive]}
                        onPress={() => setDomain(d)}
                      >
                        <Text
                          style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Text style={typography.label}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the goal and success criteria..."
                  placeholderTextColor={colors.mutedText}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveGoalBtn, !name.trim() && styles.btnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save goal"
              >
                <Text style={styles.saveGoalBtnText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  formFields: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.bodyText,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    fontSize: 14,
    backgroundColor: colors.bgApp,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: colors.bodyText,
  },
  saveGoalBtn: {
    flex: 1,
    backgroundColor: colors.promptPP,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  saveGoalBtnText: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
