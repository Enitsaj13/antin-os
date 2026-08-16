## Purpose

Admin authentication protects the single-owner AntinOS management surface while preserving public portfolio access for visitors.

## ADDED Requirements

### Requirement: Authenticate a single owner
The system SHALL provide a single-owner authentication flow for the AntinOS admin interface without offering public registration.

#### Scenario: Open login page
- **WHEN** an unauthenticated visitor opens `/admin/login`
- **THEN** the system displays an admin login page

#### Scenario: Reject public registration
- **WHEN** a visitor looks for account creation or registration in the admin interface
- **THEN** the system provides no public registration flow

#### Scenario: Log in with valid owner credentials
- **WHEN** the owner submits valid credentials on `/admin/login`
- **THEN** the system authenticates the owner and creates an authenticated session

#### Scenario: Reject invalid credentials safely
- **WHEN** a login attempt provides an invalid identifier or secret
- **THEN** the system rejects the attempt with a generic invalid-credentials response that does not reveal which field was wrong

#### Scenario: Rate-limit repeated login failures
- **WHEN** repeated failed login attempts exceed the configured limit
- **THEN** the system temporarily rejects additional login attempts with a rate-limit response

### Requirement: Maintain secure admin sessions
The system SHALL allow authenticated owners to restore and end sessions while avoiding sensitive token storage in browser localStorage.

#### Scenario: Restore existing session
- **WHEN** an authenticated owner reloads the admin interface with a valid existing session
- **THEN** the system restores the owner session without requiring another login

#### Scenario: Reject missing session
- **WHEN** session restoration is requested without a valid session
- **THEN** the system reports the user as unauthenticated

#### Scenario: Log out
- **WHEN** the authenticated owner chooses to log out
- **THEN** the system ends the session and prevents subsequent management access with the ended session

#### Scenario: Avoid localStorage tokens
- **WHEN** the admin interface stores authentication state in the browser
- **THEN** it MUST NOT store sensitive authentication tokens or reusable secrets in `localStorage`

#### Scenario: Use secure production cookie or token handling
- **WHEN** the system runs in production mode
- **THEN** authentication cookies or tokens are configured to reduce script access, cross-site leakage, and cleartext transport risks

### Requirement: Protect admin web routes
The system SHALL protect every admin web route except the login route.

#### Scenario: Redirect unauthenticated admin route
- **WHEN** an unauthenticated visitor opens any `/admin/*` route other than `/admin/login`
- **THEN** the system redirects the visitor to `/admin/login`

#### Scenario: Preserve requested admin destination
- **WHEN** an unauthenticated visitor is redirected from a requested admin route to `/admin/login`
- **THEN** a successful login returns the owner to the originally requested admin route

#### Scenario: Open protected route when authenticated
- **WHEN** an authenticated owner opens a protected `/admin/*` route
- **THEN** the system displays the requested admin page

#### Scenario: Handle expired session on admin route
- **WHEN** an admin session expires or becomes invalid while using a protected admin route
- **THEN** the system redirects the owner to `/admin/login` before allowing further management actions

#### Scenario: Keep public routes outside admin protection
- **WHEN** a visitor opens `/projects`, `/projects/:slug`, or other public portfolio routes
- **THEN** the admin authentication gate does not block the public route

### Requirement: Protect management API routes
The system SHALL require a valid owner session for all management API routes and return HTTP 401 when authentication is missing or invalid.

#### Scenario: Reject unauthenticated management request
- **WHEN** a request without valid authentication calls a management API route
- **THEN** the system returns HTTP 401 without performing the management operation

#### Scenario: Reject invalid authentication
- **WHEN** a request with invalid or expired authentication calls a management API route
- **THEN** the system returns HTTP 401 without performing the management operation

#### Scenario: Allow authenticated owner management request
- **WHEN** an authenticated owner calls a management API route
- **THEN** the system allows the request to proceed to normal validation and business behavior

#### Scenario: Keep public APIs accessible
- **WHEN** any visitor calls `GET /public/profile`, `GET /public/projects`, or `GET /public/projects/:slug`
- **THEN** the system does not require admin authentication for the request
