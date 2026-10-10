// screens/institutionaladmin/ScheduleCapacityConfigScreen.tsx
// SCR-ADMIN-004: Session Schedule & Capacity Configuration

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  useWindowDimensions,
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
import { radius, spacing } from '../../theme/colors';

import {
  type TimeValue,
  type ScheduleBlock,
  formatTimeString,
  parseTimeString,
  DEFAULT_BLOCKS,
} from './schedulecapacity/types';
import { ScheduleCapacityHeader } from './schedulecapacity/components/ScheduleCapacityHeader';
import { SessionScheduleCard } from './schedulecapacity/components/SessionScheduleCard';
import { CapacityAndExpiryCard } from './schedulecapacity/components/CapacityAndExpiryCard';
import { SessionBlocksTable } from './schedulecapacity/components/SessionBlocksTable';
import { TimePickerModal } from './schedulecapacity/components/TimePickerModal';

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'ScheduleCapacityConfig'>;

export default function ScheduleCapacityConfigScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
    target: string;
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
        if (data.afternoonStart) setAfternoonStart(parseTimeString(data.afternoonStart));
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
            })),
          );
        }
      }
    } catch {
      // Retain defaults on fallback
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTimePicker = useCallback(
    (
      type: 'round' | 'block',
      target: string,
      currentVal: TimeValue,
      subField?: 'startTime' | 'endTime',
    ) => {
      setActivePickerField({ type, target, subField });
      setTempTime(currentVal);
      setPickerVisible(true);
    },
    [],
  );

  const handleOpenRoundPicker = useCallback(
    (field: 'morningStart' | 'morningEnd' | 'afternoonStart' | 'afternoonEnd') => {
      const currentValues: Record<string, TimeValue> = {
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
      };
      openTimePicker('round', field, currentValues[field]);
    },
    [morningStart, morningEnd, afternoonStart, afternoonEnd, openTimePicker],
  );

  const handleOpenBlockPicker = useCallback(
    (blockId: string, subField: 'startTime' | 'endTime') => {
      const targetBlock = blocks.find((b) => b.id === blockId);
      if (targetBlock) {
        openTimePicker('block', blockId, targetBlock[subField], subField);
      }
    },
    [blocks, openTimePicker],
  );

  const handleConfirmTime = useCallback(() => {
    if (!activePickerField) return;

    const { type, target, subField } = activePickerField;

    if (type === 'round') {
      if (target === 'morningStart') setMorningStart(tempTime);
      else if (target === 'morningEnd') setMorningEnd(tempTime);
      else if (target === 'afternoonStart') setAfternoonStart(tempTime);
      else if (target === 'afternoonEnd') setAfternoonEnd(tempTime);
    } else if (type === 'block' && subField) {
      setBlocks((prev) => prev.map((b) => (b.id === target ? { ...b, [subField]: tempTime } : b)));
    }
    setPickerVisible(false);
  }, [activePickerField, tempTime]);

  const handleSave = useCallback(async () => {
    const cap = Number(capacity);
    const expiry = Number(draftExpiry);
    if (isNaN(cap) || cap < 1) {
      Alert.alert('Validation Error', 'Capacity must be at least 1 student.');
      return;
    }
    if (isNaN(expiry) || expiry < 1 || expiry > 30) {
      Alert.alert('Validation Error', 'Draft expiry must be between 1 and 30 days.');
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
      Alert.alert('Success', 'Session Schedule & Capacity configuration saved successfully.');
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.error ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.join(', ')
          : err?.response?.data?.errors) ||
        err?.message ||
        'Failed to save configuration. Please try again.';
      Alert.alert('Save Failed', errMsg);
    }
  }, [
    capacity,
    draftExpiry,
    morningStart,
    morningEnd,
    afternoonStart,
    afternoonEnd,
    preTherapyDuration,
    blocks,
  ]);

  const contentStyle = useMemo(
    () => [styles.scrollContent, isTablet && styles.tabletContent],
    [isTablet],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Schedule"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />
      <ScrollView contentContainerStyle={contentStyle}>
        <ScheduleCapacityHeader />

        <SessionScheduleCard
          morningStart={morningStart}
          morningEnd={morningEnd}
          afternoonStart={afternoonStart}
          afternoonEnd={afternoonEnd}
          preTherapyDuration={preTherapyDuration}
          onPreTherapyDurationChange={setPreTherapyDuration}
          onOpenPicker={handleOpenRoundPicker}
        />

        <CapacityAndExpiryCard
          capacity={capacity}
          draftExpiry={draftExpiry}
          onCapacityChange={setCapacity}
          onDraftExpiryChange={setDraftExpiry}
        />

        <SessionBlocksTable blocks={blocks} onOpenPicker={handleOpenBlockPicker} />

        <TouchableOpacity
          style={styles.saveConfigBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save Schedule and Capacity Configuration"
        >
          <Feather name="save" size={14} color="#0F172A" />
          <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={pickerVisible}
        time={tempTime}
        onChangeTime={setTempTime}
        onConfirm={handleConfirmTime}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.lg,
  },
  tabletContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F6C445',
    paddingVertical: 14,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  saveConfigBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
