import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getAbcLists, saveAbcList, resetAbcListsToDefault } from '../../api/institutionalAdminApi';
import { useToast } from '../../context/ToastContext';
import { colors, radius, spacing, shadows } from '../../theme';
import { typography } from '../../theme/typography';
import { Button, Tabs } from '../../shared/components';
import { type AbcItem, type ListTab } from './abcTypes';
import { AbcTable } from './components/AbcTable';

const TABS: { id: ListTab; label: string }[] = [
  { id: 'Behaviors', label: 'Behaviors' },
  { id: 'Antecedents', label: 'Antecedents' },
  { id: 'Consequences', label: 'Consequences' },
  { id: 'Locations', label: 'Locations' },
];

export default function AbcDropdownListsScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'AbcDropdownLists'>) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ListTab>('Behaviors');
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Datasets per tab
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

  const applyLoaded = useCallback((data: Record<string, unknown>) => {
    if (Array.isArray(data.Behaviors)) setBehaviors(fromWire(data.Behaviors));
    if (Array.isArray(data.Antecedents)) setAntecedents(fromWire(data.Antecedents));
    if (Array.isArray(data.Consequences)) setConsequences(fromWire(data.Consequences));
    if (Array.isArray(data.Locations)) setLocations(fromWire(data.Locations));
  }, []);

  useEffect(() => {
    getAbcLists()
      .then(({ data }) => applyLoaded(data as Record<string, unknown>))
      .catch((err) => {
        console.warn('Failed to load ABC lists from server:', err);
        showToast('Unable to load ABC lists from server, using default lists', 'info');
      });
  }, [applyLoaded, showToast]);

  const toggleItemStatus = (id: string) => {
    const updater = (prev: AbcItem[]) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: (item.status === 'Active' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
            }
          : item,
      );

    if (activeTab === 'Behaviors') setBehaviors(updater);
    else if (activeTab === 'Antecedents') setAntecedents(updater);
    else if (activeTab === 'Consequences') setConsequences(updater);
    else if (activeTab === 'Locations') setLocations(updater);

    showToast('Status toggled — press Save Changes to persist', 'info');
  };

  const handleDeleteItem = (id: string) => {
    const updater = (prev: AbcItem[]) => prev.filter((item) => item.id !== id);
    if (activeTab === 'Behaviors') setBehaviors(updater);
    else if (activeTab === 'Antecedents') setAntecedents(updater);
    else if (activeTab === 'Consequences') setConsequences(updater);
    else if (activeTab === 'Locations') setLocations(updater);
    showToast('Item removed — press Save Changes to persist', 'info');
  };

  const handleResetToDefault = async () => {
    try {
      await resetAbcListsToDefault();
      const { data } = await getAbcLists();
      applyLoaded(data as Record<string, unknown>);
      showToast('ABC lists reset to defaults', 'success');
      setShowResetModal(false);
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Failed to reset ABC lists';
      showToast(msg, 'error');
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
    } catch (err: unknown) {
      console.error('Failed to save ABC lists configuration:', err);
      const msg = (err as Error)?.message || 'Failed to save ABC lists configuration';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentItems =
    activeTab === 'Behaviors'
      ? behaviors
      : activeTab === 'Antecedents'
        ? antecedents
        : activeTab === 'Consequences'
          ? consequences
          : locations;

  const handleItemsUpdate = (newItems: AbcItem[]) => {
    if (activeTab === 'Behaviors') setBehaviors(newItems);
    else if (activeTab === 'Antecedents') setAntecedents(newItems);
    else if (activeTab === 'Consequences') setConsequences(newItems);
    else if (activeTab === 'Locations') setLocations(newItems);
    showToast('Updated — press Save Changes to persist', 'info');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="ABC Lists"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header & Breadcrumb */}
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
              <Feather name="arrow-left" size={16} color={colors.navyText} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbTitle}>ABC Dropdown Lists</Text>
          </View>
          <View style={styles.breadcrumbRow}>
            <Feather name="settings" size={12} color={colors.mutedText} />
            <Text style={styles.breadcrumbText}> Clinical Configuration / ABC Dropdown Lists</Text>
          </View>
        </View>

        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h1}>ABC Dropdown Lists</Text>
            <Text style={[typography.caption, { marginTop: 4 }]}>
              SCR-ADMIN-003 · Manage behavior, antecedent, consequence, and location options
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Button
              label="Reset Defaults"
              variant="outline"
              size="sm"
              onPress={() => setShowResetModal(true)}
            />
            <Button
              label={saving ? 'Saving...' : 'Save Changes'}
              variant="primary"
              size="sm"
              loading={saving}
              disabled={saving}
              onPress={handleSaveConfiguration}
            />
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsWrapper}>
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
            variant="pills"
          />
        </View>

        {/* Dynamic Card Table */}
        <View style={styles.card}>
          <AbcTable
            tab={activeTab}
            items={currentItems}
            onUpdate={handleItemsUpdate}
            onDeleteItem={handleDeleteItem}
            onStatusToggle={toggleItemStatus}
          />
        </View>
      </ScrollView>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={typography.h2}>Reset ABC Lists to Defaults?</Text>
            <Text style={[typography.body, { marginVertical: spacing.md }]}>
              This will overwrite custom modifications with standard ABA clinical defaults. Existing
              student observations referencing deleted values will remain intact.
            </Text>
            <View style={styles.modalFooter}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onPress={() => setShowResetModal(false)}
              />
              <Button
                label="Confirm Reset"
                variant="danger"
                size="sm"
                onPress={handleResetToDefault}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  scrollContent: { padding: spacing.xl, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  topHeader: { marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 13, color: colors.bodyText, fontWeight: '600' },
  breadcrumbTitle: { fontSize: 14, fontWeight: '700', color: colors.navyText },
  breadcrumbRow: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbText: { fontSize: 12, color: colors.mutedText },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  tabsWrapper: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    maxWidth: 460,
    width: '100%',
    ...shadows.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
