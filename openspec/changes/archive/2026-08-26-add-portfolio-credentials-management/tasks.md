## 1. Database and Shared Contracts

- [x] 1.1 Add Prisma models and migration for `PortfolioSettings`, education records, and certification records.
- [x] 1.2 Ensure `PortfolioSettings` uses singleton key `owner` and defaults `showEducation` and `showCertifications` to `false`.
- [x] 1.3 Generate the Prisma client after the schema change.
- [x] 1.4 Add shared credential and portfolio-settings types/constants for API and web usage.
- [x] 1.5 Add API-client methods for managed settings, managed credentials, public education, and public certifications.

## 2. API Implementation

- [x] 2.1 Add a credentials API module/service/controller structure.
- [x] 2.2 Add DTO validation for education create/update, certification create/update, publication changes, reorder requests, and visibility settings.
- [x] 2.3 Implement settings retrieval that creates or returns default hidden settings when no settings record exists.
- [x] 2.4 Implement protected settings update behavior for `showEducation` and `showCertifications`.
- [x] 2.5 Implement protected education CRUD, publish/unpublish, list, detail, delete, and reorder behavior.
- [x] 2.6 Implement protected certification CRUD, publish/unpublish, list, detail, delete, and reorder behavior.
- [x] 2.7 Ensure all credentials management routes require owner authentication and return HTTP 401 without a valid session.
- [x] 2.8 Implement public education retrieval that returns records only when education is enabled and records are published.
- [x] 2.9 Implement public certification retrieval that returns records only when certifications are enabled and records are published.
- [x] 2.10 Ensure visibility toggles never create, delete, publish, or unpublish credential records.

## 3. Web Admin Implementation

- [x] 3.1 Add credentials query and mutation hooks using existing TanStack Query patterns.
- [x] 3.2 Add `/admin/credentials` route and admin navigation entry.
- [x] 3.3 Add visibility toggles at the top of the credentials admin page.
- [x] 3.4 Add helper text explaining that disabled sections are hidden publicly without deleting entries.
- [x] 3.5 Disable visibility toggles and prevent duplicate requests while updates are pending.
- [x] 3.6 Show success and error feedback after visibility-setting changes.
- [x] 3.7 Add education list, create/edit form, publish/unpublish, delete confirmation, reorder, loading, empty, error, and retry states.
- [x] 3.8 Add certification list, create/edit form, publish/unpublish, delete confirmation, reorder, loading, empty, error, and retry states.
- [x] 3.9 Keep education and certification management usable when their public sections are disabled.
- [x] 3.10 Ensure credentials admin forms, dialogs, toggles, errors, and reorder controls are keyboard accessible.
- [x] 3.11 Ensure credentials admin desktop and mobile layouts remain readable without horizontal scrolling.

## 4. Public Homepage Implementation

- [x] 4.1 Add public education and public certification query hooks.
- [x] 4.2 Load public education and certification data on the public homepage without calling management APIs.
- [x] 4.3 Render the Education section only when public education retrieval returns at least one record.
- [x] 4.4 Render the Certifications section only when public certification retrieval returns at least one record.
- [x] 4.5 Omit disabled, empty, and unpublished-only credentials sections from the homepage.
- [x] 4.6 Preserve the rest of the homepage when credential loading fails and provide accessible retry behavior where shown.
- [x] 4.7 Ensure public credentials sections are responsive and accessible on mobile and desktop.

## 5. API Tests

- [x] 5.1 Add tests proving default settings hide education and certifications.
- [x] 5.2 Add tests proving authenticated owners can update education and certification visibility independently.
- [x] 5.3 Add tests proving duplicate or unauthenticated management operations are rejected as appropriate.
- [x] 5.4 Add tests proving managed education and certification records remain accessible when public sections are disabled.
- [x] 5.5 Add tests proving public education returns no records when disabled, when empty, and when entries are unpublished.
- [x] 5.6 Add tests proving public education returns only published records when enabled.
- [x] 5.7 Add tests proving public certifications return no records when disabled, when empty, and when entries are unpublished.
- [x] 5.8 Add tests proving public certifications return only published records when enabled.
- [x] 5.9 Add tests proving disabling and re-enabling sections preserves records and publication states.

## 6. Web and Playwright Tests

- [x] 6.1 Add web tests for credentials admin visibility toggles, pending state, success feedback, and error feedback.
- [x] 6.2 Add web tests for admin education and certification management while sections are disabled.
- [x] 6.3 Add web tests for homepage education visibility combinations: disabled, enabled empty, enabled unpublished-only, and enabled published.
- [x] 6.4 Add web tests for homepage certification visibility combinations: disabled, enabled empty, enabled unpublished-only, and enabled published.
- [x] 6.5 Add focused Playwright coverage for owner login, credentials visibility toggles, published credentials, and public homepage display/omission behavior.
- [x] 6.6 Verify keyboard access for the credentials toggles, forms, dialogs, and homepage credential links in focused browser coverage.

## 7. Verification

- [x] 7.1 Run Prisma migration locally.
- [x] 7.2 Run `pnpm test`.
- [x] 7.3 Run `pnpm --filter api build`.
- [x] 7.4 Run `pnpm --filter web build`.
- [x] 7.5 Run focused Playwright credentials/homepage coverage.
- [x] 7.6 Run `pnpm exec openspec validate add-portfolio-credentials-management --strict`.
