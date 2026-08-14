## Why

Portfolio project records already have API support, but there is no admin UI for creating, editing, filtering, publishing, or deleting projects. Adding a projects admin surface lets the owner manage portfolio content from the web app instead of calling API endpoints manually.

## What Changes

- Add admin navigation with Profile and Projects destinations.
- Move the current profile management interface to `/admin/profile`.
- Add a projects management list at `/admin/projects` with loading, empty, error, retry, filter, edit, and delete states.
- Add project creation and editing routes at `/admin/projects/new` and `/admin/projects/:id/edit`.
- Add project forms for title, slug, summary, description, tech stack, repository URL, live URL, image URL, and publication state.
- Generate suggested slugs from titles while preserving manual slug edits.
- Add client-side validation for required fields, kebab-case slugs, URLs, and tech stack while keeping API validation authoritative.
- Add publication warnings before making incomplete project information public.
- Add confirmation behavior for permanent deletion and preserve project records when deletion fails.
- Use existing TanStack Query project hooks and invalidate list/detail queries after mutations.
- Add responsive and accessible admin UI behavior plus frontend tests and web build verification.

Out of scope:

- Authentication implementation.
- Project image file upload.
- Drag-and-drop project ordering.
- Public portfolio page.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `portfolio-projects`: Add admin UI requirements for navigating project management, listing and filtering projects, creating and editing project records, publishing with warnings, deleting with confirmation, handling server state, and meeting responsive/accessibility expectations.

## Impact

- Affects the Vite/React web app routing and admin layout.
- Uses the existing API client and TanStack Query project hooks.
- Exercises existing project API validation and conflict responses.
- Adds frontend unit/integration tests for project admin flows.
- Does not change the API contract, authentication, storage behavior, or public portfolio surfaces.
