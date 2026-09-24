// screens/programdirector/GoalBankManagementScreen.tsx
// SCR-PD-006: Clinical Quality Monitoring (Goal Bank management)

import React, { useEffect, useMemo, useState } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getGoalBank, createGoal, updateGoal } from '../../api/programDirectorApi';
import type { ProgramDirectorStackParamList } from '../../types';

const DOMAINS = [
  'All',
  'Cognitive',
  'Receptive Language',
  'Expressive Language',
  'Social Skills',
  'Motor Skills',
  'Adaptive',
  'Play Skills',
  'Academic',
];

const DOMAIN_OPTIONS = DOMAINS.slice(1);

type GoalStatus = 'active' | 'inactive';

interface ExtendedGoal {
  id: string;
  name: string;
  domain: string;
  description: string;
  masteryCriteria: string;
  usageCount: number;
  status: GoalStatus;
}

interface FormData {
  name: string;
  domain: string;
  description: string;
  masteryCriteria: string;
  suggestedAgeRange: string;
  status: GoalStatus;
}

const EMPTY_FORM: FormData = {
  name: '',
  domain: DOMAIN_OPTIONS[0],
  description: '',
  masteryCriteria: '80% accuracy across 3 consecutive sessions',
  suggestedAgeRange: '4–8 years',
  status: 'active',
};

/* ── Add / Edit Goal modal ── */
function GoalFormModal({ visible, initial, onClose, onSave }: {
  visible: boolean;
  initial: FormData | null;
  onClose: () => void;
  onSave: (payload: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [domainPickerOpen, setDomainPickerOpen] = useState(false);

  useEffect(() => {
    setForm(initial ? { ...initial } : { ...EMPTY_FORM });
  }, [initial, visible]);

  const valid = form.name.trim().length > 0 && form.description.trim().length > 0;

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={typography.h2}>{initial ? 'Edit Goal' : 'Add Goal'}</Text>
              <Text style={typography.caption}>
                {initial ? 'Update the goal definition and status.' : 'Create a new goal to add to the shared bank.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formFields} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Goal Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder="e.g. Identify Colors"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Domain</Text>
              <TouchableOpacity
                style={[styles.selectBtn, domainPickerOpen && styles.selectBtnOpen]}
                onPress={() => setDomainPickerOpen(true)}
              >
                <Text style={styles.selectBtnText}>{form.domain}</Text>
                <Feather name="chevron-down" size={14} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Description <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                value={form.description}
                onChangeText={(v) => set('description', v)}
                placeholder="Describe the goal and success criteria..."
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mastery Criteria</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                value={form.masteryCriteria}
                onChangeText={(v) => set('masteryCriteria', v)}
                placeholder="e.g. 80% accuracy across 3 consecutive sessions"
                placeholderTextColor={colors.mutedText}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Suggested Age Range</Text>
              <TextInput
                style={styles.textInput}
                value={form.suggestedAgeRange}
                onChangeText={(v) => set('suggestedAgeRange', v)}
                placeholder="e.g. 4–8 years"
                placeholderTextColor={colors.mutedText}
              />
              <Text style={styles.fieldHint}>For reference only — not saved to the goal record.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.chipRow}>
                {(['active', 'inactive'] as GoalStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, form.status === s && styles.chipSelected]}
                    onPress={() => set('status', s)}
                  >
                    <Text style={[styles.chipText, form.status === s && styles.chipTextSelected]}>
                      {s === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, !valid && styles.saveBtnDisabled]}
              onPress={() => onSave({ ...form })}
              disabled={!valid}
            >
              <Text style={styles.saveBtnText}>{initial ? 'Save Changes' : 'Create Goal'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DomainPicker
          visible={domainPickerOpen}
          selected={form.domain}
          onSelect={(d) => set('domain', d)}
          onClose={() => setDomainPickerOpen(false)}
        />
      </View>
    </Modal>
  );
}

/* ── Domain picker (in-sheet overlay, avoids nested Modals) ── */
function DomainPicker({ visible, selected, onSelect, onClose }: {
  visible: boolean;
  selected: string;
  onSelect: (domain: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.pickerOverlay}>
      <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerCard} onStartShouldSetResponder={() => true}>
        <View style={styles.modalHeader}>
          <Text style={typography.h3}>Select Domain</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Feather name="x" size={18} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ maxHeight: 350 }}>
          {DOMAIN_OPTIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.optionRow, selected === d && styles.optionRowActive]}
              onPress={() => { onSelect(d); onClose(); }}
            >
              <Text style={[styles.optionText, selected === d && styles.optionTextActive]}>{d}</Text>
              {selected === d && <Feather name="check" size={14} color="#38BDF8" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/* ── Goal preview modal ── */
function GoalPreviewModal({ goal, onClose }: {
  goal: ExtendedGoal | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={goal !== null} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.previewTitleWrap}>
              <Text style={styles.previewTitle} numberOfLines={2}>{goal?.name}</Text>
              <View style={[styles.badge, goal?.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, goal?.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {goal?.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formFields} showsVerticalScrollIndicator={false}>
            <View style={styles.previewGrid}>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Domain</Text>
                <Text style={styles.previewValue}>{goal?.domain || '—'}</Text>
              </View>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Usage</Text>
                <Text style={styles.previewValue}>{goal ? `${goal.usageCount} session${goal.usageCount === 1 ? '' : 's'}` : '—'}</Text>
              </View>
              <View style={styles.previewGridCell}>
                <Text style={styles.previewLabel}>Age Range</Text>
                <Text style={styles.previewValue}>—</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.previewBody}>{goal?.description || '—'}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mastery Criteria</Text>
              <View style={styles.masteryBox}>
                <Feather name="activity" size={14} color="#0369A1" />
                <Text style={styles.masteryText}>{goal?.masteryCriteria?.trim() ? goal.masteryCriteria : '—'}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.previewCloseBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Screen ── */
export default function GoalBankManagementScreen({
  navigation,
}: NativeStackScreenProps<ProgramDirectorStackParamList, 'GoalBankManagement'>) {
  const [goals, setGoals] = useState<ExtendedGoal[] | null>(null);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [formTarget, setFormTarget] = useState<ExtendedGoal | null | undefined>(undefined); // undefined = closed, null = new, object = editing
  const [previewGoal, setPreviewGoal] = useState<ExtendedGoal | null>(null);

  const load = async () => {
    try {
      const { data: res } = await getGoalBank({});
      const rows = Array.isArray(res) ? res : [];
      setGoals(
        rows.map((g) => ({
          id: g.id,
          name: g.name,
          domain: g.domain,
          description: g.description,
          masteryCriteria: g.masteryCriteria ?? '',
          usageCount: typeof g.usageCount === 'number' ? g.usageCount : 0,
          status: g.active === false || g.status === 'inactive' ? 'inactive' : 'active',
        })),
      );
    } catch {
      setGoals([]);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!goals) return [];
    const term = search.trim().toLowerCase();
    return goals.filter((g) => {
      if (domainFilter !== 'All' && g.domain !== domainFilter) return false;
      if (term) {
        const haystack = `${g.name} ${g.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [goals, search, domainFilter]);

  const handleSave = async (payload: FormData) => {
    const apiPayload = {
      name: payload.name.trim(),
      domain: payload.domain,
      description: payload.description.trim(),
      masteryCriteria: payload.masteryCriteria.trim(),
      status: payload.status,
    };
    try {
      if (formTarget) {
        await updateGoal(formTarget.id, apiPayload);
      } else {
        await createGoal(apiPayload);
      }
      await load();
    } catch (err) {}
    setFormTarget(undefined);
  };

  if (!goals) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Clinical Quality" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t])} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Page header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.badgeIcon}>
              <Feather name="target" size={20} color={colors.navyText} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Goal Bank Management</Text>
              <Text style={styles.pageSubtitle}>Review, add, and manage the shared clinical goal bank</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addGoalBtn} onPress={() => setFormTarget(null)} activeOpacity={0.7}>
            <Feather name="plus" size={16} color={colors.navyText} />
            <Text style={styles.addGoalBtnText}>Add Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter */}
        <View style={styles.card}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Feather name="search" size={16} color={colors.mutedText} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search goals by name or description..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.mutedText} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DOMAINS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterChip, domainFilter === d && styles.filterChipActive]}
                  onPress={() => setDomainFilter(d)}
                >
                  <Text style={[styles.filterChipText, domainFilter === d && styles.filterChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Goals table */}
        <View style={styles.tableCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={[styles.tr, styles.trHeader]}>
                <Text style={[styles.th, styles.colName]}>Goal Name</Text>
                <Text style={[styles.th, styles.colDomain]}>Domain</Text>
                <Text style={[styles.th, styles.colDesc]}>Description</Text>
                <Text style={[styles.th, styles.colUsage]}>Usage</Text>
                <Text style={[styles.th, styles.colStatus]}>Status</Text>
                <Text style={[styles.th, styles.colActions]}>Actions</Text>
              </View>

              {filtered.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Feather name="search" size={20} color={colors.mutedText} />
                  <Text style={styles.emptyText}>
                    {goals.length === 0 ? 'No goals in the bank yet. Add your first goal above.' : 'No goals match your search.'}
                  </Text>
                </View>
              ) : (
                filtered.map((g) => (
                  <View key={g.id} style={styles.tr}>
                    <Text style={[styles.td, styles.colName, styles.tdName]} numberOfLines={2}>{g.name}</Text>
                    <View style={[styles.cell, styles.colDomain]}>
                      <View style={styles.domainBadge}>
                        <Text style={styles.domainBadgeText} numberOfLines={1}>{g.domain}</Text>
                      </View>
                    </View>
                    <Text style={[styles.td, styles.colDesc]} numberOfLines={2}>{g.description}</Text>
                    <View style={[styles.cell, styles.colUsage]}>
                      <View style={[styles.badge, g.usageCount > 0 ? styles.badgeUsage : styles.badgeUsageZero]}>
                        <Text style={[styles.badgeText, g.usageCount > 0 ? styles.badgeTextUsage : styles.badgeTextUsageZero]}>
                          {g.usageCount}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cell, styles.colStatus]}>
                      <View style={[styles.badge, g.status === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={[styles.badgeText, g.status === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                          {g.status === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cell, styles.colActions]}>
                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => setFormTarget(g)}>
                          <Feather name="edit-2" size={12} color={colors.navyText} />
                          <Text style={styles.actionBtnTextEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnPreview} onPress={() => setPreviewGoal(g)}>
                          <Feather name="eye" size={12} color="#0369A1" />
                          <Text style={styles.actionBtnTextPreview}>Preview</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <GoalFormModal
        visible={formTarget !== undefined}
        initial={formTarget === null || formTarget === undefined ? null : {
          name: formTarget.name,
          domain: formTarget.domain,
          description: formTarget.description,
          masteryCriteria: formTarget.masteryCriteria,
          suggestedAgeRange: '',
          status: formTarget.status,
        }}
        onClose={() => setFormTarget(undefined)}
        onSave={handleSave}
      />

      <GoalPreviewModal goal={previewGoal} onClose={() => setPreviewGoal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },

  /* Header */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: typography.h1,
  pageSubtitle: typography.caption,
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addGoalBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },

  content: { padding: spacing.lg, gap: spacing.lg },

  /* Search & Filter card */
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  searchRow: { flexDirection: 'row' },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgApp,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, color: colors.navyText, fontSize: 13 },
  filterRow: { flexDirection: 'row' },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  filterChipActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  filterChipTextActive: { color: colors.navyText },

  /* Table */
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  table: { minWidth: 660 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  trHeader: { backgroundColor: colors.bgApp, borderBottomColor: colors.border },
  th: { fontSize: 10, fontWeight: '700', color: colors.mutedText, textTransform: 'uppercase', letterSpacing: 0.5 },
  cell: { justifyContent: 'center' },
  td: { fontSize: 13, color: colors.bodyText },
  colName: { width: 130 },
  colDomain: { width: 104 },
  colDesc: { flex: 1, minWidth: 140, paddingRight: spacing.sm },
  colUsage: { width: 52 },
  colStatus: { width: 72 },
  colActions: { width: 260 },
  tdName: { fontWeight: '600', color: colors.navyText },
  domainBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: 100,
  },
  domainBadgeText: { fontSize: 11, fontWeight: '600', color: colors.bodyText },

  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeUsage: { backgroundColor: '#FEF3C7' },
  badgeUsageZero: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextUsage: { color: '#B45309' },
  badgeTextUsageZero: { color: '#6B7280' },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeInactive: { backgroundColor: '#F3F4F6' },
  badgeTextActive: { color: '#15803D' },
  badgeTextInactive: { color: '#6B7280' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgCard,
  },
  actionBtnTextEdit: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  actionBtnPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionBtnTextPreview: { fontSize: 11, fontWeight: '600', color: '#0369A1' },

  emptyRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyText: { fontSize: 13, color: colors.mutedText, fontWeight: '600' },

  /* Modals */
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '92%',
  },
  pickerSheet: { maxWidth: 380, width: '100%', alignSelf: 'center' },
  pickerOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, elevation: 20 },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.lg },
  pickerCard: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  formFields: { gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldHint: { fontSize: 11, color: colors.mutedText },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.navyText,
    fontSize: 13,
    backgroundColor: colors.bgCard,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
  },
  selectBtnOpen: { borderColor: '#38BDF8' },
  selectBtnText: { fontSize: 13, color: colors.navyText, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgCard,
  },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 13 },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 13 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionRowActive: { backgroundColor: colors.bgApp },
  optionText: { fontSize: 13, color: colors.bodyText },
  optionTextActive: { color: colors.navyText, fontWeight: '700' },

  /* Preview */
  previewTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  previewTitle: { ...typography.h3, flexShrink: 1 },
  previewGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  previewGridCell: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  previewValue: { fontSize: 13, fontWeight: '600', color: colors.navyText },
  previewBody: { fontSize: 13, color: colors.bodyText, lineHeight: 19 },
  masteryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  masteryText: { flex: 1, fontSize: 13, color: '#075985', lineHeight: 19 },
  previewCloseBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});