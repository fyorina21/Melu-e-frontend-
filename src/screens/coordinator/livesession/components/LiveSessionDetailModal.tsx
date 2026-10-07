import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import {
  type Session,
  STATUS_CONFIG,
  TRIAL_COLORS,
  SKY,
  DARK,
  DARK_TEXT,
  PANEL,
  formatTime,
} from '../types';

interface LiveSessionDetailModalProps {
  session: Session | null;
  onClose: () => void;
}

export const LiveSessionDetailModal: React.FC<LiveSessionDetailModalProps> = React.memo(
  ({ session, onClose }) => {
    return (
      <Modal visible={session !== null} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Session Details</Text>
                {session && (
                  <Text style={styles.modalSubtitle}>
                    {session.teacher} · {session.station} · {session.room}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close session details modal"
              >
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {session && (
              <ScrollView
                contentContainerStyle={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.statusInlineRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_CONFIG[session.status].dot },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: STATUS_CONFIG[session.status].text }]}>
                    {STATUS_CONFIG[session.status].label}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>STUDENTS</Text>
                <View style={styles.chipRow}>
                  {session.students.map((st) => (
                    <View key={st} style={styles.studentChip}>
                      <Text style={styles.studentChipText}>{st}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>GOALS BEING WORKED ON</Text>
                {session.goals.length > 0 ? (
                  session.goals.map((g) => (
                    <View key={g} style={styles.goalRow}>
                      <Feather name="check-circle" size={14} color="#4ADE80" />
                      <Text style={styles.goalText}>{g}</Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.goalText,
                      { color: colors.mutedText, fontStyle: 'italic', marginBottom: spacing.xs },
                    ]}
                  >
                    No active goals listed for this session
                  </Text>
                )}

                <View style={styles.metricsGrid3}>
                  <View style={styles.metricTile}>
                    <Text style={styles.metricTileValue}>{formatTime(session.timer)}</Text>
                    <Text style={styles.metricTileLabel}>Duration</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text style={[styles.metricTileValue, { color: SKY }]}>{session.trials}</Text>
                    <Text style={styles.metricTileLabel}>Trials</Text>
                  </View>
                  <View style={styles.metricTile}>
                    <Text
                      style={[
                        styles.metricTileValue,
                        { color: session.incidents > 0 ? '#FB923C' : '#4ADE80' },
                      ]}
                    >
                      {session.incidents}
                    </Text>
                    <Text style={styles.metricTileLabel}>Incidents</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>TRIAL BREAKDOWN</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {Object.entries(session.trialBreakdown).map(([key, val]) => (
                    <View key={key} style={styles.breakdownTile}>
                      <Text style={styles.breakdownValue}>{val}</Text>
                      <Text
                        style={[styles.breakdownKey, { color: TRIAL_COLORS[key] ?? '#4ADE80' }]}
                      >
                        {key}
                      </Text>
                    </View>
                  ))}
                </View>

                {session.incidents > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>INCIDENT LOG</Text>
                    {Array.from({ length: session.incidents }).map((_, i) => (
                      <View key={i} style={styles.incidentLogRow}>
                        <Feather name="alert-triangle" size={14} color="#FDBA74" />
                        <Text style={styles.incidentLogText}>
                          Incident {i + 1}: Behavior during activity transition — managed with
                          redirection.
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
    backgroundColor: 'rgba(26,34,51,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: DARK,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: DARK_TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  modalBody: {
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  statusInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: -spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${SKY}1A`,
    borderWidth: 1,
    borderColor: `${SKY}40`,
  },
  studentChipText: {
    color: SKY,
    fontSize: 12,
    fontWeight: '500',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: PANEL,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  goalText: {
    color: DARK_TEXT,
    fontSize: 13,
  },
  metricsGrid3: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricTile: {
    flex: 1,
    backgroundColor: PANEL,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricTileValue: {
    color: DARK_TEXT,
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricTileLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  breakdownTile: {
    flex: 1,
    backgroundColor: PANEL,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  breakdownValue: {
    color: DARK_TEXT,
    fontSize: 17,
    fontWeight: '700',
  },
  breakdownKey: {
    fontSize: 12,
    fontWeight: '700',
  },
  incidentLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(249,115,22,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  incidentLogText: {
    color: '#FDBA74',
    fontSize: 13,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: spacing.xl ?? spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
  },
  closeButtonText: {
    color: DARK_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
});
