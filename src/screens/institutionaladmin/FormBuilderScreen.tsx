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
import type { InstitutionalAdminStackParamList } from '../../types';

const FORMS = ['Enrollment Wizard', 'IUP Form', 'ABLLS Assessment Form'];
const FIELD_TYPES = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'Radio', 'TextArea', 'File'];

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
}

interface HistoryEntry {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export default function FormBuilderScreen({ navigation }: NativeStackScreenProps<InstitutionalAdminStackParamList, 'FormBuilder'>) {
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
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(false);

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

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
  };

  const handleDeleteField = (id: string) => {
    const fieldObj = fields.find((f) => f.id === id);
    Alert.alert('Delete Field', 'Are you sure you want to delete this field?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
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
        },
      },
    ]);
  };

  const handleConfirmAddField = () => {
    if (!newFieldLabel.trim()) {
      Alert.alert('Error', 'Please enter a field label.');
      return;
    }

    const trimmedLabel = newFieldLabel.trim();
    const newEntry: FormField = {
      id: `f-${Date.now()}`,
      type: newFieldType,
      label: trimmedLabel,
      required: newFieldRequired,
      visible: true,
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
      newValue: 'Added',
    };
    setHistory((prev) => [newHistoryEntry, ...prev]);

    // Reset inline box state
    setNewFieldLabel('');
    setNewFieldRequired(false);
    setShowAddFieldBox(false);
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      Alert.alert('Error', 'At least one field is required.');
      return;
    }
    try {
      await saveFormConfig(selectedForm, { fields, history });
      await load();
    } catch (err) {}
    Alert.alert('Success', 'Configuration saved successfully.');
  };

  const handleReset = () => {
    Alert.alert('Reset to Default', 'This will discard all customizations.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetFormToDefault(selectedForm);
          } catch (err) {}

          await load();
        },
      },
    ]);
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

          <TouchableOpacity style={styles.uploadBtn}>
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

              <Text style={styles.fieldLabelText}>{field.label}</Text>

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
                  <Feather name={field.visible ? 'eye' : 'eye-off'} size={16} color="#94A3B8" />
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
            <View style={styles.inlineAddBox}>
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

              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmAddField}>
                <Text style={styles.confirmAddBtnText}>Add Field</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setShowAddFieldBox(false)}>
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setShowPreviewModal(true)}>
            <Feather name="eye" size={15} color="#0F172A" />
            <Text style={styles.previewBtnText}>Preview Form</Text>
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

      {/* Form Preview Modal */}
      <Modal visible={showPreviewModal} transparent animationType="fade" onRequestClose={() => setShowPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Form Preview — {selectedForm}</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {fields.filter(f => f.visible).map((f) => (
                <View key={f.id} style={styles.previewFieldGroup}>
                  <Text style={styles.previewLabel}>
                    {f.label} {f.required && <Text style={{ color: '#EF4444' }}>*</Text>}
                  </Text>
                  <View style={styles.previewInputDummy}>
                    <Text style={styles.previewInputDummyText}>{f.type} field</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowPreviewModal(false)}>
                <Text style={styles.closeModalBtnText}>Close</Text>
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
  fieldLabelText: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1 },
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

  inlineAddBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
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
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
    marginTop: 14,
  },
  confirmAddBtnText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  cancelAddBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 32,
    justifyContent: 'center',
    marginTop: 14,
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