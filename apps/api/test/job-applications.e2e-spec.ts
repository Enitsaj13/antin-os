import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { JobApplicationDashboardSummary } from '@antin-os/shared';
import { PrismaService } from '@prisma/prisma.service';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const integrationDatabaseUrl =
  process.env.JOB_APPLICATION_TEST_DATABASE_URL?.trim();
const describeWithDatabase = integrationDatabaseUrl ? describe : describe.skip;

describeWithDatabase('Job applications (PostgreSQL e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let owner: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    process.env.DATABASE_URL = integrationDatabaseUrl;
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'job-application-e2e-secret';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '10';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.AI_DRAFTING_ENABLED = 'true';
    process.env.AI_PROVIDER = 'mock';
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.jobApplication.deleteMany();

    owner = request.agent(app.getHttpServer());
    await owner
      .post('/auth/login')
      .send({ username: 'owner', password: 'correct-password' })
      .expect(201);
  });

  afterEach(async () => {
    await prisma.jobApplication.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('persists private CRUD and dashboard state in PostgreSQL', async () => {
    const createResponse = await owner
      .post('/job-applications')
      .send({
        company: 'Private Company Marker',
        position: 'Private Position Marker',
        jobUrl: 'https://example.com/jobs/private-marker',
        source: 'Private Source Marker',
        salaryRange: 'Private Salary Marker',
        jobDescription: 'Private Job Description Marker',
        notes: 'Private Notes Marker',
        status: 'applied',
        applicationDate: '2026-08-20',
        interviewDate: '2026-08-25',
        nextActionDate: '2026-08-30',
        followUpNotes: 'Private Follow-up Marker',
      })
      .expect(201);

    const id = (createResponse.body as { id: string }).id;
    const persisted = await prisma.jobApplication.findUnique({ where: { id } });

    expect(persisted).toMatchObject({
      company: 'Private Company Marker',
      position: 'Private Position Marker',
      source: 'Private Source Marker',
      jobDescription: 'Private Job Description Marker',
    });

    const listResponse = await owner
      .get('/job-applications?status=applied&search=private%20company')
      .expect(200);
    expect(listResponse.body).toHaveLength(1);

    await owner
      .patch(`/job-applications/${id}`)
      .send({ status: 'interview', salaryRange: null })
      .expect(200);

    const summaryResponse = await owner
      .get('/job-applications/dashboard')
      .expect(200);
    const summary = summaryResponse.body as JobApplicationDashboardSummary;
    expect(summary).toMatchObject({
      total: 1,
      counts: { applied: 0, interview: 1 },
    });

    await owner.delete(`/job-applications/${id}`).expect(200);
    await owner.get(`/job-applications/${id}`).expect(404);
    await expect(prisma.jobApplication.count()).resolves.toBe(0);
  });

  it('never exposes persisted job data through public APIs', async () => {
    await owner
      .post('/job-applications')
      .send({
        company: 'Private Company Marker',
        position: 'Private Position Marker',
        jobDescription: 'Private Job Description Marker',
        notes: 'Private Notes Marker',
        followUpNotes: 'Private Follow-up Marker',
      })
      .expect(201);

    const publicPaths = [
      '/public/profile',
      '/public/projects',
      '/public/experience',
      '/public/education',
      '/public/certifications',
      '/public/resume',
    ];

    for (const path of publicPaths) {
      const response = await request(app.getHttpServer()).get(path);
      expect([200, 404]).toContain(response.status);
      expect(response.text).not.toContain('Private Company Marker');
      expect(response.text).not.toContain('Private Position Marker');
      expect(response.text).not.toContain('Private Notes Marker');
      expect(response.text).not.toContain('Private Job Description Marker');
      expect(response.text).not.toContain('Private Follow-up Marker');
      expect(response.text).not.toContain('jobApplication');
    }

    await request(app.getHttpServer())
      .get('/public/job-applications')
      .expect(404);
  });

  it('keeps mock assistant generation private and mutation-free', async () => {
    const created = await owner
      .post('/job-applications')
      .send({
        company: 'Assistant Private Company',
        position: 'Assistant Private Role',
        jobDescription: 'Assistant Private Description',
        notes: 'Keep this unchanged',
      })
      .expect(201);
    const id = (created.body as { id: string }).id;
    const before = await prisma.jobApplication.findUniqueOrThrow({
      where: { id },
    });

    await request(app.getHttpServer())
      .post(`/job-applications/${id}/assistant`)
      .send({ operation: 'analyze' })
      .expect(401);

    const generated = await owner
      .post(`/job-applications/${id}/assistant`)
      .send({ operation: 'interviewQuestions' })
      .expect(201);

    const generatedBody = generated.body as unknown as {
      operation: string;
      sourceUpdatedAt: string;
      questions: Array<{ question: string; suggestedAnswer: string }>;
    };
    expect(generatedBody.operation).toBe('interviewQuestions');
    expect(generatedBody.sourceUpdatedAt).toBe(before.updatedAt.toISOString());
    expect(generatedBody.questions).toHaveLength(1);
    expect(typeof generatedBody.questions[0]?.question).toBe('string');
    expect(generatedBody.questions[0]?.question.length).toBeGreaterThan(0);
    expect(typeof generatedBody.questions[0]?.suggestedAnswer).toBe('string');
    expect(generatedBody.questions[0]?.suggestedAnswer.length).toBeGreaterThan(
      0,
    );

    const after = await prisma.jobApplication.findUniqueOrThrow({
      where: { id },
    });
    expect(after).toEqual(before);

    const publicResponse = await request(app.getHttpServer()).get(
      '/public/profile',
    );
    expect([200, 404]).toContain(publicResponse.status);
    expect(publicResponse.text).not.toContain('Assistant Private Description');
    expect(publicResponse.text).not.toContain('suggestedAnswer');
  });
});
