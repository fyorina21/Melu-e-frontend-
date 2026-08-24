import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, SafeAreaView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { InstitutionalAdminStackParamList } from '../../types';
import type { PromptLevel } from '../../api/resources/types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getTrialLoggingConfig, saveTrialLoggingConfig } from '../../api/institutionalAdminApi';
import { useToast } from '../../context/ToastContext';

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'TrialLoggingFormat'>;

interface MasteryCriteria {
  percentage: number;
  consecutiveSessions: number;
}

interface TrialLoggingConfig {
  promptLevels: PromptLevel[];
  trialStreamLayout: 'grid' | 'stream' | 'compact';
  masteryCriteria: MasteryCriteria;
}

const SWATCH_COLORS = ['#E5484D', '#F5A623', '#30A46C', '#0091FF', '#8E4EC6', '#64748B'];

const LAYOUT_OPTIONS: Array<{ value: TrialLoggingConfig['trialStreamLayout']; label: string; hint: string }> = [
  { value: 'grid', label: 'Grid', hint: 'Prompt buttons in a fixed row' },
  { value: 'stream', label: 'Stream', hint: 'Chronological trial feed' },
  { value: 'compact', label: 'Compact', hint: 'Dense counters for high-volume sessions' },
];

const DEFAULT_CONFIG: TrialLoggingConfig = {
  promptLevels: [
    { id: 'pl-1', label: 'FP', color: '#E5484D', displayOrder: 1, isActive: true },
    { id: 'pl-2', label: 'PP', color: '#F5A623', displayOrder: 2, isActive: true },
    { id: 'pl-3', label: 'G', color: '#30A46C', displayOrder: 3, isActive: true },
    { id: 'pl-4', label: '+', color: '#0091FF', displayOrder: 4, isActive: true },
  ],
  trialStreamLayout: 'grid',
  masteryCriteria: { percentage: 80, consecutiveSessions: 3 },
};

export default function TrialLoggingFormatScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [promptLevels, setPromptLevels] = useState<PromptLevel[]>(DEFAULT_CONFIG.promptLevels);
  const [layout, setLayout] = useState<TrialLoggingConfig['trialStreamLayout']>(DEFAULT_CONFIG.trialStreamLayout);
  const [mastery, setMastery] = useState<MasteryCriteria>(DEFAULT_CONFIG.masteryCriteria);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getTrialLoggingConfig();
      if (data) {
        const cfg = data as Partial<TrialLoggingConfig>;
        if (cfg.promptLevels?.length) setPromptLevels(cfg.promptLevels);
        if (cfg.trialStreamLayout) setLayout(cfg.trialStreamLayout);
        if (cfg.masteryCriteria) setMastery(cfg.masteryCriteria);
      }
    } catch (err) {
      // Retain defaults on fallback
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLevel = (id: string, patch: Partial<PromptLevel>) => {
    setPromptLevels((prev) => prev.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl)));
  };

  const moveLevel = (index: number, dir: -1 | 1) => {
    setPromptLevels((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((pl, i) => ({ ...pl, displayOrder: i + 1 }));
    });
  };

  const handleSave = async () => {
    if (promptLevels.some((pl) => !pl.label.trim())) {
      showToast('Every prompt level needs a label', 'error');
      return;
    }
    if (mastery.percentage < 1 || mastery.percentage > 100) {
      showToast('Mastery percentage must be 1–100', 'error');
      return;
    }
    if (mastery.consecutiveSessions < 1 || mastery.consecutiveSessions > 10) {
      showToast('Consecutive sessions must be 1–10', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveTrialLoggingConfig({
        promptLevels: promptLevels.map((pl, i) => ({ ...pl, label: pl.label.trim(), displayOrder: i + 1 })),
        trialStreamLayout: layout,
        masteryCriteria: mastery,
      } as never);
      showToast('Trial logging format saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save trial logging format', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Trial Logging" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trial Logging Format</Text>
            <Text style={styles.subtitle}>
              SCR-ADMIN-002 · Configure prompt levels, button colors, trial stream layout and mastery criteria
            </Text>
          </View>
        </View>

        {/* Card 1: Prompt Levels & Button Colors */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prompt Levels</Text>
          <Text style={styles.cardHint}>Labels and button colors shown on the session data collection screen</Text>
          <View style={[styles.levelRow, styles.levelHeaderRow]}>
            <Text style={[styles.colLabel, { flex: 2 }]}>LABEL</Text>
            <Text style={[styles.colLabel, { flex: 5 }]}>BUTTON COLOR</Text>
            <Text style={[styles.colLabel, { flex: 2 }]}>ACTIVE</Text>
            <Text style={[styles.colLabel, { flex: 2 }]}>ORDER</Text>
          </View>
          {promptLevels.map((pl, i) => (
            <View key={pl.id} style={styles.levelRow}>
              <TextInput
                style={[styles.labelInput, { flex: 2 }]}
                value={pl.label}
                onChangeText={(text) => updateLevel(pl.id, { label: text } as Partial<PromptLevel>)}
                maxLength={3}
              />
              <View style={[{ flex: 5 }, styles.swatchRow]}>
                {SWATCH_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    testID={`swatch-${pl.id}-${c}`}
                    style={[styles.swatch, pl.color === c && styles.swatchSelected]}
                    onPress={() => updateLevel(pl.id, { color: c })}
                  >
                    {pl.color === c && <Feather name="check" size={12} color={colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flex: 2, alignItems: 'center' }}>
                <Switch
                  value={pl.isActive !== false}
                  onValueChange={(v) => updateLevel(pl.id, { isActive: v })}
                  trackColor={{ true: '#0284C7', false: '#CBD5E1' }}
                />
              </View>
              <View style={[{ flex: 2 }, styles.orderRow]}>
                <TouchableOpacity
                  style={[styles.orderBtn, i === 0 && styles.orderBtnDisabled]}
                  disabled={i === 0}
                  onPress={() => moveLevel(i, -1)}
                >
                  <Feather name="chevron-up" size={14} color={i === 0 ? '#94A3B8' : '#334155'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderBtn, i === promptLevels.length - 1 && styles.orderBtnDisabled]}
                  disabled={i === promptLevels.length - 1}
                  onPress={() => moveLevel(i, 1)}
                >
                  <Feather name="chevron-down" size={14} color={i === promptLevels.length - 1 ? '#94A3B8' : '#334155'} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Card 2: Trial Stream Layout */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trial Stream Layout</Text>
          <Text style={styles.cardHint}>How recorded trials are displayed during a live session</Text>
          {LAYOUT_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.value} style={styles.layoutOption} onPress={() => setLayout(opt.value)}>
              <View style={[styles.radioOuter, layout === opt.value && styles.radioOuterActive]}>
                {layout === opt.value && <View style={styles.radioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{opt.label}</Text>
                <Text style={styles.layoutHint}>{opt.hint}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Card 3: Mastery Criteria */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mastery Criteria</Text>
          <Text style={styles.cardHint}>Default targets applied when goals do not define their own criteria</Text>
          <View style={styles.criteriaRow}>
            <View style={styles.criteriaField}>
              <Text style={styles.fieldLabel}>Success rate (%)</Text>
              <TextInput
                style={styles.numberInput}
                value={String(mastery.percentage)}
                onChangeText={(t) => setMastery((m) => ({ ...m, percentage: Number(t.replace(/[^0-9]/g, '')) || 0 }))}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.criteriaField}>
              <Text style={styles.fieldLabel}>Consecutive sessions</Text>
              <TextInput
                style={styles.numberInput}
                value={String(mastery.consecutiveSessions)}
                onChangeText={(t) => setMastery((m) => ({ ...m, consecutiveSessions: Number(t.replace(/[^0-9]/g, '')) || 0 }))}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Text style={styles.layoutHint}>
            e.g. A goal is mastered at {mastery.percentage}% success across {mastery.consecutiveSessions} consecutive sessions.
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Feather name="save" size={14} color="#0F172A" />
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Configuration'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: 4 },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  headerTitle: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3 },
  cardHint: { ...typography.caption, marginBottom: spacing.xs },

  levelHeaderRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.xs },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  colLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  labelInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  swatchRow: { flexDirection: 'row', gap: 6 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: '#0F172A' },
  orderRow: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  orderBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: { opacity: 0.4 },

  layoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#0284C7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  layoutHint: { ...typography.caption },

  criteriaRow: { flexDirection: 'row', gap: spacing.lg },
  criteriaField: { flex: 1, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
});
