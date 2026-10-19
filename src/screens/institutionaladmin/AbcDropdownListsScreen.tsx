import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAbcLists, saveAbcList, resetAbcListsToDefault } from '../../api/institutionalAdminApi';
import { useToast } from '../../context/ToastContext';
import {
  usePreventUnsavedNavigation,
  useUnsavedChanges,
} from '../../context/UnsavedChangesContext';
import { confirmAction } from '../../utils/dialogs';
import {
  getStoredAbcLists,
  setStoredAbcLists,
  resetStoredAbcLists,
  type AbcItem,
} from '../../stores/abcListsStore';

type ListTab = 'Behaviors' | 'Antecedents' | 'Consequences' | 'Locations';

export default function AbcDropdownListsScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'AbcDropdownLists'>) {
  const { showToast } = useToast();
  const { setDirty } = useUnsavedChanges();
  const [activeTab, setActiveTab] = useState<ListTab>('Behaviors');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Wire internal navigation guard for unsaved changes
  usePreventUnsavedNavigation(navigation, isDirty);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  // Datasets per tab initialized from abcListsStore
  const [behaviors, setBehaviors] = useState<AbcItem[]>(() => getStoredAbcLists().behaviors);
  const [antecedents, setAntecedents] = useState<AbcItem[]>(() => getStoredAbcLists().antecedents);
  const [consequences, setConsequences] = useState<AbcItem[]>(
    () => getStoredAbcLists().consequences,
  );
  const [locations, setLocations] = useState<AbcItem[]>(() => getStoredAbcLists().locations);

  const toWire = (items: AbcItem[]) =>
    items.map((i) => ({
      id: i.id,
      name: i.name,
      active: i.status === 'Active',
    }));

  const fromWire = (raw: unknown): AbcItem[] =>
    (Array.isArray(raw) ? raw : []).map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? r.label ?? ''),
      status: r.active === false || r.status === 'Inactive' ? 'Inactive' : 'Active',
    }));

  const applyLoaded = useCallback((data: Record<string, unknown>) => {
    if (Array.isArray(data.Behaviors)) setBehaviors(fromWire(data.Behaviors));
    if (Array.isArray(data.Antecedents)) setAntecedents(fromWire(data.Antecedents));
    if (Array.isArray(data.Consequences)) setConsequences(fromWire(data.Consequences));
    if (Array.isArray(data.Locations)) setLocations(fromWire(data.Locations));
  }, []);

  useEffect(() => {
    getAbcLists()
      .then(({ data }) => applyLoaded(data as Record<string, unknown>))
      .catch(() => {});
  }, [applyLoaded]);

  // Inline Add State
  const [addingTab, setAddingTab] = useState<ListTab | null>(null);
  const [newName, setNewName] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  const startEdit = (item: AbcItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditStatus(item.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const startAdd = (tab: ListTab) => {
    setAddingTab(tab);
    setNewName('');
  };

  const cancelAdd = () => {
    setAddingTab(null);
    setNewName('');
  };

  const toggleItemStatus = (tab: ListTab, id: string) => {
    const updater = (prev: AbcItem[]) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: (item.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
            }
          : item,
      );

    if (tab === 'Behaviors') {
      const next = updater(behaviors);
      setBehaviors(next);
      setStoredAbcLists({ behaviors: next });
    } else if (tab === 'Antecedents') {
      const next = updater(antecedents);
      setAntecedents(next);
      setStoredAbcLists({ antecedents: next });
    } else if (tab === 'Consequences') {
      const next = updater(consequences);
      setConsequences(next);
      setStoredAbcLists({ consequences: next });
    } else if (tab === 'Locations') {
      const next = updater(locations);
      setLocations(next);
      setStoredAbcLists({ locations: next });
    }

    setIsDirty(true);
    showToast('Status toggled — remember to save changes', 'info');
  };

  const commitAdd = (list: AbcItem[], setList: React.Dispatch<React.SetStateAction<AbcItem[]>>) => {
    if (!newName.trim()) return;
    const newItem: AbcItem = {
      id: Date.now().toString(),
      name: newName.trim(),
      status: 'Active',
    };
    const next = [...list, newItem];
    setList(next);
    if (activeTab === 'Behaviors') setStoredAbcLists({ behaviors: next });
    else if (activeTab === 'Antecedents') setStoredAbcLists({ antecedents: next });
    else if (activeTab === 'Consequences') setStoredAbcLists({ consequences: next });
    else if (activeTab === 'Locations') setStoredAbcLists({ locations: next });

    setIsDirty(true);
    showToast('Item added', 'info');
    cancelAdd();
  };

  const commitEdit = (
    list: AbcItem[],
    setList: React.Dispatch<React.SetStateAction<AbcItem[]>>,
  ) => {
    if (!editName.trim() || !editingId) return;
    const next = list.map((i) =>
      i.id === editingId
        ? {
            ...i,
            name: editName.trim(),
            status: editStatus,
          }
        : i,
    );
    setList(next);
    if (activeTab === 'Behaviors') setStoredAbcLists({ behaviors: next });
    else if (activeTab === 'Antecedents') setStoredAbcLists({ antecedents: next });
    else if (activeTab === 'Consequences') setStoredAbcLists({ consequences: next });
    else if (activeTab === 'Locations') setStoredAbcLists({ locations: next });

    setIsDirty(true);
    showToast('Item updated', 'info');
    setEditingId(null);
  };

  const handleDeleteItem = (tab: ListTab, id: string) => {
    let list: AbcItem[] = [];
    let setList: React.Dispatch<React.SetStateAction<AbcItem[]>> = () => {};

    if (tab === 'Behaviors') {
      list = behaviors;
      setList = setBehaviors;
    } else if (tab === 'Antecedents') {
      list = antecedents;
      setList = setAntecedents;
    } else if (tab === 'Consequences') {
      list = consequences;
      setList = setConsequences;
    } else if (tab === 'Locations') {
      list = locations;
      setList = setLocations;
    }

    const item = list.find((i) => i.id === id);
    const label = item?.name || 'this item';
    const singular = tab.replace(/s$/, '');

    confirmAction({
      title: `Delete ${singular}`,
      message: `Are you sure you want to remove "${label}" from ABC dropdown lists?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => {
        const next = list.filter((i) => i.id !== id);
        setList(next);
        if (tab === 'Behaviors') setStoredAbcLists({ behaviors: next });
        else if (tab === 'Antecedents') setStoredAbcLists({ antecedents: next });
        else if (tab === 'Consequences') setStoredAbcLists({ consequences: next });
        else if (tab === 'Locations') setStoredAbcLists({ locations: next });

        setIsDirty(true);
        showToast(`${singular} "${label}" removed`, 'info');
      },
    });
  };

  const handleResetToDefault = () => {
    confirmAction({
      title: 'Reset ABC Dropdown Lists',
      message:
        'Are you sure you want to restore the default ABC dropdown items? All customized behaviors, antecedents, consequences, and locations will be reverted.',
      confirmLabel: 'Reset to Default',
      destructive: true,
      onConfirm: async () => {
        setSaving(true);
        try {
          try {
            await resetAbcListsToDefault();
          } catch {}
          const resetData = resetStoredAbcLists();
          setBehaviors(resetData.behaviors);
          setAntecedents(resetData.antecedents);
          setConsequences(resetData.consequences);
          setLocations(resetData.locations);
          setIsDirty(false);
          showToast('ABC lists reset to defaults', 'success');
        } catch (err) {
          showToast('Failed to reset ABC lists', 'error');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    try {
      setStoredAbcLists({ behaviors, antecedents, consequences, locations });
      try {
        await Promise.all([
          saveAbcList('Behaviors', toWire(behaviors)),
          saveAbcList('Antecedents', toWire(antecedents)),
          saveAbcList('Consequences', toWire(consequences)),
          saveAbcList('Locations', toWire(locations)),
        ]);
      } catch (apiErr) {
        console.warn('API save warning:', apiErr);
      }
      setIsDirty(false);
      showToast('Configuration saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderTable = (
    tab: ListTab,
    columnHeader: string,
    list: AbcItem[],
    setList: React.Dispatch<React.SetStateAction<AbcItem[]>>,
    emptyIcon: 'activity' | 'zap' | 'shield' | 'map-pin',
    emptyLabel: string,
    emptySubLabel: string,
  ) => {
    return (
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 6 }]}>{columnHeader}</Text>
          <Text style={[styles.th, { flex: 3 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 3, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {list.map((item) =>
          editingId === item.id ? (
            <View key={item.id} style={styles.tableRow}>
              <View style={{ flex: 6, paddingRight: 12 }}>
                <TextInput
                  style={styles.tableInput}
                  value={editName}
                  onChangeText={setEditName}
                  onSubmitEditing={() => commitEdit(list, setList)}
                  autoFocus
                  placeholder={columnHeader}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 3 }}>
                <TouchableOpacity
                  style={
                    editStatus === 'Active' ? styles.statusActiveBadge : styles.statusInactiveBadge
                  }
                  onPress={() =>
                    setEditStatus((prev) => (prev === 'Active' ? 'Inactive' : 'Active'))
                  }
                >
                  <Text
                    style={
                      editStatus === 'Active' ? styles.statusActiveText : styles.statusInactiveText
                    }
                  >
                    {editStatus}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  onPress={() => commitEdit(list, setList)}
                  style={{ marginRight: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Save edit"
                >
                  <Feather name="check" size={16} color="#22C55E" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cancelEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel edit"
                >
                  <Feather name="x" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.cellTextBold, { flex: 6 }]}>{item.name}</Text>
              <View style={{ flex: 3 }}>
                <TouchableOpacity
                  style={
                    item.status === 'Active' ? styles.statusActiveBadge : styles.statusInactiveBadge
                  }
                  onPress={() => toggleItemStatus(tab, item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Status: ${item.status}. Click to toggle for ${item.name}`}
                >
                  <Text
                    style={
                      item.status === 'Active' ? styles.statusActiveText : styles.statusInactiveText
                    }
                  >
                    {item.status}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actionsCol}>
                <TouchableOpacity
                  style={{ marginRight: 12 }}
                  onPress={() => toggleItemStatus(tab, item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle active status for ${item.name}`}
                >
                  <Feather
                    name={item.status === 'Active' ? 'toggle-right' : 'toggle-left'}
                    size={20}
                    color={item.status === 'Active' ? '#10B981' : '#94A3B8'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 12 }}
                  onPress={() => startEdit(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                >
                  <Feather name="edit-2" size={15} color="#0284C7" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteItem(tab, item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                >
                  <Feather name="trash-2" size={15} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          ),
        )}

        {list.length === 0 && addingTab !== tab && (
          <View style={styles.emptyTableState}>
            <Feather name={emptyIcon} size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyTableText}>{emptyLabel}</Text>
            <Text style={styles.emptyTableSubText}>{emptySubLabel}</Text>
          </View>
        )}

        {/* Inline Add Row */}
        {addingTab === tab && (
          <View key="add-row" style={styles.tableRow}>
            <View style={{ flex: 6, paddingRight: 12 }}>
              <TextInput
                style={styles.tableInput}
                placeholder={`New ${columnHeader.toLowerCase()}`}
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={() => commitAdd(list, setList)}
                autoFocus
              />
            </View>
            <View style={{ flex: 3 }}>
              <View style={styles.statusActiveBadge}>
                <Text style={styles.statusActiveText}>Active</Text>
              </View>
            </View>
            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={{ marginRight: 12 }}
                onPress={() => commitAdd(list, setList)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Confirm add"
              >
                <Feather name="check" size={16} color="#22C55E" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelAdd}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Cancel add"
              >
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="ABC Lists"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Description */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainTitle}>ABC Dropdown Lists</Text>
          <Text style={styles.subtitle}>
            Manage behavior, antecedent, consequence, and location options
          </Text>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          {(['Behaviors', 'Antecedents', 'Consequences', 'Locations'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab(tab);
                setAddingTab(null);
                setEditingId(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${tab} tab`}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Card Table */}
        <View style={styles.card}>
          {activeTab === 'Behaviors' &&
            renderTable(
              'Behaviors',
              'BEHAVIOR NAME',
              behaviors,
              setBehaviors,
              'activity',
              'No behaviors configured yet.',
              'Click "+ Add Behavior" below to define target or interfering behaviors.',
            )}

          {activeTab === 'Antecedents' &&
            renderTable(
              'Antecedents',
              'ANTECEDENT NAME',
              antecedents,
              setAntecedents,
              'zap',
              'No antecedents configured yet.',
              'Click "+ Add Antecedent" below to define trigger events.',
            )}

          {activeTab === 'Consequences' &&
            renderTable(
              'Consequences',
              'CONSEQUENCE NAME',
              consequences,
              setConsequences,
              'shield',
              'No consequences configured yet.',
              'Click "+ Add Consequence" below to define response interventions.',
            )}

          {activeTab === 'Locations' &&
            renderTable(
              'Locations',
              'LOCATION NAME',
              locations,
              setLocations,
              'map-pin',
              'No locations configured yet.',
              'Click "+ Add Location" below to define classroom or clinic settings.',
            )}
        </View>

        {/* Add Item Link Button */}
        {addingTab !== activeTab && (
          <TouchableOpacity
            style={styles.addInlineBtn}
            onPress={() => startAdd(activeTab)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${activeTab.replace(/s$/, '')}`}
          >
            <Feather name="plus" size={14} color="#0284C7" />
            <Text style={styles.addInlineBtnText}>Add {activeTab.replace(/s$/, '')}</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Action Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.saveConfigBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveConfiguration}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Save ABC configuration"
          >
            <Feather name="save" size={14} color="#0F172A" />
            <Text style={styles.saveConfigBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetBtn, saving && { opacity: 0.5 }]}
            onPress={handleResetToDefault}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Reset ABC dropdown lists to defaults"
          >
            <Feather name="refresh-cw" size={14} color="#EF4444" />
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 24, paddingBottom: 60 },

  topHeader: { marginBottom: 16 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  breadcrumbTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  breadcrumbText: { fontSize: 12, color: '#64748B' },

  pageHeader: { marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },

  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#38BDF8',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0284C7',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  table: { width: '100%' },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  cellTextBold: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  statusActiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusActiveText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  statusInactiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusInactiveText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  actionsCol: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  tableInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
  },

  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-start',
    gap: 6,
  },
  addInlineBtnText: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '600',
  },

  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FACC15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  saveBtnDisabled: { opacity: 0.6 },
  emptyTableState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  emptyTableSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
