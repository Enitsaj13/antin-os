## Context

The app already has a single-owner admin surface, protected management APIs, public profile/projects APIs, and a public homepage. Experience management should follow the existing portfolio projects pattern: owner-authenticated management endpoints, public read-only endpoints, shared types/API client functions, TanStack Query hooks, and responsive admin/public web views.

This change introduces new persistent data and a new admin section, so it needs a database migration, API contracts, frontend management UI, public homepage integration, and broad tests.

## Goals / Non-Goals

**Goals:**

- Add a first-class Experience model with ordered, publishable professional work entries.
- Protect all management operations with existing owner authentication.
- Expose only published experience entries through public retrieval.
- Let the owner reorder entries and see that order reflected publicly.
- Add a chronological timeline to the public homepage.
- Keep validation authoritative in the API while adding useful client-side validation.

**Non-Goals:**

- No education, certifications, CV upload, AI generation, or job application tracking.
- No multi-owner or organization-level experience management.
- No public detail page per experience entry unless a later change asks for it.
- No drag-and-drop requirement; keyboard-accessible up/down reorder controls are sufficient for this change.

## Decisions

1. Store achievements and technologies as string arrays on the Experience model.

   Rationale: Entries are portfolio content, not independently managed child resources. Arrays keep CRUD simple and match the existing project `techStack` shape.

   Alternative considered: Separate Achievement and ExperienceTechnology tables. That adds relationship complexity without a current need for individual item identity.

2. Use `displayOrder` as the primary ordering field.

   Rationale: The owner needs explicit ordering independent of dates. Public retrieval can sort by `displayOrder`, with reverse chronological start date as a deterministic tie-breaker.

   Alternative considered: Sort only by dates. That prevents manual curation and does not satisfy reorder requirements.

3. Implement reorder as a batch management operation.

   Rationale: A single ordered-id payload avoids repeated one-row updates and keeps list ordering consistent after a reorder.

   Alternative considered: PATCH each entry's order individually. That is simpler per endpoint but creates transient duplicate or inconsistent ordering during multi-step changes.

4. Represent current roles with `isCurrent` plus nullable `endDate`.

   Rationale: This directly supports "Present" timeline display while preserving a real end date for past roles. Validation enforces that current roles cannot have an end date.

   Alternative considered: Infer current role from missing end date. That loses the distinction between intentionally current and incomplete data.

5. Add `/admin/experience` and reuse the existing admin navigation style.

   Rationale: Experience is a peer to profile and projects in the portfolio admin surface. A dedicated route keeps the interface scannable and avoids overloading project management.

   Alternative considered: Add experience controls to the profile admin page. That would make profile management dense and less focused.

6. Render the public homepage timeline from the public experience list.

   Rationale: The homepage should not call management APIs and should expose only published content. Reusing public retrieval preserves the privacy boundary.

   Alternative considered: Add a combined homepage endpoint. It may be useful later, but this change can compose existing and new public endpoints on the client.

## Risks / Trade-offs

- [Risk] Array fields make individual achievement reordering less structured. -> Mitigation: Keep achievement ordering inside the form text/list control; add child tables only if entries need independent identity later.
- [Risk] Batch reorder can fail after the user has visually moved entries. -> Mitigation: keep the previous order until the mutation succeeds or refetch after failure and show the API error.
- [Risk] Date handling can drift if full datetimes are used for month/year roles. -> Mitigation: store dates consistently as ISO date values and display them using a single formatting helper.
- [Risk] Homepage now depends on another public request. -> Mitigation: make experience loading/error/empty states independent so profile and project content can still render.
- [Risk] Reorder controls can be inaccessible if implemented as pointer-only movement. -> Mitigation: use keyboard-operable move up/down buttons with clear labels.

## Migration Plan

1. Add the Experience model and generate/apply the Prisma migration.
2. Add shared experience types and API client functions.
3. Add protected API DTOs, service, controller, module wiring, and tests.
4. Add public experience retrieval API behavior and tests.
5. Add web query/mutation hooks and admin experience views.
6. Add the public homepage timeline using public experience data.
7. Add unit and Playwright coverage for admin CRUD/reorder and public timeline behavior.
8. Run format, tests, API build, web build, Playwright, and OpenSpec validation.

Rollback: remove the web routes/components/hooks, remove API module wiring, and revert the database migration if no production data has been created. If data exists, keep the table until data export/deletion is handled manually.
