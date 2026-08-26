# antin-os

An AI-powered developer career operating system for portfolio, job tracking, and skill growth.
Built as a pnpm monorepo with a NestJS API, Vite/React admin app, shared packages,
PostgreSQL via Prisma, Playwright browser checks, and an OpenSpec-driven workflow.

This README is the map. The documentation below has the full setup and command details.

## Quick Start

Requires Node, pnpm 10, Docker, and Playwright Chromium.

```bash
make init     # seed apps/api/.env + install dependencies/hooks/Playwright
make up       # start local Postgres
make migrate  # apply Prisma migrations
make seed-portfolio # import current portfolio projects into local DB
make dev      # API at http://localhost:3001 + web at http://localhost:5173
```

Full setup, commands, and troubleshooting: [Repository Guide](docs/development/repository-guide.md).

## Common Commands

`make help` is the authoritative command index. The common root flows are:

```bash
make dev-api            # run the Nest API only
make dev-web            # run the Vite web app only
make format-check       # check Prettier formatting
make lint typecheck     # focused local static checks
make test               # fast commit tests: API Jest + web Vitest
make build              # production builds for API and web
make check              # final gate: format, lint, typecheck, tests, build, E2E, OpenSpec
make spec-validate      # strict OpenSpec validation
```

Database and E2E helpers expect the local backing services from `make up`:

```bash
make db-wait            # wait until Postgres is ready
make migrate            # apply Prisma migrations
make backup-db          # create a timestamped local database backup
make restore-db backup=latest confirm=1 # restore the newest local backup
make db-studio          # open Prisma Studio
make e2e                # Playwright browser smoke tests
make e2e-api            # API E2E tests
make e2e-all            # API E2E + Playwright
make e2e-ui             # Playwright UI runner
```

## Documentation

| Read this                                                            | When you want to...                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Repository Guide](docs/development/repository-guide.md)             | Set up, run, test, and troubleshoot this repo day-to-day    |
| [Command Reference](docs/development/command-reference.md)           | Pick the smallest useful Makefile or pnpm command           |
| [Docker Development](docs/development/docker.md)                     | Run the local stack with production-style containers        |
| [CI](docs/development/ci.md)                                         | Understand GitHub Actions checks and troubleshooting        |
| [Deployment](docs/operations/deployment.md)                          | Configure production runtime, migrations, health, rollback  |
| [Container Delivery](docs/operations/container-delivery.md)          | Publish and consume GHCR API/web images                     |
| [AWS S3 Portfolio Storage](docs/operations/aws-s3-project-images.md) | Configure S3 uploads for images and resume PDFs             |
| [Projects Module Spec](docs/specs/projects-module.md)                | Understand the portfolio projects module behavior           |
| [OpenSpec](openspec/)                                                | Review specs, active changes, and archived change proposals |

## Stack at a Glance

NestJS 11 + Prisma 7 + PostgreSQL 16 · Vite + React 19 + Tailwind · pnpm monorepo ·
shared TypeScript contracts · AWS S3 portfolio storage · Jest + Vitest +
Playwright · Docker Compose · OpenSpec.

## Layout

```text
.
├── apps/
│   ├── api/          # NestJS API, Prisma schema/migrations, API tests
│   └── web/          # Vite/React profile admin app
├── packages/
│   ├── shared/       # Shared types, constants, and utilities
│   └── api-client/   # Typed fetch client for API routes
├── docs/             # Development docs and feature specs
├── openspec/         # Specs, active changes, and archived proposals
├── tests/e2e/        # Playwright browser tests
├── docker-compose.yml
└── Makefile          # `make help` lists every task
```

## Status

Pre-1.0. The repo currently includes portfolio project APIs, experience APIs,
profile management APIs, S3-backed image/resume storage, public portfolio pages,
admin management surfaces, local Postgres tooling, fast commit tests, opt-in E2E
checks, and OpenSpec planning artifacts.
