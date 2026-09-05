const START = '<!-- antin-os:pr-summary:start -->';
const END = '<!-- antin-os:pr-summary:end -->';
const TITLE = /<!-- antin-os:pr-title:([A-Za-z0-9_-]+) -->/;
const CONVENTIONAL =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._-]+\))?!?: \S.*$/;

function clip(value, length) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function text(value) {
  return String(value)
    .replace(/[\r\n\t]/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/@/g, '&#64;')
    .replace(/([\\`*_\[\]~|])/g, '\\$1');
}

function subject(commit) {
  return commit.commit.message.split(/\r?\n/)[0].trim();
}

function chooseTitle(commits, branch) {
  const meaningful = commits.filter(
    (commit) =>
      commit.parents.length < 2 &&
      subject(commit) !== 'chore(openspec): archive completed changes',
  );
  const candidates = meaningful.length ? meaningful : commits;
  const conventional = candidates.filter((commit) =>
    CONVENTIONAL.test(subject(commit)),
  );
  const selected =
    conventional.find((commit) => subject(commit).startsWith('feat')) ??
    conventional.find((commit) => subject(commit).startsWith('fix')) ??
    conventional[0];
  if (selected) return clip(subject(selected), 200);
  const summary = candidates.length
    ? subject(candidates[0])
    : branch.replace(/[-_/]+/g, ' ');
  return `chore: ${clip(summary || 'update project', 190)}`;
}

function area(filename) {
  const areas = [
    ['apps/api/prisma/', 'Database'],
    ['apps/api/', 'API'],
    ['apps/web/', 'Web'],
    ['packages/shared/', 'Shared contracts'],
    ['packages/api-client/', 'API client'],
    ['tests/', 'Browser tests'],
    ['openspec/', 'OpenSpec'],
    ['docs/', 'Documentation'],
    ['.github/', 'GitHub workflows and templates'],
    ['scripts/', 'Repository scripts'],
  ];
  return (
    areas.find(([prefix]) => filename.startsWith(prefix))?.[1] ??
    'Root configuration and documentation'
  );
}

function buildMetadata({ commits, files, base, branch, repoUrl, headSha }) {
  const title = chooseTitle(commits, branch);
  const compareUrl = `${repoUrl}/compare/${encodeURIComponent(base)}...${encodeURIComponent(branch)}`;
  const groups = new Map();
  for (const file of files) {
    const name = area(file.filename);
    groups.set(name, (groups.get(name) ?? 0) + 1);
  }
  const lines = [
    START,
    `<!-- antin-os:pr-title:${Buffer.from(title).toString('base64url')} -->`,
    '## Summary',
    '',
    text(title.replace(/^[^:]+: /, '')),
    '',
    `${commits.length} commit(s) relative to ${text(base)}. Branch head: [${headSha.slice(0, 7)}](${repoUrl}/commit/${headSha}).`,
    '',
    '## Changes',
    '',
    ...[...groups].map(([name, count]) => `- ${name}: ${count} file(s).`),
    '',
    `<details>\n<summary>Changed files (${files.length >= 300 ? 'first 300 from GitHub comparison' : files.length})</summary>\n`,
    ...files.slice(0, 60).map((file) => {
      const previous = file.previous_filename
        ? ` (from ${text(clip(file.previous_filename, 180))})`
        : '';
      return `- ${text(file.status)}: ${text(clip(file.filename, 180))}${previous} (+${file.additions}/−${file.deletions})`;
    }),
    ...(files.length > 60
      ? ['', `Additional files: [full diff](${compareUrl}).`]
      : []),
    '',
    '</details>',
    ...(files.length >= 300
      ? [
          '',
          `GitHub comparison data is limited to 300 files; the counts above may be partial. See the [full diff](${compareUrl}).`,
        ]
      : []),
    '',
    '## Commit details',
    '',
    'Commit messages below are written by the commit authors.',
    '',
  ];
  for (const commit of commits.slice(-30)) {
    lines.push(
      `- [${commit.sha.slice(0, 7)}](${repoUrl}/commit/${commit.sha}) ${text(clip(subject(commit), 200))}`,
    );
    const body = commit.commit.message
      .split(/\r?\n/)
      .slice(1)
      .join('\n')
      .trim();
    if (body) {
      lines.push(
        '',
        ...clip(body, 800)
          .split('\n')
          .map((line) => `  > ${text(line)}`),
        '',
      );
    }
  }
  if (commits.length > 30) {
    lines.push(
      '',
      `Showing the latest 30 commit messages; see [all commits](${compareUrl}).`,
    );
  }
  lines.push(
    '',
    '## Validation',
    '',
    `This metadata workflow does not run application tests. Review [workflow runs for this branch](${repoUrl}/actions?query=${encodeURIComponent(`branch:${branch}`)}) for check results. Testing claims in commit messages are author-provided.`,
  );
  if (
    files.some((file) =>
      /job-applications|job-assistant|JobApplication/.test(file.filename),
    )
  ) {
    lines.push(
      '',
      'Job changes require the PostgreSQL suite to run without skipping against a migrated disposable database configured with JOB_APPLICATION_TEST_DATABASE_URL.',
    );
  }
  if (
    files.some((file) =>
      file.filename.startsWith('apps/api/prisma/migrations/'),
    )
  ) {
    lines.push(
      '',
      '## Deployment notes',
      '',
      'This branch includes database migrations. Review and apply the committed migrations as part of deployment.',
    );
  }
  lines.push(
    '',
    '---',
    '',
    'Updated automatically from GitHub commit and file metadata. Add manual context outside this generated section to keep it across pushes.',
    END,
  );
  return { title, section: lines.join('\n') };
}

function mergeBody(body, section) {
  const existing = body ?? '';
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  if (start !== -1 || end !== -1) {
    if (
      start === -1 ||
      end < start ||
      existing.indexOf(START, start + START.length) !== -1 ||
      existing.indexOf(END, end + END.length) !== -1
    ) {
      throw new Error(
        'PR summary markers are incomplete or duplicated; restore one start/end pair before syncing.',
      );
    }
    return (
      existing.slice(0, start) + section + existing.slice(end + END.length)
    );
  }
  const humanContent = existing
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^## (Summary|Changes|Validation|Deployment notes)\s*$/gm, '')
    .trim();
  const isTemplate = existing
    .trimStart()
    .startsWith('<!--\nUse a Conventional Commit title:');
  return existing.trim() && (humanContent || !isTemplate)
    ? `${existing}\n\n${section}`
    : section;
}

function updatedTitle(pr, proposed) {
  const previous = pr.body?.match(TITLE)?.[1];
  const managed =
    previous && Buffer.from(previous, 'base64url').toString() === pr.title;
  return !CONVENTIONAL.test(pr.title) ||
    managed ||
    pr.title === 'chore(openspec): archive completed changes'
    ? proposed
    : pr.title;
}

async function comparison(github, repo, base, branch) {
  const [{ data: baseRef }, { data: headRef }] = await Promise.all([
    github.rest.repos.getBranch({ ...repo, branch: base }),
    github.rest.repos.getBranch({ ...repo, branch }),
  ]);
  const basehead = `${baseRef.commit.sha}...${headRef.commit.sha}`;
  const { data: first } = await github.rest.repos.compareCommitsWithBasehead({
    ...repo,
    basehead,
    per_page: 100,
    page: 1,
  });
  const commits = [...first.commits];
  for (let page = 2; commits.length < first.total_commits; page++) {
    const { data } = await github.rest.repos.compareCommitsWithBasehead({
      ...repo,
      basehead,
      per_page: 100,
      page,
    });
    if (!data.commits.length)
      throw new Error('Incomplete GitHub commit comparison.');
    commits.push(...data.commits);
  }
  return { commits, files: first.files ?? [], headSha: headRef.commit.sha };
}

async function syncPullRequest({ github, context, core }) {
  const repo = context.repo;
  const repository = context.payload.repository;
  const eventPr = context.payload.pull_request;
  if (
    context.payload.deleted ||
    (eventPr && eventPr.head.repo?.full_name !== repository.full_name)
  ) {
    core.info('Skipping deleted branch or fork pull request.');
    return;
  }
  if (context.eventName === 'push' && !context.ref.startsWith('refs/heads/'))
    return;
  const branch =
    eventPr?.head.ref ??
    context.payload.inputs?.branch ??
    context.ref.replace(/^refs\/heads\//, '');
  if (!branch || branch === repository.default_branch) {
    core.info('The default branch has no pull request to itself.');
    return;
  }
  const list = () =>
    github.paginate(github.rest.pulls.list, {
      ...repo,
      state: 'open',
      head: `${repo.owner}:${branch}`,
      per_page: 100,
    });
  const prs = eventPr
    ? [
        (await github.rest.pulls.get({ ...repo, pull_number: eventPr.number }))
          .data,
      ]
    : await list();
  for (let pr of prs.length ? prs : [null]) {
    if (pr && pr.state !== 'open') continue;
    const base = pr?.base.ref ?? repository.default_branch;
    const data = await comparison(github, repo, base, branch);
    if (!data.commits.length || !data.files.length) {
      core.info('No branch changes to describe.');
      continue;
    }
    const metadata = buildMetadata({
      ...data,
      base,
      branch,
      repoUrl: repository.html_url,
    });
    if (!pr) {
      try {
        ({ data: pr } = await github.rest.pulls.create({
          ...repo,
          head: branch,
          base,
          title: metadata.title,
          body: metadata.section,
          draft: true,
        }));
      } catch (error) {
        if (error.status !== 422) throw error;
        pr = (await list()).find((candidate) => candidate.base.ref === base);
        if (!pr) throw error;
      }
    }
    // Re-read to preserve edits made while the comparison was loading.
    const { data: latest } = await github.rest.pulls.get({
      ...repo,
      pull_number: pr.number,
    });
    if (
      latest.state !== 'open' ||
      latest.head.sha !== data.headSha ||
      latest.base.ref !== base
    ) {
      core.info(
        'PR changed while preparing metadata; a later run can refresh it.',
      );
      continue;
    }
    const body = mergeBody(latest.body, metadata.section);
    if (body.length > 60000)
      throw new Error(
        'PR description is too large; shorten manual notes before syncing.',
      );
    const title = updatedTitle(latest, metadata.title);
    if (body !== latest.body || title !== latest.title) {
      await github.rest.pulls.update({
        ...repo,
        pull_number: latest.number,
        title,
        body,
      });
    }
    core.info(`Pull request description is current: ${latest.html_url}`);
    core.setOutput('pull-request-url', latest.html_url);
  }
}

module.exports = {
  syncPullRequest,
  buildMetadata,
  mergeBody,
  chooseTitle,
  updatedTitle,
  START,
  END,
};
