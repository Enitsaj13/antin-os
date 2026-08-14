## Context

See `proposal.md` for motivation. The API app already has a `Project` Prisma model with the fields needed by the requested behavior and a registered but empty NestJS projects module. There is no OpenSpec main spec yet, and there is no authentication capability in the current project, so this design focuses on project behavior and explicitly treats public deployment of management routes as blocked until authentication exists.

## Goals / Non-Goals

**Goals:**

- Implement project CRUD behavior through the existing API app and persisted `Project` records.
- Keep public portfolio retrieval distinct from management retrieval so unpublished projects are never returned publicly.
- Define exact management and public route contracts.
- Reuse the existing Prisma schema fields where possible.
- Add focused unit and/or e2e coverage for the observable behavior in `specs/portfolio-projects/spec.md`.

**Non-Goals:**

- Add authentication, authorization, admin users, or role-based access.
- Build a frontend portfolio page.
- Add project ordering, tagging beyond `techStack`, analytics, or media upload/storage.
- Change the current `Project` data model unless implementation reveals a required compatibility issue.

## Decisions

### Keep Project as the persistence model

Use the existing `Project` model fields: `title`, `slug`, `summary`, `description`, `techStack`, `repoUrl`, `liveUrl`, `imageUrl`, and `isPublic`.

Rationale: The model already matches the required project record shape, so adding a migration would create unnecessary schema churn.

Alternative considered: Add a new public portfolio model. This was rejected because the management and public views are different projections of the same project record.

### Split management and public service methods

Implement management methods that query all projects and public methods that always include `isPublic = true` in their lookup criteria.

Rationale: Separate methods keep the unpublished filtering rule centralized and testable instead of relying on controller code to remember the filter.

Alternative considered: Reuse management lookups and filter in controllers. This was rejected because it spreads the publication invariant across API handlers.

### Use DTO validation at the API boundary

Define create and update DTOs for required fields, URL format checks, optional boolean publication state, lowercase kebab-case slug format, non-empty trimmed string arrays for tech stack, and non-empty update payloads. Required text fields must be rejected when they are empty after trimming whitespace. Optional nullable fields (`description`, `repoUrl`, `liveUrl`, `imageUrl`) must accept `null` on update so callers can clear existing values.

Rationale: Input validation belongs at the API boundary, while persistence conflict handling belongs in the service layer.

Alternative considered: Validate only in service methods. This was rejected because NestJS already has validation libraries installed and DTOs make request contracts clearer.

### Treat slugs as stable public identifiers

Allow managed reads by id or slug, but require public detail retrieval by lowercase kebab-case slug. Detect slug conflicts before write completion where practical, and also translate Prisma unique constraint failures for slug into HTTP 409 conflicts.

Rationale: Public portfolio URLs should not expose database ids, while management behavior still benefits from id-based access for internal tooling and tests.

Alternative considered: Use ids for every route. This was rejected because public portfolio project detail pages naturally key off human-readable slugs.

### Use exact management and public routes

Expose management behavior through:

- `POST /projects`
- `GET /projects`
- `GET /projects/:idOrSlug`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

Expose public behavior through:

- `GET /public/projects`
- `GET /public/projects/:slug`

Rationale: Keeping public routes under `/public/projects` avoids collision with management reads while making deployable public behavior explicit.

Alternative considered: Place public reads under `/projects/:slug`. This was rejected because it conflicts with management route semantics and increases the chance of accidentally exposing unpublished records.

### Map Prisma unique conflicts explicitly

Catch Prisma `P2002` unique constraint errors for project slug writes and return HTTP 409.

Rationale: Validation can catch obvious duplicates before writes, but the database unique constraint remains the authoritative concurrency-safe guard.

Alternative considered: Rely only on a pre-write duplicate lookup. This was rejected because concurrent requests can still race.

## Risks / Trade-offs

- No authentication yet -> Management endpoints are not protected until a future auth capability exists. Mitigation: management routes must not be deployed on a public surface before authentication is implemented; use local/private deployment only for this change.
- Ambiguous route shape -> Public and management routes can collide if both use `/projects/:slug`. Mitigation: use a distinct public route prefix or explicit route names for public retrieval.
- Slug mutation can break external links -> Updating slugs is useful during curation but can invalidate published URLs. Mitigation: keep slug update allowed for now because redirects are outside scope, and test duplicate slug behavior.
- Hard deletes remove public history -> Delete behavior is simple but irreversible. Mitigation: rely on `isPublic = false` for unpublishing when content should be retained; hard delete remains a management action.

## Migration Plan

1. Implement DTOs, service methods, and exact controller routes against the existing `Project` model.
2. Add focused tests for create defaults, list, read, update, delete, validation, duplicate slugs, nullable optional field clearing, empty updates, and public filtering.
3. Run the API test suite and build.
4. Keep management routes off any public deployment until authentication exists.
5. Roll back by reverting the projects module code changes; no database migration rollback is expected if the existing schema is reused.
