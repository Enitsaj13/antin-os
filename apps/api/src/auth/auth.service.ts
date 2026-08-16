import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AdminSessionResponse } from '@antin-os/shared';
import { AuthConfig, getAuthConfig } from './auth.config';
import { verifyPasswordHash } from './password-hash';
import { createSessionToken, verifySessionToken } from './session-token';

type LoginAttempt = {
  count: number;
  resetAt: number;
};

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, LoginAttempt>();
  private config?: AuthConfig;

  getConfig(): AuthConfig {
    this.config ??= getAuthConfig();
    return this.config;
  }

  login(input: { username: string; password: string; ip?: string }) {
    const config = this.getConfig();
    const rateLimitKey = `${input.ip ?? 'unknown'}:${input.username.toLowerCase()}`;

    this.assertWithinRateLimit(rateLimitKey, config);

    if (
      input.username !== config.adminUsername ||
      !verifyPasswordHash(input.password, config.adminPasswordHash)
    ) {
      this.recordFailedAttempt(rateLimitKey, config);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    this.attempts.delete(rateLimitKey);

    const exp = Math.floor(Date.now() / 1000) + config.sessionTtlSeconds;

    return {
      token: createSessionToken(
        {
          sub: config.adminUsername,
          exp,
        },
        config.sessionSecret,
      ),
      session: this.toSessionResponse(config.adminUsername),
    };
  }

  restore(token: string | undefined): AdminSessionResponse {
    const config = this.getConfig();
    const claims = verifySessionToken(token, config.sessionSecret);

    if (!claims || claims.sub !== config.adminUsername) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return this.toSessionResponse(claims.sub);
  }

  requireSession(token: string | undefined): AdminSessionResponse {
    const session = this.restore(token);

    if (!session.authenticated) {
      throw new UnauthorizedException('Authentication required');
    }

    return session;
  }

  private toSessionResponse(username: string): AdminSessionResponse {
    return {
      authenticated: true,
      user: { username },
    };
  }

  private assertWithinRateLimit(key: string, config: AuthConfig) {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || attempt.resetAt <= now) {
      return;
    }

    if (attempt.count >= config.loginRateLimitMax) {
      throw new HttpException(
        'Too many login attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailedAttempt(key: string, config: AuthConfig) {
    const now = Date.now();
    const existing = this.attempts.get(key);

    if (!existing || existing.resetAt <= now) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + config.loginRateLimitWindowSeconds * 1000,
      });
      return;
    }

    existing.count += 1;
  }
}
