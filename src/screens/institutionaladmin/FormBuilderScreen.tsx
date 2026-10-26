import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Platform,
  Pressable,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { IA_ROUTE_BY_TAB } from '../../components/appNavConfig';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
  getDefaultFormConfig,
} from '../../api/institutionalAdminApi';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { InstitutionalAdminStackParamList } from '../../types';
import { confirmAction } from '../../utils/dialogs';
import {
  useUnsavedChanges,
  usePreventUnsavedNavigation,
} from '../../context/UnsavedChangesContext';
import { EditMetadataModal, TemplateVersionModal, PreviewFormModal } from './components';

import {
  FORMS,
  FIELD_TYPES,
  ENROLLMENT_SECTIONS,
  ABLLS_SECTIONS,
  BEHAVIORAL_SECTIONS,
  PREFERENCE_SECTIONS,
  SENSORY_SECTIONS,
  SOCIAL_SKILLS_SECTIONS,
  getSectionsForForm,
  getPagesForForm,
  ASSESSMENT_DIRECT_ROUTES,
  SCORE_SCALE_PRESETS,
  SOCIAL_SKILLS_PRESETS,
  BEHAVIORAL_PRESETS,
  SENSORY_PRESETS,
  getPresetsForForm,
  BEHAVIOR_LEVELS,
  SECTION_LETTER,
  getNextIdForSection,
  COMMON_SKILL_TYPES,
  COMMON_INFO_TYPES,
  getDomainLetterForAblls,
} from './formBuilderConfig';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  section?: string;
  level?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  minValue?: number | string;
  maxValue?: number | string;
  dataModel?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  phoneCountryCode?: string;
  allowCamera?: boolean;
  allowGallery?: boolean;
  allowedExtensions?: string;
}

interface HistoryEntry {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export const getTypeBadgeStyle = (rawType: string) => {
  const t = (rawType || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (t === 'textarea')
    return { bg: '#F3E8FF', border: '#D8B4FE', text: '#7E22CE', label: 'TextArea' };
  if (t === 'checkboxgroup' || t === 'checkbox')
    return { bg: '#FEF3C7', border: '#FDE68A', text: '#B45309', label: 'Checkbox' };
  if (t === 'switch') return { bg: '#ECFCCB', border: '#D9F99D', text: '#4D7C0F', label: 'Switch' };
  if (t === 'phone') return { bg: '#CCFBF1', border: '#99F6E4', text: '#0F766E', label: 'Phone' };
  if (t === 'imagepicker' || t === 'fileupload' || t === 'file')
    return {
      bg: '#FFE4E6',
      border: '#FECDD3',
      text: '#BE123C',
      label: t.includes('image') ? 'Image' : 'File',
    };
  if (t === 'video' || t === 'videoupload')
    return { bg: '#E0E7FF', border: '#C7D2FE', text: '#3730A3', label: 'Video' };
  if (t === 'sectionheader' || t === 'divider')
    return {
      bg: '#F1F5F9',
      border: '#CBD5E1',
      text: '#334155',
      label: t === 'divider' ? 'Divider' : 'Header',
    };
  if (t === 'number') return { bg: '#DCFCE7', border: '#BBF7D0', text: '#15803D', label: 'Number' };
  if (t === 'date') return { bg: '#EDE9FE', border: '#DDD6FE', text: '#6D28D9', label: 'Date' };
  if (t === 'radio') return { bg: '#E0E7FF', border: '#C7D2FE', text: '#4338CA', label: 'Radio' };
  if (t === 'dropdown')
    return { bg: '#FEF9C3', border: '#FEF08A', text: '#A16207', label: 'Dropdown' };
  if (t === 'counter')
    return { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1', label: 'Counter' };
  if (t === 'timer') return { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C', label: 'Timer' };
  return { bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1', label: rawType || 'Text' };
};

import { FORM_METADATA } from './formBuilderConfig';
export { FORM_METADATA };

interface FieldPropertyEditorProps {
  fieldType: string;
  selectedForm: string;
  placeholder: string;
  onChangePlaceholder: (val: string) => void;
  minValue: string;
  onChangeMinValue: (val: string) => void;
  maxValue: string;
  onChangeMaxValue: (val: string) => void;
  dataModel: string;
  onChangeDataModel: (val: string) => void;
  options: string;
  onChangeOptions: (val: string) => void;
  optionList: string[];
  onChangeOptionList: (val: string[]) => void;
  activeLabel: string;
  onChangeActiveLabel: (val: string) => void;
  inactiveLabel: string;
  onChangeInactiveLabel: (val: string) => void;
  phoneCountryCode: string;
  onChangePhoneCountryCode: (val: string) => void;
  allowCamera: boolean;
  onChangeAllowCamera: (val: boolean) => void;
  allowGallery: boolean;
  onChangeAllowGallery: (val: boolean) => void;
  allowedExtensions: string;
  onChangeAllowedExtensions: (val: string) => void;
}

const FieldPropertyEditor: React.FC<FieldPropertyEditorProps> = ({
  fieldType,
  selectedForm,
  placeholder,
  onChangePlaceholder,
  minValue,
  onChangeMinValue,
  maxValue,
  onChangeMaxValue,
  dataModel,
  onChangeDataModel,
  options,
  onChangeOptions,
  optionList,
  onChangeOptionList,
  activeLabel,
  onChangeActiveLabel,
  inactiveLabel,
  onChangeInactiveLabel,
  phoneCountryCode,
  onChangePhoneCountryCode,
  allowCamera,
  onChangeAllowCamera,
  allowGallery,
  onChangeAllowGallery,
  allowedExtensions,
  onChangeAllowedExtensions,
}) => {
  const normType = (fieldType || '').toLowerCase().replace(/[\s_-]+/g, '');

  if (normType === 'text') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Input Placeholder / Hint (Optional)</Text>
        <Text style={styles.inlineFieldPromptHint}>Guidance shown inside the text input</Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. Enter notes, observations, or student details..."
          placeholderTextColor="#94A3B8"
          value={placeholder}
          onChangeText={onChangePlaceholder}
        />
      </View>
    );
  }

  const InteractiveDatePreviewBox: React.FC<{ placeholder: string }> = ({ placeholder }) => {
    const [selectedDate, setSelectedDate] = useState<string>(
      () => new Date().toISOString().split('T')[0],
    );
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const handlePrevMonth = () => {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    };

    const handleNextMonth = () => {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    };

    const formatDisplay = (isoDate: string, fmt: string) => {
      if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
      const [y, m, d] = isoDate.split('-');
      if (fmt === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
      if (fmt === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
      return isoDate;
    };

    const getToday = () => new Date().toISOString().split('T')[0];
    const getOffset = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    return (
      <View style={[styles.propertyPreviewBox, { maxWidth: 380, width: '100%' }]}>
        <Text style={styles.propertyPreviewHeader}>INTERACTIVE DATE PICKER PREVIEW</Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: isCalendarOpen ? '#0284C7' : '#CBD5E1',
            borderRadius: 8,
            paddingHorizontal: 12,
            minHeight: 44,
            marginTop: 4,
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Toggle Date Picker Preview"
          onPress={() => setIsCalendarOpen(!isCalendarOpen)}
        >
          <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '500' }}>
            {formatDisplay(selectedDate, placeholder || 'YYYY-MM-DD')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#E0F2FE',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Feather name="calendar" size={14} color="#0284C7" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#0369A1' }}>
              {isCalendarOpen ? 'Close' : 'Pick Date'}
            </Text>
          </View>
        </TouchableOpacity>

        {isCalendarOpen && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#BAE6FD',
              borderRadius: 12,
              padding: 12,
              marginTop: 8,
              maxWidth: 360,
              width: '100%',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8 }}>
              QUICK DATE PRESETS:
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { label: 'Today', date: getToday() },
                { label: 'Yesterday', date: getOffset(-1) },
                { label: 'Tomorrow', date: getOffset(1) },
                { label: '+7 Days', date: getOffset(7) },
                { label: '+30 Days', date: getOffset(30) },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={{
                    paddingHorizontal: 12,
                    minHeight: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 8,
                    backgroundColor: selectedDate === item.date ? '#0284C7' : '#F1F5F9',
                  }}
                  onPress={() => {
                    setSelectedDate(item.date);
                    setIsCalendarOpen(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: selectedDate === item.date ? '#FFFFFF' : '#334155',
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Month / Year Nav */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#F0F9FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Feather name="chevron-left" size={18} color="#0284C7" />
              </TouchableOpacity>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
                {monthNames[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: '#F0F9FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Feather name="chevron-right" size={18} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Days of week */}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
            >
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <View
                  key={d}
                  style={{
                    width: '14.28%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 24,
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: '700',
                      color: '#94A3B8',
                    }}
                  >
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <View key={`empty-${idx}`} style={{ width: '14.28%', height: 44, minHeight: 44 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const mStr = String(viewMonth + 1).padStart(2, '0');
                const dStr = String(dayNum).padStart(2, '0');
                const dateIso = `${viewYear}-${mStr}-${dStr}`;
                const isSelected = selectedDate === dateIso;
                const isToday = getToday() === dateIso;

                return (
                  <TouchableOpacity
                    key={dateIso}
                    style={[
                      {
                        width: '14.28%',
                        height: 44,
                        minHeight: 44,
                        minWidth: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                      },
                      isSelected && { backgroundColor: '#0284C7' },
                      isToday &&
                        !isSelected && {
                          borderWidth: 1.5,
                          borderColor: '#38BDF8',
                          backgroundColor: '#F0F9FF',
                        },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Date ${dateIso}`}
                    onPress={() => {
                      setSelectedDate(dateIso);
                      setIsCalendarOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        { fontSize: 13, color: '#334155', fontWeight: '500' },
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                        isToday && !isSelected && { color: '#0284C7', fontWeight: '700' },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F1F5F9',
              }}
            >
              <Text style={{ fontSize: 11, color: '#0369A1', fontStyle: 'italic', flex: 1 }}>
                Selected: {selectedDate} ({formatDisplay(selectedDate, placeholder || 'YYYY-MM-DD')}
                )
              </Text>
              <TouchableOpacity
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  backgroundColor: '#F1F5F9',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setIsCalendarOpen(false)}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (normType === 'date') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Date Input & Date Picker Configuration</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Enable interactive calendar date picker and configure date display format
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6, flexWrap: 'wrap' }}>
          {['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'].map((fmt) => {
            const isFmt = (placeholder || 'YYYY-MM-DD') === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                style={[
                  styles.presetChip,
                  isFmt && { backgroundColor: '#E0F2FE', borderColor: '#0284C7' },
                ]}
                onPress={() => onChangePlaceholder(fmt)}
              >
                <Text
                  style={[styles.presetChipText, isFmt && { color: '#0369A1', fontWeight: '700' }]}
                >
                  {fmt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.inlineFieldLabel}>Custom Format / Placeholder</Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. YYYY-MM-DD"
          placeholderTextColor="#94A3B8"
          value={placeholder}
          onChangeText={onChangePlaceholder}
        />
        <InteractiveDatePreviewBox placeholder={placeholder} />
      </View>
    );
  }

  if (normType === 'textarea') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Multiline Text Area Guidance</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Placeholder shown for expansive comments or observations
        </Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. Enter comprehensive clinical notes, observations..."
          placeholderTextColor="#94A3B8"
          value={placeholder}
          onChangeText={onChangePlaceholder}
        />
        <View style={styles.propertyPreviewBox}>
          <Text style={styles.propertyPreviewHeader}>MULTILINE INPUT PREVIEW</Text>
          <View style={styles.textareaPreviewBox}>
            <Text
              style={[
                styles.textareaPreviewText,
                !placeholder && { color: '#94A3B8', fontStyle: 'italic' },
              ]}
            >
              {placeholder || 'Preview of multiline text entry area for expansive observations...'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (normType === 'number') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Numeric Validation & Constraints</Text>
        <View style={styles.numericValidationNotice}>
          <Feather name="info" size={13} color="#0284C7" />
          <Text style={styles.numericValidationNoticeText}>
            Numeric-only validation enforced (accepts only integers or decimal figures)
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Min Constraint</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={minValue}
              onChangeText={onChangeMinValue}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Max Constraint</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 100"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={maxValue}
              onChangeText={onChangeMaxValue}
            />
          </View>
        </View>
        <View style={{ marginTop: 6 }}>
          <Text style={styles.inlineFieldLabel}>Placeholder Guidance (Optional)</Text>
          <TextInput
            style={styles.inlineTextInput}
            placeholder="e.g. Score (0-100), Count of trials, Duration in minutes"
            placeholderTextColor="#94A3B8"
            value={placeholder}
            onChangeText={onChangePlaceholder}
          />
        </View>
      </View>
    );
  }

  if (normType === 'dropdown') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Dropdown Data Source Binding</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Bind to an existing institutional data model or define custom static choices
        </Text>
        <View style={styles.dataModelSelectorRow}>
          {[
            'Custom Options',
            'ABC Antecedents',
            'ABC Behaviors',
            'ABC Consequences',
            'ABC Locations',
            'Goal Domains',
            'Task Analysis Templates',
            'Students',
            'Teachers',
            'Rooms',
          ].map((model) => {
            const isSelected =
              (model === 'Custom Options' && (!dataModel || dataModel === 'custom')) ||
              dataModel === model;
            return (
              <TouchableOpacity
                key={model}
                style={[styles.skillPresetChip, isSelected && styles.skillPresetChipActive]}
                onPress={() => onChangeDataModel(model === 'Custom Options' ? 'custom' : model)}
              >
                <Text
                  style={[
                    styles.skillPresetChipText,
                    isSelected && styles.skillPresetChipTextActive,
                  ]}
                >
                  {model}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {dataModel && dataModel !== 'custom' ? (
          <View style={styles.dataModelActiveNotice}>
            <Feather name="database" size={14} color="#0284C7" />
            <View style={{ flex: 1 }}>
              <Text style={styles.dataModelActiveNoticeTitle}>
                Bound to Data Model: {dataModel}
              </Text>
              <Text style={styles.dataModelActiveNoticeSub}>
                Options will populate dynamically from the active {dataModel.toLowerCase()} database
                at runtime.
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={styles.inlineFieldLabel}>Custom Options List</Text>
              <TouchableOpacity
                style={styles.addOptionRowBtn}
                onPress={() => {
                  const next = [...optionList, `Option ${optionList.length + 1}`];
                  onChangeOptionList(next);
                  onChangeOptions(next.join(', '));
                }}
              >
                <Feather name="plus" size={12} color="#0284C7" />
                <Text style={styles.addOptionRowBtnText}>Add Option</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.presetChipsRow, { marginBottom: 6 }]}>
              {getPresetsForForm(selectedForm).map((p) => (
                <TouchableOpacity
                  key={p.short}
                  style={styles.presetChip}
                  onPress={() => {
                    onChangeOptionList(p.options);
                    onChangeOptions(p.options.join(', '));
                  }}
                >
                  <Text style={styles.presetChipText}>{p.short}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {optionList.map((opt, idx) => (
              <View key={idx} style={styles.dynamicOptionRow}>
                <View style={styles.dynamicOptionIndexBadge}>
                  <Text style={styles.dynamicOptionIndexText}>{idx + 1}</Text>
                </View>
                <TextInput
                  style={[styles.inlineTextInput, { flex: 1, height: 36 }]}
                  value={opt}
                  onChangeText={(val) => {
                    const next = [...optionList];
                    next[idx] = val;
                    onChangeOptionList(next);
                    onChangeOptions(next.join(', '));
                  }}
                  placeholder={`Option ${idx + 1}`}
                  placeholderTextColor="#94A3B8"
                />
                {optionList.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteOptionBtn}
                    onPress={() => {
                      const next = optionList.filter((_, i) => i !== idx);
                      onChangeOptionList(next);
                      onChangeOptions(next.join(', '));
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (normType === 'checkbox' || normType === 'checkboxgroup') {
    return (
      <View style={styles.inlineOptionsRow}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={styles.inlineFieldPromptTitle}>Checkbox Options List</Text>
          <TouchableOpacity
            style={styles.addOptionRowBtn}
            onPress={() => {
              const next = [...optionList, `Choice ${optionList.length + 1}`];
              onChangeOptionList(next);
              onChangeOptions(next.join(', '));
            }}
          >
            <Feather name="plus" size={12} color="#0284C7" />
            <Text style={styles.addOptionRowBtnText}>Add Option</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inlineFieldPromptHint}>Define multiple-choice checkbox options</Text>

        <View style={[styles.presetChipsRow, { marginBottom: 6, marginTop: 2 }]}>
          {getPresetsForForm(selectedForm).map((p) => (
            <TouchableOpacity
              key={p.short}
              style={styles.presetChip}
              onPress={() => {
                onChangeOptionList(p.options);
                onChangeOptions(p.options.join(', '));
              }}
            >
              <Text style={styles.presetChipText}>{p.short}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {optionList.map((opt, idx) => (
          <View key={idx} style={styles.dynamicOptionRow}>
            <View style={styles.checkboxMockBox}>
              <Feather name="check" size={11} color="#0284C7" />
            </View>
            <TextInput
              style={[styles.inlineTextInput, { flex: 1, height: 36 }]}
              value={opt}
              onChangeText={(val) => {
                const next = [...optionList];
                next[idx] = val;
                onChangeOptionList(next);
                onChangeOptions(next.join(', '));
              }}
              placeholder={`Choice ${idx + 1}`}
              placeholderTextColor="#94A3B8"
            />
            {optionList.length > 1 && (
              <TouchableOpacity
                style={styles.deleteOptionBtn}
                onPress={() => {
                  const next = optionList.filter((_, i) => i !== idx);
                  onChangeOptionList(next);
                  onChangeOptions(next.join(', '));
                }}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  }

  if (normType === 'radio') {
    return (
      <View style={styles.inlineOptionsRow}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={styles.inlineFieldPromptTitle}>Radio Options List & Preview</Text>
          <TouchableOpacity
            style={styles.addOptionRowBtn}
            onPress={() => {
              const next = [...optionList, `Choice ${optionList.length + 1}`];
              onChangeOptionList(next);
              onChangeOptions(next.join(', '));
            }}
          >
            <Feather name="plus" size={12} color="#0284C7" />
            <Text style={styles.addOptionRowBtnText}>Add Option</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inlineFieldPromptHint}>Define single-select radio options</Text>

        <View style={[styles.presetChipsRow, { marginBottom: 6, marginTop: 2 }]}>
          {getPresetsForForm(selectedForm).map((p) => (
            <TouchableOpacity
              key={p.short}
              style={styles.presetChip}
              onPress={() => {
                onChangeOptionList(p.options);
                onChangeOptions(p.options.join(', '));
              }}
            >
              <Text style={styles.presetChipText}>{p.short}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {optionList.map((opt, idx) => (
          <View key={idx} style={styles.dynamicOptionRow}>
            <View style={[styles.radioMockCircle, idx === 0 && { borderColor: '#0284C7' }]}>
              {idx === 0 && <View style={styles.radioMockInnerDot} />}
            </View>
            <TextInput
              style={[styles.inlineTextInput, { flex: 1, height: 36 }]}
              value={opt}
              onChangeText={(val) => {
                const next = [...optionList];
                next[idx] = val;
                onChangeOptionList(next);
                onChangeOptions(next.join(', '));
              }}
              placeholder={`Choice ${idx + 1}`}
              placeholderTextColor="#94A3B8"
            />
            {optionList.length > 1 && (
              <TouchableOpacity
                style={styles.deleteOptionBtn}
                onPress={() => {
                  const next = optionList.filter((_, i) => i !== idx);
                  onChangeOptionList(next);
                  onChangeOptions(next.join(', '));
                }}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={styles.propertyPreviewBox}>
          <Text style={styles.propertyPreviewHeader}>RADIO TOGGLE PREVIEW</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            {optionList.filter(Boolean).map((choice, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.radioMockCircle, i === 0 && { borderColor: '#0284C7' }]}>
                  {i === 0 && <View style={styles.radioMockInnerDot} />}
                </View>
                <Text style={{ fontSize: 12, color: '#334155' }}>{choice}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (normType === 'switch') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Two-State Switch Labels</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Configure custom labels for active and inactive toggle states
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Active State Label</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. Yes / Present / Enabled"
              placeholderTextColor="#94A3B8"
              value={activeLabel}
              onChangeText={onChangeActiveLabel}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Inactive State Label</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. No / Absent / Disabled"
              placeholderTextColor="#94A3B8"
              value={inactiveLabel}
              onChangeText={onChangeInactiveLabel}
            />
          </View>
        </View>

        <View
          style={[
            styles.propertyPreviewBox,
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            },
          ]}
        >
          <View>
            <Text style={styles.propertyPreviewHeader}>TWO-STATE TOGGLE PREVIEW</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', marginTop: 2 }}>
              <Text style={{ color: '#0284C7' }}>{activeLabel || 'Yes'}</Text> /{' '}
              <Text style={{ color: '#64748B' }}>{inactiveLabel || 'No'}</Text>
            </Text>
          </View>
          <Switch
            value={true}
            trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
            thumbColor="#FFFFFF"
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>
    );
  }

  if (normType === 'phone') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Phone Country & Area Code Pairing</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Fixed Ethiopian country code (+251) paired with phone number text field
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ width: 140 }}>
            <Text style={styles.inlineFieldLabel}>Country Code</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {['+251'].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: '#E0F2FE',
                      borderColor: '#0284C7',
                    },
                  ]}
                  onPress={() => onChangePhoneCountryCode(code)}
                >
                  <Text style={[styles.presetChipText, { color: '#0369A1', fontWeight: '700' }]}>
                    {code} (Ethiopia)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Number Placeholder</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 91 234 5678"
              placeholderTextColor="#94A3B8"
              value={placeholder}
              onChangeText={onChangePlaceholder}
            />
          </View>
        </View>
        <View style={styles.propertyPreviewBox}>
          <Text style={styles.propertyPreviewHeader}>PHONE INPUT PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View
              style={{
                backgroundColor: '#E0F2FE',
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#BAE6FD',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>+251</Text>
            </View>
            <Text style={{ fontSize: 13, color: placeholder ? '#334155' : '#94A3B8' }}>
              {placeholder || '91 234 5678'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (normType === 'image' || normType === 'imagepicker') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Image Upload & Camera Capture Controls</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Allow direct camera capture, file upload, or both
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginVertical: 6 }}>
          <TouchableOpacity
            style={[styles.captureToggleBtn, allowCamera && styles.captureToggleBtnActive]}
            onPress={() => onChangeAllowCamera(!allowCamera)}
          >
            <Feather name="camera" size={14} color={allowCamera ? '#0284C7' : '#64748B'} />
            <Text
              style={[
                styles.captureToggleBtnText,
                allowCamera && styles.captureToggleBtnTextActive,
              ]}
            >
              Device Camera {allowCamera ? '✓' : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureToggleBtn, allowGallery && styles.captureToggleBtnActive]}
            onPress={() => onChangeAllowGallery(!allowGallery)}
          >
            <Feather name="image" size={14} color={allowGallery ? '#0284C7' : '#64748B'} />
            <Text
              style={[
                styles.captureToggleBtnText,
                allowGallery && styles.captureToggleBtnTextActive,
              ]}
            >
              Photo Gallery / File {allowGallery ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.inlineFieldLabel}>Specification Guidance (Optional)</Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. Student ID Headshot, Baseline Clinical Photo"
          placeholderTextColor="#94A3B8"
          value={placeholder}
          onChangeText={onChangePlaceholder}
        />
      </View>
    );
  }

  if (normType === 'file' || normType === 'fileupload') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>File Upload & MIME Type Descriptor</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Drag-and-drop / file browser upload control specification
        </Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. .pdf, .docx, .png, .jpg"
          placeholderTextColor="#94A3B8"
          value={allowedExtensions}
          onChangeText={onChangeAllowedExtensions}
        />
        <View style={[styles.presetChipsRow, { marginTop: 4 }]}>
          {[
            { label: 'PDF Only', exts: '.pdf' },
            { label: 'Documents (.pdf, .docx)', exts: '.pdf, .docx' },
            { label: 'Docs & Images (.pdf, .png, .jpg)', exts: '.pdf, .docx, .png, .jpg' },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.label}
              style={[
                styles.presetChip,
                allowedExtensions === preset.exts && {
                  backgroundColor: '#E0F2FE',
                  borderColor: '#0284C7',
                },
              ]}
              onPress={() => onChangeAllowedExtensions(preset.exts)}
            >
              <Text
                style={[
                  styles.presetChipText,
                  allowedExtensions === preset.exts && { color: '#0369A1', fontWeight: '700' },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.fileDropPreviewBox}>
          <Feather name="upload-cloud" size={18} color="#0284C7" />
          <Text style={styles.fileDropPreviewText}>
            Drag & drop or browse files ({allowedExtensions || '.pdf, .docx'})
          </Text>
        </View>
      </View>
    );
  }

  if (normType === 'date') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Date Field Specification</Text>
        <Text style={styles.inlineFieldPromptHint}>Expected date format or purpose</Text>
        <TextInput
          style={styles.inlineTextInput}
          placeholder="e.g. Assessment Date, Target Goal Date, YYYY-MM-DD"
          placeholderTextColor="#94A3B8"
          value={placeholder}
          onChangeText={onChangePlaceholder}
        />
      </View>
    );
  }

  if (normType === 'counter') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Counter Configuration & Constraints</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Numeric counter with interactive + and − increment/decrement controls
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Min Constraint</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 0"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={minValue}
              onChangeText={onChangeMinValue}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inlineFieldLabel}>Max Constraint</Text>
            <TextInput
              style={styles.inlineTextInput}
              placeholder="e.g. 100"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={maxValue}
              onChangeText={onChangeMaxValue}
            />
          </View>
        </View>
        <View style={{ marginTop: 6 }}>
          <Text style={styles.inlineFieldLabel}>Default Starting Value / Placeholder</Text>
          <TextInput
            style={styles.inlineTextInput}
            placeholder="e.g. 0"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={placeholder}
            onChangeText={onChangePlaceholder}
          />
        </View>
        <View style={styles.propertyPreviewBox}>
          <Text style={styles.propertyPreviewHeader}>INTERACTIVE COUNTER PREVIEW</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#F1F5F9',
                borderWidth: 1,
                borderColor: '#CBD5E1',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#334155' }}>−</Text>
            </View>
            <View
              style={{
                minWidth: 54,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#0284C7',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                {placeholder || minValue || '0'}
              </Text>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#0284C7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>+</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (normType === 'timer') {
    return (
      <View style={styles.inlineOptionsRow}>
        <Text style={styles.inlineFieldPromptTitle}>Timer Configuration & Controls</Text>
        <Text style={styles.inlineFieldPromptHint}>
          Interactive duration timer with Start, Pause, and Stop controls
        </Text>
        <View style={{ marginTop: 4 }}>
          <Text style={styles.inlineFieldLabel}>Timer Display Format / Placeholder</Text>
          <TextInput
            style={styles.inlineTextInput}
            placeholder="e.g. MM:SS or Duration"
            placeholderTextColor="#94A3B8"
            value={placeholder}
            onChangeText={onChangePlaceholder}
          />
        </View>
        <View style={styles.propertyPreviewBox}>
          <Text style={styles.propertyPreviewHeader}>INTERACTIVE TIMER PREVIEW</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#CBD5E1',
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginTop: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="clock" size={16} color="#0284C7" />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontWeight: '700',
                  color: '#0F172A',
                }}
              >
                00:00
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View
                style={{
                  backgroundColor: '#0284C7',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Start</Text>
              </View>
              <View
                style={{
                  backgroundColor: '#F59E0B',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Pause</Text>
              </View>
              <View
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Stop</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

export default function FormBuilderScreen({
  navigation,
  route,
}: NativeStackScreenProps<InstitutionalAdminStackParamList, 'FormBuilder'>) {
  const { showToast } = useToast();
  const [selectedForm, setSelectedForm] = useState<string>(() => {
    const fromParam = (route?.params as any)?.form;
    const fromUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('form')
        : null;
    const candidate = fromParam || fromUrl;
    if (candidate) {
      const match = FORMS.find(
        (f) =>
          f.toLowerCase() === candidate.toLowerCase() ||
          (candidate.toLowerCase().includes('social') && f.toLowerCase().includes('social')),
      );
      if (match) return match;
    }
    return FORMS[0];
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { setDirty } = useUnsavedChanges();
  const [isDirty, setIsDirty] = useState<boolean>(false);
  usePreventUnsavedNavigation(navigation, isDirty);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  // Form Metadata State (Editable in accordance with backend configuration)
  const [formId, setFormId] = useState<string>(FORM_METADATA[selectedForm]?.id || 'FRM-SYS-001');
  const [formName, setFormName] = useState<string>(selectedForm);
  const [formOrganization, setFormOrganization] = useState<string>('Melu-e Center');
  const [formRevisionDate, setFormRevisionDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [formRevisionNumber, setFormRevisionNumber] = useState<number>(1);
  const [formRevision, setFormRevision] = useState<string>(
    FORM_METADATA[selectedForm]?.revision || 'Rev 1.0 · 2026-09-19',
  );
  const [formPages, setFormPages] = useState<string>(
    FORM_METADATA[selectedForm]?.pages || 'Page 1 of 1',
  );
  const [showEditMetadataModal, setShowEditMetadataModal] = useState<boolean>(false);
  const [showTemplateVersionModal, setShowTemplateVersionModal] = useState<boolean>(false);

  useEffect(() => {
    const fromParam = (route?.params as any)?.form;
    const fromUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('form')
        : null;
    const candidate = fromParam || fromUrl;
    if (candidate) {
      const match = FORMS.find(
        (f) =>
          f.toLowerCase() === candidate.toLowerCase() ||
          (candidate.toLowerCase().includes('social') && f.toLowerCase().includes('social')),
      );
      if (match && match !== selectedForm) {
        setSelectedForm(match);
      }
    }
  }, [route?.params]);

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
  const [newFieldMinValue, setNewFieldMinValue] = useState<string>('');
  const [newFieldMaxValue, setNewFieldMaxValue] = useState<string>('');
  const [newDataModel, setNewDataModel] = useState<string>('custom');
  const [newOptionList, setNewOptionList] = useState<string[]>([
    'Option 1',
    'Option 2',
    'Option 3',
  ]);
  const [newActiveLabel, setNewActiveLabel] = useState<string>('Yes');
  const [newInactiveLabel, setNewInactiveLabel] = useState<string>('No');
  const [newPhoneCountryCode, setNewPhoneCountryCode] = useState<string>('+251');
  const [newAllowCamera, setNewAllowCamera] = useState<boolean>(true);
  const [newAllowGallery, setNewAllowGallery] = useState<boolean>(true);
  const [newAllowedExtensions, setNewAllowedExtensions] =
    useState<string>('.pdf, .docx, .png, .jpg');

  // Skill Type / Info Type / Section State
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [deletedSections, setDeletedSections] = useState<string[]>([]);

  // Multi-Page Navigation State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewAllPages, setViewAllPages] = useState<boolean>(true);

  // Compute canonical pages for active form
  const formPagesList = useMemo(() => {
    return getPagesForForm(selectedForm, customSections, deletedSections);
  }, [selectedForm, customSections, deletedSections]);

  const totalPages = Math.max(1, formPagesList.length);

  // Default to All Pages whenever switching forms
  useEffect(() => {
    setCurrentPage(1);
    setViewAllPages(true);
  }, [selectedForm]);

  // Keep formPages header string in sync
  useEffect(() => {
    if (viewAllPages) {
      setFormPages(`All Pages (${totalPages})`);
    } else {
      setFormPages(`Page ${currentPage} of ${totalPages}`);
    }
  }, [currentPage, totalPages, viewAllPages]);

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
  const [editOptionList, setEditOptionList] = useState<string[]>([]);
  const [editRequired, setEditRequired] = useState<boolean>(false);
  const [editSection, setEditSection] = useState<string>('General');
  const [editLevel, setEditLevel] = useState<string>('');
  const [editPlaceholder, setEditPlaceholder] = useState<string>('');
  const [editHelpText, setEditHelpText] = useState<string>('');
  const [editDefaultValue, setEditDefaultValue] = useState<string>('');
  const [editMinValue, setEditMinValue] = useState<string>('');
  const [editMaxValue, setEditMaxValue] = useState<string>('');
  const [editDataModel, setEditDataModel] = useState<string>('custom');
  const [editActiveLabel, setEditActiveLabel] = useState<string>('Yes');
  const [editInactiveLabel, setEditInactiveLabel] = useState<string>('No');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState<string>('+251');
  const [editAllowCamera, setEditAllowCamera] = useState<boolean>(true);
  const [editAllowGallery, setEditAllowGallery] = useState<boolean>(true);
  const [editAllowedExtensions, setEditAllowedExtensions] =
    useState<string>('.pdf, .docx, .png, .jpg');

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
    if (currentForm === 'Social Skills Questionnaire') {
      const num = parseInt(id.replace(/^q/i, ''), 10);
      if (!isNaN(num)) {
        if ([2, 4, 7, 10].includes(num)) return 'Communication';
        return 'Social Interaction';
      }
      return 'Social Interaction';
    }
    return null;
  };

  const load = useCallback(async () => {
    try {
      const { data } = await getFormConfig(selectedForm);
      let loadedFields = Array.isArray(data?.fields) ? data.fields : [];
      if (loadedFields.length === 0) {
        const defaultCfg = getDefaultFormConfig(selectedForm);
        if (defaultCfg && Array.isArray(defaultCfg.fields)) {
          loadedFields = defaultCfg.fields;
        }
      }
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

      // Populate metadata
      const meta = data?.metadata || {};
      const loadedFormId =
        data?.formId ||
        data?.form_id ||
        meta.formId ||
        meta.form_id ||
        FORM_METADATA[selectedForm]?.id ||
        'FRM-SYS-001';
      const loadedFormName =
        data?.form_name || data?.formName || meta.formName || meta.form_name || selectedForm;
      const loadedOrg =
        data?.organizationName ||
        data?.organization_name ||
        data?.organization ||
        meta.organization ||
        meta.organizationName ||
        'Melu-e Center';
      const loadedRevNum = Number(
        data?.revisionNumber ||
          data?.revision_number ||
          meta.revisionNumber ||
          meta.revision_number ||
          1,
      );
      const loadedRevDate =
        data?.revisionDate ||
        data?.revision_date ||
        meta.revisionDate ||
        meta.revision_date ||
        new Date().toISOString().split('T')[0];
      const loadedRevision =
        data?.revision ||
        meta.revision ||
        FORM_METADATA[selectedForm]?.revision ||
        `Rev ${loadedRevNum}.0 · ${loadedRevDate}`;
      const loadedPages =
        data?.pages || meta.pages || FORM_METADATA[selectedForm]?.pages || 'Page 1 of 1';

      setFormId(loadedFormId);
      setFormName(loadedFormName);
      setFormOrganization(loadedOrg);
      setFormRevisionNumber(loadedRevNum);
      setFormRevisionDate(loadedRevDate);
      setFormRevision(loadedRevision);
      setFormPages(loadedPages);
    } catch (err) {
      const defaultCfg = getDefaultFormConfig(selectedForm);
      setFields(defaultCfg?.fields || []);
      setIsDefault(true);
      setHistory([]);
      setCustomSections(defaultCfg?.customSections || []);
      setDeletedSections([]);
      const meta = FORM_METADATA[selectedForm];
      setFormId(meta?.id || 'FRM-SYS-001');
      setFormName(selectedForm);
      setFormOrganization('Melu-e Center');
      setFormRevisionNumber(1);
      setFormRevisionDate(new Date().toISOString().split('T')[0]);
      setFormRevision(meta?.revision || 'Rev 1.0 · 2026-09-19');
      setFormPages(meta?.pages || 'Page 1 of 1');
    } finally {
      setLoading(false);
    }
  }, [selectedForm]);

  useEffect(() => {
    load();
  }, [load]);

  // Combined available sections for the current form (presets + custom skill types, excluding deleted)
  const availableSections = useMemo(() => {
    const base = getSectionsForForm(selectedForm);
    const combined = Array.from(new Set([...base, ...customSections]));
    return combined.filter((s) => !deletedSections.includes(s));
  }, [selectedForm, customSections, deletedSections]);

  // Reset the "Add Field" section default whenever the form or available sections change
  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.includes(newFieldSection)) {
      setNewFieldSection(availableSections[0]);
    } else if (availableSections.length === 0) {
      setNewFieldSection('General');
    }
  }, [availableSections, selectedForm]);

  const createSavePayload = useCallback(
    (overrides: Partial<any> = {}) => ({
      fields,
      customSections,
      deletedSections,
      history,
      isDefault: false,
      formId,
      form_id: formId,
      formName,
      form_name: formName,
      revision: formRevision,
      revision_number: formRevisionNumber,
      revisionNumber: formRevisionNumber,
      revision_date: formRevisionDate,
      revisionDate: formRevisionDate,
      organization: formOrganization,
      organization_name: formOrganization,
      organizationName: formOrganization,
      pages: formPages,
      metadata: {
        formId,
        form_id: formId,
        formName,
        form_name: formName,
        revision: formRevision,
        revision_number: formRevisionNumber,
        revisionNumber: formRevisionNumber,
        revision_date: formRevisionDate,
        revisionDate: formRevisionDate,
        organization: formOrganization,
        organization_name: formOrganization,
        organizationName: formOrganization,
        pages: formPages,
      },
      ...overrides,
    }),
    [
      fields,
      customSections,
      deletedSections,
      history,
      formId,
      formName,
      formRevision,
      formRevisionNumber,
      formRevisionDate,
      formOrganization,
      formPages,
    ],
  );

  // Handle creating a new Skill Type folder / domain
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

    saveFormConfig(
      selectedForm,
      createSavePayload({
        customSections: updatedSections,
        deletedSections: updatedDeleted,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast(
          `Created skill type "${trimmed}". Click "Add" inside it to add items.`,
          'success',
        );
      })
      .catch(() => showToast(`Created skill type "${trimmed}" — click Save to persist`, 'info'));
  };

  // Handle creating a new Info Type folder / section for Enrollment Wizard
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

    saveFormConfig(
      selectedForm,
      createSavePayload({
        customSections: updatedSections,
        deletedSections: updatedDeleted,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast(
          `Created info type "${trimmed}". Click "Add" inside it to add fields.`,
          'success',
        );
      })
      .catch(() => showToast(`Created info type "${trimmed}" — click Save to persist`, 'info'));
  };

  // Open Edit Skill Type Modal (works on both new custom and old preset skill types)
  const handleOpenEditSkillType = (sec: string) => {
    setEditingSkillType(sec);
    setEditSkillTypeName(sec);
  };

  // Save changes to Skill Type or Info Type Name (works on both new custom and old preset sections)
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
      // It was an old (preset) type: mark old as deleted, add new as custom
      if (!updatedDeleted.includes(oldName)) {
        updatedDeleted.push(oldName);
      }
      if (!updatedCustom.includes(newName)) {
        updatedCustom.push(newName);
      }
    }

    // In case newName was previously marked deleted, un-delete it
    updatedDeleted = updatedDeleted.filter((s) => s.toLowerCase() !== newName.toLowerCase());

    // Update all fields belonging to the renamed type
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

    saveFormConfig(
      selectedForm,
      createSavePayload({
        fields: updatedFields,
        customSections: updatedCustom,
        deletedSections: updatedDeleted,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast(`Renamed ${typeLabel.toLowerCase()} "${oldName}" to "${newName}"`, 'success');
      })
      .catch(() => showToast(`Renamed to "${newName}" — click Save to persist`, 'info'));
  };

  // Handle deleting a Skill Type or Info Type folder (works on both new custom and old preset sections)
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

      saveFormConfig(
        selectedForm,
        createSavePayload({
          fields: updatedFields,
          customSections: updatedCustom,
          deletedSections: updatedDeleted,
        }),
      )
        .then((res) => {
          const savedData = res?.data;
          if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
          if (savedData?.revision) setFormRevision(savedData.revision);
          if (Array.isArray(savedData?.history)) setHistory(savedData.history);
          showToast(
            matchingItems.length > 0
              ? `Deleted ${typeLabel.toLowerCase()} "${sec}" and its items`
              : `Removed ${typeLabel.toLowerCase()} "${sec}"`,
            'info',
          );
        })
        .catch(() => showToast(`${typeLabel} removed — click Save to persist`, 'info'));
    };

    if (matchingItems.length > 0) {
      confirmAction({
        title: `Delete ${typeLabel}`,
        message: `The "${sec}" ${typeLabel.toLowerCase()} folder contains ${matchingItems.length} item(s). Deleting it will remove the ${typeLabel.toLowerCase()} and all its items. Are you sure?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: performDelete,
      });
    } else {
      performDelete();
    }
  };

  // Pre-compute grouped ABLLS fields outside JSX to avoid IIFE crashes
  const abllsGrouped = useMemo<Record<string, FormField[]>>(() => {
    const grouped: Record<string, FormField[]> = {};
    fields.forEach((f) => {
      const sec = f.section || 'General';
      if (!grouped[sec]) grouped[sec] = [];
      grouped[sec].push(f);
    });
    return grouped;
  }, [fields]);

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
    let updatedHistory = history;
    if (fieldObj) {
      const today = new Date().toISOString().split('T')[0];
      const newHistoryEntry: HistoryEntry = {
        date: today,
        user: 'Admin A',
        field: fieldObj.label,
        oldValue: fieldObj.type,
        newValue: 'Deleted',
      };
      updatedHistory = [newHistoryEntry, ...history];
      setHistory(updatedHistory);
    }
    const updatedFields = fields.filter((f) => f.id !== id);
    setFields(updatedFields);
    setIsDefault(false);
    setIsDirty(true);
    saveFormConfig(
      selectedForm,
      createSavePayload({
        fields: updatedFields,
        history: updatedHistory,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast('Field deleted and saved', 'success');
      })
      .catch(() => showToast('Field deleted — click Save to persist', 'info'));
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

  const cycleSection = (id: string) => {
    const sections = getSectionsForForm(selectedForm);
    if (sections.length === 0) return;
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const current =
          f.section || (selectedForm === 'Enrollment Wizard' ? inferSection(f.label) : 'General');
        const curIdx = sections.indexOf(current);
        const nextIdx = curIdx >= 0 ? (curIdx + 1) % sections.length : 0;
        const nextSection = sections[nextIdx];
        return { ...f, section: nextSection };
      }),
    );
    setIsDefault(false);
    setIsDirty(true);
    showToast('Domain / Target section updated — click Save to persist', 'info');
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
    setIsDirty(true);
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
    setIsDirty(true);
    showToast('Field moved down — click Save to persist', 'info');
  };

  const handleConfirmAddField = () => {
    if (!newFieldLabel.trim()) {
      showToast('Please enter a field label', 'error');
      return;
    }

    const trimmedLabel = newFieldLabel.trim();
    const isOptionsType =
      newFieldType === 'Dropdown' ||
      newFieldType === 'Radio' ||
      newFieldType === 'Checkbox' ||
      newFieldType === 'CheckboxGroup' ||
      newFieldType === 'checkbox_group';

    let resolvedOptions: string[] | undefined = undefined;
    if (isOptionsType) {
      if (newFieldType === 'Dropdown' && newDataModel && newDataModel !== 'custom') {
        resolvedOptions = undefined;
      } else if (newOptionList && newOptionList.length > 0) {
        resolvedOptions = newOptionList.map((s) => s.trim()).filter(Boolean);
      } else if (newFieldOptions) {
        resolvedOptions = newFieldOptions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

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
      options: resolvedOptions && resolvedOptions.length > 0 ? resolvedOptions : undefined,
      minValue: newFieldMinValue.trim() !== '' ? Number(newFieldMinValue) : undefined,
      maxValue: newFieldMaxValue.trim() !== '' ? Number(newFieldMaxValue) : undefined,
      dataModel:
        newFieldType === 'Dropdown' && newDataModel !== 'custom' ? newDataModel : undefined,
      activeLabel: newFieldType === 'Switch' ? newActiveLabel : undefined,
      inactiveLabel: newFieldType === 'Switch' ? newInactiveLabel : undefined,
      phoneCountryCode: newFieldType === 'Phone' ? newPhoneCountryCode : undefined,
      allowCamera: newFieldType === 'Image' ? newAllowCamera : undefined,
      allowGallery: newFieldType === 'Image' ? newAllowGallery : undefined,
      allowedExtensions: newFieldType === 'File' ? newAllowedExtensions : undefined,
    };

    setIsDefault(false);
    setIsDirty(true);

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

    // Reset inline box state
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setNewFieldRequired(false);
    setNewFieldMinValue('');
    setNewFieldMaxValue('');
    setNewDataModel('custom');
    setNewOptionList(['Option 1', 'Option 2', 'Option 3']);
    setNewActiveLabel('Yes');
    setNewInactiveLabel('No');
    setNewPhoneCountryCode('+1 (US)');
    setNewAllowCamera(true);
    setNewAllowGallery(true);
    setNewAllowedExtensions('.pdf, .docx, .png, .jpg');
    setShowAddFieldBox(false);
    setAddingToSection(null);

    // Auto-save with updated fields
    saveFormConfig(
      selectedForm,
      createSavePayload({
        fields: updatedFields,
        history: updatedHistory,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast(`Field "${trimmedLabel}" added and saved`, 'success');
      })
      .catch(() => showToast(`Field added — click Save to persist`, 'info'));
  };

  const openEditModal = (field: FormField) => {
    setEditingField(field);
    setEditLabel(field.label);
    const raw = (field.type || '').toLowerCase().replace(/[\s_-]+/g, '');
    let matchedType: string = 'Text';
    if (raw === 'textarea') matchedType = 'TextArea';
    else if (raw === 'number') matchedType = 'Number';
    else if (raw === 'date') matchedType = 'Date';
    else if (raw === 'dropdown') matchedType = 'Dropdown';
    else if (raw === 'radio') matchedType = 'Radio';
    else if (raw === 'checkbox' || raw === 'checkboxgroup') matchedType = 'Checkbox';
    else if (raw === 'switch') matchedType = 'Switch';
    else if (raw === 'phone') matchedType = 'Phone';
    else if (raw === 'image' || raw === 'imagepicker') matchedType = 'Image';
    else if (raw === 'file' || raw === 'fileupload') matchedType = 'File';
    else if (raw === 'video' || raw === 'videoupload') matchedType = 'Video';
    else {
      const found = FIELD_TYPES.find((ft) => ft.toLowerCase() === field.type?.toLowerCase());
      matchedType = found || 'Text';
    }
    setEditType(matchedType);
    const opts = field.options || [];
    setEditOptions(opts.join(', '));
    setEditOptionList(opts.length > 0 ? [...opts] : ['Option 1', 'Option 2', 'Option 3']);
    setEditRequired(field.required);
    setEditSection(
      field.section ||
        (selectedForm === 'Enrollment Wizard' ? inferSection(field.label) : 'General'),
    );
    setEditLevel(field.level || '');
    setEditPlaceholder(field.placeholder || '');
    setEditHelpText(field.helpText || '');
    setEditDefaultValue(field.defaultValue || '');
    setEditMinValue(field.minValue !== undefined ? String(field.minValue) : '');
    setEditMaxValue(field.maxValue !== undefined ? String(field.maxValue) : '');
    setEditDataModel(field.dataModel || 'custom');
    setEditActiveLabel(field.activeLabel || 'Yes');
    setEditInactiveLabel(field.inactiveLabel || 'No');
    setEditPhoneCountryCode(field.phoneCountryCode || '+251');
    setEditAllowCamera(field.allowCamera ?? true);
    setEditAllowGallery(field.allowGallery ?? true);
    setEditAllowedExtensions(field.allowedExtensions || '.pdf, .docx, .png, .jpg');
  };

  const handleSaveEditField = () => {
    if (!editingField) return;
    if (!editLabel.trim()) {
      showToast('Field label cannot be empty', 'error');
      return;
    }
    const trimmedLabel = editLabel.trim();
    const isOptionsType =
      editType === 'Dropdown' ||
      editType === 'Radio' ||
      editType === 'Checkbox' ||
      editType === 'CheckboxGroup' ||
      editType === 'checkbox_group';

    let resolvedOptions: string[] | undefined = undefined;
    if (isOptionsType) {
      if (editType === 'Dropdown' && editDataModel && editDataModel !== 'custom') {
        resolvedOptions = undefined;
      } else if (editOptionList && editOptionList.length > 0) {
        resolvedOptions = editOptionList.map((s) => s.trim()).filter(Boolean);
      } else if (editOptions) {
        resolvedOptions = editOptions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const allPresets = getPresetsForForm(selectedForm);
    const selectedPreset = allPresets.find((p) => p.label === editLevel);
    if (selectedPreset) {
      resolvedOptions = selectedPreset.options;
    }

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
            minValue: editMinValue.trim() !== '' ? Number(editMinValue) : undefined,
            maxValue: editMaxValue.trim() !== '' ? Number(editMaxValue) : undefined,
            dataModel:
              editType === 'Dropdown' && editDataModel !== 'custom' ? editDataModel : undefined,
            activeLabel: editType === 'Switch' ? editActiveLabel : undefined,
            inactiveLabel: editType === 'Switch' ? editInactiveLabel : undefined,
            phoneCountryCode: editType === 'Phone' ? editPhoneCountryCode : undefined,
            allowCamera: editType === 'Image' ? editAllowCamera : undefined,
            allowGallery: editType === 'Image' ? editAllowGallery : undefined,
            allowedExtensions: editType === 'File' ? editAllowedExtensions : undefined,
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
      newValue: `Updated (${editType} - ${resolvedOptions?.join('/') || 'None'})`,
    };
    const updatedHistory = [newHistoryEntry, ...history];
    setHistory(updatedHistory);

    setEditingField(null);
    setIsDefault(false);
    setIsDirty(true);

    // Auto-save immediately
    saveFormConfig(
      selectedForm,
      createSavePayload({
        fields: updatedFields,
        history: updatedHistory,
      }),
    )
      .then((res) => {
        const savedData = res?.data;
        if (savedData?.revisionNumber) setFormRevisionNumber(Number(savedData.revisionNumber));
        if (savedData?.revision) setFormRevision(savedData.revision);
        if (Array.isArray(savedData?.history)) setHistory(savedData.history);
        showToast('Field updated and saved', 'success');
      })
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
    setIsDirty(true);
    showToast(`Applied preset options to items — click Save to persist`, 'success');
  };

  const applyBulkAbllsPreset = (presetOptions: string[]) => {
    applyBulkPreset(presetOptions);
  };

  const handleSave = async () => {
    if (fields.length === 0) {
      showToast('At least one field is required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const payload = createSavePayload();
      const res = await saveFormConfig(selectedForm, payload);
      const savedData = res?.data || {};

      // Immediately synchronize local state from backend response (avoids race conditions)
      if (savedData.formName || savedData.form_name) {
        setFormName(savedData.formName || savedData.form_name);
      }
      if (savedData.formId || savedData.form_id) {
        setFormId(savedData.formId || savedData.form_id);
      }
      if (savedData.revision || savedData.metadata?.revision) {
        setFormRevision(savedData.revision || savedData.metadata?.revision);
      }
      if (savedData.revisionNumber || savedData.revision_number) {
        setFormRevisionNumber(Number(savedData.revisionNumber || savedData.revision_number));
      }
      if (savedData.organizationName || savedData.organization_name || savedData.organization) {
        setFormOrganization(
          savedData.organizationName || savedData.organization_name || savedData.organization,
        );
      }
      if (savedData.revisionDate || savedData.revision_date) {
        setFormRevisionDate(savedData.revisionDate || savedData.revision_date);
      }
      if (savedData.pages || savedData.metadata?.pages) {
        setFormPages(savedData.pages || savedData.metadata?.pages);
      }
      if (Array.isArray(savedData.history)) {
        setHistory(savedData.history);
      }
      setIsDefault(Boolean(savedData.isDefault));
      setDirty(false);
      setIsDirty(false);

      showToast(`Configuration for ${selectedForm} saved successfully!`, 'success');
    } catch (err) {
      showToast('Failed to save form configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    confirmAction({
      title: 'Reset Form Configuration',
      message: `Are you sure you want to restore the default template for "${selectedForm}"? All custom fields and configuration adjustments will be reverted.`,
      confirmLabel: 'Reset to Default',
      destructive: true,
      onConfirm: async () => {
        try {
          await resetFormToDefault(selectedForm);
          setCustomSections([]);
          setDeletedSections([]);
          await load();
          showToast(`Reset ${selectedForm} to default template`, 'info');
        } catch (err) {
          showToast('Failed to reset form', 'error');
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Form Builder"
        onTabPress={(t: string) => navigation?.navigate?.(IA_ROUTE_BY_TAB[t])}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Title & Subtitle */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Form Builder</Text>
            <Text style={styles.headerSubtitle}>
              Configure enrollment, assessment, and clinical form templates
            </Text>
          </View>
        </View>

        {/* Top Control Row */}
        <View style={styles.topControlRow}>
          <TouchableOpacity
            style={styles.selectDropdown}
            onPress={() => setShowFormModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Select Form Template. Current: ${selectedForm}`}
          >
            <Text style={styles.selectDropdownText}>{selectedForm}</Text>
            <Feather name="chevron-down" size={16} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.livePreviewTopBtn}
            accessibilityRole="button"
            accessibilityLabel="Live Preview Form"
            onPress={() => setShowPreviewModal(true)}
          >
            <Feather name="eye" size={14} color="#0284C7" />
            <Text style={styles.livePreviewTopBtnText}>Live Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templatesTopBtn}
            accessibilityRole="button"
            accessibilityLabel="Templates & Versions"
            onPress={() => setShowTemplateVersionModal(true)}
          >
            <Feather name="layers" size={14} color="#475569" />
            <Text style={styles.templatesTopBtnText}>Templates & Versions</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <View style={[styles.badge, isDefault ? styles.badgeDefault : styles.badgeCustom]}>
            <Text
              style={[
                styles.badgeText,
                isDefault ? styles.badgeTextDefault : styles.badgeTextCustom,
              ]}
            >
              {isDefault ? 'Using Default Template' : 'Custom Template'}
            </Text>
          </View>
        </View>

        {/* Standard Form Header Component (Editable) */}
        <View style={styles.formHeaderCard}>
          <View style={styles.formHeaderTop}>
            <View style={styles.formMetaLeft}>
              <View style={styles.metaRowItem}>
                <Text style={styles.metaLabel}>FORM ID:</Text>
                <Text style={styles.metaValue}>{formId}</Text>
              </View>
              <View style={styles.metaRowItem}>
                <Text style={styles.metaLabel}>FORM NAME:</Text>
                <Text style={styles.metaValue}>{formName}</Text>
              </View>
              <View style={styles.metaRowItem}>
                <Text style={styles.metaLabel}>ORGANIZATION:</Text>
                <Text style={styles.metaValue}>{formOrganization}</Text>
              </View>
            </View>

            <View style={styles.formMetaRight}>
              <View style={styles.metaRowItem}>
                <Text style={styles.metaLabel}>REVISION:</Text>
                <Text style={styles.metaValue}>{formRevision}</Text>
              </View>
              <View style={styles.metaRowItem}>
                <Text style={styles.metaLabel}>PAGE:</Text>
                <View style={styles.pageHeaderNavRow}>
                  <TouchableOpacity
                    style={[
                      styles.pageNavArrowBtn,
                      currentPage <= 1 && styles.pageNavArrowBtnDisabled,
                    ]}
                    disabled={currentPage <= 1}
                    onPress={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setViewAllPages(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go to previous page"
                  >
                    <Feather
                      name="chevron-left"
                      size={13}
                      color={currentPage <= 1 ? '#94A3B8' : '#2563EB'}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pageIndicatorPill}
                    onPress={() => setViewAllPages((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle between single page and all pages view"
                  >
                    <Text style={styles.metaValue}>
                      {viewAllPages
                        ? `All Pages (${totalPages})`
                        : `Page ${currentPage} of ${totalPages}`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.pageNavArrowBtn,
                      currentPage >= totalPages && styles.pageNavArrowBtnDisabled,
                    ]}
                    disabled={currentPage >= totalPages}
                    onPress={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      setViewAllPages(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go to next page"
                  >
                    <Feather
                      name="chevron-right"
                      size={13}
                      color={currentPage >= totalPages ? '#94A3B8' : '#2563EB'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editMetaBtn}
              onPress={() => setShowEditMetadataModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit form header details"
            >
              <Feather name="edit-2" size={13} color="#2563EB" />
              <Text style={styles.editMetaBtnText}>Edit Header</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            {selectedForm !== 'ABLLS Assessment Form' && selectedForm !== 'Enrollment Wizard' && (
              <TouchableOpacity
                style={styles.addSkillTypeTopBtn}
                onPress={() => {
                  setNewSkillTypeName('');
                  setShowAddSkillTypeModal(true);
                }}
              >
                <Feather name="folder-plus" size={13} color="#0284C7" />
                <Text style={styles.addSkillTypeTopBtnText}>Add a Section</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Multi-Page Stepper Navigation Bar */}
          {totalPages > 1 && (
            <View style={styles.canvasPageStepperBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.canvasPageStepperScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.canvasPageStepPill,
                    viewAllPages && styles.canvasPageStepPillActive,
                  ]}
                  onPress={() => setViewAllPages(true)}
                  accessibilityRole="button"
                  accessibilityLabel="View all pages"
                >
                  <Feather name="layers" size={13} color={viewAllPages ? '#FFFFFF' : '#475569'} />
                  <Text
                    style={[
                      styles.canvasPageStepPillText,
                      viewAllPages && styles.canvasPageStepPillTextActive,
                    ]}
                  >
                    All Pages ({totalPages})
                  </Text>
                </TouchableOpacity>

                {formPagesList.map((pgName, idx) => {
                  const pageNum = idx + 1;
                  const isActive = !viewAllPages && currentPage === pageNum;
                  return (
                    <TouchableOpacity
                      key={pgName + idx}
                      style={[
                        styles.canvasPageStepPill,
                        isActive && styles.canvasPageStepPillActive,
                      ]}
                      onPress={() => {
                        setCurrentPage(pageNum);
                        setViewAllPages(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to Page ${pageNum}: ${pgName}`}
                    >
                      <View
                        style={[styles.canvasStepBadge, isActive && styles.canvasStepBadgeActive]}
                      >
                        <Text
                          style={[
                            styles.canvasStepBadgeText,
                            isActive && styles.canvasStepBadgeTextActive,
                          ]}
                        >
                          {pageNum}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.canvasPageStepPillText,
                          isActive && styles.canvasPageStepPillTextActive,
                        ]}
                      >
                        {pgName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Quick Scoring Scale Presets — ONLY on ABLLS Assessment Form */}
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

          {/* Quick Rating Scale Presets — Social Skills Questionnaire */}
          {(selectedForm === 'Social Skills Questionnaire' ||
            (!viewAllPages &&
              formPagesList[currentPage - 1] === 'Social Skills Questionnaire')) && (
            <View style={styles.abllsPresetBar}>
              <View style={styles.abllsPresetHeader}>
                <Feather name="sliders" size={14} color="#0369A1" />
                <Text style={styles.abllsPresetTitle}>
                  Apply Rating Scale Preset to Social Skill Items:
                </Text>
              </View>
              <View style={styles.presetButtonsRow}>
                {SOCIAL_SKILLS_PRESETS.map((preset) => (
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

          {availableSections.length > 0
            ? (() => {
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
                    f.section ||
                    (selectedForm === 'Enrollment Wizard' ? inferSection(f.label) : 'General');
                  if (!grouped[sec]) grouped[sec] = [];
                  grouped[sec].push(f);
                });

                const activePageName = formPagesList[currentPage - 1];

                const displayedSectionNames = viewAllPages
                  ? allSectionNames.filter(
                      (sec) =>
                        (grouped[sec] && grouped[sec].length > 0) ||
                        customSections.includes(sec) ||
                        addingToSection === sec,
                    )
                  : allSectionNames.filter(
                      (sec) =>
                        sec.toLowerCase().trim() === activePageName?.toLowerCase().trim() ||
                        (activePageName &&
                          sec.toLowerCase().includes(activePageName.toLowerCase())),
                    );

                const finalSections =
                  !viewAllPages && displayedSectionNames.length === 0 && activePageName
                    ? [activePageName]
                    : displayedSectionNames;

                return (
                  <View style={{ gap: spacing.md }}>
                    {!viewAllPages && activePageName && (
                      <View style={styles.activePageBanner}>
                        <View style={styles.activePageBannerLeft}>
                          <View style={styles.activePageNumBadge}>
                            <Text style={styles.activePageNumText}>{currentPage}</Text>
                          </View>
                          <View>
                            <Text style={styles.activePageBannerTitle}>
                              PAGE {currentPage} OF {totalPages} — {activePageName.toUpperCase()}
                            </Text>
                            <Text style={styles.activePageBannerSubtitle}>
                              Form fields configured on this page are presented to users during this
                              step
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {finalSections.length === 0 && (
                      <View style={styles.emptyStateCard}>
                        <Feather
                          name="inbox"
                          size={36}
                          color="#94A3B8"
                          style={{ marginBottom: 12 }}
                        />
                        <Text style={styles.emptyStateTitle}>No Sections or Fields Configured</Text>
                        <Text style={styles.emptyStateSub}>
                          Nothing has been added to this form yet. Add a section or question to
                          start configuring your form template.
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.emptySectionAddBtn,
                            { marginTop: 14, paddingHorizontal: 16, paddingVertical: 8 },
                          ]}
                          onPress={() => {
                            if (selectedForm === 'Enrollment Wizard') {
                              setNewInfoTypeName('');
                              setShowAddInfoTypeModal(true);
                            } else {
                              setNewSkillTypeName('');
                              setShowAddSkillTypeModal(true);
                            }
                          }}
                        >
                          <Feather name="plus" size={14} color="#0284C7" />
                          <Text style={[styles.emptySectionAddBtnText, { fontSize: 13 }]}>
                            {selectedForm === 'Enrollment Wizard'
                              ? 'Add First Info Type'
                              : selectedForm === 'ABLLS Assessment Form'
                                ? 'Add First Skill Type'
                                : 'Add First Section'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {finalSections.map((sec) => {
                      const nextId = getNextIdForSection(selectedForm, sec, fields);
                      const sectionItems = grouped[sec] || [];
                      const isCustomSection = customSections.includes(sec);

                      return (
                        <View key={sec} style={styles.sectionContainer}>
                          {/* Section Header with + Add button, Edit button, and Delete button */}
                          <View style={styles.sectionHeader}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                flex: 1,
                              }}
                            >
                              <Feather name="folder" size={13} color="#0369A1" />
                              <Text style={styles.sectionHeaderText}>{sec}</Text>
                              <Text style={styles.sectionHeaderCount}>
                                {sectionItems.length} item{sectionItems.length !== 1 ? 's' : ''}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <TouchableOpacity
                                style={styles.sectionAddBtn}
                                onPress={() => {
                                  setAddingToSection(sec);
                                  setNewFieldSection(sec);
                                  const isAblls = selectedForm === 'ABLLS Assessment Form';
                                  const isSocial =
                                    selectedForm === 'Social Skills Questionnaire' ||
                                    sec === 'Social Skills Questionnaire';
                                  setNewFieldType(
                                    selectedForm === 'Behavioral Assessment' &&
                                      sec === 'ABC Tracking'
                                      ? 'Text'
                                      : isAblls || isSocial
                                        ? 'Radio'
                                        : 'Text',
                                  );
                                  setNewFieldLabel('');
                                  setNewFieldOptions(
                                    isAblls
                                      ? '0 — Not Demonstrated, 1 — Emerging, 2 — Mastered, N/A'
                                      : isSocial
                                        ? '0 — Never, 1 — Sometimes, 2 — Often, 3 — Always'
                                        : '',
                                  );
                                  setNewFieldPlaceholder(
                                    isSocial ? `e.g. ${nextId}: Expresses empathy to peers` : '',
                                  );
                                  setNewFieldRequired(true);
                                  setShowAddFieldBox(true);
                                }}
                              >
                                <Feather name="plus" size={11} color="#0284C7" />
                                <Text style={styles.sectionAddBtnText}>Add</Text>
                              </TouchableOpacity>

                              {/* Edit option for ALL sections (new custom + old presets) */}
                              <TouchableOpacity
                                style={styles.sectionEditBtn}
                                onPress={() => handleOpenEditSkillType(sec)}
                                accessibilityLabel={`Edit ${selectedForm === 'Enrollment Wizard' ? 'info type' : selectedForm === 'ABLLS Assessment Form' ? 'skill type' : 'section'} ${sec}`}
                              >
                                <Feather name="edit-2" size={11} color="#0284C7" />
                                <Text style={styles.sectionEditBtnText}>Edit</Text>
                              </TouchableOpacity>

                              {/* Delete option for ALL sections (new custom + old presets) */}
                              <TouchableOpacity
                                style={styles.sectionDeleteBtn}
                                onPress={() => handleDeleteSkillType(sec)}
                                accessibilityLabel={`Delete ${selectedForm === 'Enrollment Wizard' ? 'info type' : selectedForm === 'ABLLS Assessment Form' ? 'skill type' : 'section'} ${sec}`}
                              >
                                <Feather name="trash-2" size={13} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Empty state helper if folder has 0 items */}
                          {sectionItems.length === 0 && addingToSection !== sec && (
                            <View style={styles.emptySectionBox}>
                              <Feather name="inbox" size={18} color="#94A3B8" />
                              <Text style={styles.emptySectionText}>
                                {selectedForm === 'Enrollment Wizard'
                                  ? 'Empty info type folder (0 items).'
                                  : selectedForm === 'ABLLS Assessment Form'
                                    ? 'Empty skill type folder (0 items).'
                                    : 'Empty folder (0 items).'}
                              </Text>
                              <TouchableOpacity
                                style={styles.emptySectionAddBtn}
                                onPress={() => {
                                  setAddingToSection(sec);
                                  setNewFieldSection(sec);
                                  const isAblls = selectedForm === 'ABLLS Assessment Form';
                                  const isSocial =
                                    selectedForm === 'Social Skills Questionnaire' ||
                                    sec === 'Social Skills Questionnaire';
                                  setNewFieldType(
                                    selectedForm === 'Behavioral Assessment' &&
                                      sec === 'ABC Tracking'
                                      ? 'Text'
                                      : isAblls || isSocial
                                        ? 'Radio'
                                        : 'Text',
                                  );
                                  setNewFieldLabel('');
                                  setNewFieldOptions(
                                    isAblls
                                      ? '0 — Not Demonstrated, 1 — Emerging, 2 — Mastered, N/A'
                                      : isSocial
                                        ? '0 — Never, 1 — Sometimes, 2 — Often, 3 — Always'
                                        : '',
                                  );
                                  setNewFieldPlaceholder(
                                    isSocial ? `e.g. ${nextId}: Expresses empathy to peers` : '',
                                  );
                                  setNewFieldRequired(true);
                                  setShowAddFieldBox(true);
                                }}
                              >
                                <Feather name="plus" size={12} color="#0284C7" />
                                <Text style={styles.emptySectionAddBtnText}>
                                  Add First Item to {sec}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          {sectionItems.map((field) => {
                            const badge = getTypeBadgeStyle(field.type);
                            return (
                              <View
                                key={field.id}
                                style={[styles.fieldRow, !field.visible && styles.fieldRowHidden]}
                              >
                                <View
                                  style={[
                                    styles.typeBadge,
                                    { backgroundColor: badge.bg, borderColor: badge.border },
                                  ]}
                                >
                                  <Text style={[styles.typeBadgeText, { color: badge.text }]}>
                                    {badge.label}
                                  </Text>
                                </View>

                                <View style={{ flex: 1 }}>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 6,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Text style={styles.fieldLabelText}>
                                      {field.label}{' '}
                                      {field.required && (
                                        <Text style={{ color: '#EF4444' }}>*</Text>
                                      )}
                                    </Text>
                                    {field.level && (
                                      <View style={styles.levelPill}>
                                        <Text style={styles.levelPillText}>{field.level}</Text>
                                      </View>
                                    )}
                                  </View>
                                  {field.options && field.options.length > 0 && (
                                    <Text style={styles.fieldOptionsText} numberOfLines={1}>
                                      Options: {field.options.join(', ')}
                                    </Text>
                                  )}
                                </View>

                                <View style={styles.rowRightControls}>
                                  <TouchableOpacity
                                    onPress={() => moveFieldUp(field.id)}
                                    style={styles.iconBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Move field ${field.label} up`}
                                  >
                                    <Feather name="arrow-up" size={15} color="#475569" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => moveFieldDown(field.id)}
                                    style={styles.iconBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Move field ${field.label} down`}
                                  >
                                    <Feather name="arrow-down" size={15} color="#475569" />
                                  </TouchableOpacity>
                                  <Text style={styles.controlLabel}>Required</Text>
                                  <Switch
                                    value={field.required}
                                    onValueChange={() => toggleRequired(field.id)}
                                    trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                                    thumbColor="#FFFFFF"
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                  />
                                  <TouchableOpacity
                                    onPress={() => openEditModal(field)}
                                    style={styles.iconBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Edit field ${field.label}`}
                                  >
                                    <Feather name="edit-2" size={15} color="#0284C7" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => toggleVisible(field.id)}
                                    style={styles.iconBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Toggle visibility for field ${field.label}`}
                                  >
                                    <Feather
                                      name={field.visible ? 'eye' : 'eye-off'}
                                      size={16}
                                      color={field.visible ? '#0284C7' : '#94A3B8'}
                                    />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleDeleteField(field.id)}
                                    style={styles.iconBtn}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Delete field ${field.label}`}
                                  >
                                    <Feather name="trash-2" size={16} color="#F87171" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}

                          {/* Inline add form pinned to this section */}
                          {showAddFieldBox && addingToSection === sec && (
                            <View
                              style={[
                                styles.inlineAddContainer,
                                { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' },
                              ]}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginBottom: 8,
                                }}
                              >
                                <Feather name="folder" size={12} color="#0284C7" />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0369A1' }}>
                                  Adding to: {sec}
                                </Text>
                                <View
                                  style={[
                                    styles.levelPill,
                                    { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
                                  ]}
                                >
                                  <Text style={[styles.levelPillText, { color: '#1D4ED8' }]}>
                                    Suggested ID: {nextId}
                                  </Text>
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
                                        style={[
                                          styles.typeSelectPill,
                                          isSelected && styles.typeSelectPillActive,
                                        ]}
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
                                    onChangeText={(val: string) => setNewFieldLabel(val)}
                                    onSubmitEditing={handleConfirmAddField}
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

                              <FieldPropertyEditor
                                fieldType={newFieldType}
                                selectedForm={selectedForm}
                                placeholder={newFieldPlaceholder}
                                onChangePlaceholder={setNewFieldPlaceholder}
                                minValue={newFieldMinValue}
                                onChangeMinValue={setNewFieldMinValue}
                                maxValue={newFieldMaxValue}
                                onChangeMaxValue={setNewFieldMaxValue}
                                dataModel={newDataModel}
                                onChangeDataModel={setNewDataModel}
                                options={newFieldOptions}
                                onChangeOptions={setNewFieldOptions}
                                optionList={newOptionList}
                                onChangeOptionList={setNewOptionList}
                                activeLabel={newActiveLabel}
                                onChangeActiveLabel={setNewActiveLabel}
                                inactiveLabel={newInactiveLabel}
                                onChangeInactiveLabel={setNewInactiveLabel}
                                phoneCountryCode={newPhoneCountryCode}
                                onChangePhoneCountryCode={setNewPhoneCountryCode}
                                allowCamera={newAllowCamera}
                                onChangeAllowCamera={setNewAllowCamera}
                                allowGallery={newAllowGallery}
                                onChangeAllowGallery={setNewAllowGallery}
                                allowedExtensions={newAllowedExtensions}
                                onChangeAllowedExtensions={setNewAllowedExtensions}
                              />
                              <View style={styles.inlineButtonRow}>
                                <TouchableOpacity
                                  style={styles.confirmAddBtn}
                                  onPress={handleConfirmAddField}
                                >
                                  <Text style={styles.confirmAddBtnText}>Add Field</Text>
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
                          )}
                        </View>
                      );
                    })}

                    {!viewAllPages && totalPages > 1 && (
                      <View style={styles.canvasPageNavRow}>
                        <TouchableOpacity
                          style={[
                            styles.canvasPageNavBtn,
                            currentPage <= 1 && styles.canvasPageNavBtnDisabled,
                          ]}
                          disabled={currentPage <= 1}
                          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          accessibilityRole="button"
                          accessibilityLabel="Go to previous page"
                        >
                          <Feather
                            name="arrow-left"
                            size={14}
                            color={currentPage <= 1 ? '#94A3B8' : '#1E293B'}
                          />
                          <Text
                            style={[
                              styles.canvasPageNavBtnText,
                              currentPage <= 1 && styles.canvasPageNavBtnTextDisabled,
                            ]}
                          >
                            {currentPage > 1
                              ? `Previous: ${formPagesList[currentPage - 2]}`
                              : 'First Page'}
                          </Text>
                        </TouchableOpacity>

                        <View style={styles.canvasPageNavCenterIndicator}>
                          <Text style={styles.canvasPageNavIndicatorText}>
                            Page {currentPage} of {totalPages}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.canvasPageNavBtn,
                            currentPage >= totalPages && styles.canvasPageNavBtnDisabled,
                          ]}
                          disabled={currentPage >= totalPages}
                          onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          accessibilityRole="button"
                          accessibilityLabel="Go to next page"
                        >
                          <Text
                            style={[
                              styles.canvasPageNavBtnText,
                              currentPage >= totalPages && styles.canvasPageNavBtnTextDisabled,
                            ]}
                          >
                            {currentPage < totalPages
                              ? `Next: ${formPagesList[currentPage]}`
                              : 'Last Page'}
                          </Text>
                          <Feather
                            name="arrow-right"
                            size={14}
                            color={currentPage >= totalPages ? '#94A3B8' : '#1E293B'}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })()
            : fields.map((field) => (
                <View
                  key={field.id}
                  style={[styles.fieldRow, !field.visible && styles.fieldRowHidden]}
                >
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: getTypeBadgeStyle(field.type).bg,
                        borderColor: getTypeBadgeStyle(field.type).border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.typeBadgeText, { color: getTypeBadgeStyle(field.type).text }]}
                    >
                      {getTypeBadgeStyle(field.type).label}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={styles.fieldLabelText}>
                        {field.label}{' '}
                        {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
                      </Text>
                      {getSectionsForForm(selectedForm).length > 0 && (
                        <TouchableOpacity
                          style={styles.sectionPill}
                          onPress={() => cycleSection(field.id)}
                        >
                          <Feather name="folder" size={10} color="#0284C7" />
                          <Text style={styles.sectionPillText}>
                            {field.section ||
                              (selectedForm === 'Enrollment Wizard'
                                ? inferSection(field.label)
                                : 'General')}
                          </Text>
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
                    <TouchableOpacity
                      onPress={() => moveFieldUp(field.id)}
                      style={styles.iconBtn}
                      accessibilityLabel="Move Up"
                    >
                      <Feather name="arrow-up" size={15} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveFieldDown(field.id)}
                      style={styles.iconBtn}
                      accessibilityLabel="Move Down"
                    >
                      <Feather name="arrow-down" size={15} color="#475569" />
                    </TouchableOpacity>
                    <Text style={styles.controlLabel}>Required</Text>
                    <Switch
                      value={field.required}
                      onValueChange={() => toggleRequired(field.id)}
                      trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                      thumbColor="#FFFFFF"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />

                    <TouchableOpacity
                      onPress={() => openEditModal(field)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit field ${field.label}`}
                    >
                      <Feather name="edit-2" size={15} color="#0284C7" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => toggleVisible(field.id)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Toggle visibility for field ${field.label}`}
                    >
                      <Feather
                        name={field.visible ? 'eye' : 'eye-off'}
                        size={16}
                        color={field.visible ? '#0284C7' : '#94A3B8'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteField(field.id)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete field ${field.label}`}
                    >
                      <Feather name="trash-2" size={16} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

          {fields.length === 0 && !showAddFieldBox && (
            <View style={styles.emptyStateCard}>
              <Feather name="file-text" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyStateTitle}>No form fields configured</Text>
              <Text style={styles.emptyStateSub}>
                Click &quot;Add New Field&quot; below or select a template to populate fields for
                this form.
              </Text>
            </View>
          )}

          {/* Inline Add Field Box */}
          {!showAddFieldBox ? (
            <View style={styles.canvasBottomActionsRow}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setNewFieldLabel('');
                  setNewFieldOptions('');
                  setNewFieldPlaceholder('');
                  setAddingToSection(null);
                  setShowAddFieldBox(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Add New Field"
              >
                <Feather name="plus" size={16} color="#0284C7" />
                <Text style={styles.addBtnText}>Add New Field</Text>
              </TouchableOpacity>
              {selectedForm === 'ABLLS Assessment Form' && (
                <TouchableOpacity
                  style={styles.addSkillTypeBottomBtn}
                  onPress={() => {
                    setNewSkillTypeName('');
                    setShowAddSkillTypeModal(true);
                  }}
                >
                  <Feather name="folder-plus" size={14} color="#0284C7" />
                  <Text style={styles.addSkillTypeBottomBtnText}>Add a Skill Type</Text>
                </TouchableOpacity>
              )}
              {selectedForm === 'Enrollment Wizard' && (
                <TouchableOpacity
                  style={styles.addSkillTypeBottomBtn}
                  onPress={() => {
                    setNewInfoTypeName('');
                    setShowAddInfoTypeModal(true);
                  }}
                >
                  <Feather name="folder-plus" size={14} color="#0284C7" />
                  <Text style={styles.addSkillTypeBottomBtnText}>Add a Info Type</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.inlineAddContainer}>
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
                    placeholder="Field label..."
                    placeholderTextColor="#94A3B8"
                    value={newFieldLabel}
                    onChangeText={(val: string) => setNewFieldLabel(val)}
                    onSubmitEditing={handleConfirmAddField}
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

              {availableSections.length > 0 && (
                <View style={styles.inlineSectionRow}>
                  <Text style={styles.inlineFieldLabel}>Target Domain / Section</Text>
                  <View style={styles.sectionChipRow}>
                    {availableSections.map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        style={[
                          styles.sectionChip,
                          newFieldSection === sec && styles.sectionChipActive,
                        ]}
                        onPress={() => setNewFieldSection(sec)}
                      >
                        <Text
                          style={[
                            styles.sectionChipText,
                            newFieldSection === sec && styles.sectionChipTextActive,
                          ]}
                        >
                          {sec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <FieldPropertyEditor
                fieldType={newFieldType}
                selectedForm={selectedForm}
                placeholder={newFieldPlaceholder}
                onChangePlaceholder={setNewFieldPlaceholder}
                minValue={newFieldMinValue}
                onChangeMinValue={setNewFieldMinValue}
                maxValue={newFieldMaxValue}
                onChangeMaxValue={setNewFieldMaxValue}
                dataModel={newDataModel}
                onChangeDataModel={setNewDataModel}
                options={newFieldOptions}
                onChangeOptions={setNewFieldOptions}
                optionList={newOptionList}
                onChangeOptionList={setNewOptionList}
                activeLabel={newActiveLabel}
                onChangeActiveLabel={setNewActiveLabel}
                inactiveLabel={newInactiveLabel}
                onChangeInactiveLabel={setNewInactiveLabel}
                phoneCountryCode={newPhoneCountryCode}
                onChangePhoneCountryCode={setNewPhoneCountryCode}
                allowCamera={newAllowCamera}
                onChangeAllowCamera={setNewAllowCamera}
                allowGallery={newAllowGallery}
                onChangeAllowGallery={setNewAllowGallery}
                allowedExtensions={newAllowedExtensions}
                onChangeAllowedExtensions={setNewAllowedExtensions}
              />

              <View style={styles.inlineButtonRow}>
                <TouchableOpacity style={styles.confirmAddBtn} onPress={handleConfirmAddField}>
                  <Text style={styles.confirmAddBtnText}>Add Field</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelAddBtn}
                  onPress={() => setShowAddFieldBox(false)}
                >
                  <Text style={styles.cancelAddBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Feather name="save" size={15} color="#0F172A" />
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Configuration'}</Text>
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

      {/* Select Field Type Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <Pressable style={styles.dropdownModalBox} onPress={(e) => e.stopPropagation()}>
            {FIELD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.dropdownOption,
                  newFieldType === type && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  setNewFieldType(type);
                  setShowTypeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    newFieldType === type && styles.dropdownOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Form Preview Modal — Live Authentic Interactive Experience */}
      <PreviewFormModal
        visible={showPreviewModal}
        selectedForm={selectedForm}
        fields={fields}
        values={previewFormValues}
        customSections={customSections}
        deletedSections={deletedSections}
        onChangeValue={(key, val) => setPreviewFormValues((prev) => ({ ...prev, [key]: val }))}
        onClose={() => setShowPreviewModal(false)}
      />

      {/* Edit Form Metadata Modal */}
      <EditMetadataModal
        visible={showEditMetadataModal}
        initialValues={{
          formId,
          formName,
          revision: formRevision,
          pages: formPages,
          organization: formOrganization,
          revisionDate: formRevisionDate,
          revisionNumber: formRevisionNumber,
        }}
        onSave={(vals) => {
          setFormId(vals.formId);
          setFormName(vals.formName);
          setFormRevision(vals.revision);
          setFormPages(vals.pages);
          if (vals.organization) setFormOrganization(vals.organization);
          if (vals.revisionDate) setFormRevisionDate(vals.revisionDate);
          if (vals.revisionNumber) setFormRevisionNumber(Number(vals.revisionNumber));
          setIsDefault(false);
          setDirty(true);
          setIsDirty(true);
          showToast('Form header updated. Click Save to persist.', 'success');
        }}
        onClose={() => setShowEditMetadataModal(false)}
      />

      {/* Template & Version Management Modal */}
      <TemplateVersionModal
        visible={showTemplateVersionModal}
        selectedForm={selectedForm}
        currentFields={fields}
        history={history}
        formId={formId}
        formRevision={formRevision}
        formName={formName}
        onClose={() => setShowTemplateVersionModal(false)}
        onReuseTemplate={(tplName, tplFields) => {
          setFields(tplFields);
          setIsDefault(tplName.includes('Default'));
          setDirty(true);
          showToast(`Loaded ${tplName} into canvas`, 'info');
        }}
        onImportPdf={(file) => {
          setDirty(true);
          showToast(`Attached ${file.name} to form specifications`, 'success');
        }}
      />

      {/* Edit Field Modal */}
      <Modal
        visible={editingField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Field / Options</Text>
                <Text style={styles.modalSubtitle}>
                  Customize label, scoring options, and requirement
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingField(null)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Field Label */}
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Field Label & Description</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editLabel}
                  onChangeText={(val) => setEditLabel(val)}
                  onSubmitEditing={handleSaveEditField}
                  placeholder="e.g. A1: Matches identical objects"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Field Type & Domain */}
              {/* Field Type Selection */}
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Field Type</Text>
                <View style={styles.typeSelectorRow}>
                  {FIELD_TYPES.map((type) => {
                    const isSelected = editType.toLowerCase() === type.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeSelectPill, isSelected && styles.typeSelectPillActive]}
                        onPress={() => setEditType(type)}
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

              {availableSections.length > 0 && (
                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Domain / Section</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 2 }}
                  >
                    <View style={styles.sectionChipRow}>
                      {availableSections.map((sec) => (
                        <TouchableOpacity
                          key={sec}
                          style={[
                            styles.sectionChip,
                            editSection === sec && styles.sectionChipActive,
                          ]}
                          onPress={() => setEditSection(sec)}
                        >
                          <Text
                            style={[
                              styles.sectionChipText,
                              editSection === sec && styles.sectionChipTextActive,
                            ]}
                          >
                            {sec}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <FieldPropertyEditor
                fieldType={editType}
                selectedForm={selectedForm}
                placeholder={editPlaceholder}
                onChangePlaceholder={setEditPlaceholder}
                minValue={editMinValue}
                onChangeMinValue={setEditMinValue}
                maxValue={editMaxValue}
                onChangeMaxValue={setEditMaxValue}
                dataModel={editDataModel}
                onChangeDataModel={setEditDataModel}
                options={editOptions}
                onChangeOptions={setEditOptions}
                optionList={editOptionList}
                onChangeOptionList={setEditOptionList}
                activeLabel={editActiveLabel}
                onChangeActiveLabel={setEditActiveLabel}
                inactiveLabel={editInactiveLabel}
                onChangeInactiveLabel={setEditInactiveLabel}
                phoneCountryCode={editPhoneCountryCode}
                onChangePhoneCountryCode={setEditPhoneCountryCode}
                allowCamera={editAllowCamera}
                onChangeAllowCamera={setEditAllowCamera}
                allowGallery={editAllowGallery}
                onChangeAllowGallery={setEditAllowGallery}
                allowedExtensions={editAllowedExtensions}
                onChangeAllowedExtensions={setEditAllowedExtensions}
              />

              {/* Scoring Scale Preset — ONLY on ABLLS Assessment Form */}
              {selectedForm === 'ABLLS Assessment Form' && (
                <View style={styles.editFormGroup}>
                  <Text style={styles.inlineFieldLabel}>Scoring Scale Presets</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 4 }}
                  >
                    <View style={styles.sectionChipRow}>
                      {SCORE_SCALE_PRESETS.map((p) => (
                        <TouchableOpacity
                          key={p.label}
                          style={[
                            styles.sectionChip,
                            editLevel === p.label && styles.sectionChipActive,
                          ]}
                          onPress={() => {
                            const isDeselecting = editLevel === p.label;
                            setEditLevel(isDeselecting ? '' : p.label);
                            if (!isDeselecting) {
                              setEditOptions(p.options.join(', '));
                              setEditOptionList(p.options);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.sectionChipText,
                              editLevel === p.label && styles.sectionChipTextActive,
                            ]}
                          >
                            {p.short}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {editLevel !== '' && (
                    <Text style={{ fontSize: 11, color: '#0284C7', marginTop: 3 }}>
                      Preset: {editLevel}
                    </Text>
                  )}
                </View>
              )}

              {/* Field Properties: Help Text */}
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Help Text</Text>
                <TextInput
                  style={[styles.inlineTextInput, { height: 38 }]}
                  value={editHelpText}
                  onChangeText={(val) => setEditHelpText(val)}
                  onSubmitEditing={handleSaveEditField}
                  placeholder="e.g. Guidance for therapist during evaluation session"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Field Properties: Default Value */}
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Default Value</Text>
                <TextInput
                  style={[styles.inlineTextInput, { height: 38 }]}
                  value={editDefaultValue}
                  onChangeText={(val) => setEditDefaultValue(val)}
                  onSubmitEditing={handleSaveEditField}
                  placeholder="e.g. N/A or initial preset value"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Required Switch */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text style={styles.inlineFieldLabel}>Mark as Required Field</Text>
                <Switch
                  value={editRequired}
                  onValueChange={(v) => setEditRequired(v)}
                  trackColor={{ false: '#CBD5E1', true: '#38BDF8' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleSaveEditField}>
                <Text style={styles.confirmAddBtnText}>Save Field Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelAddBtn} onPress={() => setEditingField(null)}>
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Select Field Type Modal for Edit */}
      <Modal
        visible={showEditTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditTypeModal(false)}>
          <Pressable style={styles.dropdownModalBox} onPress={(e) => e.stopPropagation()}>
            {FIELD_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.dropdownOption,
                  editType.toLowerCase() === type.toLowerCase() && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  setEditType(type);
                  setShowEditTypeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    editType.toLowerCase() === type.toLowerCase() &&
                      styles.dropdownOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="folder-plus" size={18} color="#0284C7" />
                  <Text style={styles.modalTitle}>Add a Skill Type</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Creates an ABLLS skill domain with full scoring features matching Vocal Imitation,
                  Motor Imitation, and Visual Performance.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddSkillTypeModal(false)}>
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inlineFieldLabel}>Quick Suggestions / Standard Skill Types:</Text>
              <View style={styles.skillPresetWrap}>
                {COMMON_SKILL_TYPES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.skillPresetChip,
                      newSkillTypeName.toLowerCase() === st.toLowerCase() &&
                        styles.skillPresetChipActive,
                    ]}
                    onPress={() => setNewSkillTypeName(st)}
                  >
                    <Text
                      style={[
                        styles.skillPresetChipText,
                        newSkillTypeName.toLowerCase() === st.toLowerCase() &&
                          styles.skillPresetChipTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Skill Type / Folder Name</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={newSkillTypeName}
                  onChangeText={setNewSkillTypeName}
                  onSubmitEditing={handleCreateSkillType}
                  placeholder="e.g. Visual Imitation, Cognitive Skills, Play & Leisure..."
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>

              {newSkillTypeName.trim().length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#F0F9FF',
                    borderWidth: 1,
                    borderColor: '#BAE6FD',
                    padding: 8,
                    borderRadius: 6,
                    marginTop: 2,
                  }}
                >
                  <Feather name="info" size={14} color="#0284C7" />
                  <Text style={{ fontSize: 11, color: '#0369A1', fontWeight: '600' }}>
                    Assigned Domain Code: {getDomainLetterForAblls(newSkillTypeName.trim(), fields)}{' '}
                    · First Item ID: {getDomainLetterForAblls(newSkillTypeName.trim(), fields)}1
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleCreateSkillType}>
                <Text style={styles.confirmAddBtnText}>Create Skill Type</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => {
                  setShowAddSkillTypeModal(false);
                  setNewSkillTypeName('');
                }}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Info Type Modal — for Enrollment Wizard */}
      <Modal
        visible={showAddInfoTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddInfoTypeModal(false);
          setNewInfoTypeName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="folder-plus" size={18} color="#0284C7" />
                  <Text style={styles.modalTitle}>Add a Info Type</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Creates a new enrollment information category like Student Info, Parent Info, and
                  Medical Info with its own customizable fields.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowAddInfoTypeModal(false);
                  setNewInfoTypeName('');
                }}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inlineFieldLabel}>Quick Suggestions / Standard Info Types:</Text>
              <View style={styles.skillPresetWrap}>
                {COMMON_INFO_TYPES.map((it) => (
                  <TouchableOpacity
                    key={it}
                    style={[
                      styles.skillPresetChip,
                      newInfoTypeName.toLowerCase() === it.toLowerCase() &&
                        styles.skillPresetChipActive,
                    ]}
                    onPress={() => setNewInfoTypeName(it)}
                  >
                    <Text
                      style={[
                        styles.skillPresetChipText,
                        newInfoTypeName.toLowerCase() === it.toLowerCase() &&
                          styles.skillPresetChipTextActive,
                      ]}
                    >
                      {it}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>Info Type / Category Name</Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={newInfoTypeName}
                  onChangeText={setNewInfoTypeName}
                  onSubmitEditing={handleCreateInfoType}
                  placeholder="e.g. Emergency Contact Info, Insurance & Billing..."
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleCreateInfoType}>
                <Text style={styles.confirmAddBtnText}>Create Info Type</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => {
                  setShowAddInfoTypeModal(false);
                  setNewInfoTypeName('');
                }}
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
        onRequestClose={() => {
          setEditingSkillType(null);
          setEditSkillTypeName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="edit-2" size={18} color="#0284C7" />
                  <Text style={styles.modalTitle}>
                    {selectedForm === 'Enrollment Wizard'
                      ? 'Edit Info Type'
                      : selectedForm === 'ABLLS Assessment Form'
                        ? 'Edit Skill Type'
                        : 'Edit Section'}
                  </Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  {selectedForm === 'Enrollment Wizard'
                    ? 'Rename this info type category. All fields belonging to it will update automatically.'
                    : selectedForm === 'ABLLS Assessment Form'
                      ? 'Rename this skill type domain. All items belonging to it will update automatically.'
                      : 'Rename this section. All items belonging to it will update automatically.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingSkillType(null);
                  setEditSkillTypeName('');
                }}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.editFormGroup}>
                <Text style={styles.inlineFieldLabel}>
                  {selectedForm === 'Enrollment Wizard'
                    ? 'Info Type / Category Name'
                    : selectedForm === 'ABLLS Assessment Form'
                      ? 'Skill Type / Domain Name'
                      : 'Section Name'}
                </Text>
                <TextInput
                  style={styles.inlineTextInput}
                  value={editSkillTypeName}
                  onChangeText={setEditSkillTypeName}
                  onSubmitEditing={handleSaveEditSkillType}
                  placeholder={
                    selectedForm === 'Enrollment Wizard'
                      ? 'Enter info type name...'
                      : 'Enter name...'
                  }
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.inlineButtonRow}>
              <TouchableOpacity style={styles.confirmAddBtn} onPress={handleSaveEditSkillType}>
                <Text style={styles.confirmAddBtnText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelAddBtn}
                onPress={() => {
                  setEditingSkillType(null);
                  setEditSkillTypeName('');
                }}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
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

  openAssessmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
  },
  openAssessmentBtnText: { fontSize: 13, fontWeight: '600', color: '#0284C7' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeDefault: { backgroundColor: '#DCFCE7' },
  badgeCustom: { backgroundColor: '#FEF08A' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextDefault: { color: '#166534' },
  badgeTextCustom: { color: '#854D0E' },

  formHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)' }
      : {
          shadowColor: '#000000',
          shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 1,
        }),
  },
  formHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  formMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  formMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  pageHeaderNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNavArrowBtn: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNavArrowBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  pageIndicatorPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  canvasPageStepperBar: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  canvasPageStepperScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  canvasPageStepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  canvasPageStepPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  canvasStepBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasStepBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  canvasStepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  canvasStepBadgeTextActive: {
    color: '#0284C7',
  },
  canvasPageStepPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  canvasPageStepPillTextActive: {
    color: '#FFFFFF',
  },
  activePageBanner: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activePageBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePageNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePageNumText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activePageBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  activePageBannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  canvasPageNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  canvasPageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  canvasPageNavBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  canvasPageNavBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  canvasPageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  canvasPageNavCenterIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  canvasPageNavIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  formHeaderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  formHeaderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formHeaderNameLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  formHeaderNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  canvasContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 10,
  },
  canvasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  canvasHeader: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  addSkillTypeTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addSkillTypeTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  canvasBottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  addSkillTypeBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addSkillTypeBottomBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  sectionContainer: {
    marginBottom: 4,
  },
  sectionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 4,
  },
  sectionEditBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  sectionDeleteBtn: {
    padding: 3,
    marginLeft: 2,
  },
  emptySectionBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 6,
  },
  emptySectionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  emptySectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 2,
  },
  emptySectionAddBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  skillPresetWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  skillPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  skillPresetChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  skillPresetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  skillPresetChipTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },

  abllsPresetBar: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 6,
  },
  abllsPresetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  abllsPresetTitle: {
    fontSize: 12,
    fontWeight: '700',
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
    borderColor: '#0284C7',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  editFormGroup: {
    gap: 4,
    marginBottom: 8,
  },

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
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  typeSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  typeSelectPillActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  typeSelectPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  typeSelectPillTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },
  inlineFieldPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inlineFieldPromptHint: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 2,
    borderRadius: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    flex: 1,
  },
  sectionHeaderCount: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '500',
  },
  sectionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },
  sectionAddBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  levelPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  levelPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }),
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
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
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
  propertyPreviewBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  propertyPreviewHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textareaPreviewBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 8,
    justifyContent: 'center',
  },
  textareaPreviewText: {
    fontSize: 12,
    color: '#334155',
  },
  numericValidationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginVertical: 4,
  },
  numericValidationNoticeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '500',
  },
  dataModelSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  dataModelActiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 10,
    marginVertical: 4,
  },
  dataModelActiveNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  dataModelActiveNoticeSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  addOptionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addOptionRowBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  dynamicOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dynamicOptionIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dynamicOptionIndexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  deleteOptionBtn: {
    padding: 6,
  },
  checkboxMockBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioMockCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioMockInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  captureToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  captureToggleBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  captureToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  captureToggleBtnTextActive: {
    color: '#0284C7',
  },
  fileDropPreviewBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 4,
  },
  fileDropPreviewText: {
    fontSize: 11,
    color: '#475569',
  },
});
