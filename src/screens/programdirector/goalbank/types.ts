export const DOMAINS = [
  'All',
  'Cognitive',
  'Receptive Language',
  'Expressive Language',
  'Social Skills',
  'Motor Skills',
  'Adaptive',
  'Play Skills',
  'Academic',
] as const;

export const DOMAIN_OPTIONS = DOMAINS.slice(1) as readonly string[];

export type GoalStatus = 'active' | 'inactive';

export interface ExtendedGoal {
  id: string;
  name: string;
  domain: string;
  description: string;
  masteryCriteria: string;
  usageCount: number;
  status: GoalStatus;
}

export interface FormData {
  name: string;
  domain: string;
  description: string;
  masteryCriteria: string;
  suggestedAgeRange: string;
  status: GoalStatus;
}

export const EMPTY_FORM: FormData = {
  name: '',
  domain: DOMAIN_OPTIONS[0],
  description: '',
  masteryCriteria: '80% accuracy across 3 consecutive sessions',
  suggestedAgeRange: '4–8 years',
  status: 'active',
};

export function filterGoals(
  goals: ExtendedGoal[] | null,
  search: string,
  domainFilter: string,
): ExtendedGoal[] {
  if (!goals) return [];
  const term = search.trim().toLowerCase();
  return goals.filter((g) => {
    if (domainFilter !== 'All' && g.domain !== domainFilter) return false;
    if (term) {
      const haystack = `${g.name} ${g.description}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}
