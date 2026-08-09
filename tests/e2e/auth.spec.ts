import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('redirects unauthenticated users from the dashboard to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('login page has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto('/login');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

const testEmail = process.env.PLAYWRIGHT_TEST_EMAIL;
const testPassword = process.env.PLAYWRIGHT_TEST_PASSWORD;

test.describe('authenticated flow', () => {
  test.skip(!testEmail || !testPassword, 'Set PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_PASSWORD to run this test');

  test('staff can sign in, search patients, and create a patient', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(testEmail!);
    await page.getByLabel('Password').fill(testPassword!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: 'CareFlow Dashboard' })).toBeVisible();

    const patientName = `E2E Test Patient ${Date.now()}`;
    await page.getByRole('button', { name: 'Add new patient' }).click();
    await page.getByLabel('Full name').fill(patientName);
    await page.getByLabel('Date of birth').fill('1990-01-01');
    await page.getByRole('button', { name: 'Create patient' }).click();

    await expect(page.getByRole('heading', { name: patientName })).toBeVisible();
    await expect(page.getByText(`${patientName} was created successfully.`)).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
