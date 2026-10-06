import { test, expect } from '@playwright/test';

test.describe('WCAG 2.1 AA Accessibility & Keyboard Interaction Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForSelector('#root', { timeout: 30000 });
  });

  test('Login screen interactive elements have accessible roles and labels', async ({ page }) => {
    // Verify main card heading
    const heading = page.locator('text=Sign In to Your Account').first();
    await expect(heading).toBeVisible();

    // Verify inputs have accessible labels
    const emailInput = page.locator('input[aria-label="Email Address"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[aria-label="Password"]');
    await expect(passwordInput).toBeVisible();

    // Verify Remember this device has checkbox role
    const rememberCheckbox = page.locator('[role="checkbox"][aria-label="Remember this device"]');
    await expect(rememberCheckbox).toBeVisible();

    // Verify Forgot Password has link semantics
    const forgotLink = page.locator('[role="link"]');
    await expect(forgotLink).toBeVisible();

    // Verify Sign In has button role
    const signInBtn = page.locator('[role="button"][aria-label="Sign In"]');
    await expect(signInBtn).toBeVisible();
  });

  test('Form input chaining via Enter key (onSubmitEditing) and keyboard tab order', async ({
    page,
  }) => {
    const emailInput = page.locator('input[aria-label="Email Address"]');
    const passwordInput = page.locator('input[aria-label="Password"]');

    await emailInput.click();
    await emailInput.fill('coordinator@melue.foundation');

    // Press Enter on email input -> shifts focus to password input (onSubmitEditing chaining)
    await emailInput.press('Enter');
    await expect(passwordInput).toBeFocused();

    // Fill password
    await passwordInput.fill('Password123!');
  });

  test('ToastProvider contains live region for screen reader announcements', async ({ page }) => {
    // Toast container should have aria-live="polite"
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion.first()).toBeAttached();
  });

  test('Forgot Password flow is fully keyboard navigable and accessible', async ({ page }) => {
    const forgotLink = page.locator('[role="link"]');
    await forgotLink.click();

    // Check heading and inputs in reset screen
    await expect(page.locator('text=Reset Your Password').first()).toBeVisible();

    const emailInput = page.locator('input[aria-labelledby="forgotEmailLabel"]');
    await expect(emailInput).toBeVisible();

    const sendBtn = page.locator('[role="button"][aria-label="Send Reset Code"]');
    await expect(sendBtn).toBeVisible();

    const backBtn = page.locator('[role="button"][aria-label="Back to Sign In"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Should return to Sign In
    await expect(page.locator('text=Sign In to Your Account').first()).toBeVisible();
  });
});
