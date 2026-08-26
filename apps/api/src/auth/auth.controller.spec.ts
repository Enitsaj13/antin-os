import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import request from 'supertest';
import { configureApp } from '@src/app.setup';
import { AuthModule } from './auth.module';
import { createPasswordHash } from './password-hash';

describe('AuthController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'owner';
    process.env.ADMIN_PASSWORD_HASH = createPasswordHash('correct-password');
    process.env.AUTH_SESSION_SECRET = 'test-session-secret';
    process.env.AUTH_SESSION_TTL_SECONDS = '3600';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '300';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('logs in, restores the existing session, and logs out', async () => {
    const owner = request.agent(app.getHttpServer());

    const login = await owner
      .post('/auth/login')
      .send({ username: 'owner', password: 'correct-password' })
      .expect(201);

    expect(login.headers['set-cookie']?.[0]).toContain(
      'antin_os_admin_session',
    );
    expect(login.body).toMatchObject({
      authenticated: true,
      user: { username: 'owner' },
    });

    await owner
      .get('/auth/session')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          authenticated: true,
          user: { username: 'owner' },
        });
      });

    const logout = await owner.post('/auth/logout').expect(201);
    expect(logout.headers['set-cookie']?.[0]).toContain(
      'antin_os_admin_session=;',
    );

    await owner
      .get('/auth/session')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          authenticated: false,
          user: null,
        });
      });
  });

  it('returns unauthenticated session without a valid cookie', async () => {
    await request(app.getHttpServer())
      .get('/auth/session')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          authenticated: false,
          user: null,
        });
      });
  });

  it('uses safe invalid-credential responses and rate limits failures', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'missing', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect((body as { message: string }).message).toBe(
          'Invalid credentials',
        );
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'owner', password: 'wrong-password' })
      .expect(401)
      .expect(({ body }) => {
        expect((body as { message: string }).message).toBe(
          'Invalid credentials',
        );
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'owner', password: 'wrong-password' })
      .expect(429);
  });
});
