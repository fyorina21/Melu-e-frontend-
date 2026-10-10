// src/screens/parent/homeobservation/components/StrategyRequestModal.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

interface StrategyRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
}

export const StrategyRequestModal: React.FC<StrategyRequestModalProps> = React.memo(
  ({ visible, onClose, onSend }) => {
    const [text, setText] = useState('');

    useEffect(() => {
      if (visible) setText('');
    }, [visible]);

    const handleSend = () => {
      if (!text.trim()) return;
      onSend(text.trim());
      setText('');
    };

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={typography.h2}>Request a Home Strategy</Text>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <Text style={styles.strategyHint}>
                Describe what you'd like help with and the team will send you a strategy.
              </Text>
              <TextInput
                style={[styles.input, styles.strategyArea]}
                multiline
                textAlignVertical="top"
                placeholder="Describe the situation or behavior you need support with..."
                placeholderTextColor={colors.mutedText}
                value={text}
                onChangeText={setText}
              />
            </View>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.blueBtn, { opacity: text.trim() ? 1 : 0.4 }]}
                disabled={!text.trim()}
                onPress={handleSend}
                accessibilityRole="button"
                accessibilityLabel="Send Request"
              >
                <Text style={styles.blueBtnText}>Send Request</Text>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeIconBtn: {
    padding: 6,
  },
  sheetBody: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  strategyHint: {
    fontSize: 13,
    color: colors.mutedText,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.navyText,
    backgroundColor: colors.bgCard,
  },
  strategyArea: {
    minHeight: 120,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  blueBtn: {
    flex: 1,
    backgroundColor: '#38BDF8',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  blueBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
