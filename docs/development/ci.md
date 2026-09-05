# Continuous Integration

CI is defined in `.github/workflows/ci.yml`.

## Triggers

CI runs on:

```text
pull_request
push to master
push to dev
```

Outdated validation runs are canceled when a newer commit is pushed to the same
branch.

## Runtime

CI uses:

```text
Node.js 24
pnpm 10.15.1
PostgreSQL 16 service container
Playwright Chromium
Docker Buildx
```

The workflow installs dependencies with:

```bash
pnpm install --frozen-lockfile
```

pnpm dependencies are cached through `actions/setup-node`.

## Checks

The CI workflow preserves the full local verification path:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm --filter api prisma validate
pnpm test:commit
pnpm --filter api test:e2e
pnpm --filter api build
pnpm --filter web build
pnpm exec openspec validate --all --strict
pnpm test:e2e:web
```

It also builds production Docker images without pushing:

```bash
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile .
```

When files under `apps/api/prisma/migrations/` change, CI applies committed
migrations against the isolated PostgreSQL service container with:

```bash
pnpm --filter api prisma migrate deploy
```

CI never uses `prisma migrate dev` or `prisma db push`.

## Commit And Workflow Checks

CI validates Conventional Commit subjects. Merge and revert commits are allowed.

When GitHub workflow files change, CI runs:

```bash
actionlint
zizmor
```

Secret scanning runs with enough Git history to catch committed secrets:

```text
Gitleaks
```

CodeQL is defined separately in `.github/workflows/codeql.yml` for JavaScript
and TypeScript.

## Automatic Pull Request Descriptions

`.github/workflows/pull-request-metadata.yml` runs after branch pushes, including
ordinary terminal pushes, and when a same-repository PR is opened, reopened, or
updated with new commits. It creates a draft PR against the repository's default
branch when one does not exist, or refreshes open PRs for that branch using their
existing base branches. Existing PRs retain their draft/ready state.

Each description includes a summary, changed areas, file additions/deletions,
commit subjects and body details, links to checks, and migration notes when
applicable. The title uses a Conventional Commit subject, favoring feature/fix
commits over automatic OpenSpec archive commits. A custom title that already
follows the convention is preserved. This does not rewrite Git commit messages;
the existing CI Conventional Commit check still applies.

The generator uses GitHub metadata and makes no AI provider calls. Commit bodies
provide the explanation of why changes were made, so descriptive commit messages
produce more useful PR descriptions. It does not claim tests passed: validation
links point to workflow runs, and test claims in commit messages are labeled as
author-provided. It shows up to 30 commit messages and 60 file entries. Comparisons
with 300 or more files explicitly flag GitHub's file-list limit and link to the
complete diff.

The generated section is bounded by these HTML comments:

```html
<!-- antin-os:pr-summary:start -->
<!-- antin-os:pr-summary:end -->
```

Add manual explanations, screenshots, issues, or confirmed test results before
or after that section. The workflow preserves those notes and refreshes only
the generated section. Incomplete or duplicated markers cause an error instead
of replacing the description. No-op reruns do not update the PR again.

### Enable the workflow

1. Merge the workflow and `scripts/sync-pull-request.cjs` into the default branch.
   The job always loads its script from that branch and does not execute the
   pushed branch's application code or install its dependencies.
2. In **Settings → Actions → General → Workflow permissions**, enable **Allow
   GitHub Actions to create and approve pull requests**. The workflow requests
   only `contents: read` and `pull-requests: write`; it never approves or merges
   a PR. No additional token or AI key is required.
3. Push a branch containing changes relative to the default branch. Check the
   **Pull Request Metadata** run, then open the resulting draft PR.

GitHub may require a repository writer to select **Approve workflows to run**
for PR checks triggered by a PR created with `GITHUB_TOKEN`. This is separate
from generating its description; inspect the checks before marking work complete.
See [GitHub's workflow-trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
and [repository Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

Pushes to the default branch, branch deletions, tags, and fork PRs are skipped.
The default branch cannot have a PR against itself. A branch without a net diff
does not create a PR. Commits containing GitHub's workflow-skip directives can
skip this workflow just as they skip other push/PR workflows.

For an older branch that does not yet contain the workflow, or to refresh a
description manually, choose **Actions → Pull Request Metadata → Run workflow**
on the default branch and enter the target branch. Existing merged/closed PRs
are not edited. Authentication, permission, and API failures are reported in the
workflow log. The `pull-request-url` output and log contain the updated PR URL.

Test this automation locally with `pnpm test:automation`. These tests mock GitHub
and are also included in `pnpm test:commit`; they never create remote PRs.

## External Services

CI never calls the real OpenAI API. It sets:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

CI does not use real AWS credentials. Upload behavior is tested with mocked
storage implementations.

Pull-request CI does not call Render, Vercel production, production
PostgreSQL, OpenAI, or AWS.

## Vercel Preview

`.github/workflows/vercel-preview.yml` creates Vercel preview deployments for
pull requests that change frontend-relevant files:

```text
apps/web/**
packages/shared/**
packages/api-client/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
vercel.json
```

Preview deployments use the same `/api` rewrite as production but do not pass
server secrets to Vercel.

Required GitHub `preview` environment values:

```text
Secrets:
  VERCEL_TOKEN
  VERCEL_ORG_ID
  VERCEL_PROJECT_ID

Variables:
  RENDER_API_ORIGIN
```

## Delivery After CI

`.github/workflows/delivery.yml` runs only after CI succeeds.

On `dev`, it can apply development database migrations through the protected
GitHub `development` environment.

On `master`, it publishes the API and web Docker images to GHCR, applies
production migrations once through the protected GitHub `production`
environment, deploys the immutable API image to Render, and deploys the
frontend to Vercel only when frontend-related files changed.

Vercel serves the Vite app, rewrites `/api/:path*` to the Render API, and uses
`VITE_API_BASE_URL=/api`. Render keeps database, AWS, session, and OpenAI
secrets.

## Permissions

Workflows use minimal GitHub permissions. CI uses:

```yaml
permissions:
  contents: read
```

Jobs that need package publishing or security upload permissions declare them at
the job level.

## Common Failures

Formatting failures:

```bash
make format
```

Type or lint failures:

```bash
make lint
make typecheck
```

Test failures:

```bash
make test
make e2e
make e2e-api
```

Docker build failures:

```bash
make docker-build
```

Prisma validation failures:

```bash
pnpm --filter api prisma validate
```
