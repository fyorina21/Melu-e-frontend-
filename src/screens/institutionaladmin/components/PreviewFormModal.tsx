import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import DynamicFormFields from '../../../components/DynamicFormFields';
import type { FormField } from '../../../types';
import { calculateAge, getTherapyGroupAgeWarning } from '../../coordinator/enrollmentWizardTypes';

interface PreviewFormModalProps {
  visible: boolean;
  selectedForm: string;
  fields: FormField[];
  values: Record<string, any>;
  customSections?: string[];
  deletedSections?: string[];
  onChangeValue: (key: string, val: any) => void;
  onClose: () => void;
}

const DEFAULT_THERAPISTS = [
  { name: 'Sarah Jenkins', caseload: 1, maxCaseload: 2, specialty: 'Early Intervention' },
  { name: 'Marcus Vance', caseload: 0, maxCaseload: 2, specialty: 'Behavioral Support' },
  { name: 'Elena Rostova', caseload: 2, maxCaseload: 2, specialty: 'Functional Living' },
];

export const PreviewFormModal: React.FC<PreviewFormModalProps> = React.memo(
  ({
    visible,
    selectedForm,
    fields,
    values,
    customSections = [],
    deletedSections = [],
    onChangeValue,
    onClose,
  }) => {
    // Current step index within the preview
    const [step, setStep] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Reset step whenever modal opens or form changes
    useEffect(() => {
      if (visible) {
        setStep(0);
        setToastMessage(null);
      }
    }, [visible, selectedForm]);

    const showPreviewToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    };

    // Helper to get or set form value
    const getValue = (key: string, fallback: any = '') => {
      return values[key] !== undefined ? values[key] : fallback;
    };

    const setValue = (key: string, val: any) => {
      onChangeValue(key, val);
    };

    // Canonical steps for Enrollment Wizard preview
    const enrollmentSteps = useMemo(() => {
      const base = ['Student Info', 'Parent Info', 'Medical Info', 'Program Placement'];
      const custom = customSections.filter(
        (s) =>
          !base.some((b) => b.toLowerCase() === s.toLowerCase()) &&
          !['assign therapist', 'review', 'review & complete'].includes(s.toLowerCase()),
      );
      return [...base, ...custom, 'Assign Therapist', 'Review'].filter(
        (s) => !deletedSections.includes(s),
      );
    }, [customSections, deletedSections]);

    // Canonical steps for Assessment / other forms
    const genericSteps = useMemo(() => {
      const norm = selectedForm.toLowerCase();
      if (norm.includes('ablls')) {
        return [
          'Visual Performance',
          'Motor Imitation',
          'Vocal Imitation',
          'Receptive Language',
          'Requesting (Mands)',
          'Play and Leisure',
          'Social Interaction',
          'Writing',
          'Dressing',
          'General',
        ];
      }
      if (norm.includes('behavioral')) {
        return ['Incident Details', 'ABC Tracking', 'MASS', 'FAST', 'General'];
      }
      if (norm.includes('sensory')) {
        return ['Tactile', 'Visual & Auditory', 'Proprioception & Vestibular', 'General'];
      }
      if (norm.includes('preference')) {
        return ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement', 'General'];
      }
      if (norm.includes('social')) {
        return ['Social Interaction', 'Communication', 'Play & Leisure', 'General'];
      }
      if (norm.includes('incident')) {
        return ['ABC Incident Log', 'Summary & Actions'];
      }
      if (norm.includes('iup')) {
        return [
          'Student & Assessment Summary',
          'Reinforcement & Behavioral Strategies',
          'Target Goals & Milestones',
          'Review & Approvals',
        ];
      }

      // Fallback: derive from field sections
      const secSet = new Set<string>();
      fields.forEach((f) => {
        if (f.section) secSet.add(f.section);
      });
      const list = Array.from(secSet);
      return list.length > 0 ? list : ['General'];
    }, [selectedForm, fields]);

    const activeSteps = selectedForm === 'Enrollment Wizard' ? enrollmentSteps : genericSteps;
    const currentStepName = activeSteps[step] || activeSteps[0] || 'General';

    // Enrollment specific values
    const studentName = getValue('name', getValue('f1', 'Aiden Rivera'));
    const studentDob = getValue('dob', getValue('f2', '2021-02-15'));
    const studentGender = getValue('gender', getValue('f_gender', 'Male'));
    const studentProgram = getValue('program', getValue('f_program', 'Regular'));
    const studentTherapyGroup = getValue('therapyGroup', getValue('f_therapy', 'Basic'));
    const parentName = getValue('parentName', getValue('f4', 'Maria Rivera'));
    const parentPhone = getValue('parentPhone', getValue('f5', '(555) 234-5678'));
    const parentEmail = getValue('parentEmail', getValue('f6', 'maria.rivera@example.com'));
    const emergencyContact = getValue(
      'emergencyContact',
      getValue('f9', 'Carlos Rivera - (555) 987-6543'),
    );
    const diagnosis = getValue(
      'diagnosis',
      getValue('f_diagnosis', 'Autism Spectrum Disorder (Level 1)'),
    );
    const medicalNotes = getValue(
      'medicalNotes',
      getValue('f7', 'Mild peanut sensitivity. Responds well to sensory breaks.'),
    );
    const transportation = getValue('transportation', getValue('f8', 'Yes'));
    const assignedTherapist = getValue('therapist', getValue('f_therapist', 'Sarah Jenkins'));

    const calculatedAgeValue = calculateAge(studentDob);
    const ageWarning = getTherapyGroupAgeWarning(studentTherapyGroup, calculatedAgeValue);

    // Filter fields for current step
    const currentStepFields = useMemo(() => {
      return fields.filter(
        (f) =>
          f.visible !== false &&
          (f.section?.toLowerCase().trim() === currentStepName.toLowerCase().trim() ||
            (currentStepName === 'Program Placement' &&
              (f.id === 'f_program' || f.id === 'f_therapy'))),
      );
    }, [fields, currentStepName]);

    // Handle next step
    const handleNext = () => {
      if (step < activeSteps.length - 1) {
        setStep(step + 1);
      } else {
        showPreviewToast(`Enrollment complete! Preview verified successfully.`);
      }
    };

    const handleBack = () => {
      if (step > 0) {
        setStep(step - 1);
      }
    };

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Top Modal Header */}
            <View style={styles.topHeader}>
              <View style={styles.topHeaderTitleRow}>
                <View style={styles.previewBadge}>
                  <Feather name="eye" size={13} color="#0284C7" />
                  <Text style={styles.previewBadgeText}>LIVE USER VIEW</Text>
                </View>
                <Text style={styles.modalMainTitle}>{selectedForm}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeHeaderBtn}
                accessibilityRole="button"
                accessibilityLabel="Close live preview"
              >
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* In-Modal Toast Banner */}
            {toastMessage && (
              <View style={styles.toastBanner}>
                <Feather name="check-circle" size={14} color="#059669" />
                <Text style={styles.toastBannerText}>{toastMessage}</Text>
              </View>
            )}

            {/* Stepper Indicator */}
            <View style={styles.stepperContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.stepperScroll}
              >
                {activeSteps.map((st, idx) => {
                  const isDone = idx < step;
                  const isCurrent = idx === step;
                  return (
                    <TouchableOpacity
                      key={st + idx}
                      style={styles.stepItem}
                      onPress={() => setStep(idx)}
                    >
                      <View style={styles.stepCircleRow}>
                        <View
                          style={[
                            styles.stepCircle,
                            isDone && styles.stepCircleDone,
                            isCurrent && styles.stepCircleCurrent,
                          ]}
                        >
                          {isDone ? (
                            <Feather name="check" size={12} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={[
                                styles.stepCircleNum,
                                isCurrent && styles.stepCircleNumCurrent,
                              ]}
                            >
                              {idx + 1}
                            </Text>
                          )}
                        </View>
                        {idx < activeSteps.length - 1 && (
                          <View
                            style={[styles.stepConnector, isDone && styles.stepConnectorDone]}
                          />
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Content Body */}
            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.stepCard}>
                <View style={styles.stepCardHeader}>
                  <Text style={styles.stepCardHeaderTitle}>
                    Step {step + 1}: {currentStepName}
                  </Text>
                  <Text style={styles.stepCardHeaderSubtitle}>
                    {selectedForm === 'Enrollment Wizard'
                      ? 'Melue Foundation Clinical Intake & Registration'
                      : `Evaluating ${selectedForm} items`}
                  </Text>
                </View>

                {/* ============================================================== */}
                {/* ENROLLMENT WIZARD AUTHENTIC SCREENS */}
                {/* ============================================================== */}
                {selectedForm === 'Enrollment Wizard' && (
                  <View style={styles.formContentContainer}>
                    {/* Step 1: Student Info */}
                    {currentStepName === 'Student Info' && (
                      <View style={styles.sectionWrap}>
                        {/* Student Photo Card */}
                        <View style={styles.photoUploadCard}>
                          <Text style={styles.inputLabel}>Student Photo</Text>
                          <View style={styles.photoRow}>
                            <View style={styles.photoPlaceholder}>
                              <Feather name="user" size={36} color="#94A3B8" />
                            </View>
                            <View style={styles.photoActions}>
                              <TouchableOpacity
                                style={styles.cameraBtn}
                                onPress={() => showPreviewToast('Camera activated in live mode')}
                              >
                                <Feather name="camera" size={14} color="#FFFFFF" />
                                <Text style={styles.cameraBtnText}>Open Camera</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.uploadBtn}
                                onPress={() => showPreviewToast('Photo file selected')}
                              >
                                <Feather name="upload" size={14} color="#1E293B" />
                                <Text style={styles.uploadBtnText}>Upload Photo</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.hintText}>
                            Photo is used for the clinical attendance binder and ID badge.
                          </Text>
                        </View>

                        {/* Student Full Name */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Student Full Name <Text style={styles.star}>*</Text>
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={studentName}
                            onChangeText={(t) => setValue('name', t)}
                            placeholder="e.g. Aiden Rivera"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>

                        {/* Date of Birth & Calculated Age */}
                        <View style={styles.inputGroup}>
                          <View style={styles.labelRow}>
                            <Text style={styles.inputLabel}>
                              Date of Birth <Text style={styles.star}>*</Text>
                            </Text>
                            {calculatedAgeValue !== null && (
                              <View style={styles.ageBadge}>
                                <Feather name="calendar" size={11} color="#0284C7" />
                                <Text style={styles.ageBadgeText}>
                                  Calculated Age: {calculatedAgeValue} yrs
                                </Text>
                              </View>
                            )}
                          </View>
                          <TextInput
                            style={styles.textInput}
                            value={studentDob}
                            onChangeText={(t) => setValue('dob', t)}
                            placeholder="YYYY-MM-DD (e.g. 2021-02-15)"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>

                        {/* Gender Chips */}
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Gender <Text style={styles.star}>*</Text>
                          </Text>
                          <View style={styles.chipsRow}>
                            {['Female', 'Male', 'Other'].map((g) => {
                              const active = studentGender === g;
                              return (
                                <TouchableOpacity
                                  key={g}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setValue('gender', g)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {g}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Step 2: Parent Info */}
                    {currentStepName === 'Parent Info' && (
                      <View style={styles.sectionWrap}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Parent / Guardian Name <Text style={styles.star}>*</Text>
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={parentName}
                            onChangeText={(t) => setValue('parentName', t)}
                            placeholder="e.g. Maria Rivera"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Phone <Text style={styles.star}>*</Text>
                          </Text>
                          <TextInput
                            style={styles.textInput}
                            value={parentPhone}
                            onChangeText={(t) => setValue('parentPhone', t)}
                            placeholder="(555) 000-0000"
                            placeholderTextColor="#94A3B8"
                            keyboardType="phone-pad"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Email</Text>
                          <TextInput
                            style={styles.textInput}
                            value={parentEmail}
                            onChangeText={(t) => setValue('parentEmail', t)}
                            placeholder="guardian@example.com"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Emergency Contact</Text>
                          <TextInput
                            style={styles.textInput}
                            value={emergencyContact}
                            onChangeText={(t) => setValue('emergencyContact', t)}
                            placeholder="Name & Phone (e.g. Carlos Rivera - 555-987-6543)"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>
                      </View>
                    )}

                    {/* Step 3: Medical Info */}
                    {currentStepName === 'Medical Info' && (
                      <View style={styles.sectionWrap}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Diagnosis</Text>
                          <TextInput
                            style={styles.textInput}
                            value={diagnosis}
                            onChangeText={(t) => setValue('diagnosis', t)}
                            placeholder="e.g. Autism Spectrum Disorder (ASD)"
                            placeholderTextColor="#94A3B8"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Medical Notes & Allergies</Text>
                          <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={medicalNotes}
                            onChangeText={(t) => setValue('medicalNotes', t)}
                            placeholder="Enter any medical conditions, medication, or food sensitivities..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                          />
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Transportation Required</Text>
                          <View style={styles.chipsRow}>
                            {['Yes', 'No'].map((opt) => {
                              const active = transportation === opt;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setValue('transportation', opt)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {opt}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Step 4: Program Placement */}
                    {currentStepName === 'Program Placement' && (
                      <View style={styles.sectionWrap}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Program Type <Text style={styles.star}>*</Text>
                          </Text>
                          <View style={styles.chipsRow}>
                            {['Regular', 'Pulled Out'].map((p) => {
                              const active = studentProgram === p;
                              return (
                                <TouchableOpacity
                                  key={p}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setValue('program', p)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {p}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Therapy Group <Text style={styles.star}>*</Text>
                          </Text>
                          <View style={styles.chipsRow}>
                            {['Basic', 'Functional Living Skill'].map((tg) => {
                              const active = studentTherapyGroup === tg;
                              return (
                                <TouchableOpacity
                                  key={tg}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setValue('therapyGroup', tg)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                    {tg}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {ageWarning && (
                            <View style={styles.warningBox}>
                              <Feather name="alert-triangle" size={13} color="#D97706" />
                              <Text style={styles.warningText}>{ageWarning}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Step 5: Assign Therapist */}
                    {currentStepName === 'Assign Therapist' && (
                      <View style={styles.sectionWrap}>
                        <Text style={styles.therapistNotice}>
                          Each therapist can be assigned up to 2 active students at a time.
                        </Text>
                        <View style={styles.therapistList}>
                          {DEFAULT_THERAPISTS.map((t) => {
                            const isFull = t.caseload >= t.maxCaseload;
                            const isSelected = assignedTherapist === t.name;
                            return (
                              <TouchableOpacity
                                key={t.name}
                                disabled={isFull}
                                style={[
                                  styles.therapistCard,
                                  isSelected && styles.therapistCardSelected,
                                  isFull && styles.therapistCardFull,
                                ]}
                                onPress={() => setValue('therapist', t.name)}
                              >
                                <View style={styles.therapistCardLeft}>
                                  <View
                                    style={[
                                      styles.therapistAvatar,
                                      isSelected && styles.therapistAvatarSelected,
                                    ]}
                                  >
                                    <Feather
                                      name="user"
                                      size={16}
                                      color={isSelected ? '#FFFFFF' : '#475569'}
                                    />
                                  </View>
                                  <View>
                                    <Text
                                      style={[
                                        styles.therapistName,
                                        isSelected && styles.therapistNameSelected,
                                      ]}
                                    >
                                      {t.name}
                                    </Text>
                                    <Text style={styles.therapistSpecialty}>{t.specialty}</Text>
                                  </View>
                                </View>
                                <View style={styles.therapistCardRight}>
                                  <View
                                    style={[
                                      styles.caseloadBadge,
                                      isFull && styles.caseloadBadgeFull,
                                      isSelected && styles.caseloadBadgeSelected,
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.caseloadText,
                                        isSelected && styles.caseloadTextSelected,
                                      ]}
                                    >
                                      {t.caseload}/{t.maxCaseload} Active
                                    </Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Step 6: Review & Confirmation */}
                    {currentStepName === 'Review' && (
                      <View style={styles.sectionWrap}>
                        <Text style={styles.reviewHeading}>
                          Review student enrollment configuration prior to finalizing.
                        </Text>

                        {/* Summary Section: Student */}
                        <View style={styles.reviewCard}>
                          <Text style={styles.reviewSectionTitle}>STUDENT PROFILE</Text>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Full Name</Text>
                            <Text style={styles.reviewVal}>{studentName}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Date of Birth</Text>
                            <Text style={styles.reviewVal}>
                              {studentDob} ({calculatedAgeValue ?? '—'} yrs)
                            </Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Gender</Text>
                            <Text style={styles.reviewVal}>{studentGender}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Placement</Text>
                            <Text style={styles.reviewVal}>
                              {studentProgram} · {studentTherapyGroup}
                            </Text>
                          </View>
                        </View>

                        {/* Summary Section: Guardian */}
                        <View style={styles.reviewCard}>
                          <Text style={styles.reviewSectionTitle}>PARENT / GUARDIAN</Text>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Guardian</Text>
                            <Text style={styles.reviewVal}>{parentName}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Phone</Text>
                            <Text style={styles.reviewVal}>{parentPhone}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Email</Text>
                            <Text style={styles.reviewVal}>{parentEmail}</Text>
                          </View>
                        </View>

                        {/* Summary Section: Clinical */}
                        <View style={styles.reviewCard}>
                          <Text style={styles.reviewSectionTitle}>CLINICAL & PLACEMENT</Text>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Diagnosis</Text>
                            <Text style={styles.reviewVal}>{diagnosis}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Assigned Clinician</Text>
                            <Text style={styles.reviewVal}>{assignedTherapist}</Text>
                          </View>
                          <View style={styles.reviewRow}>
                            <Text style={styles.reviewLabel}>Transportation</Text>
                            <Text style={styles.reviewVal}>{transportation}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Any dynamically configured custom fields for this step */}
                    {currentStepFields.length > 0 &&
                      !['Assign Therapist', 'Review'].includes(currentStepName) && (
                        <View style={styles.customFieldsSection}>
                          <DynamicFormFields
                            formName={selectedForm}
                            section={currentStepName}
                            initialFields={currentStepFields}
                            values={values}
                            onChange={setValue}
                            excludeStandardLabels={[
                              'Student Full Name',
                              'Date of Birth',
                              'Gender',
                              'Parent / Guardian Name',
                              'Phone',
                              'Email',
                              'Emergency Contact',
                              'Diagnosis',
                              'Medical Notes',
                              'Transportation Required',
                              'Program Type',
                              'Therapy Group',
                            ]}
                          />
                        </View>
                      )}
                  </View>
                )}

                {/* ============================================================== */}
                {/* ASSESSMENT & OTHER FORMS AUTHENTIC VIEWS */}
                {/* ============================================================== */}
                {selectedForm !== 'Enrollment Wizard' && (
                  <View style={styles.formContentContainer}>
                    <View style={styles.assessmentDomainHeader}>
                      <View style={styles.domainBadge}>
                        <Feather name="folder" size={13} color="#0284C7" />
                        <Text style={styles.domainBadgeText}>Domain: {currentStepName}</Text>
                      </View>
                      <Text style={styles.domainFieldCount}>
                        {currentStepFields.length} active criteria items
                      </Text>
                    </View>

                    {currentStepFields.length === 0 ? (
                      <View style={styles.emptyDomainBox}>
                        <Feather name="info" size={18} color="#94A3B8" />
                        <Text style={styles.emptyDomainText}>
                          No items in "{currentStepName}". You can add fields to this domain in Form
                          Builder.
                        </Text>
                      </View>
                    ) : (
                      <DynamicFormFields
                        formName={selectedForm}
                        section={currentStepName}
                        initialFields={currentStepFields}
                        values={values}
                        onChange={setValue}
                      />
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Bottom Actions Row */}
            <View style={styles.modalFooter}>
              <View style={styles.footerLeft}>
                {step > 0 && (
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                    <Feather name="arrow-left" size={14} color="#1E293B" />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.footerRight}>
                <TouchableOpacity
                  style={styles.saveDraftBtn}
                  onPress={() => showPreviewToast('Draft saved in local session')}
                >
                  <Feather name="bookmark" size={13} color="#0284C7" />
                  <Text style={styles.saveDraftBtnText}>Save Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.nextBtnText}>
                    {step === activeSteps.length - 1 ? 'Finish Enrollment' : 'Next Step'}
                  </Text>
                  <Feather
                    name={step === activeSteps.length - 1 ? 'check' : 'arrow-right'}
                    size={14}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    width: '95%',
    maxWidth: 880,
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  modalMainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeHeaderBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  toastBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  stepperScroll: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 90,
  },
  stepCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  stepCircleCurrent: {
    backgroundColor: '#FCD34D',
    borderColor: '#D97706',
  },
  stepCircleNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCircleNumCurrent: {
    color: '#78350F',
  },
  stepConnector: {
    width: 32,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepConnectorDone: {
    backgroundColor: '#0284C7',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalScrollBody: {
    flex: 1,
    padding: spacing.lg,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  stepCardHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepCardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepCardHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formContentContainer: {
    padding: spacing.lg,
  },
  sectionWrap: {
    gap: spacing.md,
  },
  photoUploadCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  cameraBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  hintText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  star: {
    color: '#EF4444',
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.sm,
    padding: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#B45309',
    flex: 1,
  },
  therapistNotice: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  therapistList: {
    gap: 10,
  },
  therapistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
  },
  therapistCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  therapistCardFull: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  therapistCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  therapistAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  therapistAvatarSelected: {
    backgroundColor: '#0284C7',
  },
  therapistName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  therapistNameSelected: {
    color: '#0369A1',
  },
  therapistSpecialty: {
    fontSize: 11,
    color: '#64748B',
  },
  therapistCardRight: {},
  caseloadBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  caseloadBadgeFull: {
    backgroundColor: '#FEF2F2',
  },
  caseloadBadgeSelected: {
    backgroundColor: '#0284C7',
  },
  caseloadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  caseloadTextSelected: {
    color: '#FFFFFF',
  },
  reviewHeading: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
  reviewSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  customFieldsSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  assessmentDomainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  domainBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  domainFieldCount: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyDomainBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 8,
  },
  emptyDomainText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerLeft: {},
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  saveDraftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
