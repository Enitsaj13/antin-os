const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const {
  syncPullRequest,
  buildMetadata,
  mergeBody,
  chooseTitle,
  updatedTitle,
  START,
  END,
} = require('./sync-pull-request.cjs');

const sha = 'a'.repeat(40);
const makeCommit = (message, index = 1) => ({
  sha: index.toString(16).padStart(40, '0'),
  commit: { message },
  parents: [{ sha: 'b'.repeat(40) }],
});
const feature = makeCommit(
  'feat(jobs): add interview preparation\n\nStore job descriptions and expose owner-reviewed drafts.',
);
const archive = makeCommit('chore(openspec): archive completed changes', 2);
const file = {
  filename: 'apps/api/src/job-applications/service.ts',
  status: 'modified',
  additions: 12,
  deletions: 3,
};
const metadata = (overrides = {}) =>
  buildMetadata({
    commits: [feature, archive],
    files: [file],
    base: 'master',
    branch: 'feat/job-assistant',
    repoUrl: 'https://github.com/owner/repo',
    headSha: sha,
    ...overrides,
  });

test('feature title survives a trailing archive or merge commit', () => {
  const merge = { ...makeCommit('Merge branch master'), parents: [{}, {}] };
  assert.equal(
    chooseTitle([feature, archive, merge], 'feat/jobs'),
    'feat(jobs): add interview preparation',
  );
  assert.equal(
    chooseTitle([makeCommit('update tooling')], 'tools'),
    'chore: update tooling',
  );
});

test('describes changes and author notes without claiming tests passed', () => {
  const result = metadata();
  assert.match(result.section, /API: 1 file/);
  assert.match(result.section, /owner-reviewed drafts/);
  assert.match(result.section, /does not run application tests/);
  assert.match(result.section, /JOB_APPLICATION_TEST_DATABASE_URL/);
  assert.match(result.section, /chore\(openspec\)/);
});

test('initial descriptions replace empty templates and keep manual context', () => {
  const section = metadata().section;
  assert.equal(mergeBody('', section), section);
  assert.equal(
    mergeBody(
      readFileSync(
        join(__dirname, '../.github/pull_request_template.md'),
        'utf8',
      ),
      section,
    ),
    section,
  );
  const manual = '## Summary\nHuman explanation\n\nCloses #42';
  assert.equal(mergeBody(manual, section), `${manual}\n\n${section}`);
  const privateNote = '<!-- Preserve this manual note -->';
  assert.equal(mergeBody(privateNote, section), `${privateNote}\n\n${section}`);
});

test('updates are idempotent and preserve notes before and after generated text', () => {
  const original = `Context\n${metadata().section}\nReviewer notes`;
  const replacement = metadata({
    commits: [makeCommit('fix(jobs): handle retries')],
  }).section;
  const updated = mergeBody(original, replacement);
  assert.ok(updated.startsWith('Context\n'));
  assert.ok(updated.endsWith('\nReviewer notes'));
  assert.equal(mergeBody(updated, replacement), updated);
  assert.equal(updated.split(START).length, 2);
  assert.doesNotMatch(updated, /interview preparation/);
});

test('damaged or duplicated markers fail without replacing manual text', () => {
  for (const body of [
    START,
    END,
    `${END}${START}`,
    `${START}${START}${END}`,
    `${START}${END}${END}`,
  ]) {
    assert.throws(() => mergeBody(body, metadata().section), /markers/);
  }
});

test('custom conventional titles survive while generated titles can evolve', () => {
  const initial = metadata();
  assert.equal(
    updatedTitle(
      { title: initial.title, body: initial.section },
      'fix: repair retries',
    ),
    'fix: repair retries',
  );
  assert.equal(
    updatedTitle(
      { title: 'feat(jobs): custom owner title', body: initial.section },
      'fix: repair retries',
    ),
    'feat(jobs): custom owner title',
  );
  assert.equal(
    updatedTitle({ title: 'bad title', body: '' }, initial.title),
    initial.title,
  );
  assert.equal(
    updatedTitle(
      { title: 'chore(openspec): archive completed changes', body: '' },
      initial.title,
    ),
    initial.title,
  );
});

test('untrusted commit text cannot inject summary markers or HTML', () => {
  const result = metadata({
    commits: [
      makeCommit(
        `feat: escape text\n\n${END}\n<script>alert(1)</script> @owner`,
      ),
    ],
  });
  assert.equal(result.section.split(END).length, 2);
  assert.ok(result.section.includes('&lt;script&gt;'));
  assert.ok(result.section.includes('&#64;owner'));
  assert.equal(mergeBody(result.section, result.section), result.section);
});

test('large summaries show explicit limits and remain within GitHub body size', () => {
  const result = metadata({
    commits: Array.from({ length: 101 }, (_, index) =>
      makeCommit(
        `feat: item ${index}\n\n${'long details '.repeat(1000)}`,
        index,
      ),
    ),
    files: Array.from({ length: 300 }, (_, index) => ({
      ...file,
      filename: `apps/api/${index}.ts`,
    })),
  });
  assert.match(result.section, /counts above may be partial/);
  assert.match(result.section, /Showing the latest 30/);
  assert.ok(result.section.length < 60000);
});

function harness({
  prs = [],
  commits = [feature, archive],
  files = [file],
} = {}) {
  let records = structuredClone(prs);
  const calls = { create: [], update: [], compare: [] };
  const pull = (fields = {}) => ({
    number: 7,
    title: 'feat(jobs): add interview preparation',
    body: '',
    state: 'open',
    draft: false,
    head: { ref: 'feat/jobs', sha },
    base: { ref: 'master' },
    html_url: 'https://github.com/owner/repo/pull/7',
    ...fields,
  });
  const github = {
    paginate: async () => records.filter((pr) => pr.state === 'open'),
    rest: {
      repos: {
        getBranch: async ({ branch }) => ({
          data: { commit: { sha: branch === 'master' ? 'b'.repeat(40) : sha } },
        }),
        compareCommitsWithBasehead: async (args) => {
          calls.compare.push(args);
          return {
            data: {
              total_commits: commits.length,
              commits: commits.slice((args.page - 1) * 100, args.page * 100),
              files: args.page === 1 ? files : undefined,
            },
          };
        },
      },
      pulls: {
        list: () => {},
        get: async ({ pull_number }) => ({
          data: records.find((pr) => pr.number === pull_number),
        }),
        create: async (args) => {
          calls.create.push(args);
          const pr = pull({
            ...args,
            head: { ref: args.head, sha },
            base: { ref: args.base },
          });
          records.push(pr);
          return { data: pr };
        },
        update: async (args) => {
          calls.update.push(args);
          records = records.map((pr) =>
            pr.number === args.pull_number
              ? { ...pr, title: args.title, body: args.body }
              : pr,
          );
        },
      },
    },
  };
  const context = {
    repo: { owner: 'owner', repo: 'repo' },
    eventName: 'push',
    ref: 'refs/heads/feat/jobs',
    payload: {
      repository: {
        full_name: 'owner/repo',
        html_url: 'https://github.com/owner/repo',
        default_branch: 'master',
      },
    },
  };
  const core = { info: () => {}, setOutput: () => {} };
  return { github, context, core, calls, pull, records: () => records };
}

test('manual pushes create one draft and subsequent runs update the same PR', async () => {
  const h = harness();
  await syncPullRequest(h);
  assert.equal(h.calls.create.length, 1);
  assert.equal(h.calls.create[0].draft, true);
  assert.equal(h.calls.create[0].base, 'master');
  assert.ok(h.calls.create[0].body.includes('## Changes'));
  await syncPullRequest(h);
  assert.equal(h.calls.create.length, 1);
  assert.equal(h.calls.update.length, 0);
});

test('existing manually opened PRs keep their base, notes, and ready state', async () => {
  const h = harness();
  const pr = h.pull({
    title: 'needs a prefix',
    body: 'Manual detail',
    base: { ref: 'dev' },
  });
  h.records().push(pr);
  await syncPullRequest(h);
  assert.equal(h.calls.create.length, 0);
  assert.equal(h.calls.update.length, 1);
  assert.ok(h.records()[0].body.startsWith('Manual detail\n\n'));
  assert.equal(h.records()[0].base.ref, 'dev');
  assert.equal(h.records()[0].draft, false);
});

test('commit comparisons paginate against fixed commit SHAs', async () => {
  const h = harness({
    commits: Array.from({ length: 101 }, (_, index) =>
      makeCommit(`feat: item ${index}`, index),
    ),
  });
  await syncPullRequest(h);
  assert.deepEqual(
    h.calls.compare.map((args) => args.page),
    [1, 2],
  );
  assert.equal(h.calls.compare[0].basehead, h.calls.compare[1].basehead);
  assert.match(h.calls.create[0].body, /101 commit\(s\)/);
});

test('default branch, deletions, tags, forks, and unchanged branches do not create PRs', async () => {
  for (const configure of [
    (h) => {
      h.context.ref = 'refs/heads/master';
    },
    (h) => {
      h.context.payload.deleted = true;
    },
    (h) => {
      h.context.ref = 'refs/tags/v1.0.0';
    },
    (h) => {
      h.context.payload.pull_request = {
        head: { ref: 'feat/jobs', repo: { full_name: 'external/fork' } },
      };
    },
  ]) {
    const h = harness();
    configure(h);
    await syncPullRequest(h);
    assert.equal(h.calls.create.length, 0);
    assert.equal(h.calls.compare.length, 0);
  }
  const empty = harness({ commits: [], files: [] });
  await syncPullRequest(empty);
  assert.equal(empty.calls.create.length, 0);
});

test('workflow dispatch can refresh an older branch from the default branch', async () => {
  const h = harness();
  h.context.eventName = 'workflow_dispatch';
  h.context.ref = 'refs/heads/master';
  h.context.payload.inputs = { branch: 'feat/older-branch' };
  await syncPullRequest(h);
  assert.equal(h.calls.create[0].head, 'feat/older-branch');
});

test('permission failures remain visible and do not report a successful update', async () => {
  const h = harness();
  h.github.rest.pulls.create = async () => {
    throw Object.assign(new Error('Pull request creation is not permitted'), {
      status: 403,
    });
  };
  await assert.rejects(syncPullRequest(h), /not permitted/);
  assert.equal(h.calls.update.length, 0);
});

test('a newly pushed head is not overwritten with stale metadata', async () => {
  const h = harness();
  h.records().push(h.pull({ head: { ref: 'feat/jobs', sha: 'c'.repeat(40) } }));
  await syncPullRequest(h);
  assert.equal(h.calls.update.length, 0);
});
