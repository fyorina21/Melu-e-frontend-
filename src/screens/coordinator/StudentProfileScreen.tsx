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
import { calculateAge } from './enrollmentWizardTypes';
import { useToast } from '../../context/ToastContext';
import { exportStudentProfileToPdf } from '../../utils/studentProfilePdfHelper';
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

type TabKey =
  | 'all'
  | 'student_info'
  | 'parent_household'
  | 'medical_reinforcers'
  | 'social_skills'
  | 'documents_media';

export default function StudentProfileScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const studentId = route.params?.studentId;
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);

  // Scoring Modal State for Social Skills Table
  const [scoringQuestionIdx, setScoringQuestionIdx] = useState<number | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Helper to extract nested or alternate keys dynamically
  const extractVal = (obj: Record<string, any>, keys: string[], fallback: string = ''): string => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
        return String(obj[k]).trim();
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
          extractVal(formVals, [
            'enr_first_name',
            'childFirstName',
            'child_first_name',
            'firstName',
            'first_name',
          ]) ||
          draft.firstName ||
          (draft.fullName || draft.name || '').split(' ')[0] ||
          '';

        const rawLast =
          extractVal(formVals, [
            'enr_last_name',
            'childLastName',
            'child_last_name',
            'lastName',
            'last_name',
          ]) ||
          draft.lastName ||
          (draft.fullName || draft.name || '').split(' ').slice(1).join(' ') ||
          '';

        const rawMiddle =
          extractVal(formVals, [
            'enr_middle_name',
            'childMiddleName',
            'child_middle_name',
            'middleName',
            'middle_name',
          ]) ||
          draft.middleName ||
          '';

        const full =
          (rawFirst ? `${rawFirst} ${rawLast}`.trim() : '') ||
          draft.fullName ||
          draft.name ||
          extractVal(formVals, ['f1', 'fullName', 'name']) ||
          'Untitled Draft';

        const dob = extractVal(formVals, ['enr_dob', 'f2', 'dob', 'dateOfBirth', 'date_of_birth']);
        const age = dob ? (calculateAge(dob) ?? draft.age ?? 0) : (draft.age ?? 0);

        const draftProfile: StudentProfileData = {
          id: draft.id,
          fullName: full,
          firstName: rawFirst || full.split(' ')[0] || '',
          lastName: rawLast || full.split(' ').slice(1).join(' ') || '',
          middleName: rawMiddle,
          dateOfBirth: dob,
          age,
          programType: extractVal(formVals, [
            'enr_program_type',
            'f_program',
            'programType',
            'program',
          ]),
          therapyGroup: extractVal(formVals, [
            'enr_therapy_group',
            'f_therapy',
            'therapyGroup',
            'therapy_group',
          ]),
          status: 'Draft',
          headshotUrl: draft.photoUrl || formVals.enr_headshot || formVals.f_photo || null,
          photoUrl: draft.photoUrl || formVals.enr_headshot || formVals.f_photo || null,
          photo: draft.photoUrl || formVals.enr_headshot || formVals.f_photo || null,
          gender: extractVal(formVals, ['enr_gender', 'f_gender', 'gender']),
          guardianName: extractVal(formVals, [
            'enr_guardian_name',
            'f4',
            'guardianName',
            'guardian_name',
            'parentName',
          ]),
          guardianPhone: extractVal(formVals, [
            'enr_guardian_phone',
            'f5',
            'guardianPhone',
            'guardian_phone',
            'parentPhone',
          ]),
          guardianEmail: extractVal(formVals, [
            'enr_guardian_email',
            'f6',
            'guardianEmail',
            'guardian_email',
            'parentEmail',
          ]),
          guardianRelationship: extractVal(formVals, [
            'enr_guardian_relationship',
            'guardianRelationship',
            'relationship',
          ]),
          householdStructure: extractVal(formVals, [
            'enr_household',
            'household',
            'householdStructure',
            'household_structure',
          ]),
          emergencyContact: extractVal(formVals, [
            'enr_emergency_contact',
            'f9',
            'emergencyContact',
            'emergency_contact',
          ]),
          diagnosis: extractVal(formVals, ['enr_diagnosis', 'f_diagnosis', 'diagnosis']),
          diagnosisDate: extractVal(formVals, [
            'enr_diagnosis_date',
            'diagnosisDate',
            'diagnosis_date',
          ]),
          medicalNotes: extractVal(formVals, [
            'enr_medical_restrictions',
            'f7',
            'medicalNotes',
            'medical_notes',
          ]),
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
          transportation: extractVal(formVals, ['f8', 'transportation', 'transportation_required']),
          therapist:
            extractVal(formVals, ['f_therapist', 'therapist', 'assignedTherapist']) ||
            draft.therapist,
          currentFocusStudentGoalId: null,
          goals: [],
          customFields: formVals,
          formValues: formVals,
          birthCertificate: formVals.birthCertificate || formVals.birth_certificate,
          diagnosisPaper: formVals.diagnosisPaper || formVals.diagnosis_paper,
          agreement: formVals.agreement,
          videoUrl: extractVal(formVals, ['enr_baseline_video', 'videoUrl', 'video_url']),
          hasVideo: Boolean(formVals.enr_baseline_video || formVals.videoUrl || formVals.video_url),
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
          data.firstName ||
          data.first_name ||
          extractVal(customObj, [
            'enr_first_name',
            'childFirstName',
            'child_first_name',
            'firstName',
            'first_name',
          ]) ||
          (data.fullName || data.name || '').split(' ')[0] ||
          '';

        const rawLast =
          data.lastName ||
          data.last_name ||
          extractVal(customObj, [
            'enr_last_name',
            'childLastName',
            'child_last_name',
            'lastName',
            'last_name',
          ]) ||
          (data.fullName || data.name || '').split(' ').slice(1).join(' ') ||
          '';

        const rawMiddle =
          data.middleName ||
          data.middle_name ||
          extractVal(customObj, [
            'enr_middle_name',
            'childMiddleName',
            'child_middle_name',
            'middleName',
            'middle_name',
          ]) ||
          '';

        const full =
          data.fullName ||
          data.name ||
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

        const safeProfile: StudentProfileData = {
          id: data.id || sid,
          studentId: sid,
          student_id: sid,
          fullName: full,
          firstName: rawFirst || full.split(' ')[0] || '',
          lastName: rawLast || full.split(' ').slice(1).join(' ') || '',
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
          headshotUrl:
            data.headshotUrl || data.photoUrl || data.photo || customObj.enr_headshot || null,
          photoUrl:
            data.photoUrl || data.headshotUrl || data.photo || customObj.enr_headshot || null,
          photo: data.photo || data.photoUrl || data.headshotUrl || customObj.enr_headshot || null,
          gender: data.gender || extractVal(customObj, ['enr_gender', 'f_gender', 'gender']),
          guardianName:
            data.guardianName ||
            data.guardian_name ||
            data.parentName ||
            extractVal(customObj, ['enr_guardian_name', 'f4', 'guardianName', 'parentName']),
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
            data.birthCertificate || data.birth_certificate || customObj.birthCertificate,
          diagnosisPaper: data.diagnosisPaper || data.diagnosis_paper || customObj.diagnosisPaper,
          agreement: data.agreement || customObj.agreement,
          videoUrl:
            data.videoUrl ||
            data.video_url ||
            extractVal(customObj, ['enr_baseline_video', 'videoUrl']),
          hasVideo: Boolean(
            data.hasVideo || data.videoUrl || data.video_url || customObj.enr_baseline_video,
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

  // Parse Household members dynamically from saved string or array (hook must be called unconditionally)
  const householdMembers = useMemo(() => {
    const raw = profile?.householdStructure;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    return String(raw)
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [profile?.householdStructure]);

  // Handle Quick Scoring for Social Skills Items
  const handleScoreQuestion = (questionIdx: number, scoreVal: string) => {
    if (!profile) return;
    const fieldKey = `soc_q${questionIdx + 1}`;
    const updatedCustom = {
      ...(profile.customFields || {}),
      [fieldKey]: scoreVal,
    };
    setProfile({
      ...profile,
      customFields: updatedCustom,
      formValues: { ...(profile.formValues || {}), [fieldKey]: scoreVal },
    });
    setScoringQuestionIdx(null);
    showToast(`Updated Question ${questionIdx + 1} score to "${scoreVal}"`, 'success');

    // Persist to backend if not draft
    if (!isDraft) {
      updateStudentProfile(profile.id, { custom_fields: updatedCustom }).catch(() => {});
    }
  };

  const handleContinueEnrollment = () => {
    if (profile) {
      navigation?.navigate?.('StudentEnrollmentWizard', { draftId: profile.id });
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

  const handleUploadDocuments = () => {
    if (!profile) return;
    (navigation as any)?.navigate('StudentEnrollmentWizard', {
      draftId: profile.id,
      section: 'Medical Info',
    });
  };

  if (!studentId) {
    return (
      <SafeAreaView style={styles.safe}>
        <AppNavbar
          activeTab="Student Profile"
          onTabPress={(t) =>
            t !== 'Student Profile' && navigation?.navigate?.(navRouteForTab(t) as never)
          }
        />
        <View style={styles.emptyState}>
          <Feather name="user" size={40} color={colors.mutedText} />
          <Text style={typography.body}>No student selected.</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('StudentEnrollment')}>
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
          onTabPress={(t) =>
            t !== 'Student Profile' && navigation?.navigate?.(navRouteForTab(t) as never)
          }
        />
        <View style={styles.emptyState}>
          <Feather name="inbox" size={40} color={colors.mutedText} />
          <Text style={typography.body}>Profile not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return <ScreenLoader />;

  const isWide = windowWidth >= 960;
  const studentPhoto = profile.photoUrl || profile.headshotUrl || profile.photo;
  const therapistName = profile.therapist;
  const hasTherapist = Boolean(therapistName && therapistName !== 'Unassigned');

  // Count scored items in Social Skills Questionnaire
  const custom = { ...(profile.customFields || {}), ...(profile.formValues || {}) };
  const scoredCount = SOCIAL_SKILLS_PROMPTS.reduce((acc, _, idx) => {
    return custom[`soc_q${idx + 1}`] ? acc + 1 : acc;
  }, 0);

  // Check if reinforcers exist
  const hasAnyReinforcers = Boolean(
    profile.reinforcerVisual ||
    profile.reinforcerAuditory ||
    profile.reinforcerTactile ||
    profile.reinforcerKinetic,
  );

  // Tab visibility checks
  const showStudentInfo = activeTab === 'all' || activeTab === 'student_info';
  const showParentHousehold = activeTab === 'all' || activeTab === 'parent_household';
  const showMedicalReinforcers = activeTab === 'all' || activeTab === 'medical_reinforcers';
  const showSocialSkills = activeTab === 'all' || activeTab === 'social_skills';
  const showDocumentsMedia = activeTab === 'all' || activeTab === 'documents_media';

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Enrollment"
        onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(navRouteForTab(t) as never)}
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
            <View style={styles.heroAvatarWrap}>
              {studentPhoto ? (
                <Image source={{ uri: studentPhoto }} style={styles.heroAvatarImage} />
              ) : (
                <StudentAvatar name={profile.fullName} studentId={profile.id} size={54} />
              )}
              <View
                style={[styles.onlineDot, { backgroundColor: isDraft ? C_AMBER : C_EMERALD }]}
              />
            </View>

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

        {/* ── 3. Horizontal Navigation Tabs Bar ──────────────────────── */}
        <View style={styles.tabsBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabItemText, activeTab === 'all' && styles.tabItemTextActive]}>
              Overview (All)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'student_info' && styles.tabItemActive]}
            onPress={() => setActiveTab('student_info')}
          >
            <Text
              style={[styles.tabItemText, activeTab === 'student_info' && styles.tabItemTextActive]}
            >
              Student Information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'parent_household' && styles.tabItemActive]}
            onPress={() => setActiveTab('parent_household')}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'parent_household' && styles.tabItemTextActive,
              ]}
            >
              Parent & Household
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'medical_reinforcers' && styles.tabItemActive]}
            onPress={() => setActiveTab('medical_reinforcers')}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'medical_reinforcers' && styles.tabItemTextActive,
              ]}
            >
              Medical & Reinforcers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'social_skills' && styles.tabItemActive]}
            onPress={() => setActiveTab('social_skills')}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'social_skills' && styles.tabItemTextActive,
              ]}
            >
              Social Skills Checklist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'documents_media' && styles.tabItemActive]}
            onPress={() => setActiveTab('documents_media')}
          >
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'documents_media' && styles.tabItemTextActive,
              ]}
            >
              Documents & Media
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. Main Two-Column Dashboard Content ───────────────────── */}
        <View
          style={[
            styles.dashboardGrid,
            isWide && activeTab === 'all' ? styles.dashboardGridWide : styles.dashboardGridStack,
          ]}
        >
          {/* ════════ COLUMN 1: LEFT SIDE (STUDENT & HOUSEHOLD) ════════ */}
          {(showStudentInfo || showParentHousehold || showDocumentsMedia) && (
            <View
              style={[
                styles.gridColumn,
                isWide && activeTab === 'all' ? { flex: 0.38 } : { flex: 1 },
              ]}
            >
              {/* CARD 1: STUDENT INFO */}
              {showStudentInfo && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Feather name="user" size={15} color={C_SKY} />
                      <Text style={styles.cardTitle}>STUDENT INFO</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => showToast('Intake record verified', 'success')}
                    >
                      <Text style={styles.cardLinkAction}>Verified File</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Official Headshot row */}
                  <View style={styles.headshotBox}>
                    {studentPhoto ? (
                      <Image source={{ uri: studentPhoto }} style={styles.headshotThumb} />
                    ) : (
                      <View style={styles.headshotPlaceholder}>
                        <Feather name="user" size={24} color="#94A3B8" />
                      </View>
                    )}
                    <View style={styles.headshotDetails}>
                      <View style={styles.headshotTitleRow}>
                        <Text style={styles.headshotTitle}>Official Headshot</Text>
                        <View style={styles.verifiedPill}>
                          <Feather
                            name={studentPhoto ? 'check' : 'alert-circle'}
                            size={11}
                            color={studentPhoto ? C_EMERALD : C_AMBER}
                          />
                          <Text
                            style={[styles.verifiedPillText, !studentPhoto && { color: C_AMBER }]}
                          >
                            {studentPhoto ? 'Verified' : 'Not Uploaded'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.headshotFilename} numberOfLines={1}>
                        {studentPhoto ? `${profile.id}_photo.jpg` : 'No file on record'}
                      </Text>
                      <View style={styles.headshotActions}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation?.navigate?.('StudentEnrollmentWizard', {
                              draftId: profile.id,
                            })
                          }
                        >
                          <Text style={styles.headshotActionLink}>Update Photo</Text>
                        </TouchableOpacity>
                        {studentPhoto ? (
                          <>
                            <Text style={styles.metaDot}>•</Text>
                            <TouchableOpacity
                              onPress={() => showToast('Full photo viewer opened', 'info')}
                            >
                              <Text style={styles.headshotActionLink}>View Full Size</Text>
                            </TouchableOpacity>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Key Value Details */}
                  <View style={styles.kvList}>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Child First Name</Text>
                      <Text style={styles.kvValBold}>
                        {profile.firstName || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    {Boolean(profile.middleName) && (
                      <View style={styles.kvRow}>
                        <Text style={styles.kvKey}>Child Middle Name</Text>
                        <Text style={styles.kvValBold}>{profile.middleName}</Text>
                      </View>
                    )}
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Child Last Name</Text>
                      <Text style={styles.kvValBold}>
                        {profile.lastName || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Date of Birth</Text>
                      <Text style={styles.kvValBold}>
                        {profile.dateOfBirth ? (
                          `${profile.dateOfBirth} (${profile.age} years old)`
                        ) : (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Gender</Text>
                      <Text style={styles.kvValBold}>
                        {profile.gender || <Text style={styles.emptyFieldText}>Not Provided</Text>}
                      </Text>
                    </View>

                    {/* Primary Clinical Diagnosis Dynamic Box */}
                    <View style={styles.diagnosisContainer}>
                      <Text style={styles.diagnosisContainerLabel}>Primary Clinical Diagnosis</Text>
                      {profile.diagnosis ? (
                        <View style={styles.diagnosisBox}>
                          <Text style={styles.diagnosisBoxTitle}>{profile.diagnosis}</Text>
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

                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Placement Program</Text>
                      <Text style={styles.kvValSky}>
                        {profile.programType || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Therapy Group Track</Text>
                      <Text style={styles.kvValBold}>
                        {profile.therapyGroup || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* CARD 2: PARENT & HOUSEHOLD INFO */}
              {showParentHousehold && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Feather name="users" size={15} color={C_SKY} />
                      <Text style={styles.cardTitle}>PARENT & HOUSEHOLD INFO</Text>
                    </View>
                  </View>

                  {/* Household Structure & Co-Habitants */}
                  <View style={styles.householdSection}>
                    <Text style={styles.householdLabel}>Household Structure & Co-Habitants:</Text>
                    {householdMembers.length > 0 ? (
                      <View style={styles.householdTagsRow}>
                        {householdMembers.map((member, i) => (
                          <View key={i} style={styles.householdTag}>
                            <Text style={styles.householdTagText}>{member}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyFieldText}>Not Provided</Text>
                    )}
                  </View>

                  <View style={styles.kvList}>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Primary Parent / Guardian</Text>
                      <Text style={styles.kvValBold}>
                        {profile.guardianName || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Relationship to Child</Text>
                      <Text style={styles.kvValBold}>
                        {profile.guardianRelationship || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Primary Contact Telephone</Text>
                      {profile.guardianPhone ? (
                        <View style={styles.valWithIcon}>
                          <Text style={styles.kvValSkyBold}>{profile.guardianPhone}</Text>
                          <Feather name="phone-call" size={12} color={C_SKY} />
                        </View>
                      ) : (
                        <Text style={styles.emptyFieldText}>Not Provided</Text>
                      )}
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Guardian Email Address</Text>
                      <Text style={styles.kvValMuted}>
                        {profile.guardianEmail || (
                          <Text style={styles.emptyFieldText}>Not Provided (—)</Text>
                        )}
                      </Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={styles.kvKey}>Emergency Secondary Contact</Text>
                      <Text style={styles.kvValBold}>
                        {profile.emergencyContact || (
                          <Text style={styles.emptyFieldText}>Not Provided</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* CARD 3: UPLOADED DOCUMENTS & MEDIA */}
              {showDocumentsMedia && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Feather name="folder" size={15} color={C_SKY} />
                      <Text style={styles.cardTitle}>UPLOADED DOCUMENTS & MEDIA</Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleUploadDocuments}
                      accessibilityRole="button"
                      accessibilityLabel="Upload Documents in Enrollment Wizard"
                      testID="upload-documents-card-button"
                    >
                      <Text style={styles.cardLinkAction}>+ Upload</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.docList}>
                    {/* Birth Certificate */}
                    <TouchableOpacity
                      style={styles.docRow}
                      onPress={profile.birthCertificate ? undefined : handleUploadDocuments}
                      activeOpacity={profile.birthCertificate ? 1 : 0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Birth Certificate"
                    >
                      <View style={styles.docIconWrap}>
                        <Feather name="file-text" size={15} color={C_SLATE} />
                      </View>
                      <View style={styles.docMeta}>
                        <Text style={styles.docTitle}>Birth Certificate</Text>
                        <Text style={styles.docSubtitle}>Official proof of birth</Text>
                      </View>
                      {profile.birthCertificate ? (
                        <Text style={styles.docStatusAttached}>Attached</Text>
                      ) : (
                        <View style={styles.docUploadActionPill}>
                          <Feather name="upload" size={11} color={C_SKY} />
                          <Text style={styles.docUploadActionText}>Upload</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Diagnosis Documentation */}
                    <TouchableOpacity
                      style={styles.docRow}
                      onPress={profile.diagnosisPaper ? undefined : handleUploadDocuments}
                      activeOpacity={profile.diagnosisPaper ? 1 : 0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Diagnosis Documentation"
                    >
                      <View style={styles.docIconWrap}>
                        <Feather name="file-text" size={15} color={C_SLATE} />
                      </View>
                      <View style={styles.docMeta}>
                        <Text style={styles.docTitle}>Diagnosis Documentation</Text>
                        <Text style={styles.docSubtitle}>Hospital / Neuropsych report</Text>
                      </View>
                      {profile.diagnosisPaper ? (
                        <Text style={styles.docStatusAttached}>Attached</Text>
                      ) : (
                        <View style={styles.docUploadActionPill}>
                          <Feather name="upload" size={11} color={C_SKY} />
                          <Text style={styles.docUploadActionText}>Upload</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Enrollment Agreement */}
                    <TouchableOpacity
                      style={styles.docRow}
                      onPress={profile.agreement ? undefined : handleUploadDocuments}
                      activeOpacity={profile.agreement ? 1 : 0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Enrollment Agreement"
                    >
                      <View style={styles.docIconWrap}>
                        <Feather name="file-text" size={15} color={C_SLATE} />
                      </View>
                      <View style={styles.docMeta}>
                        <Text style={styles.docTitle}>Enrollment Agreement</Text>
                        <Text style={styles.docSubtitle}>Signed intake terms</Text>
                      </View>
                      {profile.agreement ? (
                        <Text style={styles.docStatusAttached}>Attached</Text>
                      ) : (
                        <View style={styles.docUploadActionPill}>
                          <Feather name="upload" size={11} color={C_SKY} />
                          <Text style={styles.docUploadActionText}>Upload</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Baseline Video */}
                    <View style={styles.docRow}>
                      <View style={styles.docIconWrap}>
                        <Feather name="video" size={15} color={C_SKY} />
                      </View>
                      <View style={styles.docMeta}>
                        <Text style={styles.docTitle}>Baseline Video</Text>
                        <Text style={styles.docSubtitle}>Behavioral intake assessment sample</Text>
                      </View>
                      {profile.videoUrl || profile.hasVideo ? (
                        <TouchableOpacity onPress={() => setVideoModalOpen(true)}>
                          <Text style={styles.docStatusAction}>View Recording</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.docUploadActionPill}
                          onPress={handleUploadDocuments}
                        >
                          <Feather name="upload" size={11} color={C_SKY} />
                          <Text style={styles.docUploadActionText}>Upload Video</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ════════ COLUMN 2: RIGHT SIDE (CLINICAL & ASSESSMENTS) ════════ */}
          {(showMedicalReinforcers || showSocialSkills) && (
            <View
              style={[
                styles.gridColumn,
                isWide && activeTab === 'all' ? { flex: 0.62 } : { flex: 1 },
              ]}
            >
              {/* CARD 4: MEDICAL & SENSORY REINFORCER PROFILE */}
              {showMedicalReinforcers && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <MaterialCommunityIcons name="stethoscope" size={17} color={C_SKY} />
                      <Text style={styles.cardTitle}>MEDICAL & SENSORY REINFORCER PROFILE</Text>
                    </View>
                    <Text style={styles.cardHeaderSubtitle}>Intake Clinical Assessment</Text>
                  </View>

                  {/* Developmental History & Medical Notes Split Boxes */}
                  <View style={styles.medSplitRow}>
                    {/* Developmental History Box */}
                    <View style={styles.devHistoryBox}>
                      <Text style={styles.boxUpperLabel}>DEVELOPMENTAL HISTORY</Text>
                      {profile.developmentalHistory ? (
                        <Text style={styles.boxBodyText}>{profile.developmentalHistory}</Text>
                      ) : (
                        <Text style={styles.emptyFieldText}>
                          No developmental history notes recorded during intake.
                        </Text>
                      )}
                    </View>

                    {/* Medical Notes & Prescriptions Box */}
                    <View
                      style={[styles.medAlertBox, !profile.medicalNotes && styles.medAlertBoxEmpty]}
                    >
                      <View style={styles.medAlertHeader}>
                        <Text
                          style={[
                            styles.boxUpperLabelAmber,
                            !profile.medicalNotes && { color: C_SLATE },
                          ]}
                        >
                          MEDICAL NOTES & RESTRICTIONS
                        </Text>
                      </View>
                      {profile.medicalNotes ? (
                        <Text style={styles.medAlertBodyText}>{profile.medicalNotes}</Text>
                      ) : (
                        <Text style={styles.emptyFieldText}>
                          No medical notes or dietary restrictions recorded.
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Reinforcer Sensitivity Breakdown */}
                  <View style={styles.reinforcerSection}>
                    <Text style={styles.reinforcerTitle}>REINFORCER SENSITIVITY BREAKDOWN</Text>

                    {hasAnyReinforcers ? (
                      <View style={styles.reinforcerGrid}>
                        {Boolean(profile.reinforcerVisual) && (
                          <View style={styles.reinforcerCard}>
                            <View style={styles.reinforcerCardHeader}>
                              <View style={styles.reinforcerDotTitle}>
                                <View style={[styles.dot, { backgroundColor: C_SKY }]} />
                                <Text style={styles.reinforcerName}>Visual Reinforcer</Text>
                              </View>
                              <View style={styles.optionPill}>
                                <Text style={styles.optionPillText}>Option A</Text>
                              </View>
                            </View>
                            <Text style={styles.reinforcerDesc}>{profile.reinforcerVisual}</Text>
                          </View>
                        )}

                        {Boolean(profile.reinforcerAuditory) && (
                          <View style={styles.reinforcerCard}>
                            <View style={styles.reinforcerCardHeader}>
                              <View style={styles.reinforcerDotTitle}>
                                <View style={[styles.dot, { backgroundColor: C_SKY }]} />
                                <Text style={styles.reinforcerName}>Auditory Reinforcer</Text>
                              </View>
                              <View style={styles.optionPill}>
                                <Text style={styles.optionPillText}>Option B</Text>
                              </View>
                            </View>
                            <Text style={styles.reinforcerDesc}>{profile.reinforcerAuditory}</Text>
                          </View>
                        )}

                        {Boolean(profile.reinforcerTactile) && (
                          <View style={styles.reinforcerCard}>
                            <View style={styles.reinforcerCardHeader}>
                              <View style={styles.reinforcerDotTitle}>
                                <View style={[styles.dot, { backgroundColor: C_EMERALD }]} />
                                <Text style={styles.reinforcerName}>Tactile Preference</Text>
                              </View>
                              <View style={styles.optionPill}>
                                <Text style={styles.optionPillText}>Option A</Text>
                              </View>
                            </View>
                            <Text style={styles.reinforcerDesc}>{profile.reinforcerTactile}</Text>
                          </View>
                        )}

                        {Boolean(profile.reinforcerKinetic) && (
                          <View style={styles.reinforcerCard}>
                            <View style={styles.reinforcerCardHeader}>
                              <View style={styles.reinforcerDotTitle}>
                                <View style={[styles.dot, { backgroundColor: C_PURPLE }]} />
                                <Text style={styles.reinforcerName}>Kinetic & Movement</Text>
                              </View>
                              <View style={styles.optionPill}>
                                <Text style={styles.optionPillText}>Option B</Text>
                              </View>
                            </View>
                            <Text style={styles.reinforcerDesc}>{profile.reinforcerKinetic}</Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.emptyCardBox}>
                        <Text style={styles.emptyFieldText}>
                          No sensory reinforcer sensitivities or preferences recorded during intake.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Baseline Behavioral Assessment Video Player Component (Only rendered if video exists) */}
                  {profile.videoUrl || profile.hasVideo ? (
                    <View style={styles.videoPlayerContainer}>
                      <View style={styles.videoHeaderRow}>
                        <View style={styles.videoHeaderLeft}>
                          <View style={[styles.dot, { backgroundColor: C_EMERALD }]} />
                          <Text style={styles.videoSectionTitle}>
                            Baseline Behavioral Assessment Video (HQ)
                          </Text>
                        </View>
                        <Text style={styles.videoRecordDate}>Assessment Recording</Text>
                      </View>

                      {/* Video Preview Box */}
                      <View style={styles.videoScreenWrap}>
                        <Image
                          source={{ uri: profile.videoUrl || '' }}
                          style={styles.videoScreenImage}
                        />
                        {/* Large Centered Play Button */}
                        <TouchableOpacity
                          style={styles.videoBigPlayBtn}
                          onPress={() => setVideoModalOpen(true)}
                          accessibilityRole="button"
                          accessibilityLabel="Play Assessment Video"
                        >
                          <Feather
                            name="play"
                            size={28}
                            color="#FFFFFF"
                            style={{ marginLeft: 3 }}
                          />
                        </TouchableOpacity>

                        {/* In-Video Bottom Overlay */}
                        <View style={styles.videoBottomOverlay}>
                          <Text style={styles.overlayTitle}>Behavioral Assessment Observation</Text>
                          <Text style={styles.overlaySubtitle}>
                            Activity Observation & Joint Attention Screening
                          </Text>
                          {/* Scrub Bar */}
                          <View style={styles.scrubBarTrack}>
                            <View style={styles.scrubBarProgress} />
                            <View style={styles.scrubBarThumb} />
                          </View>
                        </View>
                      </View>

                      {/* Video Info Footer Bar */}
                      <View style={styles.videoControlsFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.videoEvaluatorText}>
                            Student ID: {profile.id} • Protocol Intake Verification
                          </Text>
                        </View>
                        <View style={styles.videoFooterActions}>
                          <TouchableOpacity
                            style={styles.playSessionBtn}
                            onPress={() => setVideoModalOpen(true)}
                          >
                            <Feather name="play" size={13} color="#FFFFFF" />
                            <Text style={styles.playSessionBtnText}>Play Session</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyVideoBox}>
                      <Feather name="video-off" size={18} color="#94A3B8" />
                      <Text style={styles.emptyFieldText}>
                        No baseline behavioral assessment video uploaded for this student.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* CARD 5: SOCIAL SKILLS QUESTIONNAIRE TABLE */}
              {showSocialSkills && (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleWrap}>
                      <Feather name="clipboard" size={15} color={C_SKY} />
                      <Text style={styles.cardTitle}>SOCIAL SKILLS QUESTIONNAIRE</Text>
                    </View>
                    <View style={styles.scoredBadge}>
                      <Text style={styles.scoredBadgeText}>{scoredCount}/10 Sections Scored</Text>
                    </View>
                  </View>

                  <Text style={styles.socialSubtitle}>
                    Baseline behavioral screening metrics across peer socialization indicators
                  </Text>

                  {/* Assessment Table */}
                  <View style={styles.socialTable}>
                    {/* Table Header */}
                    <View style={styles.socialTableHeader}>
                      <Text style={[styles.socialTh, { flex: 0.72 }]}>
                        SKILL INDICATOR / ASSESSMENT PROMPT
                      </Text>
                      <Text style={[styles.socialTh, { flex: 0.16, textAlign: 'center' }]}>
                        STATUS
                      </Text>
                      <Text style={[styles.socialTh, { flex: 0.12, textAlign: 'right' }]}>
                        ACTION
                      </Text>
                    </View>

                    {/* 10 Assessment Prompts */}
                    {SOCIAL_SKILLS_PROMPTS.map((promptText, idx) => {
                      const fieldKey = `soc_q${idx + 1}`;
                      const scoreVal = custom[fieldKey];
                      const hasScore = Boolean(scoreVal && scoreVal !== '—');

                      return (
                        <View key={idx} style={styles.socialTableRow}>
                          <Text style={[styles.socialPromptText, { flex: 0.72 }]}>
                            {promptText}
                          </Text>
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
                            onPress={() => setScoringQuestionIdx(idx)}
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
              )}
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
        visible={scoringQuestionIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScoringQuestionIdx(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Score Social Skill Indicator</Text>
              <TouchableOpacity onPress={() => setScoringQuestionIdx(null)}>
                <Feather name="x" size={18} color={C_SLATE} />
              </TouchableOpacity>
            </View>

            {scoringQuestionIdx !== null && (
              <Text style={styles.modalPromptText}>
                {SOCIAL_SKILLS_PROMPTS[scoringQuestionIdx]}
              </Text>
            )}

            <Text style={styles.modalOptionInstruction}>Select observational rating:</Text>
            <View style={styles.modalOptionList}>
              {['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalOptionBtn}
                  onPress={() => {
                    if (scoringQuestionIdx !== null) {
                      handleScoreQuestion(scoringQuestionIdx, opt);
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
            {profile.videoUrl ? (
              <Image source={{ uri: profile.videoUrl }} style={styles.modalVideoScreen} />
            ) : (
              <View
                style={[
                  styles.modalVideoScreen,
                  { backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Feather name="video" size={40} color="#64748B" />
                <Text style={{ color: '#FFFFFF', marginTop: 8 }}>Session Recording Preview</Text>
              </View>
            )}
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
    </SafeAreaView>
  );
}

function navRouteForTab(tab: string): keyof CoordinatorStackParamList {
  return (
    {
      Dashboard: 'CoordinatorDashboard',
      'Live Sessions': 'LiveSessionMonitoring',
      Review: 'SessionSummaryReview',
      Progress: 'CoordinatorStudentProgress',
      Schedule: 'CoordinatorSchedule',
      Parents: 'CoordinatorParentCommunication',
      Enrollment: 'StudentEnrollment',
      Workload: 'WorkloadDashboard',
      Notifications: 'Notifications',
      Rooms: 'RoomResourceScheduling',
    } as Record<string, keyof CoordinatorStackParamList>
  )[tab];
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
  cardHeaderSubtitle: {
    fontSize: 11,
    color: C_SLATE,
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
  },
  kvValMuted: {
    fontSize: 12,
    color: '#94A3B8',
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
  docList: {
    gap: 8,
  },
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
  docStatusMuted: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
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

  // Split Row in Medical Card
  medSplitRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  devHistoryBox: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    padding: 10,
    gap: 2,
  },
  medAlertBox: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: 10,
    gap: 4,
  },
  medAlertBoxEmpty: {
    backgroundColor: '#F8FAFC',
    borderColor: C_BORDER,
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
  medAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxUpperLabelAmber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  medAlertBodyText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
  },

  // Reinforcer Sensitivity Breakdown
  reinforcerSection: {
    gap: 8,
  },
  reinforcerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: C_SLATE,
    letterSpacing: 0.5,
  },
  reinforcerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reinforcerCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    padding: 8,
    gap: 4,
  },
  reinforcerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reinforcerDotTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reinforcerName: {
    fontSize: 11,
    fontWeight: '700',
    color: C_NAVY,
  },
  optionPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  optionPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: C_SKY,
  },
  reinforcerDesc: {
    fontSize: 10,
    color: C_SLATE,
    lineHeight: 14,
  },
  emptyCardBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVideoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    padding: spacing.md,
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

  // Synthesis Box
  synthesisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  synthesisTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C_NAVY,
  },
  synthesisDesc: {
    fontSize: 11,
    color: C_SLATE,
    marginTop: 2,
  },
  generateAssessmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  generateAssessmentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C_NAVY,
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
