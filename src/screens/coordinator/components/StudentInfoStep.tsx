import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DobPicker from '../../../components/DobPicker';
import DynamicFormFields from '../../../components/DynamicFormFields';
import { colors, spacing } from '../../../theme/colors';
import {
  type WizardState,
  GENDERS,
  PROGRAM_TYPES,
  THERAPY_GROUPS,
  calculateAge,
  getTherapyGroupAgeWarning,
} from '../enrollmentWizardTypes';
import { ChipsGroup } from './ChipsGroup';
import { WizardField } from './WizardField';

interface StudentInfoStepProps {
  form: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  isFieldVisible: (label: string, defaultVisible?: boolean) => boolean;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
  onRemovePhoto: () => void;
  customValues: Record<string, any>;
  setCustomValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  formFields: any[];
}

export function StudentInfoStep({
  form,
  set,
  isFieldVisible,
  onTakePhoto,
  onChoosePhoto,
  onRemovePhoto,
  customValues,
  setCustomValues,
  formFields,
}: StudentInfoStepProps) {
  const age = calculateAge(form.dob);
  const ageWarning = getTherapyGroupAgeWarning(form.therapyGroup, age);

  return (
    <View style={styles.container}>
      {/* Student Photo Card */}
      {isFieldVisible('Student Photo') && isFieldVisible('Photo') && (
        <View style={styles.photoUploadCard}>
          <Text style={styles.fieldLabel}>Student Photo</Text>
          <View style={styles.photoRow}>
            <View style={styles.photoAvatarContainer}>
              {form.photoUri ? (
                <View style={styles.photoWrapper}>
                  <Image source={{ uri: form.photoUri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={onRemovePhoto}
                    accessibilityLabel="Remove photo"
                  >
                    <Feather name="x" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="user" size={32} color="#94A3B8" />
                </View>
              )}
            </View>

            <View style={styles.photoButtonContainer}>
              <TouchableOpacity style={styles.cameraBtn} onPress={onTakePhoto}>
                <Feather name="camera" size={15} color="#FFFFFF" />
                <Text style={styles.cameraBtnText}>Open Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadBtn} onPress={onChoosePhoto}>
                <Feather name="upload" size={15} color={colors.navyText} />
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.fieldHint}>
            Take a live picture with your camera or upload an image file from your device.
          </Text>
        </View>
      )}

      {isFieldVisible('Student Full Name') && isFieldVisible('Full Name') && (
        <WizardField
          required
          label="Student Full Name"
          value={form.name}
          onChangeText={(t) => set('name', t)}
          placeholder="e.g. Aiden Rivera"
        />
      )}

      {isFieldVisible('Date of Birth') && (
        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
              Date of Birth <Text style={styles.requiredStar}>*</Text>
            </Text>
            {form.dob && age !== null ? (
              <View style={styles.ageBadge}>
                <Feather name="calendar" size={12} color="#0284C7" />
                <Text style={styles.ageBadgeText}>
                  Calculated Age: {age} {age === 1 ? 'year' : 'years'} old
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.dobWrap}>
            <DobPicker
              value={form.dob || ''}
              maximumDate={new Date()}
              onChange={(iso) => set('dob', iso)}
            />
          </View>
        </View>
      )}

      {isFieldVisible('Gender') && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <ChipsGroup options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} />
        </View>
      )}

      {isFieldVisible('Program Type') && isFieldVisible('Program') && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Program Type</Text>
          <ChipsGroup
            options={PROGRAM_TYPES}
            value={form.program}
            onChange={(v) => set('program', v)}
          />
        </View>
      )}

      {isFieldVisible('Therapy Group') && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Therapy Group</Text>
          <ChipsGroup
            options={THERAPY_GROUPS}
            value={form.therapyGroup}
            onChange={(v) => set('therapyGroup', v)}
          />
          {ageWarning ? (
            <View style={styles.ageWarningBox}>
              <Feather name="info" size={13} color="#D97706" />
              <Text style={styles.ageWarningText}>{ageWarning}</Text>
            </View>
          ) : null}
        </View>
      )}

      <DynamicFormFields
        formName="Enrollment Wizard"
        section="Student Info"
        initialFields={formFields.length ? formFields : undefined}
        values={customValues}
        onChange={(key, val) => setCustomValues((prev) => ({ ...prev, [key]: val }))}
        excludeStandardLabels={[
          'Full Name',
          'Student Full Name',
          'Student Photo',
          'Photo',
          'Date of Birth',
          'Age',
          'Gender',
          'Program',
          'Program Type',
          'Therapy Group',
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  field: { gap: spacing.xs, marginBottom: spacing.md },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 2 },
  requiredStar: { color: '#DC2626', fontWeight: '700' },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  dobWrap: { paddingVertical: 2 },
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
  ageBadgeText: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
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
    marginTop: 6,
  },
  ageWarningText: { fontSize: 12, fontWeight: '600', color: '#92400E', flex: 1 },
  photoUploadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
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
    borderColor: '#38BDF8',
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
    backgroundColor: '#DC2626',
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
    elevation: 1,
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
  },
  uploadBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
});
