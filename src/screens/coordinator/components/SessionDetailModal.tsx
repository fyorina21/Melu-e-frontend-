import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import type { SessionHistoryRow } from '../studentProgressTypes';

interface SessionDetailModalProps {
  selectedSession: SessionHistoryRow | null;
  onClose: () => void;
}

export function SessionDetailModal({ selectedSession, onClose }: SessionDetailModalProps) {
  return (
    <Modal
      visible={selectedSession !== null}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Session Notes</Text>
              {selectedSession && <Text style={styles.modalSubtitle}>{selectedSession.date}</Text>}
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close session detail modal"
            >
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {selectedSession && (
            <>
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  {selectedSession.stationName}
                  {selectedSession.status ? ` · ${selectedSession.status}` : ''}
                </Text>
                <View style={styles.sessionStatsGrid}>
                  <View style={[styles.sessionStatTile, { backgroundColor: colors.bgApp }]}>
                    <Text style={styles.statTileLabel}>Independence</Text>
                    <Text style={[styles.statTileValue, { color: colors.primaryYellowDark }]}>
                      {selectedSession.independencePercent ?? 0}%
                    </Text>
                  </View>
                </View>
                <Text style={styles.notesSectionLabel}>SESSION NOTES</Text>
                <Text style={styles.sessionNotesText}>{selectedSession.bodyPreview}</Text>
              </View>
              <View style={styles.modalFooterSingle}>
                <TouchableOpacity
                  style={styles.closeDarkButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeDarkButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.navyText },
  modalSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  modalBody: { gap: spacing.md },
  sessionStatsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sessionStatTile: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statTileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statTileValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  notesSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  sessionNotesText: {
    fontSize: 13,
    color: colors.bodyText,
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFooterSingle: { marginTop: spacing.xl },
  closeDarkButton: {
    backgroundColor: colors.navyText,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeDarkButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
