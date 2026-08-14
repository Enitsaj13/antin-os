## Context

See `proposal.md` for motivation. The repo currently has a NestJS API app with Prisma/PostgreSQL and no frontend app. The existing portfolio-projects capability keeps management and public retrieval separate, and this change should follow that pattern. Authentication is explicitly out of scope, so management routes must remain local/private until an auth capability exists.

## Goals / Non-Goals

**Goals:**

- Add a singleton `Profile` persistence model and API behavior for managed and public owner profile retrieval.
- Add profile-picture upload, validation, normalization, private S3 storage, URL generation, replacement cleanup, and removal behavior.
- Keep storage behavior behind an interface so profile logic can be tested without AWS.
- Add configuration validation and `.env.example` placeholders for required AWS/S3 settings without committing credentials.
- Add the minimum admin frontend needed to edit profile fields and perform square profile-picture cropping before upload.
- Add automated coverage for API behavior, storage failure paths, image validation, and frontend crop behavior.

**Non-Goals:**

- Authentication, authorization, users, or role management.
- Multiple owner profiles.
- Public profile page design beyond retrieval support.
- Image galleries or storing original images.
- Filters, rotation, drawing, text overlays, color correction, or general image editing.

## Decisions

### Add a singleton Profile model

Add a Prisma `Profile` model with profile text fields, `email`, optional `githubUrl`, optional `linkedinUrl`, optional `profilePictureKey`, timestamps, and a singleton guard. Use a fixed singleton key or unique boolean/key column so all writes target one logical owner profile.

Rationale: A database-level uniqueness guard is the strongest way to prevent multiple owner profiles, while the API can still expose simple `GET /profile` and `PUT /profile` routes.

Alternative considered: Store profile configuration in environment variables or a JSON file. This was rejected because profile updates and picture replacement need transactional database behavior.

### Use exact API routes

Management routes:

- `GET /profile`
- `PUT /profile`
- `POST /profile/picture`
- `DELETE /profile/picture`

Public route:

- `GET /public/profile`

Rationale: This keeps public profile retrieval separate from management behavior and mirrors the existing portfolio-project route separation.

Alternative considered: Nest public and management routes under a single `/profile` controller namespace. This was rejected because unauthenticated public retrieval should be visibly distinct from management operations.

### Validate at the API boundary and with image inspection

Use DTO validation for required trimmed text, email, and optional URLs. Use multipart upload handling with a 5 MB limit, then inspect actual image content and dimensions before accepting it. Normalize valid square uploads to 512x512 before storage.

Rationale: The API must not trust filenames or MIME headers, and normalization keeps responses and downstream display behavior consistent.

Alternative considered: Trust the browser cropper output. This was rejected because clients can bypass the UI and call the upload endpoint directly.

### Store private S3 objects through a storage abstraction

Define a profile-picture storage interface with upload, delete, and URL-generation operations. Implement it with AWS S3 in production and mock it in tests. Store only `profilePictureKey` in PostgreSQL. Generate unique object keys using an internal prefix plus random id or UUID, not the uploaded filename.

Rationale: Profile behavior should be testable without real AWS, and the database should not store binary or base64 image data.

Alternative considered: Store images in PostgreSQL as bytea/base64. This was rejected because it increases database size and couples binary storage to profile records.

### Use presigned or otherwise secure URL generation

Generate usable profile-picture URLs server-side without exposing AWS credentials. Prefer short-lived presigned S3 GET URLs for a private bucket unless deployment provides an equivalent secure public delivery configuration.

Rationale: A private bucket plus server-side URL generation satisfies public profile display without making the bucket public.

Alternative considered: Public S3 object URLs. This was rejected because the bucket must remain private.

### Use safe replacement sequencing

For replacement: upload the new normalized image first, update the profile record second, delete the previous object after the database update succeeds, and clean up the new object if the database update fails. If deleting the previous object fails after a successful replacement, keep the new profile picture and report or log the cleanup failure.

Rationale: The current picture should remain valid unless the new picture is fully saved.

Alternative considered: Delete the old picture before uploading the new one. This was rejected because it can leave the profile without a picture after partial failure.

### Add a minimal React/Vite admin app

Because no frontend exists, add a minimal TypeScript React app under `apps/web` with an admin profile view. Use a focused cropper component that renders a 1:1 crop area, supports drag repositioning and slider zoom, previews the visible crop, and exports a 512x512 JPEG/PNG/WebP-compatible blob for upload.

Rationale: React/Vite is a small frontend footprint and fits the monorepo without imposing a full application framework.

Alternative considered: Build the crop interface as static HTML in the API app. This was rejected because the UI needs component-level tests and enough interaction state to justify a frontend app boundary.

## Risks / Trade-offs

- Management routes lack authentication -> Keep management deployment local/private and document that these routes must not be public until authentication exists.
- Image processing can be CPU and memory intensive -> Enforce 5 MB upload limit before decode and normalize only accepted image types.
- S3 operations and database updates are not one transaction -> Use explicit compensating cleanup for replacement and removal failure paths.
- Presigned URLs expire -> Generate URLs per profile response and keep clients tolerant of refresh.
- Adding a frontend app expands repo tooling -> Keep the app minimal, isolate frontend dependencies, and add only tests needed for crop behavior.
- Browser crop behavior can diverge from server validation -> Server still validates content, square aspect ratio, format, and normalized storage.

## Migration Plan

1. Add profile database migration and regenerate Prisma client.
2. Add API configuration validation and `.env.example` placeholders for `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and secure URL-generation configuration such as a presigned URL TTL.
3. Implement profile DTOs, response mapping, service, controller routes, multipart handling, image validation/normalization, and storage abstraction.
4. Implement S3 storage adapter and tests using a mocked storage implementation.
5. Add the minimal `apps/web` admin profile UI and crop tests.
6. Run API tests, frontend tests, OpenSpec validation, and production builds.
7. Roll back by reverting the API/profile migration and frontend app changes; manually clean up any test S3 objects created outside automated mocks.
