# Repository Guide

Use this guide when setting up or running `antin-os` locally.

## Requirements

- Node
- pnpm 10
- Docker
- Playwright Chromium

## First-Time Setup

```bash
make init
```

This creates `apps/api/.env` from `apps/api/.env.example` when missing, installs
dependencies, installs Playwright Chromium, and installs the pre-commit hook.

Manual equivalent:

```bash
cp apps/api/.env.example apps/api/.env
pnpm install
pnpm exec playwright install chromium
pnpm exec simple-git-hooks
```

## Environment

The API reads environment variables from `apps/api/.env`.

Local defaults:

```bash
DATABASE_URL="postgresql://antin:antin_password@localhost:5432/antin_os?schema=public"
PORT=3001
```

Admin authentication needs a single owner account configured in env:

```bash
ADMIN_USERNAME=owner@example.com
ADMIN_PASSWORD_HASH=<generated-password-hash>
AUTH_SESSION_SECRET=<random-session-secret>
AUTH_SESSION_TTL_SECONDS=86400
AUTH_COOKIE_SECURE=false
AUTH_LOGIN_RATE_LIMIT_MAX=5
AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS=300
```

Generate a password hash:

```bash
pnpm --filter api auth:hash-password
```

Generate a session secret:

```bash
openssl rand -base64 32
```

Profile picture upload, project image upload, and resume upload also need S3
configuration:

```bash
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_PUBLIC_BASE_URL=
AWS_S3_PRESIGNED_URL_TTL_SECONDS=900
RESUME_MAX_UPLOAD_BYTES=5242880
```

Project images use browser-to-S3 presigned uploads. Resume PDFs are uploaded to
the API, validated server-side, stored privately in S3, and downloaded through
`/public/resume/download` only when published. Full AWS setup:
[AWS S3 Project Images](../operations/aws-s3-project-images.md).

AI case-study drafting is disabled by default. Keep these values server-side in
`apps/api/.env`; do not create `VITE_*` or other browser-exposed AI variables:

```bash
AI_DRAFTING_ENABLED=false
AI_PROVIDER=
OPENAI_API_KEY=
OPENAI_MODEL=
AI_DRAFT_TIMEOUT_MS=30000
AI_DRAFT_RATE_LIMIT=5/60
AI_DRAFT_USAGE_LIMIT=25/86400
AI_DRAFT_MAX_NOTES_LENGTH=2000
AI_DRAFT_MAX_OUTPUT_TOKENS=1200
```

Use mock mode for zero-cost local development and automated tests:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

Use real OpenAI drafting only when you intentionally configure all required
server-side values:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=openai
OPENAI_API_KEY=<your-api-key>
OPENAI_MODEL=<model-available-to-your-account>
```

The app uses the OpenAI Responses API with strict structured output. It does not
hardcode a model, silently switch to a paid model/provider, or assume free-plan
access is permanent. Rate and usage limits are in-memory request-count limits;
they reset after an API restart and do not coordinate across multiple API
instances.

## Run Locally

```bash
make up
make migrate
make dev
```

Open:

```text
API: http://localhost:3001
Web: http://localhost:5173
```

The profile admin UI is the web app root:

```text
http://localhost:5173/
```

Portfolio project routes:

```text
Admin projects: http://localhost:5173/admin/projects
Public projects: http://localhost:5173/projects
```

The OpenSpec change name `add-portfolio-profile-management` is not a browser route.

## Run With Docker

For a containerized local stack:

```bash
make docker-build
make docker-migrate
make docker-up
```

Open:

```text
API: http://localhost:3001
Web: http://localhost:5173
```

Full Docker instructions: [Docker Development](docker.md).

## Run Apps Separately

```bash
make dev-api
make dev-web
```

Equivalent pnpm commands:

```bash
pnpm --filter api start:dev
pnpm --filter web dev
```

## Database

```bash
make up
make db-wait
make migrate
make prisma-generate
make db-studio
```

Create or restore a local database backup:

```bash
make backup-db
make restore-db backup=latest confirm=1
```

Backups are full custom-format PostgreSQL archives stored under
`.backups/postgres/`. They are ignored by Git and may contain sensitive data.
Stop local API and web processes before restoring a backup.

Local reset automatically creates a timestamped backup before deleting the
Docker volume and rerunning migrations:

```bash
make reset-db confirm=1
```

Only when the current database cannot start or be backed up, bypass that safety
step explicitly:

```bash
make reset-db confirm=1 skip_backup=1
```

## Quality Gates

Fast commit checks:

```bash
make test
```

Final local gate:

```bash
make check
```

`make check` runs formatting, lint/typecheck, fast tests, builds, API E2E,
Playwright E2E, and OpenSpec validation.

## Troubleshooting

### `http://localhost:5173` Cannot Be Reached

Start the web app:

```bash
make dev-web
```

If `localhost` does not open, try the exact Vite URL, usually:

```text
http://127.0.0.1:5173
```

### `http://localhost:3001` Cannot Be Reached

Start the API:

```bash
make dev-api
```

### Database Connection Errors

Start Postgres and apply migrations:

```bash
make up
make db-wait
make migrate
```

### Port Already In Use

Find the process:

```bash
lsof -nP -iTCP -sTCP:LISTEN | rg ':3001|:5173'
```

Stop the conflicting process, or run the app on another port.

### Pre-Commit Hook Is Not Running

Reinstall the hook:

```bash
pnpm exec simple-git-hooks
```

The hook should run:

```bash
pnpm test:commit
```

### Playwright Browser Is Missing

Install Chromium:

```bash
pnpm exec playwright install chromium
```
