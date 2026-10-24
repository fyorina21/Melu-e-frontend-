import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../../theme/colors';
import { typography } from '../../theme/typography';
import AppNavbar from '../../components/AppNavbar';
import ScreenLoader from '../../components/ScreenLoader';
import { useToast } from '../../context/ToastContext';
import {
  getStudentProfile,
  updateStudentProfile,
  getProgramOptions,
  getTherapyGroupOptions,
  getStatusOptions,
} from '../../api/coordinatorApi';
import { getEnrollmentDraft, saveEnrollmentDraft } from '../../utils/enrollmentDraftHelper';
import { calculateAge } from './enrollmentWizardTypes';

const C_SKY = '#0284C7';
const C_NAVY = '#0F172A';
const C_SLATE = '#64748B';
const C_BORDER = '#E2E8F0';
const C_BG_CARD = '#FFFFFF';
const C_EMERALD = '#10B981';
const C_AMBER = '#F59E0B';

type Props = NativeStackScreenProps<any, 'StudentEditProfile'>;

export default function StudentEditProfileScreen({ navigation, route }: Props) {
  const { showToast } = useToast();
  const studentId = route.params?.studentId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Field States
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [programType, setProgramType] = useState('Regular Morning');
  const [therapyGroup, setTherapyGroup] = useState('Basic');
  const [status, setStatus] = useState('Active');
  const [therapist, setTherapist] = useState('');

  // Parent / Household
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Mother');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [householdStructure, setHouseholdStructure] = useState('');

  // Clinical & Medical
  const [diagnosis, setDiagnosis] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [developmentalHistory, setDevelopmentalHistory] = useState('');
  const [transportation, setTransportation] = useState('No');

  // Reinforcers
  const [reinforcerVisual, setReinforcerVisual] = useState('');
  const [reinforcerAuditory, setReinforcerAuditory] = useState('');
  const [reinforcerTactile, setReinforcerTactile] = useState('');
  const [reinforcerKinetic, setReinforcerKinetic] = useState('');

  // Dynamic Options
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

  // Load available options
  useEffect(() => {
    getProgramOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setProgramOptions(opts.data))
      .catch(() => {});
    getTherapyGroupOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setTherapyOptions(opts.data))
      .catch(() => {});
    getStatusOptions()
      .then((opts) => opts?.data && opts.data.length > 0 && setStatusOptions(opts.data))
      .catch(() => {});
  }, []);

  // Load initial student data
  const loadData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const draft = getEnrollmentDraft(studentId);
      if (draft) {
        const formVals = draft.formValues || {};
        const first =
          draft.firstName ||
          formVals.enr_first_name ||
          formVals.childFirstName ||
          formVals.firstName ||
          '';
        const last =
          draft.lastName ||
          formVals.enr_last_name ||
          formVals.childLastName ||
          formVals.lastName ||
          '';
        const middle =
          draft.middleName || formVals.enr_middle_name || formVals.childMiddleName || '';

        setFirstName(first);
        setMiddleName(middle);
        setLastName(last);
        setDob(formVals.enr_dob || formVals.f2 || formVals.dob || '');
        setGender(formVals.enr_gender || formVals.f_gender || draft.gender || 'Male');
        setProgramType(
          formVals.enr_program_type || formVals.f_program || draft.program || 'Regular Morning',
        );
        setTherapyGroup(
          formVals.enr_therapy_group || formVals.f_therapy || draft.therapyGroup || 'Basic',
        );
        setStatus(draft.status || 'Draft');
        setTherapist(formVals.f_therapist || draft.therapist || '');

        setGuardianName(formVals.enr_guardian_name || formVals.f4 || '');
        setGuardianRelationship(formVals.enr_guardian_relationship || 'Mother');
        setGuardianPhone(formVals.enr_guardian_phone || formVals.f5 || '');
        setGuardianEmail(formVals.enr_guardian_email || formVals.f6 || '');
        setEmergencyContact(formVals.enr_emergency_contact || formVals.f9 || '');
        setHouseholdStructure(formVals.enr_household || '');

        setDiagnosis(formVals.enr_diagnosis || formVals.f_diagnosis || draft.diagnosis || '');
        setDiagnosisDate(formVals.enr_diagnosis_date || '');
        setMedicalNotes(formVals.enr_medical_restrictions || formVals.f7 || '');
        setDevelopmentalHistory(formVals.enr_dev_history || '');
        setTransportation(formVals.f8 || 'No');

        setReinforcerVisual(formVals.enr_reinforcer_visual || '');
        setReinforcerAuditory(formVals.enr_reinforcer_auditory || '');
        setReinforcerTactile(formVals.enr_reinforcer_tactile || '');
        setReinforcerKinetic(formVals.enr_reinforcer_kinetic || '');
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
        const full = data.fullName || data.name || '';
        const first =
          data.firstName || data.first_name || customObj.enr_first_name || full.split(' ')[0] || '';
        const last =
          data.lastName ||
          data.last_name ||
          customObj.enr_last_name ||
          full.split(' ').slice(1).join(' ') ||
          '';
        const middle = data.middleName || data.middle_name || customObj.enr_middle_name || '';

        setFirstName(first);
        setMiddleName(middle);
        setLastName(last);
        setDob(data.dateOfBirth || data.date_of_birth || customObj.enr_dob || '');
        setGender(data.gender || customObj.enr_gender || 'Male');
        setProgramType(data.programType || customObj.enr_program_type || 'Regular Morning');
        setTherapyGroup(data.therapyGroup || customObj.enr_therapy_group || 'Basic');
        setStatus(data.status || 'Active');
        setTherapist(data.therapist || customObj.f_therapist || '');

        setGuardianName(data.guardianName || customObj.enr_guardian_name || '');
        setGuardianRelationship(
          data.guardianRelationship || customObj.enr_guardian_relationship || 'Mother',
        );
        setGuardianPhone(data.guardianPhone || customObj.enr_guardian_phone || '');
        setGuardianEmail(data.guardianEmail || customObj.enr_guardian_email || '');
        setEmergencyContact(data.emergencyContact || customObj.enr_emergency_contact || '');
        setHouseholdStructure(data.householdStructure || customObj.enr_household || '');

        setDiagnosis(data.diagnosis || customObj.enr_diagnosis || '');
        setDiagnosisDate(data.diagnosisDate || customObj.enr_diagnosis_date || '');
        setMedicalNotes(data.medicalNotes || customObj.enr_medical_restrictions || '');
        setDevelopmentalHistory(data.developmentalHistory || customObj.enr_dev_history || '');
        setTransportation(data.transportation || customObj.f8 || 'No');

        setReinforcerVisual(data.reinforcerVisual || customObj.enr_reinforcer_visual || '');
        setReinforcerAuditory(data.reinforcerAuditory || customObj.enr_reinforcer_auditory || '');
        setReinforcerTactile(data.reinforcerTactile || customObj.enr_reinforcer_tactile || '');
        setReinforcerKinetic(data.reinforcerKinetic || customObj.enr_reinforcer_kinetic || '');
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

  const handleSave = async () => {
    if (!firstName.trim()) {
      showToast('Child First Name is required', 'error');
      return;
    }
    if (!lastName.trim()) {
      showToast('Child Last Name is required', 'error');
      return;
    }

    setSaving(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const computedAge = dob ? (calculateAge(dob) ?? 0) : 0;

    const payload = {
      firstName: firstName.trim(),
      first_name: firstName.trim(),
      childFirstName: firstName.trim(),
      child_first_name: firstName.trim(),
      enr_first_name: firstName.trim(),
      middleName: middleName.trim(),
      middle_name: middleName.trim(),
      childMiddleName: middleName.trim(),
      enr_middle_name: middleName.trim(),
      lastName: lastName.trim(),
      last_name: lastName.trim(),
      childLastName: lastName.trim(),
      enr_last_name: lastName.trim(),
      fullName,
      name: fullName,
      dateOfBirth: dob,
      date_of_birth: dob,
      age: computedAge,
      gender,
      programType,
      therapyGroup,
      status,
      therapist,
      guardianName: guardianName.trim(),
      guardianRelationship,
      guardianPhone: guardianPhone.trim(),
      guardianEmail: guardianEmail.trim(),
      emergencyContact: emergencyContact.trim(),
      householdStructure: householdStructure.trim(),
      diagnosis: diagnosis.trim(),
      diagnosisDate,
      medicalNotes: medicalNotes.trim(),
      developmentalHistory: developmentalHistory.trim(),
      transportation,
      reinforcerVisual,
      reinforcerAuditory,
      reinforcerTactile,
      reinforcerKinetic,
      custom_fields: {
        enr_first_name: firstName.trim(),
        enr_middle_name: middleName.trim(),
        enr_last_name: lastName.trim(),
        enr_dob: dob,
        enr_gender: gender,
        enr_program_type: programType,
        enr_therapy_group: therapyGroup,
        enr_guardian_name: guardianName.trim(),
        enr_guardian_relationship: guardianRelationship,
        enr_guardian_phone: guardianPhone.trim(),
        enr_guardian_email: guardianEmail.trim(),
        enr_emergency_contact: emergencyContact.trim(),
        enr_household: householdStructure.trim(),
        enr_diagnosis: diagnosis.trim(),
        enr_diagnosis_date: diagnosisDate,
        enr_medical_restrictions: medicalNotes.trim(),
        enr_dev_history: developmentalHistory.trim(),
        enr_reinforcer_visual: reinforcerVisual,
        enr_reinforcer_auditory: reinforcerAuditory,
        enr_reinforcer_tactile: reinforcerTactile,
        enr_reinforcer_kinetic: reinforcerKinetic,
      },
    };

    try {
      // If it's a local draft or starts with draft-
      const draft = getEnrollmentDraft(studentId);
      if (draft || String(studentId).startsWith('draft-')) {
        saveEnrollmentDraft(payload, draft?.step ?? 0, studentId);
        showToast('Draft profile updated successfully', 'success');
        navigation.navigate('StudentProfile', { studentId });
        return;
      }

      await updateStudentProfile(studentId, payload);
      showToast('Student profile updated successfully', 'success');
      navigation.navigate('StudentProfile', { studentId });
    } catch {
      showToast('Error saving profile changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ScreenLoader />;
  }

  const computedAge = dob ? calculateAge(dob) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppNavbar
        activeTab="Enrollment"
        onTabPress={(t) => t !== 'Enrollment' && navigation?.navigate?.(t as never)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header / Breadcrumbs */}
        <View style={styles.topBar}>
          <View style={styles.breadcrumbs}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Feather name="arrow-left" size={15} color={C_SLATE} />
              <Text style={styles.backBtnText}>Back to Profile</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbMuted}>Edit Student Profile</Text>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbActive}>{studentId}</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.openWizardBtn}
              onPress={() => navigation.navigate('StudentEnrollmentWizard', { draftId: studentId })}
              accessibilityRole="button"
            >
              <Feather name="layers" size={14} color={C_SKY} />
              <Text style={styles.openWizardBtnText}>Open Full Wizard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={15} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Section 1: Student Demographics */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={16} color={C_SKY} />
              <Text style={styles.cardTitle}>Student Personal Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Child First Name *</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="e.g. Dawit"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Middle Name</Text>
                <TextInput
                  style={styles.input}
                  value={middleName}
                  onChangeText={setMiddleName}
                  placeholder="e.g. Haile"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="e.g. Alemu"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Date of Birth (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="2019-05-12"
                  placeholderTextColor="#94A3B8"
                />
                {computedAge !== null && (
                  <Text style={styles.helperText}>Calculated Age: {computedAge} years old</Text>
                )}
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {['Male', 'Female'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, gender === g && styles.chipActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Lifecycle Status</Text>
                <View style={styles.chipRow}>
                  {statusOptions.map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.chip, status === st && styles.chipActive]}
                      onPress={() => setStatus(st)}
                    >
                      <Text style={[styles.chipText, status === st && styles.chipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Program Type</Text>
                <View style={styles.chipRow}>
                  {programOptions.map((prog) => (
                    <TouchableOpacity
                      key={prog}
                      style={[styles.chip, programType === prog && styles.chipActive]}
                      onPress={() => setProgramType(prog)}
                    >
                      <Text
                        style={[styles.chipText, programType === prog && styles.chipTextActive]}
                      >
                        {prog}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Therapy Group Track</Text>
                <View style={styles.chipRow}>
                  {therapyOptions.map((tg) => (
                    <TouchableOpacity
                      key={tg}
                      style={[styles.chip, therapyGroup === tg && styles.chipActive]}
                      onPress={() => setTherapyGroup(tg)}
                    >
                      <Text style={[styles.chipText, therapyGroup === tg && styles.chipTextActive]}>
                        {tg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Assigned Therapist</Text>
                <TextInput
                  style={styles.input}
                  value={therapist}
                  onChangeText={setTherapist}
                  placeholder="e.g. Sarah Jenkins"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Section 2: Family & Household Contacts */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="users" size={16} color={C_SKY} />
              <Text style={styles.cardTitle}>Parent & Household Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Primary Guardian Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={guardianName}
                  onChangeText={setGuardianName}
                  placeholder="e.g. Tigist Alemu"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Relationship to Child</Text>
                <TextInput
                  style={styles.input}
                  value={guardianRelationship}
                  onChangeText={setGuardianRelationship}
                  placeholder="e.g. Mother, Father, Grandparent"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Contact Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  placeholder="e.g. 0911002233"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Guardian Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={guardianEmail}
                  onChangeText={setGuardianEmail}
                  placeholder="e.g. guardian@example.com"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Emergency Secondary Contact</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  placeholder="e.g. Uncle Solomon (0922334455)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.fullCol}>
              <Text style={styles.label}>Household Structure & Co-habitants</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={householdStructure}
                onChangeText={setHouseholdStructure}
                placeholder="e.g. Father, Mother, 2 Older Siblings"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Section 3: Clinical & Medical Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="activity" size={16} color={C_SKY} />
              <Text style={styles.cardTitle}>Clinical & Medical Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Primary Clinical Diagnosis</Text>
                <TextInput
                  style={styles.input}
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="e.g. Autism Spectrum Disorder (ASD)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Date of Formal Diagnosis</Text>
                <TextInput
                  style={styles.input}
                  value={diagnosisDate}
                  onChangeText={setDiagnosisDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Transportation Assistance</Text>
                <View style={styles.chipRow}>
                  {['Yes', 'No'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, transportation === opt && styles.chipActive]}
                      onPress={() => setTransportation(opt)}
                    >
                      <Text
                        style={[styles.chipText, transportation === opt && styles.chipTextActive]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.fullCol}>
              <Text style={styles.label}>Medical Notes, Prescriptions & Dietary Restrictions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicalNotes}
                onChangeText={setMedicalNotes}
                placeholder="e.g. Peanut allergy, asthma inhaler as needed"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.fullCol}>
              <Text style={styles.label}>Developmental History</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={developmentalHistory}
                onChangeText={setDevelopmentalHistory}
                placeholder="e.g. Delayed speech onset at 3 years, walking at 14 months"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Section 4: Sensory & Behavioral Reinforcers */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="zap" size={16} color={C_SKY} />
              <Text style={styles.cardTitle}>Sensory & Behavioral Reinforcers</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Visual Reinforcers</Text>
                <TextInput
                  style={styles.input}
                  value={reinforcerVisual}
                  onChangeText={setReinforcerVisual}
                  placeholder="e.g. Colorful light tubes, spin wheels"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Auditory Reinforcers</Text>
                <TextInput
                  style={styles.input}
                  value={reinforcerAuditory}
                  onChangeText={setReinforcerAuditory}
                  placeholder="e.g. Nursery rhymes, xylophone"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Tactile Reinforcers</Text>
                <TextInput
                  style={styles.input}
                  value={reinforcerTactile}
                  onChangeText={setReinforcerTactile}
                  placeholder="e.g. Squishy toys, velvet pads"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.col}>
                <Text style={styles.label}>Kinetic & Movement Preferences</Text>
                <TextInput
                  style={styles.input}
                  value={reinforcerKinetic}
                  onChangeText={setReinforcerKinetic}
                  placeholder="e.g. Trampoline jumping, vestibular swing"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={15} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: C_BORDER,
    backgroundColor: '#FFFFFF',
    flexWrap: 'wrap',
    gap: 12,
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
  },
  backBtnText: {
    fontSize: 13,
    color: C_SLATE,
    fontWeight: '500',
  },
  breadcrumbSlash: {
    color: '#CBD5E1',
    fontSize: 13,
  },
  breadcrumbMuted: {
    fontSize: 13,
    color: C_SLATE,
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '600',
    color: C_NAVY,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  openWizardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  openWizardBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C_SKY,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C_SKY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 16,
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
  formContainer: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    padding: spacing.xl,
    gap: 20,
  },
  card: {
    backgroundColor: C_BG_CARD,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C_BORDER,
    padding: spacing.xl,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C_NAVY,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  col: {
    flex: 1,
    minWidth: 260,
    gap: 6,
  },
  fullCol: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#475569',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: C_BORDER,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: C_NAVY,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: C_SKY,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C_BORDER,
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    borderColor: C_SKY,
    backgroundColor: '#E0F2FE',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: C_SLATE,
  },
  chipTextActive: {
    color: C_SKY,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
  },
});
