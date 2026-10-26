// src/utils/enrollmentDraftHelper.ts
//
// Persistent storage helper for managing in-progress student enrollment drafts.
// Enables saving half-filled enrollment forms and displaying them with a Draft tag
// in the Student Register / Roster.

import { storage } from './storage';
import { calculateAge } from '../screens/coordinator/enrollmentWizardTypes';
import { secureRandomId } from './cryptoRandom';

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
  photo?: string | null;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
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

function serializeDraftForStorage(draft: EnrollmentDraftItem): any {
  if (!draft) return draft;
  const { gender, ...rest } = draft;
  return {
    ...rest,
    genderGroup: gender,
  };
}

function deserializeDraftFromStorage(stored: any): EnrollmentDraftItem {
  if (!stored) return stored;
  const { genderGroup, gender, ...rest } = stored;
  return {
    ...rest,
    gender: gender || genderGroup || 'Female',
  };
}

/**
 * Returns all saved enrollment drafts, newest first.
 */
export function getEnrollmentDrafts(): EnrollmentDraftItem[] {
  const rawList = storage.getJSONSync<any[]>(ENROLLMENT_DRAFTS_KEY, []) || [];
  return rawList.map(deserializeDraftFromStorage);
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
  const id = existingDraftId || secureRandomId('draft');
  const now = new Date().toISOString();

  const isDataPayload = (val: any) =>
    typeof val === 'string' &&
    (val.startsWith('data:') ||
      val.startsWith('blob:') ||
      (val.length > 256 && !val.includes(' ')));

  // Extract identifiable text properties for display in student roster (ignoring base64 media)
  const findTextVal = (keyOrPattern: string | RegExp) => {
    if (typeof keyOrPattern === 'string') {
      const v = formValues[keyOrPattern];
      return isDataPayload(v) ? '' : v || '';
    }
    const matchingKey = Object.keys(formValues).find((k) => keyOrPattern.test(k));
    if (matchingKey) {
      const v = formValues[matchingKey];
      return isDataPayload(v) ? '' : v || '';
    }
    return '';
  };

  // Find media / upload properties (permits data URLs)
  const findMediaVal = (keyOrPattern: string | RegExp) => {
    if (typeof keyOrPattern === 'string') {
      return formValues[keyOrPattern] || '';
    }
    const matchingKey = Object.keys(formValues).find((k) => keyOrPattern.test(k));
    return matchingKey ? formValues[matchingKey] : '';
  };

  const rawFirstName =
    findTextVal('enr_first_name') ||
    findTextVal('childFirstName') ||
    findTextVal('child_first_name') ||
    findTextVal('firstName') ||
    findTextVal('first_name') ||
    findTextVal(/child.*first.*name|^first.*name$/i) ||
    (isDataPayload(formValues.childFirstName) ? '' : formValues.childFirstName) ||
    (isDataPayload(formValues.firstName) ? '' : formValues.firstName) ||
    (isDataPayload(formValues.first_name) ? '' : formValues.first_name) ||
    '';

  const rawLastName =
    findTextVal('enr_last_name') ||
    findTextVal('childLastName') ||
    findTextVal('child_last_name') ||
    findTextVal('lastName') ||
    findTextVal('last_name') ||
    findTextVal(/child.*last.*name|^last.*name$/i) ||
    (isDataPayload(formValues.childLastName) ? '' : formValues.childLastName) ||
    (isDataPayload(formValues.lastName) ? '' : formValues.lastName) ||
    (isDataPayload(formValues.last_name) ? '' : formValues.last_name) ||
    '';

  const rawMiddleName =
    findTextVal('enr_middle_name') ||
    findTextVal('childMiddleName') ||
    findTextVal('child_middle_name') ||
    findTextVal('middleName') ||
    findTextVal('middle_name') ||
    findTextVal(/child.*middle.*name|^middle.*name$/i) ||
    (isDataPayload(formValues.childMiddleName) ? '' : formValues.childMiddleName) ||
    (isDataPayload(formValues.middleName) ? '' : formValues.middleName) ||
    (isDataPayload(formValues.middle_name) ? '' : formValues.middle_name) ||
    '';

  const rawName =
    (rawFirstName ? `${rawFirstName} ${rawLastName}`.trim() : '') ||
    findTextVal('f1') ||
    findTextVal(/^(student|child)_?(full_?)?name$|^full_?name$|^name$/i) ||
    (formValues.enr_first_name && !isDataPayload(formValues.enr_first_name)
      ? `${formValues.enr_first_name} ${formValues.enr_last_name || ''}`.trim()
      : '') ||
    (formValues.first_name && !isDataPayload(formValues.first_name)
      ? `${formValues.first_name} ${formValues.last_name || ''}`.trim()
      : '') ||
    (isDataPayload(formValues.name) ? '' : formValues.name) ||
    (isDataPayload(formValues.fullName) ? '' : formValues.fullName) ||
    '';

  const name = String(rawName).trim() || 'Untitled Draft';
  const firstName =
    String(rawFirstName).trim() || (name !== 'Untitled Draft' ? name.split(' ')[0] : 'Draft');
  const lastName =
    String(rawLastName).trim() ||
    (name !== 'Untitled Draft' ? name.split(' ').slice(1).join(' ') : '');
  const dob = String(
    findTextVal('f2') ||
      findTextVal('enr_dob') ||
      findTextVal(/birth|dob/i) ||
      formValues.dob ||
      '',
  ).trim();
  const age = dob ? (calculateAge(dob) ?? 0) : 0;
  const gender = String(
    formValues.gender || formValues.f_gender || formValues.enr_gender || 'Female',
  ).trim();
  const program = String(
    findTextVal('f_program') ||
      findTextVal('enr_program_type') ||
      findTextVal(/program/i) ||
      formValues.program ||
      'Regular',
  );
  const therapyGroup = String(
    findTextVal('f_therapy') ||
      findTextVal('enr_therapy_group') ||
      findTextVal(/therapy/i) ||
      formValues.therapyGroup ||
      'Basic',
  );
  const therapist = String(
    findTextVal('f_therapist') || findTextVal(/therapist/i) || formValues.therapist || 'Unassigned',
  );
  const diagnosis = String(
    findTextVal('f_diagnosis') ||
      findTextVal('enr_diagnosis') ||
      findTextVal(/diagnosis/i) ||
      formValues.diagnosis ||
      'Draft Enrollment',
  );
  const photoUrl =
    findMediaVal('f_photo') ||
    findMediaVal('enr_headshot') ||
    findMediaVal(/photo|headshot/i) ||
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

  storage.setJSONSync(ENROLLMENT_DRAFTS_KEY, drafts.map(serializeDraftForStorage));
  notifyDraftsChanged();

  return draftItem;
}

/**
 * Deletes an enrollment draft when discarded or finished.
 */
export function deleteEnrollmentDraft(id: string): void {
  const drafts = getEnrollmentDrafts();
  const filtered = drafts.filter((d) => d.id !== id);
  storage.setJSONSync(ENROLLMENT_DRAFTS_KEY, filtered.map(serializeDraftForStorage));
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
