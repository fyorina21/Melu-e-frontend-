// screens/institutionaladmin/ClinicalCategoriesConfigScreen.tsx
// MR-6: Clinical categories CRUD - Programs (ABA / Speech / OT),
// Assessment Types, and Therapy Types. Add, rename, activate/deactivate,
// and remove entries. Frontend-only demo state with API stubs.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getClinicalCategories, saveClinicalCategory, updateClinicalCategory, deleteClinicalCategory } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList, Payload } from '../../types';

interface CategoryItem {
  id: string;
  name: string;
  active: boolean;
}

type CategoryKey = 'programs' | 'assessmentTypes' | 'therapyTypes';

const SECTIONS: { key: CategoryKey; label: string; addPlaceholder: string }[] = [
  { key: 'programs', label: 'Programs', addPlaceholder: 'e.g. ABA Therapy' },
  { key: 'assessmentTypes', label: 'Assessment Types', addPlaceholder: 'e.g. VB-MAPP' },
  { key: 'therapyTypes', label: 'Therapy Types', addPlaceholder: 'e.g. Speech Therapy' },
];

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'ClinicalCategoriesConfig'>;

export default function ClinicalCategoriesConfigScreen({ navigation }: Props) {
  const [lists, setLists] = useState<Record<CategoryKey, CategoryItem[]>>(DEFAULT_LISTS);
  const [activeSection, setActiveSection] = useState<CategoryKey>('programs');
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await getClinicalCategories();
      setLists(data);
    } catch (err) {
      setLists(DEFAULT_LISTS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const name = draft.trim();
    if (!name) return;
    const item: CategoryItem = { id: `local-${Date.now()}`, name, active: true };
    setLists((prev) => ({ ...prev, [activeSection]: [...prev[activeSection], item] }));
    setDraft('');
    try {
      await saveClinicalCategory(activeSection, item as unknown as Payload);
    } catch (err) {}
  };

  const handleRename = async (item: CategoryItem) => {
    const name = editText.trim();
    if (!name) { setEditingId(null); return; }
    setLists((prev) => ({ ...prev, [activeSection]: prev[activeSection].map((i) => (i.id === item.id ? { ...i, name } : i)) }));
    setEditingId(null);
    try {
      await updateClinicalCategory(activeSection, item.id, { name });
    } catch (err) {}
  };

  const handleToggleActive = async (item: CategoryItem) => {
    setLists((prev) => ({ ...prev, [activeSection]: prev[activeSection].map((i) => (i.id === item.id ? { ...i, active: !i.active } : i)) }));
    try {
      await updateClinicalCategory(activeSection, item.id, { active: !item.active });
    } catch (err) {}
  };

  const handleDelete = (item: CategoryItem) => {
    Alert.alert('Remove item?', `"${item.name}" will be removed from ${SECTIONS.find((s) => s.key === activeSection)?.label}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setLists((prev) => ({ ...prev, [activeSection]: prev[activeSection].filter((i) => i.id !== item.id) }));
          try {
            await deleteClinicalCategory(activeSection, item.id);
          } catch (err) {}
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="Programs" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>Clinical Categories</Text><Text style={typography.caption}>MR-6 — programs, assessment types, and therapy types</Text></View>

      <View style={styles.sectionTabs}>
        {SECTIONS.map((s) => (
          <TouchableOpacity key={s.key} style={[styles.sectionTab, activeSection === s.key && styles.sectionTabActive]} onPress={() => setActiveSection(s.key)}>
            <Text style={[typography.bodyBold, activeSection === s.key && { color: colors.navyText }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder={SECTIONS.find((s) => s.key === activeSection)?.addPlaceholder}
              placeholderTextColor={colors.mutedText}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Feather name="plus" size={16} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {lists[activeSection].map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {editingId === item.id ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    value={editText}
                    onChangeText={setEditText}
                    autoFocus
                    placeholder="Item name"
                    placeholderTextColor={colors.mutedText}
                    onSubmitEditing={() => handleRename(item)}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleRename(item)}>
                    <Feather name="check" size={16} color={colors.statusApprovedText} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => setEditingId(null)}>
                    <Feather name="x" size={16} color={colors.mutedText} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{item.name}</Text>
                    <Text style={typography.caption}>{item.active ? 'Active' : 'Inactive'}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => { setEditingId(item.id); setEditText(item.name); }}>
                    <Feather name="edit-2" size={16} color={colors.navyText} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleToggleActive(item)}>
                    <Feather name={item.active ? 'toggle-left' : 'toggle-right'} size={18} color={item.active ? colors.mutedText : colors.statusCompletedText} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(item)}>
                    <Feather name="trash-2" size={16} color={colors.statusRevisionText} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DEFAULT_LISTS: Record<CategoryKey, CategoryItem[]> = {
  programs: [
    { id: 'p1', name: 'ABA Therapy', active: true },
    { id: 'p2', name: 'Speech Therapy', active: true },
    { id: 'p3', name: 'Occupational Therapy', active: true },
  ],
  assessmentTypes: [
    { id: 'a1', name: 'VB-MAPP', active: true },
    { id: 'a2', name: 'ABLLS-R', active: true },
    { id: 'a3', name: 'Assessment of Basic Language (ABLS)', active: true },
    { id: 'a4', name: 'Adaptive Behavior', active: true },
  ],
  therapyTypes: [
    { id: 't1', name: '1:1 ABA Session', active: true },
    { id: 't2', name: 'Speech Language Therapy', active: true },
    { id: 't3', name: 'Group Social Skills', active: true },
    { id: 't4', name: 'Parent Training', active: true },
  ],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  sectionTabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  sectionTab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  sectionTabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.navyText },
  addBtn: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryYellow, alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  editInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, color: colors.navyText },
  iconBtn: { padding: spacing.xs },
});
