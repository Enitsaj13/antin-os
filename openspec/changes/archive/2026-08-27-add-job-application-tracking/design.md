## Context

See [proposal.md](./proposal.md) for the motivation and [the job-application-tracking specification](./specs/job-application-tracking/spec.md) for the required behavior. AntinOS already separates protected admin surfaces from public portfolio routes, uses NestJS with secure cookie authentication, Prisma and PostgreSQL for persistence, and a Vite/React frontend with TanStack Query. Job-search data is private and must not enter public controllers, contracts, queries, or pages. This feature therefore crosses database, API, shared contracts, server-state management, and responsive admin UI boundaries.

## Goals / Non-Goals

**Goals:**

- Add an additive private data model and owner-authenticated API surface.
- Keep table, Kanban, detail, and dashboard views consistent through shared contracts and centralized query invalidation.
- Make status updates usable with a keyboard and assistive technology and resilient to failed mutations.
- Preserve public portfolio behavior and prove private-data isolation.
- Support backward-compatible deployment and rollback.

**Non-Goals:**

- Public sharing, multi-user collaboration, scraping or import, automatic application submission, email or calendar synchronization, AI matching or cover letters, resume tailoring, or advanced analytics.
- Drag-and-drop as the only Kanban interaction.
- Automatic inference of dates or progress scores from status transitions.
- Normalized source and salary taxonomies in this first version.

## Decisions

### 1. Use one additive job-application model and a database enum

Add a Prisma `JobApplication` model and `JobApplicationStatus` enum. Company and position are required; optional text and date fields are nullable; status defaults to `SAVED`; created and updated timestamps use existing Prisma conventions.

This keeps valid pipeline states authoritative at the database and contract layers. A free-form status string was rejected because it permits invalid states. A separate status-history model is deferred because this scope tracks current state rather than an audit trail.

### 2. Keep the API owner-only under a dedicated module

Use protected resource routes:

- `POST /job-applications`
- `GET /job-applications`
- `GET /job-applications/dashboard`
- `GET /job-applications/:id`
- `PATCH /job-applications/:id`
- `DELETE /job-applications/:id`

Every route uses the existing owner authentication guard, and no public controller is added. An `/admin` API prefix was rejected because existing AntinOS management APIs use protected resource routes rather than admin-prefixed APIs.

### 3. Keep server validation authoritative and use null to clear optional fields

Shared contracts and NestJS DTO validation trim text, reject whitespace-only required values, accept only absolute HTTP or HTTPS job URLs, validate status and date values, and reject empty updates. For PATCH requests, `null` explicitly clears an optional field while omission preserves the stored value.

Empty strings are not retained because they blur the distinction between absent and intentionally cleared data.

### 4. Do not infer dates from status changes

Changing status never fills, clears, or changes application, interview, or next-action dates. Dates remain explicit owner-entered facts.

Automatic date stamping was rejected because status can be corrected retroactively and an application can have multiple or unknown interview events.

### 5. Use one canonical list query for table and Kanban views

Table and Kanban presentations derive from the same list response and query key. Detail and dashboard summaries have separate query keys. Successful mutations invalidate the list and dashboard plus the affected detail query.

Separate table and Kanban caches were rejected because they increase synchronization complexity and stale-state risk.

### 6. Make explicit status controls the canonical Kanban interaction

Kanban groups applications into all seven status columns. Accessible select or menu controls and keyboard actions are the canonical way to move an application. Drag-and-drop can be added later only as an enhancement.

A drag-only interaction was rejected because it would not provide reliable keyboard, assistive-technology, or mobile access.

### 7. Define progress as pipeline distribution

The API computes the total and a count for every status. The UI presents counts and percentage distribution based on that total. It does not calculate a weighted success or completion score.

A weighted score was rejected because it would be arbitrary and could misrepresent job-search progress.

### 8. Preserve public isolation structurally and through tests

Job-application fields are not added to public profile, project, experience, credential, resume, or case-study contracts. No public route or navigation item is added. Regression tests create private job data and then verify that existing public APIs and pages expose none of it.

Filtering job data only during serialization was rejected because a structural separation is easier to audit and less likely to regress.

## Risks / Trade-offs

- `[Sensitive-data leakage]` -> Keep job applications out of all public controllers and contracts, apply the owner guard to every route, and add explicit isolation tests.
- `[Stale table, Kanban, or dashboard state]` -> Centralize query keys and invalidate every affected query after confirmed mutations.
- `[Free-form source and salary values become inconsistent]` -> Trim and length-validate them now; normalize only if actual usage demonstrates a need.
- `[Seven Kanban groups are cramped on small screens]` -> Use a responsive stacked or segmented presentation with stable status controls and no page-level horizontal dependency.
- `[An optimistic status update fails]` -> Restore the last confirmed status and display an application-safe error with retry.
- `[An additive schema change complicates rollback]` -> Keep the migration additive so the previous application image can run while the unused table and enum remain.

## Migration Plan

1. Add and validate the Prisma enum and table migration without modifying existing models.
2. Generate Prisma Client and run integration tests against an isolated PostgreSQL database.
3. Apply the production migration once with `prisma migrate deploy` before rolling out the API image.
4. Deploy the API and then the web application, and verify authentication, CRUD, dashboard counts, table and Kanban views, and public isolation.
5. If rollout fails, restore the previous immutable API and web images. Leave the additive table in place to preserve records and avoid a destructive rollback; remove it only through a later reviewed migration if necessary.
