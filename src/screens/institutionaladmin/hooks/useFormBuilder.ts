import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useToast } from '../../../context/ToastContext';
import {
  useFormConfigQuery,
  useSaveFormConfigMutation,
  useResetFormConfigMutation,
} from '../../../hooks';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
} from '../../../api/institutionalAdminApi';
import type { FormField, HistoryEntry } from '../../../types';
import {
  FORMS,
  getSectionsForForm,
  getNextIdForSection,
  getPresetsForForm,
} from '../formBuilderConfig';

export function useFormBuilder(initialForm: string = FORMS[0]) {
  const { showToast } = useToast();
  const [selectedForm, setSelectedForm] = useState<string>(initialForm);
  const [fields, setFields] = useState<FormField[]>([]);
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  // TanStack React Query Hooks
  const {
    data: configData,
    isLoading: queryLoading,
    refetch: refetchConfig,
  } = useFormConfigQuery(selectedForm);
  const saveMutation = useSaveFormConfigMutation();
  const resetMutation = useResetFormConfigMutation();
  const loading = queryLoading && fields.length === 0;

  // Form Dropdown State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);

  // Add New Field Inline Form State
  const [showAddFieldBox, setShowAddFieldBox] = useState<boolean>(false);
  const [newFieldType, setNewFieldType] = useState<string>('Text');
  const [showTypeModal, setShowTypeModal] = useState<boolean>(false);
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldOptions, setNewFieldOptions] = useState<string>('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState<string>('');
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(false);
  const [newFieldSection, setNewFieldSection] = useState<string>('Student Info');
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  // Skill Type / Info Type / Section State
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [deletedSections, setDeletedSections] = useState<string[]>([]);
  const [showAddSkillTypeModal, setShowAddSkillTypeModal] = useState<boolean>(false);
  const [newSkillTypeName, setNewSkillTypeName] = useState<string>('');
  const [showAddInfoTypeModal, setShowAddInfoTypeModal] = useState<boolean>(false);
  const [newInfoTypeName, setNewInfoTypeName] = useState<string>('');
  const [editingSkillType, setEditingSkillType] = useState<string | null>(null);
  const [editSkillTypeName, setEditSkillTypeName] = useState<string>('');

  // Edit Existing Field Modal State
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editType, setEditType] = useState<string>('Text');
  const [showEditTypeModal, setShowEditTypeModal] = useState<boolean>(false);
  const [editOptions, setEditOptions] = useState<string>('');
  const [editRequired, setEditRequired] = useState<boolean>(false);
  const [editSection, setEditSection] = useState<string>('General');
  const [editLevel, setEditLevel] = useState<string>('');
  const [editPlaceholder, setEditPlaceholder] = useState<string>('');
  const [editHelpText, setEditHelpText] = useState<string>('');
  const [editDefaultValue, setEditDefaultValue] = useState<string>('');

  // Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewFormValues, setPreviewFormValues] = useState<Record<string, any>>({});

  const inferSectionFromId = (id: string, form?: string): string | null => {
    const currentForm = form || selectedForm;
    if (currentForm === 'ABLLS Assessment Form') {
      const match = id.match(/^([A-I])(\d+)$/);
      if (!match) return null;
      const letter = match[1];
      const letterToSection: Record<string, string> = {
        A: 'Visual Performance',
        B: 'Motor Imitation',
        C: 'Vocal Imitation',
        D: 'Receptive Language',
        E: 'Requesting (Mands)',
        F: 'Play and Leisure',
        G: 'Social Interaction',
        H: 'Writing',
        I: 'Dressing',
      };
      return letterToSection[letter] || null;
    }
    if (currentForm === 'Behavioral Assessment' || currentForm === 'Behavior Assessment') {
      if (/^M\d+/i.test(id)) return 'MASS';
      if (/^F\d+/i.test(id)) return 'FAST';
      if (/^ABC/i.test(id) || /^b_/i.test(id)) return 'ABC Tracking';
    }
    return null;
  };

  const inferSection = (label: string): string => {
    const l = label.toLowerCase();
    if (
      l.includes('parent') ||
      l.includes('guardian') ||
      l.includes('mother') ||
      l.includes('father') ||
      l.includes('emergency') ||
      l.includes('family') ||
      l.includes('contact')
    ) {
      return 'Parent Info';
    }
    if (
      l.includes('medical') ||
      l.includes('allerg') ||
      l.includes('doctor') ||
      l.includes('health') ||
      l.includes('insurance') ||
      l.includes('medication') ||
      l.includes('diet') ||
      l.includes('hospital') ||
      l.includes('physician')
    ) {
      return 'Medical Info';
    }
    return 'Student Info';
  };

  const applyConfigData = useCallback(
    (data: any) => {
      let loadedFields = Array.isArray(data?.fields) ? data.fields : [];
      loadedFields = loadedFields.map((f: FormField) => {
        if (!f.section || f.section === 'General') {
          const inferred = inferSectionFromId(f.id);
          if (inferred) return { ...f, section: inferred };
        }
        if (selectedForm === 'Enrollment Wizard' && (!f.section || f.section === 'General')) {
          return { ...f, section: inferSection(f.label) };
        }
        return f;
      });
      setFields(loadedFields);
      setIsDefault(Boolean(data?.isDefault));
      setHistory(Array.isArray(data?.history) ? data.history : []);
      const loadedSections: string[] = Array.isArray(data?.customSections)
        ? data.customSections
        : Array.isArray(data?.sections)
          ? data.sections
          : [];
      setCustomSections(loadedSections);
      const loadedDeleted: string[] = Array.isArray(data?.deletedSections)
        ? data.deletedSections
        : [];
      setDeletedSections(loadedDeleted);
    },
    [selectedForm],
  );

  useEffect(() => {
    if (configData) {
      applyConfigData(configData);
    }
  }, [configData, applyConfigData]);

  const load = useCallback(async () => {
    try {
      const res = await refetchConfig();
      if (res.data) {
        applyConfigData(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load form config from server:', err);
      showToast('Could not load remote form template, using default template', 'info');
    }
  }, [refetchConfig, applyConfigData, showToast]);

  const availableSections = useMemo(() => {
    const base = getSectionsForForm(selectedForm);
    const combined = Array.from(new Set([...base, ...customSections]));
    return combined.filter((s) => !deletedSections.includes(s));
  }, [selectedForm, customSections, deletedSections]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(newFieldSection)) {
      setNewFieldSection(availableSections[0]);
    } else if (availableSections.length === 0) {
      setNewFieldSection('General');
    }
  }, [availableSections, selectedForm]);

  const handleCreateSkillType = () => {
    const trimmed = newSkillTypeName.trim();
    if (!trimmed) {
      showToast('Please enter a skill type name', 'error');
      return;
    }
    const alreadyExists = availableSections.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      showToast(`Skill type "${trimmed}" already exists`, 'info');
      setShowAddSkillTypeModal(false);
      setNewSkillTypeName('');
      return;
    }

    const updatedSections = [...customSections, trimmed];
    const updatedDeleted = deletedSections.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    setCustomSections(updatedSections);
    setDeletedSections(updatedDeleted);
    setIsDefault(false);
    setShowAddSkillTypeModal(false);
    setNewSkillTypeName('');

    saveFormConfig(selectedForm, {
      fields,
      customSections: updatedSections,
      deletedSections: updatedDeleted,
      history,
      isDefault: false,
    })
      .then(() =>
        showToast(
          `Created skill type "${trimmed}". Click "Add" inside it to add items.`,
          'success',
        ),
      )
      .catch(() => showToast(`Created skill type "${trimmed}" — click Save to persist`, 'info'));
  };

  const handleCreateInfoType = () => {
    const trimmed = newInfoTypeName.trim();
    if (!trimmed) {
      showToast('Please enter an info type name', 'error');
      return;
    }
    const alreadyExists = availableSections.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (alreadyExists) {
      showToast(`Info type "${trimmed}" already exists`, 'info');
      setShowAddInfoTypeModal(false);
      setNewInfoTypeName('');
      return;
    }

    const updatedSections = [...customSections, trimmed];
    const updatedDeleted = deletedSections.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    setCustomSections(updatedSections);
    setDeletedSections(updatedDeleted);
    setIsDefault(false);
    setShowAddInfoTypeModal(false);
    setNewInfoTypeName('');

    saveFormConfig(selectedForm, {
      fields,
      customSections: updatedSections,
      deletedSections: updatedDeleted,
      history,
      isDefault: false,
    })
      .then(() =>
        showToast(
          `Created info type "${trimmed}". Click "Add" inside it to add fields.`,
          'success',
        ),
      )
      .catch(() => showToast(`Created info type "${trimmed}" — click Save to persist`, 'info'));
  };

  const handleOpenEditSkillType = (sec: string) => {
    setEditingSkillType(sec);
    setEditSkillTypeName(sec);
  };

  const handleSaveEditSkillType = () => {
    if (!editingSkillType) return;
    const oldName = editingSkillType;
    const newName = editSkillTypeName.trim();
    const isEnrollment = selectedForm === 'Enrollment Wizard';
    const isAblls = selectedForm === 'ABLLS Assessment Form';
    const typeLabel = isEnrollment ? 'Info Type' : isAblls ? 'Skill Type' : 'Section';

    if (!newName) {
      showToast(`Please enter a ${typeLabel.toLowerCase()} name`, 'error');
      return;
    }

    if (newName === oldName) {
      setEditingSkillType(null);
      return;
    }

    const alreadyExists = availableSections.some(
      (s) => s.toLowerCase() === newName.toLowerCase() && s.toLowerCase() !== oldName.toLowerCase(),
    );
    if (alreadyExists) {
      showToast(`${typeLabel} "${newName}" already exists`, 'error');
      return;
    }

    let updatedCustom = [...customSections];
    let updatedDeleted = [...deletedSections];

    if (updatedCustom.includes(oldName)) {
      updatedCustom = updatedCustom.map((s) => (s === oldName ? newName : s));
    } else {
      if (!updatedDeleted.includes(oldName)) {
        updatedDeleted.push(oldName);
      }
      if (!updatedCustom.includes(newName)) {
        updatedCustom.push(newName);
      }
    }

    updatedDeleted = updatedDeleted.filter((s) => s.toLowerCase() !== newName.toLowerCase());

    const updatedFields = fields.map((f) =>
      f.section === oldName ? { ...f, section: newName } : f,
    );

    if (addingToSection === oldName) setAddingToSection(newName);
    if (newFieldSection === oldName) setNewFieldSection(newName);

    setFields(updatedFields);
    setCustomSections(updatedCustom);
    setDeletedSections(updatedDeleted);
    setIsDefault(false);
    setEditingSkillType(null);

    saveFormConfig(selectedForm, {
      fields: updatedFields,
      customSections: updatedCustom,
      deletedSections: updatedDeleted,
      history,
      isDefault: false,
    })
      .then(() =>
        showToast(`Renamed ${typeLabel.toLowerCase()} "${oldName}" to "${newName}"`, 'success'),
      )
      .catch(() => showToast(`Renamed to "${newName}" — click Save to persist`, 'info'));
  };

  const handleDeleteSkillType = (sec: string) => {
    const matchingItems = fields.filter((f) => f.section === sec);
    const isEnrollment = selectedForm === 'Enrollment Wizard';
    const isAblls = selectedForm === 'ABLLS Assessment Form';
    const typeLabel = isEnrollment ? 'Info Type' : isAblls ? 'Skill Type' : 'Section';

    const performDelete = () => {
      const updatedFields = fields.filter((f) => f.section !== sec);
      const updatedCustom = customSections.filter((s) => s !== sec);
      const updatedDeleted = deletedSections.includes(sec)
        ? deletedSections
        : [...deletedSections, sec];

      if (addingToSection === sec) setAddingToSection(null);
      if (newFieldSection === sec) {
        const remaining = availableSections.filter((s) => s !== sec);
        setNewFieldSection(remaining[0] || 'General');
      }

      setFields(updatedFields);
      setCustomSections(updatedCustom);
      setDeletedSections(updatedDeleted);
      setIsDefault(false);

      saveFormConfig(selectedForm, {
        fields: updatedFields,
        customSections: updatedCustom,
        deletedSections: updatedDeleted,
        history,
        isDefault: false,
      })
        .then(() =>
          showToast(
            matchingItems.length > 0
              ? `Deleted ${typeLabel.toLowerCase()} "${sec}" and its items`
              : `Removed ${typeLabel.toLowerCase()} "${sec}"`,
            'info',
          ),
        )
        .catch(() => showToast(`${typeLabel} removed — click Save to persist`, 'info'));
    };

    if (matchingItems.length > 0) {
      Alert.alert(
        `Delete ${typeLabel}`,
        `The "${sec}" ${typeLabel.toLowerCase()} folder contains ${matchingItems.length} item(s). Deleting it will remove the ${typeLabel.toLowerCase()} and all its items. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ],
      );
    } else {
      performDelete();
    }
  };

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

  const moveFieldUp = (id: string) => {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx <= 0) return;
    const targetSec = fields[idx].section;
    let swapIdx = idx - 1;
    if (targetSec) {
      for (let i = idx - 1; i >= 0; i--) {
        if (fields[i].section === targetSec) {
          swapIdx = i;
          break;
        }
      }
    }
    if (swapIdx < 0 || swapIdx === idx) return;

    const updated = [...fields];
    const temp = updated[idx];
    updated[idx] = updated[swapIdx];
    updated[swapIdx] = temp;

    setFields(updated);
    setIsDefault(false);
    showToast('Field moved up — click Save to persist', 'info');
  };

  const moveFieldDown = (id: string) => {
    const idx = fields.findIndex((f) => f.id === id);
    if (idx === -1 || idx >= fields.length - 1) return;
    const targetSec = fields[idx].section;
    let swapIdx = idx + 1;
    if (targetSec) {
      for (let i = idx + 1; i < fields.length; i++) {
        if (fields[i].section === targetSec) {
          swapIdx = i;
          break;
        }
      }
    }
    if (swapIdx >= fields.length || swapIdx === idx) return;

    const updated = [...fields];
    const temp = updated[idx];
    updated[idx] = updated[swapIdx];
    updated[swapIdx] = temp;

    setFields(updated);
    setIsDefault(false);
    showToast('Field moved down — click Save to persist', 'info');
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

    const effectiveSection = addingToSection ?? newFieldSection;
    const targetSection =
      effectiveSection && effectiveSection !== 'General'
        ? effectiveSection
        : availableSections.length > 0
          ? effectiveSection
          : undefined;

    const newId = getNextIdForSection(selectedForm, targetSection, fields);

    const newEntry: FormField = {
      id: newId,
      type: newFieldType,
      label: trimmedLabel,
      required: newFieldRequired,
      visible: true,
      section: targetSection,
      placeholder: newFieldPlaceholder.trim() || undefined,
      ...(parsedOptions && parsedOptions.length > 0 ? { options: parsedOptions } : {}),
    };

    setIsDefault(false);

    const today = new Date().toISOString().split('T')[0];
    const newHistoryEntry: HistoryEntry = {
      date: today,
      user: 'Admin A',
      field: trimmedLabel,
      oldValue: 'None',
      newValue: `Added (${newFieldType}${targetSection ? ` - ${targetSection}` : ''})`,
    };

    const updatedFields = [...fields, newEntry];
    const updatedHistory = [newHistoryEntry, ...history];
    setFields(updatedFields);
    setHistory(updatedHistory);

    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setNewFieldRequired(false);
    setShowAddFieldBox(false);
    setAddingToSection(null);

    saveFormConfig(selectedForm, {
      fields: updatedFields,
      customSections,
      deletedSections,
      history: updatedHistory,
      isDefault: false,
    })
      .then(() => showToast(`Field "${trimmedLabel}" added and saved`, 'success'))
      .catch(() => showToast(`Field added — click Save to persist`, 'info'));
  };

  const openEditModal = (field: FormField) => {
    setEditingField(field);
    setEditLabel(field.label);
    setEditType(field.type);
    setEditOptions(field.options ? field.options.join(', ') : '');
    setEditRequired(field.required);
    setEditSection(
      field.section ||
        (selectedForm === 'Enrollment Wizard' ? inferSection(field.label) : 'General'),
    );
    setEditLevel(field.level || '');
    setEditPlaceholder(field.placeholder || '');
    setEditHelpText(field.helpText || '');
    setEditDefaultValue(field.defaultValue || '');
  };

  const handleSaveEditField = () => {
    if (!editingField) return;
    if (!editLabel.trim()) {
      showToast('Field label cannot be empty', 'error');
      return;
    }
    const trimmedLabel = editLabel.trim();
    const parsedOptions =
      editType === 'Dropdown' || editType === 'Radio'
        ? editOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const allPresets = getPresetsForForm(selectedForm);
    const selectedPreset = allPresets.find((p) => p.label === editLevel);
    const resolvedOptions = selectedPreset
      ? selectedPreset.options
      : editType === 'Dropdown' || editType === 'Radio'
        ? parsedOptions
        : undefined;

    const updatedFields = fields.map((f) =>
      f.id === editingField.id
        ? {
            ...f,
            label: trimmedLabel,
            type: editType,
            required: editRequired,
            section: editSection,
            options: resolvedOptions,
            level: editLevel || undefined,
            placeholder: editPlaceholder.trim() || undefined,
            helpText: editHelpText.trim() || undefined,
            defaultValue: editDefaultValue.trim() || undefined,
          }
        : f,
    );
    setFields(updatedFields);

    const today = new Date().toISOString().split('T')[0];
    const newHistoryEntry: HistoryEntry = {
      date: today,
      user: 'Admin A',
      field: trimmedLabel,
      oldValue: `${editingField.label} (${editingField.options?.join('/') || 'None'})`,
      newValue: `Updated (${editType} - ${parsedOptions?.join('/') || 'None'})`,
    };
    const updatedHistory = [newHistoryEntry, ...history];
    setHistory(updatedHistory);

    setEditingField(null);
    setIsDefault(false);

    saveFormConfig(selectedForm, {
      fields: updatedFields,
      customSections,
      deletedSections,
      history: updatedHistory,
      isDefault: false,
    })
      .then(() => showToast('Field updated and saved', 'success'))
      .catch(() => showToast('Field updated — click Save to persist', 'info'));
  };

  const applyBulkPreset = (presetOptions: string[]) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.type === 'Radio' || f.type === 'Dropdown' || (f.section && f.section !== 'General')) {
          return { ...f, options: presetOptions };
        }
        return f;
      }),
    );
    setIsDefault(false);
    showToast(`Applied preset options to items — click Save to persist`, 'success');
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      showToast('At least one field is required', 'error');
      return;
    }
    try {
      setSaving(true);
      await saveMutation.mutateAsync({
        formName: selectedForm,
        config: {
          fields,
          customSections,
          deletedSections,
          history,
          isDefault: false,
        },
      });
      await load();
      showToast(`Configuration for ${selectedForm} saved successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to save form config:', err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to save form configuration';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Form Configuration',
      `Are you sure you want to restore the default template for "${selectedForm}"? All custom fields and configuration adjustments will be reverted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Default',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetMutation.mutateAsync(selectedForm);
              setCustomSections([]);
              setDeletedSections([]);
              await load();
              showToast(`Reset ${selectedForm} to default template`, 'info');
            } catch (err: any) {
              console.error('Failed to reset form config:', err);
              const msg = err?.response?.data?.error || err?.message || 'Failed to reset form';
              showToast(msg, 'error');
            }
          },
        },
      ],
    );
  };

  return {
    selectedForm,
    setSelectedForm,
    fields,
    setFields,
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
    showTypeModal,
    setShowTypeModal,
    newFieldLabel,
    setNewFieldLabel,
    newFieldOptions,
    setNewFieldOptions,
    newFieldPlaceholder,
    setNewFieldPlaceholder,
    newFieldRequired,
    setNewFieldRequired,
    newFieldSection,
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
    showEditTypeModal,
    setShowEditTypeModal,
    editOptions,
    setEditOptions,
    editRequired,
    setEditRequired,
    editSection,
    setEditSection,
    editLevel,
    setEditLevel,
    editPlaceholder,
    setEditPlaceholder,
    editHelpText,
    setEditHelpText,
    editDefaultValue,
    setEditDefaultValue,
    // Preview modal state
    showPreviewModal,
    setShowPreviewModal,
    previewFormValues,
    setPreviewFormValues,
    showFormModal,
    setShowFormModal,
    // Handlers
    load,
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
    inferSectionFromId,
    inferSection,
  };
}
