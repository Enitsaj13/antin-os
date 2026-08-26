import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import {
  certificationSelect,
  educationSelect,
  portfolioSettingsSelect,
} from './credentials-response';
import { CredentialsModule } from './credentials.module';

type MockPrismaService = {
  $transaction: jest.Mock;
  portfolioSettings: {
    upsert: jest.Mock;
  };
  education: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  certification: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    $transaction: jest.fn(),
    portfolioSettings: {
      upsert: jest.fn(),
    },
    education: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    certification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

const now = new Date('2026-08-25T00:00:00.000Z');

function settings(overrides = {}) {
  return {
    id: 'settings-1',
    singletonKey: 'owner',
    showEducation: false,
    showCertifications: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function education(overrides = {}) {
  return {
    id: 'education-1',
    institution: 'University of Cebu',
    credential: 'BS Information Technology',
    fieldOfStudy: 'Software Development',
    location: 'Cebu, Philippines',
    startDate: new Date('2018-06-01T00:00:00.000Z'),
    endDate: new Date('2022-04-01T00:00:00.000Z'),
    summary: 'Studied software engineering foundations.',
    displayOrder: 0,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function certification(overrides = {}) {
  return {
    id: 'certification-1',
    name: 'AWS Cloud Practitioner',
    issuer: 'Amazon Web Services',
    issueDate: new Date('2026-01-01T00:00:00.000Z'),
    expirationDate: new Date('2029-01-01T00:00:00.000Z'),
    credentialId: 'AWS-123',
    credentialUrl: 'https://example.com/aws',
    summary: 'Cloud fundamentals certification.',
    displayOrder: 0,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function educationPayload(overrides = {}) {
  return {
    institution: ' University of Cebu ',
    credential: ' BS Information Technology ',
    fieldOfStudy: ' Software Development ',
    location: ' Cebu, Philippines ',
    startDate: '2018-06-01',
    endDate: '2022-04-01',
    summary: ' Studied software engineering foundations. ',
    displayOrder: 0,
    ...overrides,
  };
}

function certificationPayload(overrides = {}) {
  return {
    name: ' AWS Cloud Practitioner ',
    issuer: ' Amazon Web Services ',
    issueDate: '2026-01-01',
    expirationDate: '2029-01-01',
    credentialId: ' AWS-123 ',
    credentialUrl: ' https://example.com/aws ',
    summary: ' Cloud fundamentals certification. ',
    displayOrder: 0,
    ...overrides,
  };
}

describe('CredentialsController', () => {
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
    prisma.$transaction.mockResolvedValue([]);
    prisma.portfolioSettings.upsert.mockResolvedValue(settings());

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CredentialsModule],
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

  it('creates default hidden settings and updates visibility independently', async () => {
    prisma.portfolioSettings.upsert
      .mockResolvedValueOnce(settings())
      .mockResolvedValueOnce(settings({ showEducation: true }))
      .mockResolvedValueOnce(
        settings({ showEducation: true, showCertifications: true }),
      );

    const initial = await owner.get('/portfolio-settings').expect(200);

    expect(initial.body).toMatchObject({
      singletonKey: 'owner',
      showEducation: false,
      showCertifications: false,
    });

    await owner
      .patch('/portfolio-settings')
      .send({ showEducation: true })
      .expect(200);
    await owner
      .patch('/portfolio-settings')
      .send({ showCertifications: true })
      .expect(200);

    expect(prisma.portfolioSettings.upsert).toHaveBeenNthCalledWith(1, {
      where: { singletonKey: 'owner' },
      create: { singletonKey: 'owner' },
      update: {},
      select: portfolioSettingsSelect,
    });
    expect(prisma.portfolioSettings.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        update: { showEducation: true },
      }),
    );
    expect(prisma.portfolioSettings.upsert).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        update: { showCertifications: true },
      }),
    );
  });

  it('rejects unauthenticated management operations without mutating state', async () => {
    await request(app.getHttpServer()).get('/portfolio-settings').expect(401);
    await request(app.getHttpServer())
      .patch('/portfolio-settings')
      .send({ showEducation: true })
      .expect(401);
    await request(app.getHttpServer())
      .post('/education')
      .send(educationPayload())
      .expect(401);
    await request(app.getHttpServer()).get('/education').expect(401);
    await request(app.getHttpServer())
      .patch('/education/reorder')
      .send({ items: [{ id: 'education-1', displayOrder: 0 }] })
      .expect(401);
    await request(app.getHttpServer())
      .post('/certifications')
      .send(certificationPayload())
      .expect(401);
    await request(app.getHttpServer()).get('/certifications').expect(401);
    await request(app.getHttpServer())
      .patch('/certifications/reorder')
      .send({ items: [{ id: 'certification-1', displayOrder: 0 }] })
      .expect(401);

    expect(prisma.education.create).not.toHaveBeenCalled();
    expect(prisma.education.update).not.toHaveBeenCalled();
    expect(prisma.certification.create).not.toHaveBeenCalled();
    expect(prisma.certification.update).not.toHaveBeenCalled();
  });

  it('manages education and certification records while defaulting new entries to private', async () => {
    const educationRecord = education({ isPublic: false });
    const certificationRecord = certification({ isPublic: false });
    prisma.education.create.mockResolvedValue(educationRecord);
    prisma.education.findMany.mockResolvedValue([educationRecord]);
    prisma.education.findUnique.mockResolvedValue(educationRecord);
    prisma.education.update.mockResolvedValue(
      education({ credential: 'Updated Degree' }),
    );
    prisma.education.delete.mockResolvedValue(educationRecord);
    prisma.certification.create.mockResolvedValue(certificationRecord);
    prisma.certification.findMany.mockResolvedValue([certificationRecord]);
    prisma.certification.findUnique.mockResolvedValue(certificationRecord);
    prisma.certification.update.mockResolvedValue(
      certification({ name: 'Updated Certification' }),
    );
    prisma.certification.delete.mockResolvedValue(certificationRecord);

    await owner.post('/education').send(educationPayload()).expect(201);
    await owner.get('/education').expect(200);
    await owner.get('/education/education-1').expect(200);
    await owner
      .patch('/education/education-1')
      .send({ credential: ' Updated Degree ' })
      .expect(200);
    await owner
      .patch('/education/reorder')
      .send({ items: [{ id: 'education-1', displayOrder: 0 }] })
      .expect(200);
    await owner.delete('/education/education-1').expect(200);

    await owner
      .post('/certifications')
      .send(certificationPayload())
      .expect(201);
    await owner.get('/certifications').expect(200);
    await owner.get('/certifications/certification-1').expect(200);
    await owner
      .patch('/certifications/certification-1')
      .send({ name: ' Updated Certification ' })
      .expect(200);
    await owner
      .patch('/certifications/reorder')
      .send({ items: [{ id: 'certification-1', displayOrder: 0 }] })
      .expect(200);
    await owner.delete('/certifications/certification-1').expect(200);

    expect(prisma.education.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        institution: 'University of Cebu',
        isPublic: false,
      }),
      select: educationSelect,
    });
    expect(prisma.certification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'AWS Cloud Practitioner',
        isPublic: false,
      }),
      select: certificationSelect,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('validates credential payloads and date ranges', async () => {
    await owner.post('/education').send({}).expect(400);
    await owner
      .post('/education')
      .send(educationPayload({ institution: '   ' }))
      .expect(400);
    await owner
      .post('/education')
      .send(educationPayload({ endDate: '2017-01-01' }))
      .expect(400);
    await owner
      .post('/education')
      .send(educationPayload({ displayOrder: -1 }))
      .expect(400);
    await owner.post('/certifications').send({}).expect(400);
    await owner
      .post('/certifications')
      .send(certificationPayload({ credentialUrl: 'not-a-url' }))
      .expect(400);
    await owner
      .post('/certifications')
      .send(certificationPayload({ expirationDate: '2025-01-01' }))
      .expect(400);
    await owner.patch('/portfolio-settings').send({}).expect(400);
  });

  it('keeps managed records accessible while disabled publicly', async () => {
    const educationRecord = education({ isPublic: true });
    const certificationRecord = certification({ isPublic: true });
    prisma.portfolioSettings.upsert.mockResolvedValue(
      settings({ showEducation: false, showCertifications: false }),
    );
    prisma.education.findMany.mockResolvedValue([educationRecord]);
    prisma.certification.findMany.mockResolvedValue([certificationRecord]);

    await owner.get('/education').expect(200);
    await owner.get('/certifications').expect(200);
    const publicEducation = await request(app.getHttpServer())
      .get('/public/education')
      .expect(200);
    const publicCertification = await request(app.getHttpServer())
      .get('/public/certifications')
      .expect(200);

    expect(publicEducation.body).toEqual([]);
    expect(publicCertification.body).toEqual([]);
    expect(prisma.education.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.certification.findMany).toHaveBeenCalledTimes(1);
  });

  it('returns public records only when sections are enabled and entries are published', async () => {
    prisma.portfolioSettings.upsert.mockResolvedValue(
      settings({ showEducation: true, showCertifications: true }),
    );
    prisma.education.findMany.mockResolvedValue([
      education({ isPublic: true }),
    ]);
    prisma.certification.findMany.mockResolvedValue([
      certification({ isPublic: true }),
    ]);

    const publicEducation = await request(app.getHttpServer())
      .get('/public/education')
      .expect(200);
    const publicCertification = await request(app.getHttpServer())
      .get('/public/certifications')
      .expect(200);

    expect(publicEducation.body).toHaveLength(1);
    expect(publicCertification.body).toHaveLength(1);
    expect(prisma.education.findMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: [
        { displayOrder: 'asc' },
        { startDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: educationSelect,
    });
    expect(prisma.certification.findMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: [
        { displayOrder: 'asc' },
        { issueDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: certificationSelect,
    });
  });

  it('returns empty public lists for enabled empty or unpublished-only sections', async () => {
    prisma.portfolioSettings.upsert.mockResolvedValue(
      settings({ showEducation: true, showCertifications: true }),
    );
    prisma.education.findMany.mockResolvedValue([]);
    prisma.certification.findMany.mockResolvedValue([]);

    const publicEducation = await request(app.getHttpServer())
      .get('/public/education')
      .expect(200);
    const publicCertification = await request(app.getHttpServer())
      .get('/public/certifications')
      .expect(200);

    expect(publicEducation.body).toEqual([]);
    expect(publicCertification.body).toEqual([]);
  });

  it('preserves records and publication states when disabling and re-enabling sections', async () => {
    prisma.portfolioSettings.upsert
      .mockResolvedValueOnce(
        settings({ showEducation: true, showCertifications: true }),
      )
      .mockResolvedValueOnce(
        settings({ showEducation: false, showCertifications: true }),
      )
      .mockResolvedValueOnce(
        settings({ showEducation: true, showCertifications: true }),
      );

    await owner
      .patch('/portfolio-settings')
      .send({ showEducation: true, showCertifications: true })
      .expect(200);
    await owner
      .patch('/portfolio-settings')
      .send({ showEducation: false })
      .expect(200);
    await owner
      .patch('/portfolio-settings')
      .send({ showEducation: true })
      .expect(200);

    expect(prisma.education.update).not.toHaveBeenCalled();
    expect(prisma.education.delete).not.toHaveBeenCalled();
    expect(prisma.certification.update).not.toHaveBeenCalled();
    expect(prisma.certification.delete).not.toHaveBeenCalled();
  });
});
