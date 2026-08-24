import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAbcLists, saveAbcList, resetAbcListsToDefault } from '../../api/institutionalAdminApi';
import { useToast } from '../../context/ToastContext';

type ListTab = 'Behaviors' | 'Antecedents' | 'Consequences' | 'Locations';

interface AbcItem {
  id: string;
  name: string;
  definition?: string;
  category?: string;
  type?: string;
  status: 'Active' | 'Inactive';
}

const CATEGORY_OPTIONS = ['Physical', 'Safety', 'Verbal', 'Social'];

export default function AbcDropdownListsScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'AbcDropdownLists'>) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ListTab>('Behaviors');
  const [saving, setSaving] = useState(false);

  // Demo datasets per tab matching screenshots
  const [behaviors, setBehaviors] = useState<AbcItem[]>([
    {
      id: 'b1',
      name: 'Self-Injurious Behavior',
      definition: 'Any behavior that causes harm to self',
      category: 'Physical',
      status: 'Active',
    },
    {
      id: 'b2',
      name: 'Aggression',
      definition: 'Physical or verbal acts directed toward others',
      category: 'Physical',
      status: 'Active',
    },
    {
      id: 'b3',
      name: 'Elopement',
      definition: 'Leaving designated area without permission',
      category: 'Safety',
      status: 'Active',
    },
  ]);

  const [antecedents, setAntecedents] = useState<AbcItem[]>([
    { id: 'a1', name: 'Task demand', type: 'Academic', status: 'Active' },
    { id: 'a2', name: 'Transition', type: 'Environmental', status: 'Active' },
    { id: 'a3', name: 'Denial of access', type: 'Social', status: 'Active' },
    { id: 'a4', name: 'Unstructured time', type: 'Environmental', status: 'Active' },
  ]);

  const [consequences, setConsequences] = useState<AbcItem[]>([
    { id: 'c1', name: 'Escape task', type: 'Negative Reinforcement', status: 'Active' },
    { id: 'c2', name: 'Attention', type: 'Positive Reinforcement', status: 'Active' },
    { id: 'c3', name: 'Tangible item', type: 'Positive Reinforcement', status: 'Active' },
  ]);

  const [locations, setLocations] = useState<AbcItem[]>([
    { id: 'l1', name: 'Classroom A', status: 'Active' },
    { id: 'l2', name: 'Therapy Room 1', status: 'Active' },
    { id: 'l3', name: 'Outdoor Area', status: 'Active' },
    { id: 'l4', name: 'Sensory Room', status: 'Inactive' },
  ]);

  const toWire = (items: AbcItem[]) =>
    items.map((i) => ({
      id: i.id,
      name: i.name,
      ...(i.definition ? { definition: i.definition } : {}),
      ...(i.category ? { category: i.category } : {}),
      ...(i.type ? { type: i.type } : {}),
      active: i.status === 'Active',
    }));

  const fromWire = (raw: unknown): AbcItem[] =>
    (Array.isArray(raw) ? raw : []).map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      definition: r.definition as string | undefined,
      category: r.category as string | undefined,
      type: r.type as string | undefined,
      status: r.active === false ? 'Inactive' : 'Active',
    }));

  const applyLoaded = useCallback(
    (data: Record<string, unknown>) => {
      if (Array.isArray(data.Behaviors)) setBehaviors(fromWire(data.Behaviors));
      if (Array.isArray(data.Antecedents)) setAntecedents(fromWire(data.Antecedents));
      if (Array.isArray(data.Consequences)) setConsequences(fromWire(data.Consequences));
      if (Array.isArray(data.Locations)) setLocations(fromWire(data.Locations));
    },
    []
  );

  useEffect(() => {
    getAbcLists()
      .then(({ data }) => applyLoaded(data as Record<string, unknown>))
      .catch(() => {});
  }, [applyLoaded]);

  // Inline Add State (Behaviors tab)
  const [isAddingBehavior, setIsAddingBehavior] = useState(false);
  const [newBehaviorName, setNewBehaviorName] = useState('');
  const [newBehaviorDefinition, setNewBehaviorDefinition] = useState('');
  const [newBehaviorCategory, setNewBehaviorCategory] = useState('Physical');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Add behavior logic
  const handleSaveNewBehavior = () => {
    if (!newBehaviorName.trim()) return;
    const newItem: AbcItem = {
      id: Date.now().toString(),
      name: newBehaviorName.trim(),
      definition: newBehaviorDefinition.trim(),
      category: newBehaviorCategory,
      status: 'Active',
    };
    setBehaviors([...behaviors, newItem]);
    showToast('Behavior added — press Save Changes to persist', 'info');
    setIsAddingBehavior(false);
    setNewBehaviorName('');
    setNewBehaviorDefinition('');
    setNewBehaviorCategory('Physical');
  };

  const handleCancelAddBehavior = () => {
    setIsAddingBehavior(false);
    setCategoryDropdownOpen(false);
  };

  const handleDeleteBehavior = (id: string) => {
    setBehaviors((prev) => prev.filter((item) => item.id !== id));
    showToast('Behavior removed — press Save Changes to persist', 'info');
  };

  const handleDeleteAntecedent = (id: string) => {
    setAntecedents((prev) => prev.filter((item) => item.id !== id));
    showToast('Antecedent removed — press Save Changes to persist', 'info');
  };

  const handleDeleteConsequence = (id: string) => {
    setConsequences((prev) => prev.filter((item) => item.id !== id));
    showToast('Consequence removed — press Save Changes to persist', 'info');
  };

  const handleDeleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((item) => item.id !== id));
    showToast('Location removed — press Save Changes to persist', 'info');
  };

  const handleResetToDefault = async () => {
    try {
      await resetAbcListsToDefault();
      const { data } = await getAbcLists();
      applyLoaded(data as Record<string, unknown>);
      showToast('ABC lists reset to defaults', 'success');
    } catch (err) {
      showToast('Failed to reset ABC lists', 'error');
    }
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveAbcList('Behaviors', toWire(behaviors)),
        saveAbcList('Antecedents', toWire(antecedents)),
        saveAbcList('Consequences', toWire(consequences)),
        saveAbcList('Locations', toWire(locations)),
      ]);
      showToast('Configuration saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="ABC Lists" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sub Header / Breadcrumb */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
              <Feather name="arrow-left" size={16} color="#334155" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbTitle}>ABC Dropdown Lists</Text>
          </View>
          <View style={styles.breadcrumbRow}>
            <Feather name="settings" size={12} color="#64748B" />
            <Text style={styles.breadcrumbText}> Clinical Configuration / ABC Dropdown Lists</Text>
          </View>
        </View>

        {/* Page Description */}
        <View style={styles.pageHeader}>
          <Text style={styles.mainTitle}>ABC Dropdown Lists</Text>
          <Text style={styles.subtitle}>
            SCR-ADMIN-003 · Manage behavior, antecedent, consequence, and location options
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
                setIsAddingBehavior(false);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dynamic Card Table */}
        <View style={styles.card}>
          {/* TAB 1: BEHAVIORS */}
          {activeTab === 'Behaviors' && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 3 }]}>BEHAVIOR NAME</Text>
                <Text style={[styles.th, { flex: 4 }]}>DEFINITION</Text>
                <Text style={[styles.th, { flex: 2 }]}>CATEGORY</Text>
                <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
              </View>

              {behaviors.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cellTextBold, { flex: 3 }]}>{item.name}</Text>
                  <Text style={[styles.cellText, { flex: 4 }]}>{item.definition}</Text>
                  <Text style={[styles.cellText, { flex: 2 }]}>{item.category}</Text>
                  <View style={{ flex: 2 }}>
                    <View style={styles.statusActiveBadge}>
                      <Text style={styles.statusActiveText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity style={{ marginRight: 10 }}>
                      <Feather name="edit-2" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteBehavior(item.id)}>
                      <Feather name="trash-2" size={15} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Inline Add Row */}
              {isAddingBehavior && (
                <View style={[styles.tableRow, { zIndex: 100 }]}>
                  <View style={{ flex: 3, paddingRight: 8 }}>
                    <TextInput
                      style={styles.tableInput}
                      placeholder="Behavior name"
                      placeholderTextColor="#94A3B8"
                      value={newBehaviorName}
                      onChangeText={setNewBehaviorName}
                      autoFocus
                    />
                  </View>
                  <View style={{ flex: 4, paddingRight: 8 }}>
                    <TextInput
                      style={styles.tableInput}
                      placeholder="Definition"
                      placeholderTextColor="#94A3B8"
                      value={newBehaviorDefinition}
                      onChangeText={setNewBehaviorDefinition}
                    />
                  </View>
                  <View style={{ flex: 2, paddingRight: 8, zIndex: 100 }}>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    >
                      <Text style={styles.dropdownText}>{newBehaviorCategory}</Text>
                      <Feather name="chevron-down" size={14} color="#0F172A" />
                    </TouchableOpacity>

                    {categoryDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            style={[
                              styles.dropdownItem,
                              newBehaviorCategory === cat && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                              setNewBehaviorCategory(cat);
                              setCategoryDropdownOpen(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{cat}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 2 }}>
                    <View style={styles.statusActiveBadge}>
                      <Text style={styles.statusActiveText}>Active</Text>
                    </View>
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity onPress={handleSaveNewBehavior} style={{ marginRight: 10 }}>
                      <Feather name="check" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelAddBehavior}>
                      <Feather name="x" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: ANTECEDENTS */}
          {activeTab === 'Antecedents' && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 4 }]}>NAME</Text>
                <Text style={[styles.th, { flex: 3 }]}>TYPE</Text>
                <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {antecedents.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cellTextBold, { flex: 4 }]}>{item.name}</Text>
                  <Text style={[styles.cellText, { flex: 3 }]}>{item.type}</Text>
                  <View style={{ flex: 2 }}>
                    <View style={styles.statusActiveBadge}>
                      <Text style={styles.statusActiveText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity style={{ marginRight: 10 }}>
                      <Feather name="edit-2" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAntecedent(item.id)}>
                      <Feather name="trash-2" size={15} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: CONSEQUENCES */}
          {activeTab === 'Consequences' && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 4 }]}>NAME</Text>
                <Text style={[styles.th, { flex: 3 }]}>TYPE</Text>
                <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {consequences.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cellTextBold, { flex: 4 }]}>{item.name}</Text>
                  <Text style={[styles.cellText, { flex: 3 }]}>{item.type}</Text>
                  <View style={{ flex: 2 }}>
                    <View style={styles.statusActiveBadge}>
                      <Text style={styles.statusActiveText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity style={{ marginRight: 10 }}>
                      <Feather name="edit-2" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteConsequence(item.id)}>
                      <Feather name="trash-2" size={15} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 4: LOCATIONS */}
          {activeTab === 'Locations' && (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 5 }]}>LOCATION NAME</Text>
                <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>ACTIONS</Text>
              </View>
              {locations.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cellTextBold, { flex: 5 }]}>{item.name}</Text>
                  <View style={{ flex: 2 }}>
                    {item.status === 'Active' ? (
                      <View style={styles.statusActiveBadge}>
                        <Text style={styles.statusActiveText}>Active</Text>
                      </View>
                    ) : (
                      <Text style={styles.statusInactiveText}>Inactive</Text>
                    )}
                  </View>
                  <View style={styles.actionsCol}>
                    <TouchableOpacity style={{ marginRight: 10 }}>
                      <Feather name="edit-2" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteLocation(item.id)}>
                      <Feather name="trash-2" size={15} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Behavior Link Button */}
        {activeTab === 'Behaviors' && !isAddingBehavior && (
          <TouchableOpacity
            style={styles.addInlineBtn}
            onPress={() => setIsAddingBehavior(true)}
          >
            <Feather name="plus" size={14} color="#0284C7" />
            <Text style={styles.addInlineBtnText}>Add Behavior</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Action Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={[styles.saveConfigBtn, saving && styles.saveBtnDisabled]} onPress={handleSaveConfiguration} disabled={saving}>
            <Feather name="save" size={14} color="#0F172A" />
            <Text style={styles.saveConfigBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetToDefault}>
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
    overflow: 'visible',
  },

  table: { width: '100%' },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },

  cellTextBold: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  cellText: { fontSize: 13, color: '#334155' },

  statusActiveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActiveText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  statusInactiveText: { fontSize: 13, color: '#64748B' },

  actionsCol: {
    flex: 2,
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

  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: { fontSize: 13, color: '#0F172A' },
  dropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#BAE6FD',
  },
  dropdownItemText: {
    fontSize: 13,
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
});