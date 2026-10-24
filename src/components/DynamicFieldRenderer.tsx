import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const getImagePicker = () => {
  try {
    return require('expo-image-picker');
  } catch {
    return null;
  }
};

export interface FieldValidation {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  min_select?: number;
  max_select?: number;
  pattern?: string;
  allowed_mime_types?: string[];
  max_file_size_mb?: number;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldUIProps {
  num_lines?: number;
  max_length?: number;
  show_char_counter?: boolean;
  active_label?: string;
  inactive_label?: string;
  format?: string;
  aspect_ratio?: [number, number];
  quality?: number;
  allows_editing?: boolean;
  allow_camera?: boolean;
  allow_gallery?: boolean;
  description?: string;
  show_divider_line?: boolean;
  icon?: string;
}

export interface DynamicFormField {
  id: string;
  type:
    | 'text'
    | 'number'
    | 'date'
    | 'dropdown'
    | 'radio'
    | 'file'
    | 'textarea'
    | 'checkbox_group'
    | 'switch'
    | 'phone'
    | 'image_picker'
    | 'section_header'
    | 'divider'
    | string;
  label: string;
  placeholder?: string;
  default_value?: any;
  help_text?: string;
  helpText?: string;
  options?: (FieldOption | string)[];
  validation?: FieldValidation;
  ui_props?: FieldUIProps;
  is_display_only?: boolean;
  required?: boolean;
  visible?: boolean;
  section?: string;
}

interface DynamicFieldRendererProps {
  field: DynamicFormField;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (fieldId: string, value: any) => void;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  error,
  disabled = false,
  onChange,
}) => {
  const normType = field.type.toLowerCase().replace(/[- ]/g, '_');

  // Normalize options into { label, value }
  const normalizedOptions: FieldOption[] = (field.options || []).map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt,
  );

  // 1. NON-INPUT: Section Header / Visual Divider
  if (normType === 'section_header' || normType === 'divider') {
    return (
      <View style={styles.sectionHeaderContainer}>
        {field.ui_props?.show_divider_line !== false && <View style={styles.dividerLine} />}
        <View style={styles.sectionTitleRow}>
          {field.ui_props?.icon && (
            <Feather
              name={(field.ui_props.icon as any) || 'folder'}
              size={18}
              color="#0284C7"
              style={styles.sectionIcon}
            />
          )}
          <Text style={styles.sectionTitle}>{field.label}</Text>
        </View>
        {field.ui_props?.description && (
          <Text style={styles.sectionDescription}>{field.ui_props.description}</Text>
        )}
      </View>
    );
  }

  // 2. TEXTAREA (Multiline Text)
  if (normType === 'textarea') {
    const textVal = typeof value === 'string' ? value : '';
    const numLines = field.ui_props?.num_lines || 4;
    const maxLength = field.ui_props?.max_length || field.validation?.max_length;

    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <TextInput
          style={[styles.input, styles.textArea, error ? styles.inputError : null]}
          value={textVal}
          onChangeText={(val) => onChange(field.id, val)}
          placeholder={field.placeholder || 'Type here...'}
          placeholderTextColor="#94A3B8"
          multiline={true}
          numberOfLines={numLines}
          textAlignVertical="top"
          maxLength={maxLength}
          editable={!disabled}
        />
        <View style={styles.bottomHelperRow}>
          {error ? <Text style={styles.errorText}>{error}</Text> : <View />}
          {field.ui_props?.show_char_counter && maxLength && (
            <Text style={styles.charCounter}>
              {textVal.length} / {maxLength}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // 3. CHECKBOX (Multi-Select)
  if (normType === 'checkbox_group' || normType === 'checkbox') {
    const selectedValues: string[] = Array.isArray(value) ? value : [];

    const toggleOption = (optVal: string) => {
      if (disabled) return;
      const exists = selectedValues.includes(optVal);
      if (exists) {
        onChange(
          field.id,
          selectedValues.filter((v) => v !== optVal),
        );
      } else {
        const maxSelect = field.validation?.max_select;
        if (maxSelect && selectedValues.length >= maxSelect) {
          Alert.alert('Selection Limit', `You can select up to ${maxSelect} options.`);
          return;
        }
        onChange(field.id, [...selectedValues, optVal]);
      }
    };

    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <View style={styles.checkboxGroup}>
          {normalizedOptions.map((opt) => {
            const checked = selectedValues.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.checkboxRow,
                  checked && styles.checkboxRowSelected,
                  disabled && styles.disabledOpacity,
                ]}
                onPress={() => toggleOption(opt.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                disabled={disabled}
              >
                <View style={[styles.checkboxSquare, checked && styles.checkboxSquareSelected]}>
                  {checked && <Feather name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 4. SWITCH (Boolean Toggle)
  if (normType === 'switch') {
    const boolVal = Boolean(value);
    const activeLabel = field.ui_props?.active_label || 'Enabled';
    const inactiveLabel = field.ui_props?.inactive_label || 'Disabled';

    return (
      <View style={styles.fieldContainer}>
        <View style={styles.switchWrapper}>
          <View style={styles.switchTextCol}>
            <FieldLabel field={field} noMarginBottom />
            <Text style={styles.switchSubLabel}>{boolVal ? activeLabel : inactiveLabel}</Text>
          </View>
          <Switch
            value={boolVal}
            onValueChange={(val) => onChange(field.id, val)}
            trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
            thumbColor={Platform.OS === 'android' ? (boolVal ? '#0369A1' : '#F1F5F9') : '#FFFFFF'}
            disabled={disabled}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 5. PHONE (Native Phone Keypad)
  if (normType === 'phone') {
    const phoneVal = typeof value === 'string' ? value : '';

    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <View style={[styles.phoneInputContainer, error ? styles.inputError : null]}>
          <Feather name="phone" size={16} color="#64748B" style={styles.phoneIcon} />
          <TextInput
            style={styles.phoneInput}
            value={phoneVal}
            onChangeText={(val) => {
              const sanitized = val.replace(/[^0-9+() -]/g, '');
              onChange(field.id, sanitized);
            }}
            placeholder={field.placeholder || '+1 (555) 000-0000'}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            dataDetectorTypes="phoneNumber"
            editable={!disabled}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 6. IMAGE (Camera Capture + Gallery Upload)
  if (normType === 'image_picker' || normType === 'image') {
    const imageUri = typeof value === 'string' ? value : value?.uri || null;

    const handlePickGallery = async () => {
      if (disabled) return;
      const ImagePicker = getImagePicker();
      if (!ImagePicker) return;
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: field.ui_props?.allows_editing ?? true,
        aspect: field.ui_props?.aspect_ratio ?? [1, 1],
        quality: field.ui_props?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onChange(field.id, result.assets[0].uri);
      }
    };

    const handlePickCamera = async () => {
      if (disabled) return;
      const ImagePicker = getImagePicker();
      if (!ImagePicker) return;
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: field.ui_props?.allows_editing ?? true,
        aspect: field.ui_props?.aspect_ratio ?? [1, 1],
        quality: field.ui_props?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onChange(field.id, result.assets[0].uri);
      }
    };

    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.imageRemoveBtn}
              onPress={() => onChange(field.id, null)}
              disabled={disabled}
            >
              <Feather name="trash-2" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerActionRow}>
            {field.ui_props?.allow_camera !== false && (
              <TouchableOpacity
                style={styles.imagePickerBtn}
                onPress={handlePickCamera}
                disabled={disabled}
              >
                <Feather name="camera" size={16} color="#0284C7" />
                <Text style={styles.imagePickerBtnText}>Take Photo</Text>
              </TouchableOpacity>
            )}
            {field.ui_props?.allow_gallery !== false && (
              <TouchableOpacity
                style={[styles.imagePickerBtn, styles.imagePickerBtnOutline]}
                onPress={handlePickGallery}
                disabled={disabled}
              >
                <Feather name="image" size={16} color="#0F172A" />
                <Text style={styles.imagePickerBtnTextOutline}>Upload Gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 12. COUNTER (+ / -)
  if (normType === 'counter') {
    const minVal = field.validation?.min_length ?? 0;
    const maxVal = field.validation?.max_length ?? 9999;
    const currentNum = typeof value === 'number' ? value : parseInt(value, 10) || minVal || 0;

    const handleUpdate = (next: number) => {
      const clamped = Math.min(maxVal, Math.max(minVal, next));
      onChange(field.id, clamped);
    };

    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <TouchableOpacity
            style={[
              {
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#F0F9FF',
                borderWidth: 1,
                borderColor: '#BAE6FD',
                alignItems: 'center',
                justifyContent: 'center',
              },
              currentNum <= minVal && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            ]}
            disabled={disabled || currentNum <= minVal}
            onPress={() => handleUpdate(currentNum - 1)}
          >
            <Feather name="minus" size={18} color={currentNum <= minVal ? '#94A3B8' : '#0284C7'} />
          </TouchableOpacity>
          <View
            style={{
              minWidth: 54,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5,
              borderColor: '#0284C7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{currentNum}</Text>
          </View>
          <TouchableOpacity
            style={[
              {
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: '#F0F9FF',
                borderWidth: 1,
                borderColor: '#BAE6FD',
                alignItems: 'center',
                justifyContent: 'center',
              },
              currentNum >= maxVal && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
            ]}
            disabled={disabled || currentNum >= maxVal}
            onPress={() => handleUpdate(currentNum + 1)}
          >
            <Feather name="plus" size={18} color={currentNum >= maxVal ? '#94A3B8' : '#0284C7'} />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 13. TIMER (Start / Pause / Stop)
  if (normType === 'timer') {
    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <DynamicTimerControl
          value={value}
          disabled={disabled}
          onChange={(val) => onChange(field.id, val)}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 14. DATE PICKER (Compact Modal Popup)
  if (normType === 'date') {
    return (
      <CompactDatePickerControl
        field={field}
        value={value}
        error={error}
        disabled={disabled}
        onChange={(val) => onChange(field.id, val)}
      />
    );
  }

  // 15. DROPDOWN / SELECT (High Z-Index Floating Popover)
  if (normType === 'dropdown' || normType === 'select') {
    return (
      <FloatingDropdownControl
        field={field}
        value={value}
        error={error}
        disabled={disabled}
        options={normalizedOptions}
        onChange={(val) => onChange(field.id, val)}
      />
    );
  }

  // 16. RADIO
  if (normType === 'radio') {
    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <View style={styles.radioGroup}>
          {normalizedOptions.map((opt) => {
            const isSelected = String(value) === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radioChip,
                  isSelected && styles.radioChipSelected,
                  disabled && styles.disabledOpacity,
                ]}
                disabled={disabled}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChange(field.id, opt.value)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // 17. TEXT & NUMBER
  if (normType === 'text' || normType === 'number') {
    return (
      <View style={styles.fieldContainer}>
        <FieldLabel field={field} />
        <TextInput
          style={[styles.input, { minHeight: 44 }, error ? styles.inputError : null]}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={(val) =>
            onChange(field.id, normType === 'number' ? val.replace(/[^0-9.-]/g, '') : val)
          }
          placeholder={field.placeholder || (normType === 'number' ? '0' : 'Type here...')}
          placeholderTextColor="#94A3B8"
          keyboardType={normType === 'number' ? 'numeric' : 'default'}
          editable={!disabled}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  return null;
};

const DynamicTimerControl: React.FC<{
  value: any;
  disabled?: boolean;
  onChange: (val: string) => void;
}> = ({ value, disabled, onChange }) => {
  const [seconds, setSeconds] = React.useState<number>(() => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':').map((p) => parseInt(p, 10) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  });
  const [isRunning, setIsRunning] = React.useState<boolean>(false);

  React.useEffect(() => {
    let timer: any = null;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          const mins = String(Math.floor(next / 60)).padStart(2, '0');
          const secs = String(next % 60).padStart(2, '0');
          const formatted = `${mins}:${secs}`;
          onChange(formatted);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, onChange]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const displayFormatted = `${mins}:${secs}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Feather name="clock" size={16} color="#0284C7" />
        <Text
          style={{
            fontSize: 16,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            fontWeight: '700',
            color: '#0284C7',
          }}
        >
          {displayFormatted}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {!isRunning ? (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#0284C7',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
            }}
            disabled={disabled}
            onPress={() => setIsRunning(true)}
          >
            <Feather name="play" size={12} color="#FFFFFF" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#F59E0B',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
            }}
            disabled={disabled}
            onPress={() => setIsRunning(false)}
          >
            <Feather name="pause" size={12} color="#FFFFFF" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Pause</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: '#EF4444',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 6,
          }}
          disabled={disabled}
          onPress={() => {
            setIsRunning(false);
            setSeconds(0);
            onChange('00:00');
          }}
        >
          <Feather name="square" size={12} color="#FFFFFF" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Compact Date Picker Control with Modal Popup and Min 44x44px Touch Targets
const CompactDatePickerControl: React.FC<{
  field: DynamicFormField;
  value: any;
  error?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}> = ({ field, value, error, disabled, onChange }) => {
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

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setShowPicker(false);
  };

  return (
    <View style={styles.fieldContainer}>
      <FieldLabel field={field} />
      <View style={styles.datePickerInputRow}>
        <TouchableOpacity
          style={[styles.datePickerDisplayBox, error ? styles.inputError : null]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Select date for ${field.label}`}
          onPress={() => !disabled && setShowPicker(!showPicker)}
          disabled={disabled}
        >
          <Feather name="calendar" size={16} color={pickedDate ? '#0284C7' : '#94A3B8'} />
          <Text style={pickedDate ? styles.datePickerDisplayText : styles.datePickerPlaceholder}>
            {pickedDate || field.placeholder || 'YYYY-MM-DD'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.datePickerActionBtn, showPicker && styles.datePickerActionBtnActive]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          onPress={() => !disabled && setShowPicker(!showPicker)}
          disabled={disabled}
        >
          <Feather name={showPicker ? 'chevron-up' : 'calendar'} size={15} color="#0284C7" />
          <Text style={styles.datePickerActionText}>{showPicker ? 'Close' : 'Select Date'}</Text>
        </TouchableOpacity>

        {Boolean(pickedDate) && !disabled && (
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
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.datePickerModalCard} onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={styles.datePickerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.datePickerIconCircle}>
                  <Feather name="calendar" size={16} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.datePickerModalTitle}>{field.label || 'Select Date'}</Text>
                  <Text style={styles.datePickerModalSubtitle}>
                    {pickedDate ? `Selected: ${pickedDate}` : 'Choose date from calendar'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.datePickerModalCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Close date picker"
                onPress={() => setShowPicker(false)}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.dateQuickPresetsRow}>
              {[
                { label: 'Today', date: getTodayStr() },
                { label: 'Yesterday', date: getOffsetDateStr(-1) },
                { label: '+7 Days', date: getOffsetDateStr(7) },
                { label: '+30 Days', date: getOffsetDateStr(30) },
              ].map((p) => {
                const isActive = pickedDate === p.date;
                return (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.datePresetChip, isActive && styles.datePresetChipActive]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${p.label}`}
                    onPress={() => handleSelectDate(p.date)}
                  >
                    <Text
                      style={[
                        styles.datePresetChipText,
                        isActive && styles.datePresetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Month/Year Navigation */}
            <View style={styles.datePickerNavRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.dateNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Feather name="chevron-left" size={18} color="#0284C7" />
              </TouchableOpacity>
              <Text style={styles.dateNavMonthYear}>
                {monthNames[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.dateNavBtn}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Feather name="chevron-right" size={18} color="#0284C7" />
              </TouchableOpacity>
            </View>

            {/* Day of Week Headers */}
            <View style={styles.calendarWeekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <View key={d} style={styles.calendarWeekHeadCell}>
                  <Text style={styles.calendarWeekHead}>{d}</Text>
                </View>
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
                    accessibilityRole="button"
                    accessibilityLabel={`Date ${dateIso}`}
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

            {/* Footer */}
            <View style={styles.datePickerModalFooter}>
              {Boolean(pickedDate) && (
                <TouchableOpacity
                  style={styles.datePickerModalClearAction}
                  accessibilityRole="button"
                  accessibilityLabel="Clear date selection"
                  onPress={() => handleSelectDate('')}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                  <Text style={styles.datePickerModalClearText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.datePickerModalDoneAction}
                accessibilityRole="button"
                accessibilityLabel="Close date picker"
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.datePickerModalDoneText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Floating Dropdown Control with High Z-Index Stacking Context & Min 44px Touch Targets
const FloatingDropdownControl: React.FC<{
  field: DynamicFormField;
  value: any;
  error?: string;
  disabled?: boolean;
  options: FieldOption[];
  onChange: (val: string) => void;
}> = ({ field, value, error, disabled, options, onChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedStr = value !== undefined && value !== null ? String(value) : '';
  const selectedOption = options.find((o) => o.value === selectedStr);

  return (
    <View
      style={[
        styles.fieldContainer,
        {
          zIndex: isOpen ? 9999 : 1,
          elevation: isOpen ? 9999 : 1,
        },
        Platform.OS === 'web' && isOpen && ({ position: 'relative', zIndex: 9999 } as any),
      ]}
    >
      <FieldLabel field={field} />
      <TouchableOpacity
        style={[
          styles.dropdownBtn,
          isOpen && styles.dropdownBtnActive,
          error ? styles.inputError : null,
          disabled && styles.disabledOpacity,
        ]}
        activeOpacity={0.8}
        accessibilityRole="combobox"
        accessibilityLabel={field.label}
        accessibilityState={{ expanded: isOpen }}
        disabled={disabled}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text
          style={selectedStr ? styles.dropdownSelectedText : styles.dropdownPlaceholder}
          numberOfLines={1}
        >
          {selectedOption?.label || selectedStr || field.placeholder || `Select ${field.label}...`}
        </Text>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={isOpen ? '#0284C7' : '#64748B'}
        />
      </TouchableOpacity>

      {isOpen && (
        <>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View style={styles.dropdownMenu} accessibilityRole="menu">
            <ScrollView
              style={styles.dropdownScrollView}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt) => {
                const isSelected = selectedStr === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    accessibilityRole="menuitem"
                    accessibilityLabel={opt.label}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && <Feather name="check" size={15} color="#0284C7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// Reusable Label Helper
const FieldLabel: React.FC<{ field: DynamicFormField; noMarginBottom?: boolean }> = ({
  field,
  noMarginBottom = false,
}) => {
  const isRequired = field.validation?.required ?? field.required;
  const help = field.help_text || field.helpText;

  return (
    <View style={[styles.labelRow, noMarginBottom && { marginBottom: 0 }]}>
      <Text style={styles.label}>
        {field.label}
        {isRequired && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      {help && <Text style={styles.helpText}>{help}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  requiredStar: {
    color: '#EF4444',
  },
  helpText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  bottomHelperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  checkboxGroup: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkboxRowSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#0284C7',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  checkboxLabelSelected: {
    color: '#0369A1',
    fontWeight: '600',
  },
  switchWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTextCol: {
    flex: 1,
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  imagePickerActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imagePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  imagePickerBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  imagePickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  imagePickerBtnTextOutline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  imagePreviewWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    padding: 6,
    borderRadius: 14,
  },
  sectionHeaderContainer: {
    marginVertical: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  datePickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerDisplayBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  datePickerDisplayText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  datePickerPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  datePickerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  datePickerActionBtnActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  datePickerActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  datePickerClearBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  datePickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  datePickerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerModalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  datePickerModalCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dateQuickPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  datePresetChip: {
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePresetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  datePresetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  datePresetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  datePickerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dateNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavMonthYear: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarWeekHeadCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
  },
  calendarWeekHead: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCellEmpty: {
    width: '14.28%',
    height: 44,
    minHeight: 44,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 44,
    minHeight: 44,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayCellSelected: {
    backgroundColor: '#0284C7',
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  calendarDayText: {
    fontSize: 13,
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
  datePickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  datePickerModalClearAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  datePickerModalClearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  datePickerModalDoneAction: {
    minHeight: 44,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0284C7',
  },
  datePickerModalDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  dropdownBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -3000,
    bottom: -3000,
    left: -3000,
    right: -3000,
    zIndex: 9990,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 20,
    zIndex: 9999,
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F9FF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#0F172A',
    flex: 1,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#0284C7',
  },
  radioGroup: {
    gap: 8,
  },
  radioChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    minHeight: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radioChipSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  radioLabel: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  radioLabelSelected: {
    color: '#0369A1',
    fontWeight: '600',
  },
});

export default DynamicFieldRenderer;
