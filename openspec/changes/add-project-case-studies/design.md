## Context

See `proposal.md` for motivation. Project management already exists across Prisma, NestJS controllers/services, shared contracts, the API client package, TanStack Query hooks, a Vite React admin UI, public project listing/detail routes, and Playwright coverage. Case studies extend existing project behavior and must preserve current project APIs and public pages when no case study exists.

## Goals / Non-Goals

**Goals:**

- Model case studies as optional one-to-one data attached to existing projects.
- Keep management behavior authenticated and public behavior privacy-preserving.
- Make the project edit workflow the single admin place for case-study authoring.
- Preserve ordered repeatable entries without adding rich text, Markdown, uploads, or versioning.
- Keep public project detail pages useful with or without a published case study.

**Non-Goals:**

- No AI case-study generation or learning/skill tracking.
- No screenshot gallery, file upload, comments, analytics, reactions, or multi-collaborator workflows.
- No redesign of project admin, public project listing, homepage, or unrelated portfolio sections.

## Decisions

1. **Use a one-to-one `ProjectCaseStudy` model keyed by `projectId`.**
   - Rationale: The requirement allows one current case study per project and needs conflict behavior for duplicate creation.
   - Alternative considered: Add case-study fields directly to `Project`. Rejected because it would bloat basic project records and make draft/public privacy harder to reason about.

2. **Store repeatable responsibilities, challenges, and outcomes as ordered string arrays.**
   - Rationale: Ordered text entries are the only needed structure, and this matches the existing simple-list style used elsewhere in the app.
   - Alternative considered: Separate child rows with order indexes. Rejected for this version because there is no per-entry metadata, partial entry updates, or analytics requirement.

3. **Expose case-study management under the project-management domain.**
   - Rationale: Case studies are always attached to projects and fit naturally in the existing project edit workflow and project query invalidation.
   - Likely route shape: authenticated project-scoped endpoints such as `GET /projects/:projectId/case-study`, `POST /projects/:projectId/case-study`, `PATCH /projects/:projectId/case-study`, publication patch behavior, and delete behavior.
   - Alternative considered: A separate top-level `/case-studies` resource. Rejected because it adds navigation and identity complexity without supporting standalone case studies.

4. **Public project detail may include an optional `caseStudy` object, but project lists stay summary-only.**
   - Rationale: Case-study content is detailed and belongs on `/projects/:slug`; keeping lists small preserves current browsing behavior.
   - Alternative considered: Include case-study summaries in `GET /public/projects`. Rejected because it risks exposing draft-state hints and increases list response size.

5. **Publication checks require both project and case study to be public.**
   - Rationale: A published case study attached to a private project must remain private because the public project itself is unavailable.
   - Alternative considered: Automatically unpublish a case study when a project is made private. Rejected because it would surprise the owner and lose intentional case-study state.

6. **Warn, but do not block, publishing when optional detail is incomplete.**
   - Rationale: The API validation should enforce required content only; the admin UI can guide quality without preventing deliberate publication.
   - Alternative considered: API-level completeness enforcement. Rejected because “incomplete” is editorial and may change over time.

## Risks / Trade-offs

- **Array storage limits future per-entry metadata** -> If later entries need links, evidence, or timestamps, migrate repeatable arrays to child rows with explicit order.
- **Public response shape changes for project detail** -> Keep `caseStudy` optional so existing clients that ignore unknown fields continue to work.
- **Draft privacy regressions are easy to introduce** -> Add API, web, and E2E tests for all project/case-study publication combinations.
- **Admin project edit page could become too dense** -> Use a clearly separated case-study section with compact controls, status labels, and progressive empty/loading/error states.
- **Project deletion cleanup can fail if not transactional** -> Use relational cascade behavior or an explicit transaction so project deletion never leaves orphaned case studies.

## Migration Plan

1. Add the Prisma model and migration with a unique `projectId` relation and default unpublished state.
2. Regenerate Prisma client and keep existing project rows unchanged.
3. Add shared types/contracts and API client methods without changing existing project list contracts.
4. Add authenticated API behavior and tests before wiring UI.
5. Wire admin project edit case-study UI and public detail rendering.
6. Run migration locally and verify existing public/admin project behavior still passes.

Rollback: Revert the code and migration before production data depends on case studies. If already deployed with data, export case-study rows before dropping the table.
