// screens/institutionaladmin/AbcDropdownListsScreen.js
// SCR-ADMIN-003: ABC Dropdown List Manager
//
// This is the real config source for the dropdown options currently
// hardcoded in BehaviorIncidentModal.js (Teacher role, MR-33's incident
// modal). Once this has a real backend, that modal should fetch its
// option lists from here instead of the hardcoded arrays.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InstitutionalAdminNav, { IA_ROUTE_BY_TAB } from './components/InstitutionalAdminNav';
import { getAbcLists, saveAbcList, resetAbcListsToDefault } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

const LIST_TYPES = ['Behaviors', 'Antecedents', 'Consequences', 'Locations', 'Frequencies', 'Intensities', 'Categories'];

type AbcListItem = {
  id: string;
  name: string;
  definition?: string;
  category?: string;
  active: boolean;
};

type AbcLists = Record<string, AbcListItem[]>;

function BehaviorFormModal({ visible, item, onClose, onSave }: {
  visible: boolean;
  item: AbcListItem | null | undefined;
  onClose: () => void;
  onSave: (item: AbcListItem) => void;
}) {
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState('');
  useEffect(() => {
    if (item) { setName(item.name); setDefinition(item.definition || ''); setCategory(item.category || ''); }
    else { setName(''); setDefinition(''); setCategory(''); }
  }, [item, visible]);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>{item ? 'Edit Behavior' : 'Add Behavior'}</Text>
          <View style={styles.field}><Text style={typography.label}>Behavior Name</Text><TextInput style={styles.textInput} value={name} onChangeText={setName} /></View>
          <View style={styles.field}><Text style={typography.label}>Definition</Text><TextInput style={[styles.textInput, styles.textArea]} multiline value={definition} onChangeText={setDefinition} /></View>
          <View style={styles.field}><Text style={typography.label}>Default Category</Text><TextInput style={styles.textInput} value={category} onChangeText={setCategory} /></View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (!name.trim() || !definition.trim() || !category.trim()) { Alert.alert('All fields required'); return; }
                onSave({ id: item?.id || `b-${Date.now()}`, name, definition, category, active: true });
              }}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SimpleItemModal({ visible, item, listType, onClose, onSave }: {
  visible: boolean;
  item: AbcListItem | null | undefined;
  listType: string;
  onClose: () => void;
  onSave: (item: AbcListItem) => void;
}) {
  const [name, setName] = useState('');
  useEffect(() => { setName(item?.name || ''); }, [item, visible]);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>{item ? `Edit ${listType.slice(0, -1)}` : `Add ${listType.slice(0, -1)}`}</Text>
          <View style={styles.field}><Text style={typography.label}>Name</Text><TextInput style={styles.textInput} value={name} onChangeText={setName} /></View>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => { if (!name.trim()) { Alert.alert('Name required'); return; } onSave({ id: item?.id || `i-${Date.now()}`, name, active: true }); }}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AbcDropdownListsScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'AbcDropdownLists'>) {
  const [activeList, setActiveList] = useState('Behaviors');
  const [lists, setLists] = useState<AbcLists>({});
  const [editingItem, setEditingItem] = useState<AbcListItem | null | undefined>(undefined); // undefined = closed

  const load = useCallback(async () => {
    try {
      const { data } = await getAbcLists();
      setLists(data);
    } catch (err) {
      setLists(DEMO_LISTS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentItems = lists[activeList] || [];

  const handleSaveItem = async (item: AbcListItem) => {
    const exists = currentItems.some((i) => i.id === item.id);
    const nextItems = exists ? currentItems.map((i) => (i.id === item.id ? item : i)) : [...currentItems, item];
    setLists((prev) => ({ ...prev, [activeList]: nextItems }));
    try { await saveAbcList(activeList, nextItems); } catch (err) {}
    setEditingItem(undefined);
  };

  const handleDeleteItem = (item: AbcListItem) => {
    Alert.alert(`Delete "${item.name}"?`, 'Cannot delete if currently in use.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const nextItems = currentItems.filter((i) => i.id !== item.id);
          setLists((prev) => ({ ...prev, [activeList]: nextItems }));
          try { await saveAbcList(activeList, nextItems); } catch (err) {}
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Reset all lists to default?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { try { await resetAbcListsToDefault(); } catch (err) {} setLists(DEMO_LISTS); } },
    ]);
  };

  const handleSaveAll = () => Alert.alert('Configuration saved');

  return (
    <SafeAreaView style={styles.safe}>
      <InstitutionalAdminNav activeTab="ABC Lists" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}><Text style={typography.h1}>ABC Dropdown List Manager</Text></View>

      <View style={styles.listTabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LIST_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.listTab, activeList === t && styles.listTabActive]} onPress={() => setActiveList(t)}>
              <Text style={typography.body}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={typography.h3}>{activeList}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setEditingItem(null)}>
              <Feather name="plus" size={14} color={colors.navyText} />
              <Text style={styles.addBtnText}>Add {activeList.slice(0, -1)}</Text>
            </TouchableOpacity>
          </View>
          {currentItems.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{item.name}</Text>
                {item.definition && <Text style={typography.caption}>{item.definition}</Text>}
                {item.category && <Text style={typography.caption}>Category: {item.category}</Text>}
              </View>
              <TouchableOpacity onPress={() => setEditingItem(item)}><Feather name="edit-2" size={16} color={colors.navyText} /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteItem(item)}><Feather name="trash-2" size={16} color="#EF4444" /></TouchableOpacity>
            </View>
          ))}
          {currentItems.length === 0 && <Text style={[typography.body, { color: colors.mutedText }]}>No items yet.</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleReset}><Text style={styles.footerBtnText}>Reset to Default</Text></TouchableOpacity>
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSaveAll}><Text style={styles.saveConfigBtnText}>Save Configuration</Text></TouchableOpacity>
      </View>

      {activeList === 'Behaviors' ? (
        <BehaviorFormModal visible={editingItem !== undefined} item={editingItem} onClose={() => setEditingItem(undefined)} onSave={handleSaveItem} />
      ) : (
        <SimpleItemModal visible={editingItem !== undefined} item={editingItem} listType={activeList} onClose={() => setEditingItem(undefined)} onSave={handleSaveItem} />
      )}
    </SafeAreaView>
  );
}

const DEMO_LISTS: AbcLists = {
  Behaviors: [
    { id: 'b1', name: 'Unable to remain seated', definition: 'Student leaves designated seat/area without permission.', category: 'Not sitting still/Hyperactivity', active: true },
    { id: 'b2', name: 'Biting others', definition: 'Student makes contact with teeth against another person\u2019s skin.', category: 'Safety concerns', active: true },
  ],
  Antecedents: [{ id: 'a1', name: 'Demand placed', active: true }, { id: 'a2', name: 'Transition', active: true }],
  Consequences: [{ id: 'c1', name: 'Redirected', active: true }, { id: 'c2', name: 'Ignored', active: true }],
  Locations: [{ id: 'l1', name: 'Therapy Room', active: true }, { id: 'l2', name: 'Playground', active: true }],
  Frequencies: [{ id: 'f1', name: 'Rarely', active: true }, { id: 'f2', name: 'Frequently', active: true }],
  Intensities: [{ id: 'i1', name: 'Mild', active: true }, { id: 'i2', name: 'Severe', active: true }],
  Categories: [{ id: 'cat1', name: 'Attention-seeking', active: true }, { id: 'cat2', name: 'Safety concerns', active: true }],
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTabsRow: { padding: spacing.md, backgroundColor: colors.bgCard },
  listTab: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.xs },
  listTabActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  addBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  footerBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  footerBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  saveConfigBtn: { flex: 2, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
