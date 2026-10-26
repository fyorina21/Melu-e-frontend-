import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Modal,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing, makeShadow } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import StudentAvatar from '../../components/StudentAvatar';
import DocumentAttachmentCard, {
  extractDocumentMeta,
} from '../../components/DocumentAttachmentCard';
import VideoPlayerView from '../../components/VideoPlayerView';
import MediaViewerModal from '../../components/MediaViewerModal';
import DobPicker from '../../components/DobPicker';
import { useToast } from '../../context/ToastContext';
import {
  getStudentProfile,
  updateStudentProfile,
  getProgramOptions,
  getTherapyGroupOptions,
  getStatusOptions,
} from '../../api/coordinatorApi';
import { getStaffOptions, type StaffOption } from '../../api/optionsApi';
import { getFormConfig, DEFAULT_ENROLLMENT_FORM } from '../../api/institutionalAdminApi';
import { resolveFieldOptions } from '../../components/DynamicFormFields';
import { getEnrollmentDraft, saveEnrollmentDraft } from '../../utils/enrollmentDraftHelper';
import { saveStudentPhoto } from '../../utils/studentPhotoHelper';
import {
  DEMOGRAPHIC_KEY,
  F_DEMOGRAPHIC_KEY,
  ENR_DEMOGRAPHIC_KEY,
  getStudentDemographic,
} from '../../utils/sensitiveDataSanitizer';
import {
  calculateAge,
  getTherapyGroupAgeWarning,
  PHONE_RE,
  EMAIL_RE,
} from './enrollmentWizardTypes';

const C_SKY = '#0284C7';
const C_NAVY = '#0F172A';
const C_SLATE = '#64748B';
const C_BORDER = '#E2E8F0';
const C_BG_CARD = '#FFFFFF';
const C_EMERALD = '#10B981';
const C_AMBER = '#F59E0B';
const C_RED = '#DC2626';

type Props = NativeStackScreenProps<any, 'StudentEditProfile'>;

export default function StudentEditProfileScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const studentId = route.params?.studentId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('All');

  // Dynamic schema config state
  const [formFields, setFormFields] = useState<any[]>(DEFAULT_ENROLLMENT_FORM.fields || []);
  const [customSections, setCustomSections] = useState<string[]>(
    DEFAULT_ENROLLMENT_FORM.customSections || [],
  );
  const [deletedSections, setDeletedSections] = useState<string[]>([]);

  // Consolidated form values (Single source of truth)
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [removals, setRemovals] = useState<Record<string, boolean>>({});

  // Dynamic option collections
  const [therapists, setTherapists] = useState<StaffOption[]>([]);
  const [programOptions, setProgramOptions] = useState<string[]>([
    'Regular Morning',
    'Regular Afternoon',
    'Pulled Out',
  ]);
  const [therapyOptions, setTherapyOptions] = useState<string[]>(['Basic', 'Functional Living']);
  const [statusOptions, setStatusOptions] = useState<string[]>([
    'Active',
    'In assessment',
    'Inactive',
    'Archived',
    'Draft',
  ]);

  // Dropdown modal state
  const [activeDropdownFieldId, setActiveDropdownFieldId] = useState<string | null>(null);

  // Lightbox / Document preview modal state
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType?: 'image' | 'video' | 'pdf' | 'document';
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  // 1. Fetch active enrollment schema from FormBuilder (Single Source of Truth)
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

  // 2. Fetch system options
  useEffect(() => {
    loadFormConfig();
    getProgramOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setProgramOptions(opts.data))
      .catch(() => {});
    getTherapyGroupOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setTherapyOptions(opts.data))
      .catch(() => {});
    getStatusOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setStatusOptions(opts.data))
      .catch(() => {});
    getStaffOptions()
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const teachers = data.filter((s) => s.role === 'teacher' || s.role === 'therapist');
          setTherapists(teachers.length > 0 ? teachers : data);
        }
      })
      .catch(() => {});
  }, [loadFormConfig]);

  // 3. Pre-populate existing student values
  const loadData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const draft = getEnrollmentDraft(studentId);
      if (draft) {
        const draftValues = {
          ...(draft.formValues || {}),
          f1: draft.name || draft.fullName || '',
          f2:
            draft.formValues?.enr_dob ||
            draft.formValues?.f2 ||
            (draft as any).dateOfBirth ||
            (draft as any).dob ||
            '',
          [F_DEMOGRAPHIC_KEY]: getStudentDemographic(draft as any, 'Male'),
          f_program: draft.program || 'Regular Morning',
          f_therapy: draft.therapyGroup || 'Basic',
          f_therapist: draft.therapist || '',
          status: draft.status || 'Draft',
          f4: draft.guardianName || draft.formValues?.f4 || '',
          f5: draft.guardianPhone || draft.formValues?.f5 || '',
          f6: draft.guardianEmail || draft.formValues?.f6 || '',
          f_diagnosis: draft.diagnosis || draft.formValues?.f_diagnosis || '',
          headshot: draft.photo || draft.photoUrl || draft.formValues?.enr_headshot || null,
          photoUrl: draft.photo || draft.photoUrl || draft.formValues?.enr_headshot || null,
          enr_headshot: draft.photo || draft.photoUrl || draft.formValues?.enr_headshot || null,
        };
        setFormValues(draftValues);
        setLoading(false);
        return;
      }

      const { data } = await getStudentProfile(studentId);
      if (data) {
        const customObj = {
          ...(data.customFields || {}),
          ...(data.custom_fields || {}),
          ...(data.formValues || {}),
        };

        const first =
          data.firstName ||
          data.first_name ||
          customObj.enr_first_name ||
          (data.fullName || '').split(' ')[0] ||
          '';
        const last =
          data.lastName ||
          data.last_name ||
          customObj.enr_last_name ||
          (data.fullName || '').split(' ').slice(1).join(' ') ||
          '';
        const middle = data.middleName || data.middle_name || customObj.enr_middle_name || '';
        const dob =
          data.dateOfBirth || data.date_of_birth || customObj.enr_dob || customObj.f2 || '';
        const full = data.fullName || data.name || `${first} ${last}`.trim();

        const initialValues: Record<string, any> = {
          ...customObj,
          id: data.id || studentId,
          studentId: data.studentId || data.student_id || studentId,
          f1: full,
          fullName: full,
          name: full,
          firstName: first,
          first_name: first,
          childFirstName: first,
          enr_first_name: first,
          middleName: middle,
          middle_name: middle,
          childMiddleName: middle,
          enr_middle_name: middle,
          lastName: last,
          last_name: last,
          childLastName: last,
          enr_last_name: last,
          f2: dob,
          dob: dob,
          enr_dob: dob,
          dateOfBirth: dob,
          date_of_birth: dob,
          [DEMOGRAPHIC_KEY]: getStudentDemographic(data, getStudentDemographic(customObj, 'Male')),
          [F_DEMOGRAPHIC_KEY]: getStudentDemographic(
            data,
            getStudentDemographic(customObj, 'Male'),
          ),
          [ENR_DEMOGRAPHIC_KEY]: getStudentDemographic(
            data,
            getStudentDemographic(customObj, 'Male'),
          ),
          programType: data.programType || customObj.enr_program_type || 'Regular Morning',
          f_program: data.programType || customObj.enr_program_type || 'Regular Morning',
          enr_program_type: data.programType || customObj.enr_program_type || 'Regular Morning',
          therapyGroup: data.therapyGroup || customObj.enr_therapy_group || 'Basic',
          f_therapy: data.therapyGroup || customObj.enr_therapy_group || 'Basic',
          enr_therapy_group: data.therapyGroup || customObj.enr_therapy_group || 'Basic',
          status: data.status || 'Active',
          therapist: data.therapist || customObj.f_therapist || '',
          f_therapist: data.therapist || customObj.f_therapist || '',
          guardianName: data.guardianName || customObj.enr_guardian_name || '',
          f4: data.guardianName || customObj.enr_guardian_name || '',
          enr_guardian_name: data.guardianName || customObj.enr_guardian_name || '',
          guardianRelationship:
            data.guardianRelationship || customObj.enr_guardian_relationship || 'Mother',
          enr_guardian_relationship:
            data.guardianRelationship || customObj.enr_guardian_relationship || 'Mother',
          guardianPhone: data.guardianPhone || customObj.enr_guardian_phone || '',
          f5: data.guardianPhone || customObj.enr_guardian_phone || '',
          enr_guardian_phone: data.guardianPhone || customObj.enr_guardian_phone || '',
          guardianEmail: data.guardianEmail || customObj.enr_guardian_email || '',
          f6: data.guardianEmail || customObj.enr_guardian_email || '',
          enr_guardian_email: data.guardianEmail || customObj.enr_guardian_email || '',
          emergencyContact: data.emergencyContact || customObj.enr_emergency_contact || '',
          f9: data.emergencyContact || customObj.enr_emergency_contact || '',
          enr_emergency_contact: data.emergencyContact || customObj.enr_emergency_contact || '',
          householdStructure: data.householdStructure || customObj.enr_household || '',
          enr_household: data.householdStructure || customObj.enr_household || '',
          diagnosis: data.diagnosis || customObj.enr_diagnosis || '',
          f_diagnosis: data.diagnosis || customObj.enr_diagnosis || '',
          enr_diagnosis: data.diagnosis || customObj.enr_diagnosis || '',
          diagnosisDate: data.diagnosisDate || customObj.enr_diagnosis_date || '',
          enr_diagnosis_date: data.diagnosisDate || customObj.enr_diagnosis_date || '',
          medicalNotes: data.medicalNotes || customObj.enr_medical_restrictions || '',
          f7: data.medicalNotes || customObj.enr_medical_restrictions || '',
          enr_medical_restrictions: data.medicalNotes || customObj.enr_medical_restrictions || '',
          developmentalHistory: data.developmentalHistory || customObj.enr_dev_history || '',
          enr_dev_history: data.developmentalHistory || customObj.enr_dev_history || '',
          transportation: data.transportation || customObj.f8 || 'No',
          f8: data.transportation || customObj.f8 || 'No',
          reinforcerVisual: data.reinforcerVisual || customObj.enr_reinforcer_visual || '',
          enr_reinforcer_visual: data.reinforcerVisual || customObj.enr_reinforcer_visual || '',
          reinforcerAuditory: data.reinforcerAuditory || customObj.enr_reinforcer_auditory || '',
          enr_reinforcer_auditory:
            data.reinforcerAuditory || customObj.enr_reinforcer_auditory || '',
          reinforcerTactile: data.reinforcerTactile || customObj.enr_reinforcer_tactile || '',
          enr_reinforcer_tactile: data.reinforcerTactile || customObj.enr_reinforcer_tactile || '',
          reinforcerKinetic: data.reinforcerKinetic || customObj.enr_reinforcer_kinetic || '',
          enr_reinforcer_kinetic: data.reinforcerKinetic || customObj.enr_reinforcer_kinetic || '',

          // Strictly isolated media attachments
          headshot: data.photoUrl || data.headshotUrl || customObj.enr_headshot || null,
          photoUrl: data.photoUrl || data.headshotUrl || customObj.enr_headshot || null,
          enr_headshot: data.photoUrl || data.headshotUrl || customObj.enr_headshot || null,
          birth_certificate:
            data.birthCertificate ||
            data.birth_certificate ||
            customObj.enr_birth_certificate ||
            null,
          birthCertificate:
            data.birthCertificate ||
            data.birth_certificate ||
            customObj.enr_birth_certificate ||
            null,
          enr_birth_certificate:
            data.birthCertificate ||
            data.birth_certificate ||
            customObj.enr_birth_certificate ||
            null,
          diagnosis_paper:
            data.diagnosisPaper || data.diagnosis_paper || customObj.enr_diagnosis_paper || null,
          diagnosisPaper:
            data.diagnosisPaper || data.diagnosis_paper || customObj.enr_diagnosis_paper || null,
          enr_diagnosis_paper:
            data.diagnosisPaper || data.diagnosis_paper || customObj.enr_diagnosis_paper || null,
          agreement: data.agreement || customObj.enr_agreement || null,
          enr_agreement: data.agreement || customObj.enr_agreement || null,
          baseline_video: data.videoUrl || data.video_url || customObj.enr_baseline_video || null,
          videoUrl: data.videoUrl || data.video_url || customObj.enr_baseline_video || null,
          enr_baseline_video:
            data.videoUrl || data.video_url || customObj.enr_baseline_video || null,
        };

        setFormValues(initialValues);
      }
    } catch {
      showToast('Could not load student profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [studentId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper to update field value
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => {
      const next = { ...prev, [fieldId]: value };

      // Keep child names in sync
      const lower = fieldId.toLowerCase();
      if (lower.includes('first_name') || lower === 'f1') {
        if (lower === 'f1') {
          const parts = String(value || '')
            .trim()
            .split(/\s+/);
          next.firstName = parts[0] || '';
          next.first_name = parts[0] || '';
          next.lastName = parts.slice(1).join(' ') || '';
          next.last_name = parts.slice(1).join(' ') || '';
        } else {
          next.firstName = value;
          next.first_name = value;
          next.enr_first_name = value;
        }
      } else if (lower.includes('last_name')) {
        next.lastName = value;
        next.last_name = value;
        next.enr_last_name = value;
      } else if (lower.includes('middle_name')) {
        next.middleName = value;
        next.middle_name = value;
        next.enr_middle_name = value;
      }

      // Keep therapist in sync
      if (lower.includes('therapist')) {
        next.therapist = value;
        next.f_therapist = value;
      }

      return next;
    });
  };

  // Derive active sections dynamically
  const deletedSet = useMemo(
    () => new Set((deletedSections || []).map((s) => s.toLowerCase().trim())),
    [deletedSections],
  );

  const activeSections = useMemo(() => {
    const list: string[] = [];
    // Standard and custom sections defined in configuration
    const configuredSections = [
      'Student Info',
      'Parent Info',
      'Clinical & Medical',
      'Reinforcers & Behavior',
      'Documents & Media',
      ...(customSections || []),
    ];

    configuredSections.forEach((s) => {
      const trimmed = s.trim();
      if (trimmed && !deletedSet.has(trimmed.toLowerCase()) && !list.includes(trimmed)) {
        list.push(trimmed);
      }
    });

    (formFields || []).forEach((f: any) => {
      const s = (f.section || 'General').trim();
      if (
        s &&
        !deletedSet.has(s.toLowerCase()) &&
        !list.some((a) => a.toLowerCase() === s.toLowerCase())
      ) {
        list.push(s);
      }
    });

    return list;
  }, [customSections, deletedSet, formFields]);

  // Group fields by section preserving authoring schema order
  const fieldsBySection = useMemo(() => {
    const map: Record<string, any[]> = {};
    activeSections.forEach((s) => {
      map[s] = [];
    });

    (formFields || []).forEach((f: any) => {
      if (f.visible === false) return;
      const targetSection = (f.section || 'Student Info').trim();

      // Find matching section case-insensitively
      const matched = activeSections.find((s) => s.toLowerCase() === targetSection.toLowerCase());
      if (matched) {
        map[matched].push(f);
      } else if (activeSections.length > 0) {
        map[activeSections[0]].push(f);
      }
    });

    return map;
  }, [activeSections, formFields]);

  // Document upload / replacement handler
  const handlePickDocument = async (fieldId: string, label: string) => {
    try {
      const isVideoField = /video/i.test(fieldId) || /video/i.test(label);
      const isPhotoField =
        /photo|headshot|avatar/i.test(fieldId) || /photo|headshot|avatar/i.test(label);

      if (isPhotoField) {
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
          handleFieldChange('headshot', photoData);
          handleFieldChange('photoUrl', photoData);
          handleFieldChange('enr_headshot', photoData);
          setRemovals((r) => ({ ...r, remove_headshot: false }));
          showToast('Headshot updated successfully', 'success');
        }
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: isVideoField ? ['video/*'] : '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let fileData: any = asset.uri;

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

        const fileMeta = {
          url: fileData,
          fileName: asset.name,
          byteSize: asset.size,
          mimeType: asset.mimeType,
          uploadDate: new Date().toISOString(),
        };

        handleFieldChange(fieldId, fileMeta);

        const lower = `${fieldId} ${label}`.toLowerCase();
        if (lower.includes('birth')) {
          handleFieldChange('birth_certificate', fileMeta);
          handleFieldChange('birthCertificate', fileMeta);
          setRemovals((r) => ({ ...r, remove_birth_certificate: false }));
        } else if (lower.includes('diagnosis')) {
          handleFieldChange('diagnosis_paper', fileMeta);
          handleFieldChange('diagnosisPaper', fileMeta);
          setRemovals((r) => ({ ...r, remove_diagnosis_paper: false }));
        } else if (lower.includes('agreement')) {
          handleFieldChange('agreement', fileMeta);
          setRemovals((r) => ({ ...r, remove_agreement: false }));
        } else if (lower.includes('video')) {
          handleFieldChange('baseline_video', fileData);
          handleFieldChange('videoUrl', fileData);
          setRemovals((r) => ({ ...r, remove_baseline_video: false }));
        }

        showToast(`${asset.name || 'File'} uploaded successfully`, 'success');
      }
    } catch (err: any) {
      showToast('Could not attach file: ' + (err?.message || 'Error occurred'), 'error');
    }
  };

  // Document removal handler
  const handleRemoveDocument = (fieldId: string, label: string) => {
    handleFieldChange(fieldId, null);
    const lower = `${fieldId} ${label}`.toLowerCase();

    if (lower.includes('headshot') || lower.includes('photo')) {
      handleFieldChange('headshot', null);
      handleFieldChange('photoUrl', null);
      handleFieldChange('enr_headshot', null);
      setRemovals((r) => ({ ...r, remove_headshot: true }));
    } else if (lower.includes('birth')) {
      handleFieldChange('birth_certificate', null);
      handleFieldChange('birthCertificate', null);
      setRemovals((r) => ({ ...r, remove_birth_certificate: true }));
    } else if (lower.includes('diagnosis')) {
      handleFieldChange('diagnosis_paper', null);
      handleFieldChange('diagnosisPaper', null);
      setRemovals((r) => ({ ...r, remove_diagnosis_paper: true }));
    } else if (lower.includes('agreement')) {
      handleFieldChange('agreement', null);
      setRemovals((r) => ({ ...r, remove_agreement: true }));
    } else if (lower.includes('video')) {
      handleFieldChange('baseline_video', null);
      handleFieldChange('videoUrl', null);
      setRemovals((r) => ({ ...r, remove_baseline_video: true }));
    }

    showToast(`${label} marked for removal`, 'info');
  };

  // Save changes handler
  const handleSave = async () => {
    const rawFirst =
      formValues.firstName || formValues.first_name || formValues.enr_first_name || '';
    const rawLast = formValues.lastName || formValues.last_name || formValues.enr_last_name || '';

    if (!rawFirst.trim()) {
      showToast('Child First Name is required', 'error');
      return;
    }
    if (!rawLast.trim()) {
      showToast('Child Last Name is required', 'error');
      return;
    }

    const dobVal = formValues.dateOfBirth || formValues.enr_dob || formValues.f2 || '';
    if (dobVal) {
      const age = calculateAge(dobVal);
      if (age === null || age < 3 || age > 19) {
        showToast(
          `Student must be between 3 and 19 years old (current age: ${age ?? 'unknown'} yrs)`,
          'error',
        );
        return;
      }
    }

    setSaving(true);
    const fullName = `${rawFirst.trim()} ${rawLast.trim()}`.trim();
    const computedAge = dobVal ? (calculateAge(dobVal) ?? 0) : 0;

    const payload: Record<string, any> = {
      firstName: rawFirst.trim(),
      first_name: rawFirst.trim(),
      childFirstName: rawFirst.trim(),
      enr_first_name: rawFirst.trim(),
      middleName: (formValues.middleName || formValues.enr_middle_name || '').trim(),
      middle_name: (formValues.middleName || formValues.enr_middle_name || '').trim(),
      lastName: rawLast.trim(),
      last_name: rawLast.trim(),
      childLastName: rawLast.trim(),
      enr_last_name: rawLast.trim(),
      fullName,
      name: fullName,
      dateOfBirth: dobVal,
      date_of_birth: dobVal,
      dob: dobVal,
      enr_dob: dobVal,
      age: computedAge,
      [DEMOGRAPHIC_KEY]: getStudentDemographic(formValues, 'Male'),
      programType: formValues.programType || formValues.enr_program_type || 'Regular Morning',
      therapyGroup: formValues.therapyGroup || formValues.enr_therapy_group || 'Basic',
      status: formValues.status || 'Active',
      therapist: formValues.therapist || formValues.f_therapist || '',
      guardianName: formValues.guardianName || formValues.enr_guardian_name || '',
      guardianRelationship:
        formValues.guardianRelationship || formValues.enr_guardian_relationship || 'Mother',
      guardianPhone: formValues.guardianPhone || formValues.enr_guardian_phone || '',
      guardianEmail: formValues.guardianEmail || formValues.enr_guardian_email || '',
      emergencyContact: formValues.emergencyContact || formValues.enr_emergency_contact || '',
      householdStructure: formValues.householdStructure || formValues.enr_household || '',
      diagnosis: formValues.diagnosis || formValues.enr_diagnosis || 'Autism Spectrum Disorder',
      diagnosisDate: formValues.diagnosisDate || formValues.enr_diagnosis_date || '',
      medicalNotes: formValues.medicalNotes || formValues.enr_medical_restrictions || '',
      developmentalHistory: formValues.developmentalHistory || formValues.enr_dev_history || '',
      transportation: formValues.transportation || formValues.f8 || 'No',
      reinforcerVisual: formValues.reinforcerVisual || formValues.enr_reinforcer_visual || '',
      reinforcerAuditory: formValues.reinforcerAuditory || formValues.enr_reinforcer_auditory || '',
      reinforcerTactile: formValues.reinforcerTactile || formValues.enr_reinforcer_tactile || '',
      reinforcerKinetic: formValues.reinforcerKinetic || formValues.enr_reinforcer_kinetic || '',

      // Include all dynamic form values in custom_fields
      custom_fields: formValues,
      formValues: formValues,

      // Removals
      ...removals,
    };

    // Attach active media payloads if present
    if (formValues.headshot && !removals.remove_headshot) {
      payload.headshot = formValues.headshot;
    }
    if (formValues.baseline_video && !removals.remove_baseline_video) {
      payload.baseline_video = formValues.baseline_video;
    }
    if (formValues.birth_certificate && !removals.remove_birth_certificate) {
      payload.birth_certificate = formValues.birth_certificate;
    }
    if (formValues.diagnosis_paper && !removals.remove_diagnosis_paper) {
      payload.diagnosis_paper = formValues.diagnosis_paper;
    }
    if (formValues.agreement && !removals.remove_agreement) {
      payload.agreement = formValues.agreement;
    }

    try {
      if (studentId) {
        const draft = getEnrollmentDraft(studentId);
        if (draft) {
          saveEnrollmentDraft(
            payload,
            draft.step || 0,
            studentId,
            draft.currentStep || (draft as any).stepName,
          );
        }
        await updateStudentProfile(studentId, payload);
      }

      if (formValues.headshot && typeof formValues.headshot === 'string') {
        saveStudentPhoto({
          id: studentId,
          name: fullName,
          fullName,
          photo: formValues.headshot,
        });
      }

      showToast('Student profile successfully updated', 'success');
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        (navigation as any)?.navigate?.('StudentProfile', { studentId });
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save student profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Renderer for each dynamic field inside section
  const renderField = (f: any) => {
    const val = formValues[f.id] ?? formValues[f.label] ?? '';
    const fieldType = (f.type || 'text').toLowerCase();
    const normFid = String(f.id || '').toLowerCase();
    const normLabel = String(f.label || '').toLowerCase();

    // 1. Photo / Headshot Field
    const isPhotoField =
      (normFid === 'enr_headshot' ||
        normFid === 'f_photo' ||
        normFid === 'headshot' ||
        normLabel.includes('headshot') ||
        normLabel === 'student photo' ||
        normLabel === 'official headshot' ||
        ['image', 'photo', 'imagepicker', 'image_picker'].includes(fieldType)) &&
      !normFid.includes('certificate') &&
      !normFid.includes('paper') &&
      !normFid.includes('document') &&
      !normLabel.includes('certificate') &&
      !normLabel.includes('paper') &&
      !normLabel.includes('document');

    if (isPhotoField) {
      const photoUri =
        typeof val === 'string' &&
        (val.startsWith('http') || val.startsWith('data:image/') || val.startsWith('blob:'))
          ? val
          : formValues.headshot || formValues.photoUrl || null;

      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>{f.label || 'Official Headshot Photo'}</Text>
          <View style={styles.photoContainer}>
            {photoUri ? (
              <TouchableOpacity
                onPress={() =>
                  setPreviewModal({
                    isOpen: true,
                    fileUrl: photoUri,
                    fileName: `${formValues.fullName || 'student'}_photo.jpg`,
                    fileType: 'image',
                  })
                }
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Preview Headshot"
              >
                <Image source={{ uri: photoUri }} style={styles.headshotThumb} />
              </TouchableOpacity>
            ) : (
              <StudentAvatar
                name={formValues.fullName || formValues.firstName}
                studentId={studentId}
                size={54}
              />
            )}
            <View style={styles.photoActionsCol}>
              <Text style={styles.photoStatusText}>
                {photoUri ? 'Headshot Attached' : 'No Photo Uploaded'}
              </Text>
              <View style={styles.photoBtnRow}>
                {photoUri ? (
                  <TouchableOpacity
                    style={styles.previewPhotoBtn}
                    onPress={() =>
                      setPreviewModal({
                        isOpen: true,
                        fileUrl: photoUri,
                        fileName: `${formValues.fullName || 'student'}_photo.jpg`,
                        fileType: 'image',
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Preview Headshot"
                  >
                    <Feather name="eye" size={12} color="#0284C7" />
                    <Text style={styles.previewPhotoBtnText}>Preview</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.uploadPhotoBtn}
                  onPress={() => handlePickDocument(f.id, f.label || 'Headshot')}
                >
                  <Feather name="upload" size={12} color="#FFFFFF" />
                  <Text style={styles.uploadPhotoBtnText}>
                    {photoUri ? 'Change Photo' : 'Upload Photo'}
                  </Text>
                </TouchableOpacity>
                {photoUri ? (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemoveDocument(f.id, f.label || 'Headshot')}
                  >
                    <Feather name="trash-2" size={12} color="#DC2626" />
                    <Text style={styles.removePhotoBtnText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      );
    }

    // 2. Video Upload Field (e.g. Baseline Video)
    const isVideoField =
      normFid.includes('video') ||
      normLabel.includes('video') ||
      ['video', 'video_upload', 'videorecording'].includes(fieldType);

    if (isVideoField) {
      const rawVid = val || formValues.baseline_video || formValues.videoUrl || '';
      const vidUrl = typeof rawVid === 'string' ? rawVid : rawVid?.url || rawVid?.fileUrl || '';

      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>{f.label || 'Baseline Behavioral Video'}</Text>
          <VideoPlayerView
            videoUrl={vidUrl}
            title={f.label || 'Baseline Behavioral Assessment Video (HQ)'}
            subtitle={f.description || 'Intake assessment behavioral session sample'}
            onUploadPress={() => handlePickDocument(f.id, f.label || 'Baseline Video')}
            onRemovePress={
              vidUrl ? () => handleRemoveDocument(f.id, f.label || 'Baseline Video') : undefined
            }
          />
        </View>
      );
    }

    // 3. Document / File Upload Field (Birth Certificate, Medical Paper, Agreement, Custom Attachments)
    const isDocField =
      fieldType === 'file_upload' ||
      fieldType === 'file' ||
      fieldType === 'document' ||
      fieldType === 'attachment' ||
      normFid.includes('certificate') ||
      normFid.includes('agreement') ||
      normFid.includes('diagnosis_paper') ||
      normFid.includes('document') ||
      normLabel.includes('certificate') ||
      normLabel.includes('agreement') ||
      normLabel.includes('paper') ||
      normLabel.includes('document');

    if (isDocField) {
      const docMeta = val ? extractDocumentMeta(val, f.label || 'Document') : null;

      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          {docMeta ? (
            <DocumentAttachmentCard
              label={f.label}
              fileUrl={docMeta.url}
              fileName={docMeta.fileName}
              fileSize={docMeta.fileSize}
              uploadDate={docMeta.uploadDate}
              fileType={docMeta.fileType}
              editable={true}
              onReplace={() => handlePickDocument(f.id, f.label)}
              onRemove={() => handleRemoveDocument(f.id, f.label)}
            />
          ) : (
            <TouchableOpacity
              style={styles.emptyDocBox}
              onPress={() => handlePickDocument(f.id, f.label)}
            >
              <View style={styles.emptyDocIcon}>
                <Feather name="upload-cloud" size={20} color={C_SKY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyDocTitle}>Upload {f.label}</Text>
                <Text style={styles.emptyDocSub}>
                  {f.description || 'Click to select PDF or image file from device'}
                </Text>
              </View>
              <Feather name="plus" size={16} color={C_SKY} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // 4. Date Picker Input
    if (fieldType === 'date') {
      const isDob = normFid === 'f2' || normFid.includes('dob') || normLabel.includes('birth');
      const age = isDob && val ? calculateAge(val) : null;

      return (
        <View style={styles.fieldBox} key={f.id}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
            </Text>
            {age !== null ? (
              <Text style={styles.ageBadge}>
                {age} {age === 1 ? 'year' : 'years'} old
              </Text>
            ) : null}
          </View>
          <DobPicker
            value={val || ''}
            maximumDate={isDob ? new Date() : undefined}
            onChange={(d) => handleFieldChange(f.id, d)}
          />
        </View>
      );
    }

    // 5. Dropdown Selector
    if (fieldType === 'dropdown' || fieldType === 'select') {
      const isTherapistField = normFid.includes('therapist') || normLabel.includes('therapist');
      const isProgramField = normFid.includes('program') || normLabel.includes('program');
      const isTherapyGroupField =
        normFid.includes('therapy') || normLabel.includes('therapy group');
      const isStatusField = normFid === 'status' || normLabel === 'status';

      let optionsList: string[] = resolveFieldOptions(f);
      if (isTherapistField && therapists.length > 0) {
        optionsList = therapists.map((t) => t.name);
      } else if (isProgramField && programOptions.length > 0) {
        optionsList = programOptions;
      } else if (isTherapyGroupField && therapyOptions.length > 0) {
        optionsList = therapyOptions;
      } else if (isStatusField && statusOptions.length > 0) {
        optionsList = statusOptions;
      }

      const isOpen = activeDropdownFieldId === f.id;

      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          <TouchableOpacity
            style={[styles.dropdownBtn, isOpen && styles.dropdownBtnOpen]}
            onPress={() => setActiveDropdownFieldId(isOpen ? null : f.id)}
            accessibilityRole="combobox"
          >
            <Text style={val ? styles.dropdownValText : styles.dropdownPlaceholderText}>
              {val || `Select ${f.label}...`}
            </Text>
            <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C_SLATE} />
          </TouchableOpacity>

          {isOpen && (
            <Modal
              transparent
              animationType="fade"
              visible={isOpen}
              onRequestClose={() => setActiveDropdownFieldId(null)}
            >
              <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setActiveDropdownFieldId(null)}
              >
                <View style={styles.dropdownModalCard}>
                  <View style={styles.dropdownModalHeader}>
                    <Text style={styles.dropdownModalTitle}>{f.label}</Text>
                    <TouchableOpacity onPress={() => setActiveDropdownFieldId(null)}>
                      <Feather name="x" size={18} color={C_SLATE} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.dropdownModalScroll}>
                    {optionsList.map((opt) => {
                      let countText = '';
                      if (isTherapistField) {
                        const t = therapists.find((th) => th.name === opt);
                        const count =
                          (t as any)?.assignedStudentCount ?? t?.assignedStudents?.length ?? 0;
                        countText = ` (${count} ${count === 1 ? 'student' : 'students'} assigned)`;
                      }
                      const isSelected = val === opt;

                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.dropdownOptionRow,
                            isSelected && styles.dropdownOptionRowSelected,
                          ]}
                          onPress={() => {
                            handleFieldChange(f.id, opt);
                            setActiveDropdownFieldId(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {opt}
                            {countText}
                          </Text>
                          {isSelected && <Feather name="check" size={15} color={C_SKY} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </View>
      );
    }

    // 6. Radio / Chips
    if (fieldType === 'radio') {
      const optionsList = resolveFieldOptions(f);
      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          <View style={styles.chipsRow}>
            {optionsList.map((opt) => {
              const isSelected = val === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chipBtn, isSelected && styles.chipBtnSelected]}
                  onPress={() => handleFieldChange(f.id, opt)}
                >
                  <Text style={[styles.chipBtnText, isSelected && styles.chipBtnTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // 7. Multi-line Textarea
    if (fieldType === 'textarea') {
      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={String(val !== undefined && val !== null ? val : '')}
            placeholder={f.placeholder || 'Type here...'}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            onChangeText={(text) => handleFieldChange(f.id, text)}
          />
        </View>
      );
    }

    // 8. Number Input
    if (fieldType === 'number') {
      return (
        <View style={styles.fieldBox} key={f.id}>
          <Text style={styles.label}>
            {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          <TextInput
            style={styles.input}
            value={String(val !== undefined && val !== null ? val : '')}
            placeholder={f.placeholder || '0'}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            onChangeText={(text) => handleFieldChange(f.id, text.replace(/[^0-9.-]/g, ''))}
          />
        </View>
      );
    }

    // 9. Standard Text / Phone / Email Input
    const keyboardType =
      fieldType === 'phone' ? 'phone-pad' : fieldType === 'email' ? 'email-address' : 'default';

    return (
      <View style={styles.fieldBox} key={f.id}>
        <Text style={styles.label}>
          {f.label} {f.required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
        <TextInput
          style={styles.input}
          value={String(val !== undefined && val !== null ? val : '')}
          placeholder={f.placeholder || `Enter ${f.label}...`}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType}
          onChangeText={(text) => handleFieldChange(f.id, text)}
        />
      </View>
    );
  };

  if (loading) {
    return <ScreenLoader />;
  }

  const sectionsToRender = activeTab === 'All' ? activeSections : [activeTab];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Student Profile"
        onTabPress={(t) => {
          if (t !== 'Student Profile') {
            navigation?.navigate?.('CoordinatorDashboard');
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header / Breadcrumb */}
        <View style={styles.headerBar}>
          <View style={styles.breadcrumbRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
              <Feather name="arrow-left" size={16} color={C_SLATE} />
              <Text style={styles.backBtnText}>Back to Profile</Text>
            </TouchableOpacity>
            <Text style={styles.slash}>/</Text>
            <Text style={styles.breadcrumbActive}>
              Editing: {formValues.fullName || 'Student'} ({studentId})
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation?.goBack?.()}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save Student Profile Changes"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={14} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'All' && styles.sectionTabActive]}
            onPress={() => setActiveTab('All')}
          >
            <Text
              style={[styles.sectionTabText, activeTab === 'All' && styles.sectionTabTextActive]}
            >
              All Sections
            </Text>
          </TouchableOpacity>
          {activeSections.map((sec) => (
            <TouchableOpacity
              key={sec}
              style={[styles.sectionTab, activeTab === 'sec' && styles.sectionTabActive]}
              onPress={() => setActiveTab(sec)}
            >
              <Text
                style={[styles.sectionTabText, activeTab === sec && styles.sectionTabTextActive]}
              >
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dynamic Form Sections */}
        {sectionsToRender.map((secName) => {
          const fields = fieldsBySection[secName] || [];
          if (fields.length === 0) return null;

          return (
            <View style={styles.sectionCard} key={secName}>
              <View style={styles.sectionHeader}>
                <Feather name="layers" size={15} color={C_SKY} />
                <Text style={styles.sectionTitle}>{secName.toUpperCase()}</Text>
              </View>

              <View style={styles.fieldsGrid}>{fields.map((f: any) => renderField(f))}</View>
            </View>
          );
        })}

        {/* Bottom Save Bar */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation?.goBack?.()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save All Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Lightbox Modal for Document & Media Previews */}
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
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: C_BORDER,
    ...makeShadow(1, 4, 0.05, '0,0,0', 2),
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C_SLATE,
  },
  slash: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: C_NAVY,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C_SLATE,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: C_SKY,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabScroll: {
    maxHeight: 46,
  },
  tabScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  sectionTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  sectionTabActive: {
    backgroundColor: C_SKY,
    borderColor: C_SKY,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: C_SLATE,
  },
  sectionTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    padding: 16,
    gap: 14,
    ...makeShadow(1, 4, 0.04, '0,0,0', 2),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C_NAVY,
    letterSpacing: 0.5,
  },
  fieldsGrid: {
    gap: 14,
  },
  fieldBox: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  requiredStar: {
    color: C_RED,
  },
  ageBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: C_SKY,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: C_NAVY,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  dropdownBtnOpen: {
    borderColor: C_SKY,
  },
  dropdownValText: {
    fontSize: 14,
    color: C_NAVY,
    fontWeight: '500',
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    backgroundColor: '#F8FAFC',
  },
  chipBtnSelected: {
    borderColor: C_SKY,
    backgroundColor: '#E0F2FE',
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: C_SLATE,
  },
  chipBtnTextSelected: {
    color: C_SKY,
    fontWeight: '700',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  headshotThumb: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoActionsCol: {
    flex: 1,
    gap: 6,
  },
  photoStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: C_NAVY,
  },
  photoBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  previewPhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C_SKY,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  uploadPhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  removePhotoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  emptyDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
    borderStyle: 'dashed',
  },
  emptyDocIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C_NAVY,
  },
  emptyDocSub: {
    fontSize: 11,
    color: C_SLATE,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    ...makeShadow(4, 16, 0.15, '0,0,0', 8),
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C_NAVY,
  },
  dropdownModalScroll: {
    padding: 6,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  dropdownOptionRowSelected: {
    backgroundColor: '#E0F2FE',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: C_NAVY,
    fontWeight: '500',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: C_SKY,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingVertical: 10,
  },
});
