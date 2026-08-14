## 1. API Contracts

- [x] 1.1 Define create and update project DTOs with validation for required trimmed text fields, lowercase kebab-case slugs, URLs, optional boolean publication state, nullable optional fields, and non-empty trimmed tech stack entries
- [x] 1.2 Enable request DTO validation in the API bootstrap if it is not already active
- [x] 1.3 Define a consistent response shape for project records returned by management and public endpoints
- [x] 1.4 Reject empty update payloads before attempting persistence

## 2. Project Service Behavior

- [x] 2.1 Implement project creation using the existing Prisma `Project` model with `isPublic` defaulting to false when omitted
- [x] 2.2 Implement managed project listing and managed project lookup by id or slug
- [x] 2.3 Implement project updates for editable fields with duplicate slug conflict handling
- [x] 2.4 Implement clearing nullable optional fields when update requests provide explicit `null`
- [x] 2.5 Implement project deletion and not found handling
- [x] 2.6 Implement public project listing and public slug lookup with `isPublic` filtering centralized in service methods
- [x] 2.7 Translate Prisma `P2002` slug uniqueness errors to HTTP 409 conflicts

## 3. Project Routes

- [x] 3.1 Add management routes: `POST /projects`, `GET /projects`, `GET /projects/:idOrSlug`, `PATCH /projects/:id`, and `DELETE /projects/:id`
- [x] 3.2 Add public routes: `GET /public/projects` and `GET /public/projects/:slug`
- [x] 3.3 Map validation, duplicate slug, and missing project failures to appropriate HTTP errors
- [x] 3.4 Ensure deployment documentation or configuration notes state management routes must not be publicly deployed before authentication

## 4. Verification

- [x] 4.1 Add tests for creating, listing, reading, updating, and deleting managed projects
- [x] 4.2 Add tests for `isPublic` defaulting to false when omitted on creation
- [x] 4.3 Add tests for missing required fields, whitespace-only required text, non-kebab-case slugs, invalid URLs, invalid tech stack entries, and empty update payloads
- [x] 4.4 Add tests for duplicate slug conflicts, including Prisma `P2002` mapping to HTTP 409
- [x] 4.5 Add tests for clearing nullable optional fields with explicit `null`
- [x] 4.6 Add tests proving unpublished projects are hidden from public list and public detail retrieval
- [x] 4.7 Run the API test suite
- [x] 4.8 Run the API build
