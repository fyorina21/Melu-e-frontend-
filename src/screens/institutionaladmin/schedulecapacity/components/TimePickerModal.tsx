import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { radius, spacing } from '../../../../theme/colors';
import { type TimeValue, HOURS, MINUTES, PERIODS } from '../types';

interface TimePickerModalProps {
  visible: boolean;
  time: TimeValue;
  onChangeTime: (time: TimeValue) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = React.memo(
  ({ visible, time, onChangeTime, onConfirm, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Time</Text>

            <View style={styles.pickerColumnsContainer}>
              {/* Hour Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnLabel}>Hour</Text>
                <ScrollView style={styles.columnList}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.pickerItem, time.hour === h && styles.pickerItemActive]}
                      onPress={() => onChangeTime({ ...time, hour: h })}
                      accessibilityRole="button"
                      accessibilityLabel={`Hour ${h}`}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          time.hour === h && styles.pickerItemTextActive,
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minute Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnLabel}>Minute</Text>
                <ScrollView style={styles.columnList}>
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pickerItem, time.minute === m && styles.pickerItemActive]}
                      onPress={() => onChangeTime({ ...time, minute: m })}
                      accessibilityRole="button"
                      accessibilityLabel={`Minute ${m}`}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          time.minute === m && styles.pickerItemTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM/PM Column */}
              <View style={[styles.pickerColumn, { flex: 0.8 }]}>
                <Text style={styles.columnLabel}>Period</Text>
                <View style={styles.periodCol}>
                  {PERIODS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerItem, time.period === p && styles.pickerItemActive]}
                      onPress={() => onChangeTime({ ...time, period: p })}
                      accessibilityRole="button"
                      accessibilityLabel={p}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          time.period === p && styles.pickerItemTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel time change"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={onConfirm}
                accessibilityRole="button"
                accessibilityLabel="Confirm time"
              >
                <Text style={styles.confirmBtnText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    width: '100%',
    maxWidth: 360,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerColumnsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 180,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  columnList: {
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  pickerItemActive: {
    backgroundColor: '#0284C7',
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 22,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 20,
    marginHorizontal: 4,
  },
  periodCol: {
    marginTop: 8,
    gap: 8,
    width: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: '#0284C7',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
