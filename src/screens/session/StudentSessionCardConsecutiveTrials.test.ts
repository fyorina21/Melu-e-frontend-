import { describe, it, expect, beforeEach } from 'vitest';
import { getTrialConfig, setPromptLevels, getPromptLevels } from '../../stores/promptLevelsStore';

describe('Trial Logging Format Consecutive Trials & Session Data Collection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to consecutive 5 trials when not configured', () => {
    const config = getTrialConfig();
    expect(config.consecutive).toBe(5);
  });

  it('updates consecutive trials to 6 and persists it', () => {
    const levels = getPromptLevels();
    setPromptLevels(levels, 6, 5);
    const config = getTrialConfig();
    expect(config.consecutive).toBe(6);
  });

  it('slices exactly 6 trials when consecutive is 6 and more than 6 trials exist', () => {
    const levels = getPromptLevels();
    setPromptLevels(levels, 6, 5);

    const mockTrials = [
      { id: '1', promptLevel: '+' },
      { id: '2', promptLevel: 'G' },
      { id: '3', promptLevel: 'PP' },
      { id: '4', promptLevel: 'FP' },
      { id: '5', promptLevel: '+' },
      { id: '6', promptLevel: 'G' },
      { id: '7', promptLevel: 'PP' },
      { id: '8', promptLevel: '+' },
    ];

    const { consecutive } = getTrialConfig();
    const maxTrials = typeof consecutive === 'number' && consecutive > 0 ? consecutive : 5;
    const displayed = mockTrials.slice(-maxTrials);

    expect(displayed.length).toBe(6);
    expect(displayed.map((t) => t.id)).toEqual(['3', '4', '5', '6', '7', '8']);
  });

  it('slices exactly 5 trials when consecutive is 5', () => {
    const levels = getPromptLevels();
    setPromptLevels(levels, 5, 5);

    const mockTrials = [
      { id: '1', promptLevel: '+' },
      { id: '2', promptLevel: 'G' },
      { id: '3', promptLevel: 'PP' },
      { id: '4', promptLevel: 'FP' },
      { id: '5', promptLevel: '+' },
      { id: '6', promptLevel: 'G' },
      { id: '7', promptLevel: 'PP' },
      { id: '8', promptLevel: '+' },
    ];

    const { consecutive } = getTrialConfig();
    const maxTrials = typeof consecutive === 'number' && consecutive > 0 ? consecutive : 5;
    const displayed = mockTrials.slice(-maxTrials);

    expect(displayed.length).toBe(5);
    expect(displayed.map((t) => t.id)).toEqual(['4', '5', '6', '7', '8']);
  });
});
