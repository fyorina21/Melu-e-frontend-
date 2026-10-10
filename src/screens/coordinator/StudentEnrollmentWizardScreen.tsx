import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
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
import { WizardHeader } from './components/WizardHeader';
import { WizardActionsFooter } from './components/WizardActionsFooter';
import {
  validateStep,
  buildReviewSections,
  buildCustomSectionEntries,
  buildRemainingCustomRows,
  prepareEnrollmentPayload,
} from './enrollmentWizardHelper';

export { calculateAge, getTherapyGroupAgeWarning };

type Props = NativeStackScreenProps<ProgramDirectorStackParamList, 'StudentEnrollmentWizard'>;

export default function StudentEnrollmentWizardScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
        setForm((prev) => ({
          ...prev,
          therapist: prev.therapist || available?.name || '',
        }));
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
    const result = validateStep(currentStep, form, formFields, customValues, isFull);
    if (!result.valid) {
      if (result.error) showToast(result.error, 'error');
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
    const payload = prepareEnrollmentPayload(form, customValues);
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

  const customSectionEntries = useMemo(
    () => buildCustomSectionEntries(activeCustomSections, formFields, customValues),
    [activeCustomSections, formFields, customValues],
  );

  const remainingCustomRows = useMemo(
    () => buildRemainingCustomRows(formFields, customValues),
    [formFields, customValues],
  );

  const reviewSections = useMemo(() => buildReviewSections(form), [form]);

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Enrollment"
        onTabPress={(t) => {
          const r = PD_ROUTE_BY_TAB[t];
          if (r) navigation?.navigate?.(r as never);
        }}
      />

      <WizardHeader />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.containerMaxWidth, isTablet && styles.containerMaxWidthTablet]}>
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

            <WizardActionsFooter
              step={step}
              totalSteps={steps.length}
              currentStepName={currentStep}
              nextStepName={steps[step + 1]}
              saving={saving}
              onPrev={() => setStep(step - 1)}
              onSaveProgress={saveProgress}
              onNext={next}
              onSubmit={handleSubmit}
            />
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
  content: { padding: spacing.xl, alignItems: 'stretch' },
  containerMaxWidth: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  containerMaxWidthTablet: {
    maxWidth: 1200,
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
  cardHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.2,
  },
  footer: {
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: { color: '#64748B', fontSize: 11, textAlign: 'center' },
});
