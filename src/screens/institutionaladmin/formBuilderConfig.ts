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

export const FIELD_TYPES = ['Text', 'Number', 'Date', 'Dropdown', 'Radio', 'File'];

export const ENROLLMENT_SECTIONS = ['Student Info', 'Parent Info', 'Medical Info'];

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

export const BEHAVIORAL_SECTIONS = ['MASS', 'FAST', 'ABC Tracking', 'General'];
export const PREFERENCE_SECTIONS = ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement', 'General'];
export const SENSORY_SECTIONS = ['Tactile', 'Visual & Auditory', 'Proprioception & Vestibular', 'General'];

export const getSectionsForForm = (formName: string): string[] => {
  if (formName === 'Enrollment Wizard') return ENROLLMENT_SECTIONS;
  if (formName === 'ABLLS Assessment Form') return ABLLS_SECTIONS;
  if (formName === 'Behavioral Assessment' || formName === 'Behavior Assessment') return BEHAVIORAL_SECTIONS;
  if (formName === 'Preference Assessment') return PREFERENCE_SECTIONS;
  if (formName === 'Sensory Assessment') return SENSORY_SECTIONS;
  return [];
};

export const ASSESSMENT_DIRECT_ROUTES: Record<string, { url: string; route: string }> = {
  'Behavioral Assessment': { url: 'http://localhost:8081/BehaviorAssessment', route: 'BehaviorAssessment' },
  'Preference Assessment': { url: 'http://localhost:8081/PreferenceAssessment', route: 'PreferenceAssessment' },
  'Sensory Assessment': { url: 'http://localhost:8081/SensoryAssessment?', route: 'SensoryAssessment' },
};

export const SCORE_SCALE_PRESETS = [
  { label: '2-Level (0, 1, N/A)', short: '2-Lvl (0,1)', options: ['0 — Not Demonstrated', '1 — Mastered', 'N/A'] },
  { label: '4-Level (0, 1, 2, 3, N/A)', short: '4-Lvl', options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Developing', '3 — Mastered', 'N/A'] },
];

export const BEHAVIORAL_PRESETS = [
  { label: 'Likert 6-Pt', short: 'Likert (6)', options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'] },
  { label: 'Yes/No', short: 'Yes/No', options: ['Yes', 'No'] },
  { label: 'Intensity (Low/Med/High)', short: 'Intensity', options: ['Low', 'Medium', 'High'] },
  { label: 'ABC Behaviors', short: 'Behaviors', options: ['Aggression', 'Self-injury', 'Tantrum', 'Elopement', 'Non-compliance', 'Property destruction', 'Repetitive behaviors'] },
];

export const SENSORY_PRESETS = [
  { label: 'Engagement Level', short: 'Engagement', options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'] },
  { label: 'Reaction', short: 'Reaction', options: ['Enjoyed', 'Neutral', 'Refused', 'Not Observed'] },
];

export const getPresetsForForm = (formName: string) => {
  if (formName === 'ABLLS Assessment Form') return SCORE_SCALE_PRESETS;
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
  'Writing': 'H',
  'Dressing': 'I',
};

export const inferSectionFromId = (id: string): string | null => {
  if (!id) return null;
  const match = id.match(/^([A-I])\d+$/);
  if (!match) {
    if (id.startsWith('M') && /^\d+$/.test(id.slice(1))) return 'MASS';
    if (id.startsWith('F') && /^\d+$/.test(id.slice(1))) return 'FAST';
    if (id.startsWith('ABC-')) return 'ABC Tracking';
    if (id.startsWith('P') && /^\d+$/.test(id.slice(1))) return 'General';
    if (id.startsWith('SEN-')) return 'Tactile';
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

export const getNextIdForSection = (form: string, section: string | undefined, prevFields: FormField[]): string => {
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

  // Handle custom skill type folders (e.g. Visual Performance, Cognitive Skills, Requesting (Mands))
  if (section && section !== 'General') {
    const cleanWords = section
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let prefix = 'SEC';
    if (cleanWords.length > 1) {
      prefix = cleanWords.map((w) => w[0].toUpperCase()).join('').slice(0, 4);
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

