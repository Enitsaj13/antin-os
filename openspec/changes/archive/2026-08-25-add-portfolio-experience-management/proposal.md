## Why

AntinOS can show profile and project work, but it cannot yet manage or publish the owner's professional work history. Adding portfolio experience management lets the owner maintain a structured career timeline and surface published roles on the public homepage.

## What Changes

- Add an Experience database model for company, role, location, employment type, start date, optional end date, current-role state, summary, achievements, technologies, display order, and publication state.
- Add protected admin CRUD APIs and admin interfaces for creating, listing, editing, deleting, publishing, and reordering experience entries.
- Add public experience retrieval that returns only published entries.
- Display published experience as a chronological timeline on the public homepage.
- Validate required fields, date rules, current-role/end-date exclusivity, display order, publication state, and optional achievement/technology entries when supplied through API clients.
- Default new experience entries to unpublished.
- Include loading, empty, error, validation, confirmation, retry, API, web, and end-to-end test coverage.
- Do not add education, certifications, CV upload, AI generation, or job application tracking.

## Capabilities

### New Capabilities

- `portfolio-experience`: Experience data model, admin management, public retrieval, validation, ordering, publication, and related states.

### Modified Capabilities

- `public-portfolio-home`: Homepage behavior changes to include published experience as a chronological timeline.

## Impact

- Affected code: API Prisma schema/migrations, API controllers/services/DTOs/tests, shared types, API client functions, web admin navigation/forms/list/reorder UI, public homepage UI, web tests, and Playwright tests.
- Affected APIs: new protected experience management routes and new public experience retrieval route.
- Affected data: new Experience table with ordered, publishable experience entries.
- Security: management routes must use existing owner authentication; public routes must expose published entries only.
