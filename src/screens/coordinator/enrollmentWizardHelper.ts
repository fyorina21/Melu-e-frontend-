// src/screens/coordinator/enrollmentWizardHelper.ts

import { type WizardState, PHONE_RE, EMAIL_RE, calculateAge } from './enrollmentWizardTypes';

export function validateStep(
  currentStep: string,
  form: WizardState,
  formFields: any[],
  customValues: Record<string, any>,
  isTherapistFull: (name: string) => boolean,
): { valid: boolean; error?: string } {
  if (currentStep === 'Student Info') {
    if (!form.name.trim()) {
      return { valid: false, error: 'Student name is required' };
    }
    if (!form.dob.trim()) {
      return { valid: false, error: 'Date of birth is required' };
    }
  }

  if (currentStep === 'Parent Info') {
    if (!form.parentName.trim()) {
      return { valid: false, error: 'Parent name is required' };
    }
    if (!form.parentPhone.trim()) {
      return { valid: false, error: 'Parent phone is required' };
    }
    if (!PHONE_RE.test(form.parentPhone.trim())) {
      return {
        valid: false,
        error: 'Invalid phone (7-20 digits, spaces, ()/+ -)',
      };
    }
    if (form.parentEmail.trim() && !EMAIL_RE.test(form.parentEmail.trim())) {
      return { valid: false, error: 'Invalid parent email address' };
    }
  }

  if (currentStep === 'Assign Therapist') {
    if (!form.therapist) {
      return { valid: false, error: 'Please pick a therapist' };
    }
    if (isTherapistFull(form.therapist)) {
      return {
        valid: false,
        error: `${form.therapist} is at maximum capacity (2 students). Choose another therapist.`,
      };
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
    return {
      valid: false,
      error: `Please complete required field: ${missing[0].label}`,
    };
  }

  return { valid: true };
}

export function buildReviewSections(
  form: WizardState,
): Array<{ title: string; rows: [string, string][] }> {
  const calculatedAge = calculateAge(form.dob);

  return [
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
}

export function buildCustomSectionEntries(
  activeCustomSections: string[],
  formFields: any[],
  customValues: Record<string, any>,
): Array<{ title: string; rows: [string, string][] }> {
  return activeCustomSections
    .map((sec) => {
      const secFields = formFields.filter(
        (f) => f.section?.toLowerCase().trim() === sec.toLowerCase().trim() && f.visible !== false,
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
}

export function buildRemainingCustomRows(
  formFields: any[],
  customValues: Record<string, any>,
): [string, string][] {
  const capturedKeys = new Set(formFields.map((f) => f.id).concat(formFields.map((f) => f.label)));

  return Object.entries(customValues)
    .filter(([k, v]) => !capturedKeys.has(k) && v !== '' && v !== undefined && v !== false)
    .map(
      ([k, v]) => [k, typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)] as [string, string],
    );
}

export function prepareEnrollmentPayload(form: WizardState, customValues: Record<string, any>) {
  const [firstName, ...rest] = form.name.trim().split(/\s+/);
  return {
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
}
