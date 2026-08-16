## Context

See `proposal.md` for motivation. The current Vite/React web app has a lightweight in-app route switch, admin profile/project surfaces, existing public project API client functions, and TanStack Query hooks for `usePublicProjects` and `usePublicProject`. The project API already enforces publication visibility through `GET /public/projects` and `GET /public/projects/:slug`.

## Goals / Non-Goals

**Goals:**

- Add visitor-facing `/projects` and `/projects/:slug` routes without introducing a router dependency.
- Reuse existing public project query hooks as the server-state boundary.
- Present public project summaries and detail fields with clear loading, empty, not-found, retry, and API-error states.
- Keep unpublished project data hidden by never calling managed project endpoints from public routes.
- Add focused frontend tests and keep the web build passing.

**Non-Goals:**

- No API contract changes.
- No admin project-management changes.
- No authentication or authorization changes.
- No project image upload or image transformation.
- No custom ordering, filtering, or search on the public listing.

## Decisions

### Extend the existing lightweight route switch

Add route parsing for `/projects` and `/projects/:slug` alongside the existing admin routes.

Rationale: the app already uses a small route switch, and this change adds only two public route shapes. A router dependency can be introduced later if route complexity grows.

Alternative considered: add React Router now. That would be reasonable for a larger public site, but it adds migration work that is not needed for this small route set.

### Use public project hooks only

Public pages will use `usePublicProjects` and `usePublicProject`; they will not call `useProjects` or `useProject`.

Rationale: unpublished visibility belongs to the API contract, and using only public endpoints prevents accidental frontend exposure of managed data.

Alternative considered: load managed projects and filter client-side. That would risk exposing unpublished records in the browser and conflicts with the public API boundary.

### Treat not-found separately from generic API errors

The detail page should identify not-found responses and render a not-found state with a route back to `/projects`; other failures should render a retryable API-error state.

Rationale: not-found is expected visitor behavior for unpublished or missing slugs, while server/network errors should invite retry.

Alternative considered: show one generic error state for all failures. That is simpler but less useful and obscures unpublished/missing slug behavior.

### Keep optional project fields conditional

Repository, live-demo, image, and description should render only when present.

Rationale: these fields are optional in the API contract and public pages should not show empty placeholders or broken links.

Alternative considered: require all optional fields for public rendering. That would impose stricter frontend behavior than the API and admin publication model.

## Risks / Trade-offs

- Route parsing may become harder to maintain as public pages grow -> keep route parsing isolated so a future router migration is localized.
- API error shape may not expose a reliable status code -> use status-aware parsing where available and fall back to message matching for not-found detection.
- Project images can be remote URLs with varied aspect ratios -> use responsive image containers with stable dimensions and alt text derived from the project title.
- Empty optional fields may make detail pages sparse -> render only available actions/content and keep the layout balanced.

## Migration Plan

1. Add public route parsing and navigation helpers for `/projects` and `/projects/:slug`.
2. Add public projects listing UI backed by `usePublicProjects`.
3. Add public project detail UI backed by `usePublicProject`.
4. Add loading, empty, not-found, API-error, retry, responsive, and accessible states.
5. Add frontend tests for public listing/detail behavior.
6. Run `pnpm --filter web test`, `pnpm --filter web build`, and strict OpenSpec validation.

Rollback is frontend-only: remove the new public route handling and public project components while leaving the existing API and admin project surfaces intact.
