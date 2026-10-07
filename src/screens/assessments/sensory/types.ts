export type EngagementLevel =
  'Independent' | 'Partial Physical Prompt' | 'Full Physical Prompt' | 'Not Applicable';

export type ResponseReaction = 'Enjoyed' | 'Neutral' | 'Refused' | 'Not Observed';

export interface SensoryActivityItem {
  id: string;
  name: string;
  engagementLevel?: EngagementLevel;
  responseReaction?: ResponseReaction;
  remark: string;
}

export const INITIAL_ACTIVITIES: SensoryActivityItem[] = [
  { id: 'SEN-001', name: 'Sand Play', remark: '' },
  { id: 'SEN-002', name: 'Water Play', remark: '' },
  { id: 'SEN-003', name: 'Finger Painting', remark: '' },
  { id: 'SEN-004', name: 'Play-Doh / Clay', remark: '' },
  { id: 'SEN-005', name: 'Bubble Play', remark: '' },
  { id: 'SEN-006', name: 'Sensory Bin (Rice/Beans)', remark: '' },
  { id: 'SEN-007', name: 'Textured Mat Walking', remark: '' },
  { id: 'SEN-008', name: 'Vibrating Toys', remark: '' },
  { id: 'SEN-009', name: 'Light Box Exploration', remark: '' },
  { id: 'SEN-010', name: 'Music & Movement', remark: '' },
  { id: 'SEN-011', name: 'Deep Pressure Activities', remark: '' },
  { id: 'SEN-012', name: 'Spinning / Vestibular', remark: '' },
];

export const ENGAGEMENT_OPTIONS: EngagementLevel[] = [
  'Independent',
  'Partial Physical Prompt',
  'Full Physical Prompt',
  'Not Applicable',
];

export const REACTION_OPTIONS: ResponseReaction[] = [
  'Enjoyed',
  'Neutral',
  'Refused',
  'Not Observed',
];

export interface SensoryMetrics {
  totalActivities: number;
  scoredCount: number;
  progressPercent: number;
  engagementCounts: Record<EngagementLevel, number>;
  reactionCounts: Record<ResponseReaction, number>;
}

export function calculateSensoryMetrics(activities: SensoryActivityItem[]): SensoryMetrics {
  const totalActivities = activities.length;
  const scoredCount = activities.filter((a) => a.engagementLevel || a.responseReaction).length;
  const progressPercent =
    totalActivities === 0 ? 0 : Math.round((scoredCount / totalActivities) * 100);

  const engagementCounts: Record<EngagementLevel, number> = {
    Independent: 0,
    'Partial Physical Prompt': 0,
    'Full Physical Prompt': 0,
    'Not Applicable': 0,
  };

  const reactionCounts: Record<ResponseReaction, number> = {
    Enjoyed: 0,
    Neutral: 0,
    Refused: 0,
    'Not Observed': 0,
  };

  for (const a of activities) {
    if (a.engagementLevel && a.engagementLevel in engagementCounts) {
      engagementCounts[a.engagementLevel]++;
    }
    if (a.responseReaction && a.responseReaction in reactionCounts) {
      reactionCounts[a.responseReaction]++;
    }
  }

  return {
    totalActivities,
    scoredCount,
    progressPercent,
    engagementCounts,
    reactionCounts,
  };
}
