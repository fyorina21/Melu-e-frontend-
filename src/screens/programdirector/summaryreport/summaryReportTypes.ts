// src/screens/programdirector/summaryreport/summaryReportTypes.ts

export interface MassItem {
  id: string;
  text: string;
}

export interface FastItem {
  id: string;
  text: string;
}

export const MASS_ITEMS: MassItem[] = [
  {
    id: 'M1',
    text: 'Would the behavior occur continuously if left alone for long periods of time?',
  },
  { id: 'M2', text: 'Does the behavior occur when the person is asked to do a difficult task?' },
  { id: 'M3', text: 'Does the behavior seem to occur when the person is ignored?' },
  { id: 'M4', text: 'Does the behavior occur when a preferred item is taken away?' },
  { id: 'M5', text: 'Does the behavior occur when the person is left alone, with no one around?' },
  { id: 'M6', text: 'Does the behavior occur following a request to perform an undesirable task?' },
  { id: 'M7', text: 'Does the behavior occur when attention is diverted from the person?' },
  {
    id: 'M8',
    text: 'Does the behavior occur when the person is denied access to a desired item or activity?',
  },
  { id: 'M9', text: 'Does the behavior occur during a task that the person does not enjoy?' },
  { id: 'M10', text: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?' },
  { id: 'M11', text: 'Does the behavior occur to get a reaction from others?' },
  { id: 'M12', text: 'Does the behavior occur to obtain food, toys, or a specific activity?' },
];

export const FAST_ITEMS: FastItem[] = [
  { id: 'F1', text: 'Does the behavior occur when others are present, and does attention follow?' },
  { id: 'F2', text: 'Does the behavior occur to avoid or escape a task, demand, or request?' },
  { id: 'F3', text: 'Does the behavior produce a rewarding sensory effect without others?' },
  { id: 'F4', text: 'Does the behavior remove an unpleasant sensation or reduce pain?' },
  { id: 'F5', text: 'Does the behavior typically happen when the person is alone or unoccupied?' },
  { id: 'F6', text: 'Does the behavior occur during transitions or when demands increase?' },
  { id: 'F7', text: 'Does an adult typically react by giving attention or talking to the person?' },
  {
    id: 'F8',
    text: 'Is the behavior reduced when a preferred item or activity is provided freely?',
  },
];

export interface StudentOption {
  id: string;
  name: string;
  photoUrl?: string;
  headshotUrl?: string;
  photo?: string;
}

export interface StudentInfo {
  fullName?: string;
  dateOfBirth?: string;
  age?: number | string;
  parentGuardian?: string;
  station?: string;
  photoUrl?: string;
  headshotUrl?: string;
  photo?: string;
}

export interface AbcAntecedent {
  antecedent?: string;
  name?: string;
  count: number;
}

export interface BehaviorData {
  massAnswers?: Record<string, string>;
  fastAnswers?: Record<string, string>;
  abc?: {
    totalIncidents?: number;
    topAntecedents?: AbcAntecedent[];
  };
}

export interface PreferenceItem {
  id?: string;
  rank?: number;
  item: string;
  duration?: string;
  frequency?: number;
  context?: string;
  engaged?: string;
  approached?: string;
}

export interface SensoryActivity {
  name: string;
  engagementLevel?: string;
  responseReaction?: string;
  remark?: string;
}

export interface SocialSkillsData {
  percent?: number;
  scores?: Record<string, number | string>;
}

export interface AssessmentSummaryData {
  notSelected?: boolean;
  selectedStudentId?: string;
  students?: StudentOption[];
  studentInfo?: StudentInfo;
  abllsScores?: Record<string, any>;
  behavior?: BehaviorData;
  preference?: {
    items?: PreferenceItem[];
  };
  sensory?: {
    activities?: SensoryActivity[];
  };
  socialSkills?: SocialSkillsData;
}

export function filterPreferenceItemsByContext(
  items: PreferenceItem[] = [],
  prefTab: string,
): PreferenceItem[] {
  return items.filter((item) => {
    if (!item.context) return true;
    const cleanCtx = item.context.toLowerCase().replace(/_/g, ' ');
    const cleanTab = prefTab.toLowerCase().replace(' time', '');
    return cleanCtx.includes(cleanTab) || cleanCtx === prefTab.toLowerCase();
  });
}
