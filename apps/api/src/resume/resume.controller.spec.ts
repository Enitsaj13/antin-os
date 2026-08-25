import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import { ResumeModule } from './resume.module';
import { RESUME_STORAGE } from './storage/resume-storage';
import type { ResumeStorage } from './storage/resume-storage';
import { RESUME_SINGLETON_KEY } from './resume.constants';
import type { ResumeRecord } from './resume-response';

type MockPrismaService = {
  resume: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    resume: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function createMockStorage(): jest.Mocked<ResumeStorage> {
  return {
    upload: jest.fn(),
    delete: jest.fn(),
    download: jest.fn(),
  };
}

const now = new Date('2026-08-25T12:00:00.000Z');
const validPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF',
);
const corruptedPdf = Buffer.from('%PDF-1.4\nnot complete');

function resume(overrides: Partial<ResumeRecord> = {}): ResumeRecord {
  return {
    id: 'resume-1',
    singletonKey: RESUME_SINGLETON_KEY,
    originalFilename: 'Jastine-CV.pdf',
    fileSize: validPdf.length,
    contentType: 'application/pdf',
    objectKey: 'resumes/current.pdf',
    isPublic: false,
    uploadedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('ResumeController', () => {
  let app: INestApplication<App>;
  let prisma: MockPrismaService;
  let storage: jest.Mocked<ResumeStorage>;
  let owner: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'test-session-secret';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '5';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.RESUME_MAX_UPLOAD_BYTES = '5242880';

    prisma = createMockPrisma();
    storage = createMockStorage();
    storage.upload.mockResolvedValue({ key: 'resumes/new.pdf' });
    storage.delete.mockResolvedValue(undefined);
    storage.download.mockResolvedValue({
      body: validPdf,
      contentType: 'application/pdf',
      contentLength: validPdf.length,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ResumeModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(RESUME_STORAGE)
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

  it('rejects unauthenticated resume management without mutating state', async () => {
    await request(app.getHttpServer()).get('/resume').expect(401);
    await request(app.getHttpServer())
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'Jastine-CV.pdf',
        contentType: 'application/pdf',
      })
      .expect(401);
    await request(app.getHttpServer())
      .patch('/resume/publication')
      .send({ isPublic: true })
      .expect(401);
    await request(app.getHttpServer()).delete('/resume').expect(401);

    expect(prisma.resume.upsert).not.toHaveBeenCalled();
    expect(prisma.resume.update).not.toHaveBeenCalled();
    expect(prisma.resume.delete).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('uploads, replaces as unpublished, publishes, unpublishes, and removes the singleton resume', async () => {
    prisma.resume.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(resume({ objectKey: 'resumes/old.pdf' }))
      .mockResolvedValueOnce(resume())
      .mockResolvedValueOnce(resume({ isPublic: true }))
      .mockResolvedValueOnce(resume());
    prisma.resume.upsert
      .mockResolvedValueOnce(resume({ objectKey: 'resumes/new.pdf' }))
      .mockResolvedValueOnce(resume({ objectKey: 'resumes/newer.pdf' }));
    prisma.resume.update
      .mockResolvedValueOnce(resume({ isPublic: true }))
      .mockResolvedValueOnce(resume({ isPublic: false }));
    prisma.resume.delete.mockResolvedValue(resume());

    const upload = await owner
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'Jastine-CV.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(upload.body).toMatchObject({
      originalFilename: 'Jastine-CV.pdf',
      contentType: 'application/pdf',
      isPublic: false,
    });
    expect(upload.body.objectKey).toBeUndefined();
    expect(prisma.resume.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { singletonKey: RESUME_SINGLETON_KEY },
        create: expect.objectContaining({ isPublic: false }) as unknown,
        update: expect.objectContaining({ isPublic: false }) as unknown,
      }),
    );

    await owner
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'Replacement.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    expect(storage.delete).toHaveBeenCalledWith('resumes/old.pdf');

    const published = await owner
      .patch('/resume/publication')
      .send({ isPublic: true })
      .expect(200);
    expect(published.body.isPublic).toBe(true);

    const unpublished = await owner
      .patch('/resume/publication')
      .send({ isPublic: false })
      .expect(200);
    expect(unpublished.body.isPublic).toBe(false);

    const removed = await owner.delete('/resume').expect(200);
    expect(removed.body.originalFilename).toBe('Jastine-CV.pdf');
    expect(storage.delete).toHaveBeenCalledWith('resumes/current.pdf');
  });

  it('rejects invalid resume uploads', async () => {
    await owner.post('/resume').expect(400);
    await owner
      .post('/resume')
      .attach('file', Buffer.alloc(0), {
        filename: 'empty.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    await owner
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'resume.txt',
        contentType: 'text/plain',
      })
      .expect(415);
    await owner
      .post('/resume')
      .attach('file', Buffer.from('not a pdf'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      })
      .expect(415);
    await owner
      .post('/resume')
      .attach('file', corruptedPdf, {
        filename: 'corrupted.pdf',
        contentType: 'application/pdf',
      })
      .expect(415);

    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('rejects oversized resume uploads', async () => {
    const oversizedPdf = Buffer.concat([
      Buffer.from('%PDF-1.4\n'),
      Buffer.alloc(5 * 1024 * 1024, 1),
      Buffer.from('\n%%EOF'),
    ]);

    await owner
      .post('/resume')
      .attach('file', oversizedPdf, {
        filename: 'large.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
  });

  it('exposes public metadata and download only when published', async () => {
    prisma.resume.findUnique
      .mockResolvedValueOnce(resume({ isPublic: false }))
      .mockResolvedValueOnce(resume({ isPublic: false }))
      .mockResolvedValueOnce(resume({ isPublic: true }))
      .mockResolvedValueOnce(resume({ isPublic: true }));

    await request(app.getHttpServer()).get('/public/resume').expect(404);
    await request(app.getHttpServer())
      .get('/public/resume/download')
      .expect(404);

    const metadata = await request(app.getHttpServer())
      .get('/public/resume')
      .expect(200);
    expect(metadata.body).toMatchObject({
      originalFilename: 'Jastine-CV.pdf',
      isPublic: true,
      downloadUrl: '/public/resume/download',
    });
    expect(metadata.body.objectKey).toBeUndefined();

    const download = await request(app.getHttpServer())
      .get('/public/resume/download')
      .expect(200);
    expect(download.headers['content-type']).toContain('application/pdf');
    expect(download.headers['content-disposition']).toBe(
      'attachment; filename="Jastine-Formentera-CV.pdf"',
    );
    expect(download.headers['content-length']).toBe(String(validPdf.length));
  });

  it('preserves existing resume and cleans up new objects when replacement fails', async () => {
    prisma.resume.findUnique.mockResolvedValue(
      resume({ objectKey: 'resumes/old.pdf' }),
    );
    prisma.resume.upsert.mockRejectedValue(new Error('database failed'));

    await owner
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'replacement.pdf',
        contentType: 'application/pdf',
      })
      .expect(500);

    expect(storage.delete).toHaveBeenCalledWith('resumes/new.pdf');
    expect(storage.delete).not.toHaveBeenCalledWith('resumes/old.pdf');
  });

  it('preserves new resume metadata when previous object cleanup fails', async () => {
    prisma.resume.findUnique.mockResolvedValue(
      resume({ objectKey: 'resumes/old.pdf' }),
    );
    prisma.resume.upsert.mockResolvedValue(
      resume({ objectKey: 'resumes/new.pdf' }),
    );
    storage.delete.mockRejectedValueOnce(new Error('cleanup failed'));

    const response = await owner
      .post('/resume')
      .attach('file', validPdf, {
        filename: 'replacement.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);

    expect(response.body.originalFilename).toBe('Jastine-CV.pdf');
    expect(storage.delete).toHaveBeenCalledWith('resumes/old.pdf');
  });
});
