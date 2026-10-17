import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import { FORM_METADATA } from '../formBuilderConfig';

interface FormBuilderToolbarProps {
  selectedForm: string;
  isDefault: boolean;
  saving?: boolean;
  metadata?: {
    formId: string;
    formName: string;
    revision: string;
    pages: string;
  };
  onEditMetadata?: () => void;
  onOpenFormModal: () => void;
  onNavigateDirect?: (route: string) => void;
  onPreview: () => void;
  onReset: () => void;
  onSave: () => void;
  onViewTemplates?: () => void;
}

export default function FormBuilderToolbar({
  selectedForm,
  isDefault,
  saving = false,
  metadata,
  onEditMetadata,
  onOpenFormModal,
  onPreview,
  onReset,
  onSave,
  onViewTemplates,
}: FormBuilderToolbarProps) {
  const fallbackMeta = FORM_METADATA[selectedForm] || {
    id: 'FRM-SYS-001',
    revision: 'Rev 1.0 · 2026-09-19',
    pages: 'Page 1 of 1',
  };

  const currentMeta = {
    id: metadata?.formId || fallbackMeta.id,
    formName: metadata?.formName || selectedForm,
    revision: metadata?.revision || fallbackMeta.revision,
    pages: metadata?.pages || fallbackMeta.pages,
  };

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Form Builder</Text>
          <Text style={styles.headerSubtitle}>
            Configure enrollment, assessment, and clinical form templates
          </Text>
        </View>
      </View>

      {/* Top Selector & Status Row */}
      <View style={styles.topControlRow}>
        <TouchableOpacity style={styles.selectDropdown} onPress={onOpenFormModal}>
          <Text style={styles.selectDropdownText}>{selectedForm}</Text>
          <Feather name="chevron-down" size={16} color="#475569" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.livePreviewTopBtn} onPress={onPreview}>
          <Feather name="eye" size={14} color="#0284C7" />
          <Text style={styles.livePreviewTopBtnText}>Live Preview</Text>
        </TouchableOpacity>

        {onViewTemplates && (
          <TouchableOpacity style={styles.templatesTopBtn} onPress={onViewTemplates}>
            <Feather name="layers" size={14} color="#475569" />
            <Text style={styles.templatesTopBtnText}>Templates & Versions</Text>
          </TouchableOpacity>
        )}

        <View style={{ flex: 1 }} />

        <View style={[styles.badge, isDefault ? styles.badgeDefault : styles.badgeCustom]}>
          <Text
            style={[styles.badgeText, isDefault ? styles.badgeTextDefault : styles.badgeTextCustom]}
          >
            {isDefault ? 'Using Default Template' : 'Custom Template'}
          </Text>
        </View>
      </View>

      {/* Standard Form Header Card (Editable) */}
      <View style={styles.formHeaderCard}>
        <View style={styles.formHeaderTop}>
          <View style={styles.formMetaLeft}>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>FORM ID:</Text>
              <Text style={styles.metaValue}>{currentMeta.id}</Text>
            </View>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>FORM NAME:</Text>
              <Text style={styles.metaValue}>{currentMeta.formName}</Text>
            </View>
          </View>

          <View style={styles.formMetaRight}>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>REVISION:</Text>
              <Text style={styles.metaValue}>{currentMeta.revision}</Text>
            </View>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>PAGE:</Text>
              <Text style={styles.metaValue}>{currentMeta.pages}</Text>
            </View>
          </View>

          {onEditMetadata && (
            <TouchableOpacity
              style={styles.editMetaBtn}
              onPress={onEditMetadata}
              accessibilityRole="button"
              accessibilityLabel="Edit form header details"
            >
              <Feather name="edit-2" size={13} color="#2563EB" />
              <Text style={styles.editMetaBtnText}>Edit Header</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={onReset}>
          <Feather name="rotate-ccw" size={14} color="#64748B" />
          <Text style={styles.actionBtnOutlineText}>Reset to Default</Text>
        </TouchableOpacity>

        {onViewTemplates && (
          <TouchableOpacity style={styles.actionBtnOutline} onPress={onViewTemplates}>
            <Feather name="folder" size={14} color="#64748B" />
            <Text style={styles.actionBtnOutlineText}>Import / Templates</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtnOutline} onPress={onPreview}>
          <Feather name="eye" size={14} color="#0284C7" />
          <Text style={[styles.actionBtnOutlineText, { color: '#0284C7' }]}>Live Preview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="save" size={15} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Form</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  livePreviewTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  livePreviewTopBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  templatesTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  templatesTopBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeDefault: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeCustom: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextDefault: {
    color: '#1E40AF',
  },
  badgeTextCustom: {
    color: '#92400E',
  },
  formHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  formHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  formMetaLeft: {
    gap: 4,
  },
  formMetaRight: {
    gap: 4,
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 80,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  editMetaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editMetaBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
