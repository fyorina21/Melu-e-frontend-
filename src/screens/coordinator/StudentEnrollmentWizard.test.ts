import { describe, it, expect, vi } from 'vitest';

vi.mock('../../components/DobPicker', () => ({
  default: () => null,
}));

vi.mock('../../components/CameraCaptureModal', () => ({
  default: () => null,
}));

vi.mock('../../components/DynamicFormFields', () => ({
  default: () => null,
}));

vi.mock('../../components/AppNavbar', () => ({
  default: () => null,
}));

vi.mock('@expo/vector-icons', () => ({
  Feather: () => null,
  Ionicons: () => null,
  AntDesign: () => null,
}));

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  StyleSheet: { create: (s: any) => s },
  SafeAreaView: 'SafeAreaView',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Platform: { OS: 'web' },
}));

vi.mock('@react-navigation/native', () => ({
  useFocusEffect: vi.fn(),
}));

import { calculateAge, getTherapyGroupAgeWarning } from './StudentEnrollmentWizardScreen';
import { DEFAULT_ENROLLMENT_FORM } from '../../api/institutionalAdminApi';

describe('Student Enrollment Wizard Validation & Dynamic Fields', () => {
  it('has default enrollment form configured with dynamic fields', () => {
    expect(DEFAULT_ENROLLMENT_FORM.fields).toBeDefined();
    const programField = DEFAULT_ENROLLMENT_FORM.fields.find((f) => f.id === 'f_program');
    expect(programField).toBeDefined();
    expect(programField?.required).toBe(true);
    expect(programField?.options).toContain('Regular');
    expect(programField?.options).toContain('Pulled Out');
  });

  it('correctly calculates student age from DOB string', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 7;
    const dob = `${birthYear}-01-15`;
    const age = calculateAge(dob);
    expect(age).toBe(7);
  });

  it('returns appropriate age group warnings for Basic and Functional groups', () => {
    expect(getTherapyGroupAgeWarning('Basic', 2)).toContain('recommended for ages 3–12');
    expect(getTherapyGroupAgeWarning('Basic', 5)).toBeNull();
    expect(getTherapyGroupAgeWarning('Functional Living Skill', 10)).toContain('recommended for ages 13–19');
    expect(getTherapyGroupAgeWarning('Functional Living Skill', 15)).toBeNull();
  });

  it('detects invalid ages outside 3-19 years range', () => {
    const invalidDobAncient = '0666-06-06';
    const ageAncient = calculateAge(invalidDobAncient);
    expect(ageAncient).toBeGreaterThan(19);

    const infantDob = new Date();
    infantDob.setFullYear(infantDob.getFullYear() - 1);
    const ageInfant = calculateAge(infantDob.toISOString().slice(0, 10));
    expect(ageInfant).toBeLessThan(3);
  });

  it('resolves Program Type value correctly without triggering missing required error', () => {
    const form = {
      name: 'Aiden Rivera',
      dob: '2019-03-12',
      gender: 'Male',
      program: 'Regular',
      therapyGroup: 'Basic',
      parentName: 'Maria Rivera',
      parentPhone: '(555) 123-4567',
      parentEmail: 'maria@example.com',
      diagnosis: 'ASD',
      medicalNotes: '',
      therapist: 'Jane Doe',
    };
    const customValues: Record<string, any> = {};

    const resolveFieldValue = (field: any) => {
      const id = String(field.id || '').trim();
      const label = String(field.label || '').trim();
      const normLabel = label.toLowerCase();
      const normId = id.toLowerCase();

      if (customValues[id] !== undefined && customValues[id] !== null && customValues[id] !== '') {
        return customValues[id];
      }
      if (customValues[label] !== undefined && customValues[label] !== null && customValues[label] !== '') {
        return customValues[label];
      }
      if (normId === 'f_program' || /program/i.test(normId) || /program/i.test(normLabel)) {
        return form.program;
      }
      if (normId === 'f_gender' || /gender/i.test(normId) || /gender/i.test(normLabel)) {
        return form.gender;
      }
      return customValues[id] ?? customValues[label] ?? '';
    };

    const programField = DEFAULT_ENROLLMENT_FORM.fields.find((f) => f.id === 'f_program')!;
    const val = resolveFieldValue(programField);
    expect(val).toBe('Regular');

    const isMissing =
      val === undefined ||
      val === null ||
      (typeof val === 'string' && val.trim() === '') ||
      (Array.isArray(val) && val.length === 0);

    expect(isMissing).toBe(false);
  });
});
