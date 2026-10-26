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

// ---------------------------------------------------------------------------
// 16-Item MAS (Motivation Assessment Scale - Delaney & Durand, Ph.D. 1986)
// ---------------------------------------------------------------------------
export type MasCategory = 'Sensory' | 'Escape' | 'Attention' | 'Tangible';

export const MAS_CATEGORIES: MasCategory[] = ['Sensory', 'Escape', 'Attention', 'Tangible'];

export interface MassItem {
  id: string; // e.g. "M1", "M2", ..., "M16"
  questionNumber: number;
  text: string;
  category: MasCategory;
}

/**
 * Authentic 16-Question MAS Mapping (4 Categories × 4 Questions):
 * - Sensory: Questions 1, 5, 9, 13 (Total / 4 = Mean)
 * - Escape: Questions 2, 6, 10, 14 (Total / 4 = Mean)
 * - Attention: Questions 3, 7, 11, 15 (Total / 4 = Mean)
 * - Tangible: Questions 4, 8, 12, 16 (Total / 4 = Mean)
 */
export const MAS_CATEGORY_ITEM_NUMBERS: Record<MasCategory, number[]> = {
  Sensory: [1, 5, 9, 13],
  Escape: [2, 6, 10, 14],
  Attention: [3, 7, 11, 15],
  Tangible: [4, 8, 12, 16],
};

const MAS_RAW_QUESTIONS: Record<number, { text: string; category: MasCategory }> = {
  1: {
    text: 'Would the behavior occur continuously if this person was left alone for long periods of time?',
    category: 'Sensory',
  },
  2: {
    text: 'Does the behavior occur following a request to perform a difficult task?',
    category: 'Escape',
  },
  3: {
    text: 'Does the behavior seem to occur in response to your talking to other persons in the room/area?',
    category: 'Attention',
  },
  4: {
    text: 'Does the behavior ever occur to get a toy, food, or an activity that this person has been told he/she can’t have?',
    category: 'Tangible',
  },
  5: {
    text: 'Would the behavior occur repeatedly, in the same way, for long periods of time if the person was alone? (e.g., rocking back and forth for over an hour.)',
    category: 'Sensory',
  },
  6: {
    text: 'Does the behavior occur when any request is made of this person?',
    category: 'Escape',
  },
  7: {
    text: 'Does the behavior occur whenever you stop attending to this person?',
    category: 'Attention',
  },
  8: {
    text: 'Does the behavior occur when you take away a favorite food, toy or activity?',
    category: 'Tangible',
  },
  9: {
    text: 'Does it appear to you that the person enjoys doing the behavior? (It feels, tastes, looks, smells, sounds pleasing).',
    category: 'Sensory',
  },
  10: {
    text: 'Does this person seem to do the behavior to upset or annoy you when you are trying to get him/her to do what you ask?',
    category: 'Escape',
  },
  11: {
    text: 'Does this person seem to do the behavior to upset or annoy you when you are not paying attention to him/her? (e.g., you are in another room or interacting with another person)',
    category: 'Attention',
  },
  12: {
    text: 'Does the behavior stop occurring shortly after you give the person food, toy, or requested activity?',
    category: 'Tangible',
  },
  13: {
    text: 'When the behavior is occurring does this person seem calm and unaware of anything else going on around her/him?',
    category: 'Sensory',
  },
  14: {
    text: 'Does the behavior stop occurring shortly after (one to five minutes) you stop working with or making demands of this person?',
    category: 'Escape',
  },
  15: {
    text: 'Does this person seem to do the behavior to get you to spend some time with her/him?',
    category: 'Attention',
  },
  16: {
    text: 'Does the behavior seem to occur when this person has been told that he/she can’t do something he/she had wanted to do?',
    category: 'Tangible',
  },
};

export const MASS_ITEMS: MassItem[] = Array.from({ length: 16 }, (_, idx) => {
  const num = idx + 1;
  const item = MAS_RAW_QUESTIONS[num];
  return {
    id: `M${num}`,
    questionNumber: num,
    text: item.text,
    category: item.category,
  };
});

export interface MasCategoryScore {
  category: MasCategory;
  total: number;
  itemCount: number;
  answeredCount: number;
  mean: number;
  rank: number;
}

export interface MasScoringResult {
  scores: Record<MasCategory, MasCategoryScore>;
  ranking: MasCategoryScore[];
  primaryMaintainingVariable: MasCategory;
  totalScore: number;
}

export function parseLikertScore(val: unknown): number {
  if (typeof val === 'number') return Math.min(6, Math.max(0, val));
  if (typeof val === 'string') {
    if (LIKERT_SCORE[val] !== undefined) return LIKERT_SCORE[val];
    const n = parseInt(val, 10);
    if (!isNaN(n)) return Math.min(6, Math.max(0, n));
  }
  return 0;
}

/**
 * 16-Item MAS Scoring Engine (Delaney & Durand, 1986):
 * - 4 Categories × 4 Questions
 * - Total = Sum of answered item values (0-6)
 * - Mean = Total / 4
 * - Rank (1 to 4) per target behavior
 */
export function calculateMassCategoryScores(
  massAnswers: Record<string, string | number>,
): MasScoringResult {
  const scoresObj = {} as Record<MasCategory, MasCategoryScore>;
  let overallTotal = 0;

  MAS_CATEGORIES.forEach((cat) => {
    const qNums = MAS_CATEGORY_ITEM_NUMBERS[cat];
    let total = 0;
    let answeredCount = 0;

    qNums.forEach((qNum) => {
      const val = massAnswers?.[`M${qNum}`] ?? massAnswers?.[String(qNum)];
      if (val !== undefined && val !== null && val !== '') {
        total += parseLikertScore(val);
        answeredCount += 1;
      }
    });

    const itemCount = qNums.length;
    const mean = itemCount > 0 ? Math.round((total / itemCount) * 100) / 100 : 0;
    overallTotal += total;

    scoresObj[cat] = {
      category: cat,
      total,
      itemCount,
      answeredCount,
      mean,
      rank: 1,
    };
  });

  // Motivational Ranking: Rank 1 (highest mean) to Rank 4 (lowest mean)
  const ranking = Object.values(scoresObj).sort((a, b) => {
    if (b.mean !== a.mean) return b.mean - a.mean;
    return b.total - a.total;
  });

  ranking.forEach((item, index) => {
    item.rank = index + 1;
    scoresObj[item.category].rank = index + 1;
  });

  const primaryMaintainingVariable = ranking[0]?.category || 'Sensory';

  return {
    scores: scoresObj,
    ranking,
    primaryMaintainingVariable,
    totalScore: overallTotal,
  };
}

// ---------------------------------------------------------------------------
// FAST (Functional Assessment Screening Tool) - 27 Items & 5 Categories
// ---------------------------------------------------------------------------
export const FAST_SETTING_CONTEXT_OPTIONS = [
  'Self-care',
  'Academic',
  'Meals',
  'Leisure',
  'Work',
  'Evenings',
  'Unoccupied',
  'Other',
] as const;

export type FastSettingContext = (typeof FAST_SETTING_CONTEXT_OPTIONS)[number];

export type FastMaintainingVariable =
  | 'Social Reinforcement — Attention'
  | 'Social Reinforcement — Tangible'
  | 'Social Reinforcement — Escape'
  | 'Automatic Reinforcement — Sensory Stimulation'
  | 'Automatic Reinforcement — Pain Attenuation';

export const FAST_MAINTAINING_VARIABLES: FastMaintainingVariable[] = [
  'Social Reinforcement — Attention',
  'Social Reinforcement — Tangible',
  'Social Reinforcement — Escape',
  'Automatic Reinforcement — Sensory Stimulation',
  'Automatic Reinforcement — Pain Attenuation',
];

export interface FastItem {
  id: string; // e.g. "F1", "F2", ..., "F27"
  questionNumber: number;
  text: string;
  isPartOne: boolean;
  section: string;
}

export const FAST_ITEMS: FastItem[] = [
  // Part I: Social Influences on Behavior
  {
    id: 'F1',
    questionNumber: 1,
    text: 'Does the behavior occur when the person is not receiving attention or attention is directed to someone else?',
    isPartOne: true,
    section: 'Part I: Social Influences',
  },
  {
    id: 'F2',
    questionNumber: 2,
    text: 'Does the behavior occur when the person is requested or prompted to perform a task or activity?',
    isPartOne: true,
    section: 'Part I: Social Influences',
  },
  {
    id: 'F3',
    questionNumber: 3,
    text: 'Does the behavior occur when access to preferred items, foods, or activities is denied or interrupted?',
    isPartOne: true,
    section: 'Part I: Social Influences',
  },

  // Part II: Specific Conditions
  // Social Reinforcement — Attention (4-8)
  {
    id: 'F4',
    questionNumber: 4,
    text: 'Does the behavior occur when you are talking to someone else or busy with other tasks?',
    isPartOne: false,
    section: 'Attention',
  },
  {
    id: 'F5',
    questionNumber: 5,
    text: 'Does the behavior occur when the person is left alone for even brief periods of time?',
    isPartOne: false,
    section: 'Attention',
  },
  {
    id: 'F6',
    questionNumber: 6,
    text: 'Is the behavior likely to occur if you stop paying attention or look away from the person?',
    isPartOne: false,
    section: 'Attention',
  },
  {
    id: 'F7',
    questionNumber: 7,
    text: 'Do caregivers or teachers typically respond by giving attention, reprimanding, or comforting?',
    isPartOne: false,
    section: 'Attention',
  },
  {
    id: 'F8',
    questionNumber: 8,
    text: 'Does the behavior stop shortly after attention, comfort, or physical contact is provided?',
    isPartOne: false,
    section: 'Attention',
  },

  // Social Reinforcement — Tangible / Activities (9-13)
  {
    id: 'F9',
    questionNumber: 9,
    text: 'Does the behavior occur when preferred toys, items, or food are withheld or removed?',
    isPartOne: false,
    section: 'Tangible / Activities',
  },
  {
    id: 'F10',
    questionNumber: 10,
    text: 'Does the behavior occur when the person is told they cannot have an item they requested?',
    isPartOne: false,
    section: 'Tangible / Activities',
  },
  {
    id: 'F11',
    questionNumber: 11,
    text: 'Does the behavior stop shortly after you give the person the preferred item, food, or activity?',
    isPartOne: false,
    section: 'Tangible / Activities',
  },
  {
    id: 'F12',
    questionNumber: 12,
    text: 'Does the person struggle or engage in the behavior when transitions away from preferred activities occur?',
    isPartOne: false,
    section: 'Tangible / Activities',
  },
  {
    id: 'F13',
    questionNumber: 13,
    text: 'Does the person engage in the behavior to get you to open a container, hand them a toy, or provide an item?',
    isPartOne: false,
    section: 'Tangible / Activities',
  },

  // Social Reinforcement — Escape (14-18)
  {
    id: 'F14',
    questionNumber: 14,
    text: 'Does the behavior occur when the person is asked to complete a difficult, academic, or non-preferred task?',
    isPartOne: false,
    section: 'Escape',
  },
  {
    id: 'F15',
    questionNumber: 15,
    text: 'Does the behavior occur during transitions from a free-play activity to a structured work task?',
    isPartOne: false,
    section: 'Escape',
  },
  {
    id: 'F16',
    questionNumber: 16,
    text: 'Does the behavior stop shortly after you remove the task demands or allow the person to take a break?',
    isPartOne: false,
    section: 'Escape',
  },
  {
    id: 'F17',
    questionNumber: 17,
    text: 'Does the behavior occur more frequently when instructional demands or chores are placed?',
    isPartOne: false,
    section: 'Escape',
  },
  {
    id: 'F18',
    questionNumber: 18,
    text: 'Does the person persist with the behavior until the task or demand is postponed or cancelled?',
    isPartOne: false,
    section: 'Escape',
  },

  // Automatic Reinforcement — Sensory Stimulation (19-24)
  {
    id: 'F19',
    questionNumber: 19,
    text: 'Does the behavior occur repeatedly when the person is alone or has nothing else to do?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },
  {
    id: 'F20',
    questionNumber: 20,
    text: 'Does the behavior occur across a wide variety of settings and independent of who is present?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },
  {
    id: 'F21',
    questionNumber: 21,
    text: 'Does the behavior appear to provide a pleasant physical, auditory, or visual sensation?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },
  {
    id: 'F22',
    questionNumber: 22,
    text: 'Does the behavior occur even when the person is engaged in preferred activities or games?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },
  {
    id: 'F23',
    questionNumber: 23,
    text: 'Does the person seem unaware of or unresponsive to external social surroundings while engaging in the behavior?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },
  {
    id: 'F24',
    questionNumber: 24,
    text: 'Is the behavior rhythmic, repetitive, or stereotypic in nature?',
    isPartOne: false,
    section: 'Sensory Stimulation',
  },

  // Automatic Reinforcement — Pain Attenuation (25-27, plus 19, 20, 24)
  {
    id: 'F25',
    questionNumber: 25,
    text: 'Does the behavior occur primarily when the person is physically ill, fatigued, or experiencing discomfort?',
    isPartOne: false,
    section: 'Pain Attenuation',
  },
  {
    id: 'F26',
    questionNumber: 26,
    text: 'Does the behavior appear to be an attempt to alleviate physical pain, itchiness, or internal discomfort?',
    isPartOne: false,
    section: 'Pain Attenuation',
  },
  {
    id: 'F27',
    questionNumber: 27,
    text: 'Does the person direct the behavior toward a specific body part (e.g., ear pulling, head pressing, jaw rubbing)?',
    isPartOne: false,
    section: 'Pain Attenuation',
  },
];

export interface FastCategoryScore {
  variable: FastMaintainingVariable;
  yesCount: number;
  maxPoints: number;
  percentage: number;
  isDominant: boolean;
  itemNumbers: number[];
}

export interface FastScoringResult {
  scores: Record<FastMaintainingVariable, FastCategoryScore>;
  dominantVariables: FastMaintainingVariable[];
  partOneSocialInfluencesYesCount: number;
  partOneSocialYesCount?: number;
  partOneHasSocialInfluence: boolean;
  totalYesCount: number;
  maxPercentage: number;
}

export function isFastYes(val: unknown): boolean {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1' || s === 'y';
  }
  return false;
}

/**
 * Functional Assessment Screening Tool (FAST) Calculation Engine:
 * - Part I: Social Influences (Items 1–3, Yes/No).
 *   If any item is answered "Yes", Part II is scored and items 1–3 are included in the scoring summary.
 * - Part II: Social Reinforcement (Items 4–18, Yes/No):
 *   Attention (4–8 + 1–3 if social influence), Tangibles (9–13 + 1–3 if social influence), Escape (14–18 + 1–3 if social influence).
 * - Part III: Nonsocial / Automatic Reinforcement (Items 19–27, Yes/No):
 *   Sensory Stimulation (19–24), Pain Attenuation (19, 20, 24–27).
 * - Calculate total "Yes" count (1–27) and maintain variable summary per target behavior.
 */
export function calculateFastCategoryScores(
  fastAnswers: Record<string, boolean | string | number>,
): FastScoringResult {
  const getAnswer = (qNum: number): boolean => {
    const val = fastAnswers?.[`F${qNum}`] ?? fastAnswers?.[String(qNum)];
    return isFastYes(val);
  };

  const q1Yes = getAnswer(1);
  const q2Yes = getAnswer(2);
  const q3Yes = getAnswer(3);
  const partOneSocialYesCount = (q1Yes ? 1 : 0) + (q2Yes ? 1 : 0) + (q3Yes ? 1 : 0);
  const partOneHasSocialInfluence = partOneSocialYesCount > 0;

  // Question mapping lists with Part I gating logic
  const mappings: Record<
    FastMaintainingVariable,
    { partTwoItems: number[]; max: number; allItems: number[] }
  > = {
    'Social Reinforcement — Attention': {
      partTwoItems: [4, 5, 6, 7, 8],
      max: 8,
      allItems: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    'Social Reinforcement — Tangible': {
      partTwoItems: [9, 10, 11, 12, 13],
      max: 8,
      allItems: [1, 2, 3, 9, 10, 11, 12, 13],
    },
    'Social Reinforcement — Escape': {
      partTwoItems: [14, 15, 16, 17, 18],
      max: 8,
      allItems: [1, 2, 3, 14, 15, 16, 17, 18],
    },
    'Automatic Reinforcement — Sensory Stimulation': {
      partTwoItems: [19, 20, 21, 22, 23, 24],
      max: 6,
      allItems: [19, 20, 21, 22, 23, 24],
    },
    'Automatic Reinforcement — Pain Attenuation': {
      partTwoItems: [19, 20, 24, 25, 26, 27],
      max: 6,
      allItems: [19, 20, 24, 25, 26, 27],
    },
  };

  const scoresObj = {} as Record<FastMaintainingVariable, FastCategoryScore>;
  let maxPercentage = -1;
  let totalYes = 0;

  FAST_MAINTAINING_VARIABLES.forEach((variable) => {
    const { partTwoItems, max, allItems } = mappings[variable];
    let yesCount = 0;

    if (variable.startsWith('Social Reinforcement')) {
      if (partOneHasSocialInfluence) {
        yesCount += partOneSocialYesCount;
      }
      partTwoItems.forEach((qNum) => {
        if (getAnswer(qNum)) yesCount += 1;
      });
    } else {
      partTwoItems.forEach((qNum) => {
        if (getAnswer(qNum)) yesCount += 1;
      });
    }

    const percentage = max > 0 ? Math.round((yesCount / max) * 100) : 0;
    if (percentage > maxPercentage) {
      maxPercentage = percentage;
    }

    scoresObj[variable] = {
      variable,
      yesCount,
      maxPoints: max,
      percentage,
      isDominant: false,
      itemNumbers: allItems,
    };
  });

  // Calculate total answered YES across all unique questions 1 to 27
  for (let i = 1; i <= 27; i++) {
    if (getAnswer(i)) totalYes += 1;
  }

  // Flag dominant maintaining variable(s) (highest percentage > 0)
  const dominantVariables: FastMaintainingVariable[] = [];
  FAST_MAINTAINING_VARIABLES.forEach((variable) => {
    if (maxPercentage > 0 && scoresObj[variable].percentage === maxPercentage) {
      scoresObj[variable].isDominant = true;
      dominantVariables.push(variable);
    }
  });

  return {
    scores: scoresObj,
    dominantVariables,
    partOneSocialInfluencesYesCount: partOneSocialYesCount,
    partOneSocialYesCount: partOneSocialYesCount,
    partOneHasSocialInfluence,
    totalYesCount: totalYes,
    maxPercentage: maxPercentage > 0 ? maxPercentage : 0,
  };
}

// ---------------------------------------------------------------------------
// Backward-Compatibility Helpers (Legacy 4-Function Mappings)
// ---------------------------------------------------------------------------
export type MassFunction = 'Sensory' | 'Escape' | 'Attention' | 'Tangible';
export type FastCategory =
  'Social - Positive' | 'Social - Negative' | 'Automatic - Positive' | 'Automatic - Negative';

export function calculateMassTotals(
  answers: Record<string, string | number>,
): Record<MassFunction, number> {
  const result = calculateMassCategoryScores(answers);
  return {
    Sensory: result.scores.Sensory?.total || 0,
    Escape: result.scores.Escape?.total || 0,
    Attention: result.scores.Attention?.total || 0,
    Tangible: result.scores.Tangible?.total || 0,
  };
}

export function calculateMassMaxFunction(totals: Record<MassFunction, number>): MassFunction {
  let maxVal = -1;
  let maxFn: MassFunction = 'Sensory';
  (Object.keys(totals) as MassFunction[]).forEach((fn) => {
    if (totals[fn] > maxVal) {
      maxVal = totals[fn];
      maxFn = fn;
    }
  });
  return maxFn;
}

export function calculateFastTotals(
  answers: Record<string, boolean | string | number>,
): Record<FastCategory, number> {
  const result = calculateFastCategoryScores(answers);
  return {
    'Social - Positive':
      (result.scores['Social Reinforcement — Attention']?.yesCount || 0) +
      (result.scores['Social Reinforcement — Tangible']?.yesCount || 0),
    'Social - Negative': result.scores['Social Reinforcement — Escape']?.yesCount || 0,
    'Automatic - Positive':
      result.scores['Automatic Reinforcement — Sensory Stimulation']?.yesCount || 0,
    'Automatic - Negative':
      result.scores['Automatic Reinforcement — Pain Attenuation']?.yesCount || 0,
  };
}

export function calculateFastMaxCategory(totals: Record<string, number>): string {
  let maxVal = -1;
  let maxCat = 'Social - Positive';
  Object.keys(totals).forEach((cat) => {
    if (totals[cat] > maxVal) {
      maxVal = totals[cat];
      maxCat = cat;
    }
  });
  return maxCat;
}

// ---------------------------------------------------------------------------
// Multi-Target Behavior State Model
// ---------------------------------------------------------------------------
export interface BehaviorRecord {
  id: string;
  behavior: string;
  frequency: string;
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  trigger: string;
  consequence: string;
  notes?: string;
  timestamp?: string;
}

export const BEHAVIOR_PRESETS = [
  'Screaming / Vocal Tantrum',
  'Biting Others',
  'Flopping to Floor',
  'Elopement',
  'Scratching / Pinching',
  'Self-Injurious Hand/Arm Biting',
  'Throwing Materials',
  'Refusal / Non-Compliance',
  'Property Destruction',
  'Repetitive Behaviors',
] as const;

export const INTENSITIES = ['Low', 'Medium', 'High'] as const;

export interface StudentProfile {
  id: string;
  fullName: string;
  age: number;
}

export interface BehaviorTargetAssessmentData {
  id?: string;
  behaviorName: string;
  definition?: string;
  settingContext?: FastSettingContext[];
  massAnswers: Record<string, string | number>;
  fastAnswers: Record<string, boolean | string | number>;
  abcNotes?: string;
  records?: BehaviorRecord[];
  massScores?: MasScoringResult;
  fastScores?: FastScoringResult;
  dominantFunction?: string;
  hypothesizedFunction?: string;
  status?: 'draft' | 'completed';
}

export function validateTargetBehaviorCompleteness(
  target: BehaviorTargetAssessmentData,
  massItemsCount: number = 16,
  fastItemsCount: number = 27,
): { complete: boolean; missingMass: number; missingFast: number } {
  let answeredMass = 0;
  for (let i = 1; i <= massItemsCount; i++) {
    const val = target.massAnswers?.[`M${i}`] ?? target.massAnswers?.[String(i)];
    if (val !== undefined && val !== null && val !== '') {
      answeredMass += 1;
    }
  }

  let answeredFast = 0;
  for (let i = 1; i <= fastItemsCount; i++) {
    const val = target.fastAnswers?.[`F${i}`] ?? target.fastAnswers?.[String(i)];
    if (val !== undefined && val !== null && val !== '') {
      answeredFast += 1;
    }
  }

  const missingMass = Math.max(0, massItemsCount - answeredMass);
  const missingFast = Math.max(0, fastItemsCount - answeredFast);

  return {
    complete: missingMass === 0 && missingFast === 0,
    missingMass,
    missingFast,
  };
}
