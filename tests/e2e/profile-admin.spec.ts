import { expect, test } from '@playwright/test';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

test('loads the public homepage without an admin session', async ({ page }) => {
  let authSessionRequests = 0;

  await page.route('http://localhost:3001/auth/session', async (route) => {
    authSessionRequests += 1;
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: { authenticated: false, user: null },
    });
  });

  await page.route('http://localhost:3001/public/profile', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: {
        id: 'profile-1',
        fullName: 'Jastine Formentera',
        headline: 'Full-stack developer',
        biography: 'I build useful web and mobile products.',
        location: 'Manila, Philippines',
        email: 'jastine@example.com',
        githubUrl: 'https://github.com/Enitsaj13',
        linkedinUrl: 'https://linkedin.com/in/jastine',
        profilePictureUrl: 'https://example.com/profile.webp',
        createdAt: '2026-08-13T10:00:00.000Z',
        updatedAt: '2026-08-14T10:00:00.000Z',
      },
    });
  });

  await page.route('http://localhost:3001/public/projects', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: [
        {
          id: 'project-1',
          title: 'Portfolio API',
          slug: 'portfolio-api',
          summary: 'A portfolio API',
          description: 'Detailed description',
          techStack: ['NestJS', 'Prisma'],
          repoUrl: 'https://github.com/example/repo',
          liveUrl: 'https://example.com',
          imageUrl: 'https://example.com/image.png',
          imageKey: null,
          isPublic: true,
          createdAt: '2026-08-13T10:00:00.000Z',
          updatedAt: '2026-08-14T10:00:00.000Z',
        },
      ],
    });
  });

  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Jastine Formentera' }),
  ).toBeVisible();
  await expect(page.getByText('Full-stack developer')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'View Portfolio API project details' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Portfolio management' }),
  ).toHaveCount(0);
  expect(authSessionRequests).toBe(0);
});

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

  await expect(page).toHaveTitle(/AntinOS Portfolio/);
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
