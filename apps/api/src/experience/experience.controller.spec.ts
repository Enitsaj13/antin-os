import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import { ExperienceResponse, experienceSelect } from './experience-response';
import { ExperienceModule } from './experience.module';

type MockPrismaService = {
  $transaction: jest.Mock;
  experience: {
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
    experience: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

const now = new Date('2026-08-25T00:00:00.000Z');

function experience(overrides = {}) {
  return {
    id: 'experience-1',
    company: 'StepCast',
    role: 'Lead Mobile Developer',
    location: 'Remote',
    employmentType: 'Contract',
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: null,
    isCurrent: true,
    summary: 'Built the Expo consumer guide app.',
    achievements: ['Built guided playback', 'Shipped TestFlight builds'],
    technologies: ['Expo', 'React Native', 'TypeScript'],
    displayOrder: 0,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function validPayload(overrides = {}) {
  return {
    company: ' StepCast ',
    role: ' Lead Mobile Developer ',
    location: ' Remote ',
    employmentType: ' Contract ',
    startDate: '2025-01-01',
    isCurrent: true,
    summary: ' Built the Expo consumer guide app. ',
    achievements: [' Built guided playback ', 'Shipped TestFlight builds'],
    technologies: [' Expo ', 'React Native'],
    displayOrder: 0,
    ...overrides,
  };
}

describe('ExperienceController', () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ExperienceModule],
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

  it('rejects unauthenticated experience management without mutating state', async () => {
    await request(app.getHttpServer()).post('/experience').send({}).expect(401);
    await request(app.getHttpServer()).get('/experience').expect(401);
    await request(app.getHttpServer())
      .get('/experience/experience-1')
      .expect(401);
    await request(app.getHttpServer())
      .patch('/experience/experience-1')
      .send({ role: 'Updated' })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/experience/reorder')
      .send({ items: [{ id: 'experience-1', displayOrder: 0 }] })
      .expect(401);
    await request(app.getHttpServer())
      .delete('/experience/experience-1')
      .expect(401);

    expect(prisma.experience.create).not.toHaveBeenCalled();
    expect(prisma.experience.update).not.toHaveBeenCalled();
    expect(prisma.experience.delete).not.toHaveBeenCalled();
  });

  it('creates a managed experience and defaults isPublic to false when omitted', async () => {
    const created = experience({
      isPublic: false,
      achievements: [],
      technologies: [],
    });
    prisma.experience.create.mockResolvedValue(created);
    const payload = validPayload();
    delete payload.achievements;
    delete payload.technologies;

    const response = await owner.post('/experience').send(payload).expect(201);

    expect(response.body).toMatchObject({
      id: 'experience-1',
      company: 'StepCast',
      role: 'Lead Mobile Developer',
      location: 'Remote',
      employmentType: 'Contract',
      isCurrent: true,
      isPublic: false,
      achievements: [],
      technologies: [],
    });
    expect(prisma.experience.create).toHaveBeenCalledWith({
      data: {
        company: 'StepCast',
        role: 'Lead Mobile Developer',
        location: 'Remote',
        employmentType: 'Contract',
        startDate: new Date('2025-01-01'),
        endDate: null,
        isCurrent: true,
        summary: 'Built the Expo consumer guide app.',
        achievements: [],
        technologies: [],
        displayOrder: 0,
        isPublic: false,
      },
      select: experienceSelect,
    });
  });

  it('lists, reads, updates, deletes, and reorders authenticated entries', async () => {
    const first = experience();
    const second = experience({
      id: 'experience-2',
      company: 'AntinOS',
      role: 'Full-stack Developer',
      isPublic: false,
      displayOrder: 1,
    });
    prisma.experience.findMany
      .mockResolvedValueOnce([first, second])
      .mockResolvedValueOnce([{ id: first.id }, { id: second.id }])
      .mockResolvedValueOnce([second, first]);
    prisma.experience.findUnique
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce({ id: first.id })
      .mockResolvedValueOnce({ id: second.id });
    prisma.experience.update
      .mockResolvedValueOnce(experience({ role: 'Senior Mobile Developer' }))
      .mockResolvedValue({ id: 'updated' });
    prisma.experience.delete.mockResolvedValue(second);

    await owner.get('/experience').expect(200);
    await owner.get('/experience/experience-1').expect(200);
    await owner
      .patch('/experience/experience-1')
      .send({ role: ' Senior Mobile Developer ' })
      .expect(200);
    await owner.delete('/experience/experience-2').expect(200);

    const reorderResponse = await owner
      .patch('/experience/reorder')
      .send({
        items: [
          { id: 'experience-2', displayOrder: 0 },
          { id: 'experience-1', displayOrder: 1 },
        ],
      })
      .expect(200);

    const reorderBody = reorderResponse.body as ExperienceResponse[];

    expect(reorderBody[0]).toMatchObject({
      id: 'experience-2',
      displayOrder: 1,
    });
    expect(prisma.experience.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { displayOrder: 'asc' },
          { startDate: 'desc' },
          { updatedAt: 'desc' },
        ],
      }),
    );
    expect(prisma.experience.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'experience-1' },
        data: { role: 'Senior Mobile Developer' },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.experience.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'experience-2' } }),
    );
  });

  it('rejects invalid experience create and update payloads', async () => {
    await owner.post('/experience').send({}).expect(400);
    await owner
      .post('/experience')
      .send(validPayload({ company: '   ' }))
      .expect(400);
    await owner
      .post('/experience')
      .send(validPayload({ startDate: 'not-a-date' }))
      .expect(400);
    await owner
      .post('/experience')
      .send(
        validPayload({
          endDate: '2026-01-01',
          isCurrent: true,
        }),
      )
      .expect(400);
    await owner
      .post('/experience')
      .send(
        validPayload({
          isCurrent: false,
          endDate: '2024-01-01',
        }),
      )
      .expect(400);
    await owner
      .post('/experience')
      .send(validPayload({ displayOrder: -1 }))
      .expect(400);
    await owner
      .post('/experience')
      .send(validPayload({ achievements: ['Built', '   '] }))
      .expect(400);
    await owner.patch('/experience/experience-1').send({}).expect(400);
  });

  it('validates current-role and end-date invariants on partial updates', async () => {
    prisma.experience.findUnique.mockResolvedValue(
      experience({
        isCurrent: false,
        endDate: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    await owner
      .patch('/experience/experience-1')
      .send({ isCurrent: true })
      .expect(400);

    expect(prisma.experience.update).not.toHaveBeenCalled();
  });

  it('only exposes published public entries and requests the public order', async () => {
    prisma.experience.findMany.mockResolvedValue([
      experience({ isPublic: true }),
      experience({
        id: 'experience-2',
        company: 'Public Role',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        isPublic: true,
      }),
    ]);

    const response = await request(app.getHttpServer())
      .get('/public/experience')
      .expect(200);

    expect(response.body).toHaveLength(2);
    const body = response.body as ExperienceResponse[];

    expect(body[0]).toMatchObject({ isPublic: true });
    expect(prisma.experience.findMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: [
        { displayOrder: 'asc' },
        { startDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: experienceSelect,
    });
  });
});
