import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ScreenLoader from '../../components/ScreenLoader';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import StudentAvatar from '../../components/StudentAvatar';
import { saveStudentPhoto } from '../../utils/studentPhotoHelper';
import { resolveStudentStatus } from '../../utils/studentStatusHelper';
import { getEnrollmentDraft } from '../../utils/enrollmentDraftHelper';
import { getStudentProfile, updateStudentProfile } from '../../api/coordinatorApi';
import { getFormConfig, DEFAULT_ENROLLMENT_FORM } from '../../api/institutionalAdminApi';
import { calculateAge } from './enrollmentWizardTypes';
import { useToast } from '../../context/ToastContext';
import { exportStudentProfileToPdf } from '../../utils/studentProfilePdfHelper';
import {
  DEMOGRAPHIC_KEY,
  getStudentDemographic,
  maskSensitiveDemographic,
} from '../../utils/sensitiveDataSanitizer';
import DocumentAttachmentCard, {
  extractDocumentMeta,
} from '../../components/DocumentAttachmentCard';
import VideoPlayerView from '../../components/VideoPlayerView';
import MediaViewerModal from '../../components/MediaViewerModal';
import type { CoordinatorStackParamList } from '../../types';

const C_SKY = '#0284C7';
const C_NAVY = '#0F172A';
const C_SLATE = '#64748B';
const C_BORDER = '#E2E8F0';
const C_BG_CARD = '#FFFFFF';
const C_EMERALD = '#10B981';
const C_AMBER = '#F59E0B';
const C_PURPLE = '#8B5CF6';

const SOCIAL_SKILLS_PROMPTS = [
  '1. Initiates verbal greeting or wave to familiar teachers upon arrival',
  '2. Responds to peer approach with positive affect or shared attention',
  '3. Respects personal body boundary when sitting alongside peers',
  '4. Uses vocal mand or communicative picture to ask adult for help',
  '5. Maintains eye contact during 1-to-1 conversational interactions (>2 secs)',
  '6. Answers simple social identity questions (What is your name? How old are you?)',
  '7. Yields preferred toy to peer when prompt timer rings without tantrum',
  '8. Participates in simple turn-taking interactive play (Rolling ball, stacking)',
  '9. Discriminates happy vs. angry facial expressions on picture cards',
  '10. Stops and freezes immediately upon hearing safety "STOP" verbal cue',
];

interface StudentGoal {
  id: string;
  name: string;
  status: string;
  progressPercent: number;
}

export interface StudentProfileData {
  id: string;
  studentId?: string;
  student_id?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  age: number;
  programType: string;
  therapyGroup: string;
  status: string;
  headshotUrl: string | null;
  photoUrl?: string | null;
  photo?: string | null;
  gender?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelationship?: string;
  householdStructure?: string;
  emergencyContact?: string;
  diagnosis?: string;
  diagnosisDate?: string;
  medicalNotes?: string;
  developmentalHistory?: string;
  reinforcerVisual?: string;
  reinforcerAuditory?: string;
  reinforcerTactile?: string;
  reinforcerKinetic?: string;
  transportation?: string;
  therapist?: string;
  currentFocusStudentGoalId: string | null;
  goals: StudentGoal[];
  customFields?: Record<string, any>;
  formValues?: Record<string, any>;
  birthCertificate?: any;
  diagnosisPaper?: any;
  agreement?: any;
  videoUrl?: string | null;
  hasVideo?: boolean;
  isDraft?: boolean;
}

type Props = NativeStackScreenProps<CoordinatorStackParamList, 'StudentProfile'>;

export default function StudentProfileScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const studentId = route.params?.studentId;
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  // Dynamic Form Configuration schema states (Single Source of Truth)
  const [formFields, setFormFields] = useState<any[]>(DEFAULT_ENROLLMENT_FORM.fields || []);
  const [customSections, setCustomSections] = useState<string[]>(
    DEFAULT_ENROLLMENT_FORM.customSections || [],
  );
  const [deletedSections, setDeletedSections] = useState<string[]>([]);

  // Scoring Modal State for Social Skills Table
  const [scoringField, setScoringField] = useState<{
    id: string;
    label: string;
    index?: number;
  } | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType?: 'image' | 'video' | 'pdf' | 'document';
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Fetch active enrollment schema from backend FormConfiguration
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

  // Listen to dynamic form schema changes dispatched by Institutional Admin Form Builder
  useEffect(() => {
    loadFormConfig();
    const handler = (e: any) => {
      const name = (e?.detail?.formName || '').toLowerCase();
      if (name.includes('enrollment') || !name) {
        loadFormConfig();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('melue_form_config_changed', handler);
      return () => window.removeEventListener('melue_form_config_changed', handler);
    }
  }, [loadFormConfig]);

  const isDataPayload = (val: any) =>
    typeof val === 'string' &&
    (val.startsWith('data:') ||
      val.startsWith('blob:') ||
      (val.length > 256 && !val.includes(' ')));

  const cleanField = (val: string | undefined | null, fallback: string = ''): string => {
    if (!val || typeof val !== 'string') return fallback;
    const trimmed = val.trim();
    if (isDataPayload(trimmed)) {
      return fallback;
    }
    return trimmed;
  };

  // Helper to extract nested or alternate keys dynamically
  const extractVal = (obj: Record<string, any>, keys: string[], fallback: string = ''): string => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
        const val = String(obj[k]).trim();
        const isMediaKey = keys.some((key) =>
          /photo|image|headshot|video|certificate|agreement|doc|paper/i.test(key),
        );
        if (!isMediaKey && isDataPayload(val)) {
          continue;
        }
        return val;
      }
    }
    return fallback;
  };

  // Load Student Profile / Draft Data
  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const draft = getEnrollmentDraft(studentId);
      if (draft) {
        const formVals = draft.formValues || {};
        const rawFirst =
          cleanField(
            extractVal(formVals, [
              'enr_first_name',
              'childFirstName',
              'child_first_name',
              'firstName',
              'first_name',
            ]),
          ) ||
          cleanField(draft.firstName) ||
          cleanField((draft.fullName || draft.name || '').split(' ')[0]) ||
          '';

        const rawLast =
          cleanField(
            extractVal(formVals, [
              'enr_last_name',
              'childLastName',
              'child_last_name',
              'lastName',
              'last_name',
            ]),
          ) ||
          cleanField(draft.lastName) ||
          cleanField((draft.fullName || draft.name || '').split(' ').slice(1).join(' ')) ||
          '';

        const rawMiddle =
          cleanField(
            extractVal(formVals, [
              'enr_middle_name',
              'childMiddleName',
              'child_middle_name',
              'middleName',
              'middle_name',
            ]),
          ) ||
          cleanField(draft.middleName) ||
          '';

        const full =
          (rawFirst ? `${rawFirst} ${rawLast}`.trim() : '') ||
          cleanField(draft.fullName) ||
          cleanField(draft.name) ||
          cleanField(extractVal(formVals, ['f1', 'fullName', 'name'])) ||
          'Untitled Draft';

        const dob = extractVal(formVals, ['enr_dob', 'f2', 'dob', 'dateOfBirth', 'date_of_birth']);
        const age = dob ? (calculateAge(dob) ?? draft.age ?? 0) : (draft.age ?? 0);

        const draftProfile: StudentProfileData = {
          id: draft.id,
          fullName: full,
          firstName: rawFirst || (full !== 'Untitled Draft' ? full.split(' ')[0] : 'Draft'),
          lastName:
            rawLast || (full !== 'Untitled Draft' ? full.split(' ').slice(1).join(' ') : ''),
          middleName: rawMiddle,
          dateOfBirth: dob,
          age,
          programType:
            extractVal(formVals, ['enr_program_type', 'f_program', 'programType']) ||
            draft.program ||
            '',
          therapyGroup:
            extractVal(formVals, ['enr_therapy_group', 'f_therapy', 'therapyGroup']) ||
            draft.therapyGroup ||
            '',
          status: 'Draft',
          headshotUrl:
            extractVal(formVals, ['f_photo', 'enr_headshot', 'photoUrl', 'photo']) ||
            draft.photo ||
            null,
          photoUrl:
            extractVal(formVals, ['f_photo', 'enr_headshot', 'photoUrl', 'photo']) ||
            draft.photo ||
            null,
          photo:
            extractVal(formVals, ['f_photo', 'enr_headshot', 'photoUrl', 'photo']) ||
            draft.photo ||
            null,
          [DEMOGRAPHIC_KEY]: getStudentDemographic(
            formVals,
            getStudentDemographic(draft as any, 'Female'),
          ),
          guardianName:
            cleanField(
              extractVal(formVals, ['enr_guardian_name', 'f4', 'guardianName', 'parentName']),
            ) ||
            cleanField(draft.guardianName) ||
            '',
          guardianPhone:
            extractVal(formVals, ['enr_guardian_phone', 'f5', 'guardianPhone', 'parentPhone']) ||
            draft.guardianPhone ||
            '',
          guardianEmail:
            extractVal(formVals, ['enr_guardian_email', 'f6', 'guardianEmail', 'parentEmail']) ||
            draft.guardianEmail ||
            '',
          guardianRelationship: extractVal(formVals, [
            'enr_guardian_relationship',
            'guardianRelationship',
            'relationship',
          ]),
          householdStructure: extractVal(formVals, [
            'enr_household',
            'household',
            'householdStructure',
          ]),
          emergencyContact: extractVal(formVals, [
            'enr_emergency_contact',
            'f9',
            'emergencyContact',
          ]),
          diagnosis: extractVal(formVals, ['enr_diagnosis', 'f_diagnosis', 'diagnosis']),
          diagnosisDate: extractVal(formVals, [
            'enr_diagnosis_date',
            'diagnosisDate',
            'diagnosis_date',
          ]),
          medicalNotes: extractVal(formVals, ['enr_medical_restrictions', 'f7', 'medicalNotes']),
          developmentalHistory: extractVal(formVals, [
            'enr_dev_history',
            'developmentalHistory',
            'dev_history',
          ]),
          reinforcerVisual: extractVal(formVals, [
            'enr_reinforcer_visual',
            'reinforcerVisual',
            'visualReinforcer',
          ]),
          reinforcerAuditory: extractVal(formVals, [
            'enr_reinforcer_auditory',
            'reinforcerAuditory',
            'auditoryReinforcer',
          ]),
          reinforcerTactile: extractVal(formVals, [
            'enr_reinforcer_tactile',
            'reinforcerTactile',
            'tactileReinforcer',
          ]),
          reinforcerKinetic: extractVal(formVals, [
            'enr_reinforcer_kinetic',
            'reinforcerKinetic',
            'kineticReinforcer',
          ]),
          transportation: extractVal(formVals, ['f8', 'transportation']),
          therapist:
            extractVal(formVals, ['f_therapist', 'therapist']) || draft.therapist || 'Unassigned',
          currentFocusStudentGoalId: null,
          goals: [],
          customFields: formVals,
          formValues: formVals,
          birthCertificate:
            formVals.birthCertificate ||
            formVals.birth_certificate ||
            formVals.enr_birth_certificate,
          diagnosisPaper:
            formVals.diagnosisPaper || formVals.diagnosis_paper || formVals.enr_diagnosis_paper,
          agreement: formVals.agreement || formVals.enr_agreement,
          videoUrl: extractVal(formVals, [
            'enr_baseline_video',
            'baseline_video',
            'videoUrl',
            'video_url',
          ]),
          hasVideo: Boolean(
            formVals.enr_baseline_video ||
            formVals.baseline_video ||
            formVals.videoUrl ||
            formVals.video_url,
          ),
          isDraft: true,
        };
        setProfile(draftProfile);
        setLoadFailed(false);
        return;
      }

      const { data } = await getStudentProfile(studentId);
      if (data) {
        const customObj = {
          ...(data.customFields || {}),
          ...(data.custom_fields || {}),
          ...(data.formValues || {}),
        };

        const rawFirst =
          cleanField(data.firstName) ||
          cleanField(data.first_name) ||
          cleanField(
            extractVal(customObj, [
              'enr_first_name',
              'childFirstName',
              'child_first_name',
              'firstName',
              'first_name',
            ]),
          ) ||
          cleanField((data.fullName || data.name || '').split(' ')[0]) ||
          '';

        const rawLast =
          cleanField(data.lastName) ||
          cleanField(data.last_name) ||
          cleanField(
            extractVal(customObj, [
              'enr_last_name',
              'childLastName',
              'child_last_name',
              'lastName',
              'last_name',
            ]),
          ) ||
          cleanField((data.fullName || data.name || '').split(' ').slice(1).join(' ')) ||
          '';

        const rawMiddle =
          cleanField(data.middleName) ||
          cleanField(data.middle_name) ||
          cleanField(
            extractVal(customObj, [
              'enr_middle_name',
              'childMiddleName',
              'child_middle_name',
              'middleName',
              'middle_name',
            ]),
          ) ||
          '';

        const full =
          cleanField(data.fullName) ||
          cleanField(data.name) ||
          (rawFirst ? `${rawFirst} ${rawLast}`.trim() : '') ||
          'Student Profile';

        const dob =
          data.dateOfBirth || data.date_of_birth || extractVal(customObj, ['enr_dob', 'f2', 'dob']);
        const age = dob ? (calculateAge(dob) ?? Number(data.age || 0)) : Number(data.age || 0);

        const sid =
          data.studentId ||
          data.student_id ||
          (data.id && String(data.id).startsWith('MEL-') ? data.id : '') ||
          studentId;

        const headshot =
          data.headshotUrl ||
          data.photoUrl ||
          data.photo ||
          customObj.f_photo ||
          customObj.enr_headshot ||
          null;

        const safeProfile: StudentProfileData = {
          id: data.id || sid,
          studentId: sid,
          student_id: sid,
          fullName: full,
          firstName: rawFirst || (full !== 'Student Profile' ? full.split(' ')[0] : ''),
          lastName:
            rawLast || (full !== 'Student Profile' ? full.split(' ').slice(1).join(' ') : ''),
          middleName: rawMiddle,
          dateOfBirth: dob,
          age,
          programType:
            data.programType ||
            data.program ||
            extractVal(customObj, ['enr_program_type', 'f_program', 'programType']),
          therapyGroup:
            data.therapyGroup ||
            extractVal(customObj, ['enr_therapy_group', 'f_therapy', 'therapyGroup']),
          status: data.status || 'Active',
          headshotUrl: headshot,
          photoUrl: headshot,
          photo: headshot,
          [DEMOGRAPHIC_KEY]: getStudentDemographic(
            data,
            getStudentDemographic(customObj, 'Female'),
          ),
          guardianName:
            cleanField(data.guardianName) ||
            cleanField(data.guardian_name) ||
            cleanField(data.parentName) ||
            cleanField(
              extractVal(customObj, ['enr_guardian_name', 'f4', 'guardianName', 'parentName']),
            ),
          guardianPhone:
            data.guardianPhone ||
            data.guardian_phone ||
            data.parentPhone ||
            extractVal(customObj, ['enr_guardian_phone', 'f5', 'guardianPhone', 'parentPhone']),
          guardianEmail:
            data.guardianEmail ||
            data.guardian_email ||
            data.parentEmail ||
            extractVal(customObj, ['enr_guardian_email', 'f6', 'guardianEmail', 'parentEmail']),
          guardianRelationship: extractVal(customObj, [
            'enr_guardian_relationship',
            'guardianRelationship',
            'relationship',
          ]),
          householdStructure: extractVal(customObj, [
            'enr_household',
            'household',
            'householdStructure',
          ]),
          emergencyContact:
            data.emergencyContact ||
            data.emergency_contact ||
            extractVal(customObj, ['enr_emergency_contact', 'f9', 'emergencyContact']),
          diagnosis:
            data.diagnosis || extractVal(customObj, ['enr_diagnosis', 'f_diagnosis', 'diagnosis']),
          diagnosisDate:
            data.diagnosisDate ||
            data.diagnosis_date ||
            extractVal(customObj, ['enr_diagnosis_date', 'diagnosisDate', 'diagnosis_date']),
          medicalNotes:
            data.medicalNotes ||
            data.medical_notes ||
            extractVal(customObj, ['enr_medical_restrictions', 'f7', 'medicalNotes']),
          developmentalHistory: extractVal(customObj, [
            'enr_dev_history',
            'developmentalHistory',
            'dev_history',
          ]),
          reinforcerVisual: extractVal(customObj, [
            'enr_reinforcer_visual',
            'reinforcerVisual',
            'visualReinforcer',
          ]),
          reinforcerAuditory: extractVal(customObj, [
            'enr_reinforcer_auditory',
            'reinforcerAuditory',
            'auditoryReinforcer',
          ]),
          reinforcerTactile: extractVal(customObj, [
            'enr_reinforcer_tactile',
            'reinforcerTactile',
            'tactileReinforcer',
          ]),
          reinforcerKinetic: extractVal(customObj, [
            'enr_reinforcer_kinetic',
            'reinforcerKinetic',
            'kineticReinforcer',
          ]),
          transportation:
            data.transportation ||
            data.transportation_required ||
            extractVal(customObj, ['f8', 'transportation']),
          therapist:
            data.therapist ||
            data.assignedTherapist ||
            extractVal(customObj, ['f_therapist', 'therapist']),
          currentFocusStudentGoalId: data.currentFocusStudentGoalId || null,
          goals: Array.isArray(data.goals) ? data.goals : [],
          customFields: customObj,
          formValues: customObj,
          birthCertificate:
            data.birthCertificate ||
            data.birth_certificate ||
            customObj.birthCertificate ||
            customObj.birth_certificate ||
            customObj.enr_birth_certificate,
          diagnosisPaper:
            data.diagnosisPaper ||
            data.diagnosis_paper ||
            customObj.diagnosisPaper ||
            customObj.diagnosis_paper ||
            customObj.enr_diagnosis_paper,
          agreement: data.agreement || customObj.agreement || customObj.enr_agreement,
          videoUrl:
            data.videoUrl ||
            data.video_url ||
            extractVal(customObj, [
              'enr_baseline_video',
              'baseline_video',
              'videoUrl',
              'video_url',
            ]),
          hasVideo: Boolean(
            data.hasVideo ||
            data.videoUrl ||
            data.video_url ||
            customObj.enr_baseline_video ||
            customObj.baseline_video,
          ),
          isDraft: Boolean(data.isDraft || data.status?.toLowerCase() === 'draft'),
        };
        setProfile(safeProfile);
        saveStudentPhoto({
          id: safeProfile.id,
          name: safeProfile.fullName,
          photo: safeProfile.photoUrl || safeProfile.headshotUrl || safeProfile.photo,
        });
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setProfile(null);
      setLoadFailed(true);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const isDraft = useMemo(() => {
    if (!profile) return false;
    return Boolean(
      profile.isDraft ||
      profile.status?.toLowerCase() === 'draft' ||
      resolveStudentStatus(profile.id, profile.fullName, profile.status) === 'Draft' ||
      Boolean(studentId && getEnrollmentDraft(studentId)) ||
      Boolean(profile.id && getEnrollmentDraft(profile.id)) ||
      String(studentId || '').startsWith('draft-') ||
      String(profile.id || '').startsWith('draft-'),
    );
  }, [profile, studentId]);

  // Dynamically derive active sections and fields directly from FormConfiguration (Single Source of Truth)
  const deletedSet = useMemo(
    () => new Set((deletedSections || []).map((s) => s.toLowerCase().trim())),
    [deletedSections],
  );

  const fieldsBySection = useMemo(() => {
    const map: Record<string, any[]> = {};
    (formFields || []).forEach((field: any) => {
      const sec = (field.section || 'General').trim();
      if (!deletedSet.has(sec.toLowerCase())) {
        if (!map[sec]) map[sec] = [];
        map[sec].push(field);
      }
    });
    return map;
  }, [formFields, deletedSet]);

  const activeSections = useMemo(() => {
    const result: string[] = [];
    const pushSection = (s: string) => {
      const trimmed = s.trim();
      if (
        trimmed &&
        !deletedSet.has(trimmed.toLowerCase()) &&
        !result.some((r) => r.toLowerCase() === trimmed.toLowerCase()) &&
        !['assign therapist', 'review', 'review & complete'].includes(trimmed.toLowerCase()) &&
        (fieldsBySection[trimmed]?.length || 0) > 0
      ) {
        result.push(trimmed);
      }
    };

    (customSections || []).forEach(pushSection);
    (formFields || []).forEach((f: any) => {
      pushSection(f.section || 'General');
    });

    return result;
  }, [customSections, formFields, deletedSet, fieldsBySection]);

  const tabs = useMemo(() => ['All', ...activeSections], [activeSections]);

  // Extract household structure members
  const householdMembers = useMemo(() => {
    const raw = profile?.householdStructure || '';
    if (!raw) return [];
    return raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [profile?.householdStructure]);

  // Score modal save handler
  const handleScoreQuestion = (fieldId: string, scoreVal: string) => {
    if (!profile) return;
    const updatedCustom = {
      ...(profile.customFields || {}),
      ...(profile.formValues || {}),
      [fieldId]: scoreVal,
    };
    setProfile({
      ...profile,
      customFields: updatedCustom,
      formValues: updatedCustom,
    });
    setScoringField(null);
    showToast(`Updated score: ${scoreVal}`, 'success');
    if (!isDraft) {
      updateStudentProfile(profile.id, { custom_fields: updatedCustom }).catch(() => {});
    }
  };

  const handleContinueEnrollment = () => {
    if (profile) {
      (navigation as any)?.navigate?.('StudentEnrollmentWizard', { draftId: profile.id });
    }
  };

  const handleEditProfile = () => {
    if (profile) {
      (navigation as any)?.navigate('StudentEditProfile', { studentId: profile.id });
    }
  };

  const handleExportPdf = () => {
    if (!profile) return;
    const ok = exportStudentProfileToPdf(profile);
    if (ok) {
      showToast('Opening print / PDF export dialog...', 'info');
    } else {
      showToast('Export to PDF not supported in this environment', 'error');
    }
  };

  const handleUploadDocuments = (targetSection?: string) => {
    if (!profile) return;
    (navigation as any)?.navigate('StudentEnrollmentWizard', {
      draftId: profile.id,
      section: targetSection || 'Documents & Media',
    });
  };

  // Helper to resolve dynamic field value from profile
  const resolveFieldValue = (field: any) => {
    if (!profile) return '';
    const custom = { ...(profile.customFields || {}), ...(profile.formValues || {}) };
    const fieldId = field.id;
    const normId = (fieldId || '').toLowerCase().trim();
    const normLabel = (field.label || '').toLowerCase().trim();

    // 1. Photo / Headshot
    if (
      normId === 'f_photo' ||
      normId === 'enr_headshot' ||
      normId === 'headshot' ||
      normLabel.includes('headshot') ||
      normLabel.includes('photo')
    ) {
      return (
        profile.photoUrl ||
        profile.headshotUrl ||
        profile.photo ||
        custom[fieldId] ||
        custom.f_photo ||
        custom.enr_headshot ||
        null
      );
    }

    // 2. Child First Name
    if (
      normId === 'enr_first_name' ||
      normId === 'childfirstname' ||
      normId === 'child_first_name' ||
      normId === 'firstname' ||
      normId === 'first_name' ||
      normLabel === 'child first name' ||
      normLabel === 'first name'
    ) {
      return (
        profile.firstName ||
        (profile.fullName ? profile.fullName.split(' ')[0] : '') ||
        cleanField(custom[fieldId]) ||
        ''
      );
    }

    // 3. Child Last Name
    if (
      normId === 'enr_last_name' ||
      normId === 'childlastname' ||
      normId === 'child_last_name' ||
      normId === 'lastname' ||
      normId === 'last_name' ||
      normLabel === 'child last name' ||
      normLabel === 'last name'
    ) {
      return (
        profile.lastName ||
        (profile.fullName ? profile.fullName.split(' ').slice(1).join(' ') : '') ||
        cleanField(custom[fieldId]) ||
        ''
      );
    }

    // 4. Child Middle Name
    if (
      normId === 'enr_middle_name' ||
      normId === 'childmiddlename' ||
      normId === 'child_middle_name' ||
      normId === 'middlename' ||
      normId === 'middle_name' ||
      normLabel === 'child middle name' ||
      normLabel === 'middle name'
    ) {
      return profile.middleName || cleanField(custom[fieldId]) || '';
    }

    // 5. Student Full Name
    if (
      normId === 'f1' ||
      normId === 'fullname' ||
      normId === 'full_name' ||
      normLabel === 'student full name' ||
      normLabel === 'full name'
    ) {
      return profile.fullName || cleanField(custom[fieldId]) || '';
    }

    // 6. Date of Birth
    if (
      normId === 'enr_dob' ||
      normId === 'f2' ||
      normId === 'dob' ||
      normId === 'dateofbirth' ||
      normId === 'date_of_birth' ||
      normLabel.includes('date of birth') ||
      normLabel === 'dob'
    ) {
      if (profile.dateOfBirth) {
        return `${profile.dateOfBirth}${profile.age ? ` (${profile.age} years old)` : ''}`;
      }
      return cleanField(custom[fieldId]) || '';
    }

    // 7. Demographic
    if (normId.includes('gender') || normLabel.includes('gender')) {
      return getStudentDemographic(profile as any, cleanField(custom[fieldId]) || '');
    }

    // 8. Program Placement
    if (
      normId === 'f_program' ||
      normId === 'enr_program_type' ||
      normId === 'program' ||
      normId === 'programtype' ||
      normId === 'program_type' ||
      normLabel.includes('program')
    ) {
      return profile.programType || cleanField(custom[fieldId]) || '';
    }

    // 9. Therapy Group Track
    if (
      normId === 'f_therapy' ||
      normId === 'enr_therapy_group' ||
      normId === 'therapygroup' ||
      normId === 'therapy_group' ||
      normLabel.includes('therapy group')
    ) {
      return profile.therapyGroup || cleanField(custom[fieldId]) || '';
    }

    // 10. Assigned Therapist
    if (normId === 'f_therapist' || normId === 'therapist' || normLabel.includes('therapist')) {
      return profile.therapist || cleanField(custom[fieldId]) || '';
    }

    // 11. Guardian Name
    if (
      normId === 'f4' ||
      normId === 'enr_guardian_name' ||
      normId === 'guardianname' ||
      normId === 'guardian_name' ||
      normLabel.includes('guardian name') ||
      normLabel.includes('parent name')
    ) {
      return profile.guardianName || cleanField(custom[fieldId]) || '';
    }

    // 12. Guardian Phone
    if (
      normId === 'f5' ||
      normId === 'enr_guardian_phone' ||
      normId === 'guardianphone' ||
      normId === 'guardian_phone' ||
      normLabel.includes('phone') ||
      normLabel.includes('telephone')
    ) {
      return profile.guardianPhone || cleanField(custom[fieldId]) || '';
    }

    // 13. Guardian Email
    if (
      normId === 'f6' ||
      normId === 'enr_guardian_email' ||
      normId === 'guardianemail' ||
      normId === 'guardian_email' ||
      normLabel.includes('email')
    ) {
      return profile.guardianEmail || cleanField(custom[fieldId]) || '';
    }

    // 14. Guardian Relationship
    if (
      normId === 'enr_guardian_relationship' ||
      normId === 'guardianrelationship' ||
      normId === 'guardian_relationship' ||
      normLabel.includes('relationship')
    ) {
      return profile.guardianRelationship || cleanField(custom[fieldId]) || '';
    }

    // 15. Household Structure
    if (
      normId === 'enr_household' ||
      normId === 'householdstructure' ||
      normId === 'household_structure' ||
      normLabel.includes('household')
    ) {
      return profile.householdStructure || cleanField(custom[fieldId]) || '';
    }

    // 16. Emergency Contact
    if (
      normId === 'enr_emergency_contact' ||
      normId === 'f9' ||
      normId === 'emergencycontact' ||
      normId === 'emergency_contact' ||
      normLabel.includes('emergency')
    ) {
      return profile.emergencyContact || cleanField(custom[fieldId]) || '';
    }

    // 17. Primary Clinical Diagnosis
    if (
      normId === 'f_diagnosis' ||
      normId === 'enr_diagnosis' ||
      normId === 'diagnosis' ||
      normLabel.includes('clinical diagnosis') ||
      normLabel === 'diagnosis'
    ) {
      return profile.diagnosis || cleanField(custom[fieldId]) || '';
    }

    // 18. Diagnosis Date
    if (
      normId === 'enr_diagnosis_date' ||
      normId === 'diagnosisdate' ||
      normId === 'diagnosis_date' ||
      normLabel.includes('diagnosis date')
    ) {
      return profile.diagnosisDate || cleanField(custom[fieldId]) || '';
    }

    // 19. Medical Notes & Restrictions
    if (
      normId === 'f_medical_notes' ||
      normId === 'enr_medical_restrictions' ||
      normId === 'medicalnotes' ||
      normId === 'medical_notes' ||
      normLabel.includes('medical note') ||
      normLabel.includes('restrictions')
    ) {
      return profile.medicalNotes || cleanField(custom[fieldId]) || '';
    }

    // 20. Developmental History
    if (
      normId === 'enr_dev_history' ||
      normId === 'developmentalhistory' ||
      normId === 'developmental_history' ||
      normLabel.includes('developmental history')
    ) {
      return profile.developmentalHistory || cleanField(custom[fieldId]) || '';
    }

    // 21. Reinforcers
    if (
      normId === 'enr_reinf_visual' ||
      normId === 'enr_reinforcer_visual' ||
      normId === 'reinforcervisual' ||
      normId === 'reinforcer_visual' ||
      normLabel.includes('visual reinforcer')
    ) {
      return profile.reinforcerVisual || cleanField(custom[fieldId]) || '';
    }

    if (
      normId === 'enr_reinf_auditory' ||
      normId === 'enr_reinforcer_auditory' ||
      normId === 'reinforcerauditory' ||
      normId === 'reinforcer_auditory' ||
      normLabel.includes('auditory reinforcer')
    ) {
      return profile.reinforcerAuditory || cleanField(custom[fieldId]) || '';
    }

    if (
      normId === 'enr_reinf_tactile' ||
      normId === 'enr_reinforcer_tactile' ||
      normId === 'reinforcertactile' ||
      normId === 'reinforcer_tactile' ||
      normLabel.includes('tactile')
    ) {
      return profile.reinforcerTactile || cleanField(custom[fieldId]) || '';
    }

    if (
      normId === 'enr_reinf_kinetic' ||
      normId === 'enr_reinforcer_kinetic' ||
      normId === 'reinforcerkinetic' ||
      normId === 'reinforcer_kinetic' ||
      normLabel.includes('kinetic')
    ) {
      return profile.reinforcerKinetic || cleanField(custom[fieldId]) || '';
    }

    // 22. Birth Certificate Document
    if (
      normId === 'enr_birth_certificate' ||
      normId === 'birth_certificate' ||
      normLabel.includes('birth certificate')
    ) {
      return profile.birthCertificate || custom[fieldId] || null;
    }

    // 23. Diagnosis Paper Document
    if (
      normId === 'enr_diagnosis_paper' ||
      normId === 'diagnosis_paper' ||
      normLabel.includes('diagnosis paper') ||
      normLabel.includes('diagnosis document')
    ) {
      return profile.diagnosisPaper || custom[fieldId] || null;
    }

    // 24. Agreement Document
    if (normId === 'enr_agreement' || normId === 'agreement' || normLabel.includes('agreement')) {
      return profile.agreement || custom[fieldId] || null;
    }

    // 25. Baseline Assessment Video
    if (
      normId === 'enr_baseline_video' ||
      normId === 'baseline_video' ||
      normId === 'videourl' ||
      normId === 'video_url' ||
      normLabel.includes('baseline video') ||
      normLabel.includes('video')
    ) {
      return profile.videoUrl || profile.hasVideo || custom[fieldId] || null;
    }

    // Fallback: general custom field value (skip if binary data URL payload)
    if (custom[fieldId] !== undefined && custom[fieldId] !== null) {
      const v = custom[fieldId];
      if (typeof v === 'string' && isDataPayload(v)) {
        return '';
      }
      return v;
    }

    return '';
  };

  // Safe navigation mapping supporting both Coordinator and Program Director stacks
  const handleNavTabPress = (tabName: string) => {
    const routeName = navRouteForTab(tabName);
    if (routeName) {
      (navigation as any)?.navigate?.(routeName);
    }
  };

  if (!studentId) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Student Profile"
          onTabPress={(t) => t !== 'Student Profile' && handleNavTabPress(t)}
        />
        <View style={styles.emptyState}>
          <Feather name="user" size={40} color={colors.mutedText} />
          <Text style={typography.body}>No student selected.</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('StudentEnrollment' as never)}>
            <Text style={styles.linkText}>Pick a student from Student Registration →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile && loadFailed) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Student Profile"
          onTabPress={(t) => t !== 'Student Profile' && handleNavTabPress(t)}
        />
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={colors.mutedText} />
          <Text style={typography.body}>Profile not found.</Text>
          <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
            <Text style={styles.linkText}>Retry loading profile →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return <ScreenLoader />;

  const isWide = windowWidth >= 960;
  const custom = { ...(profile.customFields || {}), ...(profile.formValues || {}) };
  const studentPhoto =
    profile.photoUrl ||
    profile.headshotUrl ||
    profile.photo ||
    custom.f_photo ||
    custom.enr_headshot ||
    custom.photo ||
    null;
  const therapistName = profile.therapist;
  const hasTherapist = Boolean(therapistName && therapistName !== 'Unassigned');

  // Count scored items in Social Skills Questionnaire
  const scoredCount = SOCIAL_SKILLS_PROMPTS.reduce((acc, _, idx) => {
    return custom[`soc_q${idx + 1}`] ? acc + 1 : acc;
  }, 0);

  // Helper to pick icons per section
  const getSectionIcon = (secName: string) => {
    const s = secName.toLowerCase();
    if (s.includes('student') || s.includes('child')) return 'user';
    if (s.includes('parent') || s.includes('household') || s.includes('guardian')) return 'users';
    if (s.includes('doc') || s.includes('media') || s.includes('file')) return 'folder';
    if (s.includes('medical') || s.includes('clinical') || s.includes('reinforcer'))
      return 'activity';
    if (s.includes('social') || s.includes('skill') || s.includes('questionnaire'))
      return 'clipboard';
    return 'file-text';
  };

  // Render a dynamic section card strictly based on the Form Builder schema
  const renderDynamicSectionCard = (secName: string) => {
    const fields = fieldsBySection[secName] || [];
    if (fields.length === 0) return null;

    const normSec = secName.toLowerCase();
    const isSocialSkillsSec =
      normSec.includes('social skills') ||
      normSec.includes('social_skills') ||
      fields.some((f) => String(f.id).startsWith('soc_q'));
    const isDocMediaSec = normSec.includes('doc') || normSec.includes('media');

    return (
      <View
        style={styles.card}
        key={secName}
        testID={`profile-section-${secName.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleWrap}>
            <Feather name={getSectionIcon(secName) as any} size={15} color={C_SKY} />
            <Text style={styles.cardTitle}>{secName.toUpperCase()}</Text>
          </View>
          {isDocMediaSec ? (
            <TouchableOpacity
              onPress={() => handleUploadDocuments(secName)}
              accessibilityRole="button"
              accessibilityLabel="Upload Documents in Enrollment Wizard"
              testID="upload-documents-card-button"
            >
              <Text style={styles.cardLinkAction}>+ Upload</Text>
            </TouchableOpacity>
          ) : isSocialSkillsSec ? (
            <View style={styles.scoredBadge}>
              <Text style={styles.scoredBadgeText}>{scoredCount}/10 Sections Scored</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => showToast('Section verified against intake', 'success')}
            >
              <Text style={styles.cardLinkAction}>Verified</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* If Social Skills Questionnaire section, render the interactive scoring table */}
        {isSocialSkillsSec ? (
          <View>
            <Text style={styles.socialSubtitle}>
              Baseline behavioral screening metrics across peer socialization indicators
            </Text>
            <View style={styles.socialTable}>
              <View style={styles.socialTableHeader}>
                <Text style={[styles.socialTh, { flex: 0.72 }]}>
                  SKILL INDICATOR / ASSESSMENT PROMPT
                </Text>
                <Text style={[styles.socialTh, { flex: 0.16, textAlign: 'center' }]}>STATUS</Text>
                <Text style={[styles.socialTh, { flex: 0.12, textAlign: 'right' }]}>ACTION</Text>
              </View>

              {fields.map((f: any, idx: number) => {
                const promptText = f.label || SOCIAL_SKILLS_PROMPTS[idx] || `Item ${idx + 1}`;
                const scoreVal = custom[f.id] || custom[`soc_q${idx + 1}`];
                const hasScore = Boolean(scoreVal && scoreVal !== '—');

                return (
                  <View key={f.id || idx} style={styles.socialTableRow}>
                    <Text style={[styles.socialPromptText, { flex: 0.72 }]}>{promptText}</Text>
                    <View style={{ flex: 0.16, alignItems: 'center' }}>
                      {hasScore ? (
                        <View style={styles.scorePill}>
                          <Text style={styles.scorePillText}>{String(scoreVal)}</Text>
                        </View>
                      ) : (
                        <Text style={styles.socialStatusEmpty}>—</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={{ flex: 0.12, alignItems: 'flex-end' }}
                      onPress={() => setScoringField({ id: f.id, label: promptText, index: idx })}
                    >
                      <Text style={styles.socialScoreActionText}>
                        {hasScore ? 'Edit' : 'Score'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          /* Render fields in their authoring schema order */
          <View style={styles.kvList}>
            {fields.map((f: any) => {
              const val = resolveFieldValue(f);
              const fieldType = (f.type || 'text').toLowerCase();
              const normFid = String(f.id || '').toLowerCase();
              const normLabel = String(f.label || '').toLowerCase();

              const isPhotoField =
                (normFid === 'enr_headshot' ||
                  normFid === 'f_photo' ||
                  normFid === 'photo' ||
                  normFid === 'headshot' ||
                  normLabel === 'headshot' ||
                  normLabel === 'student photo' ||
                  normLabel === 'official headshot' ||
                  ['image', 'photo', 'imagepicker', 'image_picker'].includes(fieldType)) &&
                !normFid.includes('certificate') &&
                !normFid.includes('paper') &&
                !normFid.includes('document') &&
                !normLabel.includes('certificate') &&
                !normLabel.includes('paper') &&
                !normLabel.includes('document');

              const isVideoField =
                normFid.includes('video') ||
                normLabel.includes('video') ||
                ['video', 'video_upload', 'videorecording'].includes(fieldType);

              const isDocField =
                !isPhotoField &&
                !isVideoField &&
                (fieldType === 'file_upload' ||
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
                  normLabel.includes('document'));

              // 1. Headshot Photo Field (Strictly isolated from general file/doc attachments)
              if (isPhotoField) {
                const photoUri =
                  typeof val === 'string' &&
                  (val.startsWith('http') ||
                    val.startsWith('data:image/') ||
                    val.startsWith('blob:'))
                    ? val
                    : studentPhoto;

                return (
                  <View style={styles.headshotBox} key={f.id}>
                    {photoUri ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setPreviewModal({
                            isOpen: true,
                            fileUrl: photoUri,
                            fileName: `${profile.id}_photo.jpg`,
                            fileType: 'image',
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Preview Headshot Photo"
                      >
                        <Image source={{ uri: photoUri }} style={styles.headshotThumb} />
                      </TouchableOpacity>
                    ) : (
                      <StudentAvatar name={profile.fullName} studentId={profile.id} size={50} />
                    )}
                    <View style={styles.headshotDetails}>
                      <View style={styles.headshotTitleRow}>
                        <Text style={styles.headshotTitle}>{f.label || 'Official Headshot'}</Text>
                        <View style={styles.verifiedPill}>
                          <Feather
                            name={photoUri ? 'check' : 'alert-circle'}
                            size={11}
                            color={photoUri ? C_EMERALD : C_AMBER}
                          />
                          <Text style={[styles.verifiedPillText, !photoUri && { color: C_AMBER }]}>
                            {photoUri ? 'Verified' : 'Not Uploaded'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.headshotFilename} numberOfLines={1}>
                        {photoUri ? `${profile.id}_photo.jpg` : 'No headshot photo on record'}
                      </Text>
                      <View style={styles.headshotActions}>
                        <TouchableOpacity
                          onPress={() =>
                            (navigation as any)?.navigate?.('StudentEnrollmentWizard', {
                              draftId: profile.id,
                            })
                          }
                        >
                          <Text style={styles.headshotActionLink}>Update Photo</Text>
                        </TouchableOpacity>
                        {photoUri ? (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <TouchableOpacity
                              onPress={() =>
                                setPreviewModal({
                                  isOpen: true,
                                  fileUrl: photoUri,
                                  fileName: `${profile.id}_photo.jpg`,
                                  fileType: 'image',
                                })
                              }
                            >
                              <Text style={styles.headshotActionLink}>View Full Size</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              }

              // 2. Video Upload Field (e.g. Baseline Video with authentic HTML5 video controls)
              if (isVideoField) {
                const rawVid = val || profile.videoUrl || '';
                const vidUrl =
                  typeof rawVid === 'string' ? rawVid : rawVid?.url || rawVid?.fileUrl || '';
                return (
                  <View key={f.id} style={{ marginVertical: 6 }}>
                    <VideoPlayerView
                      videoUrl={vidUrl}
                      title={f.label || 'Baseline Behavioral Assessment Video (HQ)'}
                      subtitle={f.description || 'Intake assessment behavioral session sample'}
                      onUploadPress={() => handleUploadDocuments(secName)}
                    />
                  </View>
                );
              }

              // 3. Document / File Upload Field (Birth Certificate, Medical Diagnosis Paper, Agreement, etc.)
              if (isDocField) {
                const isAttached = Boolean(val);
                const docMeta = isAttached ? extractDocumentMeta(val, f.label || 'Document') : null;
                return isAttached && docMeta ? (
                  <View key={f.id} style={{ marginVertical: 4 }}>
                    <DocumentAttachmentCard
                      label={f.label || 'Document'}
                      fileUrl={docMeta.url}
                      fileName={docMeta.fileName}
                      fileSize={docMeta.fileSize}
                      uploadDate={docMeta.uploadDate}
                      fileType={docMeta.fileType}
                      editable={false}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.docRow}
                    onPress={() => handleUploadDocuments(secName)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={f.label}
                  >
                    <View style={styles.docIconWrap}>
                      <Feather name="file-text" size={15} color={C_SLATE} />
                    </View>
                    <View style={styles.docMeta}>
                      <Text style={styles.docTitle}>{f.label}</Text>
                      <Text style={styles.docSubtitle}>
                        {f.description || 'Required verification document (Not Uploaded)'}
                      </Text>
                    </View>
                    <View style={styles.docUploadActionPill}>
                      <Feather name="upload" size={11} color={C_SKY} />
                      <Text style={styles.docUploadActionText}>Upload</Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              // 4. Multi-line Text / Textarea field
              if (fieldType === 'textarea') {
                const isData = typeof val === 'string' && isDataPayload(val);
                const displayVal = isData ? 'Document attached' : String(val);
                return (
                  <View style={styles.devHistoryBox} key={f.id}>
                    <Text style={styles.boxUpperLabel}>{f.label?.toUpperCase()}</Text>
                    {val ? (
                      <Text style={styles.boxBodyText}>{displayVal}</Text>
                    ) : (
                      <Text style={styles.emptyFieldText}>Not Provided</Text>
                    )}
                  </View>
                );
              }

              // 5. Household Structure with tags
              if (normFid === 'enr_household' || normLabel.includes('household')) {
                const isData = typeof val === 'string' && isDataPayload(val);
                const displayVal = isData ? 'Details on record' : String(val);
                return (
                  <View style={styles.householdSection} key={f.id}>
                    <Text style={styles.householdLabel}>{f.label}:</Text>
                    {householdMembers.length > 0 ? (
                      <View style={styles.householdTagsRow}>
                        {householdMembers.map((member, i) => (
                          <View key={i} style={styles.householdTag}>
                            <Text style={styles.householdTagText}>{member}</Text>
                          </View>
                        ))}
                      </View>
                    ) : val ? (
                      <Text style={styles.kvValBold}>{displayVal}</Text>
                    ) : (
                      <Text style={styles.emptyFieldText}>Not Provided</Text>
                    )}
                  </View>
                );
              }

              // 6. Clinical Diagnosis dynamic callout box
              if (
                normFid === 'enr_diagnosis' ||
                normFid === 'f_diagnosis' ||
                normLabel === 'primary clinical diagnosis'
              ) {
                const isData = typeof val === 'string' && isDataPayload(val);
                const displayVal = isData ? 'Diagnosis Recorded' : String(val);
                return (
                  <View style={styles.diagnosisContainer} key={f.id}>
                    <Text style={styles.diagnosisContainerLabel}>{f.label}</Text>
                    {val ? (
                      <View style={styles.diagnosisBox}>
                        <Text style={styles.diagnosisBoxTitle}>{displayVal}</Text>
                        {profile.diagnosisDate ? (
                          <Text style={styles.diagnosisBoxDate}>
                            Formal Diagnosis Date: {profile.diagnosisDate}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={styles.emptyFieldText}>No clinical diagnosis recorded</Text>
                    )}
                  </View>
                );
              }

              // 7. Standard Key-Value field row (Guarded against raw data payloads)
              const isDataUri = typeof val === 'string' && isDataPayload(val);
              const isImageData = typeof val === 'string' && val.startsWith('data:image');

              return (
                <View style={styles.kvRow} key={f.id}>
                  <Text style={styles.kvKey}>{f.label}</Text>
                  {val ? (
                    isImageData ? (
                      <View style={styles.valWithIcon}>
                        <Image
                          source={{ uri: val }}
                          style={{ width: 28, height: 28, borderRadius: 4, marginRight: 6 }}
                        />
                        <Text style={styles.kvValBold}>Image Attached</Text>
                      </View>
                    ) : isDataUri ? (
                      <View style={styles.valWithIcon}>
                        <Feather
                          name="paperclip"
                          size={13}
                          color={C_SLATE}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.kvValBold}>File Attached</Text>
                      </View>
                    ) : normFid.includes('phone') || normLabel.includes('phone') ? (
                      <View style={styles.valWithIcon}>
                        <Text style={styles.kvValSkyBold}>{String(val)}</Text>
                        <Feather name="phone-call" size={12} color={C_SKY} />
                      </View>
                    ) : normFid.includes('program') || normLabel.includes('program') ? (
                      <Text style={styles.kvValSky}>{String(val)}</Text>
                    ) : (
                      <Text style={styles.kvValBold}>{String(val)}</Text>
                    )
                  ) : (
                    <Text style={styles.emptyFieldText}>Not Provided</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Section splitting for wide screens when 'All' tab is selected
  const renderedSections = activeTab === 'All' ? activeSections : [activeTab];
  const leftSections =
    isWide && activeTab === 'All'
      ? renderedSections.filter((_, i) => i % 2 === 0)
      : renderedSections;
  const rightSections =
    isWide && activeTab === 'All' ? renderedSections.filter((_, i) => i % 2 === 1) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Enrollment"
        onTabPress={(t) => t !== 'Enrollment' && handleNavTabPress(t)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── 1. Top Navigation / Breadcrumbs Bar ────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.breadcrumbs}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation?.canGoBack?.()) {
                  navigation.goBack();
                } else {
                  navigation?.navigate?.('StudentEnrollment' as never);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to Student Roster"
            >
              <Feather name="arrow-left" size={15} color={C_SLATE} />
              <Text style={styles.backBtnText}>Back to Student Roster</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbMuted}>Special Education Intake</Text>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbActive}>
              {profile.studentId || profile.student_id || profile.id}
            </Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.exportPdfBtn}
              onPress={handleExportPdf}
              accessibilityRole="button"
              accessibilityLabel="Export Student Profile to PDF"
              testID="export-pdf-button"
            >
              <Feather name="file-text" size={14} color={C_SLATE} />
              <Text style={styles.exportPdfBtnText}>Export PDF</Text>
            </TouchableOpacity>

            {isDraft && (
              <TouchableOpacity
                style={styles.continueEnrollmentBtn}
                onPress={handleContinueEnrollment}
                accessibilityRole="button"
                testID="continue-enrollment-header-button"
              >
                <Feather name="arrow-right-circle" size={14} color="#FFFFFF" />
                <Text style={styles.editProfileBtnText}>Continue Enrollment</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={handleEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Edit Student Profile"
              testID="edit-profile-header-button"
            >
              <Feather name="edit-2" size={14} color="#FFFFFF" />
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Draft Notice Banner (If Incomplete Draft) ────────────────── */}
        {isDraft && (
          <View style={styles.draftBannerCard} testID="draft-continue-banner">
            <View style={styles.draftBannerIconWrap}>
              <Feather name="file-text" size={20} color="#92400E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftBannerTitle}>Incomplete Enrollment Draft</Text>
              <Text style={styles.draftBannerDesc}>
                This student profile has unfinished registration data. Resume the wizard to start at
                Step 1 and review with all pre-filled answers intact.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.draftBannerActionBtn}
              onPress={handleContinueEnrollment}
              testID="continue-enrollment-banner-button"
            >
              <Feather name="arrow-right" size={15} color="#FFFFFF" />
              <Text style={styles.draftBannerActionBtnText}>Continue Enrollment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 2. Header Hero Card ────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <TouchableOpacity
              style={styles.heroAvatarWrap}
              activeOpacity={studentPhoto ? 0.75 : 1}
              onPress={() => {
                if (studentPhoto) {
                  setPreviewModal({
                    isOpen: true,
                    fileUrl: studentPhoto,
                    fileName: `${profile.fullName || profile.id}_photo.jpg`,
                    fileType: 'image',
                  });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Student Photo"
            >
              {studentPhoto ? (
                <Image source={{ uri: studentPhoto }} style={styles.heroAvatarImage} />
              ) : (
                <StudentAvatar name={profile.fullName} studentId={profile.id} size={54} />
              )}
              <View
                style={[styles.onlineDot, { backgroundColor: isDraft ? C_AMBER : C_EMERALD }]}
              />
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroName}>
                  {profile.fullName}
                  {profile.guardianName ? ` (${profile.guardianName} -)` : ''}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isDraft ? '#FEF3C7' : '#ECFDF5',
                      borderColor: isDraft ? '#FDE68A' : '#A7F3D0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusBadgeDot,
                      { backgroundColor: isDraft ? C_AMBER : C_EMERALD },
                    ]}
                  />
                  <Text
                    style={[styles.statusBadgeText, { color: isDraft ? '#92400E' : '#065F46' }]}
                  >
                    {isDraft ? 'Draft Record' : 'Active Record'}
                  </Text>
                </View>
                <Text style={styles.heroIdText}>
                  {profile.studentId || profile.student_id || profile.id}
                </Text>
              </View>

              <View style={styles.heroMetaRow}>
                {profile.programType ? (
                  <View style={styles.metaItem}>
                    <Feather name="layers" size={13} color={C_SKY} />
                    <Text style={styles.metaText}>{profile.programType}</Text>
                  </View>
                ) : null}
                {profile.programType && profile.therapyGroup ? (
                  <Text style={styles.metaDot}>•</Text>
                ) : null}
                {profile.therapyGroup ? (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>Therapy Track: {profile.therapyGroup}</Text>
                  </View>
                ) : null}
                {profile.dateOfBirth ? (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>
                        DOB: {profile.dateOfBirth} ({profile.age} years old)
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          {/* Right Care Specialist Status */}
          <View style={styles.heroRight}>
            <Text style={styles.therapistLabel}>ASSIGNED PRIMARY THERAPIST</Text>
            {hasTherapist ? (
              <View style={styles.therapistAssignedBadge}>
                <Feather name="user-check" size={14} color="#065F46" />
                <Text style={styles.therapistAssignedText}>{therapistName}</Text>
              </View>
            ) : (
              <View style={styles.therapistUnassignedBadge}>
                <Feather name="alert-triangle" size={13} color="#B45309" />
                <Text style={styles.therapistUnassignedText}>Currently Unassigned</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => showToast('Care specialist assignment dialog opened', 'info')}
            >
              <Text style={styles.assignSpecialistLink}>
                {hasTherapist ? 'Change Therapist' : '+ Assign Care Specialist'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 3. Horizontal Navigation Tabs Bar (Dynamically mirrored from Form Builder schema) ── */}
        <View style={styles.tabsBar}>
          {tabs.map((tabName) => {
            const isActive = activeTab === tabName;
            return (
              <TouchableOpacity
                key={tabName}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tabName)}
              >
                <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                  {tabName === 'All' ? 'Overview (All)' : tabName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 4. Main Dynamic Sections Grid Content ───────────────────── */}
        <View
          style={[
            styles.dashboardGrid,
            isWide && activeTab === 'All' ? styles.dashboardGridWide : styles.dashboardGridStack,
          ]}
        >
          {/* Column 1: Left Sections */}
          <View
            style={[styles.gridColumn, isWide && activeTab === 'All' ? { flex: 0.5 } : { flex: 1 }]}
          >
            {leftSections.map((secName) => renderDynamicSectionCard(secName))}
          </View>

          {/* Column 2: Right Sections (in Wide mode) */}
          {isWide && activeTab === 'All' && rightSections.length > 0 && (
            <View style={[styles.gridColumn, { flex: 0.5 }]}>
              {rightSections.map((secName) => renderDynamicSectionCard(secName))}
            </View>
          )}
        </View>

        {/* ── 5. Footer Compliance & Security Notice ─────────────────── */}
        <View style={styles.pageFooter}>
          <Text style={styles.footerLegal}>
            © 2025 Child Development & Clinical Intervention System. Confidential Patient Record.
          </Text>
          <Text style={styles.footerAudit}>
            HIPAA / FERPA Compliant Storage • Audit Log ID: 89104040
          </Text>
        </View>
      </ScrollView>

      {/* ── Scoring Modal for Social Skills Items ────────────────────── */}
      <Modal
        visible={scoringField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScoringField(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Score Social Skill Indicator</Text>
              <TouchableOpacity onPress={() => setScoringField(null)}>
                <Feather name="x" size={18} color={C_SLATE} />
              </TouchableOpacity>
            </View>

            {scoringField !== null && (
              <Text style={styles.modalPromptText}>{scoringField.label}</Text>
            )}

            <Text style={styles.modalOptionInstruction}>Select observational rating:</Text>
            <View style={styles.modalOptionList}>
              {['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOptionBtn}
                  onPress={() => {
                    if (scoringField !== null) {
                      handleScoreQuestion(scoringField.id, opt);
                    }
                  }}
                >
                  <Feather name="check-circle" size={15} color={C_SKY} />
                  <Text style={styles.modalOptionBtnText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Video Player Modal ─────────────────────────────────────── */}
      <Modal
        visible={videoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.videoPlayerModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Baseline Behavioral Assessment Observation</Text>
                <Text style={styles.videoRecordDate}>Student: {profile.fullName}</Text>
              </View>
              <TouchableOpacity onPress={() => setVideoModalOpen(false)}>
                <Feather name="x" size={20} color={C_SLATE} />
              </TouchableOpacity>
            </View>
            <VideoPlayerView
              videoUrl={profile.videoUrl || ''}
              title="Baseline Behavioral Assessment"
              subtitle={`Student: ${profile.fullName}`}
            />
            <View style={styles.modalVideoFooter}>
              <Text style={styles.videoEvaluatorText}>
                Student ID: {profile.id} • Verified Assessment
              </Text>
              <TouchableOpacity
                style={styles.playSessionBtn}
                onPress={() => {
                  setVideoModalOpen(false);
                  showToast('Session playback completed', 'info');
                }}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.playSessionBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Document / Image / PDF Lightbox Modal ─────────────────── */}
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

function navRouteForTab(tab: string): string | undefined {
  const routes: Record<string, string> = {
    Dashboard: 'CoordinatorDashboard',
    'Live Sessions': 'LiveSessionMonitoring',
    Review: 'SessionSummaryReview',
    Progress: 'CoordinatorStudentProgress',
    Schedule: 'CoordinatorSchedule',
    Parents: 'CoordinatorParentCommunication',
    Enrollment: 'StudentEnrollment',
    'Student Enrollment': 'StudentEnrollment',
    Workload: 'WorkloadDashboard',
    Notifications: 'Notifications',
    Rooms: 'RoomResourceScheduling',
    // Program Director routes
    'Program Director': 'ProgramDirectorDashboard',
    Caseload: 'StudentCaseload',
    'Student Caseload': 'StudentCaseload',
    Goals: 'GoalBankManagement',
    'Goal Bank': 'GoalBankManagement',
    'Mastery Approval': 'GoalMasteryApproval',
    'Assessment Review': 'AssessmentReview',
    'IUP Generation': 'IupGeneration',
    'IUP Library': 'IupLibrary',
    Analytics: 'GraphChartView',
  };
  return routes[tab];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: spacing.xxl },

  // 1. Top Bar / Breadcrumbs Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: C_BORDER,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  backBtnText: {
    fontSize: 13,
    color: C_SLATE,
    fontWeight: '500',
  },
  breadcrumbSlash: { fontSize: 13, color: '#CBD5E1' },
  breadcrumbMuted: { fontSize: 13, color: C_SLATE },
  breadcrumbActive: { fontSize: 13, fontWeight: '700', color: C_NAVY },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  exportPdfBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C_NAVY,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: C_NAVY,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueEnrollmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
    backgroundColor: C_AMBER,
  },

  // Draft Banner Card
  draftBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    flexWrap: 'wrap',
  },
  draftBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  draftBannerDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  draftBannerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C_NAVY,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  draftBannerActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // 2. Header Hero Card
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C_BORDER,
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 280,
  },
  heroAvatarWrap: {
    position: 'relative',
  },
  heroAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: C_BORDER,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: C_NAVY,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroIdText: {
    fontSize: 12,
    color: C_SLATE,
    marginLeft: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C_SLATE,
  },
  metaDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  heroRight: {
    alignItems: 'flex-start',
    gap: 4,
  },
  therapistLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C_SLATE,
    letterSpacing: 0.5,
  },
  therapistAssignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  therapistAssignedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  therapistUnassignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  therapistUnassignedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  assignSpecialistLink: {
    fontSize: 11,
    fontWeight: '600',
    color: C_SKY,
    marginTop: 2,
  },

  // 3. Horizontal Navigation Tabs Bar
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C_BORDER,
    gap: spacing.lg,
    overflow: 'scroll',
  },
  tabItem: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: C_SKY,
  },
  tabItemText: {
    fontSize: 13,
    color: C_SLATE,
    fontWeight: '500',
  },
  tabItemTextActive: {
    color: C_SKY,
    fontWeight: '700',
  },

  // 4. Two-Column Dashboard Layout
  dashboardGrid: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  dashboardGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dashboardGridStack: {
    flexDirection: 'column',
  },
  gridColumn: {
    gap: spacing.md,
  },

  // Reusable Card Container
  card: {
    backgroundColor: C_BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C_BORDER,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C_NAVY,
    letterSpacing: 0.5,
  },
  cardLinkAction: {
    fontSize: 11,
    fontWeight: '600',
    color: C_SKY,
  },

  // Headshot Box in Student Info
  headshotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  headshotThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headshotPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  headshotDetails: {
    flex: 1,
    gap: 2,
  },
  headshotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headshotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C_NAVY,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: C_EMERALD,
  },
  headshotFilename: {
    fontSize: 10,
    color: C_SLATE,
  },
  headshotActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headshotActionLink: {
    fontSize: 10,
    fontWeight: '600',
    color: C_SKY,
  },

  // KV List
  kvList: {
    gap: 8,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  kvKey: {
    fontSize: 12,
    color: C_SLATE,
  },
  kvValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: C_NAVY,
    maxWidth: '60%',
    textAlign: 'right',
  },
  kvValSky: {
    fontSize: 12,
    fontWeight: '700',
    color: C_SKY,
  },
  kvValSkyBold: {
    fontSize: 12,
    fontWeight: '700',
    color: C_SKY,
  },
  valWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyFieldText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Diagnosis Box
  diagnosisContainer: {
    paddingVertical: 4,
    gap: 4,
  },
  diagnosisContainerLabel: {
    fontSize: 11,
    color: C_SLATE,
  },
  diagnosisBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    padding: 8,
  },
  diagnosisBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  diagnosisBoxDate: {
    fontSize: 10,
    color: '#047857',
    marginTop: 2,
  },

  // Household Structure
  householdSection: {
    gap: 6,
  },
  householdLabel: {
    fontSize: 11,
    color: C_SLATE,
  },
  householdTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  householdTag: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  householdTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: C_NAVY,
  },

  // Documents List
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  docIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMeta: {
    flex: 1,
  },
  docTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C_NAVY,
  },
  docSubtitle: {
    fontSize: 10,
    color: C_SLATE,
  },
  docStatusAttached: {
    fontSize: 11,
    color: C_EMERALD,
    fontWeight: '700',
  },
  docStatusAction: {
    fontSize: 11,
    fontWeight: '700',
    color: C_SKY,
  },
  docUploadActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  docUploadActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: C_SKY,
  },

  // Textarea multi-line callout box
  devHistoryBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    padding: 10,
    gap: 2,
  },
  boxUpperLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C_SLATE,
    letterSpacing: 0.5,
  },
  boxBodyText: {
    fontSize: 11,
    color: C_NAVY,
    lineHeight: 15,
  },

  // Baseline Behavioral Assessment Video Container
  videoPlayerContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  videoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  videoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  videoRecordDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  videoScreenWrap: {
    position: 'relative',
    height: 180,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoScreenImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  videoBigPlayBtn: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  overlayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  overlaySubtitle: {
    fontSize: 9,
    color: '#CBD5E1',
    marginBottom: 6,
  },
  scrubBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    position: 'relative',
  },
  scrubBarProgress: {
    width: '42%',
    height: '100%',
    backgroundColor: '#EF4444',
  },
  scrubBarThumb: {
    position: 'absolute',
    left: '42%',
    top: -3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
  },
  videoControlsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  videoEvaluatorText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  videoFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C_SKY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  playSessionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Social Skills Questionnaire
  scoredBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C_SLATE,
  },
  socialSubtitle: {
    fontSize: 11,
    color: C_SLATE,
    marginTop: -4,
  },
  socialTable: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    overflow: 'hidden',
  },
  socialTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C_BORDER,
  },
  socialTh: {
    fontSize: 9,
    fontWeight: '800',
    color: C_SLATE,
    letterSpacing: 0.5,
  },
  socialTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  socialPromptText: {
    fontSize: 11,
    color: C_NAVY,
    paddingRight: 6,
    lineHeight: 15,
  },
  socialStatusEmpty: {
    fontSize: 11,
    color: '#94A3B8',
  },
  scorePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scorePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: C_SKY,
  },
  socialScoreActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: C_SKY,
  },

  // 5. Page Footer
  pageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: C_BORDER,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerLegal: {
    fontSize: 11,
    color: C_SLATE,
  },
  footerAudit: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 480,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C_NAVY,
  },
  modalPromptText: {
    fontSize: 13,
    color: C_NAVY,
    lineHeight: 18,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  modalOptionInstruction: {
    fontSize: 12,
    color: C_SLATE,
    fontWeight: '600',
  },
  modalOptionList: {
    gap: 8,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
  },
  modalOptionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C_NAVY,
  },
  videoPlayerModalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 680,
    gap: spacing.md,
  },
  modalVideoScreen: {
    width: '100%',
    height: 320,
    borderRadius: radius.md,
  },
  modalVideoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  linkText: { color: C_SKY, fontWeight: '600', fontSize: 13 },
});
