## Why

Antin OS needs a first real domain workflow for maintaining portfolio projects instead of only storing a database model. Adding project management creates the foundation for curated public portfolio entries that can later support career, job search, and skill growth features.

## What Changes

- Add backend project management behavior for creating, listing, reading, updating, and deleting portfolio projects through exact management routes.
- Add public portfolio project listing and detail behavior through exact public routes that expose only published projects.
- Validate lowercase kebab-case project slugs, required content, URLs, publication state, update payloads, and duplicate slug conflicts.
- Allow optional project fields to be cleared with explicit `null` values.
- Document that management routes must not be publicly deployed before authentication exists.
- Preserve existing `Project` data fields while making them reachable through documented API behavior.

## Capabilities

### New Capabilities

- `portfolio-projects`: Management and public retrieval of portfolio project records.

### Modified Capabilities

- None.

## Impact

- Affects the NestJS API projects module, project service/controller behavior, and Prisma-backed project persistence.
- Adds request/response contracts and validation for management and public portfolio project endpoints.
- Adds test coverage for project CRUD, publication filtering, slug uniqueness, empty updates, nullable optional fields, and public project retrieval.
