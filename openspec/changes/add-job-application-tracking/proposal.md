## Why

AntinOS manages public portfolio content but does not provide a private workspace for the owner's job search. A structured tracker is needed to follow applications, interviews, and follow-up work without exposing sensitive job-hunt data through public portfolio routes.

## What Changes

- Add a private job-application record with company, position, optional job URL, source, salary range, notes, status, application and interview dates, next-action date, and follow-up notes.
- Support the statuses `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, and `withdrawn`, with new applications defaulting to `saved`.
- Add authenticated owner-only CRUD and dashboard APIs for job applications.
- Add protected admin table and Kanban views, create/edit workflows, status filtering, dashboard counts, and pipeline progress.
- Add validation, loading, empty, error, retry, confirmation, responsive, and keyboard-accessible states while preventing duplicate submissions.
- Add API, web, and Playwright coverage for private CRUD, status changes, dashboard summaries, and public-data isolation.
- Keep public sharing, job scraping/import, automatic application submission, email/calendar synchronization, AI matching or cover-letter generation, resume tailoring, and advanced job-search analytics out of scope.

## Capabilities

### New Capabilities

- `job-application-tracking`: Private owner-only job application CRUD, status pipeline tracking, table and Kanban management, next actions, and dashboard summaries.

### Modified Capabilities

- None.

## Impact

- Adds a Prisma model and migration for private job-application records.
- Adds protected NestJS DTOs, services, controllers, shared contracts, API-client methods, and TanStack Query hooks.
- Adds protected admin navigation, routes, forms, table/Kanban views, and dashboard summaries.
- Adds API, web, and end-to-end tests while leaving all existing public portfolio APIs and pages unchanged.
