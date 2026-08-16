import { expect, test } from '@playwright/test';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

test('redirects to login and returns to the profile admin form after login', async ({
  page,
}) => {
  let authenticated = false;

  await page.route('http://localhost:3001/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: authenticated
        ? { authenticated: true, user: { username: 'owner' } }
        : { authenticated: false, user: null },
    });
  });

  await page.route('http://localhost:3001/auth/login', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    authenticated = true;
    await route.fulfill({
      status: 201,
      headers: corsHeaders,
      json: { authenticated: true, user: { username: 'owner' } },
    });
  });

  await page.route('http://localhost:3001/profile', async (route) => {
    await route.fulfill({
      status: 404,
      headers: corsHeaders,
      body: '',
    });
  });

  await page.goto('/admin/profile');

  await expect(page).toHaveTitle(/AntinOS Profile Admin/);
  await expect(page).toHaveURL(/\/admin\/login\?returnTo=%2Fadmin%2Fprofile$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Sign in' }),
  ).toBeVisible();

  await page.getByLabel('Username').fill('owner');
  await page.getByLabel('Password').fill('correct-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/admin\/profile$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Portfolio management' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await expect(page.getByLabel('Headline')).toBeVisible();
  await expect(page.getByLabel('Biography')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Current profile picture')).toContainText(
    'No picture',
  );
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});
