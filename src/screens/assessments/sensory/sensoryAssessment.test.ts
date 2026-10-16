import { describe, it, expect } from 'vitest';
import {
  calculateSensoryMetrics,
  INITIAL_ACTIVITIES,
  ENGAGEMENT_OPTIONS,
  REACTION_OPTIONS,
  type SensoryActivityItem,
} from './types';

describe('sensoryAssessment logic and metrics', () => {
  it('initializes with 12 standard sensory activities', () => {
    expect(INITIAL_ACTIVITIES.length).toBe(12);
    INITIAL_ACTIVITIES.forEach((item) => {
      expect(item.id.startsWith('SEN-')).toBe(true);
      expect(item.name).toBeTruthy();
    });
  });

  it('defines all standard engagement options', () => {
    expect(ENGAGEMENT_OPTIONS).toContain('Independent');
    expect(ENGAGEMENT_OPTIONS).toContain('Partial Physical Prompt');
    expect(ENGAGEMENT_OPTIONS).toContain('Full Physical Prompt');
    expect(ENGAGEMENT_OPTIONS).toContain('Not Applicable');
  });

  it('defines all standard reaction options', () => {
    expect(REACTION_OPTIONS).toContain('Enjoyed');
    expect(REACTION_OPTIONS).toContain('Neutral');
    expect(REACTION_OPTIONS).toContain('Refused');
    expect(REACTION_OPTIONS).toContain('Not Observed');
  });

  describe('calculateSensoryMetrics', () => {
    it('calculates 0% progress when no activities are scored', () => {
      const metrics = calculateSensoryMetrics(INITIAL_ACTIVITIES);
      expect(metrics.totalActivities).toBe(12);
      expect(metrics.scoredCount).toBe(0);
      expect(metrics.progressPercent).toBe(0);
      expect(metrics.engagementCounts['Independent']).toBe(0);
      expect(metrics.reactionCounts['Enjoyed']).toBe(0);
    });

    it('correctly aggregates scores and percentages', () => {
      const sample: SensoryActivityItem[] = [
        {
          id: 'SEN-001',
          name: 'Sand Play',
          engagementLevel: 'Independent',
          responseReaction: 'Enjoyed',
          remark: '',
        },
        {
          id: 'SEN-002',
          name: 'Water Play',
          engagementLevel: 'Partial Physical Prompt',
          responseReaction: 'Enjoyed',
          remark: '',
        },
        {
          id: 'SEN-003',
          name: 'Finger Painting',
          engagementLevel: 'Independent',
          responseReaction: 'Neutral',
          remark: '',
        },
        {
          id: 'SEN-004',
          name: 'Clay',
          remark: '',
        },
      ];

      const metrics = calculateSensoryMetrics(sample);
      expect(metrics.totalActivities).toBe(4);
      expect(metrics.scoredCount).toBe(3);
      expect(metrics.progressPercent).toBe(75);
      expect(metrics.engagementCounts['Independent']).toBe(2);
      expect(metrics.engagementCounts['Partial Physical Prompt']).toBe(1);
      expect(metrics.reactionCounts['Enjoyed']).toBe(2);
      expect(metrics.reactionCounts['Neutral']).toBe(1);
      expect(metrics.reactionCounts['Refused']).toBe(0);
    });
  });
});
