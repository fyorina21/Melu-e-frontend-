import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ScreenLoader from '../../components/ScreenLoader';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { InstitutionalAdminStackParamList, FormField } from '../../types';

import {
  FORMS,
  FIELD_TYPES,
  SCORE_SCALE_PRESETS,
  getPresetsForForm,
  getNextIdForSection,
  getDomainLetterForAblls,
} from './formBuilderConfig';

import { useFormBuilder } from './hooks/useFormBuilder';
import FormBuilderToolbar from './components/FormBuilderToolbar';
import FormSectionAccordion from './components/FormSectionAccordion';
import FormFieldCard from './components/FormFieldCard';

export const FORM_METADATA: Record<string, { id: string; revision: string; pages: string }> = {
  'Enrollment Wizard': {
    id: 'FRM-ENR-001',
    revision: 'Rev 2.4 · 2026-09-19',
    pages: 'Page 1 of 3',
  },
  'IUP Form': { id: 'FRM-IUP-001', revision: 'Rev 1.8 · 2026-09-19', pages: 'Page 1 of 2' },
  'ABLLS Assessment Form': {
    id: 'FRM-ABLLS-001',
    revision: 'Rev 3.1 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
  'Behavioral Assessment': {
    id: 'FRM-BEH-001',
    revision: 'Rev 2.0 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
  'Preference Assessment': {
    id: 'FRM-PREF-001',
    revision: 'Rev 1.5 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
  'Sensory Assessment': {
    id: 'FRM-SEN-001',
    revision: 'Rev 1.6 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
  'Social Skills Questionnaire': {
    id: 'FRM-SOC-001',
    revision: 'Rev 1.2 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
  'Behavior Incident Form': {
    id: 'FRM-BIF-001',
    revision: 'Rev 1.4 · 2026-09-19',
    pages: 'Page 1 of 1',
  },
};

export default function FormBuilderScreen({
  navigation,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'FormBuilder'>) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const {
    selectedForm,
    setSelectedForm,
    fields,
    isDefault,
    history,
    loading,
    saving,
    availableSections,
    customSections,
    deletedSections,
    // Add box state
    showAddFieldBox,
    setShowAddFieldBox,
    newFieldType,
    setNewFieldType,
    newFieldLabel,
    setNewFieldLabel,
    newFieldOptions,
    setNewFieldOptions,
    setNewFieldPlaceholder,
    newFieldRequired,
    setNewFieldRequired,
    setNewFieldSection,
    addingToSection,
    setAddingToSection,
    // Skill / Info type state
    showAddSkillTypeModal,
    setShowAddSkillTypeModal,
    newSkillTypeName,
    setNewSkillTypeName,
    showAddInfoTypeModal,
    setShowAddInfoTypeModal,
    newInfoTypeName,
    setNewInfoTypeName,
    editingSkillType,
    setEditingSkillType,
    editSkillTypeName,
    setEditSkillTypeName,
    // Edit field modal state
    editingField,
    setEditingField,
    editLabel,
    setEditLabel,
    editType,
    setEditType,
    editOptions,
    setEditOptions,
    editRequired,
    setEditRequired,
    editSection,
    setEditSection,
    // Preview modal state
    showPreviewModal,
    setShowPreviewModal,
    previewFormValues,
    setPreviewFormValues,
    showFormModal,
    setShowFormModal,
    // Handlers
    handleSave,
    handleReset,
    toggleRequired,
    toggleVisible,
    handleDeleteField,
    moveFieldUp,
    moveFieldDown,
    handleConfirmAddField,
    openEditModal,
    handleSaveEditField,
    handleCreateSkillType,
    handleCreateInfoType,
    handleOpenEditSkillType,
    handleSaveEditSkillType,
    handleDeleteSkillType,
    applyBulkPreset,
    inferSection,
  } = useFormBuilder(FORMS[0]);

  if (loading) return <ScreenLoader />;

  const toggleSectionCollapse = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const startAddingToSection = (sec: string) => {
    setAddingToSection(sec);
    setNewFieldSection(sec);
    const isAblls = selectedForm === 'ABLLS Assessment Form';
    setNewFieldType(
      selectedForm === 'Behavioral Assessment' && sec === 'ABC Tracking'
        ? 'Text'
        : isAblls
          ? 'Radio'
          : 'Text',
    );
    setNewFieldLabel('');
    setNewFieldOptions(isAblls ? '0 — Not Demonstrated, 1 — Emerging, 2 — Mastered, N/A' : '');
    setNewFieldPlaceholder('');
    setNewFieldRequired(true);
    setShowAddFieldBox(true);
  };

  const renderInlineAddBox = (sec: string) => {
    const nextId = getNextIdForSection(selectedForm, sec, fields);
    return (
      <View style={styles.inlineAddContainer}>
        <View style={styles.inlineAddHeader}>
          <Text style={styles.inlineAddTitle}>Add Item to "{sec}"</Text>
          <View style={styles.nextIdBadge}>
            <Text style={styles.nextIdBadgeText}>Next ID: {nextId}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={styles.inlineFieldLabel}>Field Type</Text>
          <View style={styles.typeSelectorRow}>
            {FIELD_TYPES.map((type) => {
              const isSelected = newFieldType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeSelectPill, isSelected && styles.typeSelectPillActive]}
                  onPress={() => setNewFieldType(type)}
                >
                  <Text
                    style={[
                      styles.typeSelectPillText,
                      isSelected && styles.typeSelectPillTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inlineAddRow}>
          <View style={[styles.inlineFieldCol, { flex: 2 }]}>
            <Text style={styles.inlineFieldLabel}>Label</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder={`e.g. ${nextId}: description`}
              placeholderTextColor="#94A3B8"
              value={newFieldLabel}
              onChangeText={setNewFieldLabel}
            />
          </View>
          <View style={styles.inlineToggleCol}>
            <Text style={styles.inlineFieldLabel}>Required</Text>
            <Switch
              value={newFieldRequired}
              onValueChange={setNewFieldRequired}
              trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {(newFieldType === 'Dropdown' || newFieldType === 'Radio') && (
          <View style={styles.inlineOptionsRow}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={styles.inlineFieldPromptTitle}>
                {newFieldType === 'Dropdown' ? 'Dropdown options:' : 'Radio choices:'}
              </Text>
              <View style={styles.presetChipsRow}>
                {getPresetsForForm(selectedForm).map((p) => (
                  <TouchableOpacity
                    key={p.short}
                    style={styles.presetChip}
                    onPress={() => setNewFieldOptions(p.options.join(', '))}
                  >
                    <Text style={styles.presetChipText}>{p.short}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. Low, Medium, High or Option 1, Option 2"
              placeholderTextColor="#94A3B8"
              value={newFieldOptions}
              onChangeText={setNewFieldOptions}
            />
          </View>
        )}

        <View style={styles.inlineButtonRow}>
          <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmAddField}>
            <Text style={styles.confirmAddBtnText}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelAddBtn}
            onPress={() => {
              setShowAddFieldBox(false);
              setAddingToSection(null);
            }}
          >
            <Text style={styles.cancelAddBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Group fields by section
  const allSectionNames = Array.from(
    new Set([
      ...availableSections,
      ...(fields.map((f) => f.section).filter(Boolean) as string[]),
      'General',
    ]),
  ).filter((s) => !deletedSections.includes(s));

  const grouped: Record<string, FormField[]> = {};
  fields.forEach((f) => {
    const sec =
      f.section || (selectedForm === 'Enrollment Wizard' ? inferSection(f.label) : 'General');
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(f);
  });

  const activeSections = allSectionNames.filter(
    (sec) =>
      (grouped[sec] && grouped[sec].length > 0) ||
      customSections.includes(sec) ||
      addingToSection === sec,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Forms"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <FormBuilderToolbar
          selectedForm={selectedForm}
          isDefault={isDefault}
          saving={saving}
          onOpenFormModal={() => setShowFormModal(true)}
          onNavigateDirect={(route) => navigation?.navigate?.(route as any)}
          onPreview={() => setShowPreviewModal(true)}
          onReset={handleReset}
          onSave={handleSave}
        />

        {/* Canvas Box */}
        <View style={styles.canvasContainer}>
          <View style={styles.canvasHeaderRow}>
            <Text style={styles.canvasHeader}>FORM CANVAS — {selectedForm.toUpperCase()}</Text>
            {selectedForm === 'ABLLS Assessment Form' && (
              <TouchableOpacity
                style={styles.addSkillTypeTopBtn}
                onPress={() => {
                  setNewSkillTypeName('');
                  setShowAddSkillTypeModal(true);
                }}
              >
                <Feather name="folder-plus" size={13} color="#0284C7" />
                <Text style={styles.addSkillTypeTopBtnText}>Add a Skill Type</Text>
              </TouchableOpacity>
            )}
            {selectedForm === 'Enrollment Wizard' && (
              <TouchableOpacity
                style={styles.addSkillTypeTopBtn}
                onPress={() => {
                  setNewInfoTypeName('');
                  setShowAddInfoTypeModal(true);
                }}
              >
                <Feather name="folder-plus" size={13} color="#0284C7" />
                <Text style={styles.addSkillTypeTopBtnText}>Add a Info Type</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Scoring Scale Presets for ABLLS */}
          {selectedForm === 'ABLLS Assessment Form' && (
            <View style={styles.abllsPresetBar}>
              <View style={styles.abllsPresetHeader}>
                <Feather name="sliders" size={14} color="#0369A1" />
                <Text style={styles.abllsPresetTitle}>
                  Apply Scoring Scale Preset to All ABLLS Skill Items:
                </Text>
              </View>
              <View style={styles.presetButtonsRow}>
                {SCORE_SCALE_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={styles.presetBtn}
                    onPress={() => applyBulkPreset(preset.options)}
                  >
                    <Text style={styles.presetBtnText}>{preset.short}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeSections.length > 0
            ? activeSections.map((sec) => {
                const sectionItems = grouped[sec] || [];
                const isAblls = selectedForm === 'ABLLS Assessment Form';
                const domainLetter = isAblls ? getDomainLetterForAblls(sec) : null;
                const isExpanded = !collapsedSections[sec];

                return (
                  <FormSectionAccordion
                    key={sec}
                    sectionName={sec}
                    domainLetter={domainLetter}
                    fields={sectionItems}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleSectionCollapse(sec)}
                    onAddField={() => startAddingToSection(sec)}
                    onEditSection={() => handleOpenEditSkillType(sec)}
                    onDeleteSection={() => handleDeleteSkillType(sec)}
                    renderFieldCard={(field) => (
                      <FormFieldCard
                        key={field.id}
                        field={field}
                        onMoveUp={moveFieldUp}
                        onMoveDown={moveFieldDown}
                        onToggleRequired={toggleRequired}
                        onToggleVisible={toggleVisible}
                        onEdit={openEditModal}
                        onDelete={handleDeleteField}
                      />
                    )}
                    renderInlineAdd={
                      addingToSection === sec && showAddFieldBox ? renderInlineAddBox(sec) : null
                    }
                  />
                );
              })
            : fields.map((field) => (
                <FormFieldCard
                  key={field.id}
                  field={field}
                  onMoveUp={moveFieldUp}
                  onMoveDown={moveFieldDown}
                  onToggleRequired={toggleRequired}
                  onToggleVisible={toggleVisible}
                  onEdit={openEditModal}
                  onDelete={handleDeleteField}
                />
              ))}
        </View>

        {/* History Card */}
        {history.length > 0 && (
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
                <Text style={[styles.tableDataCell, { flex: 1, fontWeight: '700' }]}>
                  {item.user}
                </Text>
                <Text style={[styles.tableDataCell, { flex: 1.5 }]}>{item.field}</Text>
                <Text style={[styles.tableDataCell, { flex: 1, color: '#EF4444' }]}>
                  {item.oldValue}
                </Text>
                <Text style={[styles.tableDataCell, { flex: 1, color: '#22C55E' }]}>
                  {item.newValue}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Select Form Modal */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFormModal(false)}
        >
          <View style={styles.dropdownModalBox}>
            {FORMS.map((form) => (
              <TouchableOpacity
                key={form}
                style={[
                  styles.dropdownOption,
                  selectedForm === form && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  setSelectedForm(form);
                  setShowFormModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedForm === form && styles.dropdownOptionTextActive,
                  ]}
                >
                  {form}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Field Modal */}
      {editingField && (
        <Modal
          visible={Boolean(editingField)}
          transparent
          animationType="fade"
          onRequestClose={() => setEditingField(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Edit Field — {editingField.id}</Text>
                  <Text style={styles.modalSubtitle}>Configure field label, type, and options</Text>
                </View>
                <TouchableOpacity onPress={() => setEditingField(null)}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Field Label</Text>
                  <TextInput
                    style={styles.inlineTextInput}
                    value={editLabel}
                    onChangeText={setEditLabel}
                  />
                </View>

                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Field Type</Text>
                  <View style={styles.typeSelectorRow}>
                    {FIELD_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeSelectPill,
                          editType === type && styles.typeSelectPillActive,
                        ]}
                        onPress={() => setEditType(type)}
                      >
                        <Text
                          style={[
                            styles.typeSelectPillText,
                            editType === type && styles.typeSelectPillTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {(editType === 'Dropdown' || editType === 'Radio') && (
                  <View style={styles.editFormGroup}>
                    <Text style={styles.inlineFieldLabel}>Options (comma separated)</Text>
                    <TextInput
                      style={styles.inlineTextInput}
                      value={editOptions}
                      onChangeText={setEditOptions}
                      placeholder="Option 1, Option 2, Option 3"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                )}

                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Section / Domain</Text>
                  <TextInput
                    style={styles.inlineTextInput}
                    value={editSection}
                    onChangeText={setEditSection}
                  />
                </View>

                <View style={[styles.inlineToggleCol, { marginTop: 8 }]}>
                  <Text style={styles.inlineFieldLabel}>Required</Text>
                  <Switch
                    value={editRequired}
                    onValueChange={setEditRequired}
                    trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </ScrollView>

              <View style={styles.inlineButtonRow}>
                <TouchableOpacity style={styles.confirmAddBtn} onPress={handleSaveEditField}>
                  <Text style={styles.confirmAddBtnText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setEditingField(null)}>
                  <Text style={styles.cancelAddBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Skill Type Modal */}
      <Modal
        visible={showAddSkillTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddSkillTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Skill Type Domain</Text>
                <Text style={styles.modalSubtitle}>Create a new category for ABLLS skills</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddSkillTypeModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Domain Name</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={newSkillTypeName}
                  onChangeText={setNewSkillTypeName}
                  placeholder="e.g. Social Play, Motor Planning..."
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleCreateSkillType}>
                <Text style={styles.confirmAddBtnText}>Create Domain</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => setShowAddSkillTypeModal(false)}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Info Type Modal */}
      <Modal
        visible={showAddInfoTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddInfoTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Info Type</Text>
                <Text style={styles.modalSubtitle}>Create a new enrollment category</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddInfoTypeModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Category Name</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={newInfoTypeName}
                  onChangeText={setNewInfoTypeName}
                  placeholder="e.g. Emergency Contact, Insurance..."
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleCreateInfoType}>
                <Text style={styles.confirmAddBtnText}>Create Category</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => setShowAddInfoTypeModal(false)}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Skill Type Modal */}
      <Modal
        visible={Boolean(editingSkillType)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSkillType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rename Section</Text>
                <Text style={styles.modalSubtitle}>Renaming updates all associated fields</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingSkillType(null)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>New Section Name</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editSkillTypeName}
                  onChangeText={setEditSkillTypeName}
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleSaveEditSkillType}>
                <Text style={styles.confirmAddBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => setEditingSkillType(null)}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Live Form Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Live Form Preview — {selectedForm}</Text>
                <Text style={styles.modalSubtitle}>Interactive preview of active fields</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <DynamicFormFields
                formName={selectedForm}
                initialFields={fields.filter((f) => f.visible !== false)}
                values={previewFormValues}
                onChange={(key, val) => setPreviewFormValues((prev) => ({ ...prev, [key]: val }))}
              />
            </ScrollView>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity
                style={styles.confirmAddBtn}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.confirmAddBtnText}>Close Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
  },
  canvasContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  canvasHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  canvasHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addSkillTypeTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    gap: 4,
  },
  addSkillTypeTopBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  abllsPresetBar: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 14,
  },
  abllsPresetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  abllsPresetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  inlineAddContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: 10,
    marginHorizontal: 12,
  },
  inlineAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineAddTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextIdBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  nextIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inlineFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeSelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  typeSelectPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  typeSelectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeSelectPillTextActive: {
    color: '#FFFFFF',
  },
  inlineAddRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineFieldCol: {
    flex: 1,
  },
  inlineToggleCol: {
    alignItems: 'center',
  },
  inlineTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  inlineOptionsRow: {
    marginBottom: 10,
  },
  inlineFieldPromptTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  presetChipText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  inlineButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmAddBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  confirmAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelAddBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  cancelAddBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableDataCell: {
    fontSize: 12,
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 6,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  dropdownOptionActive: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  dropdownOptionTextActive: {
    color: '#0284C7',
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalBody: {
    marginBottom: spacing.md,
  },
  editFormGroup: {
    marginBottom: 12,
  },
});
