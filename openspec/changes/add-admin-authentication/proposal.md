## Why

The AntinOS admin surface currently exposes profile and project management without an owner authentication boundary. Adding single-owner authentication lets the portfolio admin become safe to run beyond local-only development while keeping public portfolio endpoints available to visitors.

## What Changes

- Add an owner-only login page at `/admin/login` with no public registration flow.
- Add login, logout, session restore, invalid-session handling, and return-to-requested-admin-page behavior.
- Protect every `/admin/*` route except `/admin/login`.
- Protect all management API routes for profile and projects, including project image upload setup and profile picture upload/removal.
- Keep `GET /public/profile`, `GET /public/projects`, and `GET /public/projects/:slug` public.
- Return HTTP 401 for missing or invalid authentication on protected API routes.
- Use secure cookie/session handling instead of storing sensitive tokens in `localStorage`.
- Add login rate limiting and safe invalid-credential responses.
- Add frontend and backend tests for unauthenticated denial, authenticated owner access, session restore, login/logout, and public endpoint access.

## Capabilities

### New Capabilities

- `admin-authentication`: Single-owner authentication, session lifecycle, admin route protection, secure cookie handling, and login rate limiting.

### Modified Capabilities

- `portfolio-profile`: Management profile routes require owner authentication while public profile retrieval remains public.
- `portfolio-projects`: Management project routes and project image upload setup require owner authentication while public project retrieval remains public.

## Impact

- Affected API code: Nest auth module/guards, profile controller, projects controller, shared app setup, tests, and environment configuration.
- Affected web code: route parsing, login page, admin auth/session query state, API client credential handling, protected admin route redirects, logout action, tests, and optional E2E coverage.
- Affected data/config: owner credential secret(s), session signing secret, cookie options, login rate-limit configuration, and documentation for local setup.
- No public registration, multi-user roles, password reset, OAuth, or public portfolio access changes are included.
