// screens/institutionaladmin/TrialLoggingFormatScreen.js
// SCR-ADMIN-002: Trial Logging Format Configuration

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getTrialLoggingConfig, saveTrialLoggingConfig } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

const SWATCHES = ['#FCA5A5', '#FCD34D', '#93C5FD', '#86EFAC', '#DDD6FE', '#F9A8D4'];

interface TrialLevel {
  id: string;
  label: string;
  color: string;
  active: boolean;
}

export default function TrialLoggingFormatScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'TrialLoggingFormat'>) {
  const [levels, setLevels] = useState<TrialLevel[]>([]);
  const [layout, setLayout] = useState('Horizontal');
  const [streamCount, setStreamCount] = useState('5');
  const [masteryConsecutive, setMasteryConsecutive] = useState('5');
  const [masteryPercent, setMasteryPercent] = useState('80');

  const load = useCallback(async () => {
    try {
      const { data } = await getTrialLoggingConfig();
      setLevels(data.levels); setLayout(data.layout); setStreamCount(String(data.streamCount));
      setMasteryConsecutive(String(data.masteryConsecutive)); setMasteryPercent(String(data.masteryPercent));
    } catch (err) {
      setLevels(DEMO_LEVELS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddLevel = () => {
    setLevels((prev) => [...prev, { id: `l-${Date.now()}`, label: 'New Level', color: SWATCHES[prev.length % SWATCHES.length], active: true }]);
  };

  const handleDeleteLevel = (id: string) => {
    Alert.alert('Delete this prompt level?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setLevels((prev) => prev.filter((l) => l.id !== id)) },
    ]);
  };

  const handleUpdateLabel = (id: string, label: string) => setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, label } : l)));
  const handleUpdateColor = (id: string, color: string) => setLevels((prev) => prev.map((l) => (l.id === id ? { ...l, color } : l)));

  const handleSave = async () => {
    const activeCount = levels.filter((l) => l.active !== false).length;
    if (activeCount === 0) { Alert.alert('At least one active prompt level required'); return; }
    const clampedCount = Math.max(3, Math.min(20, Number(streamCount) || 5));
    try {
      await saveTrialLoggingConfig({ levels, layout, streamCount: clampedCount, masteryConsecutive: Number(masteryConsecutive), masteryPercent: Number(masteryPercent) });
    } catch (err) {}
    Alert.alert('Configuration saved', 'Changes reflected in the Session screen.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="Trial Logging" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>Trial Logging Format</Text></View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h3}>Prompt Levels</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddLevel}>
              <Feather name="plus" size={14} color={colors.navyText} />
              <Text style={styles.addBtnText}>Add Level</Text>
            </TouchableOpacity>
          </View>
          {levels.map((l) => (
            <View key={l.id} style={styles.levelRow}>
              <TouchableOpacity style={styles.colorRow}>
                {SWATCHES.map((c) => (
                  <TouchableOpacity key={c} style={[styles.swatch, { backgroundColor: c }, l.color === c && styles.swatchSelected]} onPress={() => handleUpdateColor(l.id, c)} />
                ))}
              </TouchableOpacity>
              <TextInput style={styles.labelInput} value={l.label} onChangeText={(v) => handleUpdateLabel(l.id, v)} />
              <TouchableOpacity onPress={() => handleDeleteLevel(l.id)}>
                <Feather name="trash-2" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Trial Stream Layout</Text>
          <View style={styles.chipRow}>
            {['Horizontal', 'Vertical', 'Card Grid'].map((l) => (
              <TouchableOpacity key={l} style={[styles.chip, layout === l && styles.chipSelected]} onPress={() => setLayout(l)}>
                <Text style={[styles.chipText, layout === l && styles.chipTextSelected]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.field}>
            <Text style={typography.label}>Trial Stream Count (3-20)</Text>
            <TextInput style={styles.textInput} value={streamCount} onChangeText={setStreamCount} keyboardType="number-pad" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Mastery Criteria</Text>
          <View style={styles.field}>
            <Text style={typography.label}>Consecutive Independent Trials</Text>
            <TextInput style={styles.textInput} value={masteryConsecutive} onChangeText={setMasteryConsecutive} keyboardType="number-pad" />
          </View>
          <View style={styles.field}>
            <Text style={typography.label}>Independence Percentage Threshold</Text>
            <TextInput style={styles.textInput} value={masteryPercent} onChangeText={setMasteryPercent} keyboardType="number-pad" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Live Preview</Text>
          <View style={styles.previewRow}>
            {levels.filter((l) => l.active !== false).map((l) => (
              <View key={l.id} style={[styles.previewChip, { backgroundColor: l.color }]}>
                <Text style={styles.previewChipText}>{l.label}</Text>
              </View>
            ))}
          </View>
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

const DEMO_LEVELS: TrialLevel[] = [
  { id: 'l1', label: 'FP', color: '#FCA5A5', active: true },
  { id: 'l2', label: 'PP', color: '#FCD34D', active: true },
  { id: 'l3', label: 'G', color: '#93C5FD', active: true },
  { id: 'l4', label: '+', color: '#86EFAC', active: true },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  addBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  colorRow: { flexDirection: 'row', gap: 4 },
  swatch: { width: 18, height: 18, borderRadius: 9 },
  swatchSelected: { borderWidth: 2, borderColor: colors.navyText },
  labelInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  field: { gap: spacing.xs, marginTop: spacing.sm },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  previewRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  previewChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  previewChipText: { fontWeight: '700', color: colors.navyText },
  footer: { padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  saveConfigBtn: { backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText },
});
