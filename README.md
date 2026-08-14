# antin-os

An AI-powered developer career operating system for portfolio, job tracking, and skill growth.

## Quick Start

Run commands from the repository root unless a command says otherwise.

### 1. Install dependencies

```bash
pnpm install
```

`pnpm install` also installs the pre-commit hook through `simple-git-hooks`. If the hook ever needs to be reinstalled manually, run:

```bash
pnpm exec simple-git-hooks
```

Install the Playwright Chromium browser before running browser E2E tests for the first time:

```bash
pnpm exec playwright install chromium
```

### 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

Check that the container is running:

```bash
docker compose ps
```

### 3. Configure the API environment

The API reads environment variables from `apps/api/.env`.

```bash
cp apps/api/.env.example apps/api/.env
```

The local defaults are:

```bash
DATABASE_URL="postgresql://antin:antin_password@localhost:5432/antin_os?schema=public"
PORT=3001
```

Profile picture upload also needs these values before you test S3-backed image storage:

```bash
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_PUBLIC_BASE_URL=
AWS_S3_PRESIGNED_URL_TTL_SECONDS=900
```

### 4. Apply database migrations

```bash
pnpm --filter api exec prisma migrate dev
```

Regenerate Prisma client types when the schema changes:

```bash
pnpm --filter api exec prisma generate
```

Optional database browser:

```bash
pnpm --filter api exec prisma studio
```

### 5. Start the API

```bash
pnpm --filter api start:dev
```

The API should be available at:

```text
http://localhost:3001
```

Health check:

```bash
curl http://localhost:3001/health
```

Profile endpoints:

```bash
curl http://localhost:3001/profile
curl http://localhost:3001/public/profile
```

### 6. Start the web app

Open a second terminal and run:

```bash
pnpm --filter web dev
```

The web app should be available at:

```text
http://localhost:5173
```

If `localhost` does not open, try the exact URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

The `add-portfolio-profile-management` work is an OpenSpec change name, not a browser route. The profile admin UI opens at the web app root:

```text
http://localhost:5173/
```

## Makefile Command Menu

Use `make help` to print the available shortcuts:

```bash
make help
```

### First-time setup

```bash
make init
```

This creates `apps/api/.env` from `apps/api/.env.example` when missing, installs dependencies, installs Playwright Chromium, and installs the pre-commit hook.

### Daily development

```bash
make up
make migrate
make dev
```

Or run the servers separately:

```bash
make dev-api
make dev-web
```

### Database

```bash
make up
make down
make logs
make db-wait
make migrate
make prisma-generate
make db-studio
```

Dangerous local reset:

```bash
make reset-db confirm=1
```

### Quality

```bash
make format
make format-check
make lint
make typecheck
make test
make build
make check
```

`make test` runs the fast commit tests. `make check` runs final validation, including format-check, lint/typecheck, builds, E2E, and OpenSpec validation.

### Playwright / E2E

```bash
make e2e
make e2e-headed
make e2e-ui
make e2e-video
make e2e-match match='profile admin'
make e2e-match match='profile admin' headed=1 slow=300
make e2e-api
make e2e-all
```

### OpenSpec

```bash
make spec
make spec-view
make spec-validate
```

## Common Development Commands

### Commit checks

Every commit runs the fast test suite through the pre-commit hook:

```bash
pnpm test:commit
```

This runs API Jest tests and web Vitest tests:

```bash
pnpm --filter api test
pnpm --filter web test
```

E2E tests intentionally do not run on every commit.

### Build shared packages

```bash
pnpm --filter @antin-os/shared build
pnpm --filter @antin-os/api-client build
```

### API

```bash
pnpm --filter api start:dev
pnpm --filter api build
pnpm --filter api lint
pnpm --filter api test
pnpm --filter api test:e2e
```

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test
pnpm test:e2e:web
pnpm test:e2e:web:ui
```

### E2E tests

Run API E2E only:

```bash
pnpm test:e2e:api
```

Run Playwright browser E2E only:

```bash
pnpm test:e2e:web
```

Open the Playwright UI runner:

```bash
pnpm test:e2e:web:ui
```

Run all E2E tests:

```bash
pnpm test:e2e
```

### Final validation

Run this before considering a feature finished:

```bash
pnpm test:final
```

That command runs:

```bash
pnpm test:commit
pnpm --filter api build
pnpm --filter web build
pnpm test:e2e
pnpm exec openspec validate --all --strict
```

## OpenSpec Command Cheat Sheet

### Full command list

Show OpenSpec help:

```bash
pnpm exec openspec --help
```

Top-level OpenSpec commands:

```bash
pnpm exec openspec init
pnpm exec openspec update
pnpm exec openspec list
pnpm exec openspec view
pnpm exec openspec change
pnpm exec openspec archive
pnpm exec openspec spec
pnpm exec openspec config
pnpm exec openspec schema
pnpm exec openspec store
pnpm exec openspec doctor
pnpm exec openspec context
pnpm exec openspec workset
pnpm exec openspec validate
pnpm exec openspec show
pnpm exec openspec feedback
pnpm exec openspec completion
pnpm exec openspec status
pnpm exec openspec instructions
pnpm exec openspec templates
pnpm exec openspec schemas
pnpm exec openspec new
pnpm exec openspec help
```

### View work

List active changes:

```bash
pnpm exec openspec list
```

List specs:

```bash
pnpm exec openspec list --specs
```

Open the interactive dashboard:

```bash
pnpm exec openspec view
```

Show a change:

```bash
pnpm exec openspec show add-portfolio-profile-management
```

Show a spec:

```bash
pnpm exec openspec show portfolio-projects --type spec
```

Check completion status for a change:

```bash
pnpm exec openspec status --change add-portfolio-profile-management
```

### Create or update work

Create a new change directory:

```bash
pnpm exec openspec new change my-change-name
```

Create a new change with context:

```bash
pnpm exec openspec new change my-change-name --description "Short description" --goal "What this change should accomplish"
```

Print artifact instructions:

```bash
pnpm exec openspec instructions
pnpm exec openspec instructions --change add-portfolio-profile-management
```

### Validate work

Validate one change:

```bash
pnpm exec openspec validate add-portfolio-profile-management --strict
```

Validate one spec:

```bash
pnpm exec openspec validate portfolio-projects --type spec --strict
```

Validate all active changes and specs:

```bash
pnpm exec openspec validate --all --strict
```

Validate only changes:

```bash
pnpm exec openspec validate --changes --strict
```

Validate only specs:

```bash
pnpm exec openspec validate --specs --strict
```

### Archive completed work

Archive a completed change and update main specs:

```bash
pnpm exec openspec archive add-portfolio-profile-management
```

Skip confirmation prompts:

```bash
pnpm exec openspec archive add-portfolio-profile-management --yes
```

Archive doc-only or tooling work without spec updates:

```bash
pnpm exec openspec archive my-change-name --skip-specs
```

## Troubleshooting

### `http://localhost:5173` cannot be reached

The web app is not running. Start it:

```bash
pnpm --filter web dev
```

Then open the URL printed by Vite.

### `http://localhost:3001` cannot be reached

The API is not running. Start it:

```bash
pnpm --filter api start:dev
```

### Database connection errors

Start Postgres and apply migrations:

```bash
docker compose up -d postgres
pnpm --filter api exec prisma migrate dev
```

### Port already in use

Find the process:

```bash
lsof -nP -iTCP -sTCP:LISTEN | rg ':3001|:5173'
```

Stop the conflicting process, or run the app on another port.

### Pre-commit hook is not running

Reinstall the hook:

```bash
pnpm exec simple-git-hooks
```

Confirm the hook command:

```bash
cat .git/hooks/pre-commit
```

It should run:

```bash
pnpm test:commit
```

### Playwright browser is missing

Install Chromium:

```bash
pnpm exec playwright install chromium
```
