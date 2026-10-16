// src/screens/parent/homeobservation/components/AddObservationModal.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import {
  CATEGORY_STYLE,
  todayISO,
  nowTime,
  type Category,
  type ObsPayload,
} from '../homeObservationTypes';

interface AddObservationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: ObsPayload) => void;
}

const CATEGORIES: Category[] = ['Behavior', 'Achievement', 'Concern', 'General'];
const LOCATIONS = ['Home', 'School', 'Community', 'Other'] as const;

export const AddObservationModal: React.FC<AddObservationModalProps> = React.memo(
  ({ visible, onClose, onSave }) => {
    const [form, setForm] = useState<ObsPayload>({
      category: 'General',
      date: todayISO(),
      time: nowTime(),
      text: '',
      location: 'Home',
      duration: '',
    });

    useEffect(() => {
      if (visible) {
        setForm({
          category: 'General',
          date: todayISO(),
          time: nowTime(),
          text: '',
          location: 'Home',
          duration: '',
        });
      }
    }, [visible]);

    const set = (patch: Partial<ObsPayload>) => setForm((prev) => ({ ...prev, ...patch }));

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={typography.h2}>Add Observation</Text>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={18} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={styles.sheetBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryChips}>
                  {CATEGORIES.map((c) => {
                    const cs = CATEGORY_STYLE[c];
                    const selected = form.category === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => set({ category: c })}
                        style={[
                          styles.chip,
                          {
                            borderColor: selected ? cs.text : colors.border,
                            backgroundColor: selected ? cs.bg : colors.bgCard,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[styles.chipText, { color: selected ? cs.text : colors.bodyText }]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.fieldFlex}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={form.date}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.mutedText}
                    onChangeText={(v) => set({ date: v })}
                  />
                </View>
                <View style={styles.fieldFlex}>
                  <Text style={styles.fieldLabel}>Time</Text>
                  <TextInput
                    style={styles.input}
                    value={form.time}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.mutedText}
                    onChangeText={(v) => set({ time: v })}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Observation <Text style={{ color: '#F87171' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  textAlignVertical="top"
                  placeholder="Describe what you observed..."
                  placeholderTextColor={colors.mutedText}
                  value={form.text}
                  onChangeText={(v) => set({ text: v })}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Location</Text>
                <View style={styles.categoryChips}>
                  {LOCATIONS.map((loc) => {
                    const selected = form.location === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        onPress={() => set({ location: loc })}
                        style={[
                          styles.chip,
                          {
                            borderColor: selected ? colors.statusInProgressText : colors.border,
                            backgroundColor: selected ? colors.statusInProgressBg : colors.bgCard,
                          },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: selected ? colors.statusInProgressText : colors.bodyText,
                            },
                          ]}
                        >
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Duration{' '}
                  <Text style={{ fontWeight: '400', color: colors.mutedText }}>(optional)</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10 minutes"
                  placeholderTextColor={colors.mutedText}
                  value={form.duration}
                  onChangeText={(v) => set({ duration: v })}
                />
              </View>
            </ScrollView>

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
                style={[styles.saveBtn, { opacity: form.text.trim() ? 1 : 0.4 }]}
                disabled={!form.text.trim()}
                onPress={() => onSave(form)}
                accessibilityRole="button"
                accessibilityLabel="Submit Observation"
              >
                <Text style={styles.saveBtnText}>Submit Observation</Text>
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
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  fieldFlex: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
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
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
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
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCD34D',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
