import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import { projectSelect } from './project-response';
import { ProjectsModule } from './projects.module';
import {
  PROJECT_IMAGE_STORAGE,
  ProjectImageStorage,
} from './storage/project-image-storage';

type MockPrismaService = {
  project: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type MockProjectImageStorage = {
  [Key in keyof ProjectImageStorage]: jest.Mock;
};

function createMockPrisma(): MockPrismaService {
  return {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ProjectsController', () => {
  let app: INestApplication<App>;
  let prisma: MockPrismaService;
  let storage: MockProjectImageStorage;
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
    storage.getUrl.mockResolvedValue('https://cdn.example.com/project.png');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(PROJECT_IMAGE_STORAGE)
      .useValue(storage)
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

    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(prisma.project.delete).not.toHaveBeenCalled();
    expect(storage.createUpload).not.toHaveBeenCalled();
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
      },
      select: projectSelect,
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
    expect(prisma.project.findMany).toHaveBeenCalledTimes(1);
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
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true } }),
    );
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
});
