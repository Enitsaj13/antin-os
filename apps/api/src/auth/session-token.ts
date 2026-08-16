import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionClaims = {
  sub: string;
  exp: number;
};

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSessionToken(claims: SessionClaims, secret: string) {
  const payload = encodeJson(claims);
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): SessionClaims | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  const actual = Buffer.from(sign(payload, secret));
  const expected = Buffer.from(signature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const claims = decodeJson<SessionClaims>(payload);

    if (!claims.sub || !claims.exp || claims.exp * 1000 <= now) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}
