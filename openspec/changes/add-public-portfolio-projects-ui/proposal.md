## Why

Published portfolio projects are available through public API endpoints, but the web app does not yet provide public project browsing or detail pages. Adding these routes lets visitors discover published work without using the admin interface or API directly.

## What Changes

- Add a public project listing route at `/projects` backed by `GET /public/projects`.
- Add a public project detail route at `/projects/:slug` backed by `GET /public/projects/:slug`.
- Display public project title, summary, image, tech stack, description, repository link, and live-demo link where available.
- Show loading, empty, not-found, and API-error states for public project pages.
- Keep unpublished projects hidden by relying only on public API endpoints.
- Add responsive layouts and accessible project links/actions for public visitors.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `portfolio-projects`: Add public web UI requirements for listing and viewing published portfolio projects through existing public project APIs.

## Impact

- Affects the Vite/React web app route switch and public project UI.
- Uses existing API client functions and TanStack Query public project hooks.
- Adds frontend tests for public project list/detail routing, states, data display, and accessibility expectations.
- Does not change project API contracts, admin project management, authentication, or publication rules.
