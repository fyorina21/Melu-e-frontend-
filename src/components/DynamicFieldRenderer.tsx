import React from 'react';
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
});

export default DynamicFieldRenderer;
