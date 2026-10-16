// src/stores/abcListsStore.ts
//
// Single source of truth for ABC dropdown lists (Behaviors, Antecedents, Consequences, Locations).
// Configured on the AbcDropdownListsScreen (/AbcDropdownLists) and consumed dynamically
// in the Record Behavior Incident form on SessionDataCollectionScreen (/SessionDataCollection).

export interface AbcItem {
  id: string;
  name: string;
  definition?: string;
  category?: string;
  type?: string;
  status: 'Active' | 'Inactive';
}

export interface AbcListsData {
  behaviors: AbcItem[];
  antecedents: AbcItem[];
  consequences: AbcItem[];
  locations: AbcItem[];
}

export const STORAGE_KEY = 'melue_abc_dropdown_lists';

export const DEFAULT_ABC_LISTS: AbcListsData = {
  behaviors: [
    {
      id: 'b1',
      name: 'Self-Injurious Behavior',
      definition: 'Any behavior that causes harm to self',
      category: 'Physical',
      status: 'Active',
    },
    {
      id: 'b2',
      name: 'Aggression',
      definition: 'Physical or verbal acts directed toward others',
      category: 'Physical',
      status: 'Active',
    },
    {
      id: 'b3',
      name: 'Elopement',
      definition: 'Leaving designated area without permission',
      category: 'Safety',
      status: 'Active',
    },
  ],
  antecedents: [
    { id: 'a1', name: 'Task demand', type: 'Academic', status: 'Active' },
    { id: 'a2', name: 'Transition', type: 'Environmental', status: 'Active' },
    { id: 'a3', name: 'Denial of access', type: 'Social', status: 'Active' },
    { id: 'a4', name: 'Unstructured time', type: 'Environmental', status: 'Active' },
  ],
  consequences: [
    { id: 'c1', name: 'Escape task', type: 'Negative Reinforcement', status: 'Active' },
    { id: 'c2', name: 'Attention', type: 'Positive Reinforcement', status: 'Active' },
    { id: 'c3', name: 'Tangible item', type: 'Positive Reinforcement', status: 'Active' },
  ],
  locations: [
    { id: 'l1', name: 'Classroom', status: 'Active' },
    { id: 'l2', name: 'Classroom A', status: 'Active' },
    { id: 'l3', name: 'Therapy Room 1', status: 'Active' },
    { id: 'l4', name: 'Outdoor Area', status: 'Active' },
    { id: 'l5', name: 'Sensory Room', status: 'Inactive' },
  ],
};

function normalizeItem(raw: any, defaultStatus: 'Active' | 'Inactive' = 'Active'): AbcItem {
  return {
    id: String(raw.id || Date.now().toString()),
    name: String(raw.name || raw.label || '').trim(),
    definition: raw.definition ? String(raw.definition).trim() : undefined,
    category: raw.category ? String(raw.category).trim() : undefined,
    type: raw.type ? String(raw.type).trim() : undefined,
    status: raw.status === 'Inactive' || raw.active === false ? 'Inactive' : 'Active',
  };
}

export function getStoredAbcLists(): AbcListsData {
  if (typeof localStorage === 'undefined') {
    return {
      behaviors: [...DEFAULT_ABC_LISTS.behaviors],
      antecedents: [...DEFAULT_ABC_LISTS.antecedents],
      consequences: [...DEFAULT_ABC_LISTS.consequences],
      locations: [...DEFAULT_ABC_LISTS.locations],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        behaviors: [...DEFAULT_ABC_LISTS.behaviors],
        antecedents: [...DEFAULT_ABC_LISTS.antecedents],
        consequences: [...DEFAULT_ABC_LISTS.consequences],
        locations: [...DEFAULT_ABC_LISTS.locations],
      };
    }

    const parsed = JSON.parse(raw);
    return {
      behaviors: Array.isArray(parsed?.behaviors)
        ? parsed.behaviors.map((i: any) => normalizeItem(i))
        : [...DEFAULT_ABC_LISTS.behaviors],
      antecedents: Array.isArray(parsed?.antecedents)
        ? parsed.antecedents.map((i: any) => normalizeItem(i))
        : [...DEFAULT_ABC_LISTS.antecedents],
      consequences: Array.isArray(parsed?.consequences)
        ? parsed.consequences.map((i: any) => normalizeItem(i))
        : [...DEFAULT_ABC_LISTS.consequences],
      locations: Array.isArray(parsed?.locations)
        ? parsed.locations.map((i: any) => normalizeItem(i))
        : [...DEFAULT_ABC_LISTS.locations],
    };
  } catch {
    return {
      behaviors: [...DEFAULT_ABC_LISTS.behaviors],
      antecedents: [...DEFAULT_ABC_LISTS.antecedents],
      consequences: [...DEFAULT_ABC_LISTS.consequences],
      locations: [...DEFAULT_ABC_LISTS.locations],
    };
  }
}

export function setStoredAbcLists(data: Partial<AbcListsData>): void {
  const current = getStoredAbcLists();
  const next: AbcListsData = {
    behaviors: data.behaviors ?? current.behaviors,
    antecedents: data.antecedents ?? current.antecedents,
    consequences: data.consequences ?? current.consequences,
    locations: data.locations ?? current.locations,
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('melue_abc_lists_changed', {
          detail: next,
        })
      );
    } catch {}
  }
}

export function resetStoredAbcLists(): AbcListsData {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  const resetData: AbcListsData = {
    behaviors: [...DEFAULT_ABC_LISTS.behaviors],
    antecedents: [...DEFAULT_ABC_LISTS.antecedents],
    consequences: [...DEFAULT_ABC_LISTS.consequences],
    locations: [...DEFAULT_ABC_LISTS.locations],
  };

  setStoredAbcLists(resetData);
  return resetData;
}

export function getActiveAbcDropdownOptions(): {
  behaviors: string[];
  antecedents: string[];
  consequences: string[];
  locations: string[];
} {
  const lists = getStoredAbcLists();
  return {
    behaviors: lists.behaviors
      .filter((item) => item.status === 'Active' && item.name.trim() !== '')
      .map((item) => item.name.trim()),
    antecedents: lists.antecedents
      .filter((item) => item.status === 'Active' && item.name.trim() !== '')
      .map((item) => item.name.trim()),
    consequences: lists.consequences
      .filter((item) => item.status === 'Active' && item.name.trim() !== '')
      .map((item) => item.name.trim()),
    locations: lists.locations
      .filter((item) => item.status === 'Active' && item.name.trim() !== '')
      .map((item) => item.name.trim()),
  };
}

export interface IncidentFormFieldItem {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  placeholder?: string;
  section?: string;
}

export const BASE_INCIDENT_FIELDS: IncidentFormFieldItem[] = [
  {
    id: 'b_loc',
    type: 'Dropdown',
    label: 'Location',
    required: true,
    visible: true,
    options: [],
  },
  {
    id: 'b_beh',
    type: 'Dropdown',
    label: 'Behavior Type',
    required: true,
    visible: true,
    options: [],
  },
  {
    id: 'b_int',
    type: 'Dropdown',
    label: 'Intensity',
    required: true,
    visible: true,
    options: ['Low', 'Medium', 'High'],
  },
  {
    id: 'b_dur',
    type: 'Number',
    label: 'Duration (mins)',
    required: true,
    visible: true,
    placeholder: 'Enter duration...',
  },
  {
    id: 'b_ant',
    type: 'Dropdown',
    label: 'Antecedent / Trigger',
    required: false,
    visible: true,
    options: [],
  },
  {
    id: 'b_con',
    type: 'Dropdown',
    label: 'Consequence / Action Taken',
    required: false,
    visible: true,
    options: [],
  },
  {
    id: 'b_notes',
    type: 'TextArea',
    label: 'Notes & Observations',
    required: false,
    visible: true,
    placeholder: 'Enter any additional notes or relevant information...',
  },
];

export function applyAbcDropdownOptions<T extends { id?: string; label?: string; options?: string[] }>(fieldsList: T[]): T[] {
  const abc = getActiveAbcDropdownOptions();
  return fieldsList.map((f) => {
    const norm = (f.label || '').toLowerCase().trim();
    const id = (f.id || '').toLowerCase().trim();

    if (id === 'b_loc' || norm === 'location' || norm.includes('location')) {
      return { ...f, options: abc.locations };
    }
    if (id === 'b_beh' || norm.includes('behavior type') || norm === 'behavior' || norm.includes('behavior')) {
      return { ...f, options: abc.behaviors };
    }
    if (id === 'b_ant' || norm.includes('antecedent') || norm.includes('trigger')) {
      return { ...f, options: abc.antecedents };
    }
    if (id === 'b_con' || norm.includes('consequence') || norm.includes('action taken')) {
      return { ...f, options: abc.consequences };
    }
    return f;
  });
}

