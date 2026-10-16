// src/stores/goalBankStore.ts
//
// Single source of truth for Goal Domains and Target Goals (Goal Bank).
// Configured and edited on Goal Domain Definitions (/GoalDomainDefinitions)
// and consumed dynamically in IUP Generation (/IupGeneration).

export interface GoalDomain {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface TaskAnalysisStep {
  id: string;
  description: string;
}

export interface TaskAnalysisTemplate {
  id: string;
  name: string;
  description: string;
  steps: TaskAnalysisStep[];
  perStepMastery?: number;
  overallMastery?: number;
  active?: boolean;
}

export interface GoalBankItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  goalType: 'standard' | 'task_analysis';
  masteryCriteria: string;
  active: boolean;
  status?: 'active' | 'inactive';
  usageCount?: number;
}

export const GOAL_DOMAINS_STORAGE_KEY = 'melue_goal_domains';
export const GOAL_BANK_STORAGE_KEY = 'melue_goal_bank';
export const TASK_ANALYSIS_STORAGE_KEY = 'melue_task_analysis_templates';

export const DEFAULT_GOAL_DOMAINS: GoalDomain[] = [
  {
    id: 'd-comm',
    name: 'Communication',
    description: 'Receptive & expressive language, manding, tacting, and verbal operants.',
    active: true,
  },
  {
    id: 'd-motor',
    name: 'Motor',
    description: 'Gross & fine motor imitation, physical mechanics, and bilateral coordination.',
    active: true,
  },
  {
    id: 'd-social',
    name: 'Social',
    description: 'Peer interaction, joint attention, turn-taking, and cooperative play.',
    active: true,
  },
  {
    id: 'd-selfhelp',
    name: 'Self-Help',
    description: 'Daily living activities, personal hygiene, feeding, and dressing routines.',
    active: true,
  },
  {
    id: 'd-cog',
    name: 'Cognition',
    description: 'Visual performance, sorting, matching, early academic readiness concepts.',
    active: true,
  },
  {
    id: 'd-adapt',
    name: 'Adaptive',
    description: 'Emotional regulation, coping mechanisms, and transition compliance.',
    active: true,
  },
];

export const DEFAULT_GOAL_ITEMS: GoalBankItem[] = [
  {
    id: 'g-1',
    name: 'Receptive Identification of Common Objects',
    domain: 'Communication',
    description: 'Selects the specified item from a field of 3-4 items upon verbal instruction without physical prompt.',
    goalType: 'standard',
    masteryCriteria: '80% accuracy across 3 consecutive sessions',
    active: true,
    status: 'active',
    usageCount: 14,
  },
  {
    id: 'g-2',
    name: 'Expressive Manding for Preferred Items',
    domain: 'Communication',
    description: 'Independently mands (requests) for preferred items using 2+ word phrases across multiple communication partners.',
    goalType: 'standard',
    masteryCriteria: '85% unprompted across 3 therapists',
    active: true,
    status: 'active',
    usageCount: 19,
  },
  {
    id: 'g-3',
    name: 'Gross Motor Imitation',
    domain: 'Motor',
    description: 'Imitates 10 gross motor actions presented by instructor (e.g. clap hands, stomp feet, arms up).',
    goalType: 'standard',
    masteryCriteria: '80% independent accuracy across 3 sessions',
    active: true,
    status: 'active',
    usageCount: 8,
  },
  {
    id: 'g-4',
    name: 'Peer Greeting & Shared Attention',
    domain: 'Social',
    description: 'Initiates or responds to peer greeting within 5 seconds of peer arrival and maintains orientation.',
    goalType: 'standard',
    masteryCriteria: '90% accuracy with 1 verbal prompt across 5 sessions',
    active: true,
    status: 'active',
    usageCount: 9,
  },
  {
    id: 'g-5',
    name: 'Hand Washing Routine',
    domain: 'Self-Help',
    description: 'Completes sequential 6-step hand washing routine upon bathroom transition with decreasing prompt levels.',
    goalType: 'task_analysis',
    masteryCriteria: '100% completion of steps independently',
    active: true,
    status: 'active',
    usageCount: 15,
  },
  {
    id: 'g-6',
    name: 'Functional Object Sorting by Feature / Function',
    domain: 'Cognition',
    description: 'Sorts objects and picture cards into categories based on color, shape, or functional class.',
    goalType: 'standard',
    masteryCriteria: '80% across 3 consecutive sessions',
    active: true,
    status: 'active',
    usageCount: 11,
  },
  {
    id: 'g-7',
    name: 'Tooth Brushing Sequence',
    domain: 'Self-Help',
    description: 'Executes tooth brushing steps (wet brush, apply paste, brush top/bottom, spit, rinse).',
    goalType: 'task_analysis',
    masteryCriteria: '80% independent steps across 3 consecutive sessions',
    active: true,
    status: 'active',
    usageCount: 7,
  },
  {
    id: 'g-8',
    name: 'Turn-Taking in Structured Board Activity',
    domain: 'Social',
    description: 'Waits for peer turn without interrupting or grabbing game materials for up to 3 turns.',
    goalType: 'standard',
    masteryCriteria: '80% adherence across 4 consecutive structured game trials',
    active: true,
    status: 'active',
    usageCount: 10,
  },
];

export const DEFAULT_TASK_ANALYSIS_TEMPLATES: TaskAnalysisTemplate[] = [
  {
    id: 'ta-1',
    name: 'Hand Washing Routine',
    description: 'Sequential 6-step bathroom hand washing procedure.',
    steps: [
      { id: 's-1', description: 'Turn on water faucet' },
      { id: 's-2', description: 'Wet hands with water' },
      { id: 's-3', description: 'Dispense soap and rub palms together for 10s' },
      { id: 's-4', description: 'Rinse soap off hands thoroughly' },
      { id: 's-5', description: 'Turn off water faucet' },
      { id: 's-6', description: 'Dry hands with paper towel' },
    ],
    perStepMastery: 80,
    overallMastery: 85,
    active: true,
  },
  {
    id: 'ta-2',
    name: 'Tooth Brushing Sequence',
    description: 'Step-by-step oral hygiene routine.',
    steps: [
      { id: 's-21', description: 'Take toothbrush and wet bristles' },
      { id: 's-22', description: 'Apply pea-sized toothpaste to brush' },
      { id: 's-23', description: 'Brush outer surfaces of teeth' },
      { id: 's-24', description: 'Brush chewing surfaces and tongue' },
      { id: 's-25', description: 'Spit excess foam into sink' },
      { id: 's-26', description: 'Rinse mouth and toothbrush with water' },
    ],
    perStepMastery: 80,
    overallMastery: 80,
    active: true,
  },
];

// Helper to notify listeners across the application
function notifyEvent(eventName: string, detail?: any) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    } catch {}
  }
}

// ── Goal Domains ──
export function getStoredGoalDomains(): GoalDomain[] {
  if (typeof localStorage === 'undefined') return DEFAULT_GOAL_DOMAINS;
  try {
    const raw = localStorage.getItem(GOAL_DOMAINS_STORAGE_KEY);
    if (!raw) {
      setStoredGoalDomains(DEFAULT_GOAL_DOMAINS);
      return DEFAULT_GOAL_DOMAINS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_GOAL_DOMAINS;
  } catch {
    return DEFAULT_GOAL_DOMAINS;
  }
}

export function setStoredGoalDomains(domains: GoalDomain[]): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(GOAL_DOMAINS_STORAGE_KEY, JSON.stringify(domains));
    } catch {}
  }
  notifyEvent('melue_goal_domains_changed', { domains });
}

// ── Goal Bank ──
export const DELETED_GOALS_STORAGE_KEY = 'melue_deleted_goal_ids';

export function getDeletedGoalIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_GOALS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDeletedGoalId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getDeletedGoalIds();
    if (!current.includes(id)) {
      localStorage.setItem(DELETED_GOALS_STORAGE_KEY, JSON.stringify([...current, id]));
    }
  } catch {}
}

export function removeDeletedGoalId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = getDeletedGoalIds();
    if (current.includes(id)) {
      localStorage.setItem(DELETED_GOALS_STORAGE_KEY, JSON.stringify(current.filter((x) => x !== id)));
    }
  } catch {}
}

export function getStoredGoalBank(): GoalBankItem[] {
  if (typeof localStorage === 'undefined') return DEFAULT_GOAL_ITEMS;
  try {
    const raw = localStorage.getItem(GOAL_BANK_STORAGE_KEY);
    const deletedIds = getDeletedGoalIds();
    if (!raw) {
      const filteredDefaults = DEFAULT_GOAL_ITEMS.filter((g) => !deletedIds.includes(g.id));
      setStoredGoalBank(filteredDefaults);
      return filteredDefaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((g) => !deletedIds.includes(g.id));
    }
    return DEFAULT_GOAL_ITEMS.filter((g) => !deletedIds.includes(g.id));
  } catch {
    return DEFAULT_GOAL_ITEMS;
  }
}

export function setStoredGoalBank(goals: GoalBankItem[]): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(GOAL_BANK_STORAGE_KEY, JSON.stringify(goals));
    } catch {}
  }
  notifyEvent('melue_goal_bank_changed', { goals });
}

export function saveGoalItem(item: Partial<GoalBankItem> & { name: string; domain?: string }): GoalBankItem {
  const current = getStoredGoalBank();
  const id = item.id || `g-${Date.now()}`;
  removeDeletedGoalId(id);
  const existingIdx = current.findIndex((g) => g.id === id);

  const normalized: GoalBankItem = {
    id,
    name: item.name.trim(),
    domain: item.domain || 'Communication',
    description: item.description?.trim() || '',
    goalType: item.goalType || 'standard',
    masteryCriteria: item.masteryCriteria?.trim() || '80% accuracy across 3 consecutive sessions',
    active: item.active !== false && item.status !== 'inactive',
    status: (item.active === false || item.status === 'inactive') ? 'inactive' : 'active',
    usageCount: typeof item.usageCount === 'number' ? item.usageCount : 0,
  };

  let updated: GoalBankItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...normalized };
  } else {
    updated = [normalized, ...current];
  }

  setStoredGoalBank(updated);
  return normalized;
}

export function deleteGoalItem(id: string): void {
  recordDeletedGoalId(id);
  const current = getStoredGoalBank();
  const updated = current.filter((g) => g.id !== id);
  setStoredGoalBank(updated);
}

// ── Task Analysis Templates ──
export function getStoredTaskAnalysisTemplates(): TaskAnalysisTemplate[] {
  if (typeof localStorage === 'undefined') return DEFAULT_TASK_ANALYSIS_TEMPLATES;
  try {
    const raw = localStorage.getItem(TASK_ANALYSIS_STORAGE_KEY);
    if (!raw) {
      setStoredTaskAnalysisTemplates(DEFAULT_TASK_ANALYSIS_TEMPLATES);
      return DEFAULT_TASK_ANALYSIS_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_TASK_ANALYSIS_TEMPLATES;
  } catch {
    return DEFAULT_TASK_ANALYSIS_TEMPLATES;
  }
}

export function setStoredTaskAnalysisTemplates(templates: TaskAnalysisTemplate[]): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TASK_ANALYSIS_STORAGE_KEY, JSON.stringify(templates));
    } catch {}
  }
  notifyEvent('melue_task_analysis_templates_changed', { templates });
}

export function saveTaskAnalysisTemplateItem(item: TaskAnalysisTemplate): TaskAnalysisTemplate {
  const current = getStoredTaskAnalysisTemplates();
  const id = item.id || `ta-${Date.now()}`;
  const existingIdx = current.findIndex((t) => t.id === id);
  const normalized: TaskAnalysisTemplate = {
    ...item,
    id,
    active: item.active !== false,
  };

  let updated: TaskAnalysisTemplate[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = normalized;
  } else {
    updated = [normalized, ...current];
  }

  setStoredTaskAnalysisTemplates(updated);

  // Sync into Goal Bank as a Task Analysis goal item
  saveGoalItem({
    id: `g-ta-${id}`,
    name: normalized.name,
    domain: 'Self-Help',
    description: normalized.description || `${normalized.steps.length}-step task analysis routine`,
    goalType: 'task_analysis',
    masteryCriteria: `${normalized.overallMastery ?? 80}% independent accuracy on all steps`,
    active: normalized.active !== false,
  });

  return normalized;
}

export function deleteTaskAnalysisTemplateItem(id: string): void {
  const current = getStoredTaskAnalysisTemplates();
  const updated = current.filter((t) => t.id !== id);
  setStoredTaskAnalysisTemplates(updated);
  deleteGoalItem(`g-ta-${id}`);
}
