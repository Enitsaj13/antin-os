# Docker Development

Use Docker when you want the local stack to look like production: PostgreSQL,
the NestJS API image, and the Vite web image served by nginx.

The normal non-Docker workflow still works:

```bash
make up
make migrate
make dev
```

## First Setup

```bash
make init
```

`make init` creates `.env.docker` from `.env.docker.example` when it is missing.
The example file contains placeholders only. Keep real passwords, OpenAI keys,
and AWS credentials in your local `.env.docker`, not in Git.

At minimum, set these values in `.env.docker`:

```bash
POSTGRES_PASSWORD=<local-postgres-password>
DATABASE_URL=postgresql://antin:<local-postgres-password>@postgres:5432/antin_os?schema=public
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
WEB_API_BASE_URL=http://localhost:3001
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

For admin login, also configure:

```bash
ADMIN_USERNAME=<owner-username>
ADMIN_PASSWORD_HASH=<generated-password-hash>
AUTH_SESSION_SECRET=<random-session-secret>
```

Generate those values with:

```bash
pnpm --filter api auth:hash-password
openssl rand -base64 32
```

## Build And Run

```bash
make docker-build
make docker-migrate
make docker-up
```

Open:

```text
Web: http://localhost:5173
API: http://localhost:3001
API health: http://localhost:3001/health
Web health: http://localhost:5173/health
```

Follow logs:

```bash
make docker-logs
```

Stop the stack:

```bash
make docker-down
```

Direct Compose commands should pass the Docker env file:

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f
```

## Migrations

The API container does not run production migrations at startup. Run migrations
once as a controlled release step:

```bash
make docker-migrate
```

This executes:

```bash
docker compose --profile release run --rm api-migrate
```

## AI Drafting

Local Docker defaults to zero-cost AI mock mode:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

Use real OpenAI only when intentionally configured in `.env.docker`:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=<server-side-api-key>
OPENAI_MODEL=<model-available-to-your-account>
```

Never expose OpenAI settings through `VITE_*` variables.

## Runtime Configuration

The web image is built once and configured at runtime through:

```bash
WEB_API_BASE_URL=http://localhost:3001
```

The container writes that value to `/runtime-config.js` when nginx starts. The
regular Vite development workflow still supports `VITE_API_BASE_URL`.

## Smoke Checks

After `make docker-up`, verify:

```bash
curl http://localhost:3001/health
curl http://localhost:5173/health
curl http://localhost:3001/public/projects
```

Browser checks:

```text
Public homepage: http://localhost:5173/
Admin login: http://localhost:5173/admin/login
Admin profile: http://localhost:5173/admin/profile
Admin projects: http://localhost:5173/admin/projects
Public projects: http://localhost:5173/projects
```

Use mock AI drafting from an admin project edit screen. It must not call OpenAI.

## Troubleshooting

If Compose reports missing variables, copy the example file again and fill the
placeholders:

```bash
cp .env.docker.example .env.docker
```

If the API cannot connect to PostgreSQL, confirm `DATABASE_URL` uses the Compose
service name `postgres`, not `localhost`.

If admin login fails, confirm `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and
`AUTH_SESSION_SECRET` are set in `.env.docker`.

If file uploads fail, configure AWS S3 values in `.env.docker`. Keep credentials
API-only and never add them to the web image.
