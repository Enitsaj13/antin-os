import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationDashboardSummary,
  type JobApplicationStatus,
} from '@antin-os/shared';
import { JobApplicationStatus as PrismaJobApplicationStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import request from 'supertest';
import { App } from 'supertest/types';
import { jobApplicationSelect } from './job-application-response';
import { JobApplicationsModule } from './job-applications.module';

type MockPrismaService = {
  jobApplication: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    groupBy: jest.Mock;
  };
  profile: { findUnique: jest.Mock };
  project: { findMany: jest.Mock };
  experience: { findMany: jest.Mock };
};

function createMockPrisma(): MockPrismaService {
  return {
    jobApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    profile: { findUnique: jest.fn() },
    project: { findMany: jest.fn() },
    experience: { findMany: jest.fn() },
  };
}

const now = new Date('2026-08-27T08:00:00.000Z');

function application(overrides: Record<string, unknown> = {}) {
  return {
    id: 'application-1',
    company: 'OpenAI',
    position: 'Product Engineer',
    jobUrl: 'https://example.com/jobs/1',
    source: 'Referral',
    salaryRange: '$100k-$140k',
    jobDescription: 'Build private AI-assisted career workflows.',
    notes: 'Prepare systems examples.',
    status: PrismaJobApplicationStatus.SAVED,
    applicationDate: new Date('2026-08-20T00:00:00.000Z'),
    interviewDate: null,
    nextActionDate: new Date('2026-08-29T00:00:00.000Z'),
    followUpNotes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    company: ' OpenAI ',
    position: ' Product Engineer ',
    jobUrl: ' https://example.com/jobs/1 ',
    source: ' Referral ',
    salaryRange: ' $100k-$140k ',
    jobDescription: ' Build private AI-assisted career workflows. ',
    notes: ' Prepare systems examples. ',
    applicationDate: '2026-08-20',
    nextActionDate: '2026-08-29',
    ...overrides,
  };
}

describe('JobApplicationsController', () => {
  let app: INestApplication<App>;
  let prisma: MockPrismaService;
  let owner: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'test-session-secret';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '5';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';

    prisma = createMockPrisma();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [JobApplicationsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    owner = request.agent(app.getHttpServer());
    await owner
      .post('/auth/login')
      .send({ username: 'owner', password: 'correct-password' })
      .expect(201);
  });

  afterEach(async () => {
    await app?.close();
  });

  it('requires owner authentication for every job-application endpoint', async () => {
    const anonymous = request(app.getHttpServer());

    await anonymous.post('/job-applications').send(validPayload()).expect(401);
    await anonymous.get('/job-applications').expect(401);
    await anonymous.get('/job-applications/dashboard').expect(401);
    await anonymous.get('/job-applications/application-1').expect(401);
    await anonymous
      .post('/job-applications/application-1/assistant')
      .send({ operation: 'analyze' })
      .expect(401);
    await anonymous
      .patch('/job-applications/application-1')
      .send({ status: 'applied' })
      .expect(401);
    await anonymous.delete('/job-applications/application-1').expect(401);

    expect(prisma.jobApplication.create).not.toHaveBeenCalled();
    expect(prisma.jobApplication.findMany).not.toHaveBeenCalled();
    expect(prisma.jobApplication.update).not.toHaveBeenCalled();
    expect(prisma.jobApplication.delete).not.toHaveBeenCalled();
  });

  it('creates a minimal application with saved status and null optional fields', async () => {
    prisma.jobApplication.create.mockResolvedValue(
      application({
        jobUrl: null,
        source: null,
        salaryRange: null,
        jobDescription: null,
        notes: null,
        applicationDate: null,
        interviewDate: null,
        nextActionDate: null,
        followUpNotes: null,
      }),
    );

    const response = await owner
      .post('/job-applications')
      .send({ company: ' OpenAI ', position: ' Product Engineer ' })
      .expect(201);

    expect(response.body).toMatchObject({
      company: 'OpenAI',
      position: 'Product Engineer',
      status: 'saved',
      jobUrl: null,
      applicationDate: null,
    });
    expect(prisma.jobApplication.create).toHaveBeenCalledWith({
      data: {
        company: 'OpenAI',
        position: 'Product Engineer',
        jobUrl: null,
        source: null,
        salaryRange: null,
        jobDescription: null,
        notes: null,
        status: PrismaJobApplicationStatus.SAVED,
        applicationDate: null,
        interviewDate: null,
        nextActionDate: null,
        followUpNotes: null,
      },
      select: jobApplicationSelect,
    });
  });

  it.each(JOB_APPLICATION_STATUSES)(
    'accepts and returns the %s status',
    async (status) => {
      const prismaStatus = status.toUpperCase() as PrismaJobApplicationStatus;
      prisma.jobApplication.create.mockResolvedValue(
        application({ status: prismaStatus }),
      );

      const response = await owner
        .post('/job-applications')
        .send(validPayload({ status }))
        .expect(201);

      const responseBody = response.body as { status: JobApplicationStatus };
      const createCalls = prisma.jobApplication.create.mock
        .calls as unknown as Array<
        [{ data: { status: PrismaJobApplicationStatus } }]
      >;
      const createOptions = createCalls.at(-1)?.[0];

      expect(responseBody.status).toBe(status);
      expect(createOptions?.data.status).toBe(prismaStatus);
    },
  );

  it('lists with status filters and case-insensitive search, then reads, updates, and deletes', async () => {
    const record = application();
    prisma.jobApplication.findMany.mockResolvedValue([record]);
    prisma.jobApplication.findUnique
      .mockResolvedValueOnce(record)
      .mockResolvedValueOnce({ id: record.id })
      .mockResolvedValueOnce({ id: record.id });
    prisma.jobApplication.update.mockResolvedValue(
      application({ position: 'Senior Product Engineer' }),
    );
    prisma.jobApplication.delete.mockResolvedValue(record);

    const listResponse = await owner
      .get('/job-applications?status=saved&search= product ')
      .expect(200);
    await owner.get('/job-applications/application-1').expect(200);
    await owner
      .patch('/job-applications/application-1')
      .send({ position: ' Senior Product Engineer ' })
      .expect(200);
    await owner.delete('/job-applications/application-1').expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(prisma.jobApplication.findMany).toHaveBeenCalledWith({
      where: {
        status: PrismaJobApplicationStatus.SAVED,
        OR: [
          'company',
          'position',
          'source',
          'salaryRange',
          'jobDescription',
        ].map((field) => ({
          [field]: { contains: 'product', mode: 'insensitive' },
        })),
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: jobApplicationSelect,
    });
    expect(prisma.jobApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'application-1' },
        data: { position: 'Senior Product Engineer' },
      }),
    );
    expect(prisma.jobApplication.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'application-1' } }),
    );
  });

  it('validates required text, statuses, URLs, dates, limits, and non-empty updates', async () => {
    await owner
      .post('/job-applications')
      .send(validPayload({ company: '   ' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ position: '' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ status: 'negotiating' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ jobUrl: '/jobs/1' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ jobUrl: 'ftp://example.com/jobs/1' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ applicationDate: 'not-a-date' }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ company: 'x'.repeat(201) }))
      .expect(400);
    await owner
      .post('/job-applications')
      .send(validPayload({ jobDescription: 'x'.repeat(30_001) }))
      .expect(400);
    await owner.patch('/job-applications/application-1').send({}).expect(400);

    expect(prisma.jobApplication.create).not.toHaveBeenCalled();
    expect(prisma.jobApplication.update).not.toHaveBeenCalled();
  });

  it('clears nullable values and never changes dates during a status-only update', async () => {
    prisma.jobApplication.findUnique.mockResolvedValue({ id: 'application-1' });
    prisma.jobApplication.update
      .mockResolvedValueOnce(
        application({
          jobUrl: null,
          source: null,
          salaryRange: null,
          jobDescription: null,
          notes: null,
          applicationDate: null,
          interviewDate: null,
          nextActionDate: null,
          followUpNotes: null,
        }),
      )
      .mockResolvedValueOnce(
        application({ status: PrismaJobApplicationStatus.INTERVIEW }),
      );

    await owner
      .patch('/job-applications/application-1')
      .send({
        jobUrl: '',
        source: null,
        salaryRange: '   ',
        jobDescription: '   ',
        notes: null,
        applicationDate: null,
        interviewDate: null,
        nextActionDate: null,
        followUpNotes: '',
      })
      .expect(200);
    await owner
      .patch('/job-applications/application-1')
      .send({ status: 'interview' })
      .expect(200);

    expect(prisma.jobApplication.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: {
          jobUrl: null,
          source: null,
          salaryRange: null,
          jobDescription: null,
          notes: null,
          applicationDate: null,
          interviewDate: null,
          nextActionDate: null,
          followUpNotes: null,
        },
      }),
    );
    expect(prisma.jobApplication.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: { status: PrismaJobApplicationStatus.INTERVIEW },
      }),
    );
  });

  it('returns total and zero-filled counts for every dashboard status', async () => {
    prisma.jobApplication.groupBy.mockResolvedValue([
      {
        status: PrismaJobApplicationStatus.SAVED,
        _count: { _all: 2 },
      },
      {
        status: PrismaJobApplicationStatus.INTERVIEW,
        _count: { _all: 1 },
      },
    ]);

    const response = await owner.get('/job-applications/dashboard').expect(200);
    const summary = response.body as JobApplicationDashboardSummary;

    expect(summary.total).toBe(3);
    expect(summary.counts.saved).toBe(2);
    expect(summary.counts.interview).toBe(1);
    expect(
      JOB_APPLICATION_STATUSES.every(
        (status: JobApplicationStatus) =>
          typeof summary.counts[status] === 'number',
      ),
    ).toBe(true);
  });

  it('returns 404 for missing reads, updates, and deletes', async () => {
    prisma.jobApplication.findUnique.mockResolvedValue(null);

    await owner.get('/job-applications/missing').expect(404);
    await owner
      .patch('/job-applications/missing')
      .send({ status: 'applied' })
      .expect(404);
    await owner.delete('/job-applications/missing').expect(404);

    expect(prisma.jobApplication.update).not.toHaveBeenCalled();
    expect(prisma.jobApplication.delete).not.toHaveBeenCalled();
  });

  it('validates closed assistant operations and checks job source first', async () => {
    await owner
      .post('/job-applications/application-1/assistant')
      .send({ operation: 'freeFormChat' })
      .expect(400);

    prisma.jobApplication.findUnique.mockResolvedValueOnce(null);
    await owner
      .post('/job-applications/missing/assistant')
      .send({ operation: 'analyze' })
      .expect(404);

    prisma.jobApplication.findUnique.mockResolvedValueOnce(
      application({ jobDescription: null }),
    );
    await owner
      .post('/job-applications/application-1/assistant')
      .send({ operation: 'coverLetter' })
      .expect(400);

    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    expect(prisma.project.findMany).not.toHaveBeenCalled();
    expect(prisma.experience.findMany).not.toHaveBeenCalled();
  });
});
