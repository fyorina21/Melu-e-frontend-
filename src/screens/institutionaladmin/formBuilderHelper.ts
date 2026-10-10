// src/screens/institutionaladmin/formBuilderHelper.ts

import type { FormField } from '../../types';

export interface GroupedSectionsResult {
  grouped: Record<string, FormField[]>;
  allSectionNames: string[];
  activeSections: string[];
}

export function groupFieldsBySection(
  fields: FormField[],
  availableSections: string[],
  deletedSections: string[],
  customSections: string[],
  selectedForm: string,
  inferSectionFn: (label: string) => string,
  addingToSection: string | null,
): GroupedSectionsResult {
  const allSectionNames = Array.from(
    new Set([
      ...availableSections,
      ...(fields.map((f) => f.section).filter(Boolean) as string[]),
      'General',
    ]),
  ).filter((s) => !deletedSections.includes(s));

  const grouped: Record<string, FormField[]> = {};
  fields.forEach((f) => {
    const sec =
      f.section || (selectedForm === 'Enrollment Wizard' ? inferSectionFn(f.label) : 'General');
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(f);
  });

  const activeSections = allSectionNames.filter(
    (sec) =>
      (grouped[sec] && grouped[sec].length > 0) ||
      customSections.includes(sec) ||
      addingToSection === sec,
  );

  return { grouped, allSectionNames, activeSections };
}

export interface DefaultFieldConfig {
  type: FormField['type'];
  label: string;
  options: string;
  placeholder: string;
  required: boolean;
}

export function getDefaultFieldConfigForSection(
  selectedForm: string,
  section: string,
): DefaultFieldConfig {
  const isAblls = selectedForm === 'ABLLS Assessment Form';
  const type: FormField['type'] =
    selectedForm === 'Behavioral Assessment' && section === 'ABC Tracking'
      ? 'Text'
      : isAblls
        ? 'Radio'
        : 'Text';

  return {
    type,
    label: '',
    options: isAblls ? '0 — Not Demonstrated, 1 — Emerging, 2 — Mastered, N/A' : '',
    placeholder: '',
    required: true,
  };
}
