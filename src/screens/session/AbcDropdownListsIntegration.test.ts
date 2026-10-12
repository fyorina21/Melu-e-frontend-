import { describe, it, expect, beforeEach } from 'vitest';

import {
  getStoredAbcLists,
  setStoredAbcLists,
  resetStoredAbcLists,
  getActiveAbcDropdownOptions,
  applyAbcDropdownOptions,
  BASE_INCIDENT_FIELDS,
} from '../../stores/abcListsStore';

describe('AbcDropdownLists to SessionDataCollection Behavior Incident Form Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStoredAbcLists();
  });

  it('populates behavior incident form dropdowns dynamically from abcListsStore defaults', () => {
    const options = getActiveAbcDropdownOptions();
    expect(options.behaviors).toContain('Self-Injurious Behavior');
    expect(options.behaviors).toContain('Aggression');
    expect(options.behaviors).toContain('Elopement');

    expect(options.antecedents).toContain('Task demand');
    expect(options.antecedents).toContain('Transition');

    expect(options.consequences).toContain('Escape task');
    expect(options.consequences).toContain('Attention');

    expect(options.locations).toContain('Classroom');
    expect(options.locations).toContain('Therapy Room 1');
    // Sensory Room is inactive by default
    expect(options.locations).not.toContain('Sensory Room');

    const fields = applyAbcDropdownOptions(BASE_INCIDENT_FIELDS);
    const locField = fields.find((f) => f.id === 'b_loc');
    const behField = fields.find((f) => f.id === 'b_beh');
    const antField = fields.find((f) => f.id === 'b_ant');
    const conField = fields.find((f) => f.id === 'b_con');

    expect(locField?.options).toEqual(options.locations);
    expect(behField?.options).toEqual(options.behaviors);
    expect(antField?.options).toEqual(options.antecedents);
    expect(conField?.options).toEqual(options.consequences);
  });

  it('updates Behavior Incident dropdown choices when a new behavior is added via AbcDropdownLists', () => {
    const current = getStoredAbcLists();
    const newBehavior = {
      id: 'b-new-1',
      name: 'Vocal Outbursts',
      category: 'Verbal',
      status: 'Active' as const,
    };

    setStoredAbcLists({
      behaviors: [...current.behaviors, newBehavior],
    });

    const active = getActiveAbcDropdownOptions();
    expect(active.behaviors).toContain('Vocal Outbursts');

    const fields = applyAbcDropdownOptions(BASE_INCIDENT_FIELDS);
    const behField = fields.find((f) => f.id === 'b_beh');
    expect(behField?.options).toContain('Vocal Outbursts');
  });

  it('excludes Inactive items from the incident form dropdown choices', () => {
    const current = getStoredAbcLists();
    // Mark Aggression as Inactive
    const updatedBehaviors = current.behaviors.map((b) =>
      b.name === 'Aggression' ? { ...b, status: 'Inactive' as const } : b
    );

    setStoredAbcLists({ behaviors: updatedBehaviors });

    const active = getActiveAbcDropdownOptions();
    expect(active.behaviors).not.toContain('Aggression');
    expect(active.behaviors).toContain('Self-Injurious Behavior');

    const fields = applyAbcDropdownOptions(BASE_INCIDENT_FIELDS);
    const behField = fields.find((f) => f.id === 'b_beh');
    expect(behField?.options).not.toContain('Aggression');
  });

  it('updates Location dropdown choices when locations are edited on AbcDropdownLists', () => {
    const updatedLocations = [
      { id: 'loc-1', name: 'Art Studio', status: 'Active' as const },
      { id: 'loc-2', name: 'Gymnasium', status: 'Active' as const },
      { id: 'loc-3', name: 'Quiet Room', status: 'Inactive' as const },
    ];

    setStoredAbcLists({ locations: updatedLocations });

    const active = getActiveAbcDropdownOptions();
    expect(active.locations).toEqual(['Art Studio', 'Gymnasium']);

    const fields = applyAbcDropdownOptions(BASE_INCIDENT_FIELDS);
    const locField = fields.find((f) => f.id === 'b_loc');
    expect(locField?.options).toEqual(['Art Studio', 'Gymnasium']);
  });
});
