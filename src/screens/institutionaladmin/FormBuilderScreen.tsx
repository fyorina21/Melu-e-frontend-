import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ScreenLoader from '../../components/ScreenLoader';
import type { InstitutionalAdminStackParamList, FormField } from '../../types';

import {
  FORMS,
  SCORE_SCALE_PRESETS,
  getNextIdForSection,
  getDomainLetterForAblls,
} from './formBuilderConfig';

import { useFormBuilder } from './hooks/useFormBuilder';
import FormBuilderToolbar from './components/FormBuilderToolbar';
import FormSectionAccordion from './components/FormSectionAccordion';
import FormFieldCard from './components/FormFieldCard';
import { InlineAddFieldBox } from './components/InlineAddFieldBox';
import { EditFieldModal } from './components/EditFieldModal';
import { AddDomainModal } from './components/AddDomainModal';
import { FormSelectorModal } from './components/FormSelectorModal';
import { PreviewFormModal } from './components/PreviewFormModal';

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
    newFieldRequired,
    setNewFieldRequired,
    setNewFieldPlaceholder,
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
        <View style={styles.responsiveContainer}>
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
                  accessibilityRole="button"
                  accessibilityLabel="Add a Skill Type"
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
                  accessibilityRole="button"
                  accessibilityLabel="Add a Info Type"
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
                        addingToSection === sec && showAddFieldBox ? (
                          <InlineAddFieldBox
                            section={sec}
                            nextId={getNextIdForSection(selectedForm, sec, fields)}
                            fieldType={newFieldType}
                            fieldLabel={newFieldLabel}
                            fieldOptions={newFieldOptions}
                            fieldRequired={newFieldRequired}
                            selectedForm={selectedForm}
                            onTypeChange={setNewFieldType}
                            onLabelChange={setNewFieldLabel}
                            onOptionsChange={setNewFieldOptions}
                            onRequiredChange={setNewFieldRequired}
                            onConfirm={handleConfirmAddField}
                            onCancel={() => {
                              setShowAddFieldBox(false);
                              setAddingToSection(null);
                            }}
                          />
                        ) : null
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
        </View>
      </ScrollView>

      {/* Select Form Modal */}
      <FormSelectorModal
        visible={showFormModal}
        selectedForm={selectedForm}
        forms={FORMS}
        onSelectForm={setSelectedForm}
        onClose={() => setShowFormModal(false)}
      />

      {/* Edit Field Modal */}
      <EditFieldModal
        editingField={editingField}
        editLabel={editLabel}
        editType={editType}
        editOptions={editOptions}
        editRequired={editRequired}
        editSection={editSection}
        onLabelChange={setEditLabel}
        onTypeChange={setEditType}
        onOptionsChange={setEditOptions}
        onRequiredChange={setEditRequired}
        onSectionChange={setEditSection}
        onSave={handleSaveEditField}
        onClose={() => setEditingField(null)}
      />

      {/* Add Skill Type Modal */}
      <AddDomainModal
        visible={showAddSkillTypeModal}
        title="Add Skill Type Domain"
        subtitle="Create a new category for ABLLS skills"
        label="Domain Name"
        placeholder="e.g. Social Play, Motor Planning..."
        value={newSkillTypeName}
        onChangeText={setNewSkillTypeName}
        confirmText="Create Domain"
        onConfirm={handleCreateSkillType}
        onCancel={() => setShowAddSkillTypeModal(false)}
      />

      {/* Add Info Type Modal */}
      <AddDomainModal
        visible={showAddInfoTypeModal}
        title="Add Info Type"
        subtitle="Create a new enrollment category"
        label="Category Name"
        placeholder="e.g. Emergency Contact, Insurance..."
        value={newInfoTypeName}
        onChangeText={setNewInfoTypeName}
        confirmText="Create Category"
        onConfirm={handleCreateInfoType}
        onCancel={() => setShowAddInfoTypeModal(false)}
      />

      {/* Edit Skill Type Modal */}
      <AddDomainModal
        visible={Boolean(editingSkillType)}
        title="Rename Section"
        subtitle="Renaming updates all associated fields"
        label="New Section Name"
        placeholder="Enter section name"
        value={editSkillTypeName}
        onChangeText={setEditSkillTypeName}
        confirmText="Save"
        onConfirm={handleSaveEditSkillType}
        onCancel={() => setEditingSkillType(null)}
      />

      {/* Live Form Preview Modal */}
      <PreviewFormModal
        visible={showPreviewModal}
        selectedForm={selectedForm}
        fields={fields}
        values={previewFormValues}
        onChangeValue={(key, val) => setPreviewFormValues((prev) => ({ ...prev, [key]: val }))}
        onClose={() => setShowPreviewModal(false)}
      />
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
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1200,
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
});
