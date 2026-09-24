import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import { getPromptLevels, setPromptLevels, getTrialConfig } from '../../stores/promptLevelsStore';

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'TrialLoggingFormat'>;

interface LevelItem {
  id: string;
  name: string;
  color: string;
  order: number;
  status: 'Active';
}

const COLOR_SWATCHES = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

export default function TrialLoggingFormatScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const configInit = getTrialConfig();
  const [levels, setLevels] = useState<LevelItem[]>(() => getPromptLevels());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState({ name: '', color: '', order: 0 });
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLevel, setNewLevel] = useState({ name: '', color: '#6366F1', order: 5 });
  const [layout, setLayout] = useState<'Horizontal' | 'Vertical' | 'Card Grid'>('Horizontal');
  const [streamCount, setStreamCount] = useState(configInit.streamCount);
  const [consecutive, setConsecutive] = useState(configInit.consecutive);
  const [independence, setIndependence] = useState(80);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const startEdit = (lv: LevelItem) => {
    setEditingId(lv.id);
    setEditBuf({ name: lv.name, color: lv.color, order: lv.order });
  };
  const saveEdit = (id: string) => {
    if (!editBuf.name.trim()) {
      showToast('Every prompt level needs a name', 'error');
      return;
    }
    const orderTaken = levels.some((l) => l.id !== id && l.order === editBuf.order);
    if (orderTaken) {
      showToast(`Order ${editBuf.order} is already in use. Each prompt level needs a unique order number.`, 'error');
      return;
    }
    const next = levels.map((l) => (l.id === id ? { ...l, ...editBuf } : l));
    setLevels(next);
    setPromptLevels(next, consecutive, streamCount);
    setEditingId(null);
  };
  const deleteLevel = (id: string) => {
    const next = levels.filter((l) => l.id !== id);
    setLevels(next);
    setPromptLevels(next, consecutive, streamCount);
    setDeleteConfirmId(null);
  };
  const addLevel = () => {
    if (!newLevel.name.trim()) {
      showToast('Every prompt level needs a name', 'error');
      return;
    }
    const orderTaken = levels.some((l) => l.order === newLevel.order);
    if (orderTaken) {
      showToast(`Order ${newLevel.order} is already in use. Each prompt level needs a unique order number.`, 'error');
      return;
    }
    const next: LevelItem[] = [...levels, { id: String(Date.now()), ...newLevel, status: 'Active' }];
    setLevels(next);
    setPromptLevels(next, consecutive, streamCount);
    setNewLevel({ name: '', color: '#6366F1', order: levels.length + 2 });
    setAddingLevel(false);
  };

  const renderSwatches = (selected: string, onSelect: (c: string) => void) => (
    <View style={styles.swatchRow}>
      {COLOR_SWATCHES.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onSelect(c)}
          style={[
            styles.swatch,
            { backgroundColor: c },
            selected === c ? styles.swatchSelected : styles.swatchUnselected,
          ]}
        />
      ))}
    </View>
  );

  const renderEditActions = (id: string) => {
    if (deleteConfirmId === id) {
      return (
        <View style={styles.deleteConfirmRow}>
          <Text style={styles.deleteConfirmText}>Delete?</Text>
          <TouchableOpacity onPress={() => deleteLevel(id)} style={styles.deleteBtn}>
            <Feather name="check" size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteConfirmId(null)} style={styles.cancelBtn}>
            <Feather name="x" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={() => startEdit(levels.find((l) => l.id === id)!)} style={styles.actionBtn}>
          <Feather name="edit-3" size={14} color={colors.navyText} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeleteConfirmId(id)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Feather name="trash-2" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Trial Logging" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={16} color="#334155" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trial Logging Format</Text>
            <Text style={styles.subtitle}>
              SCR-ADMIN-002 · Configure prompt levels, trial layout, and mastery criteria
            </Text>
          </View>
        </View>

        {/* Prompt Level Table */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.tableHeaderText}>Prompt Levels</Text>
            </View>
            <TouchableOpacity onPress={() => setAddingLevel(true)} style={styles.addBtn}>
              <Feather name="plus" size={14} color="#0284C7" />
              <Text style={styles.addBtnText}>Add Prompt Level</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tableHead}>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>NAME</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>COLOR</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>ORDER</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>STATUS</Text>
            <Text style={[styles.tableColHeader, { flex: 1 }]}>ACTIONS</Text>
          </View>
          {levels.map((lv) => (
            <View key={lv.id} style={styles.tableRow}>
              {editingId === lv.id ? (
                <>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <TextInput
                      value={editBuf.name}
                      onChangeText={(e) => setEditBuf((b) => ({ ...b, name: e }))}
                      style={styles.inlineInput}
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    {renderSwatches(editBuf.color, (c) => setEditBuf((b) => ({ ...b, color: c })))}
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <TextInput
                      value={String(editBuf.order)}
                      onChangeText={(e) => setEditBuf((b) => ({ ...b, order: Number(e) }))}
                      style={[styles.inlineInput, { width: 60 }]}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={styles.badgeText}>Active</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => saveEdit(lv.id)} style={styles.actionBtn}>
                      <Feather name="check" size={14} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}>
                      <Feather name="x" size={14} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.cellText}>{lv.name}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.colorDot, { backgroundColor: lv.color }]} />
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.cellText}>{lv.order}</Text>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={styles.badgeText}>Active</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    {renderEditActions(lv.id)}
                  </View>
                </>
              )}
            </View>
          ))}
          {addingLevel && (
            <View style={[styles.tableRow, styles.addingRow]}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <TextInput
                  value={newLevel.name}
                  onChangeText={(e) => setNewLevel((n) => ({ ...n, name: e }))}
                  placeholder="Name"
                  style={styles.inlineInput}
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {renderSwatches(newLevel.color, (c) => setNewLevel((n) => ({ ...n, color: c })))}
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <TextInput
                  value={String(newLevel.order)}
                  onChangeText={(e) => setNewLevel((n) => ({ ...n, order: Number(e) }))}
                  style={[styles.inlineInput, { width: 60 }]}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>Active</Text>
                </View>
              </View>
              <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={addLevel} style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}>
                  <Feather name="check" size={14} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAddingLevel(false)} style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}>
                  <Feather name="x" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Live Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Live Preview</Text>
          <View style={styles.previewButtons}>
            {levels
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((lv) => (
                <TouchableOpacity key={lv.id} style={[styles.previewBtn, { backgroundColor: lv.color }]}>
                  <Text style={styles.previewBtnText}>{lv.name}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Trial Stream Layout & Mastery Criteria */}
        <View style={styles.twoCol}>
          {/* Trial Stream Layout */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Trial Stream Layout</Text>
            <View style={{ flexDirection: 'column', gap: 8 }}>
              {(['Horizontal', 'Vertical', 'Card Grid'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.radioRow}
                  onPress={() => setLayout(opt)}
                >
                  <View style={[styles.radioOuter, layout === opt && styles.radioOuterActive]}>
                    {layout === opt && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.radioLabel}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>Trial Stream Count (3–20)</Text>
              <TextInput
                value={String(streamCount)}
                onChangeText={(e) => setStreamCount(Number(e))}
                style={styles.numberInput}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Mastery Criteria */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mastery Criteria</Text>
            <View style={{ flexDirection: 'column', gap: 12 }}>
              <View>
                <Text style={styles.fieldLabel}>Consecutive Trials</Text>
                <TextInput
                  value={String(consecutive)}
                  onChangeText={(e) => setConsecutive(Number(e))}
                  style={styles.numberInput}
                  keyboardType="numeric"
                />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Independence % Threshold</Text>
                <TextInput
                  value={String(independence)}
                  onChangeText={(e) => setIndependence(Number(e))}
                  style={styles.numberInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.fieldLabel}>Auto-Suggestion</Text>
                <Switch
                  value={autoSuggest}
                  onValueChange={() => setAutoSuggest((v) => !v)}
                  trackColor={{ true: '#0284C7', false: '#CBD5E1' }}
                />
                <Text style={styles.fieldHint}>{autoSuggest ? 'On' : 'Off'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            setPromptLevels(levels, consecutive, streamCount);
            showToast('Trial logging format saved successfully', 'success');
          }}
        >
          <Feather name="save" size={15} color={colors.navyText} />
          <Text style={styles.saveBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, gap: 24, paddingBottom: 60 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: 4 },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  headerTitle: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },

  /* Table */
  tableContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: { fontSize: 14, fontWeight: '600', color: '#1A2233' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: '#0284C7', fontSize: 13, fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  tableColHeader: { fontSize: 10, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 8 },
  addingRow: { backgroundColor: 'rgba(34,197,94,0.06)' },
  cellText: { fontSize: 14, fontWeight: '600', color: '#1A2233', textAlign: 'center' },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* Swatches */
  swatchRow: { flexDirection: 'row', gap: 6 },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 2 },
  swatchSelected: { borderColor: '#1A2233', transform: [{ scale: 1.1 }] },
  swatchUnselected: { borderColor: 'transparent' },

  /* Badge */
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'center' },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },

  /* Actions */
  actionRow: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  deleteBtn: { backgroundColor: '#EF4444' },
  cancelBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
  },
  deleteConfirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteConfirmText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },

  /* Live Preview */
  previewContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  previewLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  previewButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  /* Two Column */
  twoCol: { flexDirection: 'row', gap: 16 },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: { ...typography.h3 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#0284C7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  radioLabel: { fontSize: 13, color: '#374151' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  fieldHint: { fontSize: 12, color: '#9CA3AF' },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    width: 60,
  },

  /* Save Button */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
});
