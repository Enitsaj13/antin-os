# Command Reference

`make help` is the authoritative command index.

## Setup

```bash
make init             # env file + dependencies + hooks + Playwright Chromium
make install          # install dependencies
make clean-artifacts  # delete generated files
make clean            # delete generated files and node_modules
```

## Local Services

```bash
make up               # start local Postgres
make down             # stop/remove local containers
make logs             # follow container logs
make db-wait          # wait until Postgres is ready
make backup-db        # write a timestamped backup under .backups/postgres
make restore-db backup=latest confirm=1 # replace local DB with newest backup
make reset-db confirm=1 # back up, wipe local DB, and rerun migrations
make docker-build     # build API and web production images
make docker-up        # start Postgres + API + web containers
make docker-migrate   # run prisma migrate deploy once
make docker-down      # stop/remove full Docker stack
make docker-logs      # follow full-stack logs
```

## Development

```bash
make dev              # start API and web together
make dev-api          # start Nest API only
make dev-web          # start Vite web app only
make migrate          # apply Prisma migrations
make seed-portfolio   # upsert portfolio projects from the current portfolio
make prisma-generate  # regenerate Prisma client
make db-studio        # open Prisma Studio
```

Useful direct setup commands:

```bash
pnpm --filter api auth:hash-password # generate ADMIN_PASSWORD_HASH
openssl rand -base64 32              # generate AUTH_SESSION_SECRET
```

AI case-study and job-assistant drafting is controlled by API-only env. For zero-cost local work,
set this in `apps/api/.env` before starting the API:

```bash
AI_DRAFTING_ENABLED=true
AI_PROVIDER=mock
```

For real OpenAI drafting, use `AI_PROVIDER=openai` only with server-side
`OPENAI_API_KEY` and `OPENAI_MODEL` configured.

The reusable runner also enforces `AI_DRAFT_MAX_INPUT_CHARACTERS` and the shared
rate, usage, timeout, and output-token limits. Keep mock mode enabled for tests
and smoke checks; it is deterministic and performs no external request.

Docker setup and runtime configuration: [Docker Development](docker.md).

## Local Database Backups

Create a full custom-format PostgreSQL archive:

```bash
make backup-db
```

Backups are written to `.backups/postgres/` with timestamped filenames and are
ignored by Git. They contain the full local database, may contain sensitive
personal data, and should not be committed or shared.

Restore the newest backup or a specific archive:

```bash
make restore-db backup=latest confirm=1
make restore-db backup=.backups/postgres/antin_os_YYYYMMDD_HHMMSS.dump confirm=1
```

Restore validates the archive before replacing the local database, then applies
any newer Prisma migrations. Stop local API and web development processes first
so they do not reconnect while the database is being replaced.

Every destructive reset creates a backup before removing the Docker volume:

```bash
make reset-db confirm=1
```

If PostgreSQL is too damaged to start or back up, explicitly bypass the safety
step with `make reset-db confirm=1 skip_backup=1`. This permanently deletes the
local database without creating a recovery archive.

## Quality

```bash
make format           # format repo with Prettier
make format-check     # check Prettier formatting
make lint             # run lint/type checks
make typecheck        # run TypeScript checks
make test             # fast commit tests
make build            # build API and web
make check            # final local gate
```

Commits run `make test` through the pre-commit hook. E2E is intentionally not part
of every commit.

## Playwright / E2E

```bash
make e2e                                      # Playwright browser tests
make e2e-headed                               # visible browser
make e2e-ui                                   # Playwright UI runner
make e2e-video                                # headed browser with video
make e2e-match match='profile admin'          # run matching tests
make e2e-match match='profile admin' headed=1 # matching tests in visible browser
make e2e-api                                  # API E2E
make e2e-all                                  # API E2E + Playwright
```

## OpenSpec

```bash
make spec             # list changes and specs
make spec-view        # open OpenSpec dashboard
make spec-validate    # strict OpenSpec validation
```

Useful direct OpenSpec commands:

```bash
pnpm exec openspec list
pnpm exec openspec list --specs
pnpm exec openspec show add-portfolio-profile-management
pnpm exec openspec validate --all --strict
pnpm exec openspec archive <change-name>
```
