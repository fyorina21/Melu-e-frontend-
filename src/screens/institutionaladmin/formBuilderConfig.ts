import type { FormField } from '../../types';

export const FORMS = [
  'Enrollment Wizard',
  'IUP Form',
  'ABLLS Assessment Form',
  'Social Skills Questionnaire',
  'Behavior Incident Form',
  'Behavioral Assessment',
  'Preference Assessment',
  'Sensory Assessment',
];

export const FIELD_TYPES = [
  'Text',
  'TextArea',
  'Number',
  'Date',
  'Dropdown',
  'Radio',
  'Checkbox',
  'Switch',
  'Phone',
  'Image',
  'File',
  'Counter',
  'Timer',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number] | 'CheckboxGroup' | 'ImagePicker';

export const ENROLLMENT_SECTIONS = [
  'Student Info',
  'Parent Info',
  'Medical Info',
  'Program Placement',
  'Assign Therapist',
  'Review & Complete',
];

export const IUP_SECTIONS = [
  'Student & Assessment Summary',
  'Reinforcement & Behavioral Strategies',
  'Target Goals & Milestones',
  'Review & Approvals',
];

export const ABLLS_SECTIONS = [
  'Visual Performance',
  'Motor Imitation',
  'Vocal Imitation',
  'Receptive Language',
  'Requesting (Mands)',
  'Play and Leisure',
  'Social Interaction',
  'Writing',
  'Dressing',
  'General',
];

export const SOCIAL_SKILLS_SECTIONS = [
  'Social Interaction',
  'Communication',
  'Play & Leisure',
  'General',
];
export const BEHAVIORAL_SECTIONS = ['Incident Details', 'ABC Tracking', 'MASS', 'FAST', 'General'];
export const PREFERENCE_SECTIONS = ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement', 'General'];
export const SENSORY_SECTIONS = [
  'Tactile',
  'Visual & Auditory',
  'Proprioception & Vestibular',
  'General',
];
export const BEHAVIOR_INCIDENT_SECTIONS = ['ABC Tracking', 'General'];

export const getSectionsForForm = (formName: string): string[] => {
  const norm = (formName || '').toLowerCase().trim();
  if (norm.includes('enrollment')) return ENROLLMENT_SECTIONS;
  if (norm.includes('iup')) return IUP_SECTIONS;
  if (norm.includes('social')) return SOCIAL_SKILLS_SECTIONS;
  if (norm.includes('ablls') || norm.includes('skill')) return ABLLS_SECTIONS;
  if (norm.includes('behavioral') || norm.includes('behavior assessment'))
    return BEHAVIORAL_SECTIONS;
  if (norm.includes('preference')) return PREFERENCE_SECTIONS;
  if (norm.includes('sensory')) return SENSORY_SECTIONS;
  if (norm.includes('incident')) return BEHAVIOR_INCIDENT_SECTIONS;
  return [];
};

export const getPagesForForm = (
  formName: string,
  customSections: string[] = [],
  deletedSections: string[] = [],
): string[] => {
  const norm = (formName || '').toLowerCase().trim();
  if (norm.includes('enrollment')) {
    const base = [
      'Student Info',
      'Parent Info',
      'Medical Info',
      'Program Placement',
      'Assign Therapist',
      'Review & Complete',
    ];
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    // Position custom sections between Medical Info and Assign Therapist
    const full = [
      'Student Info',
      'Parent Info',
      'Medical Info',
      'Program Placement',
      ...custom,
      'Assign Therapist',
      'Review & Complete',
    ];
    return full.filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('iup')) {
    const base = IUP_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('social')) {
    const base = SOCIAL_SKILLS_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('ablls') || norm.includes('skill')) {
    const base = ABLLS_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('incident')) {
    const base = BEHAVIOR_INCIDENT_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('behavior')) {
    const base = BEHAVIORAL_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('preference')) {
    const base = PREFERENCE_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('sensory')) {
    const base = SENSORY_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  if (norm.includes('social')) {
    const base = SOCIAL_SKILLS_SECTIONS;
    const custom = customSections.filter(
      (s) => !base.some((b) => b.toLowerCase() === s.toLowerCase()),
    );
    return [...base, ...custom].filter((s) => !deletedSections.includes(s));
  }

  const sections = getSectionsForForm(formName);
  const combined = Array.from(new Set([...sections, ...customSections]));
  return combined.filter((s) => !deletedSections.includes(s));
};

/**
 * Resolves the appropriate base URL for direct assessment links.
 * In production web deployments, it resolves dynamically to the current origin,
 * while safely preserving the local dev / Vitest default (http://localhost:8081).
 */
export const getDirectBaseUrl = (): string => {
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    return window.location.origin;
  }
  return 'http://localhost:8081';
};

export const getDirectRouteUrl = (formOrRoute: string): string => {
  const route = ASSESSMENT_DIRECT_ROUTES[formOrRoute]?.route || formOrRoute;
  return `${getDirectBaseUrl()}/${route}`;
};

const directBaseUrl = getDirectBaseUrl();

export const ASSESSMENT_DIRECT_ROUTES: Record<string, { url: string; route: string }> = {
  'Enrollment Wizard': {
    url: `${directBaseUrl}/StudentEnrollmentWizard`,
    route: 'StudentEnrollmentWizard',
  },
  'ABLLS Assessment Form': {
    url: `${directBaseUrl}/SkillsAssessment`,
    route: 'SkillsAssessment',
  },
  'Social Skills Questionnaire': {
    url: `${directBaseUrl}/SocialSkillsAssessment`,
    route: 'SocialSkillsAssessment',
  },
  'Behavioral Assessment': {
    url: `${directBaseUrl}/BehaviorAssessment`,
    route: 'BehaviorAssessment',
  },
  'Preference Assessment': {
    url: `${directBaseUrl}/PreferenceAssessment`,
    route: 'PreferenceAssessment',
  },
  'Sensory Assessment': {
    url: `${directBaseUrl}/SensoryAssessment`,
    route: 'SensoryAssessment',
  },
  'Behavior Incident Form': {
    url: `${directBaseUrl}/SessionDataCollection`,
    route: 'SessionDataCollection',
  },
};

export const SCORE_SCALE_PRESETS = [
  {
    label: '2-Level (0, 1, N/A)',
    short: '2-Lvl (0,1)',
    options: ['0 — Not Demonstrated', '1 — Mastered', 'N/A'],
  },
  {
    label: '4-Level (0, 1, 2, 3, N/A)',
    short: '4-Lvl',
    options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Developing', '3 — Mastered', 'N/A'],
  },
];

export const BEHAVIORAL_PRESETS = [
  {
    label: 'Likert 6-Pt (MASS)',
    short: 'Likert (6)',
    options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
  },
  { label: 'Yes/No (FAST)', short: 'Yes/No', options: ['Yes', 'No'] },
  { label: 'Intensity (Low/Med/High)', short: 'Intensity', options: ['Low', 'Medium', 'High'] },
  {
    label: 'Location Presets',
    short: 'Locations',
    options: [
      'Room 1A',
      'Room 1B',
      'Room 2A',
      'Room 2B',
      'Sensory Station',
      'Hallway / Transit',
      'Playground',
      'Restroom',
    ],
  },
  {
    label: 'ABC Behaviors',
    short: 'Behaviors',
    options: [
      'Aggression',
      'Self-injury',
      'Tantrum',
      'Elopement',
      'Non-compliance',
      'Property destruction',
      'Repetitive behaviors',
    ],
  },
];

export const SENSORY_PRESETS = [
  {
    label: 'Engagement Level',
    short: 'Engagement',
    options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
  },
  {
    label: 'Reaction',
    short: 'Reaction',
    options: ['Enjoyed', 'Neutral', 'Refused', 'Not Observed'],
  },
];

export const BEHAVIOR_INCIDENT_PRESETS = [
  {
    label: 'Antecedents (A)',
    short: 'Antecedents',
    options: [
      'Demand / Task',
      'Transition',
      'Denied Access',
      'Attention Diverted',
      'Sensory Overload',
      'Loud Noise',
      'Peer Interaction',
    ],
  },
  {
    label: 'Behaviors (B)',
    short: 'Behaviors',
    options: [
      'Aggression',
      'Self-injury',
      'Tantrum',
      'Elopement',
      'Non-compliance',
      'Property destruction',
      'Repetitive behaviors',
    ],
  },
  {
    label: 'Consequences (C)',
    short: 'Consequences',
    options: [
      'Redirection',
      'Verbal Prompt',
      'Break Given',
      'Sensory Break',
      'Physical Prompt',
      'Planned Ignoring',
    ],
  },
];

export const SOCIAL_SKILLS_PRESETS = [
  {
    label: '4-Level Frequency (0-Never, 1-Sometimes, 2-Often, 3-Always)',
    short: '4-Pt (0-3)',
    options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
  },
  { label: 'Yes/No', short: 'Yes/No', options: ['Yes', 'No'] },
  {
    label: '3-Level Frequency',
    short: '3-Lvl',
    options: ['Rarely', 'Occasionally', 'Consistently'],
  },
];

export const getPresetsForForm = (formName: string) => {
  if (formName === 'ABLLS Assessment Form') return SCORE_SCALE_PRESETS;
  if (formName === 'Social Skills Questionnaire') return SOCIAL_SKILLS_PRESETS;
  if (formName === 'Behavior Incident Form' || formName.toLowerCase().includes('incident'))
    return BEHAVIOR_INCIDENT_PRESETS;
  return [];
};

export const BEHAVIOR_LEVELS = [
  'Sensory',
  'Escape',
  'Attention',
  'Tangible',
  'Social - Positive',
  'Social - Negative',
  'Automatic - Positive',
  'Automatic - Negative',
];

export const SECTION_LETTER: Record<string, string> = {
  'Visual Performance': 'A',
  'Motor Imitation': 'B',
  'Vocal Imitation': 'C',
  'Receptive Language': 'D',
  'Requesting (Mands)': 'E',
  'Play and Leisure': 'F',
  'Social Interaction': 'G',
  Writing: 'H',
  Dressing: 'I',
};

export const inferSectionFromId = (id: string): string | null => {
  if (!id) return null;
  const match = id.match(/^([A-I])\d+$/);
  if (!match) {
    if (/^q\d+$/i.test(id)) return 'Social Interaction';
    if (id.startsWith('M') && /^\d+$/.test(id.slice(1))) return 'MASS';
    if (id.startsWith('F') && /^\d+$/.test(id.slice(1))) return 'FAST';
    if (id.startsWith('ABC-') || id === 'b_ant' || id === 'b_con') return 'ABC Tracking';
    if (id.startsWith('P') && /^\d+$/.test(id.slice(1))) return 'General';
    if (id.startsWith('SEN-')) return 'Tactile';
    if (
      id.startsWith('b_loc') ||
      id.startsWith('b_beh') ||
      id.startsWith('b_int') ||
      id.startsWith('b_dur') ||
      /^b\d+$/i.test(id)
    )
      return 'Incident Details';
    if (id.startsWith('b_notes')) return 'General';
    return null;
  }
  const letter = match[1];
  const entry = Object.entries(SECTION_LETTER).find(([, l]) => l === letter);
  return entry ? entry[0] : null;
};

export const getDomainLetterForAblls = (section: string, prevFields: FormField[] = []): string => {
  if (SECTION_LETTER[section]) {
    return SECTION_LETTER[section];
  }
  const matching = prevFields.find((f) => f.section === section);
  if (matching) {
    const m = matching.id.match(/^([A-Z]+)\d+$/i);
    if (m) return m[1].toUpperCase();
  }
  const usedLetters = new Set(Object.values(SECTION_LETTER));
  prevFields.forEach((f) => {
    const m = f.id.match(/^([A-Z])\d+$/i);
    if (m) usedLetters.add(m[1].toUpperCase());
  });
  const alphabet = 'JKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < alphabet.length; i++) {
    if (!usedLetters.has(alphabet[i])) {
      return alphabet[i];
    }
  }
  return 'J';
};

export const COMMON_SKILL_TYPES = [
  'Visual Performance',
  'Motor Imitation',
  'Vocal Imitation',
  'Receptive Language',
  'Visual Imitation',
  'Requesting (Mands)',
  'Play and Leisure',
  'Social Interaction',
  'Writing',
  'Dressing',
  'Cognitive Skills',
  'Gross Motor',
  'Fine Motor',
  'Adaptive Skills',
];

export const COMMON_INFO_TYPES = [
  'Emergency Contact Info',
  'Insurance & Billing',
  'Behavioral Background',
  'Developmental History',
  'Transportation Details',
  'Consent & Agreements',
];

export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const getNextIdForSection = (
  form: string,
  section: string | undefined,
  prevFields: FormField[],
): string => {
  if (form === 'ABLLS Assessment Form' && section) {
    const letter = getDomainLetterForAblls(section, prevFields);
    if (letter) {
      const safeLetter = escapeRegExp(letter);
      const letterRegex = new RegExp(`^${safeLetter}(\\d+)$`, 'i');
      const existing = prevFields
        .map((f) => f.id)
        .filter((id) => letterRegex.test(id))
        .map((id) => parseInt(id.replace(new RegExp(`^${safeLetter}`, 'i'), ''), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return `${letter}${nextNum}`;
    }
  }

  if (form === 'Behavioral Assessment') {
    if (section && section.includes('MASS')) {
      const existing = prevFields
        .map((f) => f.id)
        .filter((id) => /^M(\d+)$/.test(id))
        .map((id) => parseInt(id.replace('M', ''), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return `M${nextNum}`;
    }
    if (section && section.includes('FAST')) {
      const existing = prevFields
        .map((f) => f.id)
        .filter((id) => /^F(\d+)$/.test(id))
        .map((id) => parseInt(id.replace('F', ''), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return `F${nextNum}`;
    }
    if (section && section.includes('ABC')) {
      const existing = prevFields
        .map((f) => f.id)
        .filter((id) => /^ABC-(\d+)$/.test(id))
        .map((id) => parseInt(id.replace('ABC-', ''), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      return `ABC-${nextNum}`;
    }
    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => /^BEH-(\d+)$/.test(id))
      .map((id) => parseInt(id.replace('BEH-', ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `BEH-${nextNum}`;
  }

  if (form === 'Social Skills Questionnaire') {
    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => /^q(\d+)$/i.test(id))
      .map((id) => parseInt(id.replace(/^q/i, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `q${nextNum}`;
  }

  if (form === 'Preference Assessment') {
    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => /^P(\d+)$/.test(id))
      .map((id) => parseInt(id.replace('P', ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `P${nextNum}`;
  }

  if (form === 'Sensory Assessment') {
    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => /^SEN-(\d+)$/.test(id))
      .map((id) => parseInt(id.replace('SEN-', ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `SEN-${String(nextNum).padStart(3, '0')}`;
  }

  if (form === 'Behavior Incident Form') {
    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => /^b(\d+)$/i.test(id))
      .map((id) => parseInt(id.replace(/^b/i, ''), 10))
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `b${nextNum}`;
  }

  // Handle custom skill type folders (e.g. Visual Performance, Cognitive Skills, Requesting (Mands))
  if (section && section !== 'General') {
    const cleanWords = section
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let prefix = 'SEC';
    if (cleanWords.length > 1) {
      prefix = cleanWords
        .map((w) => w[0].toUpperCase())
        .join('')
        .slice(0, 4);
    } else if (cleanWords.length === 1) {
      const w = cleanWords[0].toUpperCase();
      prefix = w.length <= 4 ? w : w.slice(0, 3);
    }
    if (!prefix || !/^[A-Z0-9]+$/i.test(prefix)) {
      prefix = 'SEC';
    }

    const safePrefix = escapeRegExp(prefix);
    const regex = new RegExp(`^${safePrefix}[-_]?(\\d+)$`, 'i');

    const existing = prevFields
      .map((f) => f.id)
      .filter((id) => regex.test(id))
      .map((id) => {
        const match = id.match(regex);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((n) => !isNaN(n));
    const nextNum = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `${prefix}-${nextNum}`;
  }

  return `f-${Date.now()}`;
};

export const FORM_METADATA: Record<string, { id: string; revision: string; pages: string }> = {
  'Enrollment Wizard': {
    id: 'FRM-ENR-001',
    revision: 'Rev 2.4 · 2026-09-19',
    pages: 'Page 1 of 6',
  },
  'IUP Form': {
    id: 'FRM-IUP-001',
    revision: 'Rev 1.8 · 2026-09-19',
    pages: 'Page 1 of 4',
  },
  'ABLLS Assessment Form': {
    id: 'FRM-ABLLS-001',
    revision: 'Rev 3.1 · 2026-09-19',
    pages: 'Page 1 of 10',
  },
  'Behavioral Assessment': {
    id: 'FRM-BEH-001',
    revision: 'Rev 2.0 · 2026-09-19',
    pages: 'Page 1 of 5',
  },
  'Preference Assessment': {
    id: 'FRM-PREF-001',
    revision: 'Rev 1.5 · 2026-09-19',
    pages: 'Page 1 of 6',
  },
  'Sensory Assessment': {
    id: 'FRM-SEN-001',
    revision: 'Rev 1.6 · 2026-09-19',
    pages: 'Page 1 of 4',
  },
  'Social Skills Questionnaire': {
    id: 'FRM-SOC-001',
    revision: 'Rev 1.2 · 2026-09-19',
    pages: 'Page 1 of 4',
  },
  'Behavior Incident Form': {
    id: 'FRM-BIF-001',
    revision: 'Rev 1.4 · 2026-09-19',
    pages: 'Page 1 of 2',
  },
};
