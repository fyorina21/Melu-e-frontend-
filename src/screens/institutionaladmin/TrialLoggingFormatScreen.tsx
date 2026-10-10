import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import {
  getPromptLevels,
  getTrialConfig,
  syncPromptLevelsFromApi,
} from '../../stores/promptLevelsStore';
import {
  getPromptLevelsApi,
  createPromptLevelApi,
  updatePromptLevelApi,
  deletePromptLevelApi,
  reorderPromptLevelsApi,
  saveTrialLoggingConfig,
} from '../../api/institutionalAdminApi';
import {
  type LevelItem,
  type TrialLayout,
  validatePromptLevel,
  sortPromptLevels,
} from './triallogging/types';
import {
  PromptLevelsTable,
  LivePreviewCard,
  TrialLayoutConfigCard,
  MasteryCriteriaCard,
} from './triallogging/components';

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'TrialLoggingFormat'>;

export default function TrialLoggingFormatScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { showToast } = useToast();
  const configInit = getTrialConfig();
  const [levels, setLevels] = useState<LevelItem[]>(() => getPromptLevels());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState({ name: '', color: '', order: 0 });
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLevel, setNewLevel] = useState({ name: '', color: '#6366F1', order: 5 });
  const [layout, setLayout] = useState<TrialLayout>('Horizontal');
  const [streamCount, setStreamCount] = useState(configInit.streamCount);
  const [consecutive, setConsecutive] = useState(configInit.consecutive);
  const [independence, setIndependence] = useState(80);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPromptLevels = async () => {
    try {
      setLoading(true);
      const res = await getPromptLevelsApi();
      const rawData = Array.isArray(res.data) ? res.data : (res.data?.prompt_levels ?? []);
      const mapped: LevelItem[] = rawData
        .map((item: any, idx: number) => ({
          id: String(item.id),
          name: String(item.name ?? item.label ?? ''),
          color: String(item.color ?? '#64748B'),
          order:
            typeof item.order === 'number'
              ? item.order
              : typeof item.display_order === 'number'
                ? item.display_order
                : idx + 1,
          status: 'Active',
        }))
        .sort((a: LevelItem, b: LevelItem) => a.order - b.order);

      setLevels(mapped);
      syncPromptLevelsFromApi(mapped, consecutive, streamCount);
    } catch (err: any) {
      console.error('Failed to load prompt levels', err);
      showToast(err?.response?.data?.error || 'Failed to load prompt levels from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromptLevels();
  }, []);

  const startEdit = (lv: LevelItem) => {
    setEditingId(lv.id);
    setEditBuf({ name: lv.name, color: lv.color, order: lv.order });
  };

  const saveEdit = async (id: string) => {
    const val = validatePromptLevel(editBuf.name, editBuf.order, levels, id);
    if (!val.isValid) {
      showToast(val.error!, 'error');
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await updatePromptLevelApi(id, {
        label: editBuf.name.trim(),
        name: editBuf.name.trim(),
        color: editBuf.color,
        display_order: editBuf.order,
        order: editBuf.order,
        is_active: true,
      });
      const updated = res.data;
      const next = levels
        .map((l) =>
          l.id === id
            ? {
                ...l,
                name: updated?.name || updated?.label || editBuf.name.trim(),
                color: updated?.color || editBuf.color,
                order: updated?.order ?? updated?.display_order ?? editBuf.order,
              }
            : l,
        )
        .sort((a, b) => a.order - b.order);
      setLevels(next);
      syncPromptLevelsFromApi(next, consecutive, streamCount);
      setEditingId(null);
      showToast('Prompt level updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update prompt level', err);
      const msg =
        err?.response?.data?.errors?.join?.(', ') ||
        err?.response?.data?.error ||
        'Failed to update prompt level';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteLevel = async (id: string) => {
    try {
      setActionLoadingId(id);
      await deletePromptLevelApi(id);
      const next = levels.filter((l) => l.id !== id);
      setLevels(next);
      syncPromptLevelsFromApi(next, consecutive, streamCount);
      setDeleteConfirmId(null);
      showToast('Prompt level deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete prompt level', err);
      const msg = err?.response?.data?.error || 'Failed to delete prompt level';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const addLevel = async () => {
    const val = validatePromptLevel(newLevel.name, newLevel.order, levels);
    if (!val.isValid) {
      showToast(val.error!, 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await createPromptLevelApi({
        label: newLevel.name.trim(),
        name: newLevel.name.trim(),
        color: newLevel.color,
        display_order: newLevel.order,
        order: newLevel.order,
        is_active: true,
      });
      const created = res.data;
      const createdItem: LevelItem = {
        id: String(created?.id ?? Date.now()),
        name: created?.name || created?.label || newLevel.name.trim(),
        color: created?.color || newLevel.color,
        order: created?.order ?? created?.display_order ?? newLevel.order,
        status: 'Active',
      };
      const next: LevelItem[] = sortPromptLevels([...levels, createdItem]);
      setLevels(next);
      syncPromptLevelsFromApi(next, consecutive, streamCount);
      setNewLevel({ name: '', color: '#6366F1', order: next.length + 1 });
      setAddingLevel(false);
      showToast('Prompt level created successfully', 'success');
    } catch (err: any) {
      console.error('Failed to create prompt level', err);
      const msg =
        err?.response?.data?.errors?.join?.(', ') ||
        err?.response?.data?.error ||
        'Failed to create prompt level';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSubmitting(true);
      const validNumericIds = levels.map((l) => Number(l.id)).filter((id) => !isNaN(id) && id > 0);
      if (validNumericIds.length === levels.length && validNumericIds.length > 0) {
        try {
          await reorderPromptLevelsApi(validNumericIds);
        } catch (reorderErr) {
          console.warn('Reorder endpoint warning:', reorderErr);
        }
      }
      try {
        await saveTrialLoggingConfig({
          streamCount,
          consecutive,
          independence,
          autoSuggest,
          layout,
        });
      } catch {
        // Fallback gracefully
      }
      syncPromptLevelsFromApi(levels, consecutive, streamCount);
      showToast('Trial logging format saved successfully', 'success');
    } catch (err: any) {
      console.error('Failed to save configuration', err);
      showToast('Failed to save configuration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Trial Logging"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.mainWrapper, isTablet && styles.tabletWrapper]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation?.goBack?.()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
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
          <PromptLevelsTable
            levels={levels}
            loading={loading}
            actionLoadingId={actionLoadingId}
            editingId={editingId}
            editBuf={editBuf}
            onEditBufChange={setEditBuf}
            addingLevel={addingLevel}
            newLevel={newLevel}
            onNewLevelChange={setNewLevel}
            submitting={submitting}
            deleteConfirmId={deleteConfirmId}
            onStartEdit={startEdit}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={saveEdit}
            onStartAdd={() => setAddingLevel(true)}
            onCancelAdd={() => setAddingLevel(false)}
            onSaveAdd={addLevel}
            onConfirmDelete={deleteLevel}
            onStartDelete={setDeleteConfirmId}
            onCancelDelete={() => setDeleteConfirmId(null)}
          />

          {/* Live Preview */}
          <LivePreviewCard levels={levels} />

          {/* Trial Stream Layout & Mastery Criteria */}
          <View style={[styles.twoCol, !isTablet && styles.twoColMobile]}>
            <TrialLayoutConfigCard
              layout={layout}
              onLayoutChange={setLayout}
              streamCount={streamCount}
              onStreamCountChange={setStreamCount}
            />
            <MasteryCriteriaCard
              consecutive={consecutive}
              onConsecutiveChange={setConsecutive}
              independence={independence}
              onIndependenceChange={setIndependence}
              autoSuggest={autoSuggest}
              onAutoSuggestChange={setAutoSuggest}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSaveConfiguration}
            accessibilityRole="button"
            accessibilityLabel="Save configuration"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.navyText} />
            ) : (
              <Feather name="save" size={15} color={colors.navyText} />
            )}
            <Text style={styles.saveBtnText}>
              {submitting ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: spacing.lg, paddingBottom: 60 },
  mainWrapper: { width: '100%', gap: 24 },
  tabletWrapper: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingTop: 4 },
  backText: { color: '#334155', fontSize: 14, fontWeight: '500' },
  headerTitle: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },
  twoCol: { flexDirection: 'row', gap: 16 },
  twoColMobile: { flexDirection: 'column' },
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
