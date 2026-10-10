export interface AbcStats {
  totalIncidents: number;
  mostCommonBehavior: string;
  mostCommonAntecedent: string;
  thisWeek: number;
}

export interface AbcIncident {
  id: string;
  date?: string;
  time?: string;
  location?: string;
  behavior?: string;
  frequency?: string;
  intensity?: string;
  category?: string;
  antecedent?: string;
  consequence?: string;
  notes?: string;
  teacher?: string;
}

export const PAGE_SIZE = 10;

export const TABLE_COLUMNS: Array<{ key: keyof AbcIncident; label: string; width: number }> = [
  { key: 'date', label: 'Date', width: 90 },
  { key: 'time', label: 'Time', width: 80 },
  { key: 'location', label: 'Location', width: 110 },
  { key: 'behavior', label: 'Behavior', width: 160 },
  { key: 'frequency', label: 'Frequency', width: 100 },
  { key: 'intensity', label: 'Intensity', width: 100 },
  { key: 'category', label: 'Category', width: 150 },
  { key: 'antecedent', label: 'Antecedent', width: 160 },
  { key: 'consequence', label: 'Consequence', width: 180 },
  { key: 'teacher', label: 'Teacher', width: 130 },
];

export const isoDate = (d: Date) => d.toISOString().split('T')[0];

export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: isoDate(from), to: isoDate(to) };
}

export const intensityStyle = (intensity?: string): { bg: string; text: string } => {
  switch (intensity) {
    case 'Low':
    case 'Mild':
      return { bg: '#F0FDF4', text: '#16A34A' };
    case 'Medium':
    case 'Moderate':
      return { bg: '#FEFCE8', text: '#A16207' };
    default:
      return { bg: '#FEF2F2', text: '#B91C1C' };
  }
};
