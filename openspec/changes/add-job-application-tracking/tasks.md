## 1. Data model and shared contracts

- [x] 1.1 Add the Prisma `JobApplicationStatus` enum and `JobApplication` model with an additive migration, indexes for common status and date queries, and regenerated Prisma Client.
- [x] 1.2 Add shared create, update, response, list-filter, and dashboard-summary contracts for job applications.
- [x] 1.3 Add authoritative API validation for required text, nullable field clearing, supported statuses, absolute HTTP or HTTPS URLs, valid dates, text limits, and non-empty updates.

## 2. Protected API

- [x] 2.1 Implement private create, list, search, filter, detail, update, delete, and dashboard aggregation service behavior.
- [x] 2.2 Add owner-authenticated job-application controller routes with consistent HTTP 401, 404, and validation errors and no public controller.
- [x] 2.3 Register the job-application module without changing existing public profile, project, experience, credential, resume, or case-study contracts.
- [x] 2.4 Add service and controller tests for CRUD, every status, default status, validation, nullable clearing, unchanged dates on status updates, filtering, search, counts, authentication, and not-found behavior.
- [x] 2.5 Add PostgreSQL integration tests that prove private persistence and verify existing public endpoints never expose job-application data.

## 3. Web data layer

- [x] 3.1 Add API-client methods, centralized query keys, and TanStack Query hooks for list, detail, dashboard, and all mutations.
- [x] 3.2 Invalidate list, detail, and dashboard queries after successful mutations and restore the last confirmed status after failed Kanban updates.
- [x] 3.3 Map private API errors into safe form, retry, and mutation feedback while retaining unsaved form input.

## 4. Admin interface

- [x] 4.1 Add protected Job Applications navigation and routes for the dashboard, table, Kanban, create, and edit workflows.
- [x] 4.2 Build the dashboard total, per-status counts, and pipeline-distribution progress with populated and empty states.
- [x] 4.3 Build accessible create and edit forms for all supported fields with validation and pending, success, and error states.
- [x] 4.4 Build the compact desktop table and responsive mobile stacked list with search, status filters, loading, empty, error, retry, edit, and delete actions.
- [x] 4.5 Build the responsive Kanban view with seven status groups and keyboard-accessible status-change controls that remain stable on failed updates.
- [x] 4.6 Add permanent deletion confirmation that identifies the company and position and preserves the record when deletion fails.
- [x] 4.7 Add web tests for protected routes, forms, table and Kanban switching, status changes, dashboard summaries, responsive states, pending controls, failures, and accessibility.

## 5. End-to-end verification

- [x] 5.1 Add Playwright coverage for authenticated create, edit, table search and filtering, Kanban status change, dashboard refresh, and deletion.
- [x] 5.2 Prove unauthenticated visitors cannot access any job-application workflow or API and public APIs and pages never expose job-hunt data.
- [x] 5.3 Run formatting, linting, typechecking, unit and integration tests, API and web production builds, Playwright, and strict OpenSpec validation.
