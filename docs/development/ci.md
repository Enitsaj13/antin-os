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
