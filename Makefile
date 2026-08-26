PNPM := pnpm
DOCKER_ENV := .env.docker
DOCKER_ENV_EXAMPLE := .env.docker.example
DOCKER_COMPOSE := docker compose --env-file $(DOCKER_ENV)
API_ENV := apps/api/.env
API_ENV_EXAMPLE := apps/api/.env.example
PLAYWRIGHT_SLOW_MO ?= 300

.DEFAULT_GOAL := help

.PHONY: help
help:
	@echo "Main commands"
	@echo "  make init             First-time setup: env file, dependencies, hooks, Playwright"
	@echo "  make install          Install dependencies"
	@echo "  make clean            Delete dependencies and generated artifacts"
	@echo "  make clean-artifacts  Delete generated artifacts only"
	@echo ""
	@echo "Local services"
	@echo "  make up               Start local Postgres"
	@echo "  make down             Stop/remove local containers"
	@echo "  make logs             Follow container logs"
	@echo "  make db-wait          Wait until Postgres is ready"
	@echo "  make reset-db         Wipe local DB volume and rerun migrations; requires confirm=1"
	@echo "  make docker-build     Build API and web production images"
	@echo "  make docker-up        Start Postgres, API, and web containers"
	@echo "  make docker-migrate   Run Prisma migrate deploy in a one-off container"
	@echo "  make docker-down      Stop/remove the containerized stack"
	@echo "  make docker-logs      Follow full-stack container logs"
	@echo ""
	@echo "Development"
	@echo "  make dev              Start API and web dev servers"
	@echo "  make dev-api          Start Nest API only"
	@echo "  make dev-web          Start Vite web app only"
	@echo "  make migrate          Apply Prisma migrations"
	@echo "  make seed-portfolio   Upsert portfolio projects from the current portfolio"
	@echo "  make db-studio        Open Prisma Studio"
	@echo ""
	@echo "Quality"
	@echo "  make format           Format the repo with Prettier"
	@echo "  make format-check     Check formatting"
	@echo "  make lint             Run lint/type checks"
	@echo "  make typecheck        Run TypeScript checks"
	@echo "  make test             Run fast commit tests"
	@echo "  make build            Build API and web"
	@echo "  make check            Run final validation, including E2E and OpenSpec"
	@echo ""
	@echo "Playwright / E2E"
	@echo "  make e2e              Run Playwright browser E2E"
	@echo "  make e2e-headed       Run Playwright with visible browser"
	@echo "  make e2e-ui           Open Playwright UI"
	@echo "  make e2e-video        Run headed Playwright with video"
	@echo "  make e2e-match        Run Playwright tests matching match='text'"
	@echo "  make e2e-api          Run API E2E"
	@echo "  make e2e-all          Run API and Playwright E2E"
	@echo ""
	@echo "OpenSpec"
	@echo "  make spec             List OpenSpec changes and specs"
	@echo "  make spec-view        Open OpenSpec dashboard"
	@echo "  make spec-validate    Validate OpenSpec files"

.PHONY: init
init:
	@if [ ! -f "$(API_ENV)" ]; then cp "$(API_ENV_EXAMPLE)" "$(API_ENV)"; fi
	@if [ ! -f "$(DOCKER_ENV)" ]; then cp "$(DOCKER_ENV_EXAMPLE)" "$(DOCKER_ENV)"; fi
	$(PNPM) install
	$(PNPM) exec playwright install chromium
	$(PNPM) exec simple-git-hooks

.PHONY: docker-env
docker-env:
	@if [ ! -f "$(DOCKER_ENV)" ]; then cp "$(DOCKER_ENV_EXAMPLE)" "$(DOCKER_ENV)"; fi

.PHONY: install
install:
	$(PNPM) install

.PHONY: clean-artifacts
clean-artifacts:
	rm -rf apps/api/dist apps/api/coverage apps/web/dist apps/web/coverage
	rm -rf packages/shared/dist packages/api-client/dist
	rm -rf coverage playwright-report test-results

.PHONY: clean
clean: clean-artifacts
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

.PHONY: up
up: docker-env
	$(DOCKER_COMPOSE) up -d postgres

.PHONY: down
down:
	$(DOCKER_COMPOSE) down

.PHONY: logs
logs:
	$(DOCKER_COMPOSE) logs -f

.PHONY: db-wait
db-wait:
	@until $(DOCKER_COMPOSE) exec -T postgres pg_isready -U antin -d antin_os >/dev/null 2>&1; do \
		echo "Waiting for Postgres..."; \
		sleep 1; \
	done
	@echo "Postgres is ready."

.PHONY: reset-db
reset-db: docker-env
	@test "$(confirm)" = "1" || (echo "Usage: make reset-db confirm=1" && exit 1)
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d postgres
	$(MAKE) db-wait
	$(MAKE) migrate

.PHONY: docker-build
docker-build: docker-env
	$(DOCKER_COMPOSE) build api web

.PHONY: docker-up
docker-up: docker-env
	$(DOCKER_COMPOSE) up -d postgres api web

.PHONY: docker-migrate
docker-migrate: docker-env
	$(DOCKER_COMPOSE) --profile release run --rm api-migrate

.PHONY: docker-down
docker-down:
	$(DOCKER_COMPOSE) down

.PHONY: docker-logs
docker-logs:
	$(DOCKER_COMPOSE) logs -f postgres api web

.PHONY: migrate
migrate:
	$(PNPM) --filter api exec prisma migrate dev

.PHONY: seed-portfolio
seed-portfolio:
	$(PNPM) --filter api seed:portfolio

.PHONY: prisma-generate
prisma-generate:
	$(PNPM) --filter api exec prisma generate

.PHONY: db-studio
db-studio:
	$(PNPM) --filter api exec prisma studio

.PHONY: dev
dev: up db-wait
	@echo "Starting API and web. Press Ctrl-C to stop both."
	@trap 'kill 0' INT TERM EXIT; \
		$(PNPM) --filter api start:dev & \
		$(PNPM) --filter web dev & \
		wait

.PHONY: dev-api
dev-api:
	$(PNPM) --filter api start:dev

.PHONY: dev-web
dev-web:
	$(PNPM) --filter web dev

.PHONY: format
format:
	$(PNPM) format

.PHONY: format-check
format-check:
	$(PNPM) format:check

.PHONY: lint
lint:
	$(PNPM) lint

.PHONY: typecheck
typecheck:
	$(PNPM) typecheck

.PHONY: test
test:
	$(PNPM) test:commit

.PHONY: build
build:
	$(PNPM) build

.PHONY: check
check: format-check lint typecheck test build e2e-all spec-validate

.PHONY: e2e
e2e:
	$(PNPM) test:e2e:web

.PHONY: e2e-headed
e2e-headed:
	$(PNPM) exec playwright test --headed --workers=1

.PHONY: e2e-ui
e2e-ui:
	$(PNPM) test:e2e:web:ui

.PHONY: e2e-video
e2e-video:
	PLAYWRIGHT_VIDEO=1 $(PNPM) exec playwright test --headed --workers=1

.PHONY: e2e-match
e2e-match:
	@test -n "$(match)" || (echo "Usage: make e2e-match match='profile admin' [headed=1] [slow=300]" && exit 1)
	@if [ "$(headed)" = "1" ]; then \
		PLAYWRIGHT_SLOW_MO=$(or $(slow),$(PLAYWRIGHT_SLOW_MO)) $(PNPM) exec playwright test --grep "$(match)" --headed --workers=1; \
	else \
		$(PNPM) exec playwright test --grep "$(match)"; \
	fi

.PHONY: e2e-api
e2e-api:
	$(PNPM) test:e2e:api

.PHONY: e2e-all
e2e-all:
	$(PNPM) test:e2e

.PHONY: spec
spec:
	$(PNPM) exec openspec list
	$(PNPM) exec openspec list --specs

.PHONY: spec-view
spec-view:
	$(PNPM) exec openspec view

.PHONY: spec-validate
spec-validate:
	$(PNPM) exec openspec validate --all --strict
