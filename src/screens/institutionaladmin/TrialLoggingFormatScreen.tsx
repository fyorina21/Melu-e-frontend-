import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { InstitutionalAdminStackParamList } from '../../types';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import {
  usePreventUnsavedNavigation,
  useUnsavedChanges,
} from '../../context/UnsavedChangesContext';
import {
  getPromptLevels,
  setPromptLevels,
  getTrialConfig,
  syncPromptLevelsFromApi,
  type PromptLevelConfigItem,
} from '../../stores/promptLevelsStore';
import {
  getPromptLevelsApi,
  createPromptLevelApi,
  updatePromptLevelApi,
  deletePromptLevelApi,
  reorderPromptLevelsApi,
  saveTrialLoggingConfig,
  getTrialLoggingConfig,
} from '../../api/institutionalAdminApi';

type Props = NativeStackScreenProps<InstitutionalAdminStackParamList, 'TrialLoggingFormat'>;

import {
  type LevelItem,
  type TrialLayout,
  COLOR_SWATCHES,
  COLOR_SWATCH_LABELS,
  sortPromptLevels,
  validatePromptLevel,
} from './triallogging/types';

export type { LevelItem, TrialLayout };

export default function TrialLoggingFormatScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const { setDirty } = useUnsavedChanges();
  const configInit = getTrialConfig();
  const [levels, setLevels] = useState<LevelItem[]>(() => getPromptLevels());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // In-app navigation guard for unsaved changes
  usePreventUnsavedNavigation(navigation, isDirty);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState({ name: '', color: '', order: 0 });
  const [addingLevel, setAddingLevel] = useState(false);
  const [newLevel, setNewLevel] = useState({ name: '', color: '#6366F1', order: 5 });
  const [layout, setLayout] = useState<'Horizontal' | 'Vertical' | 'Card Grid'>(
    configInit.layout || 'Horizontal',
  );
  const [streamCount, setStreamCount] = useState(configInit.streamCount);
  const [consecutive, setConsecutive] = useState(configInit.consecutive);
  const [independence, setIndependence] = useState(configInit.independence ?? 80);
  const [autoSuggest, setAutoSuggest] = useState(configInit.autoSuggest ?? true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPromptLevels = async () => {
    try {
      setLoading(true);
      const [res, configRes] = await Promise.allSettled([
        getPromptLevelsApi(),
        getTrialLoggingConfig(),
      ]);

      let currentConsecutive = consecutive;
      let currentStream = streamCount;
      let currentLayout = layout;
      let currentIndependence = independence;
      let currentAutoSuggest = autoSuggest;

      if (configRes.status === 'fulfilled' && configRes.value?.data) {
        const cData = configRes.value.data;
        if (cData.layout || cData.trialStreamLayout) {
          currentLayout = cData.layout || cData.trialStreamLayout;
          setLayout(currentLayout);
        }
        if (cData.streamCount || cData.trialStreamCount) {
          currentStream = Number(cData.streamCount || cData.trialStreamCount);
          setStreamCount(currentStream);
        }
        if (cData.consecutive || cData.masteryConsecutiveTrials) {
          currentConsecutive = Number(cData.consecutive || cData.masteryConsecutiveTrials);
          setConsecutive(currentConsecutive);
        }
        if (cData.independence !== undefined || cData.independenceThreshold !== undefined) {
          currentIndependence = Number(cData.independence ?? cData.independenceThreshold);
          setIndependence(currentIndependence);
        }
        if (cData.autoSuggest !== undefined) {
          currentAutoSuggest = Boolean(cData.autoSuggest);
          setAutoSuggest(currentAutoSuggest);
        }
      }

      if (res.status === 'fulfilled') {
        const rawData = Array.isArray(res.value.data)
          ? res.value.data
          : (res.value.data?.prompt_levels ?? []);
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
        syncPromptLevelsFromApi(
          mapped,
          currentConsecutive,
          currentStream,
          currentLayout,
          currentIndependence,
          currentAutoSuggest,
        );
      }
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
    const validation = validatePromptLevel(editBuf.name, editBuf.order, levels, id);
    if (!validation.isValid) {
      showToast(validation.error || 'Invalid prompt level', 'error');
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
      const next = sortPromptLevels(
        levels.map((l) =>
          l.id === id
            ? {
                ...l,
                name: updated?.name || updated?.label || editBuf.name.trim(),
                color: updated?.color || editBuf.color,
                order: updated?.order ?? updated?.display_order ?? editBuf.order,
              }
            : l,
        ),
      );
      setLevels(next);
      syncPromptLevelsFromApi(next, consecutive, streamCount, layout, independence, autoSuggest);
      setEditingId(null);
      setIsDirty(true);
      showToast('Prompt level updated successfully', 'success');
    } catch (err: any) {
      console.error('Failed to update prompt level', err);
      const msg =
        err?.response?.data?.errors?.join?.(', ') ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update prompt level on server';
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
      syncPromptLevelsFromApi(next, consecutive, streamCount, layout, independence, autoSuggest);
      setDeleteConfirmId(null);
      setIsDirty(true);
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
    const validation = validatePromptLevel(newLevel.name, newLevel.order, levels);
    if (!validation.isValid) {
      showToast(validation.error || 'Invalid prompt level', 'error');
      return;
    }
    try {
      setSubmitting(true);
      let created: any = null;
      try {
        const res = await createPromptLevelApi({
          label: newLevel.name.trim(),
          name: newLevel.name.trim(),
          color: newLevel.color,
          display_order: newLevel.order,
          order: newLevel.order,
          is_active: true,
        });
        created = res.data;
      } catch (apiErr) {
        console.warn('API create failed, adding locally', apiErr);
      }
      const createdItem: LevelItem = {
        id: String(created?.id ?? Date.now()),
        name: created?.name || created?.label || newLevel.name.trim(),
        color: created?.color || newLevel.color,
        order: created?.order ?? created?.display_order ?? newLevel.order,
        status: 'Active',
      };
      const next: LevelItem[] = [...levels, createdItem].sort((a, b) => a.order - b.order);
      setLevels(next);
      syncPromptLevelsFromApi(next, consecutive, streamCount, layout, independence, autoSuggest);
      setNewLevel({ name: '', color: '#6366F1', order: next.length + 1 });
      setAddingLevel(false);
      setIsDirty(true);
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
      const numConsecutive = Math.min(Math.max(Number(consecutive) || 5, 1), 50);
      const numStream = Math.min(Math.max(Number(streamCount) || 5, 3), 20);
      const numIndependence = Math.min(Math.max(Number(independence) || 0, 0), 100);
      try {
        await saveTrialLoggingConfig({
          streamCount: numStream,
          trialStreamCount: numStream,
          consecutive: numConsecutive,
          masteryConsecutiveTrials: numConsecutive,
          independence: numIndependence,
          independenceThreshold: numIndependence,
          autoSuggest,
          layout,
          trialStreamLayout: layout,
          prompt_levels: levels,
          promptLevels: levels,
        });
      } catch (saveErr) {
        console.warn('API save warning:', saveErr);
      }
      setPromptLevels(levels, numConsecutive, numStream, layout, numIndependence, autoSuggest);
      syncPromptLevelsFromApi(
        levels,
        numConsecutive,
        numStream,
        layout,
        numIndependence,
        autoSuggest,
      );
      setIsDirty(false);
      showToast('Trial logging format saved successfully', 'success');
    } catch (err: any) {
      console.error('Failed to save configuration', err);
      showToast('Failed to save configuration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSwatches = (selected: string, onSelect: (c: string) => void) => (
    <View style={styles.swatchRow}>
      {COLOR_SWATCHES.map((c) => {
        const isSelected = selected.toLowerCase() === c.toLowerCase();
        const label = COLOR_SWATCH_LABELS[c] || c;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => {
              onSelect(c);
              setIsDirty(true);
            }}
            style={[
              styles.swatch,
              { backgroundColor: c },
              isSelected ? styles.swatchSelected : styles.swatchUnselected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select color ${label}${isSelected ? ' (Selected)' : ''}`}
            accessibilityState={{ selected: isSelected }}
          >
            {isSelected && (
              <Feather
                name="check"
                size={12}
                color={c === '#F59E0B' || c === '#EAB308' ? '#0F172A' : '#FFFFFF'}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderEditActions = (id: string) => {
    if (actionLoadingId === id) {
      return (
        <View style={styles.actionRow}>
          <ActivityIndicator size="small" color="#0284C7" />
        </View>
      );
    }
    if (deleteConfirmId === id) {
      return (
        <View style={styles.deleteConfirmRow}>
          <Text style={styles.deleteConfirmText}>Delete?</Text>
          <TouchableOpacity
            onPress={() => deleteLevel(id)}
            style={[styles.actionBtn, styles.deleteBtn]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Confirm delete prompt level"
          >
            <Feather name="check" size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleteConfirmId(null)}
            style={[styles.actionBtn, styles.cancelBtn]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel delete prompt level"
          >
            <Feather name="x" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => startEdit(levels.find((l) => l.id === id)!)}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Edit prompt level"
        >
          <Feather name="edit-3" size={14} color={colors.navyText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDeleteConfirmId(id)}
          style={[styles.actionBtn, styles.deleteBtn]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Delete prompt level"
        >
          <Feather name="trash-2" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Trial Logging"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Trial Logging Format</Text>
            <Text style={styles.subtitle}>
              Configure prompt levels, trial layout, and mastery criteria
            </Text>
          </View>
        </View>

        {/* Master Two-Column Grid (60% Left / 40% Right) */}
        <View style={styles.masterGrid}>
          {/* Left Column (60%): Prompt Levels Setup Table & Anchored Live Preview */}
          <View style={styles.leftColumn}>
            {/* Prompt Level Setup Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
                  <Text style={styles.tableHeaderText}>Prompt Levels</Text>
                  {loading && <ActivityIndicator size="small" color="#0284C7" />}
                </View>
                <TouchableOpacity
                  onPress={() => setAddingLevel(true)}
                  style={styles.addBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Add Prompt Level"
                >
                  <Feather name="plus" size={14} color="#0284C7" />
                  <Text style={styles.addBtnText}>Add Prompt Level</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableHead}>
                <Text style={[styles.tableColHeader, { width: 50 }]}>ORDER</Text>
                <Text
                  style={[styles.tableColHeader, { flex: 2.5, textAlign: 'left', paddingLeft: 8 }]}
                >
                  NAME
                </Text>
                <Text style={[styles.tableColHeader, { width: 140 }]}>COLOR</Text>
                <Text style={[styles.tableColHeader, { width: 75 }]}>STATUS</Text>
                <Text style={[styles.tableColHeader, { width: 85 }]}>ACTIONS</Text>
              </View>

              {levels.map((lv) => (
                <View key={lv.id} style={styles.tableRow}>
                  {editingId === lv.id ? (
                    <>
                      {/* Order */}
                      <View style={[styles.cellBaselineCol, { width: 50 }]}>
                        <TextInput
                          value={String(editBuf.order)}
                          onChangeText={(e) => setEditBuf((b) => ({ ...b, order: Number(e) }))}
                          onSubmitEditing={() => saveEdit(lv.id)}
                          style={[styles.inlineInput, { width: 44 }]}
                          keyboardType="numeric"
                        />
                      </View>
                      {/* Name */}
                      <View
                        style={[
                          styles.cellBaselineCol,
                          { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 },
                        ]}
                      >
                        <TextInput
                          value={editBuf.name}
                          onChangeText={(e) => setEditBuf((b) => ({ ...b, name: e }))}
                          onSubmitEditing={() => saveEdit(lv.id)}
                          style={[styles.inlineInput, { width: '100%', textAlign: 'left' }]}
                        />
                      </View>
                      {/* Color Palette Multi-Row Flex Block */}
                      <View style={[styles.cellBaselineCol, { width: 140 }]}>
                        {renderSwatches(editBuf.color, (c) =>
                          setEditBuf((b) => ({ ...b, color: c })),
                        )}
                      </View>
                      {/* Status */}
                      <View style={[styles.cellBaselineCol, { width: 75 }]}>
                        <View style={[styles.badge, styles.badgeActive]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                      </View>
                      {/* Action Icon Buttons */}
                      <View
                        style={[
                          styles.cellBaselineCol,
                          { width: 85, flexDirection: 'row', gap: 6 },
                        ]}
                      >
                        {actionLoadingId === lv.id ? (
                          <ActivityIndicator size="small" color="#0284C7" />
                        ) : (
                          <>
                            <TouchableOpacity
                              onPress={() => saveEdit(lv.id)}
                              style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityRole="button"
                              accessibilityLabel="Save edit prompt level"
                            >
                              <Feather name="check" size={14} color={colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => setEditingId(null)}
                              style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              accessibilityRole="button"
                              accessibilityLabel="Cancel edit prompt level"
                            >
                              <Feather name="x" size={14} color={colors.white} />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Row Index Number Baseline Aligned */}
                      <View style={[styles.cellBaselineCol, { width: 50 }]}>
                        <Text style={styles.cellOrderText}>{lv.order}</Text>
                      </View>
                      {/* Name */}
                      <View
                        style={[
                          styles.cellBaselineCol,
                          { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 },
                        ]}
                      >
                        <Text style={styles.cellNameText}>{lv.name}</Text>
                      </View>
                      {/* Color Swatch Dot */}
                      <View style={[styles.cellBaselineCol, { width: 140 }]}>
                        <View style={[styles.colorDot, { backgroundColor: lv.color }]} />
                      </View>
                      {/* Status Pill Baseline Aligned */}
                      <View style={[styles.cellBaselineCol, { width: 75 }]}>
                        <View style={[styles.badge, styles.badgeActive]}>
                          <Text style={styles.badgeText}>Active</Text>
                        </View>
                      </View>
                      {/* Action Icon Buttons Baseline Aligned */}
                      <View style={[styles.cellBaselineCol, { width: 85 }]}>
                        {renderEditActions(lv.id)}
                      </View>
                    </>
                  )}
                </View>
              ))}

              {levels.length === 0 && !addingLevel && (
                <View style={styles.emptyTableState}>
                  <Feather name="sliders" size={24} color="#94A3B8" style={{ marginBottom: 6 }} />
                  <Text style={styles.emptyTableText}>No prompt levels configured yet.</Text>
                  <Text style={styles.emptyTableSubText}>
                    Click &quot;Add Prompt Level&quot; above to define prompting hierarchy.
                  </Text>
                </View>
              )}

              {addingLevel && (
                <View style={[styles.tableRow, styles.addingRow]}>
                  <View style={[styles.cellBaselineCol, { width: 50 }]}>
                    <TextInput
                      value={String(newLevel.order)}
                      onChangeText={(e) => setNewLevel((n) => ({ ...n, order: Number(e) }))}
                      onSubmitEditing={addLevel}
                      style={[styles.inlineInput, { width: 44 }]}
                      keyboardType="numeric"
                    />
                  </View>
                  <View
                    style={[
                      styles.cellBaselineCol,
                      { flex: 2.5, alignItems: 'flex-start', paddingLeft: 8 },
                    ]}
                  >
                    <TextInput
                      value={newLevel.name}
                      onChangeText={(e) => setNewLevel((n) => ({ ...n, name: e }))}
                      onSubmitEditing={addLevel}
                      placeholder="Level Name (e.g. FP)"
                      placeholderTextColor="#94A3B8"
                      style={[styles.inlineInput, { width: '100%', textAlign: 'left' }]}
                    />
                  </View>
                  <View style={[styles.cellBaselineCol, { width: 140 }]}>
                    {renderSwatches(newLevel.color, (c) =>
                      setNewLevel((n) => ({ ...n, color: c })),
                    )}
                  </View>
                  <View style={[styles.cellBaselineCol, { width: 75 }]}>
                    <View style={[styles.badge, styles.badgeActive]}>
                      <Text style={styles.badgeText}>Active</Text>
                    </View>
                  </View>
                  <View
                    style={[styles.cellBaselineCol, { width: 85, flexDirection: 'row', gap: 6 }]}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#22C55E" />
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={addLevel}
                          style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel="Save new prompt level"
                        >
                          <Feather name="check" size={14} color={colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setAddingLevel(false)}
                          style={[styles.actionBtn, { backgroundColor: colors.mutedText }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityRole="button"
                          accessibilityLabel="Cancel adding prompt level"
                        >
                          <Feather name="x" size={14} color={colors.white} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Anchored Live Preview directly beneath Prompt Levels (24px top margin) */}
            <View style={styles.previewContainer}>
              <View style={styles.previewHeaderRow}>
                <Feather name="eye" size={14} color="#0284C7" />
                <Text style={styles.previewLabel}>LIVE PREVIEW</Text>
              </View>
              <Text style={styles.previewSubtitle}>
                Therapist trial logging button palette preview
              </Text>
              <View style={styles.previewButtons}>
                {levels
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((lv) => (
                    <TouchableOpacity
                      key={lv.id}
                      style={[styles.previewBtn, { backgroundColor: lv.color }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.previewBtnText}>{lv.name}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          </View>

          {/* Right Column (40%): Vertically Stacked Configuration Cards */}
          <View style={styles.rightColumn}>
            {/* Trial Stream Layout Card */}
            <View style={styles.configCard}>
              <Text style={styles.cardTitle}>Trial Stream Layout</Text>
              <Text style={styles.cardSubtitle}>
                Session card logging orientation and stream batching
              </Text>

              <View style={styles.radioList}>
                {(['Horizontal', 'Vertical', 'Card Grid'] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.radioRow}
                    onPress={() => {
                      setLayout(opt);
                      setIsDirty(true);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: layout === opt }}
                  >
                    <View style={[styles.radioOuter, layout === opt && styles.radioOuterActive]}>
                      {layout === opt && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.pinnedInputGroup}>
                <Text style={styles.fieldLabelPinned}>Trial Stream Count (3–20)</Text>
                <TextInput
                  value={streamCount > 0 ? String(streamCount) : ''}
                  placeholder="5"
                  placeholderTextColor="#94A3B8"
                  onChangeText={(e) => {
                    setIsDirty(true);
                    const cleaned = e.replace(/[^0-9]/g, '');
                    if (!cleaned) {
                      setStreamCount(0);
                      return;
                    }
                    const num = parseInt(cleaned, 10);
                    setStreamCount(isNaN(num) ? 5 : num);
                  }}
                  onBlur={() => {
                    const clamped = Math.min(Math.max(Number(streamCount) || 5, 3), 20);
                    setStreamCount(clamped);
                  }}
                  onSubmitEditing={handleSaveConfiguration}
                  style={styles.fullWidthNumberInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Mastery Criteria Card */}
            <View style={styles.configCard}>
              <View style={styles.cardHeaderWithCorner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Mastery Criteria</Text>
                  <Text style={styles.cardSubtitle}>
                    Institutional default criteria for data logging
                  </Text>
                </View>
                {/* Auto-Suggestion Toggle Switch Pinned to Corner */}
                <View style={styles.autoSuggestCorner}>
                  <Text style={styles.autoSuggestLabel}>Auto-Suggest</Text>
                  <Switch
                    value={autoSuggest}
                    onValueChange={() => {
                      setAutoSuggest((v) => !v);
                      setIsDirty(true);
                    }}
                    trackColor={{ true: '#0284C7', false: '#CBD5E1' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.masteryInputStack}>
                <View style={styles.pinnedInputGroup}>
                  <Text style={styles.fieldLabelPinned}>Consecutive Trials</Text>
                  <TextInput
                    value={consecutive > 0 ? String(consecutive) : ''}
                    placeholder="5"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(e) => {
                      setIsDirty(true);
                      const cleaned = e.replace(/[^0-9]/g, '');
                      if (!cleaned) {
                        setConsecutive(0);
                        return;
                      }
                      const parsed = parseInt(cleaned, 10);
                      const val = isNaN(parsed) ? 0 : parsed;
                      setConsecutive(val);
                      if (val > 0) {
                        setPromptLevels(
                          levels,
                          val,
                          streamCount,
                          layout,
                          independence,
                          autoSuggest,
                        );
                      }
                    }}
                    onBlur={() => {
                      const val = Math.min(Math.max(Number(consecutive) || 5, 1), 50);
                      setConsecutive(val);
                      setPromptLevels(levels, val, streamCount, layout, independence, autoSuggest);
                    }}
                    onSubmitEditing={handleSaveConfiguration}
                    style={styles.fullWidthNumberInput}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.pinnedInputGroup}>
                  <Text style={styles.fieldLabelPinned}>Independence % Threshold</Text>
                  <TextInput
                    value={independence > 0 ? String(independence) : ''}
                    placeholder="80"
                    placeholderTextColor="#94A3B8"
                    onChangeText={(e) => {
                      setIsDirty(true);
                      const cleaned = e.replace(/[^0-9]/g, '');
                      if (!cleaned) {
                        setIndependence(0);
                        return;
                      }
                      const num = parseInt(cleaned, 10);
                      setIndependence(isNaN(num) ? 80 : Math.min(num, 100));
                    }}
                    onBlur={() => {
                      const clamped = Math.min(Math.max(Number(independence) || 0, 0), 100);
                      setIndependence(clamped);
                    }}
                    onSubmitEditing={handleSaveConfiguration}
                    style={styles.fullWidthNumberInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.criteriaDisclaimerText}>
                Note: Mastery criteria serve as institutional defaults for session data collection.
                Student-specific criteria defined on individual IUP goals will supersede these
                thresholds.
              </Text>
            </View>
          </View>
        </View>

        {/* Sticky Global Footer */}
        <View style={styles.stickyFooterContainer}>
          <TouchableOpacity
            style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            onPress={handleSaveConfiguration}
            accessibilityRole="button"
            accessibilityLabel="Save Configuration"
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
  content: { padding: spacing.lg, gap: 24, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerTitle: { ...typography.h2 },
  subtitle: { ...typography.caption, marginTop: 2 },

  /* Master Two-Column Grid */
  masterGrid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: 6,
    minWidth: 320,
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 4,
    minWidth: 280,
    flexDirection: 'column',
    gap: 24,
  },

  /* Prompt Level Setup Table */
  tableContainer: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
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
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 8,
    minHeight: 52,
  },
  addingRow: { backgroundColor: 'rgba(34,197,94,0.06)' },
  cellBaselineCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellOrderText: { fontSize: 14, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  cellNameText: { fontSize: 14, fontWeight: '700', color: '#1A2233' },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* Swatches - Structured Multi-Row Flex Block */
  swatchRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 136,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderColor: '#0F172A', transform: [{ scale: 1.15 }] },
  swatchUnselected: { borderColor: 'rgba(255,255,255,0.7)' },

  /* Badge */
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'center' },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },

  /* Actions */
  actionRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  deleteBtn: { backgroundColor: '#EF4444' },
  cancelBtn: { backgroundColor: '#6B7280' },
  deleteConfirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteConfirmText: { color: '#DC2626', fontSize: 11, fontWeight: '600' },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#E5E7EB' },

  /* Anchored Live Preview */
  previewContainer: {
    marginTop: 24,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  previewButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  previewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  previewBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  /* Right Column Uniform Configuration Cards */
  configCard: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 14,
  },
  cardTitle: { ...typography.h3, color: '#0F172A' },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginTop: -8 },
  radioList: { flexDirection: 'column', gap: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#0284C7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284C7' },
  radioLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },

  /* Pinned Labels directly above inputs */
  pinnedInputGroup: {
    flexDirection: 'column',
    gap: 6,
  },
  fieldLabelPinned: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  fullWidthNumberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    width: '100%',
  },

  /* Mastery Criteria Card Layout */
  cardHeaderWithCorner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  autoSuggestCorner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  autoSuggestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  masteryInputStack: {
    flexDirection: 'column',
    gap: 14,
  },
  criteriaDisclaimerText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 4,
  },

  /* Sticky Global Footer */
  stickyFooterContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },

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
