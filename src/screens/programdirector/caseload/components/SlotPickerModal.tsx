import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { type Goal, type SlotKey, type StudentGoals, slotLabels } from '../caseloadTypes';

interface SlotPickerModalProps {
  visible: boolean;
  goal: Goal | null;
  studentGoals: StudentGoals;
  onSelectSlot: (slot: SlotKey) => void;
  onClose: () => void;
}

export const SlotPickerModal: React.FC<SlotPickerModalProps> = React.memo(
  ({ visible, goal, studentGoals, onSelectSlot, onClose }) => {
    return (
      <Modal
        visible={visible && goal !== null}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Assign Goal to Slot</Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close slot picker"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <Text style={typography.body}>
              Assigning: <Text style={typography.bodyBold}>{goal?.name}</Text>
            </Text>

            <View style={styles.slotGrid}>
              {(Object.keys(slotLabels) as SlotKey[]).map((slot) => {
                const occupied = studentGoals[slot] !== null;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotPickBtn,
                      occupied ? styles.slotPickOccupied : styles.slotPickEmpty,
                    ]}
                    onPress={() => onSelectSlot(slot)}
                    accessibilityRole="button"
                    accessibilityLabel={`Assign to ${slotLabels[slot]}`}
                  >
                    <Text style={styles.slotPickLabel}>{slotLabels[slot]}</Text>
                    <Text style={styles.slotPickSub}>
                      {occupied ? 'Replace existing' : 'Empty'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  slotPickBtn: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 2,
  },
  slotPickOccupied: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  slotPickEmpty: {
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  slotPickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  slotPickSub: {
    fontSize: 12,
    color: colors.mutedText,
  },
});
