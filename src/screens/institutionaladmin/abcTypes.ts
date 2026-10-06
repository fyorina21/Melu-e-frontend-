export type ListTab = 'Behaviors' | 'Antecedents' | 'Consequences' | 'Locations';

export interface AbcItem {
  id: string;
  name: string;
  definition?: string;
  category?: string;
  type?: string;
  status: 'Active' | 'Inactive';
}

export const CATEGORY_OPTIONS = ['Physical', 'Safety', 'Verbal', 'Social'];
