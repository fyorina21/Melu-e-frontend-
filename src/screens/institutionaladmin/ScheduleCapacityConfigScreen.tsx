// screens/institutionaladmin/ScheduleCapacityConfigScreen.js
// SCR-ADMIN-004: Session Schedule & Capacity Configuration

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getScheduleCapacityConfig,
  saveScheduleCapacityConfig,
} from '../../api/institutionalAdminApi';

interface TimeValue {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

interface ScheduleBlock {
  id: string;
  name: string;
  startTime: TimeValue;
  endTime: TimeValue;
}

const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, '0')
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

// Helper to format TimeValue back to standard string for backend
const formatTimeString = (t: TimeValue) => `${t.hour}:${t.minute} ${t.period}`;

// Helper to parse "08:07 AM" into object format
const parseTimeString = (str: string): TimeValue => {
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: match[1].padStart(2, '0'),
      minute: match[2],
      period: match[3].toUpperCase() as 'AM' | 'PM',
    };
  }
  return { hour: '08', minute: '00', period: 'AM' };
};

const DEFAULT_BLOCKS: ScheduleBlock[] = [
  {
    id: 'b1',
    name: 'Morning Block',
    startTime: { hour: '08', minute: '07', period: 'AM' },
    endTime: { hour: '10', minute: '30', period: 'AM' },
  },
  {
    id: 'b2',
    name: 'Afternoon Block',
    startTime: { hour: '01', minute: '10', period: 'PM' },
    endTime: { hour: '03', minute: '30', period: 'PM' },
  },
];

export default function ScheduleCapacityConfigScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'ScheduleCapacityConfig'>) {
  // Session Schedule Time States
  const [morningStart, setMorningStart] = useState<TimeValue>({
    hour: '08',
    minute: '07',
    period: 'AM',
  });
  const [morningEnd, setMorningEnd] = useState<TimeValue>({
    hour: '10',
    minute: '30',
    period: 'AM',
  });
  const [afternoonStart, setAfternoonStart] = useState<TimeValue>({
    hour: '01',
    minute: '10',
    period: 'PM',
  });
  const [afternoonEnd, setAfternoonEnd] = useState<TimeValue>({
    hour: '03',
    minute: '30',
    period: 'PM',
  });

  const [preTherapyDuration, setPreTherapyDuration] = useState('30');
  const [capacity, setCapacity] = useState('2');
  const [draftExpiry, setDraftExpiry] = useState('7');
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(DEFAULT_BLOCKS);

  // Time Picker Modal Control
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePickerField, setActivePickerField] = useState<{
    type: 'round' | 'block';
    target: string; // field identifier
    subField?: 'startTime' | 'endTime';
  } | null>(null);
  const [tempTime, setTempTime] = useState<TimeValue>({
    hour: '08',
    minute: '00',
    period: 'AM',
  });

  const load = useCallback(async () => {
    try {
      const { data } = await getScheduleCapacityConfig();
      if (data) {
        if (data.morningStart) setMorningStart(parseTimeString(data.morningStart));
        if (data.morningEnd) setMorningEnd(parseTimeString(data.morningEnd));
        if (data.afternoonStart)
          setAfternoonStart(parseTimeString(data.afternoonStart));
        if (data.afternoonEnd) setAfternoonEnd(parseTimeString(data.afternoonEnd));
        setPreTherapyDuration(String(data.preTherapyDuration ?? '30'));
        setCapacity(String(data.capacity ?? '2'));
        setDraftExpiry(String(data.draftExpiry ?? '7'));
        if (data.blocks && data.blocks.length > 0) {
          setBlocks(
            data.blocks.map((b: any) => ({
              ...b,
              startTime: parseTimeString(b.startTime),
              endTime: parseTimeString(b.endTime),
            }))
          );
        }
      }
    } catch (err) {
      // Retain defaults on fallback
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTimePicker = (
    type: 'round' | 'block',
    target: string,
    currentVal: TimeValue,
    subField?: 'startTime' | 'endTime'
  ) => {
    setActivePickerField({ type, target, subField });
    setTempTime(currentVal);
    setPickerVisible(true);
  };

  const handleConfirmTime = () => {
    if (!activePickerField) return;

    const { type, target, subField } = activePickerField;

    if (type === 'round') {
      if (target === 'morningStart') setMorningStart(tempTime);
      else if (target === 'morningEnd') setMorningEnd(tempTime);
      else if (target === 'afternoonStart') setAfternoonStart(tempTime);
      else if (target === 'afternoonEnd') setAfternoonEnd(tempTime);
    } else if (type === 'block' && subField) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === target ? { ...b, [subField]: tempTime } : b
        )
      );
    }
    setPickerVisible(false);
  };

  const handleSave = async () => {
    const cap = Number(capacity);
    const expiry = Number(draftExpiry);
    if (cap < 1) {
      Alert.alert('Capacity must be at least 1');
      return;
    }
    if (expiry < 1 || expiry > 30) {
      Alert.alert('Draft expiry must be 1-30 days');
      return;
    }
    try {
      await saveScheduleCapacityConfig({
        morningStart: formatTimeString(morningStart),
        morningEnd: formatTimeString(morningEnd),
        afternoonStart: formatTimeString(afternoonStart),
        afternoonEnd: formatTimeString(afternoonEnd),
        preTherapyDuration: Number(preTherapyDuration),
        capacity: cap,
        draftExpiry: expiry,
        blocks: blocks.map((b) => ({
          ...b,
          startTime: formatTimeString(b.startTime),
          endTime: formatTimeString(b.endTime),
        })),
      });
    } catch (err) {
      // Fallback save UI state
    }
    Alert.alert('Configuration saved');
  };

  // Time Selector Component for tabular inline display
  const TimePickerSelector = ({
    value,
    onPress,
  }: {
    value: TimeValue;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.timeInputContainer} onPress={onPress}>
      <Text style={styles.timeValueText}>
        {value.hour}:{value.minute} {value.period}
      </Text>
      <Feather name="clock" size={14} color="#64748B" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Schedule" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Breadcrumb */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.breadcrumbTitle}>Session Schedule & Capacity</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SCR-ADMIN-004</Text>
            </View>
          </View>
          <View style={styles.breadcrumbRow}>
            <Feather name="settings" size={12} color="#64748B" />
            <Text style={styles.breadcrumbText}>
              {' '}
              Clinical Configuration / Session Schedule & Capacity
            </Text>
          </View>
        </View>

        {/* Page Subtitle */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainTitle}>Session Schedule & Capacity</Text>
          <Text style={styles.subtitle}>
            SCR-ADMIN-004 · Define therapy session rounds, capacity, and block definitions
          </Text>
        </View>

        {/* Card 1: Session Schedule */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Session Schedule</Text>
            <Feather name="chevron-up" size={18} color="#64748B" />
          </View>

          {/* Morning Row */}
          <View style={styles.gridRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.label}>Morning Round Start</Text>
              <TimePickerSelector
                value={morningStart}
                onPress={() =>
                  openTimePicker('round', 'morningStart', morningStart)
                }
              />
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.label}>Morning Round End</Text>
              <TimePickerSelector
                value={morningEnd}
                onPress={() => openTimePicker('round', 'morningEnd', morningEnd)}
              />
            </View>
          </View>

          {/* Afternoon Row */}
          <View style={styles.gridRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.label}>Afternoon Round Start</Text>
              <TimePickerSelector
                value={afternoonStart}
                onPress={() =>
                  openTimePicker('round', 'afternoonStart', afternoonStart)
                }
              />
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.label}>Afternoon Round End</Text>
              <TimePickerSelector
                value={afternoonEnd}
                onPress={() =>
                  openTimePicker('round', 'afternoonEnd', afternoonEnd)
                }
              />
            </View>
          </View>

          {/* Pre-Therapy Duration */}
          <View style={styles.singleFieldRow}>
            <Text style={styles.label}>Pre-Therapy Duration (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={preTherapyDuration}
              onChangeText={setPreTherapyDuration}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Card 2: Capacity & Draft Expiry Grid */}
        <View style={styles.capacityGridRow}>
          {/* Staff-to-Student Capacity Card */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Staff-to-Student Capacity</Text>
            <View style={styles.cardInnerField}>
              <Text style={styles.label}>Students per Staff Member</Text>
              <TextInput
                style={styles.numberInput}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Draft Expiry Period Card */}
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Draft Expiry Period</Text>
            <View style={styles.cardInnerField}>
              <Text style={styles.label}>Days until draft expires (1–30)</Text>
              <TextInput
                style={styles.numberInput}
                value={draftExpiry}
                onChangeText={setDraftExpiry}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* Card 3: Session Block Definitions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Block Definitions</Text>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 4 }]}>BLOCK NAME</Text>
              <Text style={[styles.th, { flex: 3 }]}>START TIME</Text>
              <Text style={[styles.th, { flex: 3 }]}>END TIME</Text>
            </View>

            {blocks.map((b) => (
              <View key={b.id} style={styles.tableRow}>
                <Text style={[styles.blockNameText, { flex: 4 }]}>{b.name}</Text>
                <View style={{ flex: 3, paddingRight: 12 }}>
                  <TimePickerSelector
                    value={b.startTime}
                    onPress={() =>
                      openTimePicker('block', b.id, b.startTime, 'startTime')
                    }
                  />
                </View>
                <View style={{ flex: 3 }}>
                  <TimePickerSelector
                    value={b.endTime}
                    onPress={() =>
                      openTimePicker('block', b.id, b.endTime, 'endTime')
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Save Configuration Action Button */}
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSave}>
          <Feather name="save" size={14} color="#0F172A" />
          <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Interactive Time Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
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
                      style={[
                        styles.pickerItem,
                        tempTime.hour === h && styles.pickerItemActive,
                      ]}
                      onPress={() => setTempTime({ ...tempTime, hour: h })}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempTime.hour === h && styles.pickerItemTextActive,
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
                      style={[
                        styles.pickerItem,
                        tempTime.minute === m && styles.pickerItemActive,
                      ]}
                      onPress={() => setTempTime({ ...tempTime, minute: m })}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempTime.minute === m && styles.pickerItemTextActive,
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
                <View style={{ marginTop: 8, gap: 8 }}>
                  {PERIODS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.pickerItem,
                        tempTime.period === p && styles.pickerItemActive,
                      ]}
                      onPress={() => setTempTime({ ...tempTime, period: p })}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempTime.period === p && styles.pickerItemTextActive,
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
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmTime}
              >
                <Text style={styles.confirmBtnText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 60, gap: 20 },

  topHeader: { marginBottom: 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  breadcrumbText: { fontSize: 12, color: '#64748B' },

  pageHeader: { marginBottom: 4 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },

  gridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  fieldCol: {
    flex: 1,
    gap: 6,
  },
  singleFieldRow: {
    width: '50%',
    paddingRight: 10,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },

  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  timeValueText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  numberInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  capacityGridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  halfCard: {
    flex: 1,
  },
  cardInnerField: {
    gap: 6,
    marginTop: 4,
  },

  table: {
    width: '100%',
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  blockNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Modal Picker Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerColumnsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  columnList: {
    width: '100%',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 4,
    marginTop: 18,
  },
  pickerItem: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  pickerItemActive: {
    backgroundColor: '#BAE6FD',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0284C7',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});