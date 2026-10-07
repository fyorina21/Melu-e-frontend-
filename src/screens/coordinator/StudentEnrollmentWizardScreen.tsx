import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DobPicker from '../../components/DobPicker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import { getStaffOptions, getStudentOptions, type StaffOption, type StudentOption } from '../../api/optionsApi';
import { createStudentEnrollment } from '../../api/coordinatorApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import DynamicFormFields from '../../components/DynamicFormFields';
import CameraCaptureModal from '../../components/CameraCaptureModal';
import { saveStudentPhoto, registerStudentPhotos } from '../../utils/studentPhotoHelper';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';

const STEPS = ['Student Info', 'Parent Info', 'Medical Info', 'Assign Therapist', 'Review'];

const PROGRAM_TYPES = ['Regular', 'Pulled Out'];
const THERAPY_GROUPS = ['Basic', 'Functional Living Skill'];
const GENDERS = ['Female', 'Male', 'Other'];
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function calculateAge(dobIso: string): number | null {
  if (!dobIso) return null;
  const birthDate = new Date(dobIso);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function getTherapyGroupAgeWarning(therapyGroup: string, age: number | null): string | null {
  if (age === null) return null;
  const normalized = therapyGroup.toLowerCase();
  if (normalized.includes('basic')) {
    if (age < 3 || age > 12) {
      return `Basic group is recommended for ages 3–12 (Current age: ${age} yrs)`;
    }
  } else if (normalized.includes('functional')) {
    if (age < 13 || age > 19) {
      return `Functional Living Skill group is recommended for ages 13–19 (Current age: ${age} yrs)`;
    }
  }
  return null;
}

// Reference design palette (Matches the Enrollment Wizard reference)
const C_NAVY = '#1F2937';
const C_YELLOW = '#FCD34D';
const C_SKY = '#38BDF8';
const C_INK = '#374151';
const C_GRAY_LABEL = '#6B7280';
const C_INPUT_BORDER = '#D1D5DB';
const C_RED = '#DC2626';

interface WizardState {
  name: string;
  dob: string;
  gender: string;
  program: string;
  therapyGroup: string;
  photoUri?: string;
  photoBase64?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  diagnosis: string;
  medicalNotes: string;
  therapist: string;
}

const MAX_CASELOAD = 2;

const INITIAL_STATE: WizardState = {
  name: '',
  dob: '',
  gender: 'Female',
  program: PROGRAM_TYPES[0],
  therapyGroup: THERAPY_GROUPS[0],
  photoUri: '',
  photoBase64: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  diagnosis: '',
  medicalNotes: '',
  therapist: '',
};

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentEnrollmentWizard'>;

function StepIndicator({ current, steps = STEPS }: { current: number; steps?: string[] }) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <View key={s} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  i < current && styles.stepDotDone,
                  i === current && styles.stepDotCurrent,
                ]}
              >
                {i < current ? (
                  <Feather name="check" size={13} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNum, i === current && styles.stepNumCurrent]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, i < current && styles.stepLineDone]} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[styles.stepLabel, i === current && styles.stepLabelCurrent]}
            >
              {s}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity key={opt} style={[styles.chip, value === opt && styles.chipSelected]} onPress={() => onChange(opt)}>
          <Text style={[styles.chipText, value === opt && styles.chipTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface FieldProps {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'phone-pad' | 'email-address';
  multiline?: boolean;
  placeholder?: string;
  maxWidth?: boolean;
  hint?: string;
}

function Field({ label, required, value, onChangeText, keyboardType, multiline, placeholder, maxWidth, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={styles.fieldLabel}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textArea,
          focused && styles.textInputFocused,
          maxWidth && styles.textInputMax,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.reviewSection}>
      <Text style={styles.reviewSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewKey}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

export default function StudentEnrollmentWizardScreen({ navigation }: Props) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(INITIAL_STATE);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [therapists, setTherapists] = useState<StaffOption[]>([]);
  const [existingStudents, setExistingStudents] = useState<StudentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [deletedSections, setDeletedSections] = useState<string[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const loadFormConfig = useCallback(() => {
    getStaffOptions()
      .then(({ data }) => {
        const teachers = data.filter((s) => s.role === 'teacher');
        setTherapists(teachers);
        const available = teachers.find((t) => (t.assignedStudents?.length ?? 0) < MAX_CASELOAD);
        setForm((prev) => ({ ...prev, therapist: prev.therapist || available?.name || '' }));
      })
      .catch(() => setTherapists([]));

    getStudentOptions()
      .then(({ data }) => {
        setExistingStudents(data);
        if (Array.isArray(data)) {
          registerStudentPhotos(data);
        }
      })
      .catch(() => setExistingStudents([]));

    getFormConfig('Enrollment Wizard')
      .then(({ data }) => {
        if (data) {
          if (Array.isArray(data.customSections)) {
            setCustomSections(data.customSections);
          }
          if (Array.isArray(data.deletedSections)) {
            setDeletedSections(data.deletedSections);
          }
          if (Array.isArray(data.fields)) {
            const normalizedFields = data.fields.map((f: any) => ({
              ...f,
              section:
                f.section ||
                (/parent|guardian|mother|father|family|contact/i.test(f.label)
                  ? 'Parent Info'
                  : /medical|allerg|doctor|health|insurance|medication|hospital|physician|diet/i.test(f.label)
                  ? 'Medical Info'
                  : 'Student Info'),
            }));
            setFormFields(normalizedFields);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFormConfig();
  }, [loadFormConfig]);

  useFocusEffect(
    useCallback(() => {
      loadFormConfig();
    }, [loadFormConfig])
  );

  const isFieldVisible = (label: string, defaultVisible = true) => {
    const f = formFields.find(
      (item) => item.label?.toLowerCase().trim() === label.toLowerCase().trim()
    );
    if (!f) return defaultVisible;
    return f.visible !== false;
  };

  const caseloadOf = (name: string) => therapists.find((t) => t.name === name)?.assignedStudents?.length ?? 0;
  const isFull = (name: string) => caseloadOf(name) >= MAX_CASELOAD;
  const therapistNames = therapists.map((t) => t.name);

  const baseSteps = ['Student Info', 'Parent Info', 'Medical Info'];
  const activeBaseSteps = baseSteps.filter((s) => !deletedSections.includes(s));
  const activeCustomSections = customSections.filter((s) => !deletedSections.includes(s));
  const activeInfoTypes = [...activeBaseSteps, ...activeCustomSections];
  const steps = [...activeInfoTypes, 'Assign Therapist', 'Review'];
  const currentStep = steps[step] || steps[0] || 'Student Info';

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (currentStep === 'Student Info') {
      if (!form.name.trim()) { showToast('Student name is required', 'error'); return; }
      if (!form.dob.trim()) { showToast('Date of birth is required', 'error'); return; }
    }
    if (currentStep === 'Parent Info') {
      if (!form.parentName.trim()) { showToast('Parent name is required', 'error'); return; }
      if (!form.parentPhone.trim()) { showToast('Parent phone is required', 'error'); return; }
      if (!PHONE_RE.test(form.parentPhone.trim())) {
        showToast('Invalid phone (7-20 digits, spaces, ()/+ -)', 'error');
        return;
      }
      if (form.parentEmail.trim() && !EMAIL_RE.test(form.parentEmail.trim())) {
        showToast('Invalid parent email address', 'error');
        return;
      }
    }
    if (currentStep === 'Assign Therapist') {
      if (!form.therapist) { showToast('Please pick a therapist', 'error'); return; }
      if (isFull(form.therapist)) {
        showToast(`${form.therapist} is at maximum capacity (2 students). Choose another therapist.`, 'error');
        return;
      }
    }

    // Check required fields for custom info types or dynamic fields on current step
    const excludedForCurrentStep =
      currentStep === 'Student Info'
        ? ['Full Name', 'Student Full Name', 'Date of Birth', 'Gender', 'Program', 'Program Type']
        : currentStep === 'Parent Info'
        ? ['Parent / Guardian Name', 'Parent Name', 'Phone', 'Parent Phone', 'Email', 'Parent Email']
        : currentStep === 'Medical Info'
        ? ['Diagnosis', 'Medical Notes']
        : [];

    const sectionRequiredFields = formFields.filter(
      (f) =>
        f.visible !== false &&
        f.required &&
        f.section?.toLowerCase().trim() === currentStep.toLowerCase().trim() &&
        !excludedForCurrentStep.some((ex) => ex.toLowerCase() === f.label.toLowerCase())
    );
    const missing = sectionRequiredFields.filter((f) => {
      const val = customValues[f.id] ?? customValues[f.label];
      return val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
    });
    if (missing.length > 0) {
      showToast(`Please complete required field: ${missing[0].label}`, 'error');
      return;
    }

    duplicateConfirmed.current = false;
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleTakePhoto = () => {
    setCameraModalOpen(true);
  };

  const handleChoosePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showToast('Media library permission is required to choose a photo', 'error');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        set('photoUri', asset.uri);
        const photoData = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        set('photoBase64', photoData);
        if (form.name.trim()) {
          saveStudentPhoto({
            name: form.name.trim(),
            fullName: form.name.trim(),
            photo: photoData,
            photoBase64: photoData,
            photoUri: asset.uri,
          });
        }
        showToast('Student photo uploaded successfully', 'success');
      }
    } catch (err: any) {
      showToast('Could not select photo: ' + (err?.message || 'Error occurred'), 'error');
    }
  };

  const handleRemovePhoto = () => {
    set('photoUri', '');
    set('photoBase64', '');
    showToast('Photo removed', 'info');
  };

  const saveProgress = () => {
    try {
      const key = `enrollment-draft-${form.name.trim().toLowerCase() || 'untitled'}`;
      localStorage.setItem(key, JSON.stringify(form));
      if (form.name.trim() && (form.photoBase64 || form.photoUri)) {
        saveStudentPhoto({
          name: form.name.trim(),
          fullName: form.name.trim(),
          photo: form.photoBase64 || form.photoUri,
          photoBase64: form.photoBase64,
          photoUri: form.photoUri,
        });
      }
      showToast('Draft stored locally on this device', 'success');
    } catch (err) {
      showToast('This device does not support local drafts', 'error');
    }
  };

  const submitEnrollment = async () => {
    if (saving) return;
    setSaving(true);
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const photoPayload = form.photoBase64 || form.photoUri || '';
    const payload = {
      firstName,
      lastName: rest.join(' ') || '-',
      dateOfBirth: form.dob,
      programType: form.program,
      therapyGroup: form.therapyGroup,
      gender: form.gender,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      parentEmail: form.parentEmail.trim(),
      diagnosis: form.diagnosis.trim(),
      medicalNotes: form.medicalNotes.trim(),
      documents: [],
      assignedTherapist: form.therapist,
      photo: photoPayload,
      photoBase64: form.photoBase64 || '',
      customFields: customValues,
    };
    try {
      const res = await createStudentEnrollment(payload);
      const createdData = res?.data;
      saveStudentPhoto({
        id: createdData?.id,
        name: form.name.trim(),
        fullName: form.name.trim(),
        photo: createdData?.headshotUrl || createdData?.photoUrl || createdData?.photo || photoPayload,
        photoBase64: form.photoBase64,
        photoUri: form.photoUri,
      });
      showToast(`${form.name} enrolled in ${form.program}`, 'success');
      navigation?.navigate?.('AssessmentDashboard' as never);
    } catch (err) {
      // Keep photo saved locally with the student name
      saveStudentPhoto({
        name: form.name.trim(),
        fullName: form.name.trim(),
        photo: photoPayload,
        photoBase64: form.photoBase64,
        photoUri: form.photoUri,
      });
      showToast('Could not save the enrollment. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const duplicateConfirmed = React.useRef(false);

  const handleSubmit = () => {
    const normalized = form.name.trim().toLowerCase();
    const dup = existingStudents.find((s) => s.name.toLowerCase() === normalized);
    if (dup && !duplicateConfirmed.current) {
      duplicateConfirmed.current = true;
      showToast('Name already exists — press Finish Enrollment again to confirm', 'error');
      return;
    }
    submitEnrollment();
  };

  // Group custom values by info type section
  const customSectionEntries: Array<{ title: string; rows: [string, string][] }> = activeCustomSections
    .map((sec) => {
      const secFields = formFields.filter(
        (f) => f.section?.toLowerCase().trim() === sec.toLowerCase().trim() && f.visible !== false
      );
      const rows: [string, string][] = [];
      secFields.forEach((f) => {
        const val = customValues[f.id] ?? customValues[f.label];
        if (val !== undefined && val !== '' && val !== null && val !== false) {
          rows.push([f.label, typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)]);
        }
      });
      return { title: sec, rows };
    })
    .filter((entry) => entry.rows.length > 0);

  const capturedKeys = new Set(
    formFields.map((f) => f.id).concat(formFields.map((f) => f.label))
  );
  const remainingCustomRows = Object.entries(customValues)
    .filter(([k, v]) => !capturedKeys.has(k) && v !== '' && v !== undefined && v !== false)
    .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)] as [string, string]);

  const calculatedAge = calculateAge(form.dob);

  const reviewSections: Array<{ title: string; rows: [string, string][] }> = [
    {
      title: 'Student',
      rows: [
        ['Full Name', form.name || '—'],
        ['Gender', form.gender || '—'],
        ['Date of Birth', form.dob ? `${form.dob}${calculatedAge !== null ? ` (${calculatedAge} years old)` : ''}` : '—'],
        ['Program Type', form.program || '—'],
        ['Therapy Group', form.therapyGroup || '—'],
        ['Photo', form.photoUri ? 'Photo Attached' : 'None'],
      ],
    },
    {
      title: 'Parent / Guardian',
      rows: [
        ['Name', form.parentName || '—'],
        ['Phone', form.parentPhone || '—'],
        ['Email', form.parentEmail || '—'],
      ],
    },
    {
      title: 'Medical Info',
      rows: [['Diagnosis', form.diagnosis || 'n/a']],
    },
    {
      title: 'Therapist',
      rows: [['Therapist', form.therapist || '—']],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Enrollment" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enrollment Wizard</Text>
        <Text style={styles.headerSubtitle}>ABA Therapy Management — New Child Enrollment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={step} steps={steps} />

        <View style={styles.card}>
          <View style={styles.cardHeadingRow}>
            <Text style={styles.cardHeading}>Step {step + 1}: {currentStep}</Text>
          </View>

          {currentStep === 'Student Info' && (
            <View style={styles.stepBody}>
              {/* Student Photo Card with Camera & Upload buttons */}
              {isFieldVisible('Student Photo') && isFieldVisible('Photo') && (
                <View style={styles.photoUploadCard}>
                  <Text style={styles.fieldLabel}>Student Photo</Text>
                  <View style={styles.photoRow}>
                    <View style={styles.photoAvatarContainer}>
                      {form.photoUri ? (
                        <View style={styles.photoWrapper}>
                          <Image source={{ uri: form.photoUri }} style={styles.photoImage} />
                          <TouchableOpacity
                            style={styles.photoRemoveBtn}
                            onPress={handleRemovePhoto}
                            accessibilityLabel="Remove photo"
                          >
                            <Feather name="x" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Feather name="user" size={32} color="#94A3B8" />
                        </View>
                      )}
                    </View>

                    <View style={styles.photoButtonContainer}>
                      <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
                        <Feather name="camera" size={15} color="#FFFFFF" />
                        <Text style={styles.cameraBtnText}>Open Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.uploadBtn} onPress={handleChoosePhoto}>
                        <Feather name="upload" size={15} color={colors.navyText} />
                        <Text style={styles.uploadBtnText}>Upload Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.fieldHint}>
                    Take a live picture with your camera or upload an image file from your device.
                  </Text>
                </View>
              )}

              {isFieldVisible('Student Full Name') && isFieldVisible('Full Name') && (
                <Field label="Student Full Name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Aiden Rivera" />
              )}

              {isFieldVisible('Date of Birth') && (
                <View style={styles.field}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>Date of Birth</Text>
                    {form.dob && calculateAge(form.dob) !== null ? (
                      <View style={styles.ageBadge}>
                        <Feather name="calendar" size={12} color="#0284C7" />
                        <Text style={styles.ageBadgeText}>
                          Calculated Age: {calculateAge(form.dob)} {calculateAge(form.dob) === 1 ? 'year' : 'years'} old
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.dobWrap}>
                    <DobPicker
                      value={form.dob || ''}
                      maximumDate={new Date()}
                      onChange={(iso) => set('dob', iso)}
                    />
                  </View>
                </View>
              )}

              {isFieldVisible('Gender') && (
                <View style={styles.field}><Text style={styles.fieldLabel}>Gender</Text><Chips options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} /></View>
              )}

              {isFieldVisible('Program Type') && isFieldVisible('Program') && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Program Type</Text>
                  <Chips options={PROGRAM_TYPES} value={form.program} onChange={(v) => set('program', v)} />
                </View>
              )}

              {isFieldVisible('Therapy Group') && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Therapy Group</Text>
                  <Chips options={THERAPY_GROUPS} value={form.therapyGroup} onChange={(v) => set('therapyGroup', v)} />
                  {form.dob && getTherapyGroupAgeWarning(form.therapyGroup, calculateAge(form.dob)) ? (
                    <View style={styles.ageWarningBox}>
                      <Feather name="info" size={13} color="#D97706" />
                      <Text style={styles.ageWarningText}>
                        {getTherapyGroupAgeWarning(form.therapyGroup, calculateAge(form.dob))}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              <DynamicFormFields
                formName="Enrollment Wizard"
                section="Student Info"
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Full Name',
                  'Student Full Name',
                  'Student Photo',
                  'Photo',
                  'Date of Birth',
                  'Age',
                  'Gender',
                  'Program',
                  'Program Type',
                  'Therapy Group',
                ]}
              />
            </View>
          )}

          {currentStep === 'Parent Info' && (
            <View style={styles.stepBody}>
              {isFieldVisible('Parent / Guardian Name') && isFieldVisible('Parent Name') && (
                <Field required label="Parent / Guardian Name" value={form.parentName} onChangeText={(t) => set('parentName', t)} placeholder="e.g. Maria Rivera" />
              )}
              {isFieldVisible('Phone') && isFieldVisible('Parent Phone') && (
                <Field required label="Phone" value={form.parentPhone} onChangeText={(t) => set('parentPhone', t)} keyboardType="phone-pad" maxWidth placeholder="(555) 000-0000" />
              )}
              {isFieldVisible('Email') && isFieldVisible('Parent Email') && (
                <Field label="Email" value={form.parentEmail} onChangeText={(t) => set('parentEmail', t)} keyboardType="email-address" maxWidth placeholder="guardian@example.com" hint="Optional" />
              )}

              <DynamicFormFields
                formName="Enrollment Wizard"
                section="Parent Info"
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Parent / Guardian Name',
                  'Parent Name',
                  'Phone',
                  'Parent Phone',
                  'Email',
                  'Parent Email',
                ]}
              />
            </View>
          )}

          {currentStep === 'Medical Info' && (
            <View style={styles.stepBody}>
              {isFieldVisible('Diagnosis') && (
                <Field label="Diagnosis" value={form.diagnosis} onChangeText={(t) => set('diagnosis', t)} placeholder="e.g. Autism Spectrum Disorder" />
              )}
              {isFieldVisible('Medical Notes') && (
                <Field label="Medical Notes" value={form.medicalNotes} onChangeText={(t) => set('medicalNotes', t)} multiline placeholder="Enter any relevant medical notes..." />
              )}

              <DynamicFormFields
                formName="Enrollment Wizard"
                section="Medical Info"
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Diagnosis',
                  'Medical Notes',
                ]}
              />
            </View>
          )}

          {/* Custom Info Types dynamically configured in Form Builder */}
          {!['Student Info', 'Parent Info', 'Medical Info', 'Assign Therapist', 'Review'].includes(currentStep) && (
            <View style={styles.stepBody}>
              <View style={styles.customSectionHeader}>
                <Feather name="folder" size={16} color="#0284C7" />
                <Text style={styles.customSectionTitle}>{currentStep}</Text>
              </View>
              <Text style={styles.customSectionSubtitle}>
                Please fill in the information for {currentStep}.
              </Text>
              <DynamicFormFields
                formName="Enrollment Wizard"
                section={currentStep}
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
              />
              {formFields.filter(
                (f) => f.visible !== false && f.section?.toLowerCase().trim() === currentStep.toLowerCase().trim()
              ).length === 0 && (
                <View style={styles.emptyCustomStepBox}>
                  <Feather name="info" size={16} color="#64748B" />
                  <Text style={styles.emptyCustomStepText}>
                    No custom fields have been added to "{currentStep}" yet. You can add and customize fields for this info type in the Form Builder.
                  </Text>
                </View>
              )}
            </View>
          )}

          {currentStep === 'Assign Therapist' && (
            <View style={styles.stepBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Therapist <Text style={styles.requiredStar}>*</Text></Text>
                <Text style={styles.fieldHint}>Each therapist can be assigned up to {MAX_CASELOAD} students at a time.</Text>
                {therapistNames.length ? (
                  <View style={styles.chipRow}>
                    {therapists.map((t) => {
                      const count = t.assignedStudents?.length ?? 0;
                      const full = count >= MAX_CASELOAD;
                      const selected = form.therapist === t.name;
                      return (
                        <TouchableOpacity
                          key={t.name}
                          disabled={full}
                          style={[styles.chip, selected && styles.chipSelected, full && styles.chipDisabled]}
                          onPress={() => set('therapist', t.name)}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected, full && styles.chipTextDisabled]}>
                            {t.name} ({count}/{MAX_CASELOAD})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.fieldHint}>No therapists available.</Text>
                )}
                {form.therapist && isFull(form.therapist) && (
                  <Text style={styles.capacityWarning}>
                    {form.therapist} is at capacity — pick an available therapist to continue.
                  </Text>
                )}
                {therapistNames.length > 0 && therapistNames.every(isFull) && (
                  <Text style={styles.capacityWarning}>All therapists are at maximum capacity (2/2). Reassign a student before enrolling another.</Text>
                )}
              </View>
            </View>
          )}

          {currentStep === 'Review' && (
            <View style={styles.stepBody}>
              <Text style={styles.reviewIntro}>Please review the enrollment details before confirming.</Text>

              <View style={styles.reviewCard}>
                {form.photoUri ? (
                  <View style={styles.reviewPhotoHeader}>
                    <Image source={{ uri: form.photoUri }} style={styles.reviewPhotoImage} />
                    <View style={styles.reviewPhotoInfo}>
                      <Text style={styles.reviewStudentName}>{form.name || 'New Student'}</Text>
                      <Text style={styles.reviewStudentProgram}>{form.program} Program</Text>
                    </View>
                  </View>
                ) : null}

                {reviewSections.map((section) => (
                  <ReviewSection key={section.title} title={section.title}>
                    {section.rows.map(([label, value]) => (
                      <ReviewRow key={label} label={label} value={value} />
                    ))}
                  </ReviewSection>
                ))}
                {customSectionEntries.map((section) => (
                  <ReviewSection key={section.title} title={section.title}>
                    {section.rows.map(([label, value]) => (
                      <ReviewRow key={label} label={label} value={value} />
                    ))}
                  </ReviewSection>
                ))}
                {remainingCustomRows.length > 0 && (
                  <ReviewSection title="Custom Fields">
                    {remainingCustomRows.map(([label, value]) => (
                      <ReviewRow key={label} label={label} value={value} />
                    ))}
                  </ReviewSection>
                )}
              </View>
            </View>
          )}

          <View style={styles.actionsRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                <Feather name="arrow-left" size={16} color={colors.navyText} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={saveProgress}>
              <Feather name="bookmark" size={14} color={colors.navyText} />
              <Text style={styles.secondaryBtnText}>Save Progress</Text>
            </TouchableOpacity>
            {step < steps.length - 1 ? (
              <TouchableOpacity style={styles.nextBtn} onPress={next}>
                <Text style={styles.nextBtnText}>Next</Text>
                <Feather name="arrow-right" size={16} color={colors.navyText} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.navyText} />
                ) : (
                  <Feather name="check" size={16} color={colors.navyText} />
                )}
                <Text style={styles.nextBtnText}>{saving ? 'Submitting…' : 'Finish Enrollment'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ABA Therapy Management System — SCR-009 Enrollment Wizard</Text>
      </View>

      <CameraCaptureModal
        visible={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(uri, b64) => {
          const photoData = b64 || uri;
          set('photoUri', uri);
          set('photoBase64', photoData);
          if (form.name.trim()) {
            saveStudentPhoto({
              name: form.name.trim(),
              fullName: form.name.trim(),
              photo: photoData,
              photoBase64: photoData,
              photoUri: uri,
            });
          }
          showToast('Student photo captured successfully', 'success');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },

  header: {
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.navyText, fontSize: 20, fontWeight: 'bold', letterSpacing: 0.2 },
  headerSubtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },

  content: { padding: spacing.xl, alignItems: 'stretch' },

  progressCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...makeShadow(1, 4, 0.05, '0, 0, 0', 1),
  },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepWrap: { flex: 1, alignItems: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 2 },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: C_SKY, borderColor: C_SKY },
  stepDotCurrent: { backgroundColor: C_YELLOW, borderColor: C_YELLOW, borderWidth: 1.5 },
  stepNum: { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumCurrent: { color: '#1F2937' },
  stepLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: C_SKY },
  stepLabel: { fontSize: 10, fontWeight: '500', color: '#9CA3AF', marginTop: spacing.sm, textAlign: 'center' },
  stepLabelCurrent: { color: '#1F2937', fontWeight: '700' },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...makeShadow(1, 6, 0.06, '0, 0, 0', 1),
  },
  cardHeadingRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: spacing.md, marginBottom: spacing.lg },
  cardHeading: { fontSize: 17, fontWeight: '700', color: '#1F2937', letterSpacing: 0.2 },

  stepBody: { gap: spacing.lg },

  photoUploadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.xs,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: 4,
  },
  photoAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: C_SKY,
  },
  photoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C_RED,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  photoButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    ...makeShadow(1, 2, 0.08, '0, 0, 0', 1),
  },
  cameraBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },

  field: { gap: spacing.xs },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C_INK, marginBottom: 2 },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  ageWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  ageWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  requiredStar: { color: C_RED, fontWeight: '700' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  dobWrap: { paddingVertical: 2 },
  textInput: {
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: colors.white,
  },
  textInputFocused: { borderColor: C_SKY, borderWidth: 1.5 },
  textInputMax: { maxWidth: 320 },
  textArea: { minHeight: 100, textAlignVertical: 'top', alignSelf: 'stretch' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: C_YELLOW, borderColor: C_YELLOW },
  chipDisabled: { opacity: 0.45, borderStyle: 'dashed' },
  chipText: { fontSize: 12, fontWeight: '600', color: C_INK },
  chipTextSelected: { color: '#1F2937', fontWeight: '700' },
  chipTextDisabled: { color: '#9CA3AF' },
  capacityWarning: { color: C_RED, fontSize: 12, fontWeight: '600', marginTop: 4 },

  reviewIntro: { fontSize: 13, color: '#6B7280', marginBottom: spacing.md },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  reviewPhotoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewPhotoImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: C_SKY,
  },
  reviewPhotoInfo: {
    flex: 1,
  },
  reviewStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  reviewStudentProgram: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  reviewSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: C_SKY,
    marginBottom: spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 5,
    gap: spacing.md,
  },
  reviewKey: { fontSize: 13, color: '#6B7280', flexShrink: 1 },
  reviewValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', flexShrink: 1, textAlign: 'right' },

  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  backBtn: {
    flexDirection: 'row', gap: spacing.xs, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center',
  },
  backBtnText: { fontWeight: '600', color: colors.navyText },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: spacing.md, alignItems: 'center',
  },
  secondaryBtnText: { fontWeight: '600', fontSize: 12, color: colors.navyText, textAlign: 'center' },
  nextBtn: {
    flex: 1.6, flexDirection: 'row', gap: spacing.xs, backgroundColor: C_YELLOW, borderRadius: 10,
    paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center',
    ...makeShadow(1, 3, 0.1, '0, 0, 0', 1),
  },
  nextBtnText: { fontWeight: '700', color: '#1F2937' },

  customSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  customSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  emptyCustomStepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  emptyCustomStepText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },

  footer: {
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: { color: '#64748B', fontSize: 11, textAlign: 'center' },
});