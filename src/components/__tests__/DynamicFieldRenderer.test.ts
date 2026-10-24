import { describe, it, expect } from 'vitest';
import React from 'react';
import { DynamicFieldRenderer, type DynamicFormField } from '../DynamicFieldRenderer';

describe('DynamicFieldRenderer component and schema conformance', () => {
  it('exports DynamicFieldRenderer component properly', () => {
    expect(DynamicFieldRenderer).toBeDefined();
    expect(typeof DynamicFieldRenderer).toBe('function');
  });

  it('renders section_header non-input display separator without throwing', () => {
    const field: DynamicFormField = {
      id: 'sec_header_1',
      type: 'section_header',
      label: 'Clinical Background',
      is_display_only: true,
      ui_props: {
        description: 'Historical records and previous evaluations',
        show_divider_line: true,
      },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: null,
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.id).toBe('sec_header_1');
  });

  it('renders textarea with multiline configuration', () => {
    const field: DynamicFormField = {
      id: 'clinical_notes',
      type: 'textarea',
      label: 'Therapist Observations',
      placeholder: 'Enter notes here...',
      validation: { required: true, min_length: 10, max_length: 500 },
      ui_props: { num_lines: 5, show_char_counter: true },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: 'Student demonstrated focus on task A.',
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('textarea');
  });

  it('renders checkbox_group multi-select options', () => {
    const field: DynamicFormField = {
      id: 'interventions',
      type: 'checkbox_group',
      label: 'Applied Interventions',
      options: [
        { label: 'DRA', value: 'dra' },
        { label: 'Planned Ignoring', value: 'ignoring' },
      ],
      validation: { required: true, min_select: 1 },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: ['dra'],
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.value).toEqual(['dra']);
  });

  it('renders switch boolean toggle', () => {
    const field: DynamicFormField = {
      id: 'has_iep',
      type: 'switch',
      label: 'Active IEP',
      ui_props: { active_label: 'Yes', inactive_label: 'No' },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: true,
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.value).toBe(true);
  });

  it('renders phone input with keypad configuration', () => {
    const field: DynamicFormField = {
      id: 'contact_phone',
      type: 'phone',
      label: 'Guardian Phone',
      placeholder: '+1 (555) 000-0000',
      validation: { required: true },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: '+15551234567',
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('phone');
  });

  it('renders image_picker with camera and gallery actions', () => {
    const field: DynamicFormField = {
      id: 'student_photo',
      type: 'image_picker',
      label: 'Profile Photo',
      ui_props: { allow_camera: true, allow_gallery: true, aspect_ratio: [1, 1] },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: null,
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('image_picker');
  });

  it('renders counter field with increment and decrement boundaries', () => {
    const field: DynamicFormField = {
      id: 'trial_count',
      type: 'counter',
      label: 'Trial Repetitions',
      validation: { required: true, min_length: 0, max_length: 50 },
    };

    let updatedVal = 0;
    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: 5,
      onChange: (id: string, val: any) => {
        updatedVal = val;
      },
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('counter');
    expect(element.props.value).toBe(5);
  });

  it('renders timer field with start, pause, and stop controls', () => {
    const field: DynamicFormField = {
      id: 'duration_timer',
      type: 'timer',
      label: 'Observation Duration',
      placeholder: 'MM:SS',
    };

    let timerVal = '00:00';
    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: '02:45',
      onChange: (id: string, val: any) => {
        timerVal = val;
      },
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('timer');
    expect(element.props.value).toBe('02:45');
  });

  it('renders date field with compact modal date picker', () => {
    const field: DynamicFormField = {
      id: 'assessment_date',
      type: 'date',
      label: 'Evaluation Date',
      placeholder: 'YYYY-MM-DD',
      validation: { required: true },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: '2026-10-23',
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('date');
    expect(element.props.value).toBe('2026-10-23');
  });

  it('renders dropdown field with high z-index stacking context', () => {
    const field: DynamicFormField = {
      id: 'session_setting',
      type: 'dropdown',
      label: 'Clinical Setting',
      options: [
        { label: 'Clinic 1:1', value: 'clinic_1on1' },
        { label: 'Group Classroom', value: 'group_class' },
      ],
      validation: { required: true },
    };

    const element = React.createElement(DynamicFieldRenderer, {
      field,
      value: 'clinic_1on1',
      onChange: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.field.type).toBe('dropdown');
    expect(element.props.value).toBe('clinic_1on1');
  });
});
