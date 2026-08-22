import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/colors';

interface PromptLevel {
  id: string;
  name: string;
  color: string;
  order: number;
  status: 'Active' | 'Inactive';
}

const COLOR_PALETTE = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

export default function TrialLoggingFormatScreen() {
  const [prompts, setPrompts] = useState<PromptLevel[]>([
    { id: '1', name: 'FP', color: '#EF4444', order: 1, status: 'Active' },
    { id: '2', name: 'PP', color: '#F97316', order: 2, status: 'Active' },
    { id: '3', name: 'G', color: '#3B82F6', order: 3, status: 'Active' },
    { id: '4', name: '+', color: '#22C55E', order: 4, status: 'Active' },
  ]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editOrder, setEditOrder] = useState('');

  // Adding state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#EF4444');
  const [newOrder, setNewOrder] = useState('5');

  // Layout & Mastery state
  const [selectedLayout, setSelectedLayout] = useState<'Horizontal' | 'Vertical' | 'Card Grid'>('Horizontal');
  const [trialStreamCount, setTrialStreamCount] = useState('5');
  const [consecutiveTrials, setConsecutiveTrials] = useState('5');
  const [independenceThreshold, setIndependenceThreshold] = useState('80');
  const [autoSuggestion, setAutoSuggestion] = useState(true);

  // Edit Handlers
  const handleStartEdit = (p: PromptLevel) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
    setEditOrder(p.order.toString());
  };

  const handleSaveEdit = (id: string) => {
    setPrompts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: editName, color: editColor, order: Number(editOrder) || item.order }
          : item
      )
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  // Add Handlers
  const handleStartAdd = () => {
    setIsAdding(true);
    setNewName('');
    setNewColor('#EF4444');
    setNewOrder((prompts.length + 1).toString());
  };

  const handleSaveAdd = () => {
    if (!newName.trim()) return;
    const newEntry: PromptLevel = {
      id: Date.now().toString(),
      name: newName.trim(),
      color: newColor,
      order: Number(newOrder) || prompts.length + 1,
      status: 'Active',
    };
    setPrompts([...prompts, newEntry]);
    setIsAdding(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.mainTitle}>Trial Logging Format</Text>
            <Text style={styles.subtitle}>
              SCR-ADMIN-002 · Configure prompt levels, trial layout, and mastery criteria
            </Text>
          </View>
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>SCR-ADMIN-002</Text>
          </View>
        </View>

        {/* Card 1: Prompt Levels Table */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Prompt Levels</Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleStartAdd}>
              <Feather name="plus" size={14} color="#0284C7" />
              <Text style={styles.addBtnText}>Add Prompt Level</Text>
            </TouchableOpacity>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 2 }]}>NAME</Text>
              <Text style={[styles.th, { flex: 3 }]}>COLOR</Text>
              <Text style={[styles.th, { flex: 2 }]}>ORDER</Text>
              <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
            </View>

            {prompts.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <View key={item.id} style={styles.tableRow}>
                  {/* Name */}
                  <View style={{ flex: 2 }}>
                    {isEditing ? (
                      <TextInput
                        style={styles.cellInput}
                        value={editName}
                        onChangeText={setEditName}
                        autoFocus
                      />
                    ) : (
                      <Text style={styles.cellTextBold}>{item.name}</Text>
                    )}
                  </View>

                  {/* Color Selector */}
                  <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {isEditing ? (
                      COLOR_PALETTE.map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setEditColor(c)}
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: c },
                            editColor === c && styles.colorSwatchSelected,
                          ]}
                        />
                      ))
                    ) : (
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    )}
                  </View>

                  {/* Order */}
                  <View style={{ flex: 2 }}>
                    {isEditing ? (
                      <TextInput
                        style={[styles.cellInput, { width: 50 }]}
                        value={editOrder}
                        onChangeText={setEditOrder}
                        keyboardType="numeric"
                      />
                    ) : (
                      <Text style={styles.cellText}>{item.order}</Text>
                    )}
                  </View>

                  {/* Status */}
                  <View style={{ flex: 2 }}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{item.status}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                    {isEditing ? (
                      <>
                        <TouchableOpacity onPress={() => handleSaveEdit(item.id)} style={styles.iconBtnCheck}>
                          <Feather name="check" size={16} color="#0284C7" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCancelEdit}>
                          <Feather name="x" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handleStartEdit(item)}>
                          <Feather name="edit-2" size={15} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                          <Feather name="trash-2" size={15} color="#F87171" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Adding Row */}
            {isAdding && (
              <View style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <TextInput
                    style={styles.cellInput}
                    placeholder="Name"
                    value={newName}
                    onChangeText={setNewName}
                    autoFocus
                  />
                </View>
                <View style={{ flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {COLOR_PALETTE.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        newColor === c && styles.colorSwatchSelected,
                      ]}
                    />
                  ))}
                </View>
                <View style={{ flex: 2 }}>
                  <TextInput
                    style={[styles.cellInput, { width: 50 }]}
                    value={newOrder}
                    onChangeText={setNewOrder}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                </View>
                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                  <TouchableOpacity onPress={handleSaveAdd}>
                    <Feather name="check" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsAdding(false)}>
                    <Feather name="x" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Card 2: Live Preview */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LIVE PREVIEW</Text>
          <View style={styles.livePreviewRow}>
            {prompts.map((p) => (
              <View key={p.id} style={[styles.previewChip, { backgroundColor: p.color }]}>
                <Text style={styles.previewChipText}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Row: Trial Stream Layout & Mastery Criteria */}
        <View style={styles.bottomGrid}>
          {/* Trial Stream Layout */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Trial Stream Layout</Text>
            <View style={{ gap: 10, marginTop: 12 }}>
              {(['Horizontal', 'Vertical', 'Card Grid'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={styles.radioOption}
                  onPress={() => setSelectedLayout(mode)}
                >
                  <View style={[styles.radioCircle, selectedLayout === mode && styles.radioCircleActive]}>
                    {selectedLayout === mode && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioText}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Trial Stream Count (3–20)</Text>
            <TextInput
              style={styles.numberInput}
              value={trialStreamCount}
              onChangeText={setTrialStreamCount}
              keyboardType="numeric"
            />
          </View>

          {/* Mastery Criteria */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>Mastery Criteria</Text>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Consecutive Trials</Text>
            <TextInput
              style={styles.numberInput}
              value={consecutiveTrials}
              onChangeText={setConsecutiveTrials}
              keyboardType="numeric"
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Independence % Threshold</Text>
            <TextInput
              style={styles.numberInput}
              value={independenceThreshold}
              onChangeText={setIndependenceThreshold}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Auto-Suggestion</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch
                  value={autoSuggestion}
                  onValueChange={setAutoSuggestion}
                  trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                  thumbColor="#FFFFFF"
                />
                <Text style={styles.switchStatusText}>{autoSuggestion ? 'On' : 'Off'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Save Configuration Button */}
        <TouchableOpacity style={styles.saveBtn}>
          <Feather name="save" size={16} color="#0F172A" />
          <Text style={styles.saveBtnText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: spacing.lg, gap: 16 },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  mainTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  topBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topBadgeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 13, color: '#0284C7', fontWeight: '600' },

  table: { width: '100%' },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cellTextBold: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  cellText: { fontSize: 14, color: '#334155' },
  cellInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },

  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorSwatch: { width: 16, height: 16, borderRadius: 8 },
  colorSwatchSelected: { borderWidth: 2, borderColor: '#0F172A' },

  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },

  iconBtnCheck: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 6,
    padding: 2,
  },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  livePreviewRow: { flexDirection: 'row', gap: 10 },
  previewChip: {
    minWidth: 40,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  previewChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  bottomGrid: { flexDirection: 'row', gap: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: '#0284C7' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0284C7' },
  radioText: { fontSize: 13, color: '#0F172A' },

  fieldLabel: { fontSize: 12, color: '#475569', marginBottom: 6 },
  numberInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    width: 100,
    fontSize: 13,
    color: '#0F172A',
  },

  switchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchStatusText: { fontSize: 13, color: '#475569' },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
});