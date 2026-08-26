## 1. Data Model And Contracts

- [x] 1.1 Add `ProjectCaseStudy` to the Prisma schema with a unique one-to-one `projectId` relation, narrative fields, ordered text arrays, `isPublic`, and timestamps.
- [x] 1.2 Add a Prisma migration that creates the case-study table, default unpublished state, unique project relation, and safe project-deletion cleanup behavior.
- [x] 1.3 Regenerate Prisma client and confirm existing project records remain valid without case studies.
- [x] 1.4 Add shared case-study types for managed responses, public responses, create input, update input, publication input, and ordered text entries.
- [x] 1.5 Extend project detail types so managed/public project detail can include an optional case-study payload where allowed.

## 2. API Implementation

- [x] 2.1 Add case-study DTO validation for required text, optional clearable fields, ordered arrays, empty updates, and publication changes.
- [x] 2.2 Add response mapping that preserves ordered responsibilities, challenges, and outcomes and excludes draft content from public responses.
- [x] 2.3 Implement authenticated project-scoped case-study create, read, update, publish, unpublish, and delete behavior.
- [x] 2.4 Return consistent not-found errors for missing projects or missing case studies where applicable.
- [x] 2.5 Return conflict errors when creating a second case study for the same project.
- [x] 2.6 Extend public project detail retrieval to include `caseStudy` only when the project and case study are both public.
- [x] 2.7 Ensure public project list retrieval remains summary-only and never exposes draft case-study content.
- [x] 2.8 Ensure project deletion removes any associated case study without leaving orphaned data.

## 3. API Client And Server State

- [x] 3.1 Add API-client methods for project-scoped case-study create, read, update, publish, unpublish, and delete operations.
- [x] 3.2 Add TanStack Query hooks for managed case-study detail and public project detail with optional case-study data.
- [x] 3.3 Add mutation hooks that invalidate project detail and case-study queries after successful case-study mutations.
- [x] 3.4 Handle validation, conflict, not-found, and authentication errors consistently in client utilities.

## 4. Admin UI

- [x] 4.1 Add a case-study section to the existing project edit workflow without changing unrelated project form behavior.
- [x] 4.2 Display no-case-study, draft, and published status states for the current project.
- [x] 4.3 Build fields for context, problem, role, approach, and lessons learned.
- [x] 4.4 Build repeatable controls for responsibilities, challenges, and outcomes with add, remove, and reorder actions.
- [x] 4.5 Add save-draft, publish, unpublish, and remove actions with duplicate-submission protection.
- [x] 4.6 Add an incomplete-case-study warning before publish while keeping API validation authoritative.
- [x] 4.7 Add permanent-removal confirmation that names the case study or project being affected.
- [x] 4.8 Preserve form input on API failures and display accessible success, validation, error, loading, empty, and retry states.
- [x] 4.9 Verify the admin UI remains responsive, keyboard operable, and visually consistent with existing AntinOS admin surfaces.

## 5. Public Project Detail UI

- [x] 5.1 Render published case-study sections on `/projects/:slug` for context, problem, role, approach, responsibilities, challenges, outcomes, and lessons learned.
- [x] 5.2 Preserve the current basic project detail page when no published case study is returned.
- [x] 5.3 Keep draft case-study existence invisible in public UI and public metadata.
- [x] 5.4 Preserve ordered responsibilities, challenges, and outcomes in the public display.
- [x] 5.5 Update route metadata when published case-study content is available.
- [x] 5.6 Verify the public case-study layout is responsive, scannable, accessible, and free of horizontal scrolling or text overflow.

## 6. Tests

- [x] 6.1 Add API tests for duplicate creation, missing projects, missing case studies, validation errors, empty updates, publication changes, ordered arrays, and project-deletion cleanup.
- [x] 6.2 Add API tests for public exposure combinations: public project/public case study, public project/draft case study, private project/public case study, and no case study.
- [x] 6.3 Add web tests for admin create, edit, save draft, publish, unpublish, remove, failure preservation, repeatable-entry ordering, and status states.
- [x] 6.4 Add web tests for public detail rendering with and without published case studies and for draft-content privacy.
- [x] 6.5 Add Playwright coverage for the project edit case-study workflow and the public project detail publication combinations.
- [x] 6.6 Update existing project tests only where the optional case-study response shape requires it.

## 7. Verification

- [x] 7.1 Run the Prisma migration locally.
- [x] 7.2 Run formatting and linting checks.
- [x] 7.3 Run API and web unit tests.
- [x] 7.4 Run API and web builds.
- [x] 7.5 Run the relevant Playwright E2E tests.
- [x] 7.6 Run `pnpm exec openspec validate add-project-case-studies --strict`.
- [x] 7.7 Confirm no draft case-study content appears in public API responses, public UI, or metadata.
