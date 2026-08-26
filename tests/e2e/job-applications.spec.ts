import { expect, test, type Page } from '@playwright/test';
import type { JobApplication, JobApplicationStatus } from '@antin-os/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

function now() {
  return '2026-08-27T08:00:00.000Z';
}

function toApplication(
  input: Record<string, unknown>,
  id: string,
): JobApplication {
  return {
    id,
    company: String(input.company),
    position: String(input.position),
    jobUrl: (input.jobUrl as string | null | undefined) ?? null,
    source: (input.source as string | null | undefined) ?? null,
    salaryRange: (input.salaryRange as string | null | undefined) ?? null,
    notes: (input.notes as string | null | undefined) ?? null,
    status: (input.status as JobApplicationStatus | undefined) ?? 'saved',
    applicationDate:
      (input.applicationDate as string | null | undefined) ?? null,
    interviewDate: (input.interviewDate as string | null | undefined) ?? null,
    nextActionDate: (input.nextActionDate as string | null | undefined) ?? null,
    followUpNotes: (input.followUpNotes as string | null | undefined) ?? null,
    createdAt: now(),
    updatedAt: now(),
  };
}

async function mockAuthenticatedJobApi(
  page: Page,
  applications: JobApplication[],
) {
  await page.route('http://localhost:3001/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: { authenticated: true, user: { username: 'owner' } },
    });
  });

  await page.route(
    'http://localhost:3001/job-applications**',
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      if (
        url.pathname === '/job-applications/dashboard' &&
        request.method() === 'GET'
      ) {
        const counts: Record<JobApplicationStatus, number> = {
          saved: 0,
          applied: 0,
          screening: 0,
          interview: 0,
          offer: 0,
          rejected: 0,
          withdrawn: 0,
        };

        for (const application of applications) {
          counts[application.status] += 1;
        }

        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          json: { total: applications.length, counts },
        });
        return;
      }

      if (url.pathname === '/job-applications') {
        if (request.method() === 'GET') {
          const status = url.searchParams.get('status');
          const search = url.searchParams.get('search')?.toLowerCase();
          const filtered = applications.filter((application) => {
            if (status && application.status !== status) {
              return false;
            }

            return search
              ? [
                  application.company,
                  application.position,
                  application.source ?? '',
                  application.salaryRange ?? '',
                ].some((value) => value.toLowerCase().includes(search))
              : true;
          });
          await route.fulfill({
            status: 200,
            headers: corsHeaders,
            json: filtered,
          });
          return;
        }

        if (request.method() === 'POST') {
          const input = request.postDataJSON() as Record<string, unknown>;
          const created = toApplication(
            input,
            `application-${applications.length + 1}`,
          );
          applications.push(created);
          await route.fulfill({
            status: 201,
            headers: corsHeaders,
            json: created,
          });
          return;
        }
      }

      const id = decodeURIComponent(
        url.pathname.replace('/job-applications/', ''),
      );
      const index = applications.findIndex(
        (application) => application.id === id,
      );

      if (index < 0) {
        await route.fulfill({
          status: 404,
          headers: corsHeaders,
          json: { message: 'Job application not found' },
        });
        return;
      }

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          json: applications[index],
        });
        return;
      }

      if (request.method() === 'PATCH') {
        applications[index] = {
          ...applications[index],
          ...(request.postDataJSON() as Partial<JobApplication>),
          updatedAt: now(),
        };
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          json: applications[index],
        });
        return;
      }

      if (request.method() === 'DELETE') {
        const [deleted] = applications.splice(index, 1);
        await route.fulfill({
          status: 200,
          headers: corsHeaders,
          json: deleted,
        });
        return;
      }

      await route.fulfill({ status: 405, headers: corsHeaders, body: '' });
    },
  );
}

test('manages the authenticated application pipeline end to end', async ({
  page,
}) => {
  const applications: JobApplication[] = [];
  await mockAuthenticatedJobApi(page, applications);

  await page.goto('/admin/job-applications');
  await expect(
    page.getByRole('heading', { name: 'Job applications' }),
  ).toBeVisible();
  await expect(page.getByText(/No job applications yet/)).toBeVisible();

  await page.getByRole('button', { name: 'New application' }).click();
  await page.getByLabel('Company').fill('Private Company Marker');
  await page.getByLabel('Position').fill('Product Engineer');
  await page.getByLabel('Job URL').fill('https://example.com/jobs/1');
  await page.getByLabel('Source').fill('Referral');
  await page.getByLabel('Salary range').fill('$100k-$140k');
  await page.getByLabel('Application date').fill('2026-08-20');
  await page.getByLabel('Next-action date').fill('2026-08-30');
  await page.getByLabel('Notes', { exact: true }).fill('Private Notes Marker');
  await page.getByLabel('Follow-up notes').fill('Private Follow-up Marker');
  await page.getByRole('button', { name: 'Create application' }).click();
  await expect(page.getByRole('status')).toContainText('Application created.');

  await page.getByRole('button', { name: 'Back to applications' }).click();
  await expect(page.getByRole('table')).toContainText('Private Company Marker');
  await page.getByLabel('Search').fill('no match');
  await expect(
    page.getByRole('heading', { name: 'No applications match these filters' }),
  ).toBeVisible();
  await page.getByLabel('Search').fill('Private Company');
  await page.getByLabel('Status').selectOption('saved');
  await expect(page.getByRole('table')).toContainText('Product Engineer');

  await page
    .getByLabel('Edit Product Engineer at Private Company Marker')
    .click();
  await page.getByLabel('Position').fill('Senior Product Engineer');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('Application updated.');

  await page.getByRole('button', { name: 'Back to applications' }).click();
  await page.getByRole('button', { name: 'Kanban' }).click();
  await page
    .getByLabel('Status for Senior Product Engineer at Private Company Marker')
    .selectOption('interview');
  await expect(
    page.locator('section[aria-labelledby="kanban-interview"]'),
  ).toContainText('Senior Product Engineer');

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await expect(
    page.getByText('Total applications').locator('..'),
  ).toContainText('1');
  await expect(
    page.getByRole('progressbar', {
      name: 'Interview pipeline distribution',
    }),
  ).toHaveAttribute('aria-valuenow', '100');

  await page.getByRole('button', { name: 'Table' }).click();
  await page
    .getByLabel('Delete Senior Product Engineer at Private Company Marker')
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'Delete Senior Product Engineer at Private Company Marker?',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Delete permanently' }).click();
  await expect(
    page.getByRole('heading', { name: 'No job applications yet' }),
  ).toBeVisible();
});

test('blocks unauthenticated workflows and keeps job data off public pages and APIs', async ({
  page,
}) => {
  let privateApiRequests = 0;

  await page.route('http://localhost:3001/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      json: { authenticated: false, user: null },
    });
  });
  await page.route(
    'http://localhost:3001/job-applications**',
    async (route) => {
      privateApiRequests += 1;
      await route.fulfill({
        status: 401,
        headers: corsHeaders,
        json: { message: 'Authentication required' },
      });
    },
  );

  await page.goto('/admin/job-applications/kanban');
  await expect(page).toHaveURL(
    /\/admin\/login\?returnTo=%2Fadmin%2Fjob-applications%2Fkanban$/,
  );
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  expect(privateApiRequests).toBe(0);

  const apiStatus = await page.evaluate(async () => {
    const response = await fetch('http://localhost:3001/job-applications', {
      credentials: 'include',
    });
    return response.status;
  });
  expect(apiStatus).toBe(401);

  const publicPayloads: Record<string, unknown> = {
    '/public/profile': {
      id: 'profile-1',
      fullName: 'Public Owner',
      headline: 'Developer',
      biography: 'Public biography.',
      location: 'Manila',
      email: 'public@example.com',
      githubUrl: null,
      linkedinUrl: null,
      profilePictureUrl: null,
      createdAt: now(),
      updatedAt: now(),
    },
    '/public/projects': [],
    '/public/experience': [],
    '/public/education': [],
    '/public/certifications': [],
  };

  for (const [path, json] of Object.entries(publicPayloads)) {
    await page.route(`http://localhost:3001${path}`, async (route) => {
      await route.fulfill({ status: 200, headers: corsHeaders, json });
    });
  }
  await page.route('http://localhost:3001/public/resume', async (route) => {
    await route.fulfill({ status: 404, headers: corsHeaders, body: '' });
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Public Owner' }),
  ).toBeVisible();
  await expect(page.getByText('Private Company Marker')).toHaveCount(0);
  await expect(page.getByText('Private Notes Marker')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Job applications' }),
  ).toHaveCount(0);
});
