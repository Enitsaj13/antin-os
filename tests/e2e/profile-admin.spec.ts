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

  await page.route('http://localhost:3001/public/experience', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: [
        {
          id: 'experience-1',
          company: 'StepCast',
          role: 'Lead Mobile Developer',
          location: 'Remote',
          employmentType: 'Contract',
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: null,
          isCurrent: true,
          summary: 'Built the Expo consumer guide app.',
          achievements: ['Built guided playback'],
          technologies: ['Expo', 'React Native'],
          displayOrder: 0,
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
    page.getByRole('heading', { name: 'Work timeline' }),
  ).toBeVisible();
  await expect(page.getByText('Lead Mobile Developer')).toBeVisible();
  await expect(page.getByText('Built guided playback')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Portfolio management' }),
  ).toHaveCount(0);
  expect(authSessionRequests).toBe(0);
});

test('lets an authenticated owner manage and reorder experience entries', async ({
  page,
}) => {
  let updatePayload: unknown = null;
  let reorderPayload: unknown = null;
  const experiences = [
    {
      id: 'experience-1',
      company: 'StepCast',
      role: 'Lead Mobile Developer',
      location: 'Remote',
      employmentType: 'Contract',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: null,
      isCurrent: true,
      summary: 'Built the Expo consumer guide app.',
      achievements: ['Built guided playback'],
      technologies: ['Expo', 'React Native'],
      displayOrder: 0,
      isPublic: true,
      createdAt: '2026-08-13T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    },
    {
      id: 'experience-2',
      company: 'AntinOS',
      role: 'Full-stack Developer',
      location: 'Manila',
      employmentType: 'Full-time',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-01T00:00:00.000Z',
      isCurrent: false,
      summary: 'Built portfolio systems.',
      achievements: ['Shipped admin tools'],
      technologies: ['React', 'NestJS'],
      displayOrder: 1,
      isPublic: false,
      createdAt: '2026-08-13T10:00:00.000Z',
      updatedAt: '2026-08-14T10:00:00.000Z',
    },
  ];

  await page.route('http://localhost:3001/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: { authenticated: true, user: { username: 'owner' } },
    });
  });

  await page.route('http://localhost:3001/experience**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (url.pathname === '/experience' && request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: experiences,
      });
      return;
    }

    if (
      url.pathname === '/experience/reorder' &&
      request.method() === 'PATCH'
    ) {
      reorderPayload = request.postDataJSON();
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: experiences,
      });
      return;
    }

    if (
      url.pathname === '/experience/experience-2' &&
      request.method() === 'PATCH'
    ) {
      updatePayload = request.postDataJSON();
      experiences[1] = {
        ...experiences[1],
        isPublic: true,
      };
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        json: experiences[1],
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: corsHeaders,
      body: '',
    });
  });

  await page.goto('/admin/experience');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Portfolio management' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Experience', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Lead Mobile Developer').first()).toBeVisible();

  await page
    .getByRole('button', { name: 'Publish Full-stack Developer at AntinOS' })
    .first()
    .click();
  await expect.poll(() => updatePayload).toEqual({ isPublic: true });

  await page
    .getByRole('button', {
      name: 'Move Lead Mobile Developer at StepCast down',
    })
    .first()
    .click();
  await expect
    .poll(() => reorderPayload)
    .toEqual({
      items: [
        { id: 'experience-2', displayOrder: 0 },
        { id: 'experience-1', displayOrder: 1 },
      ],
    });
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
