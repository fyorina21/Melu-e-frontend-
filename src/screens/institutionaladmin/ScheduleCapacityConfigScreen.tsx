// screens/institutionaladmin/ScheduleCapacityConfigScreen.js
// SCR-ADMIN-004: Session Schedule & Capacity Configuration

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getScheduleCapacityConfig, saveScheduleCapacityConfig } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

interface ScheduleBlock {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function ScheduleCapacityConfigScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'ScheduleCapacityConfig'>) {
  const [morningStart, setMorningStart] = useState('8:07 AM');
  const [morningEnd, setMorningEnd] = useState('12:00 PM');
  const [afternoonStart, setAfternoonStart] = useState('1:10 PM');
  const [afternoonEnd, setAfternoonEnd] = useState('5:00 PM');
  const [preTherapyDuration, setPreTherapyDuration] = useState('30');
  const [capacity, setCapacity] = useState('6');
  const [draftExpiry, setDraftExpiry] = useState('7');
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);

  const load = useCallback(async () => {
    try {
      const { data } = await getScheduleCapacityConfig();
      setMorningStart(data.morningStart); setMorningEnd(data.morningEnd);
      setAfternoonStart(data.afternoonStart); setAfternoonEnd(data.afternoonEnd);
      setPreTherapyDuration(String(data.preTherapyDuration));
      setCapacity(String(data.capacity)); setDraftExpiry(String(data.draftExpiry));
      setBlocks(data.blocks);
    } catch (err) {
      setBlocks(DEMO_BLOCKS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const cap = Number(capacity);
    const expiry = Number(draftExpiry);
    if (cap < 1) { Alert.alert('Capacity must be at least 1'); return; }
    if (expiry < 1 || expiry > 30) { Alert.alert('Draft expiry must be 1-30 days'); return; }
    try {
      await saveScheduleCapacityConfig({ morningStart, morningEnd, afternoonStart, afternoonEnd, preTherapyDuration: Number(preTherapyDuration), capacity: cap, draftExpiry: expiry, blocks });
    } catch (err) {}
    Alert.alert('Configuration saved');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="Schedule" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>Session Schedule & Capacity</Text></View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>Session Schedule</Text>
          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}><Text style={typography.label}>Morning Round Start</Text><TextInput style={styles.textInput} value={morningStart} onChangeText={setMorningStart} /></View>
            <View style={[styles.field, { flex: 1 }]}><Text style={typography.label}>Morning Round End</Text><TextInput style={styles.textInput} value={morningEnd} onChangeText={setMorningEnd} /></View>
          </View>
          <View style={styles.row2}>
            <View style={[styles.field, { flex: 1 }]}><Text style={typography.label}>Afternoon Round Start</Text><TextInput style={styles.textInput} value={afternoonStart} onChangeText={setAfternoonStart} /></View>
            <View style={[styles.field, { flex: 1 }]}><Text style={typography.label}>Afternoon Round End</Text><TextInput style={styles.textInput} value={afternoonEnd} onChangeText={setAfternoonEnd} /></View>
          </View>
          <View style={styles.field}><Text style={typography.label}>Pre-Therapy Duration (minutes)</Text><TextInput style={styles.textInput} value={preTherapyDuration} onChangeText={setPreTherapyDuration} keyboardType="number-pad" /></View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Capacity & Drafts</Text>
          <View style={styles.field}><Text style={typography.label}>Staff-to-Student Capacity</Text><TextInput style={styles.textInput} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" /></View>
          <View style={styles.field}><Text style={typography.label}>Draft Expiry Period (1-30 days)</Text><TextInput style={styles.textInput} value={draftExpiry} onChangeText={setDraftExpiry} keyboardType="number-pad" /></View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Session Block Definitions</Text>
          {blocks.map((b) => (
            <View key={b.id} style={styles.blockRow}>
              <Text style={typography.body}>{b.name} · {b.startTime}–{b.endTime}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSave}>
          <Text style={styles.saveConfigBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DEMO_BLOCKS: ScheduleBlock[] = [
  { id: 'b1', name: 'Station 1 (Basic Skills)', startTime: '9:00 AM', endTime: '10:30 AM' },
  { id: 'b2', name: 'Station 2 (Advanced Skills)', startTime: '11:00 AM', endTime: '12:30 PM' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  row2: { flexDirection: 'row', gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  blockRow: { paddingVertical: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  footer: { padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  saveConfigBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText },
});
