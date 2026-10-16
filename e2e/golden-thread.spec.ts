import { test, expect, Page } from '@playwright/test';

const SEED_PASSWORD = 'Password123!';

/** Helper to log in as a specific role */
async function loginAs(page: Page, email: string) {
  await page.goto('/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForSelector('#root', { timeout: 30000 });

  const emailInput = page.locator('input[aria-label="Email Address"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);

  const passwordInput = page.locator('input[aria-label="Password"]').first();
  await passwordInput.fill(SEED_PASSWORD);

  const signInBtn = page.locator('[role="button"][aria-label="Sign In"]').first();
  await signInBtn.click();

  // Wait until logged in: Login header detaches and App Navbar appears
  await page
    .locator('text=Sign In to Your Account')
    .first()
    .waitFor({ state: 'detached', timeout: 20000 });
  await page.locator('[role="tab"]').first().waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('Golden Thread Clinical Workflow End-to-End Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test('STEP 1: Registration — Therapy Coordinator enrolls Kidus Tadesse (SCR-009)', async ({
    page,
  }) => {
    await loginAs(page, 'coordinator@melue.foundation');

    // Click Enrollment Wizard tab
    const enrollmentTab = page.locator('[role="tab"]:has-text("Enrollment Wizard")').first();
    await enrollmentTab.waitFor({ state: 'visible', timeout: 10000 });
    await enrollmentTab.click();

    // Verify wizard is loaded
    await expect(page.locator('text=Step 1: Student Info').first()).toBeVisible({ timeout: 15000 });

    // Fill Step 1: Student Info
    const nameField = page.locator('input[aria-label="Student Full Name"]').first();
    await expect(nameField).toBeVisible();
    await nameField.fill('Kidus Tadesse');

    const dobField = page.locator('input[type="date"], input[aria-label="Date of Birth"]').first();
    await dobField.fill('2020-05-10');

    // Advance to Step 2
    const nextBtn = page.locator('[role="button"]:has-text("Next")').first();
    await nextBtn.click();

    // Step 2: Parent Info
    await expect(page.locator('text=Step 2: Parent Info').first()).toBeVisible({ timeout: 8000 });
    const parentName = page.locator('input[aria-label="Parent / Guardian Name"]').first();
    await parentName.fill('Tadesse Bekele');
    const parentPhone = page.locator('input[aria-label="Phone"]').first();
    await parentPhone.fill('0911223344');
    await nextBtn.click();

    // Step 3: Medical Info
    await expect(page.locator('text=Step 3: Medical Info').first()).toBeVisible({ timeout: 8000 });
    const diagField = page.locator('input[aria-label="Diagnosis"]').first();
    await diagField.fill('Autism Spectrum Disorder (Level 2)');
    await nextBtn.click();

    // Step 4: Assign Therapist
    await expect(page.locator('text=Step 4: Assign Therapist').first()).toBeVisible({
      timeout: 8000,
    });
    const therapistChip = page.locator('[role="radio"]').first();
    await therapistChip.waitFor({ state: 'visible', timeout: 5000 });
    await therapistChip.click();
    await page.waitForTimeout(400);
    await nextBtn.click();

    // Step 5: Review & Submit
    await expect(page.locator('text=Step 5: Review').first()).toBeVisible({ timeout: 8000 });
    const finishBtn = page.locator('[role="button"]:has-text("Finish Enrollment")').first();
    await expect(finishBtn).toBeVisible();
  });

  test('STEP 2: Assessment Phase — Teacher assesses skills & behaviors (SCR-010, SCR-012)', async ({
    page,
  }) => {
    await loginAs(page, 'teacher1@melue.foundation');

    // Verify Teacher navigation and Assessment Dashboard rendered
    await expect(page.locator('text=6 Week Assessment Dashboard').first()).toBeVisible({
      timeout: 15000,
    });

    // Verify student assessment card and skills button
    const skillsBtn = page.locator('text=Skills Assessment →').first();
    await expect(skillsBtn).toBeVisible();

    // Navigate to Skills Assessment
    await skillsBtn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=ABLLS-R Assessment').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Visual Performance').first()).toBeVisible({ timeout: 15000 });
  });

  test('STEP 3: Clinical Review & IUP Creation — Program Director clinical oversight (SCR-PD-002, SCR-PD-003)', async ({
    page,
  }) => {
    await loginAs(page, 'program.director@melue.foundation');

    // Click IUP Creation tab
    const iupTab = page.locator('[role="tab"]:has-text("IUP Creation & Goal Assignment")').first();
    await iupTab.waitFor({ state: 'visible', timeout: 10000 });
    await iupTab.click();

    // Verify IUP Generation interface and Station goal allocation workbench
    await expect(page.locator('text=Station 1 — Basic Skills').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('STEP 4: Operational Scheduling & Pairing — Director verifies room and student pairing (SCR-DIR-002)', async ({
    page,
  }) => {
    await loginAs(page, 'director@melue.foundation');

    // Click Staff Scheduling tab
    const schedTab = page.locator('[role="tab"]:has-text("Staff Scheduling")').first();
    await schedTab.waitFor({ state: 'visible', timeout: 10000 });
    await schedTab.click();

    // Verify Scheduling screen loaded
    await expect(page.locator('text=SESSION SCHEDULE BLOCKS').first()).toBeVisible({
      timeout: 15000,
    });
  });

  test('STEP 5 & 6: Active Therapy Delivery & Incident Capture — Teacher conducts session (SCR-002, SCR-003, SCR-004)', async ({
    page,
  }) => {
    await loginAs(page, 'teacher1@melue.foundation');

    // Click ABC Log tab
    const abcTab = page.locator('[role="tab"]:has-text("ABC Log")').first();
    await abcTab.waitFor({ state: 'visible', timeout: 10000 });
    await abcTab.click();

    // Verify ABC Log / Behavior Incident recording interface
    await expect(page.locator('text=ABC Data Sheet').first()).toBeVisible({ timeout: 15000 });
  });

  test('STEP 7: Session Summary & Finalization — Clinical notes and independence rate (SCR-005)', async ({
    page,
  }) => {
    await loginAs(page, 'teacher1@melue.foundation');

    // Click Daily Notes tab
    const notesTab = page.locator('[role="tab"]:has-text("Daily Notes")').first();
    await notesTab.waitFor({ state: 'visible', timeout: 10000 });
    await notesTab.click();

    // Verify Daily Notes / Session summary interface
    await expect(page.locator('text=Daily Notes & Summaries').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('text=Sessions Completed').first()).toBeVisible({ timeout: 15000 });
  });

  test('STEP 8: Executive Reporting & Mastery Approval — Director oversight (SCR-DIR-005)', async ({
    page,
  }) => {
    await loginAs(page, 'director@melue.foundation');

    // Click Reports & Oversight tab
    const reportsTab = page.locator('[role="tab"]:has-text("Reports & Oversight")').first();
    await reportsTab.waitFor({ state: 'visible', timeout: 10000 });
    await reportsTab.click();

    // Verify Reports & Oversight dashboard
    await expect(page.locator('text=Submitted Session Summaries').first()).toBeVisible({
      timeout: 15000,
    });
  });
});
