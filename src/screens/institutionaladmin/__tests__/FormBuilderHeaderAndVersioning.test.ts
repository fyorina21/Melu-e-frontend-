import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFormConfig,
  saveFormConfig,
  resetFormToDefault,
  getDefaultFormConfig,
} from '../../../api/institutionalAdminApi';

describe('Form Builder Header Persistence & Semantic Versioning Workflow', () => {
  beforeEach(async () => {
    await resetFormToDefault('Enrollment Wizard');
  });

  it('persists all header metadata attributes without dropping them', async () => {
    const initialConfig = getDefaultFormConfig('Enrollment Wizard');
    expect(initialConfig).toBeDefined();

    const updatePayload = {
      ...initialConfig,
      formId: 'FRM-ENR-2026',
      form_id: 'FRM-ENR-2026',
      formName: 'Melu-e Academy Enrollment Form',
      form_name: 'Melu-e Academy Enrollment Form',
      organization: 'Melu-e Specialized Center',
      organization_name: 'Melu-e Specialized Center',
      revisionDate: '2026-10-24',
      pages: 'Page 1 of 6',
      metadata: {
        formId: 'FRM-ENR-2026',
        form_id: 'FRM-ENR-2026',
        formName: 'Melu-e Academy Enrollment Form',
        organization: 'Melu-e Specialized Center',
        revisionDate: '2026-10-24',
        pages: 'Page 1 of 6',
      },
    };

    const saveRes = await saveFormConfig('Enrollment Wizard', updatePayload);
    const saved = saveRes.data;

    expect(saved.formId).toBe('FRM-ENR-2026');
    expect(saved.formName).toBe('Melu-e Academy Enrollment Form');
    expect(saved.organization).toBe('Melu-e Specialized Center');
    expect(saved.pages).toBe('Page 1 of 6');
    expect(saved.metadata.formId).toBe('FRM-ENR-2026');
    expect(saved.metadata.organization).toBe('Melu-e Specialized Center');
  });

  it('automatically increments semantic version and creates an immutable snapshot of previous state', async () => {
    const initialConfig = getDefaultFormConfig('Enrollment Wizard');
    const prevRev = initialConfig.revisionNumber || 1;

    const updatePayload = {
      ...initialConfig,
      formId: 'FRM-ENR-V2',
      formName: 'Enrollment Form Version 2',
      metadata: {
        formId: 'FRM-ENR-V2',
        formName: 'Enrollment Form Version 2',
      },
    };

    const saveRes = await saveFormConfig('Enrollment Wizard', updatePayload);
    const saved = saveRes.data;

    // Automatically incremented
    expect(saved.revisionNumber).toBe(prevRev + 1);
    expect(saved.revision).toContain(`Rev ${prevRev + 1}.0`);

    // Snapshot of previous version in history
    expect(Array.isArray(saved.history)).toBe(true);
    expect(saved.history.length).toBeGreaterThanOrEqual(1);

    const snapshot = saved.history[0];
    expect(snapshot.revision_number).toBe(prevRev);
    expect(snapshot.formId).toBe((initialConfig as any).formId || 'FRM-SYS-001');
    expect(snapshot.fields.length).toBe(initialConfig.fields.length);
  });

  it('preserves body components when header metadata is updated', async () => {
    const initialConfig = getDefaultFormConfig('Enrollment Wizard');
    const initialFieldCount = initialConfig.fields.length;
    expect(initialFieldCount).toBeGreaterThan(0);

    // Save header edit
    const saveRes = await saveFormConfig('Enrollment Wizard', {
      ...initialConfig,
      formId: 'FRM-ENR-NEW',
      formName: 'Renamed Enrollment Header',
    });

    const saved = saveRes.data;
    // Fields must NOT be reset or wiped
    expect(saved.fields.length).toBe(initialFieldCount);
    expect(saved.fields[0].id).toBe(initialConfig.fields[0].id);

    // Subsequent body edit keeps header changes and increments to next version
    const updatedFields = [
      ...saved.fields,
      {
        id: 'f_new_custom_1',
        type: 'Text',
        label: 'Custom Behavioral Notes',
        section: 'Student Info',
        required: false,
      },
    ];

    const secondSaveRes = await saveFormConfig('Enrollment Wizard', {
      ...saved,
      fields: updatedFields,
    });

    const secondSaved = secondSaveRes.data;
    expect(secondSaved.fields.length).toBe(initialFieldCount + 1);
    expect(secondSaved.formId).toBe('FRM-ENR-NEW');
    expect(secondSaved.formName).toBe('Renamed Enrollment Header');
    expect(secondSaved.revisionNumber).toBe(saved.revisionNumber + 1);
  });
});
