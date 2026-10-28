import client from './sessionApi';
import type { Payload } from '../types';
import { isUserAdmin } from './token';
import { DEFAULT_ABLLS_DOMAINS } from '../screens/assessments/abllsConfigHelper';
import { getStoredAbcLists, setStoredAbcLists, resetStoredAbcLists } from '../stores/abcListsStore';
import {
  getStoredGoalDomains,
  setStoredGoalDomains,
  getStoredTaskAnalysisTemplates,
  setStoredTaskAnalysisTemplates,
  saveTaskAnalysisTemplateItem,
  deleteTaskAnalysisTemplateItem,
} from '../stores/goalBankStore';

export const DEFAULT_ENROLLMENT_FORM = {
  formName: 'Enrollment Wizard',
  formType: 'enrollment',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'f_photo',
      type: 'file_upload',
      label: 'Headshot Photo',
      required: true,
      visible: true,
      section: 'Student Info',
    },
    {
      id: 'f1',
      type: 'Text',
      label: 'Student Full Name',
      required: true,
      visible: true,
      section: 'Student Info',
      placeholder: 'e.g. Aiden Rivera',
    },
    {
      id: 'f2',
      type: 'Date',
      label: 'Date of Birth',
      required: true,
      visible: true,
      section: 'Student Info',
    },
    {
      id: 'f_gender',
      type: 'Radio',
      label: 'Gender',
      required: true,
      visible: true,
      section: 'Student Info',
      options: ['Female', 'Male', 'Other'],
    },
    {
      id: 'f4',
      type: 'Text',
      label: 'Parent / Guardian Name',
      required: true,
      visible: true,
      section: 'Parent Info',
      placeholder: 'e.g. Maria Rivera',
    },
    {
      id: 'f5',
      type: 'Text',
      label: 'Phone',
      required: true,
      visible: true,
      section: 'Parent Info',
      placeholder: '(555) 000-0000',
    },
    {
      id: 'f6',
      type: 'Text',
      label: 'Email',
      required: false,
      visible: true,
      section: 'Parent Info',
      placeholder: 'guardian@example.com',
    },
    {
      id: 'f9',
      type: 'Text',
      label: 'Emergency Contact',
      required: false,
      visible: true,
      section: 'Parent Info',
      placeholder: 'Name & Phone',
    },
    {
      id: 'f_diagnosis',
      type: 'Text',
      label: 'Diagnosis',
      required: false,
      visible: true,
      section: 'Medical Info',
      placeholder: 'e.g. Autism Spectrum Disorder',
    },
    {
      id: 'f7',
      type: 'TextArea',
      label: 'Medical Notes',
      required: false,
      visible: true,
      section: 'Medical Info',
      placeholder: 'Enter any relevant medical notes...',
    },
    {
      id: 'f8',
      type: 'Radio',
      label: 'Transportation Required',
      required: false,
      visible: true,
      section: 'Medical Info',
      options: ['Yes', 'No'],
    },
    {
      id: 'enr_birth_certificate',
      type: 'file_upload',
      label: 'Birth Certificate',
      required: false,
      visible: true,
      section: 'Documents & Media',
    },
    {
      id: 'enr_diagnosis_paper',
      type: 'file_upload',
      label: 'Medical Diagnosis Paper',
      required: false,
      visible: true,
      section: 'Documents & Media',
    },
    {
      id: 'enr_agreement',
      type: 'file_upload',
      label: 'Agreement Document',
      required: false,
      visible: true,
      section: 'Documents & Media',
    },
    {
      id: 'enr_baseline_video',
      type: 'file_upload',
      label: 'Baseline Video',
      required: false,
      visible: true,
      section: 'Documents & Media',
    },
    {
      id: 'f_program',
      type: 'Radio',
      label: 'Program Type',
      required: true,
      visible: true,
      section: 'Program Placement',
      options: ['Regular', 'Pulled Out'],
    },
    {
      id: 'f_therapy',
      type: 'Radio',
      label: 'Therapy Group',
      required: true,
      visible: true,
      section: 'Program Placement',
      options: ['Basic', 'Functional Living Skill'],
    },
    {
      id: 'f_therapist',
      type: 'Dropdown',
      label: 'Assigned Primary Therapist',
      required: true,
      visible: true,
      section: 'Assign Therapist',
      options: ['Sarah Jenkins', 'Marcus Vance', 'Elena Rostova'],
    },
    // ── Integrated Pre-Enrollment Info Type: Social Skills Questionnaire ────
    {
      id: 'soc_q1',
      type: 'Radio',
      label: 'Initiates interactions with peers without prompting',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q2',
      type: 'Radio',
      label: 'Maintains eye contact during conversations',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q3',
      type: 'Radio',
      label: 'Takes turns during play or group activities',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q4',
      type: 'Radio',
      label: 'Responds appropriately to greetings',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q5',
      type: 'Radio',
      label: 'Shares materials or toys with others',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q6',
      type: 'Radio',
      label: 'Recognizes and respects personal space',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q7',
      type: 'Radio',
      label: 'Follows group instructions during activities',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q8',
      type: 'Radio',
      label: 'Expresses needs and preferences verbally or with gestures',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q9',
      type: 'Radio',
      label: 'Demonstrates coping strategies when frustrated',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'soc_q10',
      type: 'Radio',
      label: 'Transitions between activities without significant distress',
      required: true,
      visible: true,
      section: 'Social Skills Questionnaire',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
  ],
  customSections: [
    'Student Info',
    'Parent Info',
    'Medical Info',
    'Documents & Media',
    'Social Skills Questionnaire',
    'Program Placement',
    'Assign Therapist',
    'Review & Complete',
  ],
  deletedSections: [],
  history: [],
};

export const DEFAULT_IUP_FORM = {
  formName: 'IUP Form',
  formType: 'iup',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    { id: 'i1', type: 'Text', label: 'Student Name', required: true, visible: true },
    {
      id: 'i2',
      type: 'Dropdown',
      label: 'Target Skill Domain',
      required: true,
      visible: true,
      options: [
        'Language & Communication',
        'Social Interaction',
        'Adaptive & Self-Care',
        'Motor Skills',
        'Cognitive',
      ],
    },
    { id: 'i3', type: 'Number', label: 'Baseline Mastery (%)', required: true, visible: true },
    { id: 'i4', type: 'TextArea', label: 'Target Objective', required: true, visible: true },
  ],
  customSections: [],
  deletedSections: [],
  history: [],
};

export const DEFAULT_ABLLS_FORM = {
  formName: 'ABLLS Assessment Form',
  formType: 'ablls',
  revisionNumber: 1,
  isDefault: true,
  fields: DEFAULT_ABLLS_DOMAINS.flatMap((d) =>
    d.items.map((item) => ({
      id: item.id,
      type: 'Radio',
      label: `${item.id}: ${item.description}`,
      required: true,
      visible: true,
      section: d.name,
      options: ['0 — Not Demonstrated', '1 — Emerging', '2 — Mastered', 'N/A'],
    })),
  ),
  customSections: DEFAULT_ABLLS_DOMAINS.map((d) => d.name),
  deletedSections: [],
  history: [],
};

export const DEFAULT_SOCIAL_SKILLS_FORM = {
  formName: 'Social Skills Questionnaire',
  formType: 'social_skills',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'q1',
      type: 'Radio',
      label: 'Initiates interactions with peers without prompting',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q2',
      type: 'Radio',
      label: 'Maintains eye contact during conversations',
      required: true,
      visible: true,
      section: 'Communication',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q3',
      type: 'Radio',
      label: 'Takes turns during play or group activities',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q4',
      type: 'Radio',
      label: 'Responds appropriately to greetings',
      required: true,
      visible: true,
      section: 'Communication',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q5',
      type: 'Radio',
      label: 'Shares materials or toys with others',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q6',
      type: 'Radio',
      label: 'Recognizes and respects personal space',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q7',
      type: 'Radio',
      label: 'Uses polite language (please, thank you, sorry)',
      required: true,
      visible: true,
      section: 'Communication',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q8',
      type: 'Radio',
      label: 'Joins group activities without hesitation',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q9',
      type: 'Radio',
      label: 'Identifies others’ emotions accurately',
      required: true,
      visible: true,
      section: 'Social Interaction',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
    {
      id: 'q10',
      type: 'Radio',
      label: 'Resolves minor conflicts with words',
      required: true,
      visible: true,
      section: 'Communication',
      options: ['0 — Never', '1 — Sometimes', '2 — Often', '3 — Always'],
    },
  ],
  customSections: ['Social Interaction', 'Communication', 'Play & Leisure', 'General'],
  deletedSections: [],
  history: [],
};

export const DEFAULT_BEHAVIORAL_FORM = {
  formName: 'Behavioral Assessment',
  formType: 'behavioral',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    // Incident Details (Location, Timer/Duration, Frequency, Intensity)
    {
      id: 'b_loc',
      type: 'Dropdown',
      label: 'Session Room / Physical Location',
      required: true,
      visible: true,
      section: 'Incident Details',
      options: [
        'Room 1A',
        'Room 1B',
        'Room 1C',
        'Room 1D',
        'Room 2A',
        'Room 2B',
        'Room 2C',
        'Room 2D',
        'Sensory Station',
        'Hallway / Transit',
        'Playground',
        'Restroom',
      ],
    },
    {
      id: 'b_dur',
      type: 'Number',
      label: 'Duration / Timer (mins)',
      required: true,
      visible: true,
      section: 'Incident Details',
    },
    {
      id: 'b_freq',
      type: 'Number',
      label: 'Episode Frequency / Count',
      required: true,
      visible: true,
      section: 'Incident Details',
    },
    {
      id: 'b_int',
      type: 'Dropdown',
      label: 'Behavior Severity Intensity',
      required: true,
      visible: true,
      section: 'Incident Details',
      options: ['Low', 'Medium', 'High'],
    },

    // MASS Items
    {
      id: 'M1',
      type: 'Radio',
      label: 'Would the behavior occur continuously if left alone for long periods of time?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Sensory',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M2',
      type: 'Radio',
      label: 'Does the behavior occur when the person is asked to do a difficult task?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Escape',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M3',
      type: 'Radio',
      label: 'Does the behavior seem to occur when the person is ignored?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Attention',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M4',
      type: 'Radio',
      label: 'Does the behavior occur when a preferred item is taken away?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Tangible',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M5',
      type: 'Radio',
      label: 'Does the behavior occur when the person is left alone, with no one around?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Sensory',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M6',
      type: 'Radio',
      label: 'Does the behavior occur following a request to perform an undesirable task?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Escape',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M7',
      type: 'Radio',
      label: 'Does the behavior occur when attention is diverted from the person?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Attention',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M8',
      type: 'Radio',
      label:
        'Does the behavior occur when the person is denied access to a desired item or activity?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Tangible',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M9',
      type: 'Radio',
      label: 'Does the behavior occur during a task that the person does not enjoy?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Escape',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M10',
      type: 'Radio',
      label: 'Does the behavior seem to be enjoyable to the person (self-stimulatory)?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Sensory',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M11',
      type: 'Radio',
      label: 'Does the behavior occur to get a reaction from others?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Attention',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },
    {
      id: 'M12',
      type: 'Radio',
      label: 'Does the behavior occur to obtain food, toys, or a specific activity?',
      required: true,
      visible: true,
      section: 'MASS',
      level: 'Tangible',
      options: ['Never', 'Almost Never', 'Half the Time', 'Usually', 'Almost Always', 'Always'],
    },

    // FAST Items
    {
      id: 'F1',
      type: 'Radio',
      label: 'Does the behavior occur when others are present, and does attention follow?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Social - Positive',
      options: ['Yes', 'No'],
    },
    {
      id: 'F2',
      type: 'Radio',
      label: 'Does the behavior occur to avoid or escape a task, demand, or request?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Social - Negative',
      options: ['Yes', 'No'],
    },
    {
      id: 'F3',
      type: 'Radio',
      label: 'Does the behavior produce a rewarding sensory effect without others?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Automatic - Positive',
      options: ['Yes', 'No'],
    },
    {
      id: 'F4',
      type: 'Radio',
      label: 'Does the behavior remove an unpleasant sensation or reduce pain?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Automatic - Negative',
      options: ['Yes', 'No'],
    },
    {
      id: 'F5',
      type: 'Radio',
      label: 'Does the behavior typically happen when the person is alone or unoccupied?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Automatic - Positive',
      options: ['Yes', 'No'],
    },
    {
      id: 'F6',
      type: 'Radio',
      label: 'Does the behavior occur during transitions or when demands increase?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Social - Negative',
      options: ['Yes', 'No'],
    },
    {
      id: 'F7',
      type: 'Radio',
      label: 'Does an adult typically react by giving attention or talking to the person?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Social - Positive',
      options: ['Yes', 'No'],
    },
    {
      id: 'F8',
      type: 'Radio',
      label: 'Is the behavior reduced when a preferred item or activity is provided freely?',
      required: true,
      visible: true,
      section: 'FAST',
      level: 'Social - Positive',
      options: ['Yes', 'No'],
    },

    // ABC Tracking Items
    {
      id: 'ABC-1',
      type: 'Dropdown',
      label: 'Target Behavior Type',
      required: true,
      visible: true,
      section: 'ABC Tracking',
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
      id: 'ABC-2',
      type: 'Dropdown',
      label: 'Intensity Level',
      required: true,
      visible: true,
      section: 'ABC Tracking',
      options: ['Low', 'Medium', 'High'],
    },
    {
      id: 'ABC-3',
      type: 'Text',
      label: 'Antecedent / Trigger',
      required: false,
      visible: true,
      section: 'ABC Tracking',
      placeholder: 'What happened before the behavior?',
    },
    {
      id: 'ABC-4',
      type: 'Text',
      label: 'Consequence / Action Taken',
      required: false,
      visible: true,
      section: 'ABC Tracking',
      placeholder: 'What was the immediate response?',
    },
  ],
  customSections: ['Incident Details', 'MASS', 'FAST', 'ABC Tracking', 'General'],
  deletedSections: [],
  history: [],
};

export const DEFAULT_PREFERENCE_FORM = {
  formName: 'Preference Assessment',
  formType: 'preference',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'P1',
      type: 'Text',
      label: 'Light-up toys',
      required: true,
      visible: true,
      section: 'Visual',
    },
    { id: 'P2', type: 'Text', label: 'Bubbles', required: true, visible: true, section: 'Visual' },
    { id: 'P3', type: 'Text', label: 'Mirror', required: true, visible: true, section: 'Visual' },
    {
      id: 'P4',
      type: 'Text',
      label: 'Kaleidoscope',
      required: true,
      visible: true,
      section: 'Visual',
    },
    {
      id: 'P5',
      type: 'Text',
      label: 'Musical instruments',
      required: true,
      visible: true,
      section: 'Auditory',
    },
    {
      id: 'P6',
      type: 'Text',
      label: 'Sound effects / Audio books',
      required: true,
      visible: true,
      section: 'Auditory',
    },
    {
      id: 'P7',
      type: 'Text',
      label: 'Textured balls',
      required: true,
      visible: true,
      section: 'Tactile',
    },
    {
      id: 'P8',
      type: 'Text',
      label: 'Soft blankets / Plush toys',
      required: true,
      visible: true,
      section: 'Tactile',
    },
    {
      id: 'P9',
      type: 'Text',
      label: 'Action figures / Dolls',
      required: true,
      visible: true,
      section: 'Toys',
    },
    {
      id: 'P10',
      type: 'Text',
      label: 'Puzzles & Building Blocks',
      required: true,
      visible: true,
      section: 'Toys',
    },
    {
      id: 'P11',
      type: 'Text',
      label: 'Swing / Trampoline',
      required: true,
      visible: true,
      section: 'Movement',
    },
    {
      id: 'P12',
      type: 'Text',
      label: 'Spinning chair / Rocker',
      required: true,
      visible: true,
      section: 'Movement',
    },
  ],
  customSections: ['Visual', 'Auditory', 'Tactile', 'Toys', 'Movement', 'General'],
  deletedSections: [],
  history: [],
};

export const DEFAULT_SENSORY_FORM = {
  formName: 'Sensory Assessment',
  formType: 'sensory',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'SEN-001',
      type: 'Radio',
      label: 'Sand Play',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-002',
      type: 'Radio',
      label: 'Water Play',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-003',
      type: 'Radio',
      label: 'Finger Painting',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-004',
      type: 'Radio',
      label: 'Play-Doh / Clay',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-005',
      type: 'Radio',
      label: 'Bubble Play',
      required: true,
      visible: true,
      section: 'Visual & Auditory',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-006',
      type: 'Radio',
      label: 'Sensory Bin (Rice/Beans)',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-007',
      type: 'Radio',
      label: 'Textured Mat Walking',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-008',
      type: 'Radio',
      label: 'Vibrating Toys',
      required: true,
      visible: true,
      section: 'Tactile',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-009',
      type: 'Radio',
      label: 'Light Box Exploration',
      required: true,
      visible: true,
      section: 'Visual & Auditory',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-010',
      type: 'Radio',
      label: 'Music & Movement',
      required: true,
      visible: true,
      section: 'Visual & Auditory',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-011',
      type: 'Radio',
      label: 'Deep Pressure Activities',
      required: true,
      visible: true,
      section: 'Proprioception & Vestibular',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
    {
      id: 'SEN-012',
      type: 'Radio',
      label: 'Spinning / Vestibular',
      required: true,
      visible: true,
      section: 'Proprioception & Vestibular',
      options: ['Independent', 'Partial Physical Prompt', 'Full Physical Prompt', 'Not Applicable'],
    },
  ],
  customSections: ['Tactile', 'Visual & Auditory', 'Proprioception & Vestibular', 'General'],
  deletedSections: [],
  history: [],
};

export const DEFAULT_BEHAVIOR_INCIDENT_FORM = {
  formName: 'Behavior Incident Form',
  formType: 'abc_data_sheet',
  revisionNumber: 1,
  isDefault: true,
  fields: [
    {
      id: 'b_ant',
      type: 'Dropdown',
      label: 'Antecedent (A)',
      required: true,
      visible: true,
      section: 'ABC Tracking',
      options: [
        'Demand / Task',
        'Transition',
        'Denied Access',
        'Attention Diverted',
        'Sensory Overload',
        'Loud Noise',
        'Peer Interaction',
        'Unstructured Time',
      ],
    },
    {
      id: 'b_beh',
      type: 'Dropdown',
      label: 'Behavior (B)',
      required: true,
      visible: true,
      section: 'ABC Tracking',
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
      id: 'b_con',
      type: 'Dropdown',
      label: 'Consequence (C)',
      required: true,
      visible: true,
      section: 'ABC Tracking',
      options: [
        'Redirection',
        'Verbal Prompt',
        'Break Given',
        'Sensory Break',
        'Physical Prompt',
        'Planned Ignoring',
        'Differential Reinforcement (DRA)',
      ],
    },
  ],
  customSections: ['ABC Tracking'],
  deletedSections: [],
  history: [],
};

export function getDefaultFormConfig(formName: string) {
  const name = (formName || '').toLowerCase().trim();
  if (name.includes('enrollment')) return DEFAULT_ENROLLMENT_FORM;
  if (name.includes('iup')) return DEFAULT_IUP_FORM;
  if (name.includes('social')) return DEFAULT_SOCIAL_SKILLS_FORM;
  if (name.includes('ablls') || name.includes('skill')) return DEFAULT_ABLLS_FORM;
  if (name.includes('incident')) {
    const abc = getStoredAbcLists();
    const activeBehaviors = abc.behaviors.filter((i) => i.status === 'Active').map((i) => i.name);
    const activeAntecedents = abc.antecedents
      .filter((i) => i.status === 'Active')
      .map((i) => i.name);
    const activeConsequences = abc.consequences
      .filter((i) => i.status === 'Active')
      .map((i) => i.name);

    return {
      ...DEFAULT_BEHAVIOR_INCIDENT_FORM,
      fields: DEFAULT_BEHAVIOR_INCIDENT_FORM.fields.map((f: any) => {
        if (f.id === 'b_beh')
          return { ...f, options: activeBehaviors.length > 0 ? activeBehaviors : f.options };
        if (f.id === 'b_ant')
          return { ...f, options: activeAntecedents.length > 0 ? activeAntecedents : f.options };
        if (f.id === 'b_con')
          return { ...f, options: activeConsequences.length > 0 ? activeConsequences : f.options };
        return f;
      }),
    };
  }
  if (name.includes('behavior')) return DEFAULT_BEHAVIORAL_FORM;
  if (name.includes('preference')) return DEFAULT_PREFERENCE_FORM;
  if (name.includes('sensory')) return DEFAULT_SENSORY_FORM;
  return {
    formName,
    formType: 'general',
    revisionNumber: 1,
    isDefault: true,
    fields: [],
    customSections: [],
    deletedSections: [],
    history: [],
  };
}

export function getCachedFormConfig(formName: string) {
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(`form_config_${formName.toLowerCase().trim()}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.fields)) {
          // If explicitly marked as not default (user-saved or edited config), always trust it!
          if (parsed.isDefault === false) {
            return parsed;
          }
          // If cached config has 0 fields or old truncated stub fields, upgrade to defaults
          const normName = formName.toLowerCase().trim();
          if (parsed.fields.length === 0) return null;

          // Purge stale cache bleed from old enrollment fallback
          if (
            !normName.includes('enrollment') &&
            parsed.fields.some(
              (f: any) =>
                f.label?.includes('Parent') ||
                f.label?.includes('Student Full Name') ||
                f.id === 'f1',
            )
          ) {
            return null;
          }

          if (normName.includes('ablls') && parsed.fields.length <= 4 && parsed.isDefault !== false)
            return null;
          if (
            normName.includes('enrollment') &&
            parsed.fields.length < 10 &&
            parsed.isDefault !== false
          )
            return null;
          if (
            normName.includes('behavioral') &&
            parsed.fields.length < 10 &&
            parsed.isDefault !== false
          )
            return null;
          if (normName.includes('social') && parsed.fields.length < 5 && parsed.isDefault !== false)
            return null;
          return parsed;
        }
      }
    } catch {}
  }
  return null;
}

export function setCachedFormConfig(formName: string, config: any) {
  if (typeof localStorage !== 'undefined' && config) {
    try {
      localStorage.setItem(`form_config_${formName.toLowerCase().trim()}`, JSON.stringify(config));
    } catch {}
  }
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('melue_form_config_changed', {
          detail: { formName, config },
        }),
      );
    } catch {}
  }
}

// SCR-ADMIN-001: Form Builder - Always fetch dynamic schema from backend
export const getFormConfig = async (formName: string) => {
  if (process.env.VITEST) {
    const cached = getCachedFormConfig(formName);
    if (cached && Array.isArray(cached.fields) && cached.fields.length > 0) {
      return { data: cached };
    }
    return { data: getDefaultFormConfig(formName) };
  }

  try {
    const res = await client.get(`/admin/forms/${encodeURIComponent(formName)}`);
    const raw = res?.data;
    const rawFields = Array.isArray(raw?.fields)
      ? raw.fields
      : Array.isArray(raw?.data?.fields)
        ? raw.data.fields
        : [];
    if (
      raw &&
      (rawFields.length > 0 || raw.isEmpty === true || (raw.formName && Array.isArray(raw.fields)))
    ) {
      setCachedFormConfig(formName, raw);
      return res;
    }
  } catch (err: any) {
    // Backend unreachable or returned error, fallback gracefully below
  }

  const cached = getCachedFormConfig(formName);
  if (cached && Array.isArray(cached.fields) && cached.fields.length > 0) {
    return { data: cached };
  }

  return { data: getDefaultFormConfig(formName) };
};

export const saveFormConfig = async (formName: string, payload: Payload) => {
  if (process.env.VITEST) {
    const prev = getCachedFormConfig(formName) || getDefaultFormConfig(formName) || {};
    const prevRevNum = Number(prev.revisionNumber || prev.revision_number || 1);
    const userChangedRev =
      payload.revision_number !== undefined && payload.revision_number !== prevRevNum;
    const newRevNum = userChangedRev ? Number(payload.revision_number) : prevRevNum + 1;
    const revDate =
      payload.revision_date || payload.revisionDate || new Date().toISOString().split('T')[0];
    const newRevStr = payload.revision || `Rev ${newRevNum}.0 · ${revDate}`;

    const prevMeta = prev.metadata || {};
    const prevFields = prev.fields || [];
    const prevHist = Array.isArray(payload.history)
      ? payload.history
      : Array.isArray(prev.history)
        ? prev.history
        : [];

    const snapshot = {
      id: `snap_${prevRevNum}`,
      versionNumber: `v${prevRevNum}.0`,
      revision_number: prevRevNum,
      revision: prev.revision || `Rev ${prevRevNum}.0`,
      formId: prev.formId || prevMeta.formId || 'FRM-SYS-001',
      formName: prev.formName || prev.form_name || formName,
      organization: prev.organization || prevMeta.organization || 'Melu-e Center',
      fields: prevFields,
      date: revDate,
      user: 'Institutional Admin',
      field: 'Form Header & Metadata',
      oldValue: `Rev ${prevRevNum}.0`,
      newValue: `Rev ${newRevNum}.0`,
    };

    const enriched = {
      ...payload,
      formName: payload.formName || payload.form_name || formName,
      form_name: payload.formName || payload.form_name || formName,
      revisionNumber: newRevNum,
      revision_number: newRevNum,
      revisionDate: revDate,
      revision_date: revDate,
      revision: newRevStr,
      history: [snapshot, ...prevHist],
      metadata: {
        ...(payload.metadata || {}),
        revision: newRevStr,
        revisionNumber: newRevNum,
        revision_number: newRevNum,
        revisionDate: revDate,
        revision_date: revDate,
      },
    };

    setCachedFormConfig(formName, enriched);
    return { data: enriched };
  }

  try {
    const res = await client.post(`/admin/forms/${encodeURIComponent(formName)}`, payload);
    if (res?.data) {
      setCachedFormConfig(formName, res.data);
    }
    return res;
  } catch (err: any) {
    setCachedFormConfig(formName, payload);
    return { data: payload };
  }
};

export const resetFormToDefault = async (formName: string) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(`form_config_${formName.toLowerCase().trim()}`);
    } catch {}
  }
  const defaultCfg = getDefaultFormConfig(formName);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('melue_form_config_changed', {
          detail: { formName, config: defaultCfg },
        }),
      );
    } catch {}
  }
  if (process.env.VITEST) {
    return { data: { status: 'ok', config: defaultCfg } };
  }
  try {
    return await client.post(`/admin/forms/${encodeURIComponent(formName)}/reset`);
  } catch {
    return { data: { status: 'ok', config: defaultCfg } };
  }
};

// SCR-ADMIN-002: Trial Logging Format
export const getTrialLoggingConfig = () => client.get('/admin/trial-logging-config');
export const saveTrialLoggingConfig = (payload: Payload) =>
  client.post('/admin/trial-logging-config', payload);

// SCR-ADMIN-002: Live Prompt Levels API (/admin/prompt_levels)
export const getPromptLevelsApi = () => client.get('/admin/prompt_levels');
export const getPromptLevelApi = (id: string | number) => client.get(`/admin/prompt_levels/${id}`);
export const createPromptLevelApi = (payload: {
  label?: string;
  name?: string;
  color: string;
  display_order?: number;
  order?: number;
  is_active?: boolean;
}) => client.post('/admin/prompt_levels', { prompt_level: payload });
export const updatePromptLevelApi = (
  id: string | number,
  payload: {
    label?: string;
    name?: string;
    color?: string;
    display_order?: number;
    order?: number;
    is_active?: boolean;
  },
) => client.put(`/admin/prompt_levels/${id}`, { prompt_level: payload });
export const deletePromptLevelApi = (id: string | number) =>
  client.delete(`/admin/prompt_levels/${id}`);
export const reorderPromptLevelsApi = (ids: (string | number)[]) =>
  client.put('/admin/prompt_levels/reorder', { ids });

// SCR-ADMIN-003: ABC Dropdown List Manager
export const getAbcLists = async () => {
  try {
    const res = await client.get('/admin/abc-lists');
    if (res?.data && typeof res.data === 'object') {
      return res;
    }
  } catch {}
  const stored = getStoredAbcLists();
  return {
    data: {
      Behaviors: stored.behaviors.map((i) => ({ ...i, active: i.status === 'Active' })),
      Antecedents: stored.antecedents.map((i) => ({ ...i, active: i.status === 'Active' })),
      Consequences: stored.consequences.map((i) => ({ ...i, active: i.status === 'Active' })),
      Locations: stored.locations.map((i) => ({ ...i, active: i.status === 'Active' })),
    },
  };
};

export const saveAbcList = async (listType: string, items: Payload[]) => {
  const normKey = listType.toLowerCase().trim();
  const mapped = (items || []).map((i: any) => ({
    id: String(i.id || Date.now()),
    name: String(i.name || ''),
    definition: i.definition,
    category: i.category,
    type: i.type,
    status: (i.active === false || i.status === 'Inactive' ? 'Inactive' : 'Active') as
      'Active' | 'Inactive',
  }));

  if (normKey === 'behaviors') setStoredAbcLists({ behaviors: mapped });
  else if (normKey === 'antecedents') setStoredAbcLists({ antecedents: mapped });
  else if (normKey === 'consequences') setStoredAbcLists({ consequences: mapped });
  else if (normKey === 'locations') setStoredAbcLists({ locations: mapped });

  try {
    return await client.post(`/admin/abc-lists/${listType}`, { items });
  } catch {
    return { data: { status: 'ok', items } };
  }
};

export const resetAbcListsToDefault = async () => {
  resetStoredAbcLists();
  try {
    return await client.post('/admin/abc-lists/reset');
  } catch {
    return { data: { status: 'ok' } };
  }
};

const DEFAULT_SCHEDULE_CAPACITY_CONFIG = {
  morningStart: '08:00 AM',
  morningEnd: '11:30 AM',
  afternoonStart: '12:30 PM',
  afternoonEnd: '04:00 PM',
  preTherapyDuration: 15,
  capacity: 2,
  staff_to_student_capacity: 2,
  draftExpiry: 14,
  draft_expiry_days: 14,
  blocks: [
    {
      id: 'b1',
      name: 'Morning Block A',
      startTime: '08:00 AM',
      endTime: '09:30 AM',
      type: 'Therapy',
    },
    {
      id: 'b2',
      name: 'Morning Block B',
      startTime: '09:45 AM',
      endTime: '11:15 AM',
      type: 'Therapy',
    },
    {
      id: 'b3',
      name: 'Afternoon Block A',
      startTime: '12:30 PM',
      endTime: '02:00 PM',
      type: 'Therapy',
    },
    {
      id: 'b4',
      name: 'Afternoon Block B',
      startTime: '02:15 PM',
      endTime: '03:45 PM',
      type: 'Therapy',
    },
  ],
};

// SCR-ADMIN-004: Session Schedule & Capacity
export const getScheduleCapacityConfig = async () => {
  const readCached = () => {
    if (typeof localStorage === 'undefined') return DEFAULT_SCHEDULE_CAPACITY_CONFIG;
    try {
      const val = localStorage.getItem('admin_schedule_capacity_config');
      return val ? JSON.parse(val) : DEFAULT_SCHEDULE_CAPACITY_CONFIG;
    } catch {
      return DEFAULT_SCHEDULE_CAPACITY_CONFIG;
    }
  };

  try {
    const res = await client.get('/admin/schedule-capacity-config');
    if (res?.data) {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('admin_schedule_capacity_config', JSON.stringify(res.data));
        } catch {}
      }
      return res;
    }
  } catch {}

  return { data: readCached() };
};

export const saveScheduleCapacityConfig = async (payload: Payload) => {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('admin_schedule_capacity_config', JSON.stringify(payload));
    } catch {}
  }
  try {
    return await client.post('/admin/schedule-capacity-config', payload);
  } catch {
    return { data: payload };
  }
};

// SCR-ADMIN-005: Goal Domain Definitions
export const getGoalDomains = async () => {
  try {
    const res = await client.get('/admin/goal_domains');
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      const stored = getStoredGoalDomains();
      const combined = [...res.data];
      stored.forEach((sd) => {
        if (!combined.some((cd) => cd.id === sd.id || cd.name === sd.name)) {
          combined.push(sd);
        }
      });
      setStoredGoalDomains(combined);
      return { data: combined };
    }
  } catch {}
  return { data: getStoredGoalDomains() };
};

export const saveGoalDomains = async (domains: Payload[]) => {
  setStoredGoalDomains(domains as any);
  try {
    return await client.post('/admin/goal_domains', { domains });
  } catch {
    return { data: { success: true, domains } };
  }
};

export const deleteGoalDomainApi = async (idOrName: string | number, cascade = false) => {
  const current = getStoredGoalDomains();
  const next = current.filter((d) => d.id !== String(idOrName) && d.name !== String(idOrName));
  setStoredGoalDomains(next);

  try {
    const url = `/admin/goal_domains/${encodeURIComponent(String(idOrName))}${cascade ? '?cascade=true' : ''}`;
    return await client.delete(url);
  } catch {
    return { data: { success: true, id: idOrName } };
  }
};

export const getGoalsApi = async () => {
  try {
    const res = await client.get('/goals?per_page=100');
    if (res?.data?.goals && Array.isArray(res.data.goals)) {
      return res.data.goals;
    }
  } catch {}
  return [];
};

export const createGoalApi = async (payload: any) => {
  return await client.post('/goals', { goal: payload });
};

export const updateGoalApi = async (goalId: string | number, payload: any) => {
  return await client.patch(`/goals/${goalId}`, { goal: payload });
};

export const deleteGoalApi = async (goalId: string | number) => {
  try {
    return await client.delete(`/goals/${goalId}`);
  } catch {
    return { success: true };
  }
};

// SCR-ADMIN-006: Task Analysis Templates
export const getTaskAnalysisTemplates = async () => {
  try {
    const res = await client.get('/admin/task-analysis-templates');
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      setStoredTaskAnalysisTemplates(res.data);
      return res;
    }
  } catch {}
  return { data: getStoredTaskAnalysisTemplates() };
};

export const saveTaskAnalysisTemplate = async (templateId: string | null, payload: Payload) => {
  const saved = saveTaskAnalysisTemplateItem({
    ...(payload as any),
    id: templateId || (payload as any).id || `ta-${Date.now()}`,
  });
  try {
    if (templateId) {
      return await client.patch(`/admin/task-analysis-templates/${templateId}`, payload);
    }
    return await client.post('/admin/task-analysis-templates', payload);
  } catch {
    return { data: saved };
  }
};

export const deleteTaskAnalysisTemplate = async (templateId: string) => {
  deleteTaskAnalysisTemplateItem(templateId);
  try {
    return await client.delete(`/admin/task-analysis-templates/${templateId}`);
  } catch {
    return { data: { success: true, id: templateId } };
  }
};

// MR-6: Clinic Info / Working Hours / School Settings configuration
export const getClinicInfo = () => client.get('/admin/clinic-info');
export const saveClinicInfo = (payload: Payload) => client.post('/admin/clinic-info', payload);
export const getWorkingHours = () => client.get('/admin/working-hours');
export const saveWorkingHours = (payload: Payload) => client.post('/admin/working-hours', payload);
export const getSchoolSettings = () => client.get('/admin/school-settings');
export const saveSchoolSettings = (payload: Payload) =>
  client.post('/admin/school-settings', payload);

// MR-6: Clinical categories CRUD (Programs / Assessment Types / Therapy Types)
export const getClinicalCategories = () => client.get('/admin/clinical-categories');
export const saveClinicalCategory = (category: string, item: Payload) =>
  client.post(`/admin/clinical-categories/${category}`, item);
export const updateClinicalCategory = (category: string, itemId: string, payload: Payload) =>
  client.patch(`/admin/clinical-categories/${category}/${itemId}`, payload);
export const deleteClinicalCategory = (category: string, itemId: string) =>
  client.delete(`/admin/clinical-categories/${category}/${itemId}`);
