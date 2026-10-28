/**
 * sessionSummaryWorkflowHelper.ts
 *
 * Facilitates the end-to-end lifecycle of session summaries:
 * 1. Teacher submits end-of-session summary ("End & Submit" / "Submit & End Session").
 * 2. Director & Coordinator receive submitted session summaries for review.
 * 3. Director/Coordinator can Approve or Reject.
 * 4. On Reject, a reason/feedback note is strictly required.
 */

import { storage } from './storage';

export type SummaryReviewStatus = 'submitted' | 'approved' | 'rejected' | 'draft';

export interface StoredSessionSummaryReview {
  id: string;
  sessionId?: string;
  teacherName: string;
  stationName: string;
  roomName?: string;
  studentNames: string[];
  notes: string;
  trialsCount?: number;
  independence?: number;
  incidentsCount?: number;
  submittedAt: string;
  status: SummaryReviewStatus;
  reviewedAt?: string;
  reviewerRole?: 'director' | 'coordinator';
  rejectionReason?: string;
  directorNotes?: string;
}

const SUMMARY_REVIEWS_STORAGE_KEY = 'melue_session_summary_reviews_v1';

export function getStoredSessionSummaries(): StoredSessionSummaryReview[] {
  return storage.getJSONSync<StoredSessionSummaryReview[]>(SUMMARY_REVIEWS_STORAGE_KEY, []) || [];
}

export function saveSubmittedSessionSummary(summary: {
  id: string;
  sessionId?: string;
  teacherName: string;
  stationName?: string;
  roomName?: string;
  studentNames?: string[];
  notes: string;
  trialsCount?: number;
  independence?: number;
  incidentsCount?: number;
}): StoredSessionSummaryReview {
  const all = getStoredSessionSummaries();
  const existingIdx = all.findIndex(
    (s) => s.id === summary.id || (summary.sessionId && s.sessionId === summary.sessionId),
  );

  const entry: StoredSessionSummaryReview = {
    id: summary.id,
    sessionId: summary.sessionId,
    teacherName: summary.teacherName || 'Teacher',
    stationName: summary.stationName || 'Station 1',
    roomName: summary.roomName || 'Room 1',
    studentNames: summary.studentNames || [],
    notes: summary.notes || '',
    trialsCount: summary.trialsCount ?? 0,
    independence: summary.independence ?? 80,
    incidentsCount: summary.incidentsCount ?? 0,
    submittedAt: new Date().toISOString(),
    status: 'submitted',
  };

  if (existingIdx >= 0) {
    all[existingIdx] = { ...all[existingIdx], ...entry };
  } else {
    all.unshift(entry);
  }

  storage.setJSONSync(SUMMARY_REVIEWS_STORAGE_KEY, all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('melue_session_summaries_updated'));
  }

  return entry;
}

export function approveSessionSummaryReview(
  summaryId: string,
  reviewerRole: 'director' | 'coordinator' = 'director',
  notes?: string,
): StoredSessionSummaryReview | null {
  const all = getStoredSessionSummaries();
  const item = all.find((s) => s.id === summaryId || s.sessionId === summaryId);
  if (!item) return null;

  item.status = 'approved';
  item.reviewedAt = new Date().toISOString();
  item.reviewerRole = reviewerRole;
  item.directorNotes = notes || item.directorNotes;

  storage.setJSONSync(SUMMARY_REVIEWS_STORAGE_KEY, all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('melue_session_summaries_updated'));
  }

  return item;
}

export function rejectSessionSummaryReview(
  summaryId: string,
  rejectionReason: string,
  reviewerRole: 'director' | 'coordinator' = 'director',
  notes?: string,
): StoredSessionSummaryReview | null {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Rejection reason is required when rejecting a session summary.');
  }

  const all = getStoredSessionSummaries();
  const item = all.find((s) => s.id === summaryId || s.sessionId === summaryId);
  if (!item) return null;

  item.status = 'rejected';
  item.rejectionReason = rejectionReason.trim();
  item.directorNotes = notes || item.directorNotes;
  item.reviewedAt = new Date().toISOString();
  item.reviewerRole = reviewerRole;

  storage.setJSONSync(SUMMARY_REVIEWS_STORAGE_KEY, all);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('melue_session_summaries_updated'));
  }

  return item;
}
