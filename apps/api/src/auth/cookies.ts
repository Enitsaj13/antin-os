import type { Request, Response } from 'express';
import { AUTH_COOKIE_NAME, AuthConfig } from './auth.config';

export function readAuthCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');

    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return undefined;
}

export function setAuthCookie(
  response: Response,
  token: string,
  config: AuthConfig,
) {
  response.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: config.sessionTtlSeconds * 1000,
  });
}

export function clearAuthCookie(response: Response, config: AuthConfig) {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
}
