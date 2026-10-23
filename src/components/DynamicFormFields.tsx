import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import { typography } from '../theme/typography';
import { getFormConfig } from '../api/institutionalAdminApi';

export interface DynamicFormField {
  id: string;
  type:
    | 'Text'
    | 'Number'
    | 'Date'
    | 'Dropdown'
    | 'Checkbox'
    | 'Radio'
    | 'TextArea'
    | 'File'
    | 'Counter'
    | 'Timer'
    | 'counter'
    | 'timer'
    | 'textarea'
    | 'checkbox_group'
    | 'CheckboxGroup'
    | 'switch'
    | 'Switch'
    | 'phone'
    | 'Phone'
    | 'image_picker'
    | 'ImagePicker'
    | 'section_header'
    | 'SectionHeader'
    | 'divider'
    | 'Divider'
    | string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  section?: string;
  placeholder?: string;
  helpText?: string;
  help_text?: string;
  default_value?: any;
  ui_props?: any;
  validation?: any;
  is_display_only?: boolean;
  dataModel?: string;
  data_model?: string;
}

const InteractiveCounterField: React.FC<{
  field: DynamicFormField;
  value: any;
  onChange: (fieldIdOrLabel: string, value: any) => void;
}> = ({ field, value, onChange }) => {
  const minVal = Number(field.ui_props?.min_value ?? field.validation?.min_value ?? 0);
  const maxVal = Number(field.ui_props?.max_value ?? field.validation?.max_value ?? 9999);
  const step = Number(field.ui_props?.step ?? 1);
  const currentNum =
    typeof value === 'number' ? value : parseInt(value, 10) || (minVal >= 0 ? minVal : 0);

  const handleUpdate = (next: number) => {
    const clamped = Math.min(maxVal, Math.max(minVal, next));
    onChange(field.id, clamped);
    onChange(field.label, clamped);
  };

  return (
    <View key={field.id} style={styles.field}>
      <Text style={typography.label}>
        {field.label} {field.required && <Text style={styles.required}>*</Text>}
      </Text>
      {Boolean(field.helpText || field.help_text) && (
        <Text style={styles.fieldSpecText}>{field.helpText || field.help_text}</Text>
      )}
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[styles.counterBtn, currentNum <= minVal && styles.counterBtnDisabled]}
          disabled={currentNum <= minVal}
          onPress={() => handleUpdate(currentNum - step)}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${field.label}`}
        >
          <Feather name="minus" size={18} color={currentNum <= minVal ? '#94A3B8' : '#0284C7'} />
        </TouchableOpacity>
        <View style={styles.counterDisplayBox}>
          <Text style={styles.counterDisplayText}>{currentNum}</Text>
        </View>
        <TouchableOpacity
          style={[styles.counterBtn, currentNum >= maxVal && styles.counterBtnDisabled]}
          disabled={currentNum >= maxVal}
          onPress={() => handleUpdate(currentNum + step)}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${field.label}`}
        >
          <Feather name="plus" size={18} color={currentNum >= maxVal ? '#94A3B8' : '#0284C7'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const InteractiveTimerField: React.FC<{
  field: DynamicFormField;
  value: any;
  onChange: (fieldIdOrLabel: string, value: any) => void;
}> = ({ field, value, onChange }) => {
  const [seconds, setSeconds] = useState<number>(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':').map((p) => parseInt(p, 10) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          const mins = String(Math.floor(next / 60)).padStart(2, '0');
          const secs = String(next % 60).padStart(2, '0');
          const formatted = `${mins}:${secs}`;
          onChange(field.id, formatted);
          onChange(field.label, formatted);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, field.id, field.label, onChange]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const displayFormatted = `${mins}:${secs}`;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    onChange(field.id, '00:00');
    onChange(field.label, '00:00');
  };

  return (
    <View key={field.id} style={styles.field}>
      <Text style={typography.label}>
        {field.label} {field.required && <Text style={styles.required}>*</Text>}
      </Text>
      {Boolean(field.helpText || field.help_text) && (
        <Text style={styles.fieldSpecText}>{field.helpText || field.help_text}</Text>
      )}
      <View style={styles.timerContainer}>
        <View style={styles.timerDisplay}>
          <Feather name="clock" size={18} color="#0284C7" />
          <Text style={styles.timerClockText}>{displayFormatted}</Text>
          {isRunning && <View style={styles.timerLiveDot} />}
        </View>
        <View style={styles.timerControlsRow}>
          {!isRunning ? (
            <TouchableOpacity
              style={[styles.timerControlBtn, styles.timerStartBtn]}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel={`Start timer for ${field.label}`}
            >
              <Feather name="play" size={13} color="#FFFFFF" />
              <Text style={styles.timerControlBtnText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.timerControlBtn, styles.timerPauseBtn]}
              onPress={handlePause}
              accessibilityRole="button"
              accessibilityLabel={`Pause timer for ${field.label}`}
            >
              <Feather name="pause" size={13} color="#FFFFFF" />
              <Text style={styles.timerControlBtnText}>Pause</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.timerControlBtn, styles.timerStopBtn]}
            onPress={handleStop}
            accessibilityRole="button"
            accessibilityLabel={`Stop and reset timer for ${field.label}`}
          >
            <Feather name="square" size={13} color="#FFFFFF" />
            <Text style={styles.timerControlBtnText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const DYNAMIC_MODEL_OPTIONS: Record<string, string[]> = {
  students: [
    'Liam Chen (Age 6 - Early Intervention)',
    'Maya Patel (Age 7 - Level 2 Support)',
    'Noah Davis (Age 5 - Language Acquisition)',
    'Emma Wilson (Age 8 - Social Skills)',
    'Sophia Taylor (Age 6 - Behavioral Support)',
    'Lucas Miller (Age 9 - Fluency Program)',
  ],
  teachers: [
    'Sarah Jenkins, BCBA (Clinical Lead)',
    'Marcus Vance, RBT (Behavior Technician)',
    'Elena Rostova, M.S., CCC-SLP (Speech Therapist)',
    'David Kim, M.Ed. (Special Education)',
    'Rachel Adams, OTR/L (Occupational Therapist)',
  ],
  therapists: [
    'Sarah Jenkins, BCBA (Clinical Lead)',
    'Marcus Vance, RBT (Senior Tech)',
    'Elena Rostova, M.S., CCC-SLP (Speech)',
    'Chloe Bennett, RBT (Behavior Tech)',
    'Alex Mercer, BCBA (Clinical Supervisor)',
  ],
  rooms: [
    'Sensory Room A (Ground Floor)',
    'Motor Gym 1 (Gross Motor)',
    'Focus Pod 3 (Individual)',
    'Observation Suite 2 (One-way Mirror)',
    'Early Intervention Lab (Room 104)',
    'Speech & Language Suite B',
  ],
  'goal domains': [
    'Communication & Expressive Language',
    'Receptive Language & Listening',
    'Social & Peer Interaction Skills',
    'Play, Leisure & Imagination',
    'Adaptive & Daily Living Skills',
    'Motor & Movement Coordination',
  ],
  'task analysis templates': [
    'Handwashing Routine (7-step chain)',
    'Toothbrushing Sequence (10-step chain)',
    'Backpack Packing Routine (5-step chain)',
    'Shoe Tying (Forward Chaining)',
    'Independent Snack Preparation (6 steps)',
  ],
  'abc antecedents': [
    'Transition from preferred activity',
    'Demand placed / Task presentation',
    'Attention diverted / Peer interaction',
    'Loud or unexpected sensory stimulus',
    'Denial of requested item or tangibles',
    'Unstructured free-play transition',
  ],
  'abc behaviors': [
    'Verbal refusal / Vocal protest',
    'Physical elopement / Leaving seat',
    'Aggression towards peer / staff',
    'Property destruction (throwing/swiping)',
    'Self-injurious behavior (hand-biting)',
    'Tantrum / Screaming / Dropping to floor',
  ],
  'abc consequences': [
    'Demand paused & prompted with visual schedule',
    'Redirection to designated calm-down space',
    'Differential reinforcement of alternative behavior (DRA)',
    'Planned ignoring of attention-seeking behavior',
    'Sensory break offered with weighted blanket',
    'Brief verbal reprimand & guided physical compliance',
  ],
  'abc locations': [
    'Main Therapy Room',
    'Sensory Integration Gym',
    'Cafeteria / Dining Hall',
    'Playground / Outdoor Courtyard',
    'Classroom Transition Hallway',
    'Restroom / Wash Station',
  ],
};

export function resolveFieldOptions(field: DynamicFormField): string[] {
  // 1. Check if model-bound via dataModel or data_model
  const modelKey = (field.dataModel || field.data_model || '').toLowerCase().trim();
  if (modelKey && modelKey !== 'custom') {
    if (DYNAMIC_MODEL_OPTIONS[modelKey]) {
      return DYNAMIC_MODEL_OPTIONS[modelKey];
    }
    for (const [key, opts] of Object.entries(DYNAMIC_MODEL_OPTIONS)) {
      if (modelKey.includes(key) || key.includes(modelKey)) {
        return opts;
      }
    }
  }

  // 2. Check if explicitly defined options exist in field.options or ui_props.options
  const rawOpts =
    field.options ?? field.ui_props?.options ?? (field as any).choices ?? (field as any).items;
  if (Array.isArray(rawOpts) && rawOpts.length > 0) {
    const parsed = rawOpts
      .map((item) =>
        typeof item === 'string'
          ? item.trim()
          : String(item?.label ?? item?.name ?? item?.value ?? item?.title ?? item).trim(),
      )
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  } else if (typeof rawOpts === 'string' && rawOpts.trim().length > 0) {
    const trimmed = rawOpts.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const jsonArr = JSON.parse(trimmed);
        if (Array.isArray(jsonArr) && jsonArr.length > 0) {
          const parsed = jsonArr
            .map((item) =>
              typeof item === 'string'
                ? item.trim()
                : String(item?.label ?? item?.name ?? item?.value ?? item?.title ?? item).trim(),
            )
            .filter(Boolean);
          if (parsed.length > 0) return parsed;
        }
      } catch {
        // fallback to split
      }
    }
    const splitOpts = trimmed
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (splitOpts.length > 0) return splitOpts;
  }

  // 3. Fallback to model inference from field label
  const normLabel = (field.label || '').toLowerCase();
  if (
    normLabel.includes('student') ||
    normLabel.includes('child') ||
    normLabel.includes('learner')
  ) {
    return DYNAMIC_MODEL_OPTIONS['students'];
  }
  if (normLabel.includes('teacher') || normLabel.includes('instructor')) {
    return DYNAMIC_MODEL_OPTIONS['teachers'];
  }
  if (normLabel.includes('therapist') || normLabel.includes('rbt') || normLabel.includes('bcba')) {
    return DYNAMIC_MODEL_OPTIONS['therapists'];
  }
  if (
    normLabel.includes('room') ||
    normLabel.includes('classroom') ||
    normLabel.includes('facility')
  ) {
    return normLabel.includes('abc')
      ? DYNAMIC_MODEL_OPTIONS['abc locations']
      : DYNAMIC_MODEL_OPTIONS['rooms'];
  }
  if (normLabel.includes('domain') || normLabel.includes('goal')) {
    return DYNAMIC_MODEL_OPTIONS['goal domains'];
  }
  if (normLabel.includes('antecedent')) {
    return DYNAMIC_MODEL_OPTIONS['abc antecedents'];
  }
  if (normLabel.includes('behavior')) {
    return DYNAMIC_MODEL_OPTIONS['abc behaviors'];
  }
  if (normLabel.includes('consequence')) {
    return DYNAMIC_MODEL_OPTIONS['abc consequences'];
  }

  // 4. Default dynamic options if none found
  return ['Option A', 'Option B', 'Option C'];
}

const InteractiveDatePickerField: React.FC<{
  field: DynamicFormField;
  value: any;
  onChange: (fieldIdOrLabel: string, value: any) => void;
}> = ({ field, value, onChange }) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);
  const pickedDate = value ? String(value) : '';
  const [viewYear, setViewYear] = useState<number>(() => {
    if (pickedDate && /^\d{4}-\d{2}-\d{2}$/.test(pickedDate)) {
      return parseInt(pickedDate.split('-')[0], 10);
    }
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (pickedDate && /^\d{4}-\d{2}-\d{2}$/.test(pickedDate)) {
      return parseInt(pickedDate.split('-')[1], 10) - 1;
    }
    return new Date().getMonth();
  });

  const handleSelectDate = (dateStr: string) => {
    onChange(field.id, dateStr);
    onChange(field.label, dateStr);
    setShowPicker(false);
  };

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

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getOffsetDateStr = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  return (
    <View key={field.id} style={[styles.field, { zIndex: showPicker ? 50 : 1 }]}>
      <Text style={typography.label}>
        {field.label} {field.required && <Text style={styles.required}>*</Text>}
      </Text>
      {Boolean(field.helpText || field.help_text) && (
        <Text style={styles.fieldSpecText}>{field.helpText || field.help_text}</Text>
      )}

      <View style={styles.datePickerInputRow}>
        <TouchableOpacity
          style={styles.datePickerDisplayBox}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Select date for ${field.label}`}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Feather name="calendar" size={16} color={pickedDate ? '#0284C7' : colors.mutedText} />
          <Text style={pickedDate ? styles.datePickerDisplayText : styles.datePickerPlaceholder}>
            {pickedDate || field.placeholder || 'YYYY-MM-DD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.datePickerActionBtn, showPicker && styles.datePickerActionBtnActive]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          onPress={() => setShowPicker(!showPicker)}
        >
          <Feather name={showPicker ? 'chevron-up' : 'calendar'} size={15} color="#0284C7" />
          <Text style={styles.datePickerActionText}>{showPicker ? 'Close' : 'Select Date'}</Text>
        </TouchableOpacity>

        {Boolean(pickedDate) && (
          <TouchableOpacity
            style={styles.datePickerClearBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear date"
            onPress={() => handleSelectDate('')}
          >
            <Feather name="x" size={14} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {showPicker && (
        <View style={styles.datePickerDropdown}>
          {/* Quick presets */}
          <View style={styles.dateQuickPresetsRow}>
            <TouchableOpacity
              style={[
                styles.datePresetChip,
                pickedDate === getTodayStr() && styles.datePresetChipActive,
              ]}
              onPress={() => handleSelectDate(getTodayStr())}
            >
              <Text
                style={[
                  styles.datePresetChipText,
                  pickedDate === getTodayStr() && styles.datePresetChipTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.datePresetChip,
                pickedDate === getOffsetDateStr(-1) && styles.datePresetChipActive,
              ]}
              onPress={() => handleSelectDate(getOffsetDateStr(-1))}
            >
              <Text
                style={[
                  styles.datePresetChipText,
                  pickedDate === getOffsetDateStr(-1) && styles.datePresetChipTextActive,
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.datePresetChip,
                pickedDate === getOffsetDateStr(7) && styles.datePresetChipActive,
              ]}
              onPress={() => handleSelectDate(getOffsetDateStr(7))}
            >
              <Text
                style={[
                  styles.datePresetChipText,
                  pickedDate === getOffsetDateStr(7) && styles.datePresetChipTextActive,
                ]}
              >
                +7 Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.datePresetChip,
                pickedDate === getOffsetDateStr(30) && styles.datePresetChipActive,
              ]}
              onPress={() => handleSelectDate(getOffsetDateStr(30))}
            >
              <Text
                style={[
                  styles.datePresetChipText,
                  pickedDate === getOffsetDateStr(30) && styles.datePresetChipTextActive,
                ]}
              >
                +30 Days
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month/Year Navigation */}
          <View style={styles.datePickerNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.dateNavBtn}
              accessibilityLabel="Previous month"
            >
              <Feather name="chevron-left" size={16} color="#0284C7" />
            </TouchableOpacity>
            <Text style={styles.dateNavMonthYear}>
              {monthNames[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.dateNavBtn}
              accessibilityLabel="Next month"
            >
              <Feather name="chevron-right" size={16} color="#0284C7" />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.calendarWeekRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={styles.calendarWeekHead}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calendarDaysGrid}>
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.calendarDayCellEmpty} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const dateIso = `${viewYear}-${mStr}-${dStr}`;
              const isSelected = pickedDate === dateIso;
              const isToday = getTodayStr() === dateIso;

              return (
                <TouchableOpacity
                  key={dateIso}
                  style={[
                    styles.calendarDayCell,
                    isSelected && styles.calendarDayCellSelected,
                    isToday && !isSelected && styles.calendarDayCellToday,
                  ]}
                  onPress={() => handleSelectDate(dateIso)}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      isSelected && styles.calendarDayTextSelected,
                      isToday && !isSelected && styles.calendarDayTextToday,
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

interface DynamicFormFieldsProps {
  formName: string;
  values: Record<string, any>;
  onChange: (fieldIdOrLabel: string, value: any) => void;
  excludeStandardLabels?: string[];
  onValidationChange?: (isValid: boolean, missingRequiredLabels: string[]) => void;
  initialFields?: DynamicFormField[];
  showSectionHeader?: boolean;
  section?: string;
}

export default function DynamicFormFields({
  formName,
  values,
  onChange,
  excludeStandardLabels = [],
  onValidationChange,
  initialFields,
  showSectionHeader = false,
  section,
}: DynamicFormFieldsProps) {
  const [fields, setFields] = useState<DynamicFormField[]>(initialFields || []);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialFields);

  useEffect(() => {
    if (initialFields) {
      setFields(initialFields.filter((f) => f.visible !== false));
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);

    const fetchFields = () => {
      getFormConfig(formName)
        .then(({ data }) => {
          if (mounted && Array.isArray(data?.fields)) {
            setFields(data.fields.filter((f: DynamicFormField) => f.visible !== false));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    fetchFields();

    const handleSync = () => {
      fetchFields();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleSync);
      window.addEventListener('melue_form_config_changed', handleSync as EventListener);
      window.addEventListener('focus', handleSync);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('melue_form_config_changed', handleSync as EventListener);
        window.removeEventListener('focus', handleSync);
      }
    };
  }, [formName, initialFields]);

  const customFields = fields.filter((f) => {
    if (
      excludeStandardLabels.some(
        (l) =>
          l.toLowerCase().trim() === f.label.toLowerCase().trim() ||
          l.toLowerCase().trim() === f.id.toLowerCase().trim(),
      )
    ) {
      return false;
    }
    if (section) {
      if (f.section) {
        return f.section.toLowerCase().trim() === section.toLowerCase().trim();
      }
      // For legacy/default fields without explicit section on Enrollment Wizard:
      // Only attribute them to standard sections if their keywords match
      const normLabel = f.label.toLowerCase();
      const normSec = section.toLowerCase().trim();
      if (normSec === 'parent info' || normSec === 'parent') {
        return (
          normLabel.includes('parent') ||
          normLabel.includes('guardian') ||
          normLabel.includes('mother') ||
          normLabel.includes('father') ||
          normLabel.includes('emergency') ||
          normLabel.includes('family') ||
          normLabel.includes('contact')
        );
      }
      if (normSec === 'medical info' || normSec === 'medical') {
        return (
          normLabel.includes('medical') ||
          normLabel.includes('allerg') ||
          normLabel.includes('doctor') ||
          normLabel.includes('health') ||
          normLabel.includes('insurance') ||
          normLabel.includes('medication') ||
          normLabel.includes('hospital') ||
          normLabel.includes('physician') ||
          normLabel.includes('diet')
        );
      }
      if (normSec === 'student info' || normSec === 'student') {
        const isParent =
          normLabel.includes('parent') ||
          normLabel.includes('guardian') ||
          normLabel.includes('mother') ||
          normLabel.includes('father') ||
          normLabel.includes('emergency') ||
          normLabel.includes('family') ||
          normLabel.includes('contact');
        const isMed =
          normLabel.includes('medical') ||
          normLabel.includes('allerg') ||
          normLabel.includes('doctor') ||
          normLabel.includes('health') ||
          normLabel.includes('insurance') ||
          normLabel.includes('medication') ||
          normLabel.includes('hospital') ||
          normLabel.includes('physician') ||
          normLabel.includes('diet');
        return !isParent && !isMed;
      }
      // For any custom info type (e.g. "Current Status", "Emergency Contact Info", etc.):
      // ONLY return fields that explicitly belong to this section!
      return false;
    }
    return true;
  });

  // Validate required fields
  useEffect(() => {
    if (!onValidationChange) return;
    const missing: string[] = [];
    customFields.forEach((field) => {
      if (field.required) {
        const val = values[field.id] ?? values[field.label];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          missing.push(field.label);
        }
      }
    });
    onValidationChange(missing.length === 0, missing);
  }, [customFields, values, onValidationChange]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.primaryYellowDark} />
        <Text style={styles.loadingText}>Loading fields...</Text>
      </View>
    );
  }

  if (customFields.length === 0) return null;

  const handlePickFile = async (fieldId: string, fieldLabel: string) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        onChange(fieldId, file.name);
        onChange(fieldLabel, file.name);
      }
    } catch {
      // ignore
    }
  };

  const handlePickImage = async (fieldId: string, fieldLabel: string) => {
    try {
      const ImagePicker = require('expo-image-picker');
      if (!ImagePicker) return;
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uri = res.assets[0].uri;
        onChange(fieldId, uri);
        onChange(fieldLabel, uri);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      {showSectionHeader && (
        <View style={styles.headerRow}>
          <Feather name="layers" size={14} color={colors.primaryYellowDark} />
          <Text style={styles.sectionTitle}>Additional Fields ({formName})</Text>
        </View>
      )}

      {customFields.map((field) => {
        const val = values[field.id] ?? values[field.label] ?? '';
        const fieldOptions = resolveFieldOptions(field);

        const rawType = (field.type || (field as any).field_type || '').toLowerCase();
        const normType = rawType.replace(/[- ]/g, '_');

        const hasCustomOptions =
          (Array.isArray(field.options) && field.options.length > 0) ||
          (typeof (field.options as unknown) === 'string' &&
            Boolean(String(field.options).trim())) ||
          Boolean(field.dataModel || (field as any).data_model);

        const isCheckboxGroup =
          normType === 'checkbox_group' ||
          normType === 'checkboxgroup' ||
          normType === 'checkboxes' ||
          normType === 'multi_select' ||
          normType === 'multiselect' ||
          (normType === 'checkbox' && hasCustomOptions);

        const isRadio =
          normType === 'radio' ||
          normType === 'radiogroup' ||
          normType === 'radio_group' ||
          normType === 'radio_buttons' ||
          normType === 'radiobuttons';

        const isSingleCheckbox = normType === 'checkbox' && !hasCustomOptions;

        if (normType === 'section_header' || normType === 'divider') {
          return (
            <View key={field.id} style={styles.sectionHeaderContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.sectionTitleRow}>
                <Feather name="folder" size={15} color="#0284C7" />
                <Text style={styles.sectionTitleText}>{field.label}</Text>
              </View>
              {Boolean(field.placeholder || field.helpText || field.help_text) && (
                <Text style={styles.sectionDescText}>
                  {field.placeholder || field.helpText || field.help_text}
                </Text>
              )}
            </View>
          );
        }

        if (normType === 'textarea') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={String(val !== undefined && val !== null ? val : '')}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                placeholderTextColor={colors.mutedText}
                accessibilityLabel={field.label}
                aria-label={field.label}
                onChangeText={(text) => {
                  onChange(field.id, text);
                  onChange(field.label, text);
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          );
        }

        if (isCheckboxGroup) {
          const selectedVals: string[] = Array.isArray(val)
            ? val
            : typeof val === 'string' && val.length > 0
              ? val.includes(',')
                ? val
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [val]
              : [];
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              {Boolean(field.helpText || field.help_text) && (
                <Text style={styles.fieldSpecText}>{field.helpText || field.help_text}</Text>
              )}
              <View style={styles.checkboxGroupContainer}>
                {fieldOptions.map((opt) => {
                  const isChecked = selectedVals.includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.checkboxGroupItem,
                        isChecked && styles.checkboxGroupItemSelected,
                      ]}
                      activeOpacity={0.8}
                      accessibilityRole="checkbox"
                      accessibilityLabel={opt}
                      accessibilityState={{ checked: isChecked }}
                      onPress={() => {
                        const next = isChecked
                          ? selectedVals.filter((v) => v !== opt)
                          : [...selectedVals, opt];
                        onChange(field.id, next);
                        onChange(field.label, next);
                      }}
                    >
                      <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Feather name="check" size={12} color={colors.navyText} />}
                      </View>
                      <Text
                        style={[
                          styles.checkboxLabel,
                          isChecked && { fontWeight: '600', color: '#0369A1' },
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }

        if (normType === 'switch') {
          const isEnabled = Boolean(val);
          return (
            <View key={field.id} style={styles.switchWrapper}>
              <View style={{ flex: 1 }}>
                <Text style={typography.label}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
                {Boolean(field.helpText || field.help_text || field.placeholder) && (
                  <Text style={styles.fieldSpecText}>
                    {field.helpText || field.help_text || field.placeholder}
                  </Text>
                )}
              </View>
              <Switch
                value={isEnabled}
                onValueChange={(next) => {
                  onChange(field.id, next);
                  onChange(field.label, next);
                }}
                trackColor={{ false: colors.border, true: '#0284C7' }}
                thumbColor={isEnabled ? '#0369A1' : '#FFFFFF'}
              />
            </View>
          );
        }

        if (normType === 'phone') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.ethiopiaBadge}>
                  <Text style={styles.ethiopiaBadgeText}>🇪🇹 +251</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 6 }]}
                  value={String(val !== undefined && val !== null ? val : '')}
                  placeholder={field.placeholder || '91 234 5678'}
                  placeholderTextColor={colors.mutedText}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  accessibilityLabel={field.label}
                  aria-label={field.label}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9 ]/g, '');
                    onChange(field.id, cleaned);
                    onChange(field.label, cleaned);
                  }}
                />
              </View>
            </View>
          );
        }

        if (normType === 'image_picker' || normType === 'image') {
          const imgUri = typeof val === 'string' && val.length > 0 ? val : null;
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              {imgUri ? (
                <View style={styles.imgThumbnailWrapper}>
                  <Image source={{ uri: imgUri }} style={styles.imgThumbnail} />
                  <TouchableOpacity
                    style={styles.imgRemoveBtn}
                    onPress={() => {
                      onChange(field.id, null);
                      onChange(field.label, null);
                    }}
                  >
                    <Feather name="trash-2" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerBox}
                  onPress={() => handlePickImage(field.id, field.label)}
                >
                  <Feather name="camera" size={16} color="#0284C7" />
                  <Text style={styles.imagePickerBoxText}>Select / Capture Image</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }

        if (isSingleCheckbox) {
          const isChecked = Boolean(val);
          return (
            <TouchableOpacity
              key={field.id}
              style={styles.checkboxRow}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityLabel={field.label}
              accessibilityState={{ checked: isChecked }}
              onPress={() => {
                const next = !isChecked;
                onChange(field.id, next);
                onChange(field.label, next);
              }}
            >
              <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
                {isChecked && <Feather name="check" size={12} color={colors.navyText} />}
              </View>
              <Text style={styles.checkboxLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
            </TouchableOpacity>
          );
        }

        if (isRadio) {
          return (
            <View
              key={field.id}
              style={styles.field}
              accessibilityRole="radiogroup"
              accessibilityLabel={field.label}
            >
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              {Boolean(field.helpText || field.help_text) && (
                <Text style={styles.fieldSpecText}>{field.helpText || field.help_text}</Text>
              )}
              <View style={styles.radioGroup}>
                {fieldOptions.map((opt) => {
                  const isSelected = val === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.radioChip, isSelected && styles.radioChipSelected]}
                      accessibilityRole="radio"
                      accessibilityLabel={opt}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        onChange(field.id, opt);
                        onChange(field.label, opt);
                      }}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text
                        style={[styles.radioChipText, isSelected && styles.radioChipTextSelected]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }

        if (normType === 'file' || normType === 'fileupload' || normType === 'file_upload') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={styles.fileUploadRow}>
                <TouchableOpacity
                  style={styles.fileUploadBtn}
                  onPress={() => handlePickFile(field.id, field.label)}
                >
                  <Feather name="upload" size={14} color={colors.navyText} />
                  <Text style={styles.fileUploadBtnText}>
                    {val ? 'Replace File' : 'Choose File'}
                  </Text>
                </TouchableOpacity>
                {val ? (
                  <Text style={styles.fileNameText} numberOfLines={1}>
                    {String(val)}
                  </Text>
                ) : (
                  <Text style={styles.noFileText}>
                    {field.placeholder ? `No file chosen (${field.placeholder})` : 'No file chosen'}
                  </Text>
                )}
              </View>
              {Boolean(field.placeholder) && (
                <Text style={styles.fieldSpecText}>Expected File: {field.placeholder}</Text>
              )}
            </View>
          );
        }

        if (normType === 'dropdown' || normType === 'select') {
          const isOpen = openDropdownId === field.id;
          const isModelBound = Boolean(field.dataModel && field.dataModel !== 'custom');

          return (
            <View key={field.id} style={[styles.field, { zIndex: isOpen ? 100 : 1 }]}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <Text style={typography.label}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
                {isModelBound && (
                  <View style={styles.modelBadgePill}>
                    <Feather name="database" size={10} color="#0284C7" />
                    <Text style={styles.modelBadgePillText}>{field.dataModel}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.dropdownBtn}
                activeOpacity={0.8}
                accessibilityRole="combobox"
                accessibilityLabel={field.label}
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setOpenDropdownId(isOpen ? null : field.id)}
              >
                <Text style={val ? styles.dropdownSelectedText : styles.dropdownPlaceholder}>
                  {val ? String(val) : `Select ${field.label}...`}
                </Text>
                <Feather
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.mutedText}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.dropdownMenu} accessibilityRole="menu">
                  {fieldOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.dropdownItem, val === opt && styles.dropdownItemActive]}
                      accessibilityRole="menuitem"
                      accessibilityLabel={opt}
                      accessibilityState={{ selected: val === opt }}
                      onPress={() => {
                        onChange(field.id, opt);
                        onChange(field.label, opt);
                        setOpenDropdownId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          val === opt && styles.dropdownItemTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }

        if (normType === 'number') {
          return (
            <View key={field.id} style={styles.field}>
              <Text style={typography.label}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <TextInput
                style={styles.input}
                value={String(val !== undefined && val !== null ? val : '')}
                placeholder={field.placeholder || 'Enter number (e.g. 0-100)...'}
                placeholderTextColor={colors.mutedText}
                keyboardType="numeric"
                returnKeyType="done"
                accessibilityLabel={field.label}
                aria-label={field.label}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.-]/g, '');
                  onChange(field.id, cleaned);
                  onChange(field.label, cleaned);
                }}
              />
              {Boolean(field.placeholder) && (
                <Text style={styles.fieldSpecText}>Input: {field.placeholder}</Text>
              )}
            </View>
          );
        }

        if (normType === 'date') {
          return (
            <InteractiveDatePickerField
              key={field.id}
              field={field}
              value={val}
              onChange={onChange}
            />
          );
        }

        if (normType === 'counter') {
          return (
            <InteractiveCounterField key={field.id} field={field} value={val} onChange={onChange} />
          );
        }

        if (normType === 'timer') {
          return (
            <InteractiveTimerField key={field.id} field={field} value={val} onChange={onChange} />
          );
        }

        // Standard Text input
        return (
          <View key={field.id} style={styles.field}>
            <Text style={typography.label}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={String(val !== undefined && val !== null ? val : '')}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
              placeholderTextColor={colors.mutedText}
              returnKeyType="done"
              accessibilityLabel={field.label}
              aria-label={field.label}
              onChangeText={(text) => {
                onChange(field.id, text);
                onChange(field.label, text);
              }}
            />
            {Boolean(field.placeholder) && (
              <Text style={styles.fieldSpecText}>Format: {field.placeholder}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    gap: 4,
    position: 'relative',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    color: colors.navyText,
    fontSize: 14,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primaryYellow,
    borderColor: colors.primaryYellowDark,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.navyText,
    fontWeight: '500',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  radioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  radioChipSelected: {
    borderColor: colors.primaryYellowDark,
    backgroundColor: '#FEF9C3',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primaryYellowDark,
  },
  radioInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryYellowDark,
  },
  radioChipText: {
    fontSize: 13,
    color: colors.navyText,
  },
  radioChipTextSelected: {
    fontWeight: '600',
    color: '#854D0E',
  },
  fileUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
  fileUploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  fileNameText: {
    fontSize: 13,
    color: '#0284C7',
    flex: 1,
  },
  noFileText: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: colors.mutedText,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: colors.navyText,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(4, 8, 0.1, '0, 0, 0', 5),
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  dropdownItemActive: {
    backgroundColor: '#FEF3C7',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.navyText,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#92400E',
  },
  fieldSpecText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionHeaderContainer: {
    marginVertical: spacing.sm,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  checkboxGroupContainer: {
    gap: 8,
    marginTop: 4,
  },
  checkboxGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  checkboxGroupItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  switchWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    backgroundColor: colors.bgCard,
  },
  imgThumbnailWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 6,
  },
  imgThumbnail: {
    width: '100%',
    height: '100%',
  },
  imgRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 4,
    borderRadius: 12,
  },
  imagePickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 4,
  },
  imagePickerBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  ethiopiaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  ethiopiaBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  datePickerActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  counterDisplayBox: {
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterDisplayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerClockText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 1,
  },
  timerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  timerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  timerControlBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerStartBtn: {
    backgroundColor: '#0284C7',
  },
  timerPauseBtn: {
    backgroundColor: '#F59E0B',
  },
  timerStopBtn: {
    backgroundColor: '#EF4444',
  },
  datePickerDisplayBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  datePickerDisplayText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  datePickerPlaceholder: {
    fontSize: 14,
    color: colors.mutedText,
  },
  datePickerActionBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  datePickerClearBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  datePickerDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 8,
    ...makeShadow(3),
  },
  dateQuickPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  datePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  datePresetChipActive: {
    backgroundColor: '#0284C7',
  },
  datePresetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  datePresetChipTextActive: {
    color: '#FFFFFF',
  },
  datePickerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateNavBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
  },
  dateNavMonthYear: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarWeekHead: {
    width: 32,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  calendarDayCellEmpty: {
    width: '14.28%',
    height: 32,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  calendarDayCellSelected: {
    backgroundColor: '#0284C7',
  },
  calendarDayCellToday: {
    borderWidth: 1,
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#0284C7',
    fontWeight: '700',
  },
  modelBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modelBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
});
