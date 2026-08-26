# Container Delivery

Delivery is defined in `.github/workflows/delivery.yml`.

## Trigger

Delivery runs after CI completes successfully.

Branch behavior:

```text
dev     protected development database migration only
master  GHCR images, production migration, Render API deploy, Vercel deploy
```

It does not publish images from pull-request branches.

Delivery runs are not canceled once started because database migrations must not
be interrupted.

## Registry

Images are published to GitHub Container Registry using `GITHUB_TOKEN`:

```text
ghcr.io/<owner>/antin-os-api
ghcr.io/<owner>/antin-os-web
```

The publishing job uses:

```yaml
permissions:
  contents: read
  packages: write
```

No personal access token is required.

## Tags

Each image is tagged with:

```text
<full-git-commit-sha>
master
latest
```

Use the full SHA tag for deployments. Treat `master` and `latest` as convenience
tags for inspection only.

## Build Cache

Docker Buildx uses GitHub Actions layer caching:

```text
type=gha
```

The image build checks in CI and the publishing builds in delivery use the same
Dockerfiles and the exact same tested commit SHA.

## Workflow Output

The delivery workflow writes the immutable image names to the GitHub Actions job
summary:

```text
API: ghcr.io/<owner>/antin-os-api:<commit-sha>
Web: ghcr.io/<owner>/antin-os-web:<commit-sha>
```

## Production Delivery

Production delivery is gated by successful CI on `master` and the protected
GitHub `production` environment.

The current target is:

```text
Vercel  Vite/React frontend from source
Render  NestJS API from the immutable GHCR API image
```

The web image continues to be published for local Docker and future
self-hosting, but Vercel is the production frontend host.

Production steps:

```text
1. Publish API and web images to GHCR.
2. Apply production Prisma migrations once.
3. Trigger Render with ghcr.io/<owner>/antin-os-api:<commit-sha>.
4. Verify Render health and database-backed public endpoints.
5. Deploy Vercel production only when frontend-related files changed.
```

## Vercel Preview

`.github/workflows/vercel-preview.yml` deploys Vercel previews for pull
requests when frontend-related paths change. It never deploys production.

## Required GitHub Environment Values

Development:

```text
Secrets:
  DEVELOPMENT_DATABASE_URL

Variables:
  DEVELOPMENT_DATABASE_HOST
```

Preview:

```text
Secrets:
  VERCEL_TOKEN
  VERCEL_ORG_ID
  VERCEL_PROJECT_ID

Variables:
  RENDER_API_ORIGIN
```

Production:

```text
Secrets:
  PRODUCTION_DATABASE_URL
  RENDER_API_DEPLOY_HOOK_URL
  VERCEL_TOKEN
  VERCEL_ORG_ID
  VERCEL_PROJECT_ID

Variables:
  PRODUCTION_DATABASE_HOST
  RENDER_API_ORIGIN
```

Render must store runtime application secrets:

```text
DATABASE_URL
AUTH_SESSION_SECRET
ADMIN_PASSWORD_HASH
AWS credentials or role configuration
OPENAI_API_KEY, only when AI_PROVIDER=openai
```

Do not store database, AWS, session, or OpenAI secrets in Vercel.

## Render API

The API deploy job sends Render the immutable image tag:

```text
ghcr.io/<owner>/antin-os-api:<commit-sha>
```

Configure Render to pull from GHCR. If the package is private, connect Render to
GHCR with a deploy credential scoped only to package read access.

Do not configure every Render API replica to run migrations. GitHub Actions
runs `prisma migrate deploy` as the controlled release job before rollout.

## Vercel Web

Vercel uses `vercel.ts` to build `apps/web` and route traffic:

```text
/api/:path*  ->  Render API
/:path*      ->  /index.html
```

The frontend build uses:

```bash
VITE_API_BASE_URL=/api
```

Only expose frontend-safe `VITE_*` values. Server secrets remain API-only.

## Rollback

Rollback uses the previous immutable SHA tags:

```text
ghcr.io/<owner>/antin-os-api:<previous-commit-sha>
ghcr.io/<owner>/antin-os-web:<previous-commit-sha>
```

For production, roll Render back to the previous API image tag and roll Vercel
back to the previous healthy deployment. Do not roll back to `latest`; it may
have moved.
