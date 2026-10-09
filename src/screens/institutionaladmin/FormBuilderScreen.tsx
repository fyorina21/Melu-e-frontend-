import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import ScreenLoader from '../../components/ScreenLoader';
import type { InstitutionalAdminStackParamList } from '../../types';

import { FORMS, getNextIdForSection, getDomainLetterForAblls } from './formBuilderConfig';

import { useFormBuilder } from './hooks/useFormBuilder';
import FormBuilderToolbar from './components/FormBuilderToolbar';
import FormSectionAccordion from './components/FormSectionAccordion';
import FormFieldCard from './components/FormFieldCard';
import { InlineAddFieldBox } from './components/InlineAddFieldBox';
import { EditFieldModal } from './components/EditFieldModal';
import { AddDomainModal } from './components/AddDomainModal';
import { FormSelectorModal } from './components/FormSelectorModal';
import { PreviewFormModal } from './components/PreviewFormModal';
import AbllsPresetBar from './components/AbllsPresetBar';
import ModificationHistoryCard from './components/ModificationHistoryCard';
import FormCanvasHeader from './components/FormCanvasHeader';
import { groupFieldsBySection, getDefaultFieldConfigForSection } from './formBuilderHelper';

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
    const config = getDefaultFieldConfigForSection(selectedForm, sec);
    setNewFieldType(config.type);
    setNewFieldLabel(config.label);
    setNewFieldOptions(config.options);
    setNewFieldPlaceholder(config.placeholder);
    setNewFieldRequired(config.required);
    setShowAddFieldBox(true);
  };

  const { grouped, activeSections } = groupFieldsBySection(
    fields,
    availableSections,
    deletedSections,
    customSections,
    selectedForm,
    inferSection,
    addingToSection,
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
            <FormCanvasHeader
              selectedForm={selectedForm}
              onAddSkillType={() => {
                setNewSkillTypeName('');
                setShowAddSkillTypeModal(true);
              }}
              onAddInfoType={() => {
                setNewInfoTypeName('');
                setShowAddInfoTypeModal(true);
              }}
            />

            {/* Scoring Scale Presets for ABLLS */}
            {selectedForm === 'ABLLS Assessment Form' && (
              <AbllsPresetBar onApplyPreset={applyBulkPreset} />
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
          <ModificationHistoryCard history={history} />
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
});
