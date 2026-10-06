import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import {
  getStaffOptions,
  getStudentOptions,
  type StaffOption,
  type StudentOption,
} from '../../api/optionsApi';
import { createStudentEnrollment } from '../../api/coordinatorApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import CameraCaptureModal from '../../components/CameraCaptureModal';
import { storage } from '../../utils/storage';
import type { ProgramDirectorStackParamList } from '../../types';

import {
  type WizardState,
  INITIAL_STATE,
  PHONE_RE,
  EMAIL_RE,
  MAX_CASELOAD,
  calculateAge,
  getTherapyGroupAgeWarning,
} from './enrollmentWizardTypes';
import { StepIndicator } from './components/StepIndicator';
import { StudentInfoStep } from './components/StudentInfoStep';
import { ParentInfoStep } from './components/ParentInfoStep';
import { MedicalInfoStep } from './components/MedicalInfoStep';
import { AssignTherapistStep } from './components/AssignTherapistStep';
import { CustomSectionStep } from './components/CustomSectionStep';
import { ReviewEnrollmentStep } from './components/ReviewEnrollmentStep';

export { calculateAge, getTherapyGroupAgeWarning };

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentEnrollmentWizard'>;

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
  const duplicateConfirmed = useRef(false);

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
      .then(({ data }) => setExistingStudents(data))
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
                  : /medical|allerg|doctor|health|insurance|medication|hospital|physician|diet/i.test(
                        f.label,
                      )
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
    }, [loadFormConfig]),
  );

  const isFieldVisible = (label: string, defaultVisible = true) => {
    const f = formFields.find(
      (item) => item.label?.toLowerCase().trim() === label.toLowerCase().trim(),
    );
    if (!f) return defaultVisible;
    return f.visible !== false;
  };

  const caseloadOf = (name: string) =>
    therapists.find((t) => t.name === name)?.assignedStudents?.length ?? 0;
  const isFull = (name: string) => caseloadOf(name) >= MAX_CASELOAD;

  const baseSteps = ['Student Info', 'Parent Info', 'Medical Info'];
  const activeBaseSteps = baseSteps.filter((s) => !deletedSections.includes(s));
  const activeCustomSections = customSections.filter((s) => !deletedSections.includes(s));
  const activeInfoTypes = [...activeBaseSteps, ...activeCustomSections];
  const steps = [...activeInfoTypes, 'Assign Therapist', 'Review'];
  const currentStep = steps[step] || steps[0] || 'Student Info';

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (currentStep === 'Student Info') {
      if (!form.name.trim()) {
        showToast('Student name is required', 'error');
        return;
      }
      if (!form.dob.trim()) {
        showToast('Date of birth is required', 'error');
        return;
      }
    }
    if (currentStep === 'Parent Info') {
      if (!form.parentName.trim()) {
        showToast('Parent name is required', 'error');
        return;
      }
      if (!form.parentPhone.trim()) {
        showToast('Parent phone is required', 'error');
        return;
      }
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
      if (!form.therapist) {
        showToast('Please pick a therapist', 'error');
        return;
      }
      if (isFull(form.therapist)) {
        showToast(
          `${form.therapist} is at maximum capacity (2 students). Choose another therapist.`,
          'error',
        );
        return;
      }
    }

    // Check required fields for custom info types or dynamic fields on current step
    const excludedForCurrentStep =
      currentStep === 'Student Info'
        ? ['Full Name', 'Student Full Name', 'Date of Birth', 'Gender', 'Program', 'Program Type']
        : currentStep === 'Parent Info'
          ? [
              'Parent / Guardian Name',
              'Parent Name',
              'Phone',
              'Parent Phone',
              'Email',
              'Parent Email',
            ]
          : currentStep === 'Medical Info'
            ? ['Diagnosis', 'Medical Notes']
            : [];

    const sectionRequiredFields = formFields.filter(
      (f) =>
        f.visible !== false &&
        f.required &&
        f.section?.toLowerCase().trim() === currentStep.toLowerCase().trim() &&
        !excludedForCurrentStep.some((ex) => ex.toLowerCase() === f.label.toLowerCase()),
    );
    const missing = sectionRequiredFields.filter((f) => {
      const val = customValues[f.id] ?? customValues[f.label];
      return (
        val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)
      );
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
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          set('photoBase64', `data:${mimeType};base64,${asset.base64}`);
        } else {
          set('photoBase64', asset.uri);
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
      storage.setSync(key, JSON.stringify(form));
      showToast('Draft stored locally on this device', 'success');
    } catch {
      showToast('This device does not support local drafts', 'error');
    }
  };

  const submitEnrollment = async () => {
    if (saving) return;
    setSaving(true);
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
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
      photo: form.photoBase64 || form.photoUri || '',
      photoBase64: form.photoBase64 || '',
      customFields: customValues,
    };
    try {
      await createStudentEnrollment(payload);
      showToast(`${form.name} enrolled in ${form.program}`, 'success');
      navigation?.navigate?.('AssessmentDashboard' as never);
    } catch {
      showToast('Could not save the enrollment. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
  const customSectionEntries: Array<{ title: string; rows: [string, string][] }> =
    activeCustomSections
      .map((sec) => {
        const secFields = formFields.filter(
          (f) =>
            f.section?.toLowerCase().trim() === sec.toLowerCase().trim() && f.visible !== false,
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

  const capturedKeys = new Set(formFields.map((f) => f.id).concat(formFields.map((f) => f.label)));
  const remainingCustomRows = Object.entries(customValues)
    .filter(([k, v]) => !capturedKeys.has(k) && v !== '' && v !== undefined && v !== false)
    .map(
      ([k, v]) => [k, typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)] as [string, string],
    );

  const calculatedAge = calculateAge(form.dob);

  const reviewSections: Array<{ title: string; rows: [string, string][] }> = [
    {
      title: 'Student',
      rows: [
        ['Full Name', form.name || '—'],
        ['Gender', form.gender || '—'],
        [
          'Date of Birth',
          form.dob
            ? `${form.dob}${calculatedAge !== null ? ` (${calculatedAge} years old)` : ''}`
            : '—',
        ],
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
      <AppNavbar
        activeTab="Enrollment"
        onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)}
      />

      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Enrollment Wizard</Text>
          <Text style={styles.headerSubtitle}>ABA Therapy Management — New Child Enrollment</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.containerMaxWidth}>
          <StepIndicator current={step} steps={steps} />

          <View style={styles.card}>
            <View style={styles.cardHeadingRow}>
              <Text style={styles.cardHeading}>
                Step {step + 1}: {currentStep}
              </Text>
            </View>

            {currentStep === 'Student Info' && (
              <StudentInfoStep
                form={form}
                set={set}
                isFieldVisible={isFieldVisible}
                onTakePhoto={handleTakePhoto}
                onChoosePhoto={handleChoosePhoto}
                onRemovePhoto={handleRemovePhoto}
                customValues={customValues}
                setCustomValues={setCustomValues}
                formFields={formFields}
              />
            )}

            {currentStep === 'Parent Info' && (
              <ParentInfoStep
                form={form}
                set={set}
                isFieldVisible={isFieldVisible}
                customValues={customValues}
                setCustomValues={setCustomValues}
                formFields={formFields}
              />
            )}

            {currentStep === 'Medical Info' && (
              <MedicalInfoStep
                form={form}
                set={set}
                isFieldVisible={isFieldVisible}
                customValues={customValues}
                setCustomValues={setCustomValues}
                formFields={formFields}
              />
            )}

            {![
              'Student Info',
              'Parent Info',
              'Medical Info',
              'Assign Therapist',
              'Review',
            ].includes(currentStep) && (
              <CustomSectionStep
                currentStep={currentStep}
                customValues={customValues}
                setCustomValues={setCustomValues}
                formFields={formFields}
              />
            )}

            {currentStep === 'Assign Therapist' && (
              <AssignTherapistStep form={form} set={set} therapists={therapists} />
            )}

            {currentStep === 'Review' && (
              <ReviewEnrollmentStep
                form={form}
                reviewSections={reviewSections}
                customSectionEntries={customSectionEntries}
                remainingCustomRows={remainingCustomRows}
              />
            )}

            <View style={styles.actionsRow}>
              {step > 0 && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setStep(step - 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Go to previous step"
                >
                  <Feather name="arrow-left" size={16} color={colors.navyText} />
                  <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={saveProgress}
                accessibilityRole="button"
                accessibilityLabel="Save enrollment progress"
              >
                <Feather name="bookmark" size={14} color={colors.navyText} />
                <Text style={styles.secondaryBtnText}>Save Progress</Text>
              </TouchableOpacity>
              {step < steps.length - 1 ? (
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={next}
                  accessibilityRole="button"
                  accessibilityLabel={`Proceed to next step: ${steps[step + 1] || 'Next'}`}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Feather name="arrow-right" size={16} color={colors.navyText} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={handleSubmit}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Finish and submit student enrollment"
                  accessibilityState={{ busy: saving, disabled: saving }}
                >
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
          set('photoUri', uri);
          set('photoBase64', b64 || uri);
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
  headerInner: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: { color: colors.navyText, fontSize: 20, fontWeight: 'bold', letterSpacing: 0.2 },
  headerSubtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  content: { padding: spacing.xl, alignItems: 'stretch' },
  containerMaxWidth: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeadingRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  cardHeading: { fontSize: 17, fontWeight: '700', color: '#1F2937', letterSpacing: 0.2 },
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
    backgroundColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  nextBtnText: { fontWeight: '700', color: '#1F2937' },
  footer: {
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: { color: '#64748B', fontSize: 11, textAlign: 'center' },
});
