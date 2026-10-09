// src/screens/parent/childprogress/components/ChildSessionSummaryModal.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { behaviorBox, type SessionSummary } from '../childProgressTypes';

interface ChildSessionSummaryModalProps {
  session: SessionSummary | null;
  onClose: () => void;
}

export const ChildSessionSummaryModal: React.FC<ChildSessionSummaryModalProps> = React.memo(
  ({ session, onClose }) => {
    if (!session) return null;
    const bh = behaviorBox(session.behavior);

    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View
          style={styles.overlay}
          onStartShouldSetResponder={() => true}
          onResponderRelease={onClose}
        >
          <View
            style={styles.modalCard}
            onStartShouldSetResponder={() => true}
            onResponderRelease={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Summary</Text>
              <TouchableOpacity
                style={styles.modalX}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close session summary modal"
              >
                <Feather name="x" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              <View style={styles.statPair}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Teacher</Text>
                  <Text style={styles.statBoxValue}>{session.teacher}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Date</Text>
                  <Text style={styles.statBoxValue}>{session.date}</Text>
                </View>
              </View>
              <View style={styles.statPair}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Time</Text>
                  <Text style={styles.statBoxValue}>{session.time}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Duration</Text>
                  <Text style={styles.statBoxValue}>{session.duration}</Text>
                </View>
              </View>

              <View style={[styles.sectionBox, styles.skyBox]}>
                <Text style={[styles.sectionBoxLabel, { color: '#0EA5E9' }]}>Goals Worked On</Text>
                {session.goals.map((g) => (
                  <View key={g} style={styles.goalListItem}>
                    <View style={[styles.goalDot, { backgroundColor: '#38BDF8' }]} />
                    <Text style={styles.goalListText}>{g}</Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  styles.sectionBox,
                  {
                    backgroundColor: '#F0FDF4',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
              >
                <Text style={[styles.sectionBoxLabel, { color: '#15803D' }]}>Independence</Text>
                <Text style={styles.independenceValue}>{session.independence}%</Text>
              </View>

              <View style={[styles.sectionBox, { backgroundColor: bh.bg }]}>
                <Text style={styles.sectionBoxPlainLabel}>Behavior Observations</Text>
                <Text style={[styles.sectionBoxText, { color: bh.text }]}>
                  {bh.isClean ? 'No incidents — great session!' : session.behavior}
                </Text>
              </View>

              <View style={[styles.sectionBox, { backgroundColor: '#F9FAFB' }]}>
                <Text style={styles.sectionBoxPlainLabel}>Teacher Notes</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalX: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  sheetBody: {
    gap: spacing.md,
  },
  statPair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statBoxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
  },
  skyBox: {
    backgroundColor: '#F0F9FF',
  },
  sectionBoxLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  sectionBoxPlainLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionBoxText: {
    fontSize: 13,
    fontWeight: '500',
  },
  independenceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16A34A',
  },
  notesText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
  goalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  goalListText: {
    fontSize: 13,
    color: '#374151',
  },
  modalCloseBtn: {
    marginTop: spacing.lg,
    backgroundColor: '#1F2937',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
