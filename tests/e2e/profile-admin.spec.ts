import { expect, test } from '@playwright/test';

test('loads the profile admin form', async ({ page }) => {
  await page.route('http://localhost:3001/profile', async (route) => {
    await route.fulfill({
      status: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    });
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/AntinOS Profile Admin/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile' }),
  ).toBeVisible();
  await expect(page.getByLabel('Full name')).toBeVisible();
  await expect(page.getByLabel('Headline')).toBeVisible();
  await expect(page.getByLabel('Biography')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Current profile picture')).toContainText(
    'No picture',
  );
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});
