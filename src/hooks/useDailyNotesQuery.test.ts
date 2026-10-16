import { describe, it, expect } from 'vitest';
import {
  DAILY_NOTES_KEYS,
  useDailyNotesQuery,
  useWeeklySummaryQuery,
  useTeacherDashboardQuery,
  useBehaviorAssessmentQuery,
  useResubmitNoteMutation,
} from './useDailyNotesQuery';

describe('useDailyNotesQuery', () => {
  it('generates correct query keys for daily notes cache', () => {
    expect(DAILY_NOTES_KEYS.dailyNotes()).toEqual(['dailyNotes', undefined]);
    expect(DAILY_NOTES_KEYS.dailyNotes({ date: '2026-10-09' })).toEqual([
      'dailyNotes',
      { date: '2026-10-09' },
    ]);
    expect(DAILY_NOTES_KEYS.weeklySummary).toEqual(['dailyNotes', 'weeklySummary']);
    expect(DAILY_NOTES_KEYS.teacherDashboard).toEqual(['teacherDashboard']);
    expect(DAILY_NOTES_KEYS.behaviorAssessment('stu-1')).toEqual(['behaviorAssessment', 'stu-1']);
  });

  it('exports hook functions properly', () => {
    expect(typeof useDailyNotesQuery).toBe('function');
    expect(typeof useWeeklySummaryQuery).toBe('function');
    expect(typeof useTeacherDashboardQuery).toBe('function');
    expect(typeof useBehaviorAssessmentQuery).toBe('function');
    expect(typeof useResubmitNoteMutation).toBe('function');
  });
});
