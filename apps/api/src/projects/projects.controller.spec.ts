import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import type { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import { CASE_STUDY_DRAFT_CONFIG } from './case-study-draft/case-study-draft.config';
import type { CaseStudyDraftConfig } from './case-study-draft/case-study-draft.config';
import {
  CASE_STUDY_DRAFT_PROVIDER,
  CaseStudyDraftProviderError,
} from './case-study-draft/case-study-draft.provider';
import type {
  CaseStudyDraftProvider,
  CaseStudyDraftProviderInput,
} from './case-study-draft/case-study-draft.provider';
import { projectCaseStudySelect, projectSelect } from './project-response';
import { ProjectsModule } from './projects.module';
import {
  PROJECT_IMAGE_STORAGE,
  ProjectImageStorage,
} from './storage/project-image-storage';

type MockPrismaService = {
  $transaction: jest.Mock;
  project: {
    aggregate: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  projectCaseStudy: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type MockProjectImageStorage = {
  [Key in keyof ProjectImageStorage]: jest.Mock;
};

type MockCaseStudyDraftProvider = {
  [Key in keyof CaseStudyDraftProvider]: jest.Mock;
};

function createMockPrisma(): MockPrismaService {
  return {
    $transaction: jest.fn(),
    project: {
      aggregate: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectCaseStudy: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function createMockProjectImageStorage(): MockProjectImageStorage {
  return {
    createUpload: jest.fn(),
    getUrl: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockCaseStudyDraftProvider(): MockCaseStudyDraftProvider {
  return {
    generate: jest.fn(),
  };
}

function createDraftConfig(): CaseStudyDraftConfig {
  return {
    enabled: true,
    provider: 'mock',
    timeoutMs: 30_000,
    rateLimit: { max: 100, windowSeconds: 60 },
    usageLimit: { max: 100, windowSeconds: 60 },
    maxNotesLength: 2_000,
    maxOutputTokens: 1_200,
    errors: [],
  };
}

const now = new Date('2026-08-13T00:00:00.000Z');

function project(overrides = {}) {
  return {
    id: 'project-1',
    title: 'Antin OS',
    slug: 'antin-os',
    summary: 'Career operating system',
    description: 'A portfolio project',
    techStack: ['NestJS', 'Prisma'],
    repoUrl: 'https://github.com/example/antin-os',
    liveUrl: 'https://antin.example.com',
    imageUrl: 'https://antin.example.com/image.png',
    imageKey: null,
    isPublic: true,
    displayOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function caseStudy(overrides = {}) {
  return {
    id: 'case-study-1',
    projectId: 'project-1',
    context: 'Portfolio context',
    problem: 'Recruiters need project depth.',
    role: 'Full-stack developer',
    approach: 'Built scoped admin and public APIs.',
    responsibilities: ['Designed schema', 'Built UI'],
    technicalChallenges: ['Preventing draft exposure'],
    outcomes: ['Published a recruiter-friendly case study'],
    lessonsLearned: 'Keep content structured.',
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function caseStudyDraft(overrides = {}) {
  return {
    context: 'Generated context',
    problem: 'Generated problem',
    role: 'Generated role',
    approach: 'Generated approach',
    responsibilities: ['Generated responsibility'],
    technicalChallenges: ['Generated challenge'],
    outcomes: ['Generated outcome'],
    lessonsLearned: 'Generated lesson',
    needsConfirmation: ['Confirm generated claims'],
    ...overrides,
  };
}

describe('ProjectsController', () => {
  let app: INestApplication<App>;
  let prisma: MockPrismaService;
  let storage: MockProjectImageStorage;
  let draftProvider: MockCaseStudyDraftProvider;
  let draftConfig: CaseStudyDraftConfig;
  let owner: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'test-session-secret';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '5';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';

    prisma = createMockPrisma();
    storage = createMockProjectImageStorage();
    draftProvider = createMockCaseStudyDraftProvider();
    draftConfig = createDraftConfig();
    storage.getUrl.mockResolvedValue('https://cdn.example.com/project.png');
    draftProvider.generate.mockResolvedValue(caseStudyDraft());
    prisma.project.aggregate.mockResolvedValue({
      _max: { displayOrder: 0 },
    });
    prisma.$transaction.mockResolvedValue([]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(PROJECT_IMAGE_STORAGE)
      .useValue(storage)
      .overrideProvider(CASE_STUDY_DRAFT_PROVIDER)
      .useValue(draftProvider)
      .overrideProvider(CASE_STUDY_DRAFT_CONFIG)
      .useValue(draftConfig)
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

  it('rejects unauthenticated project management without mutating state', async () => {
    await request(app.getHttpServer()).post('/projects').send({}).expect(401);
    await request(app.getHttpServer()).get('/projects').expect(401);
    await request(app.getHttpServer())
      .patch('/projects/reorder')
      .send({ items: [{ id: 'project-1', displayOrder: 0 }] })
      .expect(401);
    await request(app.getHttpServer()).get('/projects/antin-os').expect(401);
    await request(app.getHttpServer())
      .patch('/projects/project-1')
      .send({ title: 'Updated' })
      .expect(401);
    await request(app.getHttpServer())
      .delete('/projects/project-1')
      .expect(401);
    await request(app.getHttpServer())
      .post('/projects/image-upload')
      .send({
        fileName: 'project.png',
        contentType: 'image/png',
        size: 1024,
      })
      .expect(401);
    await request(app.getHttpServer())
      .get('/projects/project-1/case-study')
      .expect(401);
    await request(app.getHttpServer())
      .post('/projects/project-1/case-study')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .patch('/projects/project-1/case-study')
      .send({ context: 'Updated' })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/projects/project-1/case-study/publication')
      .send({ isPublic: true })
      .expect(401);
    await request(app.getHttpServer())
      .delete('/projects/project-1/case-study')
      .expect(401);

    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(prisma.project.delete).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.projectCaseStudy.create).not.toHaveBeenCalled();
    expect(prisma.projectCaseStudy.update).not.toHaveBeenCalled();
    expect(prisma.projectCaseStudy.delete).not.toHaveBeenCalled();
    expect(storage.createUpload).not.toHaveBeenCalled();
    expect(draftProvider.generate).not.toHaveBeenCalled();
  });

  it('creates a managed project and defaults isPublic to false when omitted', async () => {
    const created = project({ isPublic: false });
    prisma.project.create.mockResolvedValue(created);

    const response = await owner
      .post('/projects')
      .send({
        title: ' Antin OS ',
        slug: 'antin-os',
        summary: ' Career operating system ',
        techStack: [' NestJS ', 'Prisma'],
        repoUrl: 'https://github.com/example/antin-os',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 'project-1',
      title: 'Antin OS',
      slug: 'antin-os',
      summary: 'Career operating system',
      techStack: ['NestJS', 'Prisma'],
      isPublic: false,
    });

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        title: 'Antin OS',
        slug: 'antin-os',
        summary: 'Career operating system',
        description: undefined,
        techStack: ['NestJS', 'Prisma'],
        repoUrl: 'https://github.com/example/antin-os',
        liveUrl: undefined,
        imageUrl: undefined,
        imageKey: undefined,
        isPublic: false,
        displayOrder: 1,
      },
      select: projectSelect,
    });
    expect(prisma.project.aggregate).toHaveBeenCalledWith({
      _max: { displayOrder: true },
    });
  });

  it('lists managed projects regardless of publication state', async () => {
    const projects = [
      project({ isPublic: true }),
      project({ id: 'project-2', isPublic: false }),
    ];
    prisma.project.findMany.mockResolvedValue(projects);

    const response = await owner.get('/projects').expect(200);

    expect(response.body).toHaveLength(2);
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: projectSelect,
    });
  });

  it('reorders managed projects and returns the refreshed ordered list', async () => {
    const reorderedProjects = [
      project({ id: 'project-2', displayOrder: 0 }),
      project({ id: 'project-1', displayOrder: 1 }),
    ];
    prisma.project.findMany
      .mockResolvedValueOnce([{ id: 'project-1' }, { id: 'project-2' }])
      .mockResolvedValueOnce(reorderedProjects);
    prisma.project.update.mockReturnValue({});

    const response = await owner
      .patch('/projects/reorder')
      .send({
        items: [
          { id: 'project-2', displayOrder: 0 },
          { id: 'project-1', displayOrder: 1 },
        ],
      })
      .expect(200);

    const responseBody = response.body as Array<{ id: string }>;

    expect(responseBody.map((item) => item.id)).toEqual([
      'project-2',
      'project-1',
    ]);
    expect(prisma.project.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['project-2', 'project-1'] } },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'project-2' },
      data: { displayOrder: 0 },
      select: { id: true },
    });
  });

  it('reads a managed project by id or slug', async () => {
    prisma.project.findFirst.mockResolvedValue(project());

    await owner.get('/projects/antin-os').expect(200);

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ id: 'antin-os' }, { slug: 'antin-os' }] },
      }),
    );
  });

  it('updates editable project fields', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.project.update.mockResolvedValue(project({ title: 'Updated' }));

    await owner
      .patch('/projects/project-1')
      .send({ title: ' Updated ' })
      .expect(200);

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'project-1' },
        data: { title: 'Updated' },
      }),
    );
  });

  it('creates project image uploads with storage keys and presigned URLs', async () => {
    storage.createUpload.mockResolvedValue({
      key: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
      uploadUrl: 'https://s3.example.com/upload',
      imageUrl: 'https://cdn.example.com/project.png',
    });

    const response = await owner
      .post('/projects/image-upload')
      .send({
        fileName: 'project.png',
        contentType: 'image/png',
        size: 1024,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      key: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
      uploadUrl: 'https://s3.example.com/upload',
      imageUrl: 'https://cdn.example.com/project.png',
    });
    expect(storage.createUpload).toHaveBeenCalledWith({
      fileName: 'project.png',
      contentType: 'image/png',
    });
  });

  it('deletes an existing project', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.project.delete.mockResolvedValue(project());

    await owner.delete('/projects/project-1').expect(200);

    expect(prisma.project.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'project-1' } }),
    );
  });

  it('rejects invalid project create and update payloads', async () => {
    await owner.post('/projects').send({}).expect(400);

    await owner
      .post('/projects')
      .send({
        title: '   ',
        slug: 'bad slug',
        summary: 'Summary',
        techStack: ['NestJS'],
      })
      .expect(400);

    await owner
      .post('/projects')
      .send({
        title: 'Project',
        slug: 'project',
        summary: 'Summary',
        techStack: ['NestJS'],
        repoUrl: 'not-a-url',
      })
      .expect(400);

    await owner
      .post('/projects')
      .send({
        title: 'Project',
        slug: 'project',
        summary: 'Summary',
        techStack: ['NestJS', '   '],
      })
      .expect(400);

    await owner.patch('/projects/project-1').send({}).expect(400);

    await owner.patch('/projects/project-1').send({ title: null }).expect(400);

    await owner
      .post('/projects/image-upload')
      .send({
        fileName: 'project.svg',
        contentType: 'image/svg+xml',
        size: 1024,
      })
      .expect(400);

    await owner
      .post('/projects/image-upload')
      .send({
        fileName: 'project.png',
        contentType: 'image/png',
        size: 6 * 1024 * 1024,
      })
      .expect(400);
  });

  it('maps duplicate slug conflicts, including Prisma P2002, to HTTP 409', async () => {
    prisma.project.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['slug'] },
      }),
    );

    await owner
      .post('/projects')
      .send({
        title: 'Project',
        slug: 'project',
        summary: 'Summary',
        techStack: ['NestJS'],
      })
      .expect(409);
  });

  it('clears nullable optional fields with explicit null', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.project.update.mockResolvedValue(
      project({
        description: null,
        repoUrl: null,
        liveUrl: null,
        imageUrl: null,
        imageKey: null,
      }),
    );

    const response = await owner
      .patch('/projects/project-1')
      .send({
        description: null,
        repoUrl: null,
        liveUrl: null,
        imageUrl: null,
        imageKey: null,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      description: null,
      repoUrl: null,
      liveUrl: null,
      imageUrl: null,
      imageKey: null,
    });
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          description: null,
          repoUrl: null,
          liveUrl: null,
          imageUrl: null,
          imageKey: null,
        },
      }),
    );
  });

  it('resolves stored project image keys to response image URLs', async () => {
    prisma.project.findFirst.mockResolvedValue(
      project({
        imageUrl: null,
        imageKey: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
      }),
    );

    const response = await owner.get('/projects/antin-os').expect(200);

    expect(response.body).toMatchObject({
      imageKey: 'project-images/123e4567-e89b-12d3-a456-426614174000.png',
      imageUrl: 'https://cdn.example.com/project.png',
    });
    expect(storage.getUrl).toHaveBeenCalledWith(
      'project-images/123e4567-e89b-12d3-a456-426614174000.png',
    );
  });

  it('only exposes public projects on public routes', async () => {
    prisma.project.findMany.mockResolvedValue([project({ isPublic: true })]);
    prisma.project.findFirst.mockResolvedValue(project({ isPublic: true }));

    const listResponse = await request(app.getHttpServer())
      .get('/public/projects')
      .expect(200);
    const detailResponse = await request(app.getHttpServer())
      .get('/public/projects/antin-os')
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(detailResponse.body).toMatchObject({
      slug: 'antin-os',
      isPublic: true,
    });
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { isPublic: true },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: projectSelect,
    });
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'antin-os', isPublic: true },
      }),
    );
  });

  it('returns not found for missing managed and public projects', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await owner.get('/projects/missing').expect(404);
    await request(app.getHttpServer())
      .get('/public/projects/missing')
      .expect(404);
  });

  it('creates draft case studies with ordered repeatable fields', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.projectCaseStudy.create.mockResolvedValue(
      caseStudy({
        responsibilities: ['First', 'Second'],
        technicalChallenges: ['Challenge A', 'Challenge B'],
        outcomes: ['Outcome A', 'Outcome B'],
      }),
    );

    const response = await owner
      .post('/projects/project-1/case-study')
      .send({
        context: ' Context ',
        problem: ' Problem ',
        role: ' Role ',
        approach: ' Approach ',
        responsibilities: [' First ', ' Second '],
        technicalChallenges: [' Challenge A ', ' Challenge B '],
        outcomes: [' Outcome A ', ' Outcome B '],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      projectId: 'project-1',
      isPublic: false,
      responsibilities: ['First', 'Second'],
      technicalChallenges: ['Challenge A', 'Challenge B'],
      outcomes: ['Outcome A', 'Outcome B'],
    });
    expect(prisma.projectCaseStudy.create).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        context: 'Context',
        problem: 'Problem',
        role: 'Role',
        approach: 'Approach',
        responsibilities: ['First', 'Second'],
        technicalChallenges: ['Challenge A', 'Challenge B'],
        outcomes: ['Outcome A', 'Outcome B'],
        lessonsLearned: null,
        isPublic: false,
      },
      select: projectCaseStudySelect,
    });
  });

  it('reads, edits, publishes, unpublishes, and removes a case study', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.projectCaseStudy.findUnique.mockResolvedValue(caseStudy());
    prisma.projectCaseStudy.update.mockResolvedValue(
      caseStudy({
        context: 'Updated context',
        responsibilities: ['Second', 'First'],
        lessonsLearned: null,
        isPublic: true,
      }),
    );
    prisma.projectCaseStudy.delete.mockResolvedValue(caseStudy());

    await owner.get('/projects/project-1/case-study').expect(200);
    await owner
      .patch('/projects/project-1/case-study')
      .send({
        context: ' Updated context ',
        responsibilities: [' Second ', ' First '],
        lessonsLearned: null,
      })
      .expect(200);
    await owner
      .patch('/projects/project-1/case-study/publication')
      .send({ isPublic: true })
      .expect(200);
    await owner.delete('/projects/project-1/case-study').expect(200);

    expect(prisma.projectCaseStudy.findUnique).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      select: projectCaseStudySelect,
    });
    expect(prisma.projectCaseStudy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'project-1' },
        data: {
          context: 'Updated context',
          responsibilities: ['Second', 'First'],
          lessonsLearned: null,
        },
      }),
    );
    expect(prisma.projectCaseStudy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPublic: true },
      }),
    );
    expect(prisma.projectCaseStudy.delete).toHaveBeenCalledWith({
      where: { projectId: 'project-1' },
      select: projectCaseStudySelect,
    });
  });

  it('rejects invalid, empty, duplicate, and missing-project case-study operations', async () => {
    await owner.post('/projects/project-1/case-study').send({}).expect(400);
    await owner
      .post('/projects/project-1/case-study')
      .send({
        context: 'Context',
        problem: 'Problem',
        role: 'Role',
        approach: 'Approach',
        responsibilities: ['   '],
      })
      .expect(400);

    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    await owner.patch('/projects/project-1/case-study').send({}).expect(400);
    await owner
      .patch('/projects/project-1/case-study/publication')
      .send({})
      .expect(400);

    prisma.project.findUnique.mockResolvedValueOnce(null);
    await owner
      .post('/projects/missing-project/case-study')
      .send({
        context: 'Context',
        problem: 'Problem',
        role: 'Role',
        approach: 'Approach',
      })
      .expect(404);

    prisma.project.findUnique.mockResolvedValue({ id: 'project-1' });
    prisma.projectCaseStudy.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await owner
      .post('/projects/project-1/case-study')
      .send({
        context: 'Context',
        problem: 'Problem',
        role: 'Role',
        approach: 'Approach',
      })
      .expect(409);
  });

  it('generates an authenticated structured case-study draft without writing to the database', async () => {
    prisma.project.findUnique.mockResolvedValue(project());
    let generationInput: CaseStudyDraftProviderInput | null = null;
    draftProvider.generate.mockImplementation(
      (input: CaseStudyDraftProviderInput) => {
        generationInput = input;
        return Promise.resolve(
          caseStudyDraft({
            responsibilities: ['Generated first', 'Generated second'],
          }),
        );
      },
    );

    const response = await owner
      .post('/projects/project-1/case-study/draft')
      .send({ notes: ' Keep claims conservative. ' })
      .expect(201);

    expect(response.body).toMatchObject({
      draft: {
        context: 'Generated context',
        responsibilities: ['Generated first', 'Generated second'],
        needsConfirmation: ['Confirm generated claims'],
      },
    });
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        description: true,
        techStack: true,
        repoUrl: true,
        liveUrl: true,
        isPublic: true,
      },
    });
    expect(generationInput?.project).toMatchObject({
      id: 'project-1',
      title: 'Antin OS',
      techStack: ['NestJS', 'Prisma'],
    });
    expect(generationInput?.notes).toBe('Keep claims conservative.');
    expect(generationInput?.maxOutputTokens).toBe(1_200);
    expect(generationInput?.signal).toBeInstanceOf(AbortSignal);
    expect(prisma.projectCaseStudy.create).not.toHaveBeenCalled();
    expect(prisma.projectCaseStudy.update).not.toHaveBeenCalled();
    expect(prisma.projectCaseStudy.delete).not.toHaveBeenCalled();
  });

  it('rejects draft generation before provider execution for invalid input, missing project, and config failures', async () => {
    draftConfig.maxNotesLength = 5;
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({ notes: 'too long' })
      .expect(400);
    expect(draftProvider.generate).not.toHaveBeenCalled();

    draftConfig.maxNotesLength = 2_000;
    prisma.project.findUnique.mockResolvedValueOnce(null);
    await owner
      .post('/projects/missing-project/case-study/draft')
      .send({})
      .expect(404);
    expect(draftProvider.generate).not.toHaveBeenCalled();

    draftConfig.enabled = false;
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(503);
    expect(draftProvider.generate).not.toHaveBeenCalled();

    draftConfig.enabled = true;
    draftConfig.errors.push('OPENAI_MODEL is required');
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(503);
    expect(draftProvider.generate).not.toHaveBeenCalled();
  });

  it('enforces draft rate and usage limits before provider execution', async () => {
    prisma.project.findUnique.mockResolvedValue(project());
    draftConfig.rateLimit = { max: 1, windowSeconds: 60 };

    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(201);
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(429);
    expect(draftProvider.generate).toHaveBeenCalledTimes(1);
  });

  it('enforces draft usage limits before provider execution', async () => {
    prisma.project.findUnique.mockResolvedValue(project());
    draftConfig.rateLimit = { max: 10, windowSeconds: 60 };
    draftConfig.usageLimit = { max: 1, windowSeconds: 60 };

    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(201);
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(429);
    expect(draftProvider.generate).toHaveBeenCalledTimes(1);
  });

  it('maps draft provider timeout, malformed output, and provider failures to safe errors', async () => {
    prisma.project.findUnique.mockResolvedValue(project());

    draftProvider.generate.mockRejectedValueOnce(
      new CaseStudyDraftProviderError('timeout', 'raw timeout'),
    );
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(504);

    draftProvider.generate.mockRejectedValueOnce(
      new CaseStudyDraftProviderError('malformed', 'raw malformed output'),
    );
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(502);

    draftProvider.generate.mockRejectedValueOnce(
      new CaseStudyDraftProviderError('provider', 'raw provider failure'),
    );
    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(502);
  });

  it('does not expose generated draft content through public project APIs before manual save and publication', async () => {
    prisma.project.findUnique.mockResolvedValue(project());
    draftProvider.generate.mockResolvedValue(
      caseStudyDraft({ problem: 'Generated private problem' }),
    );

    await owner
      .post('/projects/project-1/case-study/draft')
      .send({})
      .expect(201);

    prisma.project.findFirst.mockResolvedValue(
      project({ isPublic: true, caseStudy: null }),
    );

    const response = await request(app.getHttpServer())
      .get('/public/projects/antin-os')
      .expect(200);

    expect(response.text).not.toContain('Generated private problem');
    expect(response.body).toMatchObject({ caseStudy: null });
  });

  it('exposes public case studies only when both project and case study are public', async () => {
    prisma.project.findFirst.mockResolvedValue(
      project({ isPublic: true, caseStudy: caseStudy({ isPublic: true }) }),
    );

    const publicResponse = await request(app.getHttpServer())
      .get('/public/projects/antin-os')
      .expect(200);
    const publicBody = publicResponse.body as {
      caseStudy: { problem: string; isPublic: boolean } | null;
    };

    expect(publicBody.caseStudy).toMatchObject({
      problem: 'Recruiters need project depth.',
      isPublic: true,
    });

    prisma.project.findFirst.mockResolvedValue(
      project({
        isPublic: true,
        caseStudy: caseStudy({
          problem: 'Draft-only problem',
          isPublic: false,
        }),
      }),
    );

    const draftResponse = await request(app.getHttpServer())
      .get('/public/projects/antin-os')
      .expect(200);
    const draftBody = draftResponse.body as { caseStudy: unknown };

    expect(draftBody.caseStudy).toBeNull();
    expect(JSON.stringify(draftResponse.body)).not.toContain(
      'Draft-only problem',
    );

    prisma.project.findFirst.mockResolvedValue(
      project({ isPublic: true, caseStudy: null }),
    );

    const noCaseStudyResponse = await request(app.getHttpServer())
      .get('/public/projects/antin-os')
      .expect(200);
    const noCaseStudyBody = noCaseStudyResponse.body as { caseStudy: unknown };

    expect(noCaseStudyBody.caseStudy).toBeNull();

    prisma.project.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/public/projects/private-project')
      .expect(404);
    expect(prisma.project.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { slug: 'private-project', isPublic: true },
      }),
    );
  });
});
