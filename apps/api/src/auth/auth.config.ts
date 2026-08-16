import { randomBytes } from 'node:crypto';

export const AUTH_COOKIE_NAME = 'antin_os_admin_session';

export type AuthConfig = {
  adminUsername: string;
  adminPasswordHash: string;
  sessionSecret: string;
  sessionTtlSeconds: number;
  cookieSecure: boolean;
  loginRateLimitMax: number;
  loginRateLimitWindowSeconds: number;
};

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireEnv(name: string): string {
  const value = optionalEnv(name);

  if (!value) {
    throw new Error(`${name} is required for admin authentication`);
  }

  return value;
}

function positiveIntegerEnv(name: string, fallback: number): number {
  const value = Number(optionalEnv(name) ?? fallback);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function booleanEnv(name: string, fallback: boolean): boolean {
  const value = optionalEnv(name);

  if (!value) {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true';
}

export function getAuthConfig(): AuthConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    adminUsername: optionalEnv('ADMIN_USERNAME') ?? requireEnv('ADMIN_EMAIL'),
    adminPasswordHash: requireEnv('ADMIN_PASSWORD_HASH'),
    sessionSecret: requireEnv('AUTH_SESSION_SECRET'),
    sessionTtlSeconds: positiveIntegerEnv('AUTH_SESSION_TTL_SECONDS', 86400),
    cookieSecure: booleanEnv('AUTH_COOKIE_SECURE', isProduction),
    loginRateLimitMax: positiveIntegerEnv('AUTH_LOGIN_RATE_LIMIT_MAX', 5),
    loginRateLimitWindowSeconds: positiveIntegerEnv(
      'AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS',
      300,
    ),
  };
}

export function createSessionSecret(): string {
  return randomBytes(32).toString('base64url');
}
