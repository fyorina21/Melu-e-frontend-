import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
} from '../../api/institutionalAdminApi';
import {
  getStoredIncidents,
  recordIncidentInStore,
  getStoredAbcIncidents,
  removeStoredAbcIncident,
} from '../../stores/trialsStore';
import type { FormField } from '../../types';

describe('Behavior Incident FormBuilder to SessionDataCollection Integration', () => {
  beforeEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await resetFormToDefault('Behavior Incident Form');
  });

  it('provides default Behavior Incident Form fields including dropdown fields', async () => {
    const { data: config } = await getFormConfig('Behavior Incident Form');
    expect(config).toBeDefined();
    expect(Array.isArray(config.fields)).toBe(true);
    expect(config.fields.length).toBeGreaterThanOrEqual(4);

    const locationField = config.fields.find((f: FormField) => f.label === 'Location');
    expect(locationField).toBeDefined();
    expect(locationField.type).toBe('Dropdown');
    expect(Array.isArray(locationField.options)).toBe(true);
    expect(locationField.options).toContain('Classroom');

    const behaviorField = config.fields.find((f: FormField) => f.label === 'Behavior Type');
    expect(behaviorField).toBeDefined();
    expect(behaviorField.type).toBe('Dropdown');

    const intensityField = config.fields.find((f: FormField) => f.label === 'Intensity');
    expect(intensityField).toBeDefined();
    expect(intensityField.type).toBe('Dropdown');
  });

  it('reflects newly added fields from FormBuilder in the form configuration', async () => {
    const { data: initialConfig } = await getFormConfig('Behavior Incident Form');

    const newField: FormField = {
      id: 'b_trigger_custom',
      type: 'Dropdown',
      label: 'Specific Trigger',
      required: false,
      visible: true,
      options: ['Noise', 'Lighting', 'Peer conflict', 'Transition'],
      section: 'Incident Details',
    };

    const updatedFields = [...initialConfig.fields, newField];

    await saveFormConfig('Behavior Incident Form', {
      fields: updatedFields,
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Behavior Incident Form');
    expect(updatedConfig.fields.some((f: FormField) => f.id === 'b_trigger_custom')).toBe(true);

    const savedTriggerField = updatedConfig.fields.find((f: FormField) => f.id === 'b_trigger_custom');
    expect(savedTriggerField.label).toBe('Specific Trigger');
    expect(savedTriggerField.options).toEqual(['Noise', 'Lighting', 'Peer conflict', 'Transition']);
  });

  it('reflects edited fields from FormBuilder (e.g. updated dropdown options)', async () => {
    const { data: initialConfig } = await getFormConfig('Behavior Incident Form');

    const modifiedFields = initialConfig.fields.map((f: FormField) => {
      if (f.label === 'Location') {
        return {
          ...f,
          options: ['Classroom', 'Playground', 'Cafeteria', 'Sensory Room', 'Bus'],
        };
      }
      return f;
    });

    await saveFormConfig('Behavior Incident Form', {
      fields: modifiedFields,
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Behavior Incident Form');
    const locField = updatedConfig.fields.find((f: FormField) => f.label === 'Location');
    expect(locField.options).toEqual(['Classroom', 'Playground', 'Cafeteria', 'Sensory Room', 'Bus']);
  });

  it('reflects removed fields from FormBuilder immediately', async () => {
    const { data: initialConfig } = await getFormConfig('Behavior Incident Form');
    const filteredFields = initialConfig.fields.filter((f: FormField) => f.label !== 'Intensity');

    await saveFormConfig('Behavior Incident Form', {
      fields: filteredFields,
      isDefault: false,
    });

    const { data: updatedConfig } = await getFormConfig('Behavior Incident Form');
    expect(updatedConfig.fields.some((f: FormField) => f.label === 'Intensity')).toBe(false);
  });

  it('persists recorded incident data according to form configuration in local store', () => {
    const sessionId = 'session-test-123';
    const incidentData = {
      studentId: 'stu-1',
      studentName: 'Alex Mercer',
      time: '10:30 AM',
      date: '2026-10-09',
      location: 'Classroom',
      behavior: 'Aggression',
      intensity: 'High',
      duration: '5',
      antecedent: 'Demand / Task',
      consequence: 'Redirection',
      notes: 'Calmed down after 5 minutes of sensory break.',
      customFields: {
        b_loc: 'Classroom',
        b_beh: 'Aggression',
        b_int: 'High',
        'Specific Trigger': 'Noise',
      },
    };

    recordIncidentInStore(sessionId, incidentData as any);

    const storedList = getStoredIncidents(sessionId);
    expect(storedList.length).toBe(1);
    expect(storedList[0].studentName).toBe('Alex Mercer');
    expect(storedList[0].behavior).toBe('Aggression');
    expect((storedList[0] as any).location).toBe('Classroom');
    expect((storedList[0] as any).intensity).toBe('High');
    expect((storedList[0] as any).customFields['Specific Trigger']).toBe('Noise');
  });

  it('automatically mirrors recorded incidents to ABC log store for AbcLog screen', () => {
    const sessionId = 'session-test-456';
    const incidentData = {
      studentId: 'stu-yonas',
      studentName: 'Yonas Girma',
      time: '05:22 AM',
      date: '2026-10-09',
      location: 'Classroom',
      'Behavior Type': 'Elopement',
      'Intensity': 'Medium',
      'Duration (mins)': '3',
      'Antecedent / Trigger': 'Transition',
      'Consequence / Action Taken': 'Redirection',
      'Notes & Observations': 'Left seat during station transition',
    };

    recordIncidentInStore(sessionId, incidentData as any);

    const abcIncidents = getStoredAbcIncidents('stu-yonas', 'Yonas Girma');
    expect(abcIncidents.length).toBeGreaterThanOrEqual(1);

    const yonasInc = abcIncidents.find((i) => i.studentName === 'Yonas Girma');
    expect(yonasInc).toBeDefined();
    expect(yonasInc?.behavior).toBe('Elopement');
    expect(yonasInc?.intensity).toBe('Medium');
    expect(yonasInc?.frequency).toBe('3');
    expect(yonasInc?.antecedent).toBe('Transition');
    expect(yonasInc?.consequence).toBe('Redirection');
    expect(yonasInc?.location).toBe('Classroom');
    expect(yonasInc?.notes).toBe('Left seat during station transition');
  });

  it('removes stored ABC incidents when deleted', () => {
    const sessionId = 'session-test-789';
    const incidentData = {
      id: 'abc-to-delete-1',
      studentId: 'stu-yonas',
      studentName: 'Yonas Girma',
      time: '04:46 AM',
      date: '2026-10-09',
      behavior: 'Tantrum',
    };

    recordIncidentInStore(sessionId, incidentData as any);
    expect(getStoredAbcIncidents('stu-yonas').some((i) => i.id === 'abc-to-delete-1')).toBe(true);

    removeStoredAbcIncident('abc-to-delete-1');
    expect(getStoredAbcIncidents('stu-yonas').some((i) => i.id === 'abc-to-delete-1')).toBe(false);
  });
});
