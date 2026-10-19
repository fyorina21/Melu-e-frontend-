export type ListTab = 'Behaviors' | 'Antecedents' | 'Consequences' | 'Locations';

export interface AbcItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  definition?: string;
  category?: string;
  type?: string;
}

export const CATEGORY_OPTIONS = [
  'Environmental',
  'Social',
  'Biological',
  'Task-related',
  'Other',
] as const;
