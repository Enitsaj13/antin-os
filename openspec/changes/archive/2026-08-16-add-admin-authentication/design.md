## Context

See `proposal.md` for motivation. The current Nest API exposes management routes for profile and projects beside public routes in the same controllers. The Vite/React app uses client-side route parsing for `/admin/profile`, `/admin/projects`, project forms, and public project pages. API requests currently use `fetch`/`XMLHttpRequest` without explicit credential handling. There is no user model or authentication module today.

## Goals / Non-Goals

**Goals:**

- Add a single-owner authentication boundary without introducing multi-user account management.
- Protect management APIs and admin UI routes consistently.
- Use browser-safe session handling that avoids sensitive tokens in `localStorage`.
- Keep public portfolio endpoints and public pages unauthenticated.
- Make the local setup explicit through environment variables and docs.
- Keep the first implementation small enough for a personal project while leaving a path to stronger production hardening.

**Non-Goals:**

- Public registration, password reset, roles, teams, OAuth/social login, or account invitation.
- Reworking the portfolio data model beyond what is needed for authentication.
- Moving public portfolio pages behind authentication.
- Building a full identity provider integration in this change.

## Decisions

### Decision: Single owner configured by environment

Use environment-configured owner credentials for the first version:

- `ADMIN_USERNAME` or `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `AUTH_SESSION_SECRET`
- optional cookie/rate-limit tuning

The password stored in env must be a password hash, not plaintext. A small script or documented command should generate the hash.

Rationale: This project has one owner and no registration requirement. An env-backed owner avoids adding account tables, migrations, bootstrap user flows, and password-management UX before they are needed.

Alternative considered: Add an `AdminUser` table. That is more flexible, but it adds seed/setup complexity and password lifecycle questions that are outside the requested scope.

### Decision: Server-owned HTTP-only session cookie

Use a server-created session represented by an HTTP-only cookie. The frontend should request session state from the API instead of reading a token from browser storage.

Required cookie behavior:

- HTTP-only so scripts cannot read the session token.
- SameSite set for the local/API deployment model.
- Secure in production.
- Path scoped broadly enough for API requests that need the session.
- Clear expiration on logout.

Rationale: This satisfies the requirement not to store sensitive authentication tokens in `localStorage` and keeps session validation server-side.

Alternative considered: Bearer token in memory. It avoids cookie CSRF concerns but is less ergonomic for session restore and still needs careful refresh handling.

### Decision: Signed opaque session token with server validation

Represent the session as an opaque signed token containing only minimal claims such as subject and expiration. Validate signature and expiration on each protected API request.

Rationale: This keeps the implementation lightweight for a single-owner project and avoids database-backed session storage for v1.

Trade-off: Logout cannot revoke already-issued tokens without either clearing the browser cookie or adding server-side revocation/session storage. For this change, logout clears the cookie; future production hardening can add a session table or token version.

### Decision: Guard management routes, leave public routes explicit

Apply an authentication guard to:

- `GET /profile`
- `PUT /profile`
- `POST /profile/picture`
- `DELETE /profile/picture`
- `POST /projects`
- `GET /projects`
- `GET /projects/:idOrSlug`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `POST /projects/image-upload`

Do not apply the guard to:

- `GET /public/profile`
- `GET /public/projects`
- `GET /public/projects/:slug`

Rationale: Explicit route-level protection makes public/management behavior easy to verify in tests.

### Decision: Add auth API endpoints for session lifecycle

Expose auth endpoints for the frontend:

- login: validates credentials, applies rate limiting, creates cookie-backed session
- session: returns the current authenticated owner state or unauthenticated state
- logout: clears the session cookie

Rationale: The SPA needs session restore, login, and logout without reading cookie contents.

### Decision: Frontend redirects keep return path in URL state

When an unauthenticated user visits `/admin/projects/new`, redirect to `/admin/login` with a return path such as a query parameter. After login, navigate back to the original admin route if it is a safe local admin path; otherwise navigate to `/admin/profile`.

Rationale: The requested return behavior is visible and testable, and validating the return path avoids open redirect bugs.

### Decision: Generic failure messaging and simple rate limiting

Login failures should return a generic invalid-credentials error. Rate limiting should key by a conservative identifier such as request IP plus owner identifier and return a generic retry-later response when exceeded.

Rationale: This reduces account/credential enumeration and slows brute-force attempts without adding a large dependency surface.

## Risks / Trade-offs

- [Cookie/session behavior differs between local dev and production origins] -> Keep cookie options environment-aware and document local settings separately from production settings.
- [CSRF risk with cookie-based auth] -> Use SameSite cookies, avoid unsafe cross-site CORS, and consider CSRF tokens if the production deployment requires cross-site admin/API origins.
- [Env-backed owner password rotation is manual] -> Document hash generation and env update steps; future work can add a database-backed admin account if needed.
- [Stateless sessions limit server-side revocation] -> Logout clears the client cookie; future hardening can add session persistence or token versioning.
- [Rate limiting in memory resets on restart] -> Accept for local/personal deployment v1; future work can move counters to Redis or persistent storage.

## Migration Plan

1. Add owner auth environment variables to `apps/api/.env.example` and docs.
2. Implement auth module, session cookie helpers, login/session/logout endpoints, password verification, and rate limiting.
3. Apply auth guard to management profile/project routes only.
4. Update API client requests to include credentials.
5. Add web auth query/mutations, `/admin/login`, protected admin route redirects, session restore, and logout action.
6. Add backend and frontend tests for unauthenticated rejection, authenticated management, public access, redirects, session restore, and logout.
7. Run format, API tests, web tests, builds, and focused E2E.

Rollback: remove the auth guard and auth route integration if deployment blocks admin access unexpectedly, then revert the environment requirement. Public routes are intentionally unaffected.
