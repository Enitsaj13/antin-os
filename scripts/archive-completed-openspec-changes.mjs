#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const shouldCommit = process.argv.includes('--commit');
const skip =
  process.env.SKIP_SIMPLE_GIT_HOOKS === '1' ||
  process.env.SKIP_OPENSPEC_AUTO_ARCHIVE === '1' ||
  process.env.OPENSPEC_ARCHIVE_IN_PROGRESS === '1';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, ...options.env },
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(
      stderr || `${command} ${args.join(' ')} exited with ${result.status}`,
    );
  }

  return result.stdout ?? '';
}

function gitStatus(paths) {
  return run('git', ['status', '--porcelain', '--', ...paths], {
    capture: true,
  }).trim();
}

if (skip || !existsSync('openspec/config.yaml')) {
  process.exit(0);
}

const dirtyOpenSpecBefore = gitStatus(['openspec']);

if (dirtyOpenSpecBefore) {
  console.log(
    '[openspec] Skipping auto-archive because openspec/ already has uncommitted changes.',
  );
  process.exit(0);
}

const listOutput = run('pnpm', ['exec', 'openspec', 'list', '--json'], {
  capture: true,
});
const { changes = [] } = JSON.parse(listOutput);
const completedChanges = changes.filter(
  (change) =>
    change.status === 'complete' ||
    (change.totalTasks > 0 && change.completedTasks === change.totalTasks),
);

if (completedChanges.length === 0) {
  process.exit(0);
}

for (const change of completedChanges) {
  console.log(`[openspec] Archiving completed change: ${change.name}`);
  run('pnpm', ['exec', 'openspec', 'archive', change.name, '--yes']);
}

run('pnpm', ['exec', 'openspec', 'validate', '--all', '--strict']);

const dirtyOpenSpecAfter = gitStatus(['openspec']);

if (!dirtyOpenSpecAfter) {
  process.exit(0);
}

if (!shouldCommit) {
  console.log('[openspec] Archive changes are ready in openspec/.');
  process.exit(0);
}

run('git', ['add', '-A', 'openspec']);
run('git', ['commit', '-m', 'chore(openspec): archive completed changes'], {
  env: {
    SKIP_SIMPLE_GIT_HOOKS: '1',
    OPENSPEC_ARCHIVE_IN_PROGRESS: '1',
  },
});
