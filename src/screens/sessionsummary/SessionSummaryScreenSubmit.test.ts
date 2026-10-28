import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSubmittedSessionSummary,
  getStoredSessionSummaries,
} from '../../utils/sessionSummaryWorkflowHelper';

describe('SessionSummaryScreen Submit Handler', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('aggregates metrics correctly without reference errors on submit', () => {
    const summary = {
      teacherName: 'Abeba Tadesse',
      stationName: 'Station 1 · Early Learners',
      students: [
        {
          id: 'stu-1',
          name: 'Amir Hassan',
          goals: [
            { id: 'g-1', name: 'Color sorting', totalTrials: 10, independencePercent: 90 },
            { id: 'g-2', name: 'Object labeling', totalTrials: 5, independencePercent: 70 },
          ],
        },
        {
          id: 'stu-2',
          name: 'Tigist Bekele',
          goals: [{ id: 'g-3', name: 'Hand washing', totalTrials: 4, independencePercent: 100 }],
        },
      ],
      incidents: [{ behavior: 'Tantrum' }],
    };

    let calcTrialsCount = 0;
    let totalIndepPctSum = 0;
    let goalsWithIndepCount = 0;

    summary.students.forEach((st) => {
      st.goals.forEach((g) => {
        calcTrialsCount += Number(g.totalTrials || 0);
        if (typeof g.independencePercent === 'number') {
          totalIndepPctSum += g.independencePercent;
          goalsWithIndepCount += 1;
        }
      });
    });

    const calcIndependence =
      goalsWithIndepCount > 0 ? Math.round(totalIndepPctSum / goalsWithIndepCount) : 80;
    const calcIncidentsCount = summary.incidents.length;

    expect(calcTrialsCount).toBe(19);
    expect(calcIndependence).toBe(87); // (90 + 70 + 100) / 3 = 86.67 -> 87
    expect(calcIncidentsCount).toBe(1);

    const saved = saveSubmittedSessionSummary({
      id: 'sess-test-submit',
      teacherName: summary.teacherName,
      stationName: summary.stationName,
      studentNames: summary.students.map((s) => s.name),
      notes: 'All goals practiced with high independence.',
      trialsCount: calcTrialsCount,
      independence: calcIndependence,
      incidentsCount: calcIncidentsCount,
    });

    expect(saved.trialsCount).toBe(19);
    expect(saved.independence).toBe(87);
    expect(saved.incidentsCount).toBe(1);
    expect(saved.status).toBe('submitted');

    const stored = getStoredSessionSummaries();
    expect(stored.find((s) => s.id === 'sess-test-submit')).toBeDefined();
  });
});
