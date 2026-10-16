import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { Trial } from '../../../types';
import { PROMPT_CONFIG } from '../types';

interface TrialLogModalProps {
  visible: boolean;
  goalName?: string;
  trials?: Trial[];
  onClose: () => void;
}

export const TrialLogModal: React.FC<TrialLogModalProps> = React.memo(
  ({ visible, goalName, trials, onClose }) => {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.trialLogSheet}>
            <View style={styles.trialLogHeader}>
              <Text style={typography.h3}>Trial Log — {goalName}</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close trial log"
              >
                <Feather name="x" size={20} color={colors.navyText} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {(trials || []).map((t, i) => (
                <View key={i} style={styles.trialLogRow}>
                  <Text style={typography.body}>
                    {(t as any).date ? `${(t as any).date} ` : ''}
                    {t.timestamp}
                  </Text>
                  <View
                    style={[
                      styles.trialBadge,
                      {
                        backgroundColor:
                          (t.promptLevel ? PROMPT_CONFIG[t.promptLevel]?.bg : undefined) ||
                          '#F3F4F6',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trialBadgeText,
                        {
                          color:
                            (t.promptLevel ? PROMPT_CONFIG[t.promptLevel]?.text : undefined) ||
                            '#374151',
                        },
                      ]}
                    >
                      {(t.promptLevel ? PROMPT_CONFIG[t.promptLevel]?.label : undefined) ||
                        t.promptLevel ||
                        ''}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
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
    alignItems: 'center',
    padding: spacing.md,
  },
  trialLogSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trialLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trialLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  trialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
