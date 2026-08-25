## 1. Data Model and Shared Contracts

- [x] 1.1 Add a Prisma Experience model and migration with company, role, location, employment type, start date, optional end date, current-role state, summary, achievements, technologies, display order, publication state, and timestamps.
- [x] 1.2 Add shared Experience types, create/update/reorder inputs, and exported type definitions.
- [x] 1.3 Add API client functions for protected experience CRUD/reorder operations and public experience retrieval.
- [x] 1.4 Add TanStack Query keys, public/managed experience query hooks, and experience mutation hooks with invalidation.

## 2. API Implementation

- [x] 2.1 Add experience DTO validation for required fields, trimmed text, arrays, dates, current-role/end-date exclusivity, display order, and empty update requests.
- [x] 2.2 Add an experience response mapper that preserves ordered achievements and technologies and normalizes dates.
- [x] 2.3 Add an experience service for create, list, read, update, delete, reorder, and public retrieval.
- [x] 2.4 Add protected management routes for create, list, read, update, delete, and reorder using existing owner authentication.
- [x] 2.5 Add unauthenticated public retrieval that returns published entries only.
- [x] 2.6 Ensure new experience entries default to unpublished when publication state is omitted.
- [x] 2.7 Ensure public retrieval orders entries by display order with reverse chronological start-date tie-break.
- [x] 2.8 Wire the experience module into the API app.

## 3. Web Admin Experience Management

- [x] 3.1 Add `/admin/experience` route and Experience admin navigation alongside Profile and Projects.
- [x] 3.2 Add managed experience list UI showing company, role, employment type, date range, current-role state, publication state, and display order.
- [x] 3.3 Add loading, empty, error, and retry states for the managed experience list.
- [x] 3.4 Add create and edit forms for company, role, location, employment type, start date, end date, current-role state, summary, display order, and publication state.
- [x] 3.5 Add client-side validation for required fields, date rules, current-role/end-date exclusivity, and display order while keeping API validation authoritative.
- [x] 3.6 Add publish/unpublish controls and default new entries to unpublished.
- [x] 3.7 Add delete confirmation dialog naming the company and role, preserving entries and showing API errors when deletion fails.
- [x] 3.8 Add keyboard-accessible reorder controls and prevent duplicate submissions while reorder mutations are pending.
- [x] 3.9 Add responsive desktop and mobile layouts for list, form, dialogs, errors, and reorder controls.

## 4. Public Homepage Timeline

- [x] 4.1 Add public experience query usage to the homepage without calling management APIs.
- [x] 4.2 Add a chronological experience timeline showing company, role, location, employment type, date range, current-role state, summary, and any supplied achievements and technologies.
- [x] 4.3 Add loading, empty, API-error, and retry states for the homepage experience timeline.
- [x] 4.4 Ensure unpublished experience entries are never exposed on the homepage.
- [x] 4.5 Ensure timeline links, states, and content are responsive and accessible.

## 5. API Tests

- [x] 5.1 Add API tests for creating, listing, reading, updating, deleting, and reordering authenticated experience entries.
- [x] 5.2 Add API tests proving unauthenticated management requests return HTTP 401 and do not mutate experience data.
- [x] 5.3 Add API validation tests for missing fields, whitespace-only fields, invalid dates, current-role/end-date conflict, invalid display order, optional array validation, and empty updates.
- [x] 5.4 Add API tests proving new experience entries default to unpublished.
- [x] 5.5 Add public API tests proving only published entries are returned and ordered correctly.

## 6. Web and E2E Tests

- [x] 6.1 Add web tests for admin experience navigation, list states, create/edit form validation, publish/unpublish, delete confirmation, and reorder behavior.
- [x] 6.2 Add web tests proving duplicate submissions are disabled while mutations are pending.
- [x] 6.3 Add web tests for public homepage timeline content, ordering, loading, empty, error, retry, and unpublished-entry hiding.
- [x] 6.4 Add Playwright coverage for opening the public homepage timeline as an unauthenticated visitor.
- [x] 6.5 Add Playwright coverage for an authenticated owner managing and reordering experience entries with mocked APIs.

## 7. Verification

- [x] 7.1 Run `pnpm format:check`.
- [x] 7.2 Run `pnpm test:commit`.
- [x] 7.3 Run `pnpm --filter api build`.
- [x] 7.4 Run `pnpm --filter web build`.
- [x] 7.5 Run focused Playwright experience coverage.
- [x] 7.6 Run `pnpm exec openspec validate add-portfolio-experience-management --strict`.
