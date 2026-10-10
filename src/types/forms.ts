export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  visible: boolean;
  options?: string[];
  section?: string;
  level?: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  allowOther?: boolean;
}

export interface HistoryEntry {
  date: string;
  user: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface FormConfig {
  isDefault?: boolean;
  customSections?: string[];
  deletedSections?: string[];
  fields: FormField[];
  [key: string]: unknown;
}

export interface FormMetadata {
  id: string;
  revision: string;
  pages: string;
}
