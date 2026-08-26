import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { App } from 'supertest/types';
import request from 'supertest';
import sharp from 'sharp';
import { configureApp } from '@src/app.setup';
import { createPasswordHash } from '@src/auth/password-hash';
import { ProfileModule } from './profile.module';
import { PROFILE_PICTURE_STORAGE } from './storage/profile-picture-storage';
import type { ProfilePictureStorage } from './storage/profile-picture-storage';
import { PROFILE_SINGLETON_KEY } from './profile.constants';
import type { ProfileRecord, ProfileResponse } from './profile-response';

type MockPrismaService = {
  profile: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
  };
};

function createMockPrisma(): MockPrismaService {
  return {
    profile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createMockStorage(): jest.Mocked<ProfilePictureStorage> {
  return {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
  };
}

const now = new Date('2026-08-13T00:00:00.000Z');

function profile(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  return {
    id: 'profile-1',
    fullName: 'Antin',
    headline: 'Developer',
    biography: 'Building AntinOS',
    location: 'Manila',
    email: 'antin@example.com',
    githubUrl: 'https://github.com/antin',
    linkedinUrl: 'https://linkedin.com/in/antin',
    profilePictureKey: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const validProfileRequest = {
  fullName: ' Antin ',
  headline: ' Developer ',
  biography: ' Building AntinOS ',
  location: ' Manila ',
  email: 'antin@example.com',
  githubUrl: 'https://github.com/antin',
  linkedinUrl: 'https://linkedin.com/in/antin',
};

describe('ProfileController', () => {
  let app: INestApplication<App>;
  let prisma: MockPrismaService;
  let storage: jest.Mocked<ProfilePictureStorage>;
  let owner: ReturnType<typeof request.agent>;
  let jpeg: Buffer;
  let png: Buffer;
  let webp: Buffer;
  let nonSquare: Buffer;

  beforeAll(async () => {
    jpeg = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: '#0f766e',
      },
    })
      .jpeg()
      .toBuffer();
    png = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: '#2563eb',
      },
    })
      .png()
      .toBuffer();
    webp = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 3,
        background: '#7c2d12',
      },
    })
      .webp()
      .toBuffer();
    nonSquare = await sharp({
      create: {
        width: 512,
        height: 256,
        channels: 3,
        background: '#b42318',
      },
    })
      .png()
      .toBuffer();
  });

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'test-session-secret';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '5';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';

    prisma = createMockPrisma();
    storage = createMockStorage();
    storage.upload.mockResolvedValue({ key: 'profile-pictures/new.webp' });
    storage.getUrl.mockResolvedValue('https://signed.example.com/picture.webp');
    storage.delete.mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProfileModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(PROFILE_PICTURE_STORAGE)
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

  it('rejects unauthenticated profile management without mutating state', async () => {
    await request(app.getHttpServer()).get('/profile').expect(401);
    await request(app.getHttpServer())
      .put('/profile')
      .send(validProfileRequest)
      .expect(401);
    await request(app.getHttpServer())
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(401);
    await request(app.getHttpServer()).delete('/profile/picture').expect(401);

    expect(prisma.profile.upsert).not.toHaveBeenCalled();
    expect(prisma.profile.update).not.toHaveBeenCalled();
    expect(storage.upload.mock.calls).toHaveLength(0);
    expect(storage.delete.mock.calls).toHaveLength(0);
  });

  it('creates and updates the singleton profile', async () => {
    prisma.profile.upsert.mockResolvedValue(profile());

    const first = await owner
      .put('/profile')
      .send(validProfileRequest)
      .expect(200);
    await owner.put('/profile').send(validProfileRequest).expect(200);

    const firstBody = first.body as ProfileResponse;

    expect(firstBody).toMatchObject({
      fullName: 'Antin',
      headline: 'Developer',
      profilePictureUrl: null,
    });
    expect(prisma.profile.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { singletonKey: PROFILE_SINGLETON_KEY },
        create: expect.objectContaining({
          singletonKey: PROFILE_SINGLETON_KEY,
        }) as unknown,
      }),
    );
  });

  it('rejects invalid profile fields', async () => {
    await owner.put('/profile').send({}).expect(400);
    await owner
      .put('/profile')
      .send({ ...validProfileRequest, fullName: '   ' })
      .expect(400);
    await owner
      .put('/profile')
      .send({ ...validProfileRequest, email: 'not-email' })
      .expect(400);
    await owner
      .put('/profile')
      .send({ ...validProfileRequest, githubUrl: 'not-url' })
      .expect(400);
  });

  it('returns not found before a profile exists', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await owner.get('/profile').expect(404);
    await request(app.getHttpServer()).get('/public/profile').expect(404);
  });

  it('returns managed and public profile responses with generated picture URLs', async () => {
    prisma.profile.findUnique.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/current.webp' }),
    );

    const managed = await owner.get('/profile').expect(200);
    const publicProfile = await request(app.getHttpServer())
      .get('/public/profile')
      .expect(200);

    const managedBody = managed.body as ProfileResponse;
    const publicBody = publicProfile.body as ProfileResponse;

    expect(managedBody.profilePictureUrl).toBe(
      'https://signed.example.com/picture.webp',
    );
    expect(publicBody.profilePictureUrl).toBe(
      'https://signed.example.com/picture.webp',
    );
  });

  it.each([
    ['jpeg', 'picture.jpg', () => jpeg],
    ['png', 'picture.png', () => png],
    ['webp', 'picture.webp', () => webp],
  ])(
    'accepts %s profile-picture uploads',
    async (_name, filename, getBuffer) => {
      prisma.profile.findUnique.mockResolvedValue(profile());
      prisma.profile.update.mockResolvedValue(
        profile({ profilePictureKey: 'profile-pictures/new.webp' }),
      );

      await owner
        .post('/profile/picture')
        .attach('file', getBuffer(), filename)
        .expect(201);

      expect(storage.upload.mock.calls).toEqual(
        expect.arrayContaining([
          [
            expect.objectContaining({
              contentType: 'image/webp',
            }) as unknown,
          ],
        ]),
      );
    },
  );

  it('rejects invalid image content, unsupported formats, empty files, oversized files, and non-square output', async () => {
    prisma.profile.findUnique.mockResolvedValue(profile());

    await owner
      .post('/profile/picture')
      .attach('file', Buffer.from('not-an-image'), 'fake.jpg')
      .expect(415);

    await owner
      .post('/profile/picture')
      .attach('file', Buffer.from('GIF89a'), 'fake.gif')
      .expect(415);

    await owner
      .post('/profile/picture')
      .attach('file', Buffer.alloc(0), 'empty.png')
      .expect(400);

    await owner
      .post('/profile/picture')
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), 'large.png')
      .expect(413);

    await owner
      .post('/profile/picture')
      .attach('file', nonSquare, 'wide.png')
      .expect(400);
  });

  it('uploads a picture and returns a generated response URL', async () => {
    prisma.profile.findUnique.mockResolvedValue(profile());
    prisma.profile.update.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/new.webp' }),
    );

    const response = await owner
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(201);

    const body = response.body as ProfileResponse & {
      profilePictureKey?: string;
    };

    expect(body.profilePictureUrl).toBe(
      'https://signed.example.com/picture.webp',
    );
    expect(body.profilePictureKey).toBeUndefined();
  });

  it('returns not found from picture upload when no profile exists', async () => {
    prisma.profile.findUnique.mockResolvedValue(null);

    await owner
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(404);

    expect(storage.upload.mock.calls).toHaveLength(0);
  });

  it('replaces a picture and deletes the previous object after database update', async () => {
    prisma.profile.findUnique.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/old.webp' }),
    );
    prisma.profile.update.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/new.webp' }),
    );

    await owner
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(201);

    expect(storage.delete.mock.calls).toContainEqual([
      'profile-pictures/old.webp',
    ]);
  });

  it('cleans up the new object when the database update fails', async () => {
    prisma.profile.findUnique.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/old.webp' }),
    );
    prisma.profile.update.mockRejectedValue(new Error('database failed'));

    await owner
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(500);

    expect(storage.delete.mock.calls).toContainEqual([
      'profile-pictures/new.webp',
    ]);
  });

  it('preserves the new picture when previous-object deletion fails after replacement', async () => {
    prisma.profile.findUnique.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/old.webp' }),
    );
    prisma.profile.update.mockResolvedValue(
      profile({ profilePictureKey: 'profile-pictures/new.webp' }),
    );
    storage.delete.mockRejectedValueOnce(new Error('cleanup failed'));

    await owner
      .post('/profile/picture')
      .attach('file', jpeg, 'picture.jpg')
      .expect(201);
  });

  it('removes profile pictures and handles no-profile and no-picture removal', async () => {
    prisma.profile.findUnique.mockResolvedValueOnce(
      profile({ profilePictureKey: 'profile-pictures/current.webp' }),
    );
    prisma.profile.update.mockResolvedValueOnce(
      profile({ profilePictureKey: null }),
    );

    await owner.delete('/profile/picture').expect(200);
    expect(storage.delete.mock.calls).toContainEqual([
      'profile-pictures/current.webp',
    ]);

    prisma.profile.findUnique.mockResolvedValueOnce(null);
    await owner.delete('/profile/picture').expect(404);

    prisma.profile.findUnique.mockResolvedValueOnce(
      profile({ profilePictureKey: null }),
    );
    const response = await owner.delete('/profile/picture').expect(200);
    const body = response.body as ProfileResponse;
    expect(body.profilePictureUrl).toBeNull();
  });
});
