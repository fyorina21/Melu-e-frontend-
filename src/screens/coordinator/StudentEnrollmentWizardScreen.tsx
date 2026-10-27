import storage from '../../utils/storage';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DobPicker from '../../components/DobPicker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import {
  getStaffOptions,
  getStudentOptions,
  type StaffOption,
  type StudentOption,
} from '../../api/optionsApi';
import {
  createStudentEnrollment,
  updateStudentProfile,
  getStudentProfile,
} from '../../api/coordinatorApi';
import { getFormConfig, DEFAULT_ENROLLMENT_FORM } from '../../api/institutionalAdminApi';
import { resolveFieldOptions } from '../../components/DynamicFormFields';
import CameraCaptureModal from '../../components/CameraCaptureModal';
import { saveStudentPhoto, registerStudentPhotos } from '../../utils/studentPhotoHelper';
import { markStudentActive } from '../../utils/studentStatusHelper';
import { registerStudentStatuses } from '../../utils/studentLifecycleHelper';
import {
  DEMOGRAPHIC_KEY,
  F_DEMOGRAPHIC_KEY,
  getStudentDemographic,
} from '../../utils/sensitiveDataSanitizer';
import { filterOutDeletedStaff, onDeletedStaffChanged } from '../../utils/deletedStaffHelper';
import {
  getEnrollmentDraft,
  saveEnrollmentDraft,
  deleteEnrollmentDraft,
} from '../../utils/enrollmentDraftHelper';
import DocumentAttachmentCard, {
  extractDocumentMeta,
} from '../../components/DocumentAttachmentCard';
import VideoPlayerView from '../../components/VideoPlayerView';
import MediaViewerModal from '../../components/MediaViewerModal';
import StudentAvatar from '../../components/StudentAvatar';
import type { ProgramDirectorStackParamList } from '../../types';

export const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const C_YELLOW = '#FCD34D';
const C_SKY = '#38BDF8';
const C_INK = '#374151';
const C_INPUT_BORDER = '#D1D5DB';
const C_RED = '#DC2626';

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

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentEnrollmentWizard'>;

function StepIndicator({
  current,
  steps,
  onStepPress,
}: {
  current: number;
  steps: string[];
  onStepPress?: (index: number) => void;
}) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
        {steps.map((s, i) => (
          <TouchableOpacity
            key={s}
            style={styles.stepWrap}
            onPress={() => onStepPress?.(i)}
            activeOpacity={onStepPress ? 0.7 : 1}
          >
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
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Chips({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          disabled={disabled}
          style={[
            styles.chip,
            value === opt && styles.chipSelected,
            disabled && styles.chipDisabled,
          ]}
          onPress={() => onChange(opt)}
        >
          <Text
            style={[
              styles.chipText,
              value === opt && styles.chipTextSelected,
              disabled && styles.chipTextDisabled,
            ]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
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

export default function StudentEnrollmentWizardScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const routeDraftId = (route?.params as any)?.draftId || (route?.params as any)?.studentId;
  const routeSection = (route?.params as any)?.section;
  const routeInitialStep = (route?.params as any)?.initialStep;
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(routeDraftId || null);
  const [submissionErrors, setSubmissionErrors] = useState<
    Array<{ fieldId?: string; label: string; section: string; error: string }>
  >([]);
  const [step, setStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [therapists, setTherapists] = useState<StaffOption[]>([]);
  const [existingStudents, setExistingStudents] = useState<StudentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [deletedSections, setDeletedSections] = useState<string[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [activePhotoFieldId, setActivePhotoFieldId] = useState<string | null>(null);
  const [activeDropdownFieldId, setActiveDropdownFieldId] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType?: 'image' | 'video' | 'pdf' | 'document';
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  const duplicateConfirmed = useRef(false);

  // Restore draft if opened with a draft ID
  useEffect(() => {
    if (routeDraftId) {
      setCurrentDraftId(routeDraftId);
      const draft = getEnrollmentDraft(routeDraftId);
      if (draft && draft.formValues) {
        setFormValues((prev) => ({
          ...prev,
          ...draft.formValues,
        }));
        // Requirements: Wizard initialization for resumed drafts must start on Step 1 (step index 0)
        // while preserving all pre-filled and half-filled field values across all form steps.
        setStep(0);
        showToast(`Resumed draft for ${draft.name}`, 'info');
      } else {
        // Fallback for draft students fetched from backend
        getStudentProfile(routeDraftId)
          .then((res: any) => {
            const data = res?.data;
            if (data && (data.customFields || data.formValues)) {
              const vals = data.formValues || data.customFields || {};
              setFormValues((prev) => ({
                ...prev,
                ...vals,
                f1: vals.f1 || data.fullName || '',
                f2: vals.f2 || data.dateOfBirth || '',
                [F_DEMOGRAPHIC_KEY]: vals[F_DEMOGRAPHIC_KEY] || getStudentDemographic(data, ''),
                f_program: vals.f_program || data.programType || '',
                f_therapy: vals.f_therapy || data.therapyGroup || '',
                f_therapist: vals.f_therapist || data.therapist || '',
                f4: vals.f4 || data.guardianName || '',
                f5: vals.f5 || data.guardianPhone || '',
                f6: vals.f6 || data.guardianEmail || '',
                f_diagnosis: vals.f_diagnosis || data.diagnosis || '',
              }));
              setStep(0);
            }
          })
          .catch(() => {});
      }
    }
  }, [routeDraftId, showToast]);

  // Single Source of Truth: Fetch active enrollment schema from backend FormConfiguration
  const loadFormConfig = useCallback(async () => {
    try {
      const { data } = await getFormConfig('Enrollment Wizard');
      if (data) {
        if (Array.isArray(data.customSections)) {
          setCustomSections(data.customSections);
        }
        if (Array.isArray(data.deletedSections)) {
          setDeletedSections(data.deletedSections);
        }
        if (Array.isArray(data.fields) && data.fields.length > 0) {
          setFormFields(data.fields);
          // Pre-seed default values for fields that don't have a value yet
          setFormValues((prev) => {
            const updated = { ...prev };
            data.fields.forEach((f: any) => {
              if (updated[f.id] === undefined) {
                if (f.default_value !== undefined) {
                  updated[f.id] = f.default_value;
                } else if (
                  f.type === 'Radio' ||
                  f.type === 'Dropdown' ||
                  f.type === 'radio' ||
                  f.type === 'dropdown'
                ) {
                  const opts = resolveFieldOptions(f);
                  if (opts.length > 0 && f.required) {
                    updated[f.id] = opts[0];
                  }
                }
              }
            });
            return updated;
          });
          return;
        }
      }
      setFormFields(DEFAULT_ENROLLMENT_FORM.fields || []);
      setCustomSections(DEFAULT_ENROLLMENT_FORM.customSections || []);
    } catch {
      setFormFields(DEFAULT_ENROLLMENT_FORM.fields || []);
      setCustomSections(DEFAULT_ENROLLMENT_FORM.customSections || []);
    }
  }, []);

  // Initial load: Fetch form schema, staff caseloads, and existing students before revealing the form
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        await Promise.allSettled([
          loadFormConfig(),
          getStaffOptions()
            .then(({ data }) => {
              if (!isMounted) return;
              const clean = filterOutDeletedStaff(data);
              const teachers = clean.filter((s) => s.role === 'teacher');
              setTherapists(teachers);
            })
            .catch(() => {
              if (isMounted) setTherapists([]);
            }),
          getStudentOptions()
            .then(({ data }) => {
              if (!isMounted) return;
              setExistingStudents(data);
              if (Array.isArray(data)) {
                registerStudentPhotos(
                  data.map((item: any) => ({
                    id: item.id ? String(item.id) : undefined,
                    name: item.fullName || item.name,
                    photo: item.photo,
                    photoUrl: item.photoUrl,
                    headshotUrl: item.headshotUrl,
                  })),
                );
              }
            })
            .catch(() => {
              if (isMounted) setExistingStudents([]);
            }),
        ]);
      } finally {
        if (isMounted) {
          setLoadingForm(false);
        }
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [loadFormConfig]);

  useEffect(() => {
    return onDeletedStaffChanged(() => {
      getStaffOptions().then(({ data }) => {
        const clean = filterOutDeletedStaff(data);
        setTherapists(clean.filter((s) => s.role === 'teacher'));
      });
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFormConfig();
    }, [loadFormConfig]),
  );

  useEffect(() => {
    const handler = (e: any) => {
      const name = (e?.detail?.formName || '').toLowerCase();
      if (name.includes('enrollment')) {
        loadFormConfig();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', handler);
      return () => window.removeEventListener('melue_form_config_changed', handler);
    }
  }, [loadFormConfig]);

  // Dynamically map wizard steps directly to sections authored in the schema
  const deletedSet = new Set((deletedSections || []).map((s) => s.toLowerCase().trim()));

  const activeSections: string[] = [];

  // 1. From customSections defined in schema
  (customSections || []).forEach((sec) => {
    const s = (sec || '').trim();
    if (
      s &&
      !deletedSet.has(s.toLowerCase()) &&
      !activeSections.some((a) => a.toLowerCase() === s.toLowerCase()) &&
      !['assign therapist', 'review', 'review & complete'].includes(s.toLowerCase())
    ) {
      activeSections.push(s);
    }
  });

  // 2. From section attributes on fields, preserving schema ordering
  (formFields || []).forEach((f: any) => {
    const s = (f.section || 'General').trim();
    if (
      s &&
      !deletedSet.has(s.toLowerCase()) &&
      !activeSections.some((a) => a.toLowerCase() === s.toLowerCase()) &&
      !['assign therapist', 'review', 'review & complete'].includes(s.toLowerCase())
    ) {
      activeSections.push(s);
    }
  });

  const includeTherapistStep = !deletedSet.has('assign therapist');

  const steps = [
    ...activeSections,
    ...(includeTherapistStep ? ['Assign Therapist'] : []),
    'Review',
  ];

  const currentStep = steps[step] || steps[0] || 'Student Info';

  // Jump to specific step if targeted by route params (e.g. upload documents from profile)
  useEffect(() => {
    if (routeSection && steps.length > 0) {
      const matchIdx = steps.findIndex(
        (s) =>
          s.toLowerCase().includes(routeSection.toLowerCase()) ||
          (routeSection.toLowerCase() === 'documents' &&
            (s.toLowerCase().includes('medical') || s.toLowerCase().includes('doc'))),
      );
      if (matchIdx >= 0) {
        setStep(matchIdx);
      }
    } else if (routeInitialStep !== undefined && steps.length > 0) {
      const target = Number(routeInitialStep);
      if (target >= 0 && target < steps.length) {
        setStep(target);
      }
    }
  }, [routeSection, routeInitialStep, steps]);

  // Helpers for caseload checking (hardcoded capacity limit removed)
  const caseloadOf = (name: string) => {
    const t = therapists.find((th) => th.name === name);
    return t ? ((t as any).assignedStudentCount ?? t.assignedStudents?.length ?? 0) : 0;
  };
  const isFull = (_name: string) => false;

  // Single dynamic field change handler
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => {
      const updated = { ...prev, [fieldId]: value };

      // Automatic age-based therapy group suggestion if DOB changed
      const field = formFields.find((f) => f.id === fieldId);
      const normLabel = (field?.label || '').toLowerCase();
      const normId = (field?.id || '').toLowerCase();
      if (
        normLabel.includes('birth') ||
        normLabel.includes('dob') ||
        normId === 'f2' ||
        normId === 'enr_dob'
      ) {
        const age = calculateAge(value);
        if (age !== null && age >= 3 && age <= 19) {
          const therapyField = formFields.find(
            (f) =>
              f.id === 'f_therapy' ||
              f.id === 'enr_therapy_group' ||
              /therapy.*group/i.test(f.label),
          );
          if (therapyField && !updated[therapyField.id]) {
            updated[therapyField.id] = age <= 12 ? 'Basic' : 'Functional Living Skill';
          }
        }
      }

      // Synchronize child first/middle/last name across state management layer
      if (
        normId === 'f1' ||
        normId === 'enr_first_name' ||
        normId === 'childfirstname' ||
        normId === 'child_first_name' ||
        normId === 'firstname' ||
        normId === 'first_name' ||
        normLabel.includes('first name') ||
        normLabel.includes('student full name')
      ) {
        if (normId === 'f1' || normLabel.includes('full name')) {
          const parts = String(value || '')
            .trim()
            .split(/\s+/);
          const first = parts[0] || '';
          const last = parts.slice(1).join(' ') || '';
          updated.firstName = first;
          updated.first_name = first;
          updated.childFirstName = first;
          updated.child_first_name = first;
          updated.enr_first_name = first;
          if (last) {
            updated.lastName = last;
            updated.last_name = last;
            updated.childLastName = last;
            updated.child_last_name = last;
            updated.enr_last_name = last;
          }
        } else {
          updated.firstName = value;
          updated.first_name = value;
          updated.childFirstName = value;
          updated.child_first_name = value;
          updated.enr_first_name = value;
        }
      }

      if (
        normId === 'enr_last_name' ||
        normId === 'childlastname' ||
        normId === 'child_last_name' ||
        normId === 'lastname' ||
        normId === 'last_name' ||
        normLabel.includes('last name')
      ) {
        updated.lastName = value;
        updated.last_name = value;
        updated.childLastName = value;
        updated.child_last_name = value;
        updated.enr_last_name = value;
      }

      if (
        normId === 'enr_middle_name' ||
        normId === 'childmiddlename' ||
        normId === 'child_middle_name' ||
        normId === 'middlename' ||
        normId === 'middle_name' ||
        normLabel.includes('middle name')
      ) {
        updated.middleName = value;
        updated.middle_name = value;
        updated.childMiddleName = value;
        updated.child_middle_name = value;
        updated.enr_middle_name = value;
      }

      // If updating therapist, keep therapist key updated
      if (fieldId === 'f_therapist' || normLabel.includes('therapist')) {
        updated.therapist = value;
      }

      return updated;
    });
  };

  // Helper accessors for student information derived dynamically from schema
  const getFieldVal = (idOrPattern: string | RegExp) => {
    const f = formFields.find((field: any) =>
      typeof idOrPattern === 'string'
        ? field.id === idOrPattern || field.label?.toLowerCase() === idOrPattern.toLowerCase()
        : idOrPattern.test(field.id) || idOrPattern.test(field.label),
    );
    if (!f) return formValues[typeof idOrPattern === 'string' ? idOrPattern : ''] || '';
    return formValues[f.id] ?? '';
  };

  const studentFirstName =
    getFieldVal('enr_first_name') ||
    getFieldVal('childFirstName') ||
    getFieldVal('child_first_name') ||
    getFieldVal('firstName') ||
    getFieldVal('first_name') ||
    getFieldVal(/child.*first.*name|^first.*name$/i) ||
    formValues.childFirstName ||
    formValues.firstName ||
    formValues.first_name ||
    formValues.enr_first_name ||
    '';

  const studentLastName =
    getFieldVal('enr_last_name') ||
    getFieldVal('childLastName') ||
    getFieldVal('child_last_name') ||
    getFieldVal('lastName') ||
    getFieldVal('last_name') ||
    getFieldVal(/child.*last.*name|^last.*name$/i) ||
    formValues.childLastName ||
    formValues.lastName ||
    formValues.last_name ||
    formValues.enr_last_name ||
    '';

  const studentMiddleName =
    getFieldVal('enr_middle_name') ||
    getFieldVal('childMiddleName') ||
    getFieldVal('child_middle_name') ||
    getFieldVal('middleName') ||
    getFieldVal('middle_name') ||
    getFieldVal(/child.*middle.*name|^middle.*name$/i) ||
    formValues.childMiddleName ||
    formValues.middleName ||
    formValues.middle_name ||
    formValues.enr_middle_name ||
    '';

  const studentName =
    (studentFirstName ? `${studentFirstName} ${studentLastName}`.trim() : '') ||
    getFieldVal('f1') ||
    getFieldVal(/student.*name|full.*name|^name$/i) ||
    formValues.name ||
    formValues.fullName ||
    '';
  const studentDob =
    getFieldVal('enr_dob') ||
    getFieldVal('f2') ||
    getFieldVal(/birth|dob/i) ||
    formValues.dob ||
    formValues.dateOfBirth ||
    '';
  const studentProgram =
    getFieldVal('enr_program_type') ||
    getFieldVal('f_program') ||
    getFieldVal(/program/i) ||
    formValues.program ||
    'Regular';
  const studentTherapyGroup =
    getFieldVal('enr_therapy_group') ||
    getFieldVal('f_therapy') ||
    getFieldVal(/therapy/i) ||
    formValues.therapyGroup ||
    'Basic';
  const assignedTherapist =
    getFieldVal('f_therapist') || getFieldVal(/therapist/i) || formValues.therapist || '';
  const studentPhoto =
    getFieldVal('enr_headshot') ||
    getFieldVal('f_photo') ||
    getFieldVal(/photo|headshot/i) ||
    formValues.photoUri ||
    formValues.photoBase64 ||
    '';

  // Photo and Document handlers
  const handleTakePhoto = (fieldId: string) => {
    setActivePhotoFieldId(fieldId);
    setCameraModalOpen(true);
  };

  const handleUploadDocument = async (fieldId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let fileData = asset.uri;

        if ((asset as any).file && typeof FileReader !== 'undefined') {
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL((asset as any).file);
            });
            fileData = dataUrl;
          } catch {}
        }

        handleFieldChange(fieldId, fileData);

        const field = formFields.find((f) => f.id === fieldId);
        const norm = `${fieldId} ${field?.label || ''}`.toLowerCase();
        if (norm.includes('birth')) {
          setFormValues((prev) => ({
            ...prev,
            birth_certificate: fileData,
            birthCertificate: fileData,
            enr_birth_certificate: fileData,
          }));
        } else if (norm.includes('diagnosis')) {
          setFormValues((prev) => ({
            ...prev,
            diagnosis_paper: fileData,
            diagnosisPaper: fileData,
            enr_diagnosis_paper: fileData,
          }));
        } else if (norm.includes('agreement')) {
          setFormValues((prev) => ({
            ...prev,
            agreement: fileData,
            enr_agreement: fileData,
          }));
        } else if (norm.includes('video')) {
          setFormValues((prev) => ({
            ...prev,
            baseline_video: fileData,
            baselineVideo: fileData,
            enr_baseline_video: fileData,
            videoUrl: fileData,
          }));
        } else if (norm.includes('photo') || norm.includes('headshot')) {
          setFormValues((prev) => ({
            ...prev,
            headshot: fileData,
            enr_headshot: fileData,
            photoUrl: fileData,
          }));
          if (studentName.trim()) {
            saveStudentPhoto({
              name: studentName.trim(),
              fullName: studentName.trim(),
              photo: fileData,
              photoBase64: fileData,
              photoUri: asset.uri,
            });
          }
        }

        showToast(`${asset.name || 'File'} uploaded successfully`, 'success');
      }
    } catch (err: any) {
      showToast('Could not select document: ' + (err?.message || 'Error occurred'), 'error');
    }
  };

  const handleChoosePhoto = async (fieldId: string) => {
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
        const photoData = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        handleFieldChange(fieldId, photoData);
        setFormValues((prev) => ({
          ...prev,
          headshot: photoData,
          enr_headshot: photoData,
          photoUrl: photoData,
        }));
        if (studentName.trim()) {
          saveStudentPhoto({
            name: studentName.trim(),
            fullName: studentName.trim(),
            photo: photoData,
            photoBase64: photoData,
            photoUri: asset.uri,
          });
        }
        showToast('Photo uploaded successfully', 'success');
      }
    } catch (err: any) {
      showToast('Could not select photo: ' + (err?.message || 'Error occurred'), 'error');
    }
  };

  const handleRemovePhoto = (fieldId: string) => {
    handleFieldChange(fieldId, '');
    const field = formFields.find((f) => f.id === fieldId);
    const norm = `${fieldId} ${field?.label || ''}`.toLowerCase();
    if (norm.includes('birth')) {
      setFormValues((prev) => ({
        ...prev,
        birth_certificate: '',
        birthCertificate: '',
        enr_birth_certificate: '',
      }));
    } else if (norm.includes('diagnosis')) {
      setFormValues((prev) => ({
        ...prev,
        diagnosis_paper: '',
        diagnosisPaper: '',
        enr_diagnosis_paper: '',
      }));
    } else if (norm.includes('agreement')) {
      setFormValues((prev) => ({ ...prev, agreement: '', enr_agreement: '' }));
    } else if (norm.includes('video')) {
      setFormValues((prev) => ({
        ...prev,
        baseline_video: '',
        baselineVideo: '',
        enr_baseline_video: '',
        videoUrl: '',
      }));
    } else if (norm.includes('photo') || norm.includes('headshot')) {
      setFormValues((prev) => ({ ...prev, headshot: '', enr_headshot: '', photoUrl: '' }));
    }
    showToast('File removed', 'info');
  };

  // Step Navigation — Freely advances to next page without blocking on required fields
  const next = () => {
    duplicateConfirmed.current = false;
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const saveProgress = () => {
    try {
      const derivedFirst =
        studentFirstName ||
        formValues.childFirstName ||
        formValues.child_first_name ||
        formValues.firstName ||
        formValues.first_name ||
        formValues.enr_first_name ||
        (studentName || 'Student').trim().split(/\s+/)[0];

      const derivedLast =
        studentLastName ||
        formValues.childLastName ||
        formValues.child_last_name ||
        formValues.lastName ||
        formValues.last_name ||
        formValues.enr_last_name ||
        (studentName || 'Student').trim().split(/\s+/).slice(1).join(' ') ||
        '';

      const valuesWithNames = {
        ...formValues,
        firstName: derivedFirst,
        first_name: derivedFirst,
        childFirstName: derivedFirst,
        child_first_name: derivedFirst,
        enr_first_name: formValues.enr_first_name || derivedFirst,
        middleName: studentMiddleName,
        middle_name: studentMiddleName,
        childMiddleName: studentMiddleName,
        enr_middle_name: formValues.enr_middle_name || studentMiddleName,
        lastName: derivedLast,
        last_name: derivedLast,
        childLastName: derivedLast,
        child_last_name: derivedLast,
        enr_last_name: formValues.enr_last_name || derivedLast,
        fullName: studentName || `${derivedFirst} ${derivedLast}`.trim(),
        name: studentName || `${derivedFirst} ${derivedLast}`.trim(),
      };

      const saved = saveEnrollmentDraft(
        valuesWithNames,
        step,
        currentDraftId || undefined,
        currentStep,
      );
      setCurrentDraftId(saved.id);
      if (studentName.trim() && studentPhoto) {
        saveStudentPhoto({
          name: studentName.trim(),
          fullName: studentName.trim(),
          photo: studentPhoto,
          photoBase64: studentPhoto,
          photoUri: studentPhoto,
        });
      }
      showToast('Draft saved. It will appear with a Draft tag in the Student Roster.', 'success');
    } catch {
      showToast('Could not save draft on this device', 'error');
    }
  };

  // Validates all required fields across all sections strictly when trying to finish enrollment
  const validateFormForSubmission = (): {
    valid: boolean;
    errors: Array<{ fieldId?: string; label: string; section: string; error: string }>;
  } => {
    const errors: Array<{ fieldId?: string; label: string; section: string; error: string }> = [];

    // 1. Dynamic field validation based on active schema fields
    for (const f of formFields) {
      if (f.visible === false) continue;
      const sectionName = (f.section || 'General').trim();
      const val = formValues[f.id];
      const isMissing =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0);

      if (f.required && isMissing) {
        errors.push({
          fieldId: f.id,
          label: f.label || f.id,
          section: sectionName,
          error: `${f.label || f.id} is required`,
        });
        continue;
      }

      if (val && typeof val === 'string') {
        const strVal = val.trim();
        const normType = (f.type || '').toLowerCase();
        const normLabel = (f.label || '').toLowerCase();
        const normId = (f.id || '').toLowerCase();

        // Phone validation
        if (normType === 'phone' || normId === 'f5' || normLabel.includes('phone')) {
          if (!PHONE_RE.test(strVal)) {
            errors.push({
              fieldId: f.id,
              label: f.label,
              section: sectionName,
              error: 'Invalid phone (7-20 digits, spaces, ()/+ -)',
            });
          }
        }

        // Email validation
        if (normType === 'email' || normId === 'f6' || normLabel.includes('email')) {
          if (!EMAIL_RE.test(strVal)) {
            errors.push({
              fieldId: f.id,
              label: f.label,
              section: sectionName,
              error: 'Invalid email address',
            });
          }
        }

        // Student Date of Birth age validation (3 to 19 years old)
        if (
          normType === 'date' &&
          (normId === 'f2' || normLabel.includes('birth') || normLabel.includes('dob'))
        ) {
          const studentAge = calculateAge(strVal);
          if (studentAge === null || studentAge < 3 || studentAge > 19) {
            errors.push({
              fieldId: f.id,
              label: f.label,
              section: sectionName,
              error: `Student age (${studentAge ?? 'unknown'} yrs) must be between 3 and 19 years old for enrollment`,
            });
          }
        }
      }

      // Therapist field capacity check removed
    }

    // 2. Validate Assign Therapist step if included
    if (includeTherapistStep) {
      if (!assignedTherapist) {
        errors.push({
          label: 'Primary Therapist',
          section: 'Assign Therapist',
          error: 'Please assign a primary therapist',
        });
      }
    }

    // 3. Program Placement therapy group age warning check
    if (studentDob && studentTherapyGroup) {
      const studentAge = calculateAge(studentDob);
      const ageWarning = getTherapyGroupAgeWarning(studentTherapyGroup, studentAge);
      if (ageWarning) {
        errors.push({
          label: 'Therapy Group',
          section: 'Program Placement',
          error: ageWarning,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // Clean Submission Payload: Keys dynamic form values by their schema id
  const submitEnrollment = async () => {
    if (saving) return;
    setSaving(true);

    if (studentDob) {
      const studentAge = calculateAge(studentDob);
      if (studentAge === null || studentAge < 3 || studentAge > 19) {
        showToast(
          `Student must be between 3 and 19 years old for enrollment (current age: ${studentAge ?? 'unknown'} yrs)`,
          'error',
        );
        setSaving(false);
        return;
      }
      const ageWarning = getTherapyGroupAgeWarning(studentTherapyGroup, studentAge);
      if (ageWarning) {
        showToast(ageWarning, 'error');
        setSaving(false);
        return;
      }
    }

    const derivedFirst =
      studentFirstName ||
      formValues.childFirstName ||
      formValues.child_first_name ||
      formValues.firstName ||
      formValues.first_name ||
      formValues.enr_first_name ||
      (studentName || 'Student').trim().split(/\s+/)[0];

    const derivedLast =
      studentLastName ||
      formValues.childLastName ||
      formValues.child_last_name ||
      formValues.lastName ||
      formValues.last_name ||
      formValues.enr_last_name ||
      (studentName || 'Student').trim().split(/\s+/).slice(1).join(' ') ||
      '-';

    const parentName =
      getFieldVal('f4') ||
      getFieldVal('enr_guardian_name') ||
      getFieldVal(/parent.*name|guardian/i) ||
      'Guardian';
    const parentPhone =
      getFieldVal('f5') || getFieldVal('enr_guardian_phone') || getFieldVal(/phone/i) || '555-0100';
    const parentEmail =
      getFieldVal('f6') || getFieldVal('enr_guardian_email') || getFieldVal(/email/i) || '';
    const diagnosis =
      getFieldVal('f_diagnosis') ||
      getFieldVal('enr_diagnosis') ||
      getFieldVal(/diagnosis/i) ||
      'Autism Spectrum Disorder';
    const medicalNotes =
      getFieldVal('f7') ||
      getFieldVal('enr_medical_restrictions') ||
      getFieldVal(/medical.*notes/i) ||
      '';
    const emergencyContact =
      getFieldVal('f9') || getFieldVal('enr_emergency_contact') || getFieldVal(/emergency/i) || '';
    const transportation = getFieldVal('f8') || getFieldVal(/transportation/i) || 'No';

    // Collect dynamic form values keyed strictly by their schema ID
    const dynamicValuesById: Record<string, any> = {};
    formFields.forEach((f) => {
      if (formValues[f.id] !== undefined) {
        dynamicValuesById[f.id] = formValues[f.id];
      }
    });
    Object.keys(formValues).forEach((key) => {
      dynamicValuesById[key] = formValues[key];
    });

    const payload = {
      ...dynamicValuesById,
      customFields: dynamicValuesById,
      custom_fields: dynamicValuesById,
      firstName: derivedFirst,
      first_name: derivedFirst,
      childFirstName: derivedFirst,
      child_first_name: derivedFirst,
      enr_first_name: derivedFirst,
      middleName: studentMiddleName,
      middle_name: studentMiddleName,
      childMiddleName: studentMiddleName,
      enr_middle_name: studentMiddleName,
      lastName: derivedLast,
      last_name: derivedLast,
      childLastName: derivedLast,
      child_last_name: derivedLast,
      enr_last_name: derivedLast,
      fullName: studentName || `${derivedFirst} ${derivedLast}`.trim(),
      name: studentName || `${derivedFirst} ${derivedLast}`.trim(),
      dateOfBirth: studentDob,
      date_of_birth: studentDob,
      programType: studentProgram,
      program_type: studentProgram.toLowerCase().includes('pull') ? 'pulled_out' : 'regular',
      therapyGroup: studentTherapyGroup,
      therapy_group: studentTherapyGroup.toLowerCase().includes('function')
        ? 'functional_living'
        : 'basic',
      [DEMOGRAPHIC_KEY]: getStudentDemographic(formValues),
      parentName: parentName.trim(),
      guardian_name: parentName.trim(),
      parentPhone: parentPhone.trim(),
      guardian_phone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      guardian_email: parentEmail.trim(),
      diagnosis: diagnosis.trim(),
      medicalNotes: medicalNotes.trim(),
      emergencyContact,
      emergency_contact: emergencyContact,
      transportation,
      transportation_required: transportation,
      assignedTherapist,
      status: 'in_assessment',
      enrollment_status: 'in_assessment',
      is_active: true,
      active: true,
      photo: studentPhoto || formValues.headshot || formValues.enr_headshot,
      photoBase64: studentPhoto || formValues.headshot || formValues.enr_headshot,
      photoUrl: studentPhoto || formValues.headshot || formValues.enr_headshot,
      headshot: studentPhoto || formValues.headshot || formValues.enr_headshot,
      birth_certificate:
        formValues.birth_certificate ||
        formValues.enr_birth_certificate ||
        formValues.birthCertificate,
      birthCertificate:
        formValues.birth_certificate ||
        formValues.enr_birth_certificate ||
        formValues.birthCertificate,
      diagnosis_paper:
        formValues.diagnosis_paper || formValues.enr_diagnosis_paper || formValues.diagnosisPaper,
      diagnosisPaper:
        formValues.diagnosis_paper || formValues.enr_diagnosis_paper || formValues.diagnosisPaper,
      agreement: formValues.agreement || formValues.enr_agreement,
      baseline_video:
        formValues.baseline_video ||
        formValues.enr_baseline_video ||
        formValues.baselineVideo ||
        formValues.videoUrl,
      baselineVideo:
        formValues.baseline_video ||
        formValues.enr_baseline_video ||
        formValues.baselineVideo ||
        formValues.videoUrl,
    };

    try {
      const res = await createStudentEnrollment(payload);
      const createdData = res?.data;
      const createdId = createdData?.id || createdData?.studentId;

      markStudentActive(createdId, studentName.trim());
      registerStudentStatuses([
        {
          id: createdId,
          name: studentName.trim(),
          fullName: studentName.trim(),
          status: 'in_assessment',
          rawStatus: 'in_assessment',
        },
      ]);

      if (createdId) {
        try {
          await updateStudentProfile(createdId, {
            status: 'in_assessment',
            enrollment_status: 'in_assessment',
            is_active: true,
            active: true,
          });
        } catch {}
      }

      saveStudentPhoto({
        id: createdData?.id,
        name: studentName.trim(),
        fullName: studentName.trim(),
        photo:
          createdData?.headshotUrl || createdData?.photoUrl || createdData?.photo || studentPhoto,
        photoBase64: studentPhoto,
        photoUri: studentPhoto,
      });

      if (currentDraftId) {
        deleteEnrollmentDraft(currentDraftId);
      }

      showToast(`${studentName} enrolled in ${studentProgram}`, 'success');
      navigation?.navigate?.('StudentEnrollment' as never);
    } catch (err: any) {
      markStudentActive(undefined, studentName.trim());
      saveStudentPhoto({
        name: studentName.trim(),
        fullName: studentName.trim(),
        photo: studentPhoto,
        photoBase64: studentPhoto,
        photoUri: studentPhoto,
      });
      const errorMsg =
        (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(', ') : null) ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not save the enrollment. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    // Validate only when trying to finish enrollment
    const { valid, errors } = validateFormForSubmission();
    if (!valid) {
      setSubmissionErrors(errors);
      const firstError = errors[0];
      showToast(`Cannot finish enrollment: ${firstError.error} (${firstError.section})`, 'error');
      return;
    }

    setSubmissionErrors([]);

    const normalized = studentName.trim().toLowerCase();
    const dup = existingStudents.find((s) => s.name.toLowerCase() === normalized);
    if (dup && !duplicateConfirmed.current) {
      duplicateConfirmed.current = true;
      showToast('Name already exists — press Finish Enrollment again to confirm', 'error');
      return;
    }
    submitEnrollment();
  };

  // Format display values for Review step
  const getDisplayValueForField = (f: any) => {
    const val = formValues[f.id];
    if (val === undefined || val === null || val === '') return '—';

    const normType = (f.type || '').toLowerCase();
    if (
      normType === 'file' ||
      normType === 'image' ||
      normType === 'file_upload' ||
      normType === 'image_picker'
    ) {
      return val ? 'Photo / Document Attached' : 'None';
    }
    if (normType === 'date') {
      const age = calculateAge(val);
      const isDob = f.id === 'f2' || /birth|dob/i.test(f.label);
      return isDob && age !== null ? `${val} (${age} years old)` : String(val);
    }
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : '—';
    }
    return String(val);
  };

  // Pure dynamic field renderer based strictly on schema field definitions
  const renderDynamicField = (field: any) => {
    const isRequired = Boolean(field.required);
    const normType = (field.type || 'text').toLowerCase().replace(/[- ]/g, '_');
    const value = formValues[field.id] ?? '';
    const options = resolveFieldOptions(field);

    // 1. File / Image / Document Upload
    if (
      normType === 'file' ||
      normType === 'image' ||
      normType === 'file_upload' ||
      normType === 'image_picker'
    ) {
      const isPhoto =
        (field.id === 'f_photo' ||
          field.id === 'enr_headshot' ||
          /headshot/i.test(field.id) ||
          /headshot/i.test(field.label) ||
          /student.*photo/i.test(field.label)) &&
        !/certificate|paper|agreement|document/i.test(field.id) &&
        !/certificate|paper|agreement|document/i.test(field.label);
      const isVideo = /video/i.test(field.id) || /video/i.test(field.label);

      // If Video and already attached
      if (isVideo && value) {
        const vidUrl = typeof value === 'string' ? value : value?.url || value?.fileUrl || '';
        return (
          <View key={field.id} style={{ marginVertical: 6 }}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {isRequired && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <VideoPlayerView
              videoUrl={vidUrl}
              title={field.label || 'Baseline Behavioral Video'}
              subtitle={field.description || 'Intake assessment behavioral session sample'}
              onUploadPress={() => handleUploadDocument(field.id)}
              onRemovePress={() => handleRemovePhoto(field.id)}
            />
          </View>
        );
      }

      // If Document and already attached
      if (!isPhoto && !isVideo && value) {
        const docMeta = extractDocumentMeta(value, field.label || 'Document');
        return (
          <View key={field.id} style={{ marginVertical: 6 }}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {isRequired && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            {docMeta ? (
              <DocumentAttachmentCard
                label={field.label}
                fileUrl={docMeta.url}
                fileName={docMeta.fileName}
                fileSize={docMeta.fileSize}
                uploadDate={docMeta.uploadDate}
                fileType={docMeta.fileType}
                editable={true}
                onReplace={() => handleUploadDocument(field.id)}
                onRemove={() => handleRemovePhoto(field.id)}
              />
            ) : null}
          </View>
        );
      }

      return (
        <View key={field.id} style={styles.photoUploadCard}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <View style={styles.photoRow}>
            <View style={styles.photoAvatarContainer}>
              {value ? (
                <View style={styles.photoWrapper}>
                  {isPhoto &&
                  typeof value === 'string' &&
                  (value.startsWith('data:image') ||
                    value.startsWith('http') ||
                    value.startsWith('file:') ||
                    value.startsWith('blob:')) ? (
                    <TouchableOpacity
                      onPress={() =>
                        setPreviewModal({
                          isOpen: true,
                          fileUrl: value,
                          fileName: `${studentName || 'student'}_photo.jpg`,
                          fileType: 'image',
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Preview Photo"
                    >
                      <Image source={{ uri: value }} style={styles.photoImage} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.photoPlaceholder, { backgroundColor: '#E0F2FE' }]}>
                      <Feather name={isVideo ? 'video' : 'file-text'} size={28} color="#0284C7" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemovePhoto(field.id)}
                    accessibilityLabel="Remove file"
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  {isPhoto ? (
                    <StudentAvatar name={studentName} size={48} />
                  ) : (
                    <Feather name={isVideo ? 'video' : 'file-text'} size={28} color="#94A3B8" />
                  )}
                </View>
              )}
            </View>

            <View style={styles.photoButtonContainer}>
              {isPhoto ? (
                <>
                  <TouchableOpacity
                    style={styles.cameraBtn}
                    onPress={() => handleTakePhoto(field.id)}
                  >
                    <Feather name="camera" size={15} color="#FFFFFF" />
                    <Text style={styles.cameraBtnText}>Open Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleChoosePhoto(field.id)}
                  >
                    <Feather name="upload" size={15} color={colors.navyText} />
                    <Text style={styles.uploadBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.uploadBtn, { backgroundColor: '#0284C7' }]}
                    onPress={() => handleUploadDocument(field.id)}
                  >
                    <Feather name="upload" size={15} color="#FFFFFF" />
                    <Text style={[styles.uploadBtnText, { color: '#FFFFFF' }]}>
                      {value ? 'Change File' : `Choose ${isVideo ? 'Video' : 'Document'}`}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => handleChoosePhoto(field.id)}
                  >
                    <Feather name="image" size={15} color={colors.navyText} />
                    <Text style={styles.uploadBtnText}>Upload Image</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          <Text style={styles.fieldHint}>
            {field.helpText ||
              field.help_text ||
              (isPhoto
                ? 'Capture using camera or upload a photo from your device.'
                : isVideo
                  ? 'Upload MP4 or MOV baseline video clip.'
                  : 'Upload PDF, document or image scan from your device.')}
          </Text>
        </View>
      );
    }

    // 2. Date Input
    if (normType === 'date') {
      const isDob = field.id === 'f2' || /birth|dob/i.test(field.label);
      const calculatedAge = isDob && value ? calculateAge(value) : null;
      return (
        <View key={field.id} style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {isRequired && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            {calculatedAge !== null ? (
              <View style={styles.ageBadge}>
                <Feather name="calendar" size={12} color="#0284C7" />
                <Text style={styles.ageBadgeText}>
                  Calculated Age: {calculatedAge} {calculatedAge === 1 ? 'year' : 'years'} old
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.dobWrap}>
            <DobPicker
              value={value || ''}
              maximumDate={isDob ? new Date() : undefined}
              onChange={(val) => handleFieldChange(field.id, val)}
            />
          </View>
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 3. Dropdown / Select
    if (normType === 'dropdown' || normType === 'select') {
      const isTherapistField = field.id === 'f_therapist' || /therapist/i.test(field.label);
      const dropdownOpts =
        isTherapistField && therapists.length > 0 ? therapists.map((t) => t.name) : options;

      const isDropdownOpen = activeDropdownFieldId === field.id;

      return (
        <View key={field.id} style={[styles.field, { zIndex: isDropdownOpen ? 9999 : 1 }]}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>

          <TouchableOpacity
            style={[styles.dropdownSelector, isDropdownOpen && styles.dropdownSelectorOpen]}
            onPress={() => setActiveDropdownFieldId(isDropdownOpen ? null : field.id)}
            accessibilityRole="combobox"
          >
            <Text style={[styles.dropdownSelectedText, !value && styles.dropdownPlaceholderText]}>
              {value || field.placeholder || 'Select an option...'}
            </Text>
            <Feather
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>

          {isDropdownOpen && (
            <Modal
              transparent
              animationType="fade"
              visible={isDropdownOpen}
              onRequestClose={() => setActiveDropdownFieldId(null)}
            >
              <TouchableOpacity
                style={styles.dropdownModalBackdrop}
                activeOpacity={1}
                onPress={() => setActiveDropdownFieldId(null)}
              >
                <View style={styles.dropdownModalCard}>
                  <View style={styles.dropdownModalHeader}>
                    <Text style={styles.dropdownModalTitle}>{field.label}</Text>
                    <TouchableOpacity
                      onPress={() => setActiveDropdownFieldId(null)}
                      style={styles.dropdownModalCloseBtn}
                    >
                      <Feather name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.dropdownModalList}>
                    {dropdownOpts.map((opt) => {
                      const count = isTherapistField ? caseloadOf(opt) : 0;
                      const selected = value === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownOptionItem,
                            selected && styles.dropdownOptionItemSelected,
                          ]}
                          onPress={() => {
                            handleFieldChange(field.id, opt);
                            setActiveDropdownFieldId(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              selected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}{' '}
                            {isTherapistField
                              ? `(${count} ${count === 1 ? 'student' : 'students'} assigned)`
                              : ''}
                          </Text>
                          {selected && <Feather name="check" size={16} color="#0284C7" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 4. Radio Group
    if (normType === 'radio') {
      const isTherapyField = field.id === 'f_therapy' || /therapy/i.test(field.label);
      const calculatedAge = studentDob ? calculateAge(studentDob) : null;
      const ageWarning =
        isTherapyField && value ? getTherapyGroupAgeWarning(value, calculatedAge) : null;

      return (
        <View key={field.id} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <Chips
            options={options}
            value={value}
            onChange={(val) => handleFieldChange(field.id, val)}
          />
          {ageWarning ? (
            <View style={styles.ageWarningBox}>
              <Feather name="info" size={13} color="#D97706" />
              <Text style={styles.ageWarningText}>{ageWarning}</Text>
            </View>
          ) : null}
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 5. TextArea
    if (normType === 'textarea') {
      return (
        <View key={field.id} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={value}
            onChangeText={(val) => handleFieldChange(field.id, val)}
            placeholder={field.placeholder || 'Type here...'}
            placeholderTextColor={colors.mutedText}
            multiline
            textAlignVertical="top"
          />
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 6. Checkbox Group
    if (normType === 'checkbox' || normType === 'checkbox_group') {
      const selectedValues: string[] = Array.isArray(value) ? value : [];
      const toggle = (opt: string) => {
        const next = selectedValues.includes(opt)
          ? selectedValues.filter((v) => v !== opt)
          : [...selectedValues, opt];
        handleFieldChange(field.id, next);
      };

      return (
        <View key={field.id} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <View style={styles.chipRow}>
            {options.map((opt) => {
              const checked = selectedValues.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, checked && styles.chipSelected]}
                  onPress={() => toggle(opt)}
                >
                  <Text style={[styles.chipText, checked && styles.chipTextSelected]}>
                    {checked ? '✓ ' : ''}
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 7. Switch (Boolean)
    if (normType === 'switch') {
      const boolVal = Boolean(value);
      return (
        <View key={field.id} style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {isRequired && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <Switch
              value={boolVal}
              onValueChange={(val) => handleFieldChange(field.id, val)}
              trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
            />
          </View>
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 8. Phone
    if (normType === 'phone') {
      return (
        <View key={field.id} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <TextInput
            style={[styles.textInput, styles.textInputMax]}
            value={value}
            onChangeText={(val) => handleFieldChange(field.id, val)}
            keyboardType="phone-pad"
            placeholder={field.placeholder || '(555) 000-0000'}
            placeholderTextColor={colors.mutedText}
          />
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 9. Number
    if (normType === 'number') {
      return (
        <View key={field.id} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {field.label}
            {isRequired && <Text style={styles.requiredStar}> *</Text>}
          </Text>
          <TextInput
            style={[styles.textInput, styles.textInputMax]}
            value={String(value)}
            onChangeText={(val) => handleFieldChange(field.id, val.replace(/[^0-9.-]/g, ''))}
            keyboardType="numeric"
            placeholder={field.placeholder || '0'}
            placeholderTextColor={colors.mutedText}
          />
          {Boolean(field.helpText || field.help_text) && (
            <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
          )}
        </View>
      );
    }

    // 10. Default: Text input
    const isEmail = /email/i.test(field.label);
    return (
      <View key={field.id} style={styles.field}>
        <Text style={styles.fieldLabel}>
          {field.label}
          {isRequired && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(val) => handleFieldChange(field.id, val)}
          keyboardType={isEmail ? 'email-address' : 'default'}
          placeholder={field.placeholder || 'Type here...'}
          placeholderTextColor={colors.mutedText}
        />
        {Boolean(field.helpText || field.help_text) && (
          <Text style={styles.fieldHint}>{field.helpText || field.help_text}</Text>
        )}
      </View>
    );
  };

  const currentStepFields = formFields.filter(
    (f: any) =>
      f.visible !== false &&
      (f.section || 'General').toLowerCase().trim() === currentStep.toLowerCase().trim(),
  );

  if (loadingForm) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Enrollment Wizard"
          onTabPress={(t) => {
            const r = PD_ROUTE_BY_TAB[t];
            if (r && r !== 'StudentEnrollmentWizard') {
              navigation?.navigate?.(r as never);
            }
          }}
        />

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Enrollment Wizard</Text>
          <Text style={styles.headerSubtitle}>New Child Enrollment</Text>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconWrap}>
              <ActivityIndicator size="large" color="#0284C7" />
            </View>
            <Text style={styles.loadingTitle}>Loading Enrollment Form...</Text>
            <Text style={styles.loadingSubtitle}>
              Preparing active clinical fields, customized sections, and therapist caseloads. Please
              wait...
            </Text>
            <View style={styles.loadingProgressBar}>
              <View style={styles.loadingProgressTrack} />
            </View>
            <View style={styles.loadingBadge}>
              <Feather name="shield" size={14} color="#0369A1" />
              <Text style={styles.loadingBadgeText}>ABA Clinical Workspace Ready</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Enrollment Wizard"
        onTabPress={(t) => {
          const r = PD_ROUTE_BY_TAB[t];
          if (r && r !== 'StudentEnrollmentWizard') {
            navigation?.navigate?.(r as never);
          }
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enrollment Wizard</Text>
        <Text style={styles.headerSubtitle}>ABA Therapy Management — New Child Enrollment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <StepIndicator current={step} steps={steps} onStepPress={(i) => setStep(i)} />

        <View style={styles.card}>
          <View style={styles.cardHeadingRow}>
            <Text style={styles.cardHeading}>
              Step {step + 1}: {currentStep}
            </Text>
          </View>

          {/* Section Step: Dynamically rendered based strictly on retrieved schema fields */}
          {currentStep !== 'Assign Therapist' && currentStep !== 'Review' && (
            <View style={styles.stepBody}>
              {currentStepFields.map((field) => renderDynamicField(field))}

              {currentStepFields.length === 0 && (
                <View style={styles.emptyCustomStepBox}>
                  <Feather name="info" size={16} color="#64748B" />
                  <Text style={styles.emptyCustomStepText}>
                    No fields configured for "{currentStep}" yet. You can add and customize fields
                    for this section in the Form Builder.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Assign Therapist Step */}
          {currentStep === 'Assign Therapist' && (
            <View style={styles.stepBody}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  Assigned Primary Therapist <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.fieldHint}>
                  Select an assigned primary therapist for this student.
                </Text>
                {therapists.length > 0 ? (
                  <View style={styles.chipRow}>
                    {therapists.map((t) => {
                      const count =
                        (t as any).assignedStudentCount ?? t.assignedStudents?.length ?? 0;
                      const selected = assignedTherapist === t.name;
                      return (
                        <TouchableOpacity
                          key={t.name}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => {
                            const therapistField = formFields.find(
                              (f) => f.id === 'f_therapist' || /therapist/i.test(f.label),
                            );
                            if (therapistField) {
                              handleFieldChange(therapistField.id, t.name);
                            }
                            handleFieldChange('therapist', t.name);
                          }}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {t.name}
                            {` (${count} ${count === 1 ? 'student' : 'students'} assigned)`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.fieldHint}>No therapists available.</Text>
                )}
              </View>

              {/* Any additional schema fields configured in the 'Assign Therapist' section */}
              {currentStepFields
                .filter((f) => f.id !== 'f_therapist' && !/therapist/i.test(f.label))
                .map((field) => renderDynamicField(field))}
            </View>
          )}

          {/* Review Step: Dynamically loops through sections & fields from active schema */}
          {currentStep === 'Review' && (
            <View style={styles.stepBody}>
              <Text style={styles.reviewIntro}>
                Please review the enrollment details before confirming.
              </Text>

              {submissionErrors.length > 0 && (
                <View style={styles.validationErrorCard}>
                  <View style={styles.validationErrorHeader}>
                    <Feather name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.validationErrorTitle}>
                      Please complete all required fields before finishing (
                      {submissionErrors.length}):
                    </Text>
                  </View>
                  {submissionErrors.map((err, idx) => (
                    <View key={idx} style={styles.validationErrorItem}>
                      <Text style={styles.validationErrorBullet}>•</Text>
                      <Text style={styles.validationErrorText}>
                        <Text style={{ fontWeight: '700' }}>{err.section}:</Text> {err.error}
                      </Text>
                      <TouchableOpacity
                        style={styles.jumpStepBtn}
                        onPress={() => {
                          const stepIdx = steps.findIndex(
                            (s) => s.toLowerCase().trim() === err.section.toLowerCase().trim(),
                          );
                          if (stepIdx !== -1) setStep(stepIdx);
                        }}
                      >
                        <Text style={styles.jumpStepBtnText}>Go to step</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.reviewCard}>
                {studentPhoto ? (
                  <View style={styles.reviewPhotoHeader}>
                    <Image source={{ uri: studentPhoto }} style={styles.reviewPhotoImage} />
                    <View style={styles.reviewPhotoInfo}>
                      <Text style={styles.reviewStudentName}>{studentName || 'New Student'}</Text>
                      <Text style={styles.reviewStudentProgram}>{studentProgram} Program</Text>
                    </View>
                  </View>
                ) : null}

                {activeSections.map((sec) => {
                  const secFields = formFields.filter(
                    (f) =>
                      (f.section || 'General').toLowerCase().trim() === sec.toLowerCase().trim() &&
                      f.visible !== false,
                  );
                  if (secFields.length === 0) return null;
                  return (
                    <ReviewSection key={sec} title={sec}>
                      {secFields.map((f) => (
                        <ReviewRow
                          key={f.id || f.label}
                          label={f.label || f.id}
                          value={getDisplayValueForField(f)}
                        />
                      ))}
                    </ReviewSection>
                  );
                })}

                {includeTherapistStep && (
                  <ReviewSection title="Assign Therapist">
                    <ReviewRow
                      label="Assigned Primary Therapist"
                      value={assignedTherapist || '—'}
                    />
                  </ReviewSection>
                )}
              </View>
            </View>
          )}

          {/* Wizard Action Buttons */}
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
                <Text style={styles.nextBtnText}>
                  {saving ? 'Submitting…' : 'Finish Enrollment'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ABA Therapy Management System — SCR-009 Enrollment Wizard
        </Text>
      </View>

      <CameraCaptureModal
        visible={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={(uri, b64) => {
          const photoData = b64 || uri;
          if (activePhotoFieldId) {
            handleFieldChange(activePhotoFieldId, photoData);
          }
          if (studentName.trim()) {
            saveStudentPhoto({
              name: studentName.trim(),
              fullName: studentName.trim(),
              photo: photoData,
              photoBase64: photoData,
              photoUri: uri,
            });
          }
          showToast('Student photo captured successfully', 'success');
        }}
      />

      {/* Document / Media Preview Modal */}
      <MediaViewerModal
        visible={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileUrl: '', fileName: '' })}
        mediaUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        mediaType={previewModal.fileType}
        title={previewModal.fileName}
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 2,
  },
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
  stepLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: C_SKY },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  stepLabelCurrent: { color: '#1F2937', fontWeight: '700' },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...makeShadow(1, 6, 0.06, '0, 0, 0', 1),
  },
  cardHeadingRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
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
    minHeight: 44,
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
    minHeight: 44,
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
    minHeight: 44,
  },
  textInputMax: { maxWidth: 320 },
  textArea: { minHeight: 100, textAlignVertical: 'top', alignSelf: 'stretch' },

  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  dropdownSelectorOpen: {
    borderColor: C_SKY,
    borderWidth: 1.5,
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    color: colors.mutedText,
  },
  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdownModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...makeShadow(2, 8, 0.15, '0, 0, 0', 2),
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownModalCloseBtn: {
    padding: 4,
  },
  dropdownModalList: {
    paddingVertical: 4,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  dropdownOptionItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  dropdownOptionItemDisabled: {
    opacity: 0.45,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  dropdownOptionTextDisabled: {
    color: '#94A3B8',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    minHeight: 44,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: C_INPUT_BORDER,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    minHeight: 44,
    justifyContent: 'center',
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
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
    textAlign: 'right',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  backBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    minHeight: 44,
  },
  backBtnText: { fontWeight: '600', color: colors.navyText },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 12,
    color: colors.navyText,
    textAlign: 'center',
  },
  nextBtn: {
    flex: 1.6,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: C_YELLOW,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    ...makeShadow(1, 3, 0.1, '0, 0, 0', 1),
  },
  nextBtnText: { fontWeight: '700', color: '#1F2937' },

  validationErrorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  validationErrorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  validationErrorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  validationErrorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 3,
  },
  validationErrorBullet: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  validationErrorText: {
    fontSize: 12,
    color: '#7F1D1D',
    flex: 1,
  },
  jumpStepBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  jumpStepBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 380,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xxl,
    alignItems: 'center',
    maxWidth: 440,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...makeShadow(2, 8, 0.08, '0, 0, 0', 3),
  },
  loadingIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  loadingProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  loadingProgressTrack: {
    width: '65%',
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  loadingBadgeText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },

  footer: {
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: { color: '#64748B', fontSize: 11, textAlign: 'center' },
});

import {
  THERAPIST_ASSIGNMENTS_STORAGE_KEY,
  getTherapistAssignedStudents,
  assignStudentToTherapist,
} from '../../utils/therapistAssignmentHelper';

export {
  THERAPIST_ASSIGNMENTS_STORAGE_KEY,
  getTherapistAssignedStudents,
  assignStudentToTherapist,
};

export function resolveEnrichedTherapists(teachers: any[]): any[] {
  const store =
    storage.getJSONSync<Record<string, string[]>>(THERAPIST_ASSIGNMENTS_STORAGE_KEY, {}) || {};
  const enrolledCache =
    storage.getJSONSync<Record<string, unknown>[]>('melue_enrolled_students_cache', []) || [];
  let directorStore: Record<string, { studentIds?: unknown[] }> = {};
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('melue_director_assignments_store_v1');
      if (raw) directorStore = JSON.parse(raw);
    }
  } catch {}

  return (teachers || []).map((t) => {
    const assigned = new Set<string>();
    if (Array.isArray(t.assignedStudents)) {
      t.assignedStudents.forEach((s: any) =>
        assigned.add(typeof s === 'string' ? s : s?.name || s?.id),
      );
    }
    const nameKey = (t.name || '').trim().toLowerCase();
    const idKey = (t.id || '').trim().toLowerCase();
    for (const [key, students] of Object.entries(store)) {
      const normKey = key.trim().toLowerCase();
      if ((normKey === nameKey || normKey === idKey) && Array.isArray(students)) {
        students.forEach((s) => assigned.add(s));
      }
    }
    enrolledCache.forEach((es: any) => {
      const th = String(es.therapist || es.assignedTherapist || '')
        .trim()
        .toLowerCase();
      if (th && (th === nameKey || th === idKey)) {
        assigned.add(String(es.fullName || es.name || es.id));
      }
    });
    for (const [key, dData] of Object.entries(directorStore)) {
      const normKey = key.trim().toLowerCase();
      if ((normKey === nameKey || normKey === idKey) && Array.isArray(dData?.studentIds)) {
        dData.studentIds.forEach((sid) => assigned.add(String(sid)));
      }
    }
    const studentList = Array.from(assigned).filter(Boolean);
    return {
      ...t,
      assignedStudents: studentList,
      assignedStudentCount: studentList.length,
    };
  });
}

export const ENROLLMENT_DRAFT_KEY = 'melue_enrollment_wizard_draft_v1';
