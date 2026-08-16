import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const HASH_ALGORITHM = 'sha256';
const KEY_LENGTH = 32;
const DEFAULT_ITERATIONS = 210_000;

function createPasswordHash(password) {
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

const argPassword = process.argv[2];

if (argPassword) {
  console.log(createPasswordHash(argPassword));
  process.exit(0);
}

const readline = createInterface({ input, output });
const password = await readline.question('Admin password: ');
readline.close();

if (!password) {
  console.error('Password is required.');
  process.exit(1);
}

console.log(createPasswordHash(password));
