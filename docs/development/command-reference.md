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
```

## Development

```bash
make dev              # start API and web together
make dev-api          # start Nest API only
make dev-web          # start Vite web app only
make migrate          # apply Prisma migrations
make prisma-generate  # regenerate Prisma client
make db-studio        # open Prisma Studio
```

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
