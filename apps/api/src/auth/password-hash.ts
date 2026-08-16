import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const HASH_ALGORITHM = 'sha256';
const KEY_LENGTH = 32;
const DEFAULT_ITERATIONS = 210_000;

export function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const hash = pbkdf2Sync(
    password,
    salt,
    DEFAULT_ITERATIONS,
    KEY_LENGTH,
    HASH_ALGORITHM,
  ).toString('base64url');

  return `pbkdf2-${HASH_ALGORITHM}$${DEFAULT_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPasswordHash(
  password: string,
  encodedHash: string,
): boolean {
  const [algorithm, iterationsValue, salt, expectedHash] =
    encodedHash.split('$');

  if (
    algorithm !== `pbkdf2-${HASH_ALGORITHM}` ||
    !iterationsValue ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const iterations = Number(iterationsValue);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actual = Buffer.from(
    pbkdf2Sync(password, salt, iterations, KEY_LENGTH, HASH_ALGORITHM).toString(
      'base64url',
    ),
  );
  const expected = Buffer.from(expectedHash);

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
