import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DobPicker from '../../components/DobPicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import { getStaffOptions, getStudentOptions, type StaffOption, type StudentOption } from '../../api/optionsApi';
import { createStudentEnrollment } from '../../api/coordinatorApi';
import { getFormConfig } from '../../api/institutionalAdminApi';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';

const STEPS = ['Student Info', 'Parent Info', 'Medical Info', 'Assign Therapist', 'Review'];

const PROGRAMS = ['ABA', 'Speech Therapy', 'Occupational Therapy'];
const GENDERS = ['Female', 'Male', 'Other'];
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOB_PLACEHOLDER = new Date(2018, 0, 1);

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
  program: PROGRAMS[0],
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

  useEffect(() => {
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

  const saveProgress = () => {
    try {
      const key = `enrollment-draft-${form.name.trim().toLowerCase() || 'untitled'}`;
      localStorage.setItem(key, JSON.stringify(form));
      showToast('Draft stored locally on this device', 'success');
    } catch (err) {
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
      therapyGroup: '',
      gender: form.gender,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      parentEmail: form.parentEmail.trim(),
      diagnosis: form.diagnosis.trim(),
      medicalNotes: form.medicalNotes.trim(),
      documents: [],
      assignedTherapist: form.therapist,
      customFields: customValues,
    };
    try {
      await createStudentEnrollment(payload);
      showToast(`${form.name} enrolled in ${form.program}`, 'success');
      navigation?.goBack?.();
    } catch (err) {
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

  const reviewSections: Array<{ title: string; rows: [string, string][] }> = [
    {
      title: 'Student',
      rows: [
        ['Full Name', form.name || '—'],
        ['Gender', form.gender || '—'],
        ['Date of Birth', form.dob || '—'],
      ],
    },
    {
      title: 'Program',
      rows: [['Program', form.program || '—']],
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
              <Field label="Student Full Name" value={form.name} onChangeText={(t) => set('name', t)} placeholder="e.g. Aiden Rivera" />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <View style={styles.dobWrap}>
                  <DobPicker
                    value={form.dob ? new Date(`${form.dob}T00:00:00`) : DOB_PLACEHOLDER}
                    maximumDate={new Date()}
                    onChange={(iso) => set('dob', iso)}
                  />
                </View>
              </View>
              <View style={styles.field}><Text style={styles.fieldLabel}>Gender</Text><Chips options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} /></View>
              <View style={styles.field}><Text style={styles.fieldLabel}>Program</Text><Chips options={PROGRAMS} value={form.program} onChange={(v) => set('program', v)} /></View>

              <DynamicFormFields
                formName="Enrollment Wizard"
                section="Student Info"
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Full Name',
                  'Date of Birth',
                  'Gender',
                  'Program',
                  'Program Type',
                ]}
              />
            </View>
          )}

          {currentStep === 'Parent Info' && (
            <View style={styles.stepBody}>
              <Field required label="Parent / Guardian Name" value={form.parentName} onChangeText={(t) => set('parentName', t)} placeholder="e.g. Maria Rivera" />
              <Field required label="Phone" value={form.parentPhone} onChangeText={(t) => set('parentPhone', t)} keyboardType="phone-pad" maxWidth placeholder="(555) 000-0000" />
              <Field label="Email" value={form.parentEmail} onChangeText={(t) => set('parentEmail', t)} keyboardType="email-address" maxWidth placeholder="guardian@example.com" hint="Optional" />

              <DynamicFormFields
                formName="Enrollment Wizard"
                section="Parent Info"
                initialFields={formFields.length ? formFields : undefined}
                values={customValues}
                onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
                excludeStandardLabels={[
                  'Parent / Guardian Name',
                  'Parent Phone',
                  'Parent Email',
                ]}
              />
            </View>
          )}

          {currentStep === 'Medical Info' && (
            <View style={styles.stepBody}>
              <Field label="Diagnosis" value={form.diagnosis} onChangeText={(t) => set('diagnosis', t)} placeholder="e.g. Autism Spectrum Disorder" />
              <Field label="Medical Notes" value={form.medicalNotes} onChangeText={(t) => set('medicalNotes', t)} multiline placeholder="Enter any relevant medical notes..." />

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeadingRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: spacing.md, marginBottom: spacing.lg },
  cardHeading: { fontSize: 17, fontWeight: '700', color: '#1F2937', letterSpacing: 0.2 },

  stepBody: { gap: spacing.lg },

  field: { gap: spacing.xs },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C_INK, marginBottom: 2 },
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
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 1,
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