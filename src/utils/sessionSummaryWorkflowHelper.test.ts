import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSubmittedSessionSummary,
  getStoredSessionSummaries,
  approveSessionSummaryReview,
  rejectSessionSummaryReview,
} from './sessionSummaryWorkflowHelper';

describe('Session Summary Review Workflow', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('records teacher submitted summary with status submitted', () => {
    const summary = saveSubmittedSessionSummary({
      id: 'sum-101',
      sessionId: 'sess-101',
      teacherName: 'Abeba Tadesse',
      stationName: 'Station 1',
      studentNames: ['Amir Hassan', 'Tigist Bekele'],
      notes: 'Completed color matching goals successfully.',
      trialsCount: 28,
      independence: 85,
    });

    expect(summary.status).toBe('submitted');
    expect(summary.teacherName).toBe('Abeba Tadesse');
    expect(summary.studentNames).toContain('Amir Hassan');

    const all = getStoredSessionSummaries();
    expect(all.some((s) => s.id === 'sum-101')).toBe(true);
  });

  it('allows approving a submitted summary', () => {
    saveSubmittedSessionSummary({
      id: 'sum-102',
      teacherName: 'Dawit Bekele',
      studentNames: ['Saron Tekle'],
      notes: 'Good progress.',
    });

    const approved = approveSessionSummaryReview('sum-102', 'director', 'Excellent documentation');
    expect(approved?.status).toBe('approved');
    expect(approved?.directorNotes).toBe('Excellent documentation');
    expect(approved?.reviewerRole).toBe('director');
  });

  it('rejects summary and requires a rejection note', () => {
    saveSubmittedSessionSummary({
      id: 'sum-103',
      teacherName: 'Selam Tesfaye',
      studentNames: ['Yonas Girma'],
      notes: 'Trials done.',
    });

    // Failing to provide rejection reason throws an error
    expect(() => {
      rejectSessionSummaryReview('sum-103', '   ', 'director');
    }).toThrow(/Rejection reason is required/i);

    // Providing valid rejection note updates status to rejected
    const rejected = rejectSessionSummaryReview(
      'sum-103',
      'Please detail the prompt hierarchy used in trial 3.',
      'director',
    );
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejectionReason).toBe('Please detail the prompt hierarchy used in trial 3.');
  });
});
