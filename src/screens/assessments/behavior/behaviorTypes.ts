// src/screens/assessments/behavior/behaviorTypes.ts

export type AssessmentTab = 'MASS' | 'FAST' | 'ABC';
export const TABS: AssessmentTab[] = ['MASS', 'FAST', 'ABC'];

export const LIKERT_OPTIONS = [
  'Never',
  'Almost Never',
  'Seldom',
  'Half the Time',
  'Usually',
  'Almost Always',
  'Always',
] as const;

export const LIKERT_SCORE: Record<string, number> = {
  Never: 0,
  'Almost Never': 1,
  Seldom: 2,
  'Half the Time': 3,
  Usually: 4,
  'Almost Always': 5,
  Always: 6,
};

export type MassFunction = 'Sensory' | 'Escape' | 'Attention' | 'Tangible';

export interface MassItem {
  id: string;
  text: string;
  function: MassFunction;
}

export const MASS_ITEMS: MassItem[] = [
  {
    id: 'M1',
    text: 'Would the behavior occur continuously if left alone for long periods of time?',
    function: 'Sensory',
  },
  {
    id: 'M2',
    text: 'Does the behavior occur when the person is asked to do a difficult task?',
    function: 'Escape',
  },
  {
    id: 'M3',
    text: 'Does the behavior seem to occur when the person is ignored?',
    function: 'Attention',
  },
  {
    id: 'M4',
    text: 'Does the behavior occur when a preferred item is taken away?',
    function: 'Tangible',
  },
  {
    id: 'M5',
    text: 'Does the behavior occur when the person is left alone, with no one around?',
    function: 'Sensory',
  },
  {
    id: 'M6',
    text: 'Does the behavior occur following a request to perform an undesirable task?',
    function: 'Escape',
  },
  {
    id: 'M7',
    text: 'Does the behavior occur when attention is diverted from the person?',
    function: 'Attention',
  },
  {
    id: 'M8',
    text: 'Does the behavior occur when the person is denied access to a desired item or activity?',
    function: 'Tangible',
  },
  {
    id: 'M9',
    text: 'Does the behavior occur during a task that the person does not enjoy?',
    function: 'Escape',
  },
  {
    id: 'M10',
    text: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?',
    function: 'Sensory',
  },
  {
    id: 'M11',
    text: 'Does the behavior occur to get a reaction from others?',
    function: 'Attention',
  },
  {
    id: 'M12',
    text: 'Does the behavior occur to obtain food, toys, or a specific activity?',
    function: 'Tangible',
  },
];

export type FastCategory =
  'Social - Positive' | 'Social - Negative' | 'Automatic - Positive' | 'Automatic - Negative';

export interface FastItem {
  id: string;
  text: string;
  category: FastCategory;
}

export const FAST_ITEMS: FastItem[] = [
  {
    id: 'F1',
    text: 'Does the behavior occur when others are present, and does attention follow?',
    category: 'Social - Positive',
  },
  {
    id: 'F2',
    text: 'Does the behavior occur to avoid or escape a task, demand, or request?',
    category: 'Social - Negative',
  },
  {
    id: 'F3',
    text: 'Does the behavior produce a rewarding sensory effect without others?',
    category: 'Automatic - Positive',
  },
  {
    id: 'F4',
    text: 'Does the behavior remove an unpleasant sensation or reduce pain?',
    category: 'Automatic - Negative',
  },
  {
    id: 'F5',
    text: 'Does the behavior typically happen when the person is alone or unoccupied?',
    category: 'Automatic - Positive',
  },
  {
    id: 'F6',
    text: 'Does the behavior occur during transitions or when demands increase?',
    category: 'Social - Negative',
  },
  {
    id: 'F7',
    text: 'Does an adult typically react by giving attention or talking to the person?',
    category: 'Social - Positive',
  },
  {
    id: 'F8',
    text: 'Is the behavior reduced when a preferred item or activity is provided freely?',
    category: 'Social - Positive',
  },
];

export interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
}

export const BEHAVIOR_PRESETS = [
  'Aggression',
  'Self-injury',
  'Tantrum',
  'Elopement',
  'Non-compliance',
  'Property destruction',
  'Repetitive behaviors',
] as const;

export const INTENSITIES = ['Low', 'Medium', 'High'] as const;

export interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

export function calculateMassTotals(
  massAnswers: Record<string, string>,
): Record<MassFunction, number> {
  const totals: Record<MassFunction, number> = {
    Sensory: 0,
    Escape: 0,
    Attention: 0,
    Tangible: 0,
  };
  MASS_ITEMS.forEach((i) => {
    if (massAnswers[i.id]) {
      totals[i.function] += LIKERT_SCORE[massAnswers[i.id]] || 0;
    }
  });
  return totals;
}

export function calculateMassMaxFunction(totals: Record<MassFunction, number>): MassFunction {
  return (Object.keys(totals) as MassFunction[]).reduce(
    (max, k) => (totals[k] > totals[max] ? k : max),
    'Sensory' as MassFunction,
  );
}

export function calculateFastTotals(
  fastAnswers: Record<string, boolean>,
): Record<FastCategory, number> {
  const totals: Record<FastCategory, number> = {
    'Social - Positive': 0,
    'Social - Negative': 0,
    'Automatic - Positive': 0,
    'Automatic - Negative': 0,
  };
  FAST_ITEMS.forEach((i) => {
    if (fastAnswers[i.id]) {
      totals[i.category] += 1;
    }
  });
  return totals;
}

export function calculateFastMaxCategory(totals: Record<FastCategory, number>): FastCategory {
  return (Object.keys(totals) as FastCategory[]).reduce(
    (max, k) => (totals[k] > totals[max] ? k : max),
    'Social - Positive' as FastCategory,
  );
}
