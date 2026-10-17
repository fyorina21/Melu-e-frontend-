import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../theme/colors';
import { getDefaultFormConfig } from '../../../api/institutionalAdminApi';
import type { FormField } from '../../../types';

interface TemplateVersionModalProps {
  visible: boolean;
  selectedForm: string;
  currentFields: FormField[];
  history: Array<{ date: string; user: string; field: string; oldValue: string; newValue: string }>;
  onClose: () => void;
  onReuseTemplate: (templateName: string, fields: FormField[]) => void;
  onImportJson: (importedFields: FormField[]) => void;
}

export const TemplateVersionModal: React.FC<TemplateVersionModalProps> = React.memo(
  ({ visible, selectedForm, currentFields, history, onClose, onReuseTemplate, onImportJson }) => {
    const [activeTab, setActiveTab] = useState<'templates' | 'import' | 'export'>('templates');
    const [jsonInput, setJsonInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    const defaultCfg = getDefaultFormConfig(selectedForm);
    const defaultFields = (defaultCfg?.fields || []) as FormField[];

    const handleApplyDefault = () => {
      onReuseTemplate(`${selectedForm} (Default Baseline)`, defaultFields);
      onClose();
    };

    const handleImportJsonText = () => {
      setImportError(null);
      try {
        const parsed = JSON.parse(jsonInput);
        const fields = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.fields)
            ? parsed.fields
            : Array.isArray(parsed?.field_schema?.fields)
              ? parsed.field_schema.fields
              : null;

        if (!fields || !Array.isArray(fields) || fields.length === 0) {
          setImportError('JSON must contain a non-empty array of fields');
          return;
        }

        onImportJson(fields);
        onClose();
      } catch (err: any) {
        setImportError(err?.message || 'Invalid JSON syntax');
      }
    };

    const handleExportJson = () => {
      const exportData = {
        formName: selectedForm,
        exportedAt: new Date().toISOString(),
        fields: currentFields,
      };
      const jsonStr = JSON.stringify(exportData, null, 2);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedForm.toLowerCase().replace(/\s+/g, '_')}_template.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Templates & Version Management</Text>
                <Text style={styles.modalSubtitle}>
                  View past versions, reuse standard templates, or import form JSON
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                accessibilityLabel="Close template modal"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]}
                onPress={() => setActiveTab('templates')}
              >
                <Feather
                  name="layers"
                  size={14}
                  color={activeTab === 'templates' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
                  Saved Templates
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'import' && styles.tabBtnActive]}
                onPress={() => setActiveTab('import')}
              >
                <Feather
                  name="download"
                  size={14}
                  color={activeTab === 'import' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
                  Import JSON
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'export' && styles.tabBtnActive]}
                onPress={() => setActiveTab('export')}
              >
                <Feather
                  name="upload"
                  size={14}
                  color={activeTab === 'export' ? '#0F172A' : '#64748B'}
                />
                <Text style={[styles.tabText, activeTab === 'export' && styles.tabTextActive]}>
                  Export Form
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            {activeTab === 'templates' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                {/* Baseline Template Card */}
                <View style={styles.templateItemCard}>
                  <View style={styles.templateItemHeader}>
                    <View style={styles.templateBadge}>
                      <Text style={styles.templateBadgeText}>System Baseline</Text>
                    </View>
                    <Text style={styles.itemDate}>Standard Schema</Text>
                  </View>
                  <Text style={styles.itemTitle}>{selectedForm} — Default Template</Text>
                  <Text style={styles.itemDesc}>
                    {defaultFields.length} clinically verified standard fields. Restores original
                    sections, prompt types, and verification scales.
                  </Text>
                  <View style={styles.itemFooter}>
                    <TouchableOpacity
                      style={styles.reuseBtn}
                      onPress={handleApplyDefault}
                      accessibilityRole="button"
                      accessibilityLabel="Reuse default baseline template"
                    >
                      <Feather name="refresh-cw" size={13} color="#2563EB" />
                      <Text style={styles.reuseBtnText}>Reuse Baseline Template</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Revision History Reusable Snapshots */}
                {history.length > 0 && (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.sectionHeader}>Revision History & Audit Snapshots</Text>
                    {history.slice(0, 5).map((rev, idx) => (
                      <View key={`rev-${idx}`} style={styles.historyRevisionRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.revFieldText}>{rev.field}</Text>
                          <Text style={styles.revMetaText}>
                            {rev.date} · {rev.user} · Changed from &quot;{rev.oldValue}&quot; to
                            &quot;{rev.newValue}&quot;
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {activeTab === 'import' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeader}>Paste Form Configuration JSON</Text>
                <Text style={styles.helperText}>
                  Paste any exported schema with a &quot;fields&quot; array to immediately populate
                  the form builder canvas.
                </Text>
                <TextInput
                  style={styles.jsonInputArea}
                  multiline
                  placeholder='{\n  "fields": [\n    { "id": "f1", "type": "Text", "label": "Student Name", "required": true }\n  ]\n}'
                  placeholderTextColor="#94A3B8"
                  value={jsonInput}
                  onChangeText={setJsonInput}
                />
                {importError ? <Text style={styles.errorText}>{importError}</Text> : null}
                <View style={styles.importFooter}>
                  <TouchableOpacity
                    style={[styles.importSubmitBtn, !jsonInput.trim() && styles.btnDisabled]}
                    disabled={!jsonInput.trim()}
                    onPress={handleImportJsonText}
                    accessibilityRole="button"
                    accessibilityLabel="Apply JSON to form builder"
                  >
                    <Feather name="check" size={15} color="#FFFFFF" />
                    <Text style={styles.importSubmitBtnText}>Import into Canvas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'export' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeader}>Export Current Form</Text>
                <Text style={styles.helperText}>
                  Download the active {currentFields.length} fields as a JSON template to reuse or
                  import later.
                </Text>
                <View style={styles.exportPreviewBox}>
                  <Text style={styles.exportPreviewCode}>
                    {JSON.stringify(
                      {
                        formName: selectedForm,
                        fieldsCount: currentFields.length,
                        sampleFields: currentFields.slice(0, 3).map((f) => ({
                          id: f.id,
                          type: f.type,
                          label: f.label,
                        })),
                      },
                      null,
                      2,
                    )}
                  </Text>
                </View>
                <View style={styles.importFooter}>
                  <TouchableOpacity
                    style={styles.importSubmitBtn}
                    onPress={handleExportJson}
                    accessibilityRole="button"
                    accessibilityLabel="Download JSON template"
                  >
                    <Feather name="download" size={15} color="#FFFFFF" />
                    <Text style={styles.importSubmitBtnText}>Download JSON Template</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
    ...makeShadow(6),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E40AF',
  },
  tabContent: {
    maxHeight: 440,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.md,
  },
  templateItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  templateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  templateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  itemDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  itemFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reuseBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  historyRevisionRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  revFieldText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  revMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  jsonInputArea: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#0F172A',
    height: 180,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  importFooter: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  importSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  importSubmitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  exportPreviewBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
    padding: spacing.md,
    maxHeight: 180,
  },
  exportPreviewCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#334155',
  },
});
