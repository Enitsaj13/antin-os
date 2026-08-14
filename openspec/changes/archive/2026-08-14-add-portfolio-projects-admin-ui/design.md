## Context

See `proposal.md` for motivation. The current web app renders the profile admin interface at the root and already has API client functions plus TanStack Query hooks for profile and project data. Project API behavior already covers create, list, read, update, delete, default-private creation, duplicate-slug conflicts, URL validation, tech-stack validation, and public/private retrieval.

The admin UI work should stay inside the Vite/React web app and should not introduce authentication, public portfolio pages, image upload, project ordering, or API contract changes.

## Goals / Non-Goals

**Goals:**

- Introduce a small admin shell with Profile and Projects navigation.
- Route the existing profile experience to `/admin/profile`.
- Add projects list, create, edit, and delete UI flows backed by existing project API client and TanStack Query hooks.
- Keep client-side validation helpful without duplicating or replacing API authority.
- Provide responsive, keyboard-accessible list, form, toggle, dialog, error, retry, and pending states.
- Add focused frontend tests and keep the web build passing.

**Non-Goals:**

- No authentication or route protection.
- No project image file upload.
- No drag-and-drop ordering.
- No public portfolio rendering.
- No API, database, or shared contract changes unless implementation reveals a missing client-side type/export that blocks using the existing contract.

## Decisions

### Use a lightweight in-app route switch

Use the browser path to switch between admin views:

- `/` redirects or defaults to `/admin/profile`.
- `/admin/profile` renders the existing profile management UI.
- `/admin/projects` renders the projects list.
- `/admin/projects/new` renders the create form.
- `/admin/projects/:id/edit` renders the edit form.

Rationale: the app currently has one admin surface and no router dependency. A lightweight route switch avoids adding React Router for a small set of static admin routes.

Alternative considered: add React Router. That would be reasonable if navigation grows, but it adds dependency and migration work that is not needed for the requested routes.

### Extract existing profile UI before adding projects UI

Move the current `App` profile form behavior into a focused profile admin component, then make `App` responsible for shell/navigation/routing.

Rationale: this keeps the profile behavior stable and prevents project-management state from making `App` harder to test.

Alternative considered: keep profile and project UI in one component. That would increase coupling between unrelated admin workflows.

### Reuse existing project hooks and invalidate broad project keys

Use the existing project query and mutation hooks as the server-state boundary. After create, update, and delete, invalidate project list/detail keys through the existing project key hierarchy.

Rationale: query invalidation keeps list/detail screens consistent with API state and matches the existing mutation pattern.

Alternative considered: manually patch every affected cache entry. That is more efficient for some flows, but increases correctness risk across filters and detail pages.

### Keep filters client-side

Load the managed project list once and filter all/public/unpublished projects in the UI.

Rationale: the API list endpoint already returns all managed projects regardless of publication state. Client-side filtering avoids API changes and keeps the filters responsive.

Alternative considered: add query parameters to the API. That changes the API contract and is unnecessary for the current expected project volume.

### Model tech stack as editable text chips or lines

Represent tech stack input in a way that produces a trimmed non-empty string array for the existing API contract. The UI can use comma-separated input, line-based input, or chips, as long as empty entries are rejected and the submitted value is an array.

Rationale: the API contract is array-based, while the UI needs a simple and testable editing experience.

Alternative considered: use a free-form single text field and submit a string. That would not match the existing API contract.

### Treat publishing warnings as a confirm-before-submit step

When `isPublic` is true and optional project information is incomplete, require an explicit confirmation before submitting the save request. Incomplete optional information means at least one of description, repository URL, live URL, or image URL is empty.

Rationale: the API allows public projects with optional fields, so the warning is a UX safeguard rather than a validation failure.

Alternative considered: block publishing incomplete projects. That would create stricter frontend behavior than the API contract and conflict with "warn before publishing".

### Preserve API authority for validation

Run client-side validation for fast feedback, but display API validation/conflict responses whenever the server rejects create or update.

Rationale: client validation improves usability, but the API remains the source of truth for required fields, slug uniqueness, URL format, and tech-stack validity.

Alternative considered: fully mirror API validation in the frontend. That risks drift and gives a false sense of authority.

## Risks / Trade-offs

- Route switching without a router may become limiting as admin navigation grows. Mitigation: isolate route parsing and navigation helpers so a future router migration is localized.
- Client-side filtering can become inefficient with a very large project list. Mitigation: the current portfolio project volume is expected to be small; API filtering can be proposed later if needed.
- Duplicate-slug error parsing depends on current API error shape. Mitigation: handle explicit 409 status and fallback to the raw API message when structure is not recognized.
- Publication warnings may be interpreted as validation. Mitigation: use clear copy that the project can still be published after confirmation.
- Existing profile tests may become brittle during extraction. Mitigation: preserve profile behavior through focused tests before adding project-specific tests.

## Migration Plan

1. Extract the profile interface without changing behavior.
2. Add admin shell navigation and route handling.
3. Add project list and filter views using existing project queries.
4. Add create/edit forms and mutation handling.
5. Add deletion confirmation and mutation handling.
6. Add responsive/accessibility styling and tests.
7. Run frontend tests and production web build.

Rollback is straightforward because the change is frontend-only: revert the web app changes to return the profile UI to the root route.
