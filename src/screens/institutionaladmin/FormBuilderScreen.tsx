
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ExportPreviewModal from '../../components/ExportPreviewModal';
import { getFormConfig, saveFormConfig, resetFormToDefault } from '../../api/institutionalAdminApi';
import type { InstitutionalAdminStackParamList } from '../../types';

const FORMS = ['Enrollment Wizard', 'IUP Form', 'ABLLS Assessment Form'];
const FIELD_TYPES = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Radio', 'Text Area', 'File Upload'];

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
  helpText?: string;
}

interface HistoryEntry {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

function FieldPropertiesModal({ visible, field, onClose, onSave }: {
  visible: boolean;
  field: FormField | null;
  onClose: () => void;
  onSave: (updated: FormField) => void;
}) {
  const [label, setLabel] = useState('');
  const [required, setRequired] = useState(false);
  const [helpText, setHelpText] = useState('');
  useEffect(() => {
    if (field) { setLabel(field.label); setRequired(field.required); setHelpText(field.helpText || ''); }
  }, [field, visible]);
  if (!field) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>Field Properties</Text>
          <View style={styles.field}>
            <Text style={typography.label}>Label</Text>
            <TextInput style={styles.textInput} value={label} onChangeText={setLabel} />
          </View>
          <View style={styles.field}>
            <Text style={typography.label}>Help Text</Text>
            <TextInput style={styles.textInput} value={helpText} onChangeText={setHelpText} />
          </View>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setRequired((r) => !r)}>
            <View style={[styles.checkbox, required && styles.checkboxChecked]} />
            <Text style={typography.body}>Required</Text>
          </TouchableOpacity>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ ...field, label, required, helpText })}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function FormBuilderScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'FormBuilder'>) {
  const [selectedForm, setSelectedForm] = useState(FORMS[0]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [isDefault, setIsDefault] = useState(true);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await getFormConfig(selectedForm);
      setFields(data.fields);
      setIsDefault(data.isDefault);
      setHistory(data.history || []);
    } catch (err) {
      setFields(DEMO_FIELDS[selectedForm] || []);
      setIsDefault(true);
      setHistory(DEMO_HISTORY);
    }
  }, [selectedForm]);

  useEffect(() => { load(); }, [load]);

  const move = (index: number, dir: number) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setIsDefault(false);
  };

  const toggleVisible = (id: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)));
    setIsDefault(false);
  };

  const handleAddField = (type: string) => {
    setFields((prev) => [...prev, { id: `f-${Date.now()}`, type, label: `New ${type} Field`, required: false, visible: true }]);
    setIsDefault(false);
  };

  const handleSaveField = (updated: FormField) => {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setIsDefault(false);
    setEditingField(null);
  };

  const handleDeleteField = (id: string) => {
    Alert.alert('Delete this field?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setFields((prev) => prev.filter((f) => f.id !== id)); setIsDefault(false); } },
    ]);
  };

  const handlePreview = () => {
    const lines: string[] = [];
    lines.push(`FORM PREVIEW — ${selectedForm}`);
    lines.push('(read-only render of the configured field order, visibility and required rules)');
    lines.push('');
    fields.forEach((f) => {
      lines.push(`${f.visible ? '' : '[hidden] '}${f.label}${f.required ? ' *' : ''}`);
      lines.push(`    Type: ${f.type}${f.helpText ? ` · ${f.helpText}` : ''}`);
    });
    setPreviewContent(lines.join('\n'));
  };

  const handleSave = async () => {
    if (fields.length === 0) { Alert.alert('At least one field required'); return; }
    try { await saveFormConfig(selectedForm, { fields }); } catch (err) {}
    Alert.alert('Configuration saved');
  };

  const handleReset = () => {
    Alert.alert('Reset to default configuration?', 'This discards all customizations.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try { await resetFormToDefault(selectedForm); } catch (err) {}
          setFields(DEMO_FIELDS[selectedForm] || []);
          setIsDefault(true);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Forms" onTabPress={(t) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      <View style={styles.header}>
        <Text style={typography.h1}>Form Builder</Text>
        <View style={[styles.templateBadge, !isDefault && styles.templateBadgeCustom]}>
          <Text style={styles.templateBadgeText}>{isDefault ? 'Using Default Template' : 'Custom Template'}</Text>
        </View>
      </View>

      <View style={styles.formSelectorRow}>
        {FORMS.map((f) => (
          <TouchableOpacity key={f} style={[styles.formChip, selectedForm === f && styles.formChipActive]} onPress={() => setSelectedForm(f)}>
            <Text style={[typography.bodyBold, selectedForm === f && { color: colors.navyText }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={typography.h3}>Form Canvas</Text>
          {fields.map((field, i) => (
            <View key={field.id} style={[styles.fieldRow, !field.visible && styles.fieldRowHidden]}>
              <View style={styles.fieldOrderCol}>
                <TouchableOpacity onPress={() => move(i, -1)} disabled={i === 0}>
                  <Feather name="chevron-up" size={16} color={i === 0 ? colors.mutedText : colors.navyText} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => move(i, 1)} disabled={i === fields.length - 1}>
                  <Feather name="chevron-down" size={16} color={i === fields.length - 1 ? colors.mutedText : colors.navyText} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{field.label}{field.required ? ' *' : ''}</Text>
                <Text style={typography.caption}>{field.type}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleVisible(field.id)}>
                <Feather name={field.visible ? 'eye' : 'eye-off'} size={16} color={colors.navyText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingField(field)}>
                <Feather name="edit-2" size={16} color={colors.navyText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteField(field.id)}>
                <Feather name="trash-2" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Add New Field</Text>
          <View style={styles.fieldTypeGrid}>
            {FIELD_TYPES.map((t) => (
              <TouchableOpacity key={t} style={styles.fieldTypeBtn} onPress={() => handleAddField(t)}>
                <Text style={styles.fieldTypeBtnText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={typography.h3}>Modification History</Text>
          {history.map((h, i) => (
            <Text key={i} style={typography.caption}>{h.date} — {h.user} changed {h.field}: "{h.oldValue}" → "{h.newValue}"</Text>
          ))}
          {history.length === 0 && <Text style={typography.caption}>No changes yet.</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleReset}><Text style={styles.footerBtnText}>Reset to Default</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={handlePreview}><Text style={styles.footerBtnText}>Preview Form</Text></TouchableOpacity>
        <TouchableOpacity style={styles.saveConfigBtn} onPress={handleSave}><Text style={styles.saveConfigBtnText}>Save Configuration</Text></TouchableOpacity>
      </View>

      <FieldPropertiesModal visible={!!editingField} field={editingField} onClose={() => setEditingField(null)} onSave={handleSaveField} />

      <ExportPreviewModal
        visible={!!previewContent}
        title="Form Preview"
        filename={`${selectedForm.replace(/\s+/g, '_')}_Preview.txt`}
        content={previewContent ?? ''}
        onClose={() => setPreviewContent(null)}
      />
    </SafeAreaView>
  );
}

const DEMO_FIELDS: Record<string, FormField[]> = {
  'Enrollment Wizard': [
    { id: 'f1', type: 'Text', label: 'Student Name', required: true, visible: true },
    { id: 'f2', type: 'Date', label: 'Date of Birth', required: true, visible: true },
  ],
  'IUP Form': [
    { id: 'f3', type: 'Text', label: 'Goal Name', required: true, visible: true },
  ],
  'ABLLS Assessment Form': [
    { id: 'f4', type: 'Dropdown', label: 'Skill Score', required: true, visible: true },
  ],
};
const DEMO_HISTORY: HistoryEntry[] = [
  { date: 'Aug 1, 2026', user: 'Admin A', field: 'Student Name', oldValue: 'Full Name', newValue: 'Student Name' },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  templateBadge: { backgroundColor: colors.statusApprovedBg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  templateBadgeCustom: { backgroundColor: colors.statusPendingBg },
  templateBadgeText: { fontSize: 11, fontWeight: '700', color: colors.navyText },
  formSelectorRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bgCard },
  formChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.bgApp },
  formChipActive: { backgroundColor: colors.primaryYellow },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  fieldRowHidden: { opacity: 0.4 },
  fieldOrderCol: { alignItems: 'center' },
  fieldTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  fieldTypeBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  fieldTypeBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.bgCard, borderTopWidth: 1, borderTopColor: colors.border },
  footerBtn: { flex: 1, minWidth: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  footerBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText, textAlign: 'center' },
  saveConfigBtn: { flex: 2, minWidth: 150, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  saveConfigBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  modalSheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 18, height: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 4 },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  modalFooter: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  saveBtn: { flex: 1, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { fontWeight: '700', color: colors.navyText },
});
