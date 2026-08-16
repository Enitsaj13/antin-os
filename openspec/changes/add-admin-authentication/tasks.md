## 1. API Auth Foundation

- [x] 1.1 Add auth environment variables to `apps/api/.env.example` and development docs, including owner identifier, password hash, session secret, session TTL, cookie mode, and login rate-limit settings.
- [x] 1.2 Add a password-hash generation command or documented script so local setup never stores plaintext owner passwords.
- [x] 1.3 Add backend dependencies or utilities needed for password verification, signed session tokens, cookie parsing, and secure cookie serialization.
- [x] 1.4 Implement an auth module/service that loads owner auth config, validates credentials, creates signed expiring sessions, verifies sessions, and clears sessions.
- [x] 1.5 Implement login rate limiting with generic invalid-credential and retry-later responses.
- [x] 1.6 Add auth controller endpoints for login, session restore, and logout.

## 2. API Route Protection

- [x] 2.1 Implement an owner-auth guard that returns HTTP 401 for missing, expired, or invalid authentication.
- [x] 2.2 Apply the guard to `GET /profile`, `PUT /profile`, `POST /profile/picture`, and `DELETE /profile/picture`.
- [x] 2.3 Apply the guard to `POST /projects`, `GET /projects`, `GET /projects/:idOrSlug`, `PATCH /projects/:id`, `DELETE /projects/:id`, and `POST /projects/image-upload`.
- [x] 2.4 Verify `GET /public/profile`, `GET /public/projects`, and `GET /public/projects/:slug` remain unauthenticated.
- [x] 2.5 Update API CORS and cookie settings so local web requests can include the admin session cookie.

## 3. Web Auth Integration

- [x] 3.1 Add typed auth API-client functions for login, session restore, and logout with credentialed requests.
- [x] 3.2 Update existing API-client JSON, multipart, and binary upload requests so protected API calls include cookies where required.
- [x] 3.3 Add auth query and mutation hooks for session restore, login, and logout.
- [x] 3.4 Add `/admin/login` route and login page with generic invalid-credential and rate-limit error display.
- [x] 3.5 Protect every admin route except `/admin/login` with session restore and redirect unauthenticated visitors to login.
- [x] 3.6 Preserve a safe local return path so successful login sends the owner back to the requested admin page.
- [x] 3.7 Add logout action to the admin interface and clear authenticated UI state after logout.
- [x] 3.8 Ensure public routes such as `/projects` and `/projects/:slug` bypass admin authentication.

## 4. Backend Tests

- [x] 4.1 Add auth service/controller tests for valid login, invalid login, safe failure messages, rate limiting, session restore, expired/invalid sessions, and logout.
- [x] 4.2 Add profile API tests proving unauthenticated management requests return HTTP 401 and do not mutate profile or picture state.
- [x] 4.3 Add profile API tests proving authenticated owner requests can read, upsert, upload, and remove profile data through existing behavior.
- [x] 4.4 Add projects API tests proving unauthenticated management requests return HTTP 401 and do not create, update, delete, or create image upload URLs.
- [x] 4.5 Add projects API tests proving authenticated owner requests can manage projects through existing behavior.
- [x] 4.6 Add public API tests proving public profile and public projects endpoints remain accessible without authentication.

## 5. Frontend Tests

- [x] 5.1 Add tests proving unauthenticated visits to `/admin/profile`, `/admin/projects`, `/admin/projects/new`, and `/admin/projects/:id/edit` redirect to `/admin/login`.
- [x] 5.2 Add tests proving successful login returns to the originally requested admin route.
- [x] 5.3 Add tests proving invalid login and rate-limit errors are displayed without revealing credential-field details.
- [x] 5.4 Add tests proving authenticated owners can view profile and project admin routes after session restore.
- [x] 5.5 Add tests proving logout redirects protected admin access back to `/admin/login`.
- [x] 5.6 Add tests proving public project routes render without an admin session.

## 6. Verification

- [x] 6.1 Run `pnpm format:check`.
- [x] 6.2 Run `pnpm test:commit`.
- [x] 6.3 Run `pnpm --filter api build`.
- [x] 6.4 Run `pnpm --filter web build`.
- [x] 6.5 Run focused Playwright coverage for login redirect/session behavior, or document why existing E2E coverage is unchanged.
- [x] 6.6 Run `pnpm exec openspec validate add-admin-authentication --strict`.
