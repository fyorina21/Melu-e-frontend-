import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { type TimeValue, HOURS, MINUTES, PERIODS, parseTimeString } from '../types';

interface TimePickerModalProps {
  visible: boolean;
  time: TimeValue;
  onChangeTime: (time: TimeValue) => void;
  onConfirm: () => void;
  onClose: () => void;
}

const PRESET_TIMES = [
  '08:00 AM',
  '08:30 AM',
  '09:15 AM',
  '10:30 AM',
  '11:45 AM',
  '01:00 PM',
  '01:30 PM',
  '02:15 PM',
  '03:30 PM',
];

const COMMON_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const TimePickerModal: React.FC<TimePickerModalProps> = React.memo(
  ({ visible, time, onChangeTime, onConfirm, onClose }) => {
    const [showAllMinutes, setShowAllMinutes] = useState(false);

    const stepMinute = (delta: number) => {
      const current = parseInt(time.minute, 10) || 0;
      let next = current + delta;
      if (next < 0) next = 59;
      if (next > 59) next = 0;
      onChangeTime({ ...time, minute: String(next).padStart(2, '0') });
    };

    const stepHour = (delta: number) => {
      const current = parseInt(time.hour, 10) || 12;
      let next = current + delta;
      if (next < 1) next = 12;
      if (next > 12) next = 1;
      onChangeTime({ ...time, hour: String(next).padStart(2, '0') });
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Select Time</Text>
                <Text style={styles.modalSubtitle}>Quick presets & digital selector</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close time picker"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets Scroll / Chips */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>Quick Session Presets</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsList}
              >
                {PRESET_TIMES.map((preset) => {
                  const pVal = parseTimeString(preset);
                  const isCurrent =
                    pVal.hour === time.hour &&
                    pVal.minute === time.minute &&
                    pVal.period === time.period;
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[styles.presetChip, isCurrent && styles.presetChipActive]}
                      onPress={() => onChangeTime(pVal)}
                      accessibilityRole="button"
                      accessibilityLabel={`Preset ${preset}`}
                    >
                      <Text
                        style={[styles.presetChipText, isCurrent && styles.presetChipTextActive]}
                      >
                        {preset}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Large Digital Clock Display */}
            <View style={styles.clockDisplayCard}>
              <View style={styles.timeDigitGroup}>
                <TouchableOpacity
                  style={styles.stepperMiniBtn}
                  onPress={() => stepHour(1)}
                  accessibilityRole="button"
                  accessibilityLabel="Increment hour"
                >
                  <Feather name="chevron-up" size={16} color="#475569" />
                </TouchableOpacity>
                <View style={styles.digitBox}>
                  <Text style={styles.digitText}>{time.hour}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperMiniBtn}
                  onPress={() => stepHour(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Decrement hour"
                >
                  <Feather name="chevron-down" size={16} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.digitCaption}>HOUR</Text>
              </View>

              <Text style={styles.colonSeparator}>:</Text>

              <View style={styles.timeDigitGroup}>
                <TouchableOpacity
                  style={styles.stepperMiniBtn}
                  onPress={() => stepMinute(5)}
                  accessibilityRole="button"
                  accessibilityLabel="Add 5 minutes"
                >
                  <Feather name="chevron-up" size={16} color="#475569" />
                </TouchableOpacity>
                <View style={styles.digitBox}>
                  <Text style={styles.digitText}>{time.minute}</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperMiniBtn}
                  onPress={() => stepMinute(-5)}
                  accessibilityRole="button"
                  accessibilityLabel="Subtract 5 minutes"
                >
                  <Feather name="chevron-down" size={16} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.digitCaption}>MINUTE</Text>
              </View>

              {/* AM / PM Segmented Switch */}
              <View style={styles.periodSegmented}>
                <TouchableOpacity
                  style={[
                    styles.periodSegmentBtn,
                    time.period === 'AM' && styles.periodSegmentBtnActive,
                  ]}
                  onPress={() => onChangeTime({ ...time, period: 'AM' })}
                  accessibilityRole="button"
                  accessibilityLabel="AM"
                >
                  <Text
                    style={[
                      styles.periodSegmentText,
                      time.period === 'AM' && styles.periodSegmentTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodSegmentBtn,
                    time.period === 'PM' && styles.periodSegmentBtnActive,
                  ]}
                  onPress={() => onChangeTime({ ...time, period: 'PM' })}
                  accessibilityRole="button"
                  accessibilityLabel="PM"
                >
                  <Text
                    style={[
                      styles.periodSegmentText,
                      time.period === 'PM' && styles.periodSegmentTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Hour Grid */}
            <View style={styles.selectorSection}>
              <Text style={styles.sectionLabel}>Select Hour</Text>
              <View style={styles.hourGrid}>
                {HOURS.map((h) => {
                  const active = time.hour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.gridPill, active && styles.gridPillActive]}
                      onPress={() => onChangeTime({ ...time, hour: h })}
                      accessibilityRole="button"
                      accessibilityLabel={`Hour ${h}`}
                    >
                      <Text style={[styles.gridPillText, active && styles.gridPillTextActive]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Minute Grid */}
            <View style={styles.selectorSection}>
              <View style={styles.minuteHeaderRow}>
                <Text style={styles.sectionLabel}>Select Minute</Text>
                <TouchableOpacity
                  onPress={() => setShowAllMinutes((v) => !v)}
                  style={styles.toggleMinuteModeBtn}
                >
                  <Text style={styles.toggleMinuteModeText}>
                    {showAllMinutes ? 'Show Common' : 'All Minutes'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showAllMinutes ? (
                <ScrollView
                  style={{ maxHeight: 90 }}
                  contentContainerStyle={styles.minuteGrid}
                  nestedScrollEnabled
                >
                  {MINUTES.map((m) => {
                    const active = time.minute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.minutePill, active && styles.gridPillActive]}
                        onPress={() => onChangeTime({ ...time, minute: m })}
                        accessibilityRole="button"
                        accessibilityLabel={`Minute ${m}`}
                      >
                        <Text style={[styles.gridPillText, active && styles.gridPillTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.minuteGrid}>
                  {COMMON_MINUTES.map((m) => {
                    const active = time.minute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.gridPill, active && styles.gridPillActive]}
                        onPress={() => onChangeTime({ ...time, minute: m })}
                        accessibilityRole="button"
                        accessibilityLabel={`Minute ${m}`}
                      >
                        <Text style={[styles.gridPillText, active && styles.gridPillTextActive]}>
                          :{m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmButtonText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 440,
    ...makeShadow(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  presetsSection: {
    marginVertical: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  presetsList: {
    gap: 6,
    paddingBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  clockDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
  },
  timeDigitGroup: {
    alignItems: 'center',
  },
  stepperMiniBtn: {
    padding: 2,
  },
  digitBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 54,
    alignItems: 'center',
  },
  digitText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  digitCaption: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  colonSeparator: {
    fontSize: 26,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 14,
  },
  periodSegmented: {
    backgroundColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 3,
    flexDirection: 'column',
    gap: 3,
    marginLeft: spacing.sm,
  },
  periodSegmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  periodSegmentBtnActive: {
    backgroundColor: '#2563EB',
  },
  periodSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  periodSegmentTextActive: {
    color: '#FFFFFF',
  },
  selectorSection: {
    marginVertical: 4,
  },
  minuteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleMinuteModeBtn: {
    paddingVertical: 2,
  },
  toggleMinuteModeText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  minuteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridPill: {
    flexGrow: 1,
    minWidth: 42,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutePill: {
    width: 38,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  gridPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  gridPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
