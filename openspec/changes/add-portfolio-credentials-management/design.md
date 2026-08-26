## Context

The app already uses Prisma-backed singleton records for owner-owned portfolio data, protected `/admin/*` management flows, public read endpoints, TanStack Query on the web app, and focused Playwright coverage around the public homepage/admin flows. Existing public homepage sections are composed from public APIs, so education and certification visibility should be enforced by API responses and then reflected by homepage rendering.

## Goals / Non-Goals

**Goals:**
- Add a persistent singleton settings record for public education and certification visibility.
- Add education and certification management while keeping public exposure controlled by both section visibility and individual publication state.
- Reuse current admin authentication, API validation, query invalidation, and responsive UI patterns.
- Make disabled public sections preserve all underlying records and publication states.

**Non-Goals:**
- Importing credentials from LinkedIn or other providers.
- File uploads for certificates, transcripts, or proof documents.
- Public detail pages for individual education or certification records.
- Replacing profile skills, project tech stacks, experience, or resume behavior.

## Decisions

1. Store visibility in a singleton `PortfolioSettings` model.

   Use the requested model shape with `singletonKey` defaulting to `owner` and `showEducation` / `showCertifications` defaulting to `false`. This matches the existing single-owner product model and avoids spreading section settings across education and certification tables.

   Alternative considered: store visibility flags on the profile record. This couples unrelated profile identity fields to portfolio composition settings and would make future public-section settings harder to organize.

2. Add separate education and certification models.

   Education and certifications have overlapping display needs but different domain fields. Separate tables keep validation, forms, and public responses explicit while still allowing a shared admin page and shared list/form components where useful.

   Alternative considered: a generic credential table with a type discriminator. That reduces tables but pushes field-specific validation into nullable columns and conditional logic.

3. Gate public data in the API, not only in the homepage.

   `GET /public/education` and `GET /public/certifications` should return an empty list when their section is disabled, and should always omit unpublished records. This prevents hidden records from being exposed to any public client even if a frontend bug renders incorrectly.

   Alternative considered: return settings and all published records to the homepage and let the client hide sections. That leaks section data over public APIs while relying on the web app for privacy.

4. Keep admin credentials management independent from public visibility.

   The authenticated owner can manage education and certifications even when the public sections are disabled. Visibility toggles only affect public read behavior and homepage rendering.

   Alternative considered: disabling the admin lists/forms when sections are hidden. That makes public visibility feel destructive and conflicts with the requirement to preserve records.

5. Use optimistic UI only where rollback is simple.

   Visibility toggles can show pending disabled controls and then refresh server state after success. Credential create/update/delete/reorder should follow existing mutation invalidation patterns and keep duplicate submissions blocked while pending.

   Alternative considered: aggressive optimistic updates for every credential mutation. That adds extra rollback complexity without much benefit for a single-owner admin interface.

## Risks / Trade-offs

- Migration default mismatch -> Define database defaults and service-level defaults so missing settings resolve to both sections hidden.
- Privacy leakage through public APIs -> Enforce visibility and publication filtering server-side before returning records.
- Confusing hidden sections -> Put visibility toggles at the top of the admin page with explicit helper text that hidden sections are not deleted.
- Too much admin page density -> Use grouped settings, education, and certifications sections with compact desktop layout and stacked mobile layout.
- Test matrix growth -> Cover core combinations at API level, representative UI states in web tests, and one focused Playwright journey for admin toggles plus homepage visibility.

## Migration Plan

1. Add Prisma models and migration for `PortfolioSettings`, education, and certifications.
2. Generate Prisma client and keep settings defaulted to hidden for existing databases.
3. Add protected management APIs and public retrieval APIs.
4. Add API client/shared types and web query/mutation hooks.
5. Add credentials admin route/navigation and homepage rendering.
6. Add API, web, and Playwright tests, then run the normal commit checks and focused E2E.

Rollback: remove the public homepage credential rendering, remove credentials routes from admin navigation, stop serving the new APIs, and roll back the database migration if no production data must be preserved.
