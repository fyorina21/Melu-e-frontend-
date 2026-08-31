import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DobPicker from '../../components/DobPicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import { PD_ROUTE_BY_TAB } from '../../components/appNavConfig';
import { useToast } from '../../context/ToastContext';
import { getStaffOptions, getStudentOptions, type StaffOption, type StudentOption } from '../../api/optionsApi';
import { createStudentEnrollment } from '../../api/coordinatorApi';
import DynamicFormFields from '../../components/DynamicFormFields';
import type { ProgramDirectorStackParamList, CoordinatorStackParamList } from '../../types';

const STEPS = ['Student Info', 'Parent Info', 'Medical Info', 'Assign Therapist', 'Review'];

const PROGRAMS = ['ABA', 'Speech Therapy', 'Occupational Therapy'];
const GENDERS = ['Female', 'Male', 'Other'];
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOB_PLACEHOLDER = new Date(2018, 0, 1);

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

function Field({ label, value, onChangeText, keyboardType, multiline }: { label: string; value: string; onChangeText: (t: string) => void; keyboardType?: 'phone-pad' | 'email-address'; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
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

  useEffect(() => {
    getStaffOptions()
      .then(({ data }) => {
        const teachers = data.filter((s) => s.role === 'teacher');
        setTherapists(teachers);
        setForm((prev) => ({ ...prev, therapist: prev.therapist || teachers[0]?.name || '' }));
      })
      .catch(() => setTherapists([]));
    getStudentOptions()
      .then(({ data }) => setExistingStudents(data))
      .catch(() => setExistingStudents([]));
  }, []);

  const therapistNames = therapists.map((t) => t.name);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (step === 0) {
      if (!form.name.trim()) { showToast('Student name is required', 'error'); return; }
    }
    if (step === 1) {
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
    duplicateConfirmed.current = false;
    if (step < STEPS.length - 1) setStep(step + 1);
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

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar activeTab="Enrollment" onTabPress={(t) => navigation?.navigate?.(PD_ROUTE_BY_TAB[t] as never)} />

      <View style={styles.header}>
        <Text style={typography.h1}>Enrollment Wizard</Text>
        <Text style={typography.caption}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepWrap}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              {i < step ? <Feather name="check" size={12} color={colors.navyText} /> : <Text style={styles.stepNum}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Student Information</Text>
            <Field label="Full Name" value={form.name} onChangeText={(t) => set('name', t)} />
            <View style={styles.field}>
              <Text style={typography.label}>Date of Birth</Text>
              <DobPicker
                value={form.dob ? new Date(`${form.dob}T00:00:00`) : DOB_PLACEHOLDER}
                maximumDate={new Date()}
                onChange={(iso) => set('dob', iso)}
              />
            </View>
            <View style={styles.field}><Text style={typography.label}>Gender</Text><Chips options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} /></View>
            <View style={styles.field}><Text style={typography.label}>Program</Text><Chips options={PROGRAMS} value={form.program} onChange={(v) => set('program', v)} /></View>

            <DynamicFormFields
              formName="Enrollment Wizard"
              section="Student Info"
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

        {step === 1 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Parent Information</Text>
            <Field label="Parent / Guardian Name" value={form.parentName} onChangeText={(t) => set('parentName', t)} />
            <Field label="Phone" value={form.parentPhone} onChangeText={(t) => set('parentPhone', t)} keyboardType="phone-pad" />
            <Field label="Email" value={form.parentEmail} onChangeText={(t) => set('parentEmail', t)} keyboardType="email-address" />

            <DynamicFormFields
              formName="Enrollment Wizard"
              section="Parent Info"
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

        {step === 2 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Medical Information</Text>
            <Field label="Diagnosis" value={form.diagnosis} onChangeText={(t) => set('diagnosis', t)} />
            <Field label="Medical Notes" value={form.medicalNotes} onChangeText={(t) => set('medicalNotes', t)} multiline />

            <DynamicFormFields
              formName="Enrollment Wizard"
              section="Medical Info"
              values={customValues}
              onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
              excludeStandardLabels={[
                'Diagnosis',
                'Medical Notes',
              ]}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Assign Therapist</Text>
            <View style={styles.field}><Text style={typography.label}>Therapist</Text>{therapistNames.length ? <Chips options={therapistNames} value={form.therapist} onChange={(v) => set('therapist', v)} /> : <Text style={typography.caption}>No therapists available.</Text>}</View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.card}>
            <Text style={typography.h3}>Review & Submit</Text>
            {[
              ['Student', `${form.name} · ${form.gender} · ${form.dob || 'n/a'}`],
              ['Program', form.program],
              ['Parent', `${form.parentName} · ${form.parentPhone} · ${form.parentEmail}`],
              ['Diagnosis', form.diagnosis || 'n/a'],
              ['Therapist', form.therapist],
              ...Object.entries(customValues).filter(([_, v]) => v !== '' && v !== undefined && v !== false).map(([k, v]) => [
                k,
                typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v),
              ]),
            ].map(([label, value]) => (
              <View key={label} style={styles.reviewRow}>
                <Text style={typography.label}>{label}</Text>
                <Text style={typography.body}>{value}</Text>
              </View>
            ))}
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
            <Text style={styles.secondaryBtnText}>Save Progress</Text>
          </TouchableOpacity>
          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Feather name="arrow-right" size={16} color={colors.navyText} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.navyText} />
              ) : (
                <Feather name="check" size={16} color={colors.navyText} />
              )}
              <Text style={styles.nextBtnText}>{saving ? 'Submitting…' : 'Finish Enrollment'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  header: { padding: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  progressRow: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepWrap: { flex: 1, alignItems: 'center', gap: spacing.xs },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgApp, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  stepNum: { fontSize: 11, fontWeight: '700', color: colors.mutedText },
  stepLabel: { fontSize: 9, color: colors.mutedText, textAlign: 'center' },
  stepLabelActive: { color: colors.navyText, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  field: { gap: spacing.xs },
  textInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.navyText, backgroundColor: colors.bgApp },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bgApp },
  chipSelected: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  chipTextSelected: { color: colors.navyText },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  docBlock: { borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  uploadActions: { flexDirection: 'row', gap: spacing.sm, paddingLeft: 32 },
  uploadBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  uploadBtnText: { fontSize: 11, fontWeight: '600', color: colors.navyText },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: 32, paddingVertical: 2 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.border, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
  checkboxChecked: { backgroundColor: colors.primaryYellow, borderColor: colors.primaryYellow },
  reviewRow: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  backBtn: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' },
  backBtnText: { fontWeight: '600', color: colors.navyText },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryBtnText: { fontWeight: '600', fontSize: 11, color: colors.navyText, textAlign: 'center' },
  nextBtn: { flex: 1, flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { flex: 2, flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontWeight: '700', color: colors.navyText },
});
