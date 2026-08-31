import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { getFormConfig, saveFormConfig, resetFormToDefault } from '../../api/institutionalAdminApi';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { InstitutionalAdminStackParamList } from '../../types';

const FORMS = [
  'Enrollment Wizard',
  'IUP Form',
  'ABLLS Assessment Form',
  'Social Skills Questionnaire',
  'Behavior Incident Form',
];
const FIELD_TYPES = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Radio', 'TextArea', 'File'];
const ENROLLMENT_SECTIONS = ['Student Info', 'Parent Info', 'Medical Info'];

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  section?: string;
}

interface HistoryEntry {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export default function FormBuilderScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'FormBuilder'>) {
  const { showToast } = useToast();
  const [selectedForm, setSelectedForm] = useState<string>(FORMS[0]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Dropdown State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);

  // Add New Field Inline Form State
  const [showAddFieldBox, setShowAddFieldBox] = useState<boolean>(false);
  const [newFieldType, setNewFieldType] = useState<string>('Text');
  const [showTypeModal, setShowTypeModal] = useState<boolean>(false);
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldOptions, setNewFieldOptions] = useState<string>('');
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(false);
  const [newFieldSection, setNewFieldSection] = useState<string>('Student Info');

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewFormValues, setPreviewFormValues] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    try {
      const { data } = await getFormConfig(selectedForm);
      setFields(Array.isArray(data?.fields) ? data.fields : []);
      setIsDefault(Boolean(data?.isDefault));
      setHistory(Array.isArray(data?.history) ? data.history : []);
    } catch (err) {
      setFields([]);
      setIsDefault(true);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [selectedForm]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <ScreenLoader />;

  const toggleRequired = (id: string) => {
    const fieldObj = fields.find((f) => f.id === id);
    if (fieldObj) {
      const today = new Date().toISOString().split('T')[0];
      const newHistoryEntry: HistoryEntry = {
        date: today,
        user: 'Admin A',
        field: fieldObj.label,
        oldValue: fieldObj.required ? 'Required' : 'Optional',
        newValue: !fieldObj.required ? 'Required' : 'Optional',
      };
      setHistory((prev) => [newHistoryEntry, ...prev]);
    }

    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, required: !f.required } : f)));
    setIsDefault(false);
    showToast('Field requirement updated — click Save to persist', 'info');
  };

  const toggleVisible = (id: string) => {
    const fieldObj = fields.find((f) => f.id === id);
    if (fieldObj) {
      const today = new Date().toISOString().split('T')[0];
      const newHistoryEntry: HistoryEntry = {
        date: today,
        user: 'Admin A',
        field: fieldObj.label,
        oldValue: fieldObj.visible ? 'Visible' : 'Hidden',
        newValue: !fieldObj.visible ? 'Visible' : 'Hidden',
      };
      setHistory((prev) => [newHistoryEntry, ...prev]);
    }

    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)));
    setIsDefault(false);
    showToast('Field visibility toggled — click Save to persist', 'info');
  };

  const handleDeleteField = (id: string) => {
    const fieldObj = fields.find((f) => f.id === id);
    if (fieldObj) {
      const today = new Date().toISOString().split('T')[0];
      const newHistoryEntry: HistoryEntry = {
        date: today,
        user: 'Admin A',
        field: fieldObj.label,
        oldValue: fieldObj.type,
        newValue: 'Deleted',
      };
      setHistory((prev) => [newHistoryEntry, ...prev]);
    }
    setFields((prev) => prev.filter((f) => f.id !== id));
    setIsDefault(false);
    showToast('Field deleted — click Save to persist', 'info');
  };

  const inferSection = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes('parent') || l.includes('guardian') || l.includes('mother') || l.includes('father') || l.includes('emergency') || l.includes('family') || l.includes('contact')) {
      return 'Parent Info';
    }
    if (l.includes('medical') || l.includes('allerg') || l.includes('doctor') || l.includes('health') || l.includes('insurance') || l.includes('medication') || l.includes('diet') || l.includes('hospital') || l.includes('physician')) {
      return 'Medical Info';
    }
    return 'Student Info';
  };

  const cycleSection = (id: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const current = f.section || inferSection(f.label);
        const nextIdx = (ENROLLMENT_SECTIONS.indexOf(current) + 1) % ENROLLMENT_SECTIONS.length;
        const nextSection = ENROLLMENT_SECTIONS[nextIdx];
        return { ...f, section: nextSection };
      })
    );
    setIsDefault(false);
    showToast('Target section updated — click Save to persist', 'info');
  };

  const handleConfirmAddField = () => {
    if (!newFieldLabel.trim()) {
      showToast('Please enter a field label', 'error');
      return;
    }

    const trimmedLabel = newFieldLabel.trim();
    const parsedOptions =
      newFieldType === 'Dropdown' || newFieldType === 'Radio'
        ? newFieldOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const newEntry: FormField = {
      id: `f-${Date.now()}`,
      type: newFieldType,
      label: trimmedLabel,
      required: newFieldRequired,
      visible: true,
      section: selectedForm === 'Enrollment Wizard' ? newFieldSection : undefined,
      ...(parsedOptions && parsedOptions.length > 0 ? { options: parsedOptions } : {}),
    };

    setFields((prev) => [...prev, newEntry]);
    setIsDefault(false);

    // Append to Modification History Card
    const today = new Date().toISOString().split('T')[0];
    const newHistoryEntry: HistoryEntry = {
      date: today,
      user: 'Admin A',
      field: trimmedLabel,
      oldValue: 'None',
      newValue: `Added (${newFieldType} - ${newFieldSection})`,
    };
    setHistory((prev) => [newHistoryEntry, ...prev]);

    // Reset inline box state
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
    setShowAddFieldBox(false);
    showToast(`Added field "${trimmedLabel}" to ${newFieldSection} — click Save to persist`, 'success');
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      showToast('At least one field is required', 'error');
      return;
    }
    try {
      await saveFormConfig(selectedForm, { fields, history, isDefault: false });
      await load();
      showToast(`Configuration for ${selectedForm} saved successfully!`, 'success');
    } catch (err) {
      showToast('Failed to save form configuration', 'error');
    }
  };

  const handleReset = async () => {
    try {
      await resetFormToDefault(selectedForm);
      await load();
      showToast(`Reset ${selectedForm} to default template`, 'info');
    } catch (err) {
      showToast('Failed to reset form', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Forms" onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Title & Subtitle */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Form Builder</Text>
            <Text style={styles.headerSubtitle}>
              SCR-ADMIN-001 · Configure enrollment and assessment form templates
            </Text>
          </View>
        </View>

        {/* Top Control Row */}
        <View style={styles.topControlRow}>
          <TouchableOpacity
            style={styles.selectDropdown}
            onPress={() => setShowFormModal(true)}
          >
            <Text style={styles.selectDropdownText}>{selectedForm}</Text>
            <Feather name="chevron-down" size={16} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => {
              Alert.alert(
                'Upload Template Schema',
                'Select a template format to import for ' + selectedForm,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Import Standard JSON Template',
                    onPress: () => {
                      Alert.alert(
                        'Template Imported',
                        `Standard institutional template schema loaded successfully for ${selectedForm}.`
                      );
                    },
                  },
                ]
              );
            }}
          >
            <Feather name="upload" size={14} color="#334155" />
            <Text style={styles.uploadBtnText}>Upload Template</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={[styles.badge, isDefault ? styles.badgeDefault : styles.badgeCustom]}>
            <Text style={[styles.badgeText, isDefault ? styles.badgeTextDefault : styles.badgeTextCustom]}>
              {isDefault ? 'Using Default Template' : 'Custom Template'}
            </Text>
          </View>
        </View>

        {/* Canvas Box */}
        <View style={styles.canvasContainer}>
          <Text style={styles.canvasHeader}>FORM CANVAS — {selectedForm.toUpperCase()}</Text>

          {fields.map((field) => (
            <View key={field.id} style={[styles.fieldRow, !field.visible && styles.fieldRowHidden]}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{field.type}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.fieldLabelText}>
                    {field.label} {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
                  </Text>
                  {selectedForm === 'Enrollment Wizard' && (
                    <TouchableOpacity
                      style={styles.sectionPill}
                      onPress={() => cycleSection(field.id)}
                    >
                      <Feather name="folder" size={10} color="#0284C7" />
                      <Text style={styles.sectionPillText}>{field.section || inferSection(field.label)}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {field.options && field.options.length > 0 && (
                  <Text style={styles.fieldOptionsText} numberOfLines={1}>
                    Options: {field.options.join(', ')}
                  </Text>
                )}
              </View>

              <View style={styles.rowRightControls}>
                <Text style={styles.controlLabel}>Required</Text>
                <Switch
                  value={field.required}
                  onValueChange={() => toggleRequired(field.id)}
                  trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                  thumbColor="#FFFFFF"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />

                <TouchableOpacity onPress={() => toggleVisible(field.id)} style={styles.iconBtn}>
                  <Feather name={field.visible ? 'eye' : 'eye-off'} size={16} color={field.visible ? '#0284C7' : '#94A3B8'} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteField(field.id)} style={styles.iconBtn}>
                  <Feather name="trash-2" size={16} color="#F87171" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Inline Add Field Box */}
          {!showAddFieldBox ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddFieldBox(true)}>
              <Feather name="plus" size={16} color="#0284C7" />
              <Text style={styles.addBtnText}>Add New Field</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inlineAddContainer}>
              <View style={styles.inlineAddRow}>
                <View style={styles.inlineFieldCol}>
                  <Text style={styles.inlineFieldLabel}>Field Type</Text>
                  <TouchableOpacity
                    style={styles.inlineTypeDropdown}
                    onPress={() => setShowTypeModal(true)}
                  >
                    <Text style={styles.inlineTypeDropdownText}>{newFieldType}</Text>
                    <Feather name="chevron-down" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inlineFieldCol, { flex: 2 }]}>
                  <Text style={styles.inlineFieldLabel}>Label</Text>
                  <TextInput
                    style={styles.inlineTextInput}
                    placeholder="Field label..."
                    placeholderTextColor="#94A3B8"
                    value={newFieldLabel}
                    onChangeText={(val: string) => setNewFieldLabel(val)}
                  />
                </View>

                <View style={styles.inlineToggleCol}>
                  <Text style={styles.inlineFieldLabel}>Required</Text>
                  <Switch
                    value={newFieldRequired}
                    onValueChange={(val: boolean) => setNewFieldRequired(val)}
                    trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                    thumbColor="#FFFFFF"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>
              </View>

              {selectedForm === 'Enrollment Wizard' && (
                <View style={styles.inlineSectionRow}>
                  <Text style={styles.inlineFieldLabel}>Target Tab / Section</Text>
                  <View style={styles.sectionChipRow}>
                    {ENROLLMENT_SECTIONS.map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        style={[styles.sectionChip, newFieldSection === sec && styles.sectionChipActive]}
                        onPress={() => setNewFieldSection(sec)}
                      >
                        <Text style={[styles.sectionChipText, newFieldSection === sec && styles.sectionChipTextActive]}>
                          {sec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {(newFieldType === 'Dropdown' || newFieldType === 'Radio') && (
                <View style={styles.inlineOptionsRow}>
                  <Text style={styles.inlineFieldLabel}>Options (comma-separated)</Text>
                  <TextInput
                    style={styles.inlineTextInput}
                    placeholder="e.g. Low, Medium, High"
                    placeholderTextColor="#94A3B8"
                    value={newFieldOptions}
                    onChangeText={(val: string) => setNewFieldOptions(val)}
                  />
                </View>
              )}

              <View style={styles.inlineButtonRow}>
                <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmAddField}>
                  <Text style={styles.confirmAddBtnText}>Add Field</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setShowAddFieldBox(false)}>
                  <Text style={styles.cancelAddBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => {
              setPreviewFormValues({});
              setShowPreviewModal(true);
            }}
          >
            <Feather name="eye" size={15} color="#0F172A" />
            <Text style={styles.previewBtnText}>Preview Live Form</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Feather name="save" size={15} color="#0F172A" />
            <Text style={styles.saveBtnText}>Save Configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={16} color="#EF4444" />
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>

        {/* Modification History */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Modification History</Text>
            <Feather name="chevron-up" size={16} color="#64748B" />
          </View>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCol, { flex: 1.2 }]}>DATE</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>USER</Text>
            <Text style={[styles.tableCol, { flex: 1.5 }]}>FIELD</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>OLD VALUE</Text>
            <Text style={[styles.tableCol, { flex: 1 }]}>NEW VALUE</Text>
          </View>

          {history.map((item, idx) => (
            <View key={idx} style={styles.tableDataRow}>
              <Text style={[styles.tableDataCell, { flex: 1.2 }]}>{item.date}</Text>
              <Text style={[styles.tableDataCell, { flex: 1, fontWeight: '700' }]}>{item.user}</Text>
              <Text style={[styles.tableDataCell, { flex: 1.5 }]}>{item.field}</Text>
              <Text style={[styles.tableDataCell, { flex: 1, color: '#EF4444' }]}>{item.oldValue}</Text>
              <Text style={[styles.tableDataCell, { flex: 1, color: '#22C55E' }]}>{item.newValue}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Select Form Modal */}
      <Modal visible={showFormModal} transparent animationType="fade" onRequestClose={() => setShowFormModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFormModal(false)}>
          <View style={styles.dropdownModalBox}>
            {FORMS.map((form) => (
              <TouchableOpacity
                key={form}
                style={[styles.dropdownOption, selectedForm === form && styles.dropdownOptionActive]}
                onPress={() => {
                  setSelectedForm(form);
                  setShowFormModal(false);
                }}
              >
                <Text style={[styles.dropdownOptionText, selectedForm === form && styles.dropdownOptionTextActive]}>
                  {form}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Select Field Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="fade" onRequestClose={() => setShowTypeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypeModal(false)}>
          <View style={styles.dropdownModalBox}>
            {FIELD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.dropdownOption, newFieldType === type && styles.dropdownOptionActive]}
                onPress={() => {
                  setNewFieldType(type);
                  setShowTypeModal(false);
                }}
              >
                <Text style={[styles.dropdownOptionText, newFieldType === type && styles.dropdownOptionTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Form Preview Modal — Live Interactive Dynamic Form */}
      <Modal visible={showPreviewModal} transparent animationType="fade" onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Live Form Preview — {selectedForm}</Text>
                <Text style={styles.modalSubtitle}>Interactive preview of active fields & toggles</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <DynamicFormFields
                formName={selectedForm}
                initialFields={fields}
                values={previewFormValues}
                onChange={(key, val) => setPreviewFormValues((prev) => ({ ...prev, [key]: val }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPreviewModal(false)}>
                <Text style={styles.closeModalBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg, gap: 16 },
  header: { marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },

  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    width: 220,
  },
  selectDropdownText: { fontSize: 13, fontWeight: '600', color: '#1E293B' },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
  },
  uploadBtnText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeDefault: { backgroundColor: '#DCFCE7' },
  badgeCustom: { backgroundColor: '#FEF08A' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextDefault: { color: '#166534' },
  badgeTextCustom: { color: '#854D0E' },

  canvasContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  canvasHeader: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  fieldRowHidden: { opacity: 0.5 },
  typeBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  fieldLabelText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  fieldOptionsText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  rowRightControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlLabel: { fontSize: 12, color: '#64748B' },
  iconBtn: { padding: 4 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#0284C7' },

  inlineAddContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    gap: 10,
  },
  inlineAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineOptionsRow: {
    gap: 4,
  },
  inlineSectionRow: {
    gap: 6,
  },
  sectionChipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  sectionChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  sectionChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  sectionChipTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  inlineFieldCol: { gap: 4 },
  inlineFieldLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  inlineTypeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 32,
    width: 110,
  },
  inlineTypeDropdownText: { fontSize: 12, color: '#1E293B' },

  inlineTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 32,
    fontSize: 12,
    color: '#1E293B',
  },
  inlineToggleCol: { alignItems: 'center', gap: 2 },
  confirmAddBtn: {
    backgroundColor: '#FACC15',
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 32,
    justifyContent: 'center',
  },
  confirmAddBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  cancelAddBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelAddBtnText: { fontSize: 12, color: '#475569' },

  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCol: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  tableDataCell: { fontSize: 12, color: '#334155' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalBox: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 4,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dropdownOptionActive: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },

  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalBody: { gap: 12 },
  previewFieldGroup: { gap: 4, marginBottom: 12 },
  previewLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  previewInputDummy: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewInputDummyText: { fontSize: 12, color: '#94A3B8' },
  modalFooter: { alignItems: 'flex-end' },
  closeModalBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeModalBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
});