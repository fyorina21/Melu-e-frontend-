import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import { FORM_METADATA } from '../FormBuilderScreen';
import { ASSESSMENT_DIRECT_ROUTES } from '../formBuilderConfig';

interface FormBuilderToolbarProps {
  selectedForm: string;
  isDefault: boolean;
  saving?: boolean;
  onOpenFormModal: () => void;
  onNavigateDirect?: (route: string) => void;
  onPreview: () => void;
  onReset: () => void;
  onSave: () => void;
}

export default function FormBuilderToolbar({
  selectedForm,
  isDefault,
  saving = false,
  onOpenFormModal,
  onNavigateDirect,
  onPreview,
  onReset,
  onSave,
}: FormBuilderToolbarProps) {
  const meta = FORM_METADATA[selectedForm] || {
    id: 'FRM-SYS-001',
    revision: 'Rev 1.0 · 2026-09-19',
    pages: 'Page 1 of 1',
  };

  const directRoute = ASSESSMENT_DIRECT_ROUTES[selectedForm];

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Form Builder</Text>
          <Text style={styles.headerSubtitle}>
            SCR-ADMIN-001 · Configure enrollment and assessment form templates
          </Text>
        </View>
      </View>

      {/* Top Selector & Status Row */}
      <View style={styles.topControlRow}>
        <TouchableOpacity style={styles.selectDropdown} onPress={onOpenFormModal}>
          <Text style={styles.selectDropdownText}>{selectedForm}</Text>
          <Feather name="chevron-down" size={16} color="#475569" />
        </TouchableOpacity>

        {directRoute && onNavigateDirect && (
          <TouchableOpacity
            style={styles.openAssessmentBtn}
            onPress={() => onNavigateDirect(directRoute.route)}
          >
            <Feather name="external-link" size={14} color="#0284C7" />
            <Text style={styles.openAssessmentBtnText}>Open Assessment</Text>
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

      {/* Standard Form Header Card */}
      <View style={styles.formHeaderCard}>
        <View style={styles.formHeaderTop}>
          <View style={styles.formMetaLeft}>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>FORM ID:</Text>
              <Text style={styles.metaValue}>{meta.id}</Text>
            </View>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>FORM NAME:</Text>
              <Text style={styles.metaValue}>{selectedForm}</Text>
            </View>
          </View>

          <View style={styles.formMetaRight}>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>REVISION:</Text>
              <Text style={styles.metaValue}>{meta.revision}</Text>
            </View>
            <View style={styles.metaRowItem}>
              <Text style={styles.metaLabel}>PAGE:</Text>
              <Text style={styles.metaValue}>{meta.pages}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={onReset}>
          <Feather name="rotate-ccw" size={14} color="#64748B" />
          <Text style={styles.actionBtnOutlineText}>Reset to Default</Text>
        </TouchableOpacity>

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
    gap: 12,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  selectDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  selectDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  openAssessmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  openAssessmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeDefault: {
    backgroundColor: '#F1F5F9',
  },
  badgeCustom: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextDefault: {
    color: '#475569',
  },
  badgeTextCustom: {
    color: '#D97706',
  },
  formHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  formHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
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
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: spacing.sm,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 6,
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
