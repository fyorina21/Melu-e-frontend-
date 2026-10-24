// src/utils/enrollmentDraftHelper.ts
//
// Persistent storage helper for managing in-progress student enrollment drafts.
// Enables saving half-filled enrollment forms and displaying them with a Draft tag
// in the Student Register / Roster.

import { storage } from './storage';
import { calculateAge } from '../screens/coordinator/enrollmentWizardTypes';

export interface EnrollmentDraftItem {
  id: string;
  name: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  age: number;
  gender: string;
  program: string;
  therapyGroup: string;
  therapist: string;
  diagnosis: string;
  photoUrl?: string | null;
  isDraft: true;
  status: 'Draft';
  formValues: Record<string, any>;
  step: number;
  currentStep?: string;
  savedAt: string;
  createdAt: string;
}

const ENROLLMENT_DRAFTS_KEY = 'melue_enrollment_drafts_v1';
const DRAFT_CHANGE_EVENT = 'melue_enrollment_drafts_changed';

/**
 * Returns all saved enrollment drafts, newest first.
 */
export function getEnrollmentDrafts(): EnrollmentDraftItem[] {
  return storage.getJSONSync<EnrollmentDraftItem[]>(ENROLLMENT_DRAFTS_KEY, []) || [];
}

/**
 * Finds a draft by its unique draft ID.
 */
export function getEnrollmentDraft(id: string): EnrollmentDraftItem | null {
  const drafts = getEnrollmentDrafts();
  return drafts.find((d) => d.id === id) || null;
}

/**
 * Saves or updates an in-progress enrollment draft.
 */
export function saveEnrollmentDraft(
  formValues: Record<string, any>,
  step: number = 0,
  existingDraftId?: string,
  currentStepName?: string,
): EnrollmentDraftItem {
  const drafts = getEnrollmentDrafts();
  const id = existingDraftId || `draft-${Date.now()}`;
  const now = new Date().toISOString();

  // Extract identifiable properties for display in student roster
  const findVal = (keyOrPattern: string | RegExp) => {
    if (typeof keyOrPattern === 'string') {
      return formValues[keyOrPattern] || '';
    }
    const matchingKey = Object.keys(formValues).find((k) => keyOrPattern.test(k));
    return matchingKey ? formValues[matchingKey] : '';
  };

  const rawFirstName =
    findVal('enr_first_name') ||
    findVal('childFirstName') ||
    findVal('child_first_name') ||
    findVal('firstName') ||
    findVal('first_name') ||
    findVal(/child.*first.*name|^first.*name$/i) ||
    formValues.childFirstName ||
    formValues.firstName ||
    formValues.first_name ||
    '';

  const rawLastName =
    findVal('enr_last_name') ||
    findVal('childLastName') ||
    findVal('child_last_name') ||
    findVal('lastName') ||
    findVal('last_name') ||
    findVal(/child.*last.*name|^last.*name$/i) ||
    formValues.childLastName ||
    formValues.lastName ||
    formValues.last_name ||
    '';

  const rawMiddleName =
    findVal('enr_middle_name') ||
    findVal('childMiddleName') ||
    findVal('child_middle_name') ||
    findVal('middleName') ||
    findVal('middle_name') ||
    findVal(/child.*middle.*name|^middle.*name$/i) ||
    formValues.childMiddleName ||
    formValues.middleName ||
    formValues.middle_name ||
    '';

  const rawName =
    (rawFirstName ? `${rawFirstName} ${rawLastName}`.trim() : '') ||
    findVal('f1') ||
    findVal(/student.*name|full.*name|^name$/i) ||
    (formValues.enr_first_name
      ? `${formValues.enr_first_name} ${formValues.enr_last_name || ''}`.trim()
      : '') ||
    (formValues.first_name
      ? `${formValues.first_name} ${formValues.last_name || ''}`.trim()
      : '') ||
    formValues.name ||
    formValues.fullName ||
    '';

  const name = String(rawName).trim() || 'Untitled Draft';
  const firstName = String(rawFirstName).trim() || name.split(' ')[0] || 'Draft';
  const lastName = String(rawLastName).trim() || name.split(' ').slice(1).join(' ') || '';
  const dob = String(
    findVal('f2') || findVal('enr_dob') || findVal(/birth|dob/i) || formValues.dob || '',
  ).trim();
  const age = dob ? (calculateAge(dob) ?? 0) : 0;
  const gender = String(
    findVal('f_gender') ||
      findVal('enr_gender') ||
      findVal(/gender/i) ||
      formValues.gender ||
      'Female',
  );
  const program = String(
    findVal('f_program') ||
      findVal('enr_program_type') ||
      findVal(/program/i) ||
      formValues.program ||
      'Regular',
  );
  const therapyGroup = String(
    findVal('f_therapy') ||
      findVal('enr_therapy_group') ||
      findVal(/therapy/i) ||
      formValues.therapyGroup ||
      'Basic',
  );
  const therapist = String(
    findVal('f_therapist') || findVal(/therapist/i) || formValues.therapist || 'Unassigned',
  );
  const diagnosis = String(
    findVal('f_diagnosis') ||
      findVal('enr_diagnosis') ||
      findVal(/diagnosis/i) ||
      formValues.diagnosis ||
      'Draft Enrollment',
  );
  const photoUrl =
    findVal('f_photo') ||
    findVal('enr_headshot') ||
    findVal(/photo|headshot/i) ||
    formValues.photoUri ||
    formValues.photoBase64 ||
    formValues.photo ||
    null;

  const existingIndex = drafts.findIndex((d) => d.id === id);
  const createdAt = existingIndex >= 0 ? drafts[existingIndex].createdAt : now;

  const draftItem: EnrollmentDraftItem = {
    id,
    name,
    fullName: name,
    firstName,
    lastName,
    middleName: rawMiddleName,
    age,
    gender,
    program,
    therapyGroup,
    therapist,
    diagnosis,
    photoUrl,
    isDraft: true,
    status: 'Draft',
    formValues: {
      ...formValues,
    },
    step,
    currentStep: currentStepName,
    savedAt: now,
    createdAt,
  };

  if (existingIndex >= 0) {
    drafts[existingIndex] = draftItem;
  } else {
    drafts.unshift(draftItem);
  }

  storage.setJSONSync(ENROLLMENT_DRAFTS_KEY, drafts);
  notifyDraftsChanged();

  return draftItem;
}

/**
 * Deletes an enrollment draft when discarded or finished.
 */
export function deleteEnrollmentDraft(id: string): void {
  const drafts = getEnrollmentDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  storage.setJSONSync(ENROLLMENT_DRAFTS_KEY, filtered);
  notifyDraftsChanged();
}

function notifyDraftsChanged() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(DRAFT_CHANGE_EVENT));
  }
}

/**
 * Subscribes to real-time changes to saved drafts.
 */
export function onEnrollmentDraftsChanged(callback: () => void): () => void {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener(DRAFT_CHANGE_EVENT, callback);
    return () => window.removeEventListener(DRAFT_CHANGE_EVENT, callback);
  }
  return () => {};
}
