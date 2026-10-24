export interface WizardState {
  [key: string]: any;
  name: string;
  dob: string;
  gender: string;
  program: string;
  therapyGroup: string;
  photoUri?: string;
  photoBase64?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  emergencyContact?: string;
  diagnosis: string;
  medicalNotes: string;
  transportation?: string;
  therapist: string;
}

export const STEPS = [
  'Student Info',
  'Parent Info',
  'Medical Info',
  'Program Placement',
  'Assign Therapist',
  'Review',
];

export const PROGRAM_TYPES = ['Regular Morning', 'Regular Afternoon', 'Pulled Out'];
export const THERAPY_GROUPS = ['Basic', 'Functional Living'];
export const GENDERS = ['Female', 'Male', 'Other'];
export const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MAX_CASELOAD = 2;

export const INITIAL_STATE: WizardState = {
  name: '',
  dob: '',
  gender: 'Female',
  program: PROGRAM_TYPES[0],
  therapyGroup: THERAPY_GROUPS[0],
  photoUri: '',
  photoBase64: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  emergencyContact: '',
  diagnosis: '',
  medicalNotes: '',
  transportation: 'No',
  therapist: '',
};

export function calculateAge(dobIso: string): number | null {
  if (!dobIso) return null;
  const birthDate = new Date(dobIso);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function getTherapyGroupAgeWarning(therapyGroup: string, age: number | null): string | null {
  if (age === null) return null;
  const normalized = therapyGroup.toLowerCase();
  if (normalized.includes('basic')) {
    if (age < 3 || age > 12) {
      return `Basic group is recommended for ages 3–12 (Current age: ${age} yrs)`;
    }
  } else if (normalized.includes('functional')) {
    if (age < 13 || age > 19) {
      return `Functional Living Skill group is recommended for ages 13–19 (Current age: ${age} yrs)`;
    }
  }
  return null;
}
